import React, { useState } from 'react';
import { Destination, Photo } from '../types';
import { id } from '../utils';
import { putPhoto, deletePhoto } from '../storage';
import { IconUpload, IconClose, IconCamera } from '../icons';

// Client-side guardrails on uploads. These are UX/abuse-prevention only —
// the real security boundary is Supabase Storage (bucket file-size limit +
// allowed MIME types) and RLS, which enforce the same rules server-side
// regardless of what this code does. See supabase/migrations/0002_hardening.sql.
const MAX_PHOTO_BYTES = 16 * 1024 * 1024; // 16 MB per photo
const MAX_PHOTOS_PER_DESTINATION = 120;
const ALLOWED_MIME_PREFIXES = ['image/'];
const MAX_CAPTION_LENGTH = 140;

function isAllowedImage(file: File): boolean {
  return ALLOWED_MIME_PREFIXES.some(p => file.type.startsWith(p)) && file.size > 0 && file.size <= MAX_PHOTO_BYTES;
}

export default function GalleryModal({
  dest, close, update, openLightbox,
}: {
  dest: Destination; close: () => void; update: (d: Destination) => void; openLightbox: (p: Photo[], i: number) => void;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const add = (files: FileList | null) => {
    if (!files) return;
    setUploadError(null);

    const remainingSlots = Math.max(0, MAX_PHOTOS_PER_DESTINATION - dest.photos.length);
    const incoming = [...files];
    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const f of incoming) {
      if (accepted.length >= remainingSlots) { rejected.push(f.name); continue; }
      if (!isAllowedImage(f)) { rejected.push(f.name); continue; }
      accepted.push(f);
    }

    if (rejected.length > 0) {
      setUploadError(
        `Skipped ${rejected.length} file${rejected.length !== 1 ? 's' : ''}: only images up to ` +
        `${Math.round(MAX_PHOTO_BYTES / (1024 * 1024))}MB are allowed, and each destination can hold up to ` +
        `${MAX_PHOTOS_PER_DESTINATION} photos.`
      );
    }
    if (accepted.length === 0) return;

    Promise.all(
      accepted.map(f => new Promise<Photo>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res({ id: id(), dataUrl: String(r.result), caption: f.name.slice(0, MAX_CAPTION_LENGTH) });
        r.onerror = () => rej(r.error);
        r.readAsDataURL(f);
      }))
    ).then(photos => {
      photos.forEach(putPhoto);
      update({ ...dest, photos: [...dest.photos, ...photos] });
    }).catch(() => setUploadError('Could not read one of the selected files. Please try again.'));
  };

  return (
    <div className="overlay active" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2>Photos · {dest.name}</h2>
          <button className="modal-close" aria-label="Close" onClick={close}><IconClose size={18} /></button>
        </div>
        <div className="modal-body">
          <label className="upload-zone">
            <div className="upload-icon-badge"><IconUpload /></div>
            <div className="upload-text">Click to upload photos</div>
            <div className="upload-subtext">or drag your images here</div>
            <input type="file" accept="image/*" multiple hidden onChange={e => { add(e.target.files); e.target.value = ''; }} />
          </label>
          {uploadError && <p className="auth-error">{uploadError}</p>}

          {dest.photos.length === 0 ? (
            <div className="empty-inline">
              <IconCamera size={26} className="empty-inline-icon" />
              <p>No photos yet for {dest.name}.</p>
            </div>
          ) : (
            <>
              <p className="gallery-count">{dest.photos.length} photo{dest.photos.length !== 1 ? 's' : ''}</p>
              <div className="gallery-grid">
                {dest.photos.map((p, i) => (
                  <div className="gallery-item" key={p.id}>
                    <div className="thumb-wrap">
                      <img src={p.dataUrl} onClick={() => openLightbox(dest.photos, i)} alt={p.caption || dest.name} />
                      <button
                        className="del-photo"
                        aria-label="Delete photo"
                        onClick={() => { deletePhoto(p.id); update({ ...dest, photos: dest.photos.filter(x => x.id !== p.id) }); }}
                      >
                        <IconClose size={12} />
                      </button>
                    </div>
                    <input
                      className="caption-input"
                      value={p.caption}
                      placeholder="Add a caption…"
                      maxLength={MAX_CAPTION_LENGTH}
                      onChange={e => update({ ...dest, photos: dest.photos.map(x => x.id === p.id ? { ...x, caption: e.target.value.slice(0, MAX_CAPTION_LENGTH) } : x) })}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
