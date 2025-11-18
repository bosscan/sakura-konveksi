const API_BASE = (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, '') || '';

// Simple in-memory cache to prevent "blip to empty" when network hiccups occur.
// We keep the last-known-good value for each key during the SPA session.
const memCache = new Map<string, any>();

export const kvStore = {
  // Return last-known-good value for a key without any network call.
  peek(key: string): any | null {
    return memCache.has(key) ? memCache.get(key) : null;
  },

  async get(key: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/api/kv/${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const payload = await res.json().catch(() => null);
      const val = payload?.value ?? null;
      if (val !== null && val !== undefined) memCache.set(key, val);
      return val;
    } catch (e) {
      return memCache.has(key) ? memCache.get(key) : null;
    }
  },

  async set(key: string, value: any) {
    try {
      // Update cache eagerly to keep UI consistent
      memCache.set(key, value);
      await fetch(`${API_BASE}/api/kv/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
    } catch (e) {
      // ignore
    }
  },

  async remove(key: string) {
    try {
      memCache.delete(key);
      await fetch(`${API_BASE}/api/kv/${encodeURIComponent(key)}`, { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
  },

  // Subscribe to changes for a specific key. Callback receives newValue (or null on delete).
  subscribe(key: string, cb: (v: any | null) => void) {
    let stopped = false;
    let lastSerialized = JSON.stringify(memCache.has(key) ? memCache.get(key) : null);
    const interval = setInterval(async () => {
      if (stopped) return;
      try {
        const res = await fetch(`${API_BASE}/api/kv/${encodeURIComponent(key)}`);
        if (!res.ok) return;
        const payload = await res.json().catch(() => null);
        const val = payload?.value ?? null;
        const serialized = JSON.stringify(val);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          if (val !== null && val !== undefined) memCache.set(key, val); else memCache.delete(key);
          cb(val);
        }
      } catch {}
    }, 2000);

    return { unsubscribe: () => { stopped = true; clearInterval(interval); } };
  }
};

export default kvStore;
