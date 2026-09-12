import { supabase } from './supabaseClient';
import { Destination, JournalEntry, Photo } from './types';
import { putPhoto } from './storage';

const BASE_KEY_PREFIX = 'travel-vault-sync-base';

const SCALAR_FIELDS = ['name', 'country', 'type', 'status', 'companions', 'tripStart', 'tripEnd', 'lat', 'lng'] as const;
type ScalarFields = Pick<Destination, (typeof SCALAR_FIELDS)[number]>;

// Igual que en storage.ts: esta "base" tiene que ser por cuenta, si no el
// merge de una cuenta usa como punto de partida los datos de otra.
function loadBase(userId: string): Record<string, ScalarFields> {
  try { return JSON.parse(localStorage.getItem(`${BASE_KEY_PREFIX}:${userId}`) || '{}'); } catch { return {}; }
}
function saveBase(userId: string, b: Record<string, ScalarFields>) {
  localStorage.setItem(`${BASE_KEY_PREFIX}:${userId}`, JSON.stringify(b));
}

// Merge de 3 vías para un solo campo: si solo cambió en un lado, gana ese
// lado sin pérdida. Si cambió en ambos (conflicto real, raro entre tus
// propios dispositivos), gana el local — es el dispositivo que tienes
// delante ahora mismo. No hay timestamp por campo, así que esto es una
// simplificación deliberada, no un LWW perfecto.
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
    console.error('No se pudo descargar la foto', photoId, e);
  }
}

export interface PullResult {
  destinations: Destination[];
  // Destinos cuyo resultado fusionado quedó distinto de lo que había en el
  // servidor (ganó el local en algún campo, o hay notas/fotos locales que el
  // servidor aún no tiene) — hay que volver a subirlos para converger.
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
    if (rd.deleted_at) continue; // borrado en el servidor: se cae también en local
    if (pendingLocalDeletes.has(rd.id)) continue; // borrado aquí mismo, aún no confirmado en el servidor

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
      mergedScalar = remoteScalar; // nuevo desde otro dispositivo
    } else {
      const b = base[rd.id] || remoteScalar;
      mergedScalar = {} as ScalarFields;
      for (const f of SCALAR_FIELDS) {
        (mergedScalar as any)[f] = mergeField((b as any)[f], (local as any)[f], (remoteScalar as any)[f]);
        if (JSON.stringify((mergedScalar as any)[f]) !== JSON.stringify((remoteScalar as any)[f])) scalarDiffersFromRemote = true;
      }
    }

    // Journal: unión por id + tombstones. Sin edición de notas en la UI hoy,
    // así que un conflicto real (mismo id cambiado en ambos lados) no puede
    // ocurrir todavía; esto es efectivamente solo altas/bajas.
    const remoteJournalRows = journalByDest.get(rd.id) || [];
    const journalById = new Map<string, JournalEntry>();
    (local?.journal || []).forEach(j => journalById.set(j.id, j));
    remoteJournalRows.forEach(j => {
      if (j.deleted_at) journalById.delete(j.id);
      else journalById.set(j.id, { id: j.id, date: j.entry_date, text: j.text });
    });
    const remoteJournalIds = new Set(remoteJournalRows.filter(j => !j.deleted_at).map(j => j.id));
    const journalDiffers = journalById.size !== remoteJournalIds.size || [...journalById.keys()].some(id => !remoteJournalIds.has(id));

    // Fotos: unión por id + tombstones. Si el destino tiene un push local
    // pendiente, no dejamos que el caption remoto (posiblemente más viejo)
    // pise el caption que se acaba de editar aquí y aún no ha subido.
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

  // Destinos que solo existen en local (aún no llegaron al servidor): se
  // conservan tal cual, la fase 3 ya se encarga de subirlos.
  const remoteIds = new Set((rDest || []).map(d => d.id));
  for (const d of current) if (!remoteIds.has(d.id)) result.push(d);

  saveBase(userId, newBase);
  return { destinations: result, dirtyIds };
}
