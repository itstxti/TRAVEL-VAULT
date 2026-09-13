import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Destination, Status, Photo } from './types';
import { load, save, hydrate } from './storage';
import { migrateIfNeeded, MigrationStatus } from './migrate';
import { pushDestination, pushDeleteDestination, pushDeletePhoto, PushStatus } from './sync';
import { pullChanges } from './pull';
import { supabase } from './supabaseClient';
import { useSession } from './components/AuthGate';
import { debounce } from './utils';
import List from './components/List';
import MapView from './components/MapView';
import StatsView from './components/StatsView';
import DestinationModal from './components/DestinationModal';
import GalleryModal from './components/GalleryModal';
import JournalModal from './components/JournalModal';
import Lightbox from './components/Lightbox';
import { IconLogOut, IconSpinner } from './icons';

const statusLabels: Record<Status, string> = { want_to_go: 'Want to go', planned: 'Planned', visited: 'Visited' };

export default function App() {
  // Starts empty: we can't pick the right localStorage key until we know
  // which account is signed in (see the loading effect further down).
  const [dest, setDest] = useState<Destination[]>([]);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'list' | 'map' | 'stats'>('list');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ p: Photo[]; i: number } | null>(null);

  const [migration, setMigration] = useState<MigrationStatus>('idle');
  const { session } = useSession();
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle');
  const destRef = useRef(dest);
  useEffect(() => { destRef.current = dest; }, [dest]);
  const userIdRef = useRef<string | undefined>(undefined);
  useEffect(() => { userIdRef.current = session?.user.id; }, [session]);
  const dirtyIds = useRef<Set<string>>(new Set());
  const deletedIds = useRef<Set<string>>(new Set());

  const flushPush = useRef(
    debounce(async () => {
      const userId = userIdRef.current;
      if (!userId) return;
      const idsToPush = [...dirtyIds.current];
      dirtyIds.current.clear();
      const idsToDelete = [...deletedIds.current];
      deletedIds.current.clear();
      setPushStatus('pushing');
      try {
        for (const id of idsToDelete) await pushDeleteDestination(id);
        for (const id of idsToPush) {
          const d = destRef.current.find(x => x.id === id);
          if (d) await pushDestination(d, userId);
        }
        setPushStatus('synced');
      } catch (e) {
        console.error('Could not sync with Supabase, will retry on the next change', e);
        idsToPush.forEach(id => dirtyIds.current.add(id));
        setPushStatus('error');
      }
    }, 900)
  ).current;

  // Loads THIS account's local vault as soon as we know who signed in.
  // Each account has its own localStorage key (see storage.ts), so two
  // accounts in the same browser no longer share destinations.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setReady(false);
    hydrate(load(userId))
      .then(h => { if (!cancelled) { setDest(h); setReady(true); } })
      .catch(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [userId]);
  useEffect(() => { if (ready && userId) save(userId, dest); }, [dest, ready, userId]);
  // Uploads the local vault to Supabase the first time there's a session
  // with nothing yet on the server (phase 2: upload only, no merge).
  useEffect(() => { if (ready) migrateIfNeeded(dest, setMigration); }, [ready]);

  const pulling = useRef(false);
  const runPull = async () => {
    const userId = userIdRef.current;
    if (!userId || pulling.current) return;
    pulling.current = true;
    try {
      const { destinations, dirtyIds: mergeDirty } = await pullChanges(userId, destRef.current, dirtyIds.current, deletedIds.current);
      setDest(destinations);
      if (mergeDirty.length) {
        mergeDirty.forEach(id => dirtyIds.current.add(id));
        flushPush();
      }
    } catch (e) {
      console.error('No se pudieron traer cambios remotos', e);
    } finally {
      pulling.current = false;
    }
  };

  useEffect(() => {
    if (!ready || !session) return;
    runPull();
    const interval = setInterval(runPull, 45000);
    const onOnline = () => runPull();
    const onVisible = () => { if (document.visibilityState === 'visible') runPull(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session]);

  // New photos arriving from another device are downloaded in the
  // background (see pull.ts); this refreshes the dataUrl as soon as it's
  // done, without going through update() (no need to re-upload what we
  // just downloaded).
  useEffect(() => {
    const handler = (e: Event) => {
      const { photoId, dataUrl } = (e as CustomEvent).detail;
      setDest(x => x.map(d => ({ ...d, photos: d.photos.map(p => (p.id === photoId ? { ...p, dataUrl } : p)) })));
    };
    window.addEventListener('travel-vault-photo-ready', handler);
    return () => window.removeEventListener('travel-vault-photo-ready', handler);
  }, []);

  const list = useMemo(() => (filter === 'all' ? dest : dest.filter(d => d.status === filter)), [dest, filter]);

  const update = (d: Destination) => {
    setDest(x => {
      const prev = x.find(v => v.id === d.id);
      if (prev) {
        const removedPhotoIds = prev.photos.filter(p => !d.photos.some(np => np.id === p.id)).map(p => p.id);
        removedPhotoIds.forEach(id => pushDeletePhoto(id).catch(e => console.error('No se pudo borrar la foto en Supabase', e)));
      }
      return x.map(v => (v.id === d.id ? d : v));
    });
    dirtyIds.current.add(d.id);
    flushPush();
  };
  const remove = (d: Destination) => {
    if (!confirm(`Delete "${d.name}"? This can't be undone.`)) return;
    setDest(x => x.filter(v => v.id !== d.id));
    dirtyIds.current.delete(d.id);
    deletedIds.current.add(d.id);
    flushPush();
  };

  const importRef = useRef<HTMLInputElement>(null);


  // Gallery/notes are looked up by id from `dest` on every render, so the
  // modals always reflect the latest state (no stale copies).
  const gallery = useMemo(() => dest.find(d => d.id === galleryId) ?? null, [dest, galleryId]);
  const notes = useMemo(() => dest.find(d => d.id === notesId) ?? null, [dest, notesId]);

  return (
    <>
      <div className="airmail-strip" />
      <header className="hero">
        <div>
          <p className="brand-eyebrow">Personal travel log</p>
          <h1 className="brand-title">Travel <em>Vault</em></h1>
          <p className="brand-sub">
            Keep track of where you want to go,
            what you've planned, and where you've already been.
          </p>
        </div>
        <div className="header-actions">
          <div className="icon-toolbar">
            <button
              className="icon-btn"
              aria-label="Sign out"
              data-tooltip="Sign out"
              onClick={() => supabase.auth.signOut()}
            >
              <IconLogOut size={16} />
            </button>
          </div>
          <div className="backup-row">
            {migration === 'running' && <span className="sync-status">Uploading your vault to the cloud…</span>}
            {migration === 'done' && <span className="sync-status">Initial cloud copy ✓</span>}
            {migration === 'error' && (
              <span className="sync-status sync-status-error">
                Could not upload to the cloud.{' '}
                <button className="mini-btn" onClick={() => migrateIfNeeded(dest, setMigration)}>Retry</button>
              </span>
            )}
            {pushStatus === 'pushing' && <span className="sync-status">Syncing…</span>}
            {pushStatus === 'error' && <span className="sync-status sync-status-error">Changes pending upload</span>}
          </div>
        </div>
      </header>

      <div className="tabs-toolbar">
        <nav className="tabs">
          {(['list', 'map', 'stats'] as const).map(t => (
            <button
              key={t}
              className={'tab-btn ' + (tab === t ? 'active' : '')}
              onClick={() => setTab(t)}
            >
              {t === 'list' ? 'List' : t === 'map' ? 'Map' : 'Stats'}
            </button>
          ))}
        </nav>

        {tab !== 'stats' && (
          <div className="filter-row">
            {(['all', 'want_to_go', 'planned', 'visited'] as const).map(f => (
              <button
                key={f}
                className={'filter-chip ' + (filter === f ? 'active' : '')}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : statusLabels[f]}
              </button>
            ))}
          </div>
        )}
      </div>

      <main>
        {tab === 'list' && (
          <List list={list} update={update} remove={remove} openEdit={d => { setEditing(d); setModal(true); }} openGallery={d => setGalleryId(d.id)} openNotes={d => setNotesId(d.id)} />
        )}
        {tab === 'map' && <MapView list={list} />}
        {tab === 'stats' && <StatsView dest={dest} />}
      </main>

      <button className="fab" aria-label="Add destination" onClick={() => { setEditing(null); setModal(true); }}>+</button>

      {modal && (
        <DestinationModal
          value={editing}
          close={() => setModal(false)}
          onSave={d => {
            if (editing) update(d);
            else { setDest(x => [...x, d]); dirtyIds.current.add(d.id); flushPush(); }
            setModal(false);
          }}
        />
      )}
      {gallery && <GalleryModal dest={gallery} close={() => setGalleryId(null)} update={update} openLightbox={(p, i) => setLightbox({ p, i })} />}
      {notes && <JournalModal dest={notes} close={() => setNotesId(null)} update={update} />}
      {lightbox && <Lightbox state={lightbox} close={() => setLightbox(null)} set={setLightbox} />}
    </>
  );
}
