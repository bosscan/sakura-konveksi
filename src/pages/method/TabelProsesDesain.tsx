import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

type DesignQueueItem = {
  idRekapCustom: string;
  idSpk?: string;
  idCustom?: string;
  namaDesain?: string;
  status?: string;
};

type CartItem = {
  idRekap: string;
  idCustom?: string;
  idSpk?: string;
  namaDesain?: string;
  kuantity?: number;
};

type PlottingItem = {
  idRekapCustom: string;
  idCustom?: string;
  idSpk?: string;
  namaDesain?: string;
  kuantity?: number;
};

type Row = {
  idRekapDesain: string;
  antrianDesain: number;
  antrianRevisi: number;
  antrianValidasi: number;
  antrianCheckout: number;
  antrianPlotting: number;
};

const columns = [
  { key: 'antrianDesain', label: 'Antrian Desain', color: '#ff5722' },
  { key: 'antrianRevisi', label: 'Antrian Revisi Desain', color: '#ff9800' },
  { key: 'antrianValidasi', label: 'Antrian Validasi Desain', color: '#8bc34a' },
  { key: 'antrianCheckout', label: 'Antrian Checkout Keranjang', color: '#03a9f4' },
  { key: 'antrianPlotting', label: 'Antrian Plotting Bordir', color: '#9c27b0' },
] as const;

const bgFor = (count: number, base: string) => {
  if (count <= 0) return `${base}22`;
  if (count <= 2) return `${base}55`;
  if (count <= 5) return `${base}88`;
  return base;
};
const fgFor = (count: number) => (count > 2 ? '#fff' : '#111');

export default function TabelProsesDesain() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [designQueue, setDesignQueue] = useState<DesignQueueItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [plotting, setPlotting] = useState<PlottingItem[]>([]);
  const [inputQueue, setInputQueue] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  type DialogRow = { idRekapCustom: string; idCustom: string; idSpk: string; quantity: number; namaDesain: string };
  const [dialogRows, setDialogRows] = useState<DialogRow[]>([]);

  useEffect(() => {
    const refresh = () => {
      try {
        const qRaw = localStorage.getItem('design_queue');
        setDesignQueue(qRaw ? JSON.parse(qRaw) : []);
      } catch { setDesignQueue([]); }
      try {
        const kRaw = localStorage.getItem('keranjang');
        setCart(kRaw ? JSON.parse(kRaw) : []);
      } catch { setCart([]); }
      try {
        const pRaw = localStorage.getItem('plotting_rekap_bordir_queue');
        setPlotting(pRaw ? JSON.parse(pRaw) : []);
      } catch { setPlotting([]); }
      try {
        const aRaw = localStorage.getItem('antrian_input_desain');
        setInputQueue(aRaw ? JSON.parse(aRaw) : []);
      } catch { setInputQueue([]); }
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'design_queue' || e.key === 'keranjang' || e.key === 'plotting_rekap_bordir_queue' || e.key === 'antrian_input_desain') refresh();
    };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);

  const rows: Row[] = useMemo(() => {
    const idSet = new Set<string>();
    (designQueue || []).forEach(it => { if (it?.idRekapCustom) idSet.add(it.idRekapCustom); });
    (cart || []).forEach((it: any) => { if (it?.idRekap) idSet.add(it.idRekap); });
    (plotting || []).forEach((it: any) => { if (it?.idRekapCustom) idSet.add(it.idRekapCustom); });

    const norm = (s?: string) => (s || '').trim().toLowerCase();

    const out: Row[] = [];
    for (const id of Array.from(idSet)) {
      const dq = (designQueue || []).filter((it) => it?.idRekapCustom === id);
      const ck = (cart || []).filter((it: any) => it?.idRekap === id);
      const pl = (plotting || []).filter((it: any) => it?.idRekapCustom === id);

      const antrianRevisi = dq.filter((it) => norm(it.status) === 'antrian revisi').length;
      const antrianValidasi = dq.filter((it) => norm(it.status) === 'selesai').length;
      const antrianDesain = dq.filter((it) => {
        const st = norm(it.status);
        return st !== 'antrian revisi' && st !== 'desain di validasi' && st !== 'selesai';
      }).length;
      const antrianCheckout = ck.length;
      const antrianPlotting = pl.length;

      out.push({ idRekapDesain: id, antrianDesain, antrianRevisi, antrianValidasi, antrianCheckout, antrianPlotting });
    }

    out.sort((a, b) => a.idRekapDesain.localeCompare(b.idRekapDesain));
    return out;
  }, [designQueue, cart, plotting]);

  // Totals quantity across all queues per column
  const totalsQty = useMemo(() => {
    // Build idSpk -> qty lookup from keranjang, plotting, and antrian_input_desain
    const qLookup: Record<string, number> = {};
    try {
      (cart || []).forEach((it) => { if (it?.idSpk) qLookup[it.idSpk] = Math.max(qLookup[it.idSpk] || 0, it.kuantity || 0); });
    } catch {}
    try {
      (plotting || []).forEach((it) => { if (it?.idSpk) qLookup[it.idSpk] = Math.max(qLookup[it.idSpk] || 0, it.kuantity || 0); });
    } catch {}
    try {
      (inputQueue || []).forEach((q: any) => {
        const idSpk = q?.idSpk;
        const n = Number(String(q?.quantity ?? '').replace(/[^\d-]/g, ''));
        if (idSpk && !isNaN(n)) qLookup[idSpk] = Math.max(qLookup[idSpk] || 0, n);
      });
    } catch {}

    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const sumQty = (arr: Array<{ idSpk?: string; kuantity?: number }>) => arr.reduce((sum, it) => sum + (it?.idSpk && qLookup[it.idSpk] ? qLookup[it.idSpk] : (it?.kuantity || 0)), 0);

    const dq = designQueue || [];
    const ck = cart || [];
    const pl = plotting || [];

    const antrianDesainQty = sumQty(dq.filter((it) => {
      const st = norm(it.status);
      return st !== 'antrian revisi' && st !== 'desain di validasi' && st !== 'selesai';
    }));
    const antrianRevisiQty = sumQty(dq.filter((it) => norm(it.status) === 'antrian revisi'));
    const antrianValidasiQty = sumQty(dq.filter((it) => norm(it.status) === 'selesai'));
    const antrianCheckoutQty = sumQty(ck as any);
    const antrianPlottingQty = sumQty(pl as any);

    return {
      antrianDesain: antrianDesainQty,
      antrianRevisi: antrianRevisiQty,
      antrianValidasi: antrianValidasiQty,
      antrianCheckout: antrianCheckoutQty,
      antrianPlotting: antrianPlottingQty,
    } as Record<typeof columns[number]['key'], number>;
  }, [designQueue, cart, plotting, inputQueue]);

  // Totals across all rows per column (jumlah SPK pada setiap antrian)
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    columns.forEach((c) => {
      t[c.key] = rows.reduce((sum, r) => sum + ((r as any)[c.key] as number), 0);
    });
    return t as Record<typeof columns[number]['key'], number>;
  }, [rows]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Tabel Proses Desain
      </Typography>

      <TableContainer component={Paper}>
        <Table ref={tableRef} size="small" sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#263238', color: '#fff', zIndex: 2 }}>
                ID Rekap Desain
              </TableCell>
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  sx={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: c.color, color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.25)' }}
                >
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={1 + columns.length} align="center">
                  Tidak ada data
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.idRekapDesain}>
                <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#1f2020ff', zIndex: 1, borderRight: '2px solid #CFD8DC', fontSize: '1rem', py: 1.5 }}>
                  {row.idRekapDesain}
                </TableCell>
                {columns.map((c) => {
                  const val = (row as any)[c.key] as number;
                  return (
                    <TableCell
                      key={c.key}
                      sx={{
                        textAlign: 'center',
                        backgroundColor: bgFor(val || 0, c.color),
                        color: fgFor(val || 0),
                        fontWeight: val > 0 ? 700 : 400,
                        borderLeft: '1px solid rgba(0,0,0,0.06)',
                        cursor: val > 0 ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (!val) return;
                        const id = row.idRekapDesain;
                        const dq = (designQueue || []).filter((it) => it?.idRekapCustom === id);
                        const ck = (cart || []).filter((it) => it?.idRekap === id);
                        const pl = (plotting || []).filter((it) => it?.idRekapCustom === id);
                        const norm = (s?: string) => (s || '').trim().toLowerCase();
                        let selected: Array<any> = [];
                        if (c.key === 'antrianDesain') {
                          selected = dq.filter((it) => {
                            const st = norm(it.status);
                            return st !== 'antrian revisi' && st !== 'desain di validasi' && st !== 'selesai';
                          });
                        } else if (c.key === 'antrianRevisi') {
                          selected = dq.filter((it) => norm(it.status) === 'antrian revisi');
                        } else if (c.key === 'antrianValidasi') {
                          selected = dq.filter((it) => norm(it.status) === 'selesai');
                        } else if (c.key === 'antrianCheckout') {
                          selected = ck;
                        } else if (c.key === 'antrianPlotting') {
                          selected = pl;
                        }
                        // quantity lookup from keranjang/plotting or fallback to antrian_input_desain
                        const qLookup: Record<string, number> = {};
                        (ck || []).forEach((it) => { if (it?.idSpk) qLookup[it.idSpk] = Math.max(qLookup[it.idSpk] || 0, it.kuantity || 0); });
                        (pl || []).forEach((it) => { if (it?.idSpk) qLookup[it.idSpk] = Math.max(qLookup[it.idSpk] || 0, it.kuantity || 0); });
                        try {
                          (inputQueue || []).forEach((q: any) => {
                            const idSpk = q?.idSpk;
                            const n = Number(String(q?.quantity ?? '').replace(/[^\d-]/g, ''));
                            if (idSpk && !isNaN(n)) qLookup[idSpk] = Math.max(qLookup[idSpk] || 0, n);
                          });
                        } catch {}
                        // build dialog rows grouped by idSpk|idCustom
                        const map = new Map<string, DialogRow>();
                        selected.forEach((it: any) => {
                          const idSpk = it?.idSpk || '-';
                          const idCustom = (it?.idCustom || it?.idCustom) || '-';
                          const key = `${idSpk}|${idCustom}`;
                          const qty = idSpk && qLookup[idSpk] ? qLookup[idSpk] : (it?.kuantity || 0);
                          const cur = map.get(key) || { idRekapCustom: id, idCustom, idSpk, quantity: 0, namaDesain: it?.namaDesain || '-' };
                          cur.quantity = Math.max(cur.quantity, qty);
                          cur.namaDesain = cur.namaDesain || it?.namaDesain || '-';
                          map.set(key, cur);
                        });
                        const rows = Array.from(map.values()).sort((a,b)=> a.idSpk.localeCompare(b.idSpk));
                        setDialogTitle(`${id} · ${c.label}`);
                        setDialogRows(rows);
                        setOpenDialog(true);
                      }}
                    >
                      {val > 0 ? val : ''}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {/* Bottom totals row */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#263238', color: '#fff', zIndex: 1 }}>
                Total Antrian SPK
              </TableCell>
              {columns.map((c) => (
                <TableCell key={c.key} sx={{ textAlign: 'center', backgroundColor: c.color, color: '#fff', fontWeight: 700 }}>
                  {totals[c.key] || 0}
                </TableCell>
              ))}
            </TableRow>
            {/* Bottom totals by quantity row */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#263238', color: '#fff', zIndex: 1 }}>
                Total Antrian Quantity
              </TableCell>
              {columns.map((c) => (
                <TableCell key={c.key} sx={{ textAlign: 'center', backgroundColor: c.color, color: '#fff', fontWeight: 700 }}>
                  {totalsQty[c.key] || 0}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent dividers>
          {dialogRows.length === 0 ? (
            <Typography align="center">Tidak ada data</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>ID Rekap Custom</TableCell>
                  <TableCell>ID Custom</TableCell>
                  <TableCell>ID SPK</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Nama Desain</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogRows.map((r, idx) => (
                  <TableRow key={`${r.idCustom}-${r.idSpk}-${idx}`}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{r.idRekapCustom}</TableCell>
                    <TableCell>{r.idCustom}</TableCell>
                    <TableCell>{r.idSpk}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell>{r.namaDesain}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
