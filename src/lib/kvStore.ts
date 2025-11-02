import { supabase } from './supabaseClient';

export const kvStore = {
  async get(key: string): Promise<any | null> {
    try {
      const { data, error } = await supabase.from('kv_store').select('value').eq('key', key).single();
      if (error) return null;
      return data?.value ?? null;
    } catch (e) {
      return null;
    }
  },

  async set(key: string, value: any) {
    try {
      await supabase.from('kv_store').upsert({ key, value });
    } catch (e) {
      // ignore
    }
  },

  async remove(key: string) {
    try {
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
          if (payload.eventType === 'DELETE') cb(null);
          else cb(payload.new?.value ?? null);
        } catch {}
      })
      .subscribe();

    return {
      unsubscribe: () => { try { supabase.removeChannel(channel); } catch {} }
    };
  }
};

export default kvStore;
