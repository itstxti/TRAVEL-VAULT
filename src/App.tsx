import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Destination, Status, Photo } from './types';
import { load, save, hydrate } from './storage';
import { exportData, importData } from './backup';
import { migrateIfNeeded, MigrationStatus } from './migrate';
import { pushDestination, pushDeleteDestination, pushDeletePhoto, PushStatus } from './sync';
import { pullChanges } from './pull';
import { supabase } from './supabaseClient';
import { useSession } from './components/AuthGate';
import { debounce } from './utils';
import List from './components/List';
import MapView from './components/MapView';
import DestinationModal from './components/DestinationModal';
import GalleryModal from './components/GalleryModal';
import JournalModal from './components/JournalModal';
import Lightbox from './components/Lightbox';

const statusLabels: Record<Status, string> = { want_to_go: 'Want to go', planned: 'Planned', visited: 'Visited' };

export default function App() {
  const [dest, setDest] = useState<Destination[]>(load);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'list' | 'map'>('list');
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
        console.error('No se pudo sincronizar con Supabase, se reintentará en el próximo cambio', e);
        idsToPush.forEach(id => dirtyIds.current.add(id));
        setPushStatus('error');
      }
    }, 900)
  ).current;

  useEffect(() => { hydrate(dest).then(h => { setDest(h); setReady(true); }).catch(() => setReady(true)); }, []);
  useEffect(() => { if (ready) save(dest); }, [dest, ready]);
  // Sube el vault local a Supabase la primera vez que hay sesión y datos
  // locales sin nada aún en el servidor (fase 2: solo subida, sin merge).
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

  // Las fotos nuevas llegadas de otro dispositivo se descargan en segundo
  // plano (ver pull.ts); esto refresca el dataUrl en cuanto termina, sin
  // pasar por update() (no hace falta volver a subir lo que acabamos de bajar).
  useEffect(() => {
    const handler = (e: Event) => {
      const { photoId, dataUrl } = (e as CustomEvent).detail;
      setDest(x => x.map(d => ({ ...d, photos: d.photos.map(p => (p.id === photoId ? { ...p, dataUrl } : p)) })));
    };
    window.addEventListener('travel-vault-photo-ready', handler);
    return () => window.removeEventListener('travel-vault-photo-ready', handler);
  }, []);

  const list = useMemo(() => (filter === 'all' ? dest : dest.filter(d => d.status === filter)), [dest, filter]);
  const stats = {
    total: dest.length,
    visited: dest.filter(d => d.status === 'visited').length,
    planned: dest.filter(d => d.status === 'planned').length,
    countries: new Set(dest.filter(d => d.status === 'visited').map(d => d.country)).size,
  };

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
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const handleExport = async () => {
    setBusy('export');
    try {
      const blob = await exportData(dest);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travel-vault-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('No se pudo exportar el backup.');
    } finally {
      setBusy(null);
    }
  };

  const handleImportFile = async (file: File) => {
    if (!confirm('Esto combinará el backup con tus datos actuales (los destinos con el mismo id se sobrescriben). ¿Continuar?')) return;
    setBusy('import');
    try {
      const imported = await importData(file);
      setDest(current => {
        const byId = new Map(current.map(d => [d.id, d]));
        imported.forEach(d => byId.set(d.id, d));
        return [...byId.values()];
      });
    } catch (e) {
      console.error('Import failed', e);
      alert('No se pudo leer el backup. ¿Es un .zip exportado desde Travel Vault?');
    } finally {
      setBusy(null);
    }
  };

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
          <div className="stats-row">
            {([
              ['Destinations', stats.total],
              ['Visited', stats.visited],
              ['Planned', stats.planned],
              ['Countries', stats.countries],
            ] as const).map(([l, n]) => (
              <div className="stat-chip" key={l}><b>{n}</b><span>{l}</span></div>
            ))}
          </div>
          <div className="backup-row">
            <button className="mini-btn" disabled={busy !== null} onClick={handleExport}>
              {busy === 'export' ? 'Exportando…' : 'Exportar backup'}
            </button>
            <button className="mini-btn" disabled={busy !== null} onClick={() => importRef.current?.click()}>
              {busy === 'import' ? 'Importando…' : 'Importar backup'}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".zip"
              hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ''; }}
            />
            <button className="mini-btn" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
            {migration === 'running' && <span className="sync-status">Subiendo tu vault a la nube…</span>}
            {migration === 'done' && <span className="sync-status">Copia inicial en la nube ✓</span>}
            {migration === 'error' && (
              <span className="sync-status sync-status-error">
                No se pudo subir a la nube.{' '}
                <button className="mini-btn" onClick={() => migrateIfNeeded(dest, setMigration)}>Reintentar</button>
              </span>
            )}
            {pushStatus === 'pushing' && <span className="sync-status">Sincronizando…</span>}
            {pushStatus === 'error' && <span className="sync-status sync-status-error">Cambios pendientes de subir</span>}
          </div>
        </div>
      </header>

      <nav className="tabs">
        {(['list', 'map'] as const).map(t => (
          <button key={t} className={'tab-btn ' + (tab === t ? 'active' : '')} onClick={() => setTab(t)}>
            {t === 'list' ? 'List' : 'Map'}
          </button>
        ))}
      </nav>

      <div className="filter-row">
        {(['all', 'want_to_go', 'planned', 'visited'] as const).map(f => (
          <button key={f} className={'filter-chip ' + (filter === f ? 'active' : '')} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : statusLabels[f]}
          </button>
        ))}
      </div>

      <main>
        {tab === 'list'
          ? <List list={list} update={update} remove={remove} openEdit={d => { setEditing(d); setModal(true); }} openGallery={d => setGalleryId(d.id)} openNotes={d => setNotesId(d.id)} />
          : <MapView list={list} />}
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
