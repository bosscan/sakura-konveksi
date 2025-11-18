import { useEffect, useRef, useState } from 'react';
import kvStore from './kvStore';

/**
 * React hook for kvStore with cache-first behavior and a loading flag.
 * - Immediately serves last-known-good value from in-memory cache (kvStore.peek)
 * - Then hydrates from Supabase via kvStore.get
 * - Keeps value in sync via kvStore.subscribe
 */
export function useKV<T = any>(key: string, initial?: T) {
  const mountedRef = useRef(true);
  const [value, setValue] = useState<T | undefined>(() => {
    const v = kvStore.peek(key);
    if (v !== undefined && v !== null) return v as T;
    return initial as T | undefined;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    mountedRef.current = true;
    const hydrate = async () => {
      try {
        const v = await kvStore.get(key);
        if (!mountedRef.current) return;
        setValue((v ?? undefined) as T | undefined);
        setLoading(false);
      } catch (e) {
        if (!mountedRef.current) return;
        setError(e);
        setLoading(false);
      }
    };
    hydrate();
    const sub = kvStore.subscribe(key, (v) => {
      if (!mountedRef.current) return;
      setValue((v ?? undefined) as T | undefined);
      setLoading(false);
    });
    return () => { mountedRef.current = false; try { sub.unsubscribe(); } catch {} };
  }, [key]);

  const set = async (v: T) => {
    await kvStore.set(key, v);
  };
  const remove = async () => {
    await kvStore.remove(key);
  };

  return { value, set, remove, loading, error } as const;
}

export default useKV;
