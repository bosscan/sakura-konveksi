import { supabase } from './supabaseClient';

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
      const { data, error } = await supabase.from('kv_store').select('value').eq('key', key).single();
      if (error) {
        // On error, return last-known-good from memory if available
        return memCache.has(key) ? memCache.get(key) : null;
      }
      const val = data?.value ?? null;
      if (val !== null && val !== undefined) memCache.set(key, val);
      return val;
    } catch (e) {
      // On exception, prefer last-known-good
      return memCache.has(key) ? memCache.get(key) : null;
    }
  },

  async set(key: string, value: any) {
    try {
      // Update cache eagerly to keep UI consistent
      memCache.set(key, value);
      await supabase.from('kv_store').upsert({ key, value });
    } catch (e) {
      // ignore
    }
  },

  async remove(key: string) {
    try {
      memCache.delete(key);
      await supabase.from('kv_store').delete().eq('key', key);
    } catch (e) {
      // ignore
    }
  },

  // Subscribe to changes for a specific key. Callback receives newValue (or null on delete).
  subscribe(key: string, cb: (v: any | null) => void) {
    const channel = supabase
      .channel(`kv_store_${key}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kv_store', filter: `key=eq.${key}` }, (payload: any) => {
        try {
          if (payload.eventType === 'DELETE') {
            memCache.delete(key);
            cb(null);
          } else {
            const val = payload.new?.value ?? null;
            if (val !== null && val !== undefined) memCache.set(key, val);
            else memCache.delete(key);
            cb(val);
          }
        } catch {}
      })
      .subscribe();

    return {
      unsubscribe: () => { try { supabase.removeChannel(channel); } catch {} }
    };
  }
};

export default kvStore;
