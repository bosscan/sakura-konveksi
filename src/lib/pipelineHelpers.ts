import Api from './api';
import kvStore from './kvStore';

/**
 * Mark a pipeline item as finished for given division.
 * Tries backend first, then falls back to localStorage('spk_pipeline').
 * @param spkId idSpk string
 * @param backendField snake_case field for backend (e.g., 'selesai_cutting_pola')
 * @param localField camelCase field in localStorage object (e.g., 'selesaiCuttingPola')
 * @returns true if any update was applied; false otherwise
 */
export async function markSelesai(spkId: string, backendField: string, localField: string): Promise<boolean> {
  const id = (spkId || '').trim();
  if (!id) return false;
  let updated = false;
  try {
    await Api.markPipeline(id, backendField);
    updated = true;
  } catch {
    // ignore, try local fallback
  }
  try {
    const raw = await kvStore.get('spk_pipeline');
    const list: any[] = Array.isArray(raw) ? raw : [];
    const now = new Date().toISOString();
    for (const it of list) {
      if ((it?.idSpk || '').trim() === id) {
        if (!it[localField]) {
          it[localField] = now;
          updated = true;
        }
      }
    }
    if (updated) await kvStore.set('spk_pipeline', list);
  } catch {
    // ignore storage errors
  }
  return updated;
}

export type DivisionKey =
  | 'desain-produksi'
  | 'cutting-pola'
  | 'stock-bordir'
  | 'bordir'
  | 'setting'
  | 'stock-jahit'
  | 'jahit'
  | 'finishing'
  | 'foto-produk'
  | 'stock-no-transaksi'
  | 'pengiriman';

/**
 * Check whether an SPK is currently eligible to be worked on in a division,
 * i.e. it is inside that division's queue based on local spk_pipeline flags.
 * This mirrors the filtering logic used in DivisionAntrianTable (simplified
 * for grouping divisions like stock-no-transaksi/pengiriman).
 */
// In-memory cache of spk_pipeline to allow synchronous checks in UI without
// changing consumers. Hydrated from kvStore and kept up-to-date via subscribe.
let pipelineCache: any[] = [];
let pipelineCacheInitialized = false;

async function initPipelineCache() {
  if (pipelineCacheInitialized) return;
  pipelineCacheInitialized = true;
  try {
    const raw = await kvStore.get('spk_pipeline');
    pipelineCache = Array.isArray(raw) ? raw : [];
  } catch {
    pipelineCache = [];
  }
  try {
    kvStore.subscribe('spk_pipeline', (v) => {
      try { pipelineCache = Array.isArray(v) ? v : (v ? [v] : []); } catch { pipelineCache = []; }
    });
  } catch {}
}

// Synchronous check using pipelineCache. Ensure initialization kicked off.
export function isSpkInDivisionQueue(spkId: string, division: DivisionKey): boolean {
  if (!pipelineCacheInitialized) void initPipelineCache();
  const id = (spkId || '').trim();
  if (!id) return false;
  try {
    const it = pipelineCache.find((x) => (x?.idSpk || '').trim() === id);
    if (!it) return false;
    const done = (k: string) => Boolean(it?.[k]);

    switch (division) {
      case 'desain-produksi':
        return !done('selesaiDesainProduksi');
      case 'cutting-pola':
        return !done('selesaiCuttingPola');
      case 'stock-bordir':
        return done('selesaiDesainProduksi') && done('selesaiCuttingPola') && !done('selesaiStockBordir');
      case 'bordir':
        return done('selesaiStockBordir') && !done('selesaiBordir');
      case 'setting':
        return done('selesaiBordir') && !done('selesaiSetting');
      case 'stock-jahit':
        return done('selesaiSetting') && !done('selesaiStockJahit');
      case 'jahit':
        return done('selesaiStockJahit') && !done('selesaiJahit');
      case 'finishing':
        return done('selesaiJahit') && !done('selesaiFinishing');
      case 'foto-produk':
        return done('selesaiFinishing') && !done('selesaiFotoProduk');
      case 'stock-no-transaksi':
        return done('selesaiFotoProduk') && !done('selesaiPengiriman');
      case 'pengiriman':
        return done('selesaiFotoProduk') && !done('selesaiPengiriman');
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export default { markSelesai, isSpkInDivisionQueue };
