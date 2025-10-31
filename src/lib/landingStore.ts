// Minimal IndexedDB wrapper for storing landing page images entirely on the frontend.
// Stores Blobs in an object store and returns string ids. Use getObjectUrl to render.

const DB_NAME = 'landing-content';
const DB_VERSION = 1;
const STORE = 'files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function saveFiles(files: FileList | File[]): Promise<string[]> {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const arr = Array.isArray(files) ? files : Array.from(files);
  const ids: string[] = [];
  for (const f of arr) {
    const id = uuid();
    await new Promise<void>((resolve, reject) => {
      const req = store.put({ id, blob: f, mime: f.type || 'application/octet-stream', createdAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    ids.push(id);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return ids;
}

export async function getBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => {
      const rec = req.result as any;
      resolve(rec ? (rec.blob as Blob) : null);
    };
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function getObjectUrl(id: string): Promise<string | null> {
  const blob = await getBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function getObjectUrls(ids: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const id of ids) {
    const url = await getObjectUrl(id);
    if (url) map[id] = url;
  }
  return map;
}

export async function removeById(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  await new Promise<void>((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
}
