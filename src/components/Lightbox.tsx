import React from 'react';
import { Photo } from '../types';
import { IconClose } from '../icons';

export default function Lightbox({
  state, close, set,
}: {
  state: { p: Photo[]; i: number };
  close: () => void;
  set: React.Dispatch<React.SetStateAction<{ p: Photo[]; i: number } | null>>;
}) {
  const move = (n: number) => set(x => x ? { ...x, i: (x.i + n + x.p.length) % x.p.length } : x);
  const photo = state.p[state.i];
  return (
    <div className="lightbox active">
      <span className="lightbox-counter">{state.i + 1} / {state.p.length}</span>
      <button className="lightbox-close" aria-label="Close" onClick={close}><IconClose size={22} /></button>
      {state.p.length > 1 && (
        <button className="lightbox-nav" id="lightbox-prev" aria-label="Previous photo" onClick={() => move(-1)}>&lsaquo;</button>
      )}
      <div className="lightbox-inner">
        <img src={photo.dataUrl} alt={photo.caption} />
        {photo.caption && <div className="lightbox-caption">{photo.caption}</div>}
      </div>
      {state.p.length > 1 && (
        <button className="lightbox-nav" id="lightbox-next" aria-label="Next photo" onClick={() => move(1)}>&rsaquo;</button>
      )}
    </div>
  );
}
