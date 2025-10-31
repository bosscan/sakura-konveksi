import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

type PipelineItem = {
  idSpk: string;
  idTransaksi: string;
  namaDesain?: string;
  kuantity?: number;
  checkoutAt?: string; // waktu checkout keranjang (fallback dihitung dari rekap/terbit/input)
  selesaiPlottingBordir?: string;
  selesaiDesainProduksi?: string;
  selesaiCuttingPola?: string;
  selesaiStockBordir?: string;
  selesaiBordir?: string;
  selesaiSetting?: string;
  selesaiStockJahit?: string;
  selesaiJahit?: string;
  selesaiFinishing?: string;
  selesaiFotoProduk?: string;
  selesaiStockNt?: string;
  selesaiPelunasan?: string;
  selesaiPengiriman?: string;
};

type ProcessRow = {
  idRekapProduksi: string;
  desainProduksi: number;
  cuttingPola: number;
  stockBordir: number;
  bordir: number;
  setting: number;
  stockJahit: number;
  jahit: number;
  finishing: number;
  fotoProduk: number;
  stockIdTransaksi: number;
  pelunasan: number;
  pengiriman: number;
  totalAntrianRekap: number;
  totalQuantityRekap: number;
};

const divisions = [
  { key: 'desainProduksi', label: 'Desain Produksi', color: '#ff5722' },
  { key: 'cuttingPola', label: 'Cutting Pola', color: '#ff9800' },
  { key: 'stockBordir', label: 'Stock Bordir', color: '#ffc107' },
  { key: 'bordir', label: 'Bordir', color: '#ffeb3b' },
  { key: 'setting', label: 'Setting', color: '#8bc34a' },
  { key: 'stockJahit', label: 'Stock Jahit', color: '#4caf50' },
  { key: 'jahit', label: 'Jahit', color: '#009688' },
  { key: 'finishing', label: 'Finishing', color: '#00bcd4' },
  { key: 'fotoProduk', label: 'Foto Produk', color: '#03a9f4' },
  { key: 'stockIdTransaksi', label: 'Stock ID Transaksi', color: '#2196f3' },
  { key: 'pelunasan', label: 'Pelunasan', color: '#3f51b5' },
  { key: 'pengiriman', label: 'Pengiriman', color: '#9c27b0' },
] as const;

// compute background color based on count (alpha tint of the base color)
const bgFor = (count: number, base: string) => {
  if (count <= 0) return `${base}22`; // very light tint
  if (count <= 2) return `${base}55`;
  if (count <= 5) return `${base}88`;
  return base; // solid
};

const fgFor = (count: number) => (count > 2 ? '#fff' : '#111');

const isDone = (it: PipelineItem, key: keyof PipelineItem) => Boolean((it as any)[key]);

const deriveIdRp = (idSpk?: string): string => {
  if (!idSpk) return '';
  try {
    const raw = localStorage.getItem('production_recap_map');
    const map = raw ? JSON.parse(raw) : {};
    const v = map[idSpk];
    if (v != null) return String(v).padStart(7, '0');
  } catch {}
  return '';
};

export default function TabelProsesProduksi() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [rekapCreatedAt, setRekapCreatedAt] = useState<Map<string, string>>(new Map()); // idSpk -> createdAt rekap
  const [spkTerbitMap, setSpkTerbitMap] = useState<Record<string, string>>({}); // idSpk -> tglSpkTerbit
  const [inputDateMap, setInputDateMap] = useState<Record<string, string>>({}); // idSpk -> tanggalInput/desain
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  type DialogRow = { namaDesain: string; idTransaksi: string; idSpk: string; jumlahSpk: number; quantity: number };
  const [dialogRows, setDialogRows] = useState<DialogRow[]>([]);
  const [dialogDivisionKey, setDialogDivisionKey] = useState<string>('');

  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem('spk_pipeline');
        const list: PipelineItem[] = raw ? JSON.parse(raw) : [];
        setPipeline(list);
        // Load auxiliary maps for checkout baseline
        try {
          const rbRaw = localStorage.getItem('method_rekap_bordir');
          const rbList: any[] = rbRaw ? JSON.parse(rbRaw) : [];
          const map = new Map<string, string>();
          (rbList || []).forEach((rb: any) => {
            const createdAt = rb?.createdAt;
            (rb?.items || []).forEach((it: any) => { if (it?.idSpk && createdAt) map.set(it.idSpk, createdAt); });
          });
          setRekapCreatedAt(map);
        } catch {}
        try {
          const stRaw = localStorage.getItem('spk_terbit_map');
          setSpkTerbitMap(stRaw ? JSON.parse(stRaw) : {});
        } catch { setSpkTerbitMap({}); }
        try {
          const adRaw = localStorage.getItem('antrian_input_desain');
          const adList: any[] = adRaw ? JSON.parse(adRaw) : [];
          const imap: Record<string, string> = {};
          (adList || []).forEach((it: any) => {
            const t = it?.tanggalInput || it?.input_date || it?.inputDate || it?.createdAt;
            if (it?.idSpk && typeof t === 'string') imap[it.idSpk] = t;
          });
          setInputDateMap(imap);
        } catch { setInputDateMap({}); }
      } catch {
        setPipeline([]);
      }
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if ([
        'spk_pipeline',
        'method_rekap_bordir',
        'spk_terbit_map',
        'antrian_input_desain'
      ].includes(e.key || '')) refresh();
    };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);

  const byTransaksi = useMemo(() => {
    const map = new Map<string, PipelineItem[]>();
    (pipeline || []).forEach((it) => {
      const k = it.idTransaksi || '-';
      const arr = map.get(k) || [];
      arr.push(it);
      map.set(k, arr);
    });
    return map;
  }, [pipeline]);

  // Group by id rekap produksi (derived from idSpk)
  const byRekap = useMemo(() => {
    const map = new Map<string, PipelineItem[]>();
    (pipeline || []).forEach((it) => {
      const rp = deriveIdRp(it.idSpk);
      const arr = map.get(rp) || [];
      arr.push(it);
      map.set(rp, arr);
    });
    return map;
  }, [pipeline]);

  // Helpers to check membership per division and any-queue
  const isMemberOfDivision = (it: PipelineItem, divKey: typeof divisions[number]['key']): boolean => {
    switch (divKey) {
      case 'desainProduksi':
        return !isDone(it, 'selesaiDesainProduksi');
      case 'cuttingPola':
        return !isDone(it, 'selesaiCuttingPola');
      case 'stockBordir':
        return isDone(it, 'selesaiDesainProduksi') && isDone(it, 'selesaiCuttingPola') && !isDone(it, 'selesaiStockBordir');
      case 'bordir':
        return isDone(it, 'selesaiStockBordir') && !isDone(it, 'selesaiBordir');
      case 'setting':
        return isDone(it, 'selesaiBordir') && !isDone(it, 'selesaiSetting');
      case 'stockJahit':
        return isDone(it, 'selesaiSetting') && !isDone(it, 'selesaiStockJahit');
      case 'jahit':
        return isDone(it, 'selesaiStockJahit') && !isDone(it, 'selesaiJahit');
      case 'finishing':
        return isDone(it, 'selesaiJahit') && !isDone(it, 'selesaiFinishing');
      case 'fotoProduk':
        return isDone(it, 'selesaiFinishing') && !isDone(it, 'selesaiFotoProduk');
      case 'stockIdTransaksi': {
        if (!isDone(it, 'selesaiFotoProduk') || isDone(it, 'selesaiPengiriman')) return false;
        const group = byTransaksi.get(it.idTransaksi) || [];
        if (group.length <= 1) return false;
        const allFotoDone = group.every((g) => isDone(g, 'selesaiFotoProduk'));
        return !allFotoDone;
      }
      case 'pelunasan':
        return isDone(it, 'selesaiStockNt') && !isDone(it, 'selesaiPelunasan');
      case 'pengiriman': {
        if (isDone(it, 'selesaiPengiriman')) return false;
        const group = byTransaksi.get(it.idTransaksi) || [];
        const allFotoDone = group.length > 0 && group.every((g) => isDone(g, 'selesaiFotoProduk'));
        return allFotoDone && isDone(it, 'selesaiFotoProduk');
      }
      default:
        return false;
    }
  };

  const isInAnyQueueGlobal = (it: PipelineItem): boolean => {
    if (!isDone(it, 'selesaiDesainProduksi')) return true;
    if (!isDone(it, 'selesaiCuttingPola')) return true;
    if (isDone(it, 'selesaiDesainProduksi') && isDone(it, 'selesaiCuttingPola') && !isDone(it, 'selesaiStockBordir')) return true;
    if (isDone(it, 'selesaiStockBordir') && !isDone(it, 'selesaiBordir')) return true;
    if (isDone(it, 'selesaiBordir') && !isDone(it, 'selesaiSetting')) return true;
    if (isDone(it, 'selesaiSetting') && !isDone(it, 'selesaiStockJahit')) return true;
    if (isDone(it, 'selesaiStockJahit') && !isDone(it, 'selesaiJahit')) return true;
    if (isDone(it, 'selesaiJahit') && !isDone(it, 'selesaiFinishing')) return true;
    if (isDone(it, 'selesaiFinishing') && !isDone(it, 'selesaiFotoProduk')) return true;
    if (!isDone(it, 'selesaiPengiriman')) {
      const group = byTransaksi.get(it.idTransaksi) || [];
      if (isDone(it, 'selesaiFotoProduk')) {
        if (group.length > 1 && !group.every((g) => isDone(g, 'selesaiFotoProduk'))) return true;
        const allFotoDone = group.length > 0 && group.every((g) => isDone(g, 'selesaiFotoProduk'));
        if (allFotoDone) return true;
      }
    }
    if (isDone(it, 'selesaiStockNt') && !isDone(it, 'selesaiPelunasan')) return true;
    return false;
  };

  const rows: ProcessRow[] = useMemo(() => {
    const computeCount = (items: PipelineItem[], divKey: typeof divisions[number]['key']) => {
      switch (divKey) {
        case 'desainProduksi':
        case 'cuttingPola':
        case 'stockBordir':
        case 'bordir':
        case 'setting':
        case 'stockJahit':
        case 'jahit':
        case 'finishing':
        case 'fotoProduk':
        case 'stockIdTransaksi':
        case 'pelunasan':
        case 'pengiriman':
          return items.filter((it) => isMemberOfDivision(it, divKey)).length;
        default:
          return 0;
      }
    };

    const rowsOut: ProcessRow[] = [];
    for (const [rp, items] of byRekap.entries()) {
      const queuedSet = new Set<string>();
      items.forEach((it) => { if (isInAnyQueueGlobal(it)) queuedSet.add(it.idSpk); });
      const totalQtyQueued = items.reduce((sum, it) => sum + (isInAnyQueueGlobal(it) ? (it.kuantity || 0) : 0), 0);

      const row: ProcessRow = {
        idRekapProduksi: rp,
        desainProduksi: computeCount(items, 'desainProduksi'),
        cuttingPola: computeCount(items, 'cuttingPola'),
        stockBordir: computeCount(items, 'stockBordir'),
        bordir: computeCount(items, 'bordir'),
        setting: computeCount(items, 'setting'),
        stockJahit: computeCount(items, 'stockJahit'),
        jahit: computeCount(items, 'jahit'),
        finishing: computeCount(items, 'finishing'),
        fotoProduk: computeCount(items, 'fotoProduk'),
        stockIdTransaksi: computeCount(items, 'stockIdTransaksi'),
        pelunasan: computeCount(items, 'pelunasan'),
        pengiriman: computeCount(items, 'pengiriman'),
        totalAntrianRekap: queuedSet.size,
        totalQuantityRekap: totalQtyQueued,
      };
      rowsOut.push(row);
    }

    // Stable sort by idRekapProduksi asc (numeric suffix)
    rowsOut.sort((a, b) => a.idRekapProduksi.localeCompare(b.idRekapProduksi));
    return rowsOut;
  }, [byRekap, byTransaksi]);

  // Totals per division across all rows
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    divisions.forEach((d) => {
      t[d.key] = rows.reduce((sum, r) => sum + ((r as any)[d.key] as number), 0);
    });
    return t as Record<typeof divisions[number]['key'], number>;
  }, [rows]);

  // Totals quantity per division across the entire pipeline (sum of kuantity in each division's queue)
  const totalsQty = useMemo(() => {
    const sumQty = (arr: PipelineItem[]) => arr.reduce((s, it) => s + (it.kuantity || 0), 0);
    const all = pipeline || [];
    const result = {
      desainProduksi: sumQty(all.filter((it) => !isDone(it, 'selesaiDesainProduksi'))),
      cuttingPola: sumQty(all.filter((it) => !isDone(it, 'selesaiCuttingPola'))),
      stockBordir: sumQty(all.filter((it) => isDone(it, 'selesaiDesainProduksi') && isDone(it, 'selesaiCuttingPola') && !isDone(it, 'selesaiStockBordir'))),
      bordir: sumQty(all.filter((it) => isDone(it, 'selesaiStockBordir') && !isDone(it, 'selesaiBordir'))),
      setting: sumQty(all.filter((it) => isDone(it, 'selesaiBordir') && !isDone(it, 'selesaiSetting'))),
      stockJahit: sumQty(all.filter((it) => isDone(it, 'selesaiSetting') && !isDone(it, 'selesaiStockJahit'))),
      jahit: sumQty(all.filter((it) => isDone(it, 'selesaiStockJahit') && !isDone(it, 'selesaiJahit'))),
      finishing: sumQty(all.filter((it) => isDone(it, 'selesaiJahit') && !isDone(it, 'selesaiFinishing'))),
      fotoProduk: sumQty(all.filter((it) => isDone(it, 'selesaiFinishing') && !isDone(it, 'selesaiFotoProduk'))),
      stockIdTransaksi: sumQty(all.filter((it) => {
        if (!isDone(it, 'selesaiFotoProduk') || isDone(it, 'selesaiPengiriman')) return false;
        const group = byTransaksi.get(it.idTransaksi) || [];
        if (group.length <= 1) return false;
        const allFotoDone = group.every((g) => isDone(g, 'selesaiFotoProduk'));
        return !allFotoDone;
      })),
      pelunasan: sumQty(all.filter((it) => isDone(it, 'selesaiStockNt') && !isDone(it, 'selesaiPelunasan'))),
      pengiriman: sumQty(all.filter((it) => {
        if (isDone(it, 'selesaiPengiriman')) return false;
        const group = byTransaksi.get(it.idTransaksi) || [];
        const allFotoDone = group.length > 0 && group.every((g) => isDone(g, 'selesaiFotoProduk'));
        return allFotoDone && isDone(it, 'selesaiFotoProduk');
      })),
    } as Record<typeof divisions[number]['key'], number>;
    return result;
  }, [pipeline, byTransaksi]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Tabel Proses Produksi
      </Typography>

      <TableContainer component={Paper}>
        <Table ref={tableRef} size="small" sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#263238', color: '#fff', zIndex: 2 }}>
                ID Rekap Produksi
              </TableCell>
              {divisions.map((d) => (
                <TableCell
                  key={d.key}
                  sx={{
                    fontWeight: 'bold',
                    textAlign: 'center',
                    backgroundColor: d.color,
                    color: '#fff',
                    borderLeft: '1px solid rgba(255,255,255,0.25)'
                  }}
                >
                  {d.label}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#455A64', color: '#fff' }}>
                Total Antrian Rekap
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#37474F', color: '#fff' }}>
                Total Quantity Rekap
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
      {rows.length === 0 && (
              <TableRow>
  <TableCell colSpan={1 + divisions.length + 2} align="center">
                  Tidak ada data
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.idRekapProduksi}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', py: 1.5, position: 'sticky', left: 0, backgroundColor: '#090909ff', zIndex: 1, borderRight: '2px solid #CFD8DC' }}>
                  {row.idRekapProduksi}
                </TableCell>
                {divisions.map((d) => {
                  const val = (row as any)[d.key] as number;
                  return (
                    <TableCell
                      key={d.key}
                      sx={{
                        textAlign: 'center',
                        backgroundColor: bgFor(val || 0, d.color),
                        color: fgFor(val || 0),
                        fontWeight: val > 0 ? 700 : 400,
                        borderLeft: '1px solid rgba(0,0,0,0.06)',
                        cursor: val > 0 ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (!val) return;
                        const items = byRekap.get(row.idRekapProduksi) || [];
                        const selected = items.filter((it) => isMemberOfDivision(it, d.key));
                        const map = new Map<string, { idSpk: string; idTransaksi: string; count: number; qty: number; namaDesain: string }>();
                        selected.forEach((it) => {
                          const key = `${it.idTransaksi || '-'}|${it.idSpk || '-'}`;
                          const cur = map.get(key) || { idSpk: it.idSpk || '-', idTransaksi: it.idTransaksi || '-', count: 0, qty: 0, namaDesain: it.namaDesain || '-' };
                          cur.count += 1;
                          cur.qty += (it.kuantity || 0);
                          if (!cur.namaDesain && it.namaDesain) cur.namaDesain = it.namaDesain;
                          map.set(key, cur);
                        });
                        const rows: DialogRow[] = Array.from(map.values()).map((v) => ({
                          namaDesain: v.namaDesain || '-',
                          idTransaksi: v.idTransaksi,
                          idSpk: v.idSpk,
                          jumlahSpk: v.count,
                          quantity: v.qty,
                        }));
                        rows.sort((a,b)=> a.idSpk.localeCompare(b.idSpk));
                        setDialogTitle(`${row.idRekapProduksi} · ${d.label}`);
                        setDialogRows(rows);
                        setDialogDivisionKey(d.key);
                        setOpenDialog(true);
                      }}
                    >
                      {val > 0 ? val : ''}
                    </TableCell>
                  );
                })}
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, cursor: row.totalAntrianRekap > 0 ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (row.totalAntrianRekap <= 0) return;
                    const items = byRekap.get(row.idRekapProduksi) || [];
                    const selected = items.filter((it) => isInAnyQueueGlobal(it));
                    const map = new Map<string, { idSpk: string; idTransaksi: string; count: number; qty: number; namaDesain: string }>();
                    selected.forEach((it) => {
                      const key = `${it.idTransaksi || '-'}|${it.idSpk || '-'}`;
                      const cur = map.get(key) || { idSpk: it.idSpk || '-', idTransaksi: it.idTransaksi || '-', count: 0, qty: 0, namaDesain: it.namaDesain || '-' };
                      cur.count += 1;
                      cur.qty += (it.kuantity || 0);
                      if (!cur.namaDesain && it.namaDesain) cur.namaDesain = it.namaDesain;
                      map.set(key, cur);
                    });
                    const rows: DialogRow[] = Array.from(map.values()).map((v) => ({
                      namaDesain: v.namaDesain || '-',
                      idTransaksi: v.idTransaksi,
                      idSpk: v.idSpk,
                      jumlahSpk: v.count,
                      quantity: v.qty,
                    }));
                    rows.sort((a,b)=> a.idSpk.localeCompare(b.idSpk));
                    setDialogTitle(`${row.idRekapProduksi} · Total Antrian Rekap`);
                    setDialogRows(rows);
                    setDialogDivisionKey('totalAntrianRekap');
                    setOpenDialog(true);
                  }}
                >
                  {row.totalAntrianRekap}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', fontWeight: 700, cursor: row.totalQuantityRekap > 0 ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (row.totalQuantityRekap <= 0) return;
                    const items = byRekap.get(row.idRekapProduksi) || [];
                    const selected = items.filter((it) => isInAnyQueueGlobal(it));
                    const map = new Map<string, { idSpk: string; idTransaksi: string; count: number; qty: number; namaDesain: string }>();
                    selected.forEach((it) => {
                      const key = `${it.idTransaksi || '-'}|${it.idSpk || '-'}`;
                      const cur = map.get(key) || { idSpk: it.idSpk || '-', idTransaksi: it.idTransaksi || '-', count: 0, qty: 0, namaDesain: it.namaDesain || '-' };
                      cur.count += 1;
                      cur.qty += (it.kuantity || 0);
                      if (!cur.namaDesain && it.namaDesain) cur.namaDesain = it.namaDesain;
                      map.set(key, cur);
                    });
                    const rows: DialogRow[] = Array.from(map.values()).map((v) => ({
                      namaDesain: v.namaDesain || '-',
                      idTransaksi: v.idTransaksi,
                      idSpk: v.idSpk,
                      jumlahSpk: v.count,
                      quantity: v.qty,
                    }));
                    rows.sort((a,b)=> a.idSpk.localeCompare(b.idSpk));
                    setDialogTitle(`${row.idRekapProduksi} · Total Quantity Rekap`);
                    setDialogRows(rows);
                    setDialogDivisionKey('totalQuantityRekap');
                    setOpenDialog(true);
                  }}
                >
                  {row.totalQuantityRekap}
                </TableCell>
              </TableRow>
            ))}
            {/* Bottom totals row */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#263238', color: '#fff', zIndex: 1 }}>
                Total Antrian Divisi
              </TableCell>
              {divisions.map((d) => (
                <TableCell
                  key={d.key}
                  sx={{ textAlign: 'center', backgroundColor: d.color, color: '#fff', fontWeight: 700 }}
                >
                  {totals[d.key] || 0}
                </TableCell>
              ))}
              <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                {rows.reduce((sum, r) => sum + r.totalAntrianRekap, 0)}
              </TableCell>
              <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                {rows.reduce((sum, r) => sum + r.totalQuantityRekap, 0)}
              </TableCell>
            </TableRow>
            {/* Bottom-most totals by quantity row */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#263238', color: '#fff', zIndex: 1 }}>
                Total Quantity Divisi
              </TableCell>
              {divisions.map((d) => (
                <TableCell
                  key={d.key}
                  sx={{ textAlign: 'center', backgroundColor: d.color, color: '#fff', fontWeight: 700 }}
                >
                  {totalsQty[d.key] || 0}
                </TableCell>
              ))}
              {/* Non-division rightmost columns left intentionally blank */}
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent dividers>
          {dialogRows.length === 0 ? (
            <Typography align="center">Tidak ada data</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Nama Desain</TableCell>
                  <TableCell>ID Transaksi</TableCell>
                  <TableCell>ID SPK</TableCell>
                  <TableCell>Jumlah SPK</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Lama Waktu Divisi</TableCell>
                  <TableCell>Lama Waktu Komulatif</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogRows.map((r, idx) => {
                  // Ambil item pipeline untuk timestamp
                  const item = pipeline.find(p => p.idSpk === r.idSpk);
                  const now = Date.now();
                  const parseTs = (s?: string) => { if(!s) return undefined; const t = Date.parse(s); return isNaN(t)? undefined : t; };
                  // Baseline komulatif: HARUS dari checkout keranjang; jika tidak ada, fallback sebelum plotting (terbit/input)
                  const getKumulatifBaseTs = (it?: PipelineItem) => {
                    if (!it) return undefined;
                    return (
                      parseTs((it as any).checkoutAt) ||
                      parseTs(spkTerbitMap[it.idSpk]) ||
                      parseTs(inputDateMap[it.idSpk])
                    );
                  };
                  // Baseline plotting: selesai plotting atau waktu rekap dibuat
                  const getPlottingBaseTs = (it?: PipelineItem) => {
                    if (!it) return undefined;
                    return (
                      parseTs((it as any).selesaiPlottingBordir) ||
                      parseTs(rekapCreatedAt.get(it.idSpk))
                    );
                  };
                  // Peta field selesai sesuai urutan divisi
                  const order: Array<{key:string; field?: keyof PipelineItem}> = [
                    {key:'desainProduksi', field:'selesaiDesainProduksi'},
                    {key:'cuttingPola', field:'selesaiCuttingPola'},
                    {key:'stockBordir', field:'selesaiStockBordir'},
                    {key:'bordir', field:'selesaiBordir'},
                    {key:'setting', field:'selesaiSetting'},
                    {key:'stockJahit', field:'selesaiStockJahit'},
                    {key:'jahit', field:'selesaiJahit'},
                    {key:'finishing', field:'selesaiFinishing'},
                    {key:'fotoProduk', field:'selesaiFotoProduk'},
                    {key:'stockIdTransaksi', field:'selesaiStockNt'},
                    {key:'pelunasan', field:'selesaiPelunasan'},
                    {key:'pengiriman', field:'selesaiPengiriman'},
                  ];
                  const idxDiv = order.findIndex(o=> o.key===dialogDivisionKey);
                  let lamaDivisi = '';
                  if(idxDiv>=0 && item){
                    // Lama waktu divisi: dari selesai divisi sebelumnya (atau checkout) hingga SAAT INI
                    const prevField = idxDiv>0 ? order[idxDiv-1].field : undefined;
                    // Khusus untuk Desain Produksi & Cutting Pola, baseline adalah selesai plotting/rekap
                    const usePlottingBase = idxDiv === 0 || idxDiv === 1;
                    const prevTs = usePlottingBase
                      ? (getPlottingBaseTs(item) || parseTs(prevField? (item as any)[prevField]: undefined) || getKumulatifBaseTs(item))
                      : (parseTs(prevField? (item as any)[prevField]: undefined) || getKumulatifBaseTs(item));
                    if(prevTs){
                      const diffMs = now - prevTs;
                      if(diffMs>0) lamaDivisi = formatDuration(diffMs);
                    }
                  }
                  // Lama komulatif: dari checkoutAt hingga SAAT INI
                  let lamaKumulatif = '';
                  if(item){
                    const checkoutTs = getKumulatifBaseTs(item);
                    if(checkoutTs){
                      const diffMs = now - checkoutTs;
                      if(diffMs>0) lamaKumulatif = formatDuration(diffMs);
                    }
                  }
                  return (
                    <TableRow key={`${r.idTransaksi}-${r.idSpk}-${idx}`}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{r.namaDesain || '-'}</TableCell>
                      <TableCell>{r.idTransaksi}</TableCell>
                      <TableCell>{r.idSpk}</TableCell>
                      <TableCell>{r.jumlahSpk}</TableCell>
                      <TableCell>{r.quantity}</TableCell>
                      <TableCell>{lamaDivisi}</TableCell>
                      <TableCell>{lamaKumulatif}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// Format durasi ms -> "X Hari, Y Jam, Z Menit" sesuai permintaan
function formatDuration(ms: number): string {
  if (ms <= 0) return '0 Menit';
  const totalMinutes = Math.floor(ms / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  // selalu tampilkan menit agar konsisten dengan contoh
  parts.push(`${minutes} Menit`);
  return parts.join(', ');
}
