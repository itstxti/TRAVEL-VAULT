import React, { useEffect, useMemo, useState } from 'react';
import { Destination, Status, Photo } from './types';
import { load, save, hydrate } from './storage';
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

  useEffect(() => { hydrate(dest).then(h => { setDest(h); setReady(true); }).catch(() => setReady(true)); }, []);
  useEffect(() => { if (ready) save(dest); }, [dest, ready]);

  const list = useMemo(() => (filter === 'all' ? dest : dest.filter(d => d.status === filter)), [dest, filter]);
  const stats = {
    total: dest.length,
    visited: dest.filter(d => d.status === 'visited').length,
    planned: dest.filter(d => d.status === 'planned').length,
    countries: new Set(dest.filter(d => d.status === 'visited').map(d => d.country)).size,
  };

  const update = (d: Destination) => setDest(x => x.map(v => (v.id === d.id ? d : v)));
  const remove = (d: Destination) => { if (confirm(`Delete "${d.name}"? This can't be undone.`)) setDest(x => x.filter(v => v.id !== d.id)); };

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
          onSave={d => { editing ? update(d) : setDest(x => [...x, d]); setModal(false); }}
        />
      )}
      {gallery && <GalleryModal dest={gallery} close={() => setGalleryId(null)} update={update} openLightbox={(p, i) => setLightbox({ p, i })} />}
      {notes && <JournalModal dest={notes} close={() => setNotesId(null)} update={update} />}
      {lightbox && <Lightbox state={lightbox} close={() => setLightbox(null)} set={setLightbox} />}
    </>
  );
}
