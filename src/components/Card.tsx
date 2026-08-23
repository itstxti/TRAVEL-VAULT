import React from 'react';
import { Destination, Status } from '../types';
import { formatDate, tripDays } from '../utils';
import { IconCalendar, IconCamera, IconNotebook } from '../icons';

const statusLabels: Record<Status, string> = { want_to_go: 'Want to go', planned: 'Planned', visited: 'Visited' };

export default function Card({
  d, update, remove, openEdit, openGallery, openNotes,
}: {
  d: Destination;
  update: (d: Destination) => void;
  remove: (d: Destination) => void;
  openEdit: (d: Destination) => void;
  openGallery: (d: Destination) => void;
  openNotes: (d: Destination) => void;
}) {
  const noteCount = d.journal.length;
  return (
    <div className="postcard">
      <div className="postcard-top">
        <div>
          <p className="dest-name">{d.name}</p>
          <span className="dest-type-tag">{d.type === 'city' ? 'City' : 'Whole country'}</span>
        </div>
        <span className={'stamp status-' + d.status}>{statusLabels[d.status]}</span>
      </div>

      {d.companions.length > 0 && (
        <div className="companions-line"><b>With:</b> {d.companions.join(', ')}</div>
      )}

      {d.tripStart && (
        <div className="dates-line">
          <IconCalendar />
          {formatDate(d.tripStart)} – {formatDate(d.tripEnd)} · {tripDays(d.tripStart, d.tripEnd)} days
        </div>
      )}

      {noteCount > 0 && <div className="notes-preview">&ldquo;{d.journal[noteCount - 1].text}&rdquo;</div>}

      <div className="card-actions">
        <select
          className="status-select"
          value={d.status}
          onChange={e => update({ ...d, status: e.target.value as Status })}
        >
          {Object.entries(statusLabels).map(([v, l]) => <option value={v} key={v}>{l}</option>)}
        </select>
        {d.type === 'city' && (
          <button className="mini-btn" onClick={() => openGallery(d)}>
            <IconCamera /> Photos {d.photos.length ? `(${d.photos.length})` : ''}
          </button>
        )}
        <button className="mini-btn" onClick={() => openNotes(d)}>
          <IconNotebook /> Notes {noteCount ? `(${noteCount})` : ''}
        </button>
        <button className="mini-btn primary" onClick={() => openEdit(d)}>Edit</button>
        <button className="mini-btn danger" onClick={() => remove(d)}>Delete</button>
      </div>
    </div>
  );
}
