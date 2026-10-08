import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as S from './store';
import { longId, sha256 } from './utils';
import type { Member, Trip } from './types';

interface TripsCtx {
  trips: Record<string, Trip>;
  editable: Record<string, boolean>;
  keys: Record<string, string>;
  ready: boolean;
  openTrip: (id: string, key?: string) => Promise<void>;
  saveTrip: (trip: Trip, log?: string) => Promise<void>;
  createTrip: (name: string, members: Member[], log: string) => Promise<string>;
  removeTrip: (id: string) => Promise<void>;
}

const Ctx = createContext<TripsCtx>(null as unknown as TripsCtx);
export const useTrips = () => useContext(Ctx);

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Record<string, Trip>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [editable, setEditable] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  const tripsRef = useRef(trips);
  tripsRef.current = trips;
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const watched = useRef(new Set<string>());

  const watch = useCallback((id: string) => {
    if (!S.cloudOn() || watched.current.has(id)) return;
    watched.current.add(id);
    S.watchTrip(id, async (remote) => {
      const cur = tripsRef.current[id];
      if (cur && (cur.updatedAt || 0) > (remote.updatedAt || 0)) return;
      await S.set('trip:' + id, remote);
      setTrips((p) => ({ ...p, [id]: remote }));
    });
  }, []);

  // Khởi động: đọc dữ liệu local, bật Firebase, theo dõi các chuyến đã có
  useEffect(() => {
    (async () => {
      const meta = (await S.get<{ keys: Record<string, string> }>('meta')) || { keys: {} };
      setKeys(meta.keys || {});
      const list = await S.allTrips();
      setTrips(Object.fromEntries(list.map((t) => [t.id, t])));
      if (S.initCloud()) list.forEach((t) => watch(t.id));
      setReady(true);
    })();
  }, [watch]);

  // Tính quyền chỉnh sửa: băm khóa so với editHash trong chuyến đi
  useEffect(() => {
    let off = false;
    (async () => {
      const out: Record<string, boolean> = {};
      for (const [id, tr] of Object.entries(trips)) {
        const k = keys[id];
        out[id] = !!k && (await sha256(k)) === tr.editHash;
      }
      if (!off) setEditable(out);
    })();
    return () => {
      off = true;
    };
  }, [trips, keys]);

  const persistKeys = useCallback(async (next: Record<string, string>) => {
    setKeys(next);
    await S.set('meta', { keys: next });
  }, []);

  const openTrip = useCallback(
    async (id: string, key?: string) => {
      if (key && keysRef.current[id] !== key) await persistKeys({ ...keysRef.current, [id]: key });
      if (!tripsRef.current[id]) {
        const local = await S.get<Trip>('trip:' + id);
        if (local) setTrips((p) => ({ ...p, [id]: local }));
      }
      watch(id);
    },
    [persistKeys, watch]
  );

  const saveTrip = useCallback(async (trip: Trip, log?: string) => {
    const now = Date.now();
    const next: Trip = {
      ...trip,
      updatedAt: now,
      history: log ? [{ ts: now, text: log }, ...(trip.history || [])].slice(0, 300) : trip.history,
    };
    setTrips((p) => ({ ...p, [next.id]: next }));
    await S.set('trip:' + next.id, next);
    S.pushTrip(next);
  }, []);

  const createTrip = useCallback(
    async (name: string, members: Member[], log: string) => {
      const id = longId();
      const key = longId();
      await persistKeys({ ...keysRef.current, [id]: key });
      const now = Date.now();
      const trip: Trip = {
        id,
        name,
        createdAt: now,
        updatedAt: now,
        editHash: await sha256(key),
        bg: '',
        members,
        expenses: [],
        payments: [],
        history: [{ ts: now, text: log }],
      };
      setTrips((p) => ({ ...p, [id]: trip }));
      await S.set('trip:' + id, trip);
      S.pushTrip(trip);
      watch(id);
      return id;
    },
    [persistKeys, watch]
  );

  const removeTrip = useCallback(
    async (id: string) => {
      if (editable[id]) S.removeCloudTrip(id);
      setTrips((p) => {
        const { [id]: _removed, ...rest } = p;
        return rest;
      });
      await S.del('trip:' + id);
    },
    [editable]
  );

  return (
    <Ctx.Provider value={{ trips, editable, keys, ready, openTrip, saveTrip, createTrip, removeTrip }}>
      {children}
    </Ctx.Provider>
  );
}
