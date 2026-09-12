import React from 'react';
import { Destination, Photo } from '../types';
import { id } from '../utils';
import { putPhoto, deletePhoto } from '../storage';
import { IconUpload, IconClose, IconCamera } from '../icons';

export default function GalleryModal({
  dest, close, update, openLightbox,
}: {
  dest: Destination; close: () => void; update: (d: Destination) => void; openLightbox: (p: Photo[], i: number) => void;
}) {
  const add = (files: FileList | null) => {
    if (!files) return;
    Promise.all(
      [...files].map(f => new Promise<Photo>(res => {
        const r = new FileReader();
        r.onload = () => res({ id: id(), dataUrl: String(r.result), caption: f.name });
        r.readAsDataURL(f);
      }))
    ).then(photos => {
      photos.forEach(putPhoto);
      update({ ...dest, photos: [...dest.photos, ...photos] });
    });
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
            <input type="file" accept="image/*" multiple hidden onChange={e => add(e.target.files)} />
          </label>

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
                      onChange={e => update({ ...dest, photos: dest.photos.map(x => x.id === p.id ? { ...x, caption: e.target.value } : x) })}
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
