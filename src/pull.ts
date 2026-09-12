import { supabase } from './supabaseClient';
import { Destination, JournalEntry, Photo } from './types';
import { putPhoto } from './storage';

const BASE_KEY_PREFIX = 'travel-vault-sync-base';

const SCALAR_FIELDS = ['name', 'country', 'type', 'status', 'companions', 'tripStart', 'tripEnd', 'lat', 'lng'] as const;
type ScalarFields = Pick<Destination, (typeof SCALAR_FIELDS)[number]>;

// Same as storage.ts: this "base" has to be per account, otherwise one
// account's merge starts from another account's data.
function loadBase(userId: string): Record<string, ScalarFields> {
  try { return JSON.parse(localStorage.getItem(`${BASE_KEY_PREFIX}:${userId}`) || '{}'); } catch { return {}; }
}
function saveBase(userId: string, b: Record<string, ScalarFields>) {
  localStorage.setItem(`${BASE_KEY_PREFIX}:${userId}`, JSON.stringify(b));
}

// Three-way merge for a single field: if it only changed on one side, that
// side wins without loss. If it changed on both (a real conflict, rare
// between your own devices), local wins — it's the device in front of you
// right now. There's no per-field timestamp, so this is a deliberate
// simplification, not a proper LWW.
function mergeField<T>(base: T, local: T, remote: T): T {
  const localChanged = JSON.stringify(local) !== JSON.stringify(base);
  const remoteChanged = JSON.stringify(remote) !== JSON.stringify(base);
  if (localChanged && !remoteChanged) return local;
  if (remoteChanged && !localChanged) return remote;
  if (localChanged && remoteChanged) return local;
  return base;
}

async function downloadPhotoInBackground(photoId: string, storagePath: string) {
  try {
    const { data, error } = await supabase.storage.from('photos').download(storagePath);
    if (error || !data) return;
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(data);
    });
    await putPhoto({ id: photoId, dataUrl, caption: '' });
    window.dispatchEvent(new CustomEvent('travel-vault-photo-ready', { detail: { photoId, dataUrl } }));
  } catch (e) {
    console.error('Could not download the photo', photoId, e);
  }
}

export interface PullResult {
  destinations: Destination[];
  // Destinations whose merged result ended up different from what the
  // server had (local won on some field, or there are local notes/photos
  // the server doesn't have yet) — these need to be re-uploaded to converge.
  dirtyIds: string[];
}

export async function pullChanges(
  userId: string,
  current: Destination[],
  pendingLocalPush: Set<string>,
  pendingLocalDeletes: Set<string>
): Promise<PullResult> {
  const [{ data: rDest, error: e1 }, { data: rJournal, error: e2 }, { data: rPhotos, error: e3 }] = await Promise.all([
    supabase.from('destinations').select('*').eq('user_id', userId),
    supabase.from('journal_entries').select('*').eq('user_id', userId),
    supabase.from('photos').select('*').eq('user_id', userId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;

  const base = loadBase(userId);
  const byId = new Map(current.map(d => [d.id, d]));

  const journalByDest = new Map<string, any[]>();
  (rJournal || []).forEach(j => {
    if (!journalByDest.has(j.destination_id)) journalByDest.set(j.destination_id, []);
    journalByDest.get(j.destination_id)!.push(j);
  });
  const photosByDest = new Map<string, any[]>();
  (rPhotos || []).forEach(p => {
    if (!photosByDest.has(p.destination_id)) photosByDest.set(p.destination_id, []);
    photosByDest.get(p.destination_id)!.push(p);
  });

  const result: Destination[] = [];
  const newBase: Record<string, ScalarFields> = {};
  const dirtyIds: string[] = [];

  for (const rd of rDest || []) {
    if (rd.deleted_at) continue; // deleted on the server: drop it locally too
    if (pendingLocalDeletes.has(rd.id)) continue; // deleted right here, not yet confirmed on the server

    const local = byId.get(rd.id);
    const remoteScalar: ScalarFields = {
      name: rd.name,
      country: rd.country || '',
      type: rd.type,
      status: rd.status,
      companions: rd.companions || [],
      tripStart: rd.trip_start || undefined,
      tripEnd: rd.trip_end || undefined,
      lat: rd.lat,
      lng: rd.lng,
    };

    let mergedScalar: ScalarFields;
    let scalarDiffersFromRemote = false;
    if (!local) {
      mergedScalar = remoteScalar; // new from another device
    } else {
      const b = base[rd.id] || remoteScalar;
      mergedScalar = {} as ScalarFields;
      for (const f of SCALAR_FIELDS) {
        (mergedScalar as any)[f] = mergeField((b as any)[f], (local as any)[f], (remoteScalar as any)[f]);
        if (JSON.stringify((mergedScalar as any)[f]) !== JSON.stringify((remoteScalar as any)[f])) scalarDiffersFromRemote = true;
      }
    }

    // Journal: union by id + tombstones. There's no note editing in the UI
    // today, so a real conflict (same id changed on both sides) can't
    // happen yet; this is effectively just additions/removals.
    const remoteJournalRows = journalByDest.get(rd.id) || [];
    const journalById = new Map<string, JournalEntry>();
    (local?.journal || []).forEach(j => journalById.set(j.id, j));
    remoteJournalRows.forEach(j => {
      if (j.deleted_at) journalById.delete(j.id);
      else journalById.set(j.id, { id: j.id, date: j.entry_date, text: j.text });
    });
    const remoteJournalIds = new Set(remoteJournalRows.filter(j => !j.deleted_at).map(j => j.id));
    const journalDiffers = journalById.size !== remoteJournalIds.size || [...journalById.keys()].some(id => !remoteJournalIds.has(id));

    // Photos: union by id + tombstones. If the destination has a pending
    // local push, don't let the (possibly older) remote caption overwrite
    // one that was just edited here and hasn't uploaded yet.
    const remotePhotoRows = photosByDest.get(rd.id) || [];
    const photoById = new Map<string, Photo>();
    (local?.photos || []).forEach(p => photoById.set(p.id, p));
    const destPending = pendingLocalPush.has(rd.id);
    remotePhotoRows.forEach(rp => {
      if (rp.deleted_at) { photoById.delete(rp.id); return; }
      const existing = photoById.get(rp.id);
      if (!existing) {
        photoById.set(rp.id, { id: rp.id, dataUrl: '', caption: rp.caption });
        downloadPhotoInBackground(rp.id, rp.storage_path);
      } else if (!destPending) {
        existing.caption = rp.caption;
      }
    });
    const remotePhotoIds = new Set(remotePhotoRows.filter(p => !p.deleted_at).map(p => p.id));
    const photosDiffer = photoById.size !== remotePhotoIds.size || [...photoById.keys()].some(id => !remotePhotoIds.has(id));

    result.push({ id: rd.id, ...mergedScalar, journal: [...journalById.values()], photos: [...photoById.values()] });
    newBase[rd.id] = mergedScalar;
    if (scalarDiffersFromRemote || journalDiffers || photosDiffer) dirtyIds.push(rd.id);
  }

  // Destinations that only exist locally (haven't reached the server yet):
  // keep them as-is, phase 3 already takes care of uploading them.
  const remoteIds = new Set((rDest || []).map(d => d.id));
  for (const d of current) if (!remoteIds.has(d.id)) result.push(d);

  saveBase(userId, newBase);
  return { destinations: result, dirtyIds };
}
