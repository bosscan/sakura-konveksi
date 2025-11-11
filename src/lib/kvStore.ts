// Simple in-memory cache to prevent "blip to empty" when network hiccups occur.
// We keep the last-known-good value for each key during the SPA session.
const memCache = new Map<string, any>();

// Backend endpoints
const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || '';
let ws: WebSocket | null = null;
let wsReady = false;
const listeners = new Map<string, Set<(v: any | null) => void>>();

function ensureWs() {
  if (ws && wsReady) return;
  try {
    const wsUrl = (() => {
      try {
        const u = new URL(API_BASE);
        u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
        u.pathname = '/ws';
        return u.toString();
      } catch {
        // If API_BASE is relative, use current location origin
        const origin = window.location.origin.replace(/^http/, 'ws');
        return origin + '/ws';
      }
    })();
    ws = new WebSocket(wsUrl);
    ws.onopen = () => { wsReady = true; };
    ws.onclose = () => { wsReady = false; ws = null; setTimeout(ensureWs, 1200); };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as any);
        if (msg?.type === 'kv' && typeof msg.key === 'string') {
          const val = msg.value ?? null;
          if (val !== null && val !== undefined) memCache.set(msg.key, val);
          else memCache.delete(msg.key);
          const subs = listeners.get(msg.key);
          subs?.forEach((fn) => { try { fn(val); } catch {} });
        }
      } catch {}
    };
  } catch {}
}

export const kvStore = {
  // Return last-known-good value for a key without any network call.
  peek(key: string): any | null {
    return memCache.has(key) ? memCache.get(key) : null;
  },

  async get(key: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/kv/${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const val = json?.value ?? null;
      if (val !== null && val !== undefined) memCache.set(key, val);
      // Mirror to localStorage for offline resilience
      try { localStorage.setItem(`kv:${key}`, JSON.stringify(val)); } catch {}
      return val;
    } catch {
      if (memCache.has(key)) return memCache.get(key);
      // Fallback to localStorage if network unavailable
      try {
        const raw = localStorage.getItem(`kv:${key}`);
        if (raw != null) {
          const parsed = JSON.parse(raw);
          memCache.set(key, parsed);
          return parsed;
        }
      } catch {}
      return null;
    }
  },

  async set(key: string, value: any) {
    try {
      memCache.set(key, value);
      try { localStorage.setItem(`kv:${key}`, JSON.stringify(value)); } catch {}
      await fetch(`${API_BASE}/kv/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } catch {}
  },

  async remove(key: string) {
    try {
      memCache.delete(key);
      try { localStorage.removeItem(`kv:${key}`); } catch {}
      await fetch(`${API_BASE}/kv/${encodeURIComponent(key)}`, { method: 'DELETE' });
    } catch {}
  },

  // Subscribe to changes for a specific key. Callback receives newValue (or null on delete).
  subscribe(key: string, cb: (v: any | null) => void) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(cb);
    ensureWs();
    return {
      unsubscribe: () => { try { listeners.get(key)?.delete(cb); } catch {} }
    };
  }
};

export default kvStore;
