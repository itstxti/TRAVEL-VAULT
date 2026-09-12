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
// a data.json manifest plus one image file per photo.
export async function exportData(
  destinations: Destination[]
): Promise<Blob> {
  const zip = new JSZip();
  const photosFolder = zip.folder('photos')!;

  const manifest = await Promise.all(
    destinations.map(async d => ({
      // user_id is intentionally excluded so the backup
      // is portable between different accounts.
      id: d.id,
      name: d.name,
      country: d.country,
      type: d.type,
      status: d.status,
      companions: Array.isArray(d.companions) ? d.companions : [],
      tripStart: d.tripStart,
      tripEnd: d.tripEnd,
      lat: d.lat,
      lng: d.lng,

      // Always export journal as an array.
      journal: Array.isArray(d.journal) ? d.journal : [],

      photos: await Promise.all(
        (d.photos || []).map(async p => {
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

          photosFolder.file(filename, base64, {
            base64: true,
          });

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

  return zip.generateAsync({
    type: 'blob',
  });
}

// Restores a .zip produced by exportData().
// The backup does not contain user_id because it should be
// portable between different authenticated accounts.
export async function importData(
  file: File | Blob
): Promise<Destination[]> {
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file('data.json');

  if (!manifestFile) {
    throw new Error('Invalid backup file: missing data.json');
  }

  const raw = JSON.parse(await manifestFile.async('string'));

  if (!Array.isArray(raw.destinations)) {
    throw new Error('Invalid backup file: destinations must be an array');
  }

  return Promise.all(
    raw.destinations.map(async (d: any) => {
      const photos = await Promise.all(
        (Array.isArray(d.photos) ? d.photos : []).map(
          async (p: any) => {
            let dataUrl = '';

            if (p.file) {
              const entry = zip.file(`photos/${p.file}`);

              if (entry) {
                const base64 = await entry.async('base64');

                const ext = (
                  p.file.split('.').pop() || 'jpg'
                ).toLowerCase();

                dataUrl = `data:${
                  mimeFromExt[ext] || 'image/jpeg'
                };base64,${base64}`;
              }
            }

            if (dataUrl) {
              await putPhoto({
                id: p.id,
                dataUrl,
                caption: p.caption || '',
              });
            }

            return {
              id: p.id,
              caption: p.caption || '',
              dataUrl,
            };
          }
        )
      );

      return {
        id: d.id,
        name: d.name || '',
        country: d.country || '',
        type: d.type,
        status: d.status,
        companions: Array.isArray(d.companions)
          ? d.companions
          : [],
        tripStart: d.tripStart,
        tripEnd: d.tripEnd,
        lat: typeof d.lat === 'number' ? d.lat : 0,
        lng: typeof d.lng === 'number' ? d.lng : 0,

        // Important: prevents errors such as
        // "Cannot read properties of undefined (reading 'length')".
        journal: Array.isArray(d.journal)
          ? d.journal
          : [],

        photos,
      };
    })
  );
}