import { supabase } from './supabaseClient';

// Keys that the app stores in localStorage which we want to sync to Supabase
// Most values are JSON-serialized objects/arrays, a few are primitives (string/boolean/number)
const KEY_ALLOWLIST = [
  // Market/Input Desain
  'antrian_input_desain',
  'inputProdukForm',
  'inputTambahanForm',
  'inputDetailForm',
  'current_spk_context',
  'design_queue',
  'design_queueid_by_spk',
  'spk_design',
  'mockup_thumb_map',
  // Market / Orders & pipeline
  'spk_orders',
  'spk_pipeline',
  'spk_terbit_map',
  'plotting_rekap_bordir_queue',
  'method_rekap_bordir',
  // Tables / Reports
  'production_recap_map',
  // Market DBs
  'database_konsumen',
  'database_trend',
  'database_sebaran',
  'database_produk',
  // Landing
  'landing_images_keys',
  'landing_images',
  'landing_gallery_keys',
  // Carts and misc
  'keranjang',
  'dropdown_options_cache',
  // Auth (basic flag used in landing/login)
  'isAuthenticated',
  // Money/Invoices (if stored similarly; keep generic examples)
  'omset_pendapatan',
  'pelunasan_transaksi',
];

// Prevent feedback loop when realtime updates set localStorage
const suppressed = new Set<string>();

export async function initCloudStorageBridge() {
  try {
    // 1) Hydrate localStorage from Supabase kv_store
    const { data, error } = await supabase
      .from('kv_store')
      .select('key, value, updated_at')
      .in('key', KEY_ALLOWLIST);
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        try {
          suppressed.add(row.key);
          localStorage.setItem(row.key, JSON.stringify(row.value));
        } catch {}
        finally {
          suppressed.delete(row.key);
        }
      }
    }

    // 2) Monkey-patch setItem/removeItem/clear to mirror to Supabase (async, non-blocking)
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    const originalClear = localStorage.clear.bind(localStorage);

    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value);
      if (!KEY_ALLOWLIST.includes(key)) return;
      if (suppressed.has(key)) return; // skip mirroring for realtime-applied updates
      // Try JSON parse; if fails, store as string
      let parsed: any = null;
      try { parsed = JSON.parse(value); } catch { parsed = value; }
      // fire-and-forget
  // Supabase types mark promises as PromiseLike; provide error handler via second then arg
  supabase.from('kv_store').upsert({ key, value: parsed }).then(() => {}, () => {});
    };

    localStorage.removeItem = (key: string) => {
      originalRemoveItem(key);
      if (!KEY_ALLOWLIST.includes(key)) return;
      if (suppressed.has(key)) return;
  supabase.from('kv_store').delete().eq('key', key).then(() => {}, () => {});
    };

    localStorage.clear = () => {
      // We only mirror deletions for known keys
      const toDelete: string[] = [];
      for (const k of KEY_ALLOWLIST) {
        if (localStorage.getItem(k) !== null) toDelete.push(k);
      }
      originalClear();
      if (toDelete.length) {
  supabase.from('kv_store').delete().in('key', toDelete).then(() => {}, () => {});
      }
    };

    // 3) Realtime: update localStorage when remote changes happen (other devices)
    supabase
      .channel('kv_store_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kv_store' }, (payload: any) => {
        const k = payload?.new?.key || payload?.old?.key;
        if (!k || !KEY_ALLOWLIST.includes(k)) return;
        try {
          suppressed.add(k);
          if (payload.eventType === 'DELETE') {
            localStorage.removeItem(k);
          } else {
            const v = payload.new?.value;
            localStorage.setItem(k, JSON.stringify(v));
          }
        } catch {}
        finally {
          suppressed.delete(k);
        }
      })
      .subscribe();
  } catch (e) {
    // If anything fails, the app continues using localStorage only
    console.warn('Cloud storage bridge init failed; continuing with localStorage only.', e);
  }
}

export const CloudKeys = KEY_ALLOWLIST;
