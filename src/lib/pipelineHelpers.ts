import Api from './api';

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
    const raw = localStorage.getItem('spk_pipeline');
    const list: any[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    for (const it of list) {
      if ((it?.idSpk || '').trim() === id) {
        if (!it[localField]) {
          it[localField] = now;
          updated = true;
        }
      }
    }
    if (updated) localStorage.setItem('spk_pipeline', JSON.stringify(list));
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
export function isSpkInDivisionQueue(spkId: string, division: DivisionKey): boolean {
  const id = (spkId || '').trim();
  if (!id) return false;
  try {
    const raw = localStorage.getItem('spk_pipeline');
    const list: any[] = raw ? JSON.parse(raw) : [];
    const it = list.find((x) => (x?.idSpk || '').trim() === id);
    if (!it) return false;
    const done = (k: string) => Boolean(it?.[k]);

    switch (division) {
      case 'desain-produksi':
        return !done('selesaiDesainProduksi');
      case 'cutting-pola':
        // masuk cutting ketika belum selesai cutting (tidak perlu cek sebelumnya di sini)
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
        // Simplified: item has finished Foto Produk but belum Pengiriman
        return done('selesaiFotoProduk') && !done('selesaiPengiriman');
      case 'pengiriman':
        // Eligible when Foto Produk selesai dan belum dikirim
        return done('selesaiFotoProduk') && !done('selesaiPengiriman');
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export default { markSelesai, isSpkInDivisionQueue };
