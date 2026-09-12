import { supabase } from './supabaseClient';
import { Destination } from './types';

const MIGRATED_KEY = 'travel-vault-migrated-v1';

const extFromMime = (mime: string) => (mime.split('/')[1] || 'jpg').split('+')[0];

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export type MigrationStatus = 'idle' | 'running' | 'done' | 'error' | 'skipped';

// Uploads the local vault to Supabase exactly once per browser, the first
// time this user logs in with data already in localStorage/IndexedDB and
// nothing yet on the server. This is intentionally one-way (local -> server)
// and one-shot: it does NOT merge with existing server data — that's phase 4.
// If the server already has rows for this user (e.g. a second device, or a
// previous successful migration), it's skipped entirely rather than risk
// clobbering anything.
export async function migrateIfNeeded(
  destinations: Destination[],
  onStatus?: (s: MigrationStatus) => void
): Promise<void> {
  if (localStorage.getItem(MIGRATED_KEY) === 'true') return;

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return;

  const { count, error: countError } = await supabase
    .from('destinations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    console.error('No se pudo comprobar el estado del servidor antes de migrar', countError);
    return;
  }
  if ((count ?? 0) > 0) {
    // El servidor ya tiene datos de este usuario (otro dispositivo, o una
    // migración anterior) — no hay nada que subir, y esto sí es definitivo.
    localStorage.setItem(MIGRATED_KEY, 'true');
    onStatus?.('skipped');
    return;
  }
  if (destinations.length === 0) {
    // Vault local vacío por ahora: no marcamos MIGRATED_KEY, para volver a
    // comprobarlo la próxima vez por si luego se añaden destinos aquí mismo.
    onStatus?.('skipped');
    return;
  }

  onStatus?.('running');
  try {
    for (const d of destinations) {
      const { error: destErr } = await supabase.from('destinations').upsert({
        id: d.id,
        user_id: user.id,
        name: d.name,
        country: d.country || null,
        type: d.type,
        status: d.status,
        companions: d.companions,
        trip_start: d.tripStart || null,
        trip_end: d.tripEnd || null,
        lat: d.lat,
        lng: d.lng,
      });
      if (destErr) throw destErr;

      for (const j of d.journal) {
        const { error: jErr } = await supabase.from('journal_entries').upsert({
          id: j.id,
          destination_id: d.id,
          user_id: user.id,
          entry_date: j.date,
          text: j.text,
        });
        if (jErr) throw jErr;
      }

      for (const p of d.photos) {
        const match = /^data:(.+);base64,(.*)$/.exec(p.dataUrl || '');
        if (!match) continue; // sin datos en memoria: no bloquea el resto de la migración
        const [, mime, base64] = match;
        const path = `${user.id}/${p.id}.${extFromMime(mime)}`;
        const { error: upErr } = await supabase.storage
          .from('photos')
          .upload(path, base64ToBytes(base64), { contentType: mime, upsert: true });
        if (upErr) throw upErr;

        const { error: pErr } = await supabase.from('photos').upsert({
          id: p.id,
          destination_id: d.id,
          user_id: user.id,
          storage_path: path,
          caption: p.caption,
        });
        if (pErr) throw pErr;
      }
    }
    localStorage.setItem(MIGRATED_KEY, 'true');
    onStatus?.('done');
  } catch (e) {
    // No marcamos MIGRATED_KEY: se reintenta en el próximo inicio de sesión.
    console.error('La migración a Supabase falló, se reintentará más tarde', e);
    onStatus?.('error');
  }
}
