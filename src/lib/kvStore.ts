const API_BASE = (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, '') || '';

function lsGet(key: string): any | null {
  try {
    const s = window.localStorage.getItem(key);
    if (s == null) return null;
    return JSON.parse(s);
  } catch { return null; }
}
function lsSet(key: string, value: any) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function lsRemove(key: string) {
  try { window.localStorage.removeItem(key); } catch {}
}

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
      // fallback to localStorage if available
      const ls = lsGet(key);
      if (ls !== null && ls !== undefined) {
        memCache.set(key, ls);
        return ls;
      }
      return memCache.has(key) ? memCache.get(key) : null;
    }
  },

  async set(key: string, value: any) {
    try {
      // Update cache eagerly to keep UI consistent
      memCache.set(key, value);
      // persist also to localStorage to avoid blank auth on API hiccups
      lsSet(key, value);
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
      lsRemove(key);
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
