import { Destination, Photo } from './types';

const STORAGE_KEY_PREFIX = 'my-travels-destinations';
const PHOTO_DB = 'my-travels-photos';
const PHOTO_STORE = 'photos';

// Cada cuenta tiene su propia clave de localStorage. Sin esto, dos cuentas
// de Google abiertas en el mismo navegador (mismo origen) comparten
// literalmente el mismo localStorage y se pisan los datos entre sí.
function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function openPhotoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(PHOTO_STORE)) req.result.createObjectStore(PHOTO_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putPhoto(photo: Photo) {
  try {
    const db = await openPhotoDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      tx.objectStore(PHOTO_STORE).put(photo.dataUrl, photo.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('Could not save photo to IndexedDB', e);
  }
}

export async function getPhoto(id: string) {
  try {
    const db = await openPhotoDB();
    const value = await new Promise<string | undefined>((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const req = tx.objectStore(PHOTO_STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value;
  } catch {
    return undefined;
  }
}

export async function deletePhoto(id: string) {
  try {
    const db = await openPhotoDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      tx.objectStore(PHOTO_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* best-effort cleanup */
  }
}

// Photos are stored without their (potentially large) dataUrl in localStorage;
// this rehydrates each photo's dataUrl from IndexedDB on load.
export async function hydrate(raw: Destination[]): Promise<Destination[]> {
  return Promise.all(
    raw.map(async d => {
      const photos = await Promise.all(
        d.photos.map(async p => ({ ...p, dataUrl: p.dataUrl || (await getPhoto(p.id)) || '' }))
      );
      return { ...d, photos };
    })
  );
}

export function load(userId: string): Destination[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || 'null') || [];
  } catch {
    return [];
  }
}

export function save(userId: string, destinations: Destination[]) {
  try {
    const compact = destinations.map(({ photos, ...rest }) => ({
      ...rest,
      photos: photos.map(({ dataUrl, ...meta }) => meta),
    }));
    localStorage.setItem(storageKey(userId), JSON.stringify(compact));
    // Photos are persisted individually where they're created (GalleryModal.add)
    // and removed where they're deleted (deletePhoto), so no bulk re-put here.
  } catch (e) {
    console.warn('Could not save trip data', e);
  }
}
