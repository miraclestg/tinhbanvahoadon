// Lưu trữ: IndexedDB (offline, luôn có) + Firebase Firestore (đồng bộ)
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase-config';
import type { Trip } from './types';

// ---------- IndexedDB (key-value) ----------
let dbp: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  if (!dbp)
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('chiatien', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  return dbp;
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | undefined): Promise<T | undefined> {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction('kv', mode);
    const req = fn(t.objectStore('kv'));
    t.oncomplete = () => res(req ? req.result : undefined);
    t.onerror = () => rej(t.error);
  });
}

export const get = <T = unknown>(k: string) => run<T>('readonly', (s) => s.get(k) as IDBRequest<T>);
export const set = (k: string, v: unknown) =>
  run('readwrite', (s) => {
    s.put(v, k);
    return undefined;
  });
export const del = (k: string) =>
  run('readwrite', (s) => {
    s.delete(k);
    return undefined;
  });

export async function allTrips(): Promise<Trip[]> {
  const d = await db();
  return new Promise((res, rej) => {
    const out: Trip[] = [];
    const r = d.transaction('kv').objectStore('kv').openCursor();
    r.onsuccess = () => {
      const c = r.result;
      if (!c) return res(out);
      if (String(c.key).startsWith('trip:')) out.push(c.value as Trip);
      c.continue();
    };
    r.onerror = () => rej(r.error);
  });
}

// ---------- Firebase ----------
let fdb: Firestore | null = null;
export const cloudOn = () => fdb !== null;

export function initCloud(): boolean {
  if (!firebaseConfig.apiKey) return false;
  try {
    const app = initializeApp(firebaseConfig);
    fdb = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    return true;
  } catch (e) {
    console.warn('Không bật được đồng bộ Firebase:', e);
    fdb = null;
    return false;
  }
}

export function pushTrip(trip: Trip) {
  if (!fdb) return;
  setDoc(doc(fdb, 'trips', trip.id), trip).catch((e) => console.warn(e));
}

export function removeCloudTrip(id: string) {
  if (!fdb) return;
  deleteDoc(doc(fdb, 'trips', id)).catch((e) => console.warn(e));
}

export function watchTrip(id: string, cb: (t: Trip) => void): () => void {
  if (!fdb) return () => {};
  return onSnapshot(
    doc(fdb, 'trips', id),
    (snap) => {
      if (snap.exists()) cb(snap.data() as Trip);
    },
    (e) => console.warn(e)
  );
}

// Ảnh hóa đơn: lưu local + trips/{id}/photos/{expId}
export async function savePhoto(tripId: string, expId: string, dataUrl: string) {
  await set(`photo:${tripId}:${expId}`, dataUrl);
  if (fdb) setDoc(doc(fdb, 'trips', tripId, 'photos', expId), { data: dataUrl }).catch((e) => console.warn(e));
}

export async function getPhoto(tripId: string, expId: string): Promise<string | null> {
  const local = await get<string>(`photo:${tripId}:${expId}`);
  if (local) return local;
  if (!fdb) return null;
  try {
    const s = await getDoc(doc(fdb, 'trips', tripId, 'photos', expId));
    if (s.exists()) {
      const data = (s.data() as { data: string }).data;
      await set(`photo:${tripId}:${expId}`, data);
      return data;
    }
  } catch (e) {
    console.warn(e);
  }
  return null;
}

export async function deletePhoto(tripId: string, expId: string) {
  await del(`photo:${tripId}:${expId}`);
  if (fdb) deleteDoc(doc(fdb, 'trips', tripId, 'photos', expId)).catch(() => {});
}
