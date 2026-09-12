import { supabase } from './supabaseClient';
import { Destination } from './types';

const SYNCED_PHOTOS_KEY_PREFIX = 'travel-vault-synced-photo-ids';

// Also per account: otherwise uploading a photo with account 1 makes
// account 2 think it's "already uploaded" and it never gets uploaded to
// account 2's own storage.
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

// Uploads ONE destination (and its notes and photos) to Supabase. Only
// uploads a photo's binary if it isn't already marked as uploaded — same
// fix as on the local side, we don't want to re-upload megabytes of an
// unchanged photo every time something else about the same destination
// gets edited.
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
    if (!match) continue; // no data in memory yet; will be uploaded on the next push
    const [, mime, base64] = match;
    const path = `${userId}/${p.id}.${extFromMime(mime)}`;

    if (!synced.has(p.id)) {
      const { error: upErr } = await supabase.storage
        .from('photos')
        .upload(path, base64ToBytes(base64), { contentType: mime, upsert: true });
      if (upErr) throw upErr;
      markPhotoSynced(userId, p.id);
    }

    // The caption can change even if the binary is already uploaded, so
    // the row is always updated; it's the expensive part (the binary)
    // that's skipped.
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
