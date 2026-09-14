import React, { useState } from 'react';
import { Destination, JournalEntry } from '../types';
import { id, formatDate } from '../utils';
import { IconTrash, IconClose, IconNotebook } from '../icons';

// Keep entries reasonable in size — matches the check constraint added in
// supabase/migrations/0002_hardening.sql, so the client fails fast instead
// of round-tripping to the server just to be rejected there.
const MAX_ENTRY_LENGTH = 5000;

export default function JournalModal({
  dest, close, update,
}: {
  dest: Destination; close: () => void; update: (d: Destination) => void;
}) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const add = () => {
    const trimmed = text.trim().slice(0, MAX_ENTRY_LENGTH);
    if (!trimmed) return;
    const entry: JournalEntry = { id: id(), date, text: trimmed };
    update({ ...dest, journal: [...dest.journal, entry] });
    setText('');
  };

  return (
    <div className="overlay active" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Travel notes · {dest.name}</h2>
          <button className="modal-close" aria-label="Close" onClick={close}><IconClose size={18} /></button>
        </div>
        <div className="modal-body">
          {dest.journal.length === 0 ? (
            <div className="empty-inline">
              <IconNotebook size={26} className="empty-inline-icon" />
              <p>No notes yet for {dest.name}.</p>
            </div>
          ) : (
            dest.journal.map(entry => (
              <div className="journal-entry" key={entry.id}>
                <div className="journal-entry-head">
                  <span className="journal-date">{formatDate(entry.date)}</span>
                  <button
                    className="journal-del-btn"
                    aria-label="Delete note"
                    title="Delete note"
                    onClick={() => update({ ...dest, journal: dest.journal.filter(x => x.id !== entry.id) })}
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
                <div className="journal-text">{entry.text}</div>
              </div>
            ))
          )}

          <div className="new-entry-box">
            <div className="new-entry-row">
              <label style={{ fontSize: '16px' }}>Add entry</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <textarea
              value={text}
              maxLength={MAX_ENTRY_LENGTH}
              onChange={e => setText(e.target.value)}
              placeholder="What do you remember about this place?"
            />
            <p className="hint" style={{ textAlign: 'right' }}>{text.length}/{MAX_ENTRY_LENGTH}</p>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={add} disabled={!text.trim()}>Add note</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
