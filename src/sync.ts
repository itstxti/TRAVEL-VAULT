import { supabase } from './supabaseClient';
import { Destination } from './types';

const SYNCED_PHOTOS_KEY_PREFIX = 'travel-vault-synced-photo-ids';

// También por cuenta: si no, subir una foto con la cuenta 1 hace que la
// cuenta 2 la crea "ya subida" y nunca la sube a su propio storage.
function getSyncedPhotoIds(userId: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(`${SYNCED_PHOTOS_KEY_PREFIX}:${userId}`) || '[]'));
  } catch {
    return new Set();
  }
}
function markPhotoSynced(userId: string, id: string) {
  const s = getSyncedPhotoIds(userId);
  s.add(id);
  localStorage.setItem(`${SYNCED_PHOTOS_KEY_PREFIX}:${userId}`, JSON.stringify([...s]));
}

const extFromMime = (mime: string) => (mime.split('/')[1] || 'jpg').split('+')[0];

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export type PushStatus = 'idle' | 'pushing' | 'synced' | 'error';

// Sube UN destino (y sus notas y fotos) a Supabase. Solo sube el binario de
// una foto si no está ya marcada como subida — igual que se arregló en local,
// no queremos volver a subir megabytes de foto sin cambios cada vez que se
// edita otra cosa del mismo destino.
export async function pushDestination(d: Destination, userId: string): Promise<void> {
  const { error: destErr } = await supabase.from('destinations').upsert({
    id: d.id,
    user_id: userId,
    name: d.name,
    country: d.country || null,
    type: d.type,
    status: d.status,
    companions: d.companions,
    trip_start: d.tripStart || null,
    trip_end: d.tripEnd || null,
    lat: d.lat,
    lng: d.lng,
    deleted_at: null,
  });
  if (destErr) throw destErr;

  for (const j of d.journal) {
    const { error } = await supabase.from('journal_entries').upsert({
      id: j.id,
      destination_id: d.id,
      user_id: userId,
      entry_date: j.date,
      text: j.text,
      deleted_at: null,
    });
    if (error) throw error;
  }

  const synced = getSyncedPhotoIds(userId);
  for (const p of d.photos) {
    const match = /^data:(.+);base64,(.*)$/.exec(p.dataUrl || '');
    if (!match) continue; // sin datos en memoria todavía; se subirá en el próximo push
    const [, mime, base64] = match;
    const path = `${userId}/${p.id}.${extFromMime(mime)}`;

    if (!synced.has(p.id)) {
      const { error: upErr } = await supabase.storage
        .from('photos')
        .upload(path, base64ToBytes(base64), { contentType: mime, upsert: true });
      if (upErr) throw upErr;
      markPhotoSynced(userId, p.id);
    }

    // El caption puede cambiar aunque el binario ya esté subido, así que la
    // fila se actualiza siempre; lo caro (el binario) es lo que se salta.
    const { error: pErr } = await supabase.from('photos').upsert({
      id: p.id,
      destination_id: d.id,
      user_id: userId,
      storage_path: path,
      caption: p.caption,
      deleted_at: null,
    });
    if (pErr) throw pErr;
  }
}

export async function pushDeleteDestination(id: string): Promise<void> {
  const { error } = await supabase.from('destinations').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function pushDeletePhoto(photoId: string): Promise<void> {
  const { error } = await supabase.from('photos').update({ deleted_at: new Date().toISOString() }).eq('id', photoId);
  if (error) throw error;
}
