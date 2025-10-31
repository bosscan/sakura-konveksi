/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';

type UrgentItem = { idSpk: string; deadline: string; note: string; createdAt: string; updatedAt: string };
const STORAGE_KEY = 'spk_urgent_list';

type SpkDetails = { idSpk: string; namaDesain?: string; jenisProduk?: string; kuantity?: number; deadlineAwal?: string };

const selesaiFields: { key: string; label: string }[] = [
  { key: 'selesaiPlottingBordir', label: 'Plotting Bordir' },
  { key: 'selesaiDesainProduksi', label: 'Desain Produksi' },
  { key: 'selesaiCuttingPola', label: 'Cutting Pola' },
  { key: 'selesaiStockBordir', label: 'Stock Bordir' },
  { key: 'selesaiBordir', label: 'Bordir' },
  { key: 'selesaiSetting', label: 'Setting' },
  { key: 'selesaiStockJahit', label: 'Stock Jahit' },
  { key: 'selesaiJahit', label: 'Jahit' },
  { key: 'selesaiFinishing', label: 'Finishing' },
  { key: 'selesaiFotoProduk', label: 'Foto Produk' },
  { key: 'selesaiStockNt', label: 'Stock NT' },
  { key: 'selesaiPelunasan', label: 'Pelunasan' },
  { key: 'selesaiPengiriman', label: 'Pengiriman' },
];

export default function ListSpkUrgent() {
  const [items, setItems] = useState<UrgentItem[]>([]);
  const [q, setQ] = useState('');

  const parseSmart = (value?: string) => {
    if (!value) return null as Date | null;
    const s = String(value);
    // If 'YYYY-MM-DD', build Date in local TZ to avoid UTC shift issues
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]); const mm = Number(m[2]); const d = Number(m[3]);
      return new Date(y, mm - 1, d, 0, 0, 0);
    }
    const dt = new Date(s);
    if (isNaN(dt.getTime())) return null;
    return dt;
  };

  // Format to Asia/Jakarta (WIB): dd-mm-yyyy HH:mm:ss
  const formatWIB = (value?: string) => {
    const d = parseSmart(value);
    if (!d) return value || '-';
    const date = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d).replace(/\//g, '-');
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
    return `${date} ${time}`;
  };

  const load = () => {
    try { setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { setItems([]); }
  };
  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) load(); };
    window.addEventListener('storage', onStorage);
    const t = setInterval(load, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(t); };
  }, []);

  const spkMap: Record<string, SpkDetails> = useMemo(() => {
    // Build a map of idSpk -> details from known sources
    const merge: Record<string, SpkDetails> = {};
    const robustMapGet = (mapObj: Record<string, any>, key: string) => {
      if (!mapObj || !key) return undefined;
      if (mapObj[key] != null) return mapObj[key];
      const t = key.trim();
      if (t && mapObj[t] != null) return mapObj[t];
      const num = (s: string) => (s || '').replace(/\D+/g, '');
      const nk = num(key);
      if (nk) {
        const k = Object.keys(mapObj).find((kk) => num(kk) === nk);
        if (k) return mapObj[k];
      }
      const k2 = Object.keys(mapObj).find((kk) => kk.trim().toLowerCase() === t.toLowerCase());
      return k2 ? mapObj[k2] : undefined;
    };
    const push = (it: any) => {
      if (!it?.idSpk) return;
      const id = String(it.idSpk).trim();
      const cur = merge[id] || { idSpk: id };
      const namaDesain = it?.namaDesain || it?.designName || '';
      const jenisProduk = it?.jenisProduk || it?.product || it?.tipeTransaksi || '';
      const qty = Number(it?.kuantity ?? it?.quantity ?? 0) || 0;
      merge[id] = {
        idSpk: id,
        namaDesain: cur.namaDesain || namaDesain,
        jenisProduk: cur.jenisProduk || jenisProduk,
        kuantity: Math.max(cur.kuantity || 0, qty),
      };
    };
    let pipeline: any[] = [];
    let queue: any[] = [];
    try { queue = JSON.parse(localStorage.getItem('plotting_rekap_bordir_queue') || '[]') as any[]; queue.forEach(push); } catch {}
    try { pipeline = JSON.parse(localStorage.getItem('spk_pipeline') || '[]') as any[]; pipeline.forEach(push); } catch {}
    try { (JSON.parse(localStorage.getItem('antrian_input_desain') || '[]') as any[]).forEach(push); } catch {}
    try {
      const dqueue: any[] = JSON.parse(localStorage.getItem('design_queue') || '[]') || [];
      const dmap: Record<string, any> = {};
      dqueue.forEach((d) => { if (d?.idSpk) dmap[d.idSpk] = d; });
      Object.entries(dmap).forEach(([id, it]) => push({ idSpk: id, ...it }));
    } catch {}
    try { (JSON.parse(localStorage.getItem('keranjang') || '[]') as any[]).forEach(push); } catch {}
    try {
      const dsMap: Record<string, any> = JSON.parse(localStorage.getItem('spk_design') || '{}') || {};
      Object.entries(dsMap).forEach(([id, it]) => push({ idSpk: id, ...it }));
    } catch {}

    // Build helper maps for deadline calculation
    const adList: any[] = (() => { try { return JSON.parse(localStorage.getItem('antrian_input_desain') || '[]') as any[]; } catch { return []; } })();
    const adMap: Record<string, any> = {}; (adList || []).forEach((it) => { if (it?.idSpk) adMap[String(it.idSpk).trim()] = it; });
    const cartList: any[] = (() => { try { return JSON.parse(localStorage.getItem('keranjang') || '[]') as any[]; } catch { return []; } })();
    const cartMap: Record<string, any> = {}; (cartList || []).forEach((it) => { if (it?.idSpk) cartMap[String(it.idSpk).trim()] = it; });
    const pipelineMap: Record<string, any> = {}; (pipeline || []).forEach((it) => { if (it?.idSpk) pipelineMap[String(it.idSpk).trim()] = it; });
    const spkOrdersMap: Record<string, any> = (() => { try { return JSON.parse(localStorage.getItem('spk_orders') || '{}') as Record<string, any>; } catch { return {}; } })();

    const calcDeadlineAwal = (id: string) => {
      const src = adMap[id] || {};
      const ord = robustMapGet(spkOrdersMap, id) || {};
      const pipe = pipelineMap[id] || {};
      const cart = cartMap[id] || {};
      const explicit = pipe?.deadline || pipe?.deadlineKonsumen || src?.deadline || ord?.deadline || cart?.deadline;
      if (explicit) return explicit;
      const tglOrder = src?.tanggalInput || ord?.tanggalInput || pipe?.tglInputPesanan || pipe?.tanggalInput || src?.input_date || src?.inputDate || src?.createdAt;
      if (!tglOrder) return '';
      try {
        const base = new Date(tglOrder);
        if (isNaN(base.getTime())) return '';
        const d = new Date(base.getTime());
        d.setDate(d.getDate() + 30);
        return d.toISOString();
      } catch { return ''; }
    };

    // Attach deadlineAwal per id
    Object.keys(merge).forEach((id) => {
      merge[id].deadlineAwal = calcDeadlineAwal(id);
    });
    return merge;
  }, [items]);

  const spkStatusMap: Record<string, string> = useMemo(() => {
    // Build minimal status info from pipeline data
    const statusById: Record<string, any> = {};
    const push = (it: any) => {
      if (!it?.idSpk) return;
      const id = String(it.idSpk).trim();
      const cur = statusById[id] || {};
      selesaiFields.forEach(({ key }) => {
        if (it[key]) cur[key] = it[key];
      });
      statusById[id] = cur;
    };
    try { (JSON.parse(localStorage.getItem('spk_pipeline') || '[]') as any[]).forEach(push); } catch {}
    try { (JSON.parse(localStorage.getItem('plotting_rekap_bordir_queue') || '[]') as any[]).forEach(push); } catch {}
    try {
      // Derive selesaiPlottingBordir from method_rekap_bordir createdAt like SpkOnProses
      const rbList: any[] = JSON.parse(localStorage.getItem('method_rekap_bordir') || '[]') || [];
      rbList.forEach((rb) => {
        const createdAt = rb?.createdAt;
        (rb?.items || []).forEach((it: any) => {
          if (!it?.idSpk || !createdAt) return;
          const id = String(it.idSpk).trim();
          const cur = statusById[id] || {};
          cur['selesaiPlottingBordir'] = createdAt;
          statusById[id] = cur;
        });
      });
    } catch {}

    const getStatus = (id: string) => {
      const row = statusById[id] || {};
      for (let i = selesaiFields.length - 1; i >= 0; i--) {
        const k = selesaiFields[i].key;
        if (row[k]) return `Selesai ${selesaiFields[i].label}`;
      }
      return 'Proses';
    };
    const out: Record<string, string> = {};
    Object.keys(spkMap).forEach((id) => { out[id] = getStatus(id); });
    return out;
  }, [spkMap]);

  const remove = (idSpk: string) => {
    const next = items.filter((it) => (it.idSpk || '').trim() !== idSpk.trim());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setItems(next);
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items
      .filter((it) => {
        if (!term) return true;
        const d = spkMap[it.idSpk] || {};
        return [it.idSpk, d.namaDesain, d.jenisProduk, String(d.kuantity || '')].join(' ').toLowerCase().includes(term);
      })
      .sort((a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || ''))
      .reverse();
  }, [items, q, spkMap]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>List SPK Urgent</Typography>
      <Paper sx={{ p: 2 }}>
        <TextField placeholder="Cari (ID/Nama/Jenis/QTY)" size="small" sx={{ mb: 1 }} value={q} onChange={(e) => setQ(e.target.value)} />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>ID SPK Urgent</TableCell>
              <TableCell>Nama Desain</TableCell>
              <TableCell>Jenis Produk</TableCell>
              <TableCell align="right">Kuantity</TableCell>
              <TableCell>Deadline Awal</TableCell>
              <TableCell>Deadline Urgent</TableCell>
              <TableCell>Status Pesanan</TableCell>
              <TableCell>Keterangan</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">Tidak ada data</TableCell></TableRow>
            ) : rows.map((it, idx) => {
              const d = spkMap[it.idSpk] || {};
              return (
                <TableRow key={`${it.idSpk}-${idx}`}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{it.idSpk}</TableCell>
                  <TableCell>{d.namaDesain || '-'}</TableCell>
                  <TableCell>{d.jenisProduk || '-'}</TableCell>
                  <TableCell align="right">{d.kuantity ?? '-'}</TableCell>
                  <TableCell>{formatWIB(d.deadlineAwal)}</TableCell>
                  <TableCell>{formatWIB(it.deadline)}</TableCell>
                  <TableCell>{spkStatusMap[it.idSpk] || 'Proses'}</TableCell>
                  <TableCell>{it.note || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => remove(it.idSpk)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
