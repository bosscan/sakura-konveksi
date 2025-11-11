// All API calls use the custom backend via HTTP.

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

async function http(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const Api = {
  // Orders
  async postOrder(payload: any) {
    return http('/api/orders/', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Plotting Queue
  async getPlottingQueue() {
    return http('/api/plotting-queue/');
  },
  async postCheckout(payload: { idTransaksi?: string; items: Array<{ idSpk: string; idRekapCustom?: string; idCustom?: string; namaDesain?: string; kuantity?: number; }> }) {
  // Previously used DB-side RPC (checkout_cart); now direct backend endpoint only.
    return http('/api/plotting-queue/checkout/', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Rekap Bordir
  async generateRekap(payload: { rekapId: string; items: Array<{ idSpk: string; idTransaksi?: string; idRekapCustom?: string; idCustom?: string; namaDesain?: string; kuantity?: number; }> }) {
    return http('/api/rekap-bordir/generate/', { method: 'POST', body: JSON.stringify(payload) });
  },
  async getRekapBordir() {
    return http('/api/rekap-bordir/');
  },

  // Pipeline
  async markPipeline(id: number | string, field: string) {
    return http(`/api/spk-pipeline/${id}/mark/`, { method: 'POST', body: JSON.stringify({ field }) });
  },
  async getPipeline() {
    return http('/api/spk-pipeline/');
  },

  // Design queue (for enrichment)
  async getDesignQueue() {
    return http('/api/design-queue/');
  },

  // Landing content
  async uploadLandingImages(files: FileList | File[]) {
    const base = API_BASE;
    const url = `${base}/api/landing/upload/`;
    const fd = new FormData();
    const arr = Array.isArray(files) ? files : Array.from(files);
    arr.forEach((f) => fd.append('files', f));
    const res = await fetch(url, { method: 'POST', body: fd });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    const data = await res.json();
    return data.urls as string[];
  },
};

export default Api;
