import JSZip from 'jszip';
import { Destination } from './types';
import { getPhoto, putPhoto } from './storage';

const extFromMime = (mime: string) =>
  (mime.split('/')[1] || 'jpg').split('+')[0];

const mimeFromExt: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

// Bundles destinations + full-resolution photos into a single .zip:
// a data.json manifest plus one image file per photo (not base64-in-JSON,
// which would bloat the export ~33% for no reason).
export async function exportData(
  destinations: Destination[]
): Promise<Blob> {
  const zip = new JSZip();
  const photosFolder = zip.folder('photos')!;

  const manifest = await Promise.all(
    destinations.map(async d => ({
      // Export only user data — user_id is intentionally excluded
      // so backups are not tied to the original account.
      id: d.id,
      name: d.name,
      country: d.country,
      country_code: d.country_code,
      type: d.type,
      status: d.status,
      companions: d.companions,
      trip_start: d.trip_start,
      trip_end: d.trip_end,
      lat: d.lat,
      lng: d.lng,

      photos: await Promise.all(
        d.photos.map(async p => {
          const dataUrl = p.dataUrl || (await getPhoto(p.id)) || '';
          const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);

          if (!match) {
            return {
              id: p.id,
              caption: p.caption,
              file: null,
            };
          }

          const [, mime, base64] = match;
          const filename = `${p.id}.${extFromMime(mime)}`;

          photosFolder.file(filename, base64, { base64: true });

          return {
            id: p.id,
            caption: p.caption,
            file: filename,
          };
        })
      ),
    }))
  );

  zip.file(
    'data.json',
    JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        destinations: manifest,
      },
      null,
      2
    )
  );

  return zip.generateAsync({ type: 'blob' });
}

// Restores a .zip produced by exportData(): parses the manifest, decodes each
// photo back into a data URL, writes it to IndexedDB, and returns the
// destinations array ready to drop into app state.
//
// userId is supplied by the currently authenticated Supabase user.
// The user_id from the backup is never trusted or restored.
export async function importData(
  file: File | Blob,
  userId: string
): Promise<Destination[]> {
  const zip = await JSZip.loadAsync(file);
  const manifestFile = zip.file('data.json');

  if (!manifestFile) {
    throw new Error('Invalid backup file: missing data.json');
  }

  const raw = JSON.parse(await manifestFile.async('string'));

  return Promise.all(
    (raw.destinations || []).map(async (d: any) => {
      const photos = await Promise.all(
        (d.photos || []).map(async (p: any) => {
          let dataUrl = '';

          if (p.file) {
            const entry = zip.file(`photos/${p.file}`);

            if (entry) {
              const base64 = await entry.async('base64');
              const ext = (p.file.split('.').pop() || 'jpg').toLowerCase();

              dataUrl = `data:${
                mimeFromExt[ext] || 'image/jpeg'
              };base64,${base64}`;
            }
          }

          if (dataUrl) {
            await putPhoto({
              id: p.id,
              dataUrl,
              caption: p.caption,
            });
          }

          return {
            id: p.id,
            caption: p.caption,
            dataUrl,
          };
        })
      );

      return {
        ...d,
        user_id: userId,
        photos,
      };
    })
  );
}