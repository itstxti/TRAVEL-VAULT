import { supabase } from './supabaseClient';
import { Destination } from './types';

const MIGRATED_KEY_PREFIX = 'travel-vault-migrated-v1';

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
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return;

  // Per account: otherwise account 2 inherits account 1's "already
  // migrated" flag and never uploads its own local vault the first time
  // it signs in.
  const migratedKey = `${MIGRATED_KEY_PREFIX}:${user.id}`;
  if (localStorage.getItem(migratedKey) === 'true') return;

  const { count, error: countError } = await supabase
    .from('destinations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    console.error('Could not check the server state before migrating', countError);
    return;
  }
  if ((count ?? 0) > 0) {
    // The server already has data for this user (another device, or a
    // previous migration) — nothing to upload, and this is final.
    localStorage.setItem(migratedKey, 'true');
    onStatus?.('skipped');
    return;
  }
  if (destinations.length === 0) {
    // Local vault is empty for now: don't set MIGRATED_KEY, so we check
    // again next time in case destinations get added right here.
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
        if (!match) continue; // no data in memory: doesn't block the rest of the migration
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
    localStorage.setItem(migratedKey, 'true');
    onStatus?.('done');
  } catch (e) {
    // Don't set MIGRATED_KEY: it retries on the next sign-in.
    console.error('Migration to Supabase failed, will retry later', e);
    onStatus?.('error');
  }
}
