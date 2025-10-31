import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Grid, TextField, Chip, Stack, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableFooter } from '@mui/material';
import TableExportToolbar from '../../../components/TableExportToolbar';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend as RLegend, Bar as RBar, Line as RLine } from 'recharts';

type Income = { date: string; omsetDp: number; omsetPelunasan: number; omsetDpl: number };
type Gaji = { date: string; base: number; overtime: number; bonus: number; deduction: number };
type Belanja = { date: string; qty: number; price: number };
type Fee = { date: string; amount: number };
type Ads = { date: string; spend: number };
type Ongkir = { date: string; amount: number };
type Maint = { date: string; amount: number };
type Overhead = { date: string; amount: number };

const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

function trendline(values: number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1; // 1..n
    const y = values[i] ?? 0;
    sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
  }
  const denom = (n * sumXX - sumX * sumX);
  const m = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return Array.from({ length: n }, (_, i) => m * (i + 1) + b);
}

const Konsolidasi: React.FC = () => {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);
  // trigger recompute when source storages change
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (['omset_pendapatan', 'pendapatan_harian', 'pengeluaran_gaji', 'pengeluaran_belanja_logistik', 'pengeluaran_fee_jaringan', 'pengeluaran_marketing_ads', 'pengeluaran_ongkir', 'pengeluaran_maintenance_mesin', 'pengeluaran_overhead_pabrik'].includes(e.key || '')) {
        setVersion(v => v + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    const t = setInterval(() => setVersion(v => v + 1), 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(t); };
  }, []);

  // Load optional pendapatan from localStorage (user can provide externally). Key: 'pendapatan_harian'
  const incomeRaw: Income[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('pendapatan_harian') || '[]'); } catch { return []; }
  }, []);

  // Fallback demo income for selected month (first 5 working days) if no data available
  const fallbackIncome: Income[] = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const list: Income[] = [];
    let day = 1;
    while (list.length < 5 && day <= 28) {
      const d = new Date(y, (m - 1), day);
      if (d.getDay() !== 0) { // skip Sundays
        const base = 100_000 * (1 + list.length); // escalating sample
        list.push({
          date: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          omsetDp: base,
          omsetPelunasan: Math.round(base * 0.6),
          omsetDpl: Math.round(base * 0.8),
        });
      }
      day++;
    }
    return list;
  }, [month]);

  // Aggregate authoritative transactions: localStorage('omset_pendapatan') => Income[] per date
  const txIncome: Income[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('omset_pendapatan');
      const list: Array<{ tanggal: string; tipeTransaksi: string; nominal: number }> = raw ? JSON.parse(raw) : [];
      const prefix = `${month}-`;
      const map = new Map<string, Income>();
      for (const r of list) {
        const date = (r.tanggal || '').slice(0, 10);
        if (!date || !date.startsWith(prefix)) continue;
        const tipe = (r.tipeTransaksi || '').toLowerCase();
        const nominal = Number(r.nominal) || 0;
        const cur = map.get(date) || { date, omsetDp: 0, omsetPelunasan: 0, omsetDpl: 0 };
        if (tipe === 'dp') cur.omsetDp += nominal;
        else if (tipe === 'pelunasan') cur.omsetPelunasan += nominal;
        else if (tipe === 'dpl') cur.omsetDpl += nominal;
        else cur.omsetDpl += 0; // unknown types ignored
        map.set(date, cur);
      }
      return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch { return []; }
  }, [month, version]);

  const incomeM = useMemo(() => {
    // Prefer transaction-based data; fallback to pendapatan_harian; then demo
    const tx = txIncome;
    if (tx.length) return tx;
    const filtered = incomeRaw.filter(r => r.date?.startsWith(`${month}-`));
    const base = (filtered.length ? filtered : fallbackIncome)
      .filter(r => r.date?.startsWith(`${month}-`))
      .sort((a, b) => a.date.localeCompare(b.date));
    return base;
  }, [txIncome, incomeRaw, month, fallbackIncome]);

  // Expense datasets
  const gaji: Gaji[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_gaji') || '[]'); } catch { return []; } }, [version]);
  const belanja: Belanja[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_belanja_logistik') || '[]'); } catch { return []; } }, [version]);
  const fee: Fee[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_fee_jaringan') || '[]'); } catch { return []; } }, [version]);
  const ads: Ads[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_marketing_ads') || '[]'); } catch { return []; } }, [version]);
  const ongkir: Ongkir[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_ongkir') || '[]'); } catch { return []; } }, [version]);
  const maint: Maint[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_maintenance_mesin') || '[]'); } catch { return []; } }, [version]);
  const overhead: Overhead[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_overhead_pabrik') || '[]'); } catch { return []; } }, [version]);

  // Filter per month
  const gajiM = useMemo(() => gaji.filter(i => i.date?.startsWith(`${month}-`)), [gaji, month]);
  const belanjaM = useMemo(() => belanja.filter(i => i.date?.startsWith(`${month}-`)), [belanja, month] as any);
  const feeM = useMemo(() => fee.filter(i => i.date?.startsWith(`${month}-`)), [fee, month]);
  const adsM = useMemo(() => ads.filter(i => i.date?.startsWith(`${month}-`)), [ads, month]);
  const ongkirM = useMemo(() => ongkir.filter(i => i.date?.startsWith(`${month}-`)), [ongkir, month]);
  const maintM = useMemo(() => maint.filter(i => i.date?.startsWith(`${month}-`)), [maint, month]);
  const overheadM = useMemo(() => overhead.filter(i => i.date?.startsWith(`${month}-`)), [overhead, month]);

  // Totals by category
  const totalGaji = useMemo(() => gajiM.reduce((a, g) => a + (g.base + g.overtime + g.bonus - g.deduction), 0), [gajiM]);
  const totalBelanja = useMemo(() => (belanjaM as (Belanja & {date: string})[]).reduce((a, b) => a + b.qty * b.price, 0), [belanjaM]);
  const totalFee = useMemo(() => feeM.reduce((a, f) => a + f.amount, 0), [feeM]);
  const totalAds = useMemo(() => adsM.reduce((a, d) => a + d.spend, 0), [adsM]);
  const totalOngkir = useMemo(() => ongkirM.reduce((a, o) => a + o.amount, 0), [ongkirM]);
  const totalMaint = useMemo(() => maintM.reduce((a, m) => a + m.amount, 0), [maintM]);
  const totalOverhead = useMemo(() => overheadM.reduce((a, ov) => a + ov.amount, 0), [overheadM]);
  const totalExpense = totalGaji + totalBelanja + totalFee + totalAds + totalOngkir + totalMaint + totalOverhead;

  // Income totals
  const incomePerDate = useMemo(() => incomeM.map(r => ({ date: r.date, total: (r.omsetDp || 0) + (r.omsetPelunasan || 0) + (r.omsetDpl || 0) })), [incomeM]);
  const totalIncome = useMemo(() => incomePerDate.reduce((a, r) => a + r.total, 0), [incomePerDate]);

  // Expense per date aggregated
  const expensePerDate = useMemo(() => {
    const map = new Map<string, number>();
    gajiM.forEach(g => { const t = (g.base || 0) + (g.overtime || 0) + (g.bonus || 0) - (g.deduction || 0); map.set(g.date, (map.get(g.date) || 0) + t); });
    (belanjaM as (Belanja & {date: string})[]).forEach(b => { const t = (b.qty || 0) * (b.price || 0); map.set(b.date, (map.get(b.date) || 0) + t); });
    feeM.forEach(f => { map.set(f.date, (map.get(f.date) || 0) + (f.amount || 0)); });
    adsM.forEach(a => { map.set(a.date, (map.get(a.date) || 0) + (a.spend || 0)); });
    ongkirM.forEach(o => { map.set(o.date, (map.get(o.date) || 0) + (o.amount || 0)); });
    maintM.forEach(m => { map.set(m.date, (map.get(m.date) || 0) + (m.amount || 0)); });
    overheadM.forEach(ov => { map.set(ov.date, (map.get(ov.date) || 0) + (ov.amount || 0)); });
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ date, total }));
  }, [gajiM, belanjaM, feeM, adsM, ongkirM, maintM, overheadM]);

  // Merge per-date into consolidated rows
  const allDates = useMemo(() => {
    const set = new Set<string>();
    incomePerDate.forEach(r => set.add(r.date));
    expensePerDate.forEach(r => set.add(r.date));
    return Array.from(set).sort((a,b) => a.localeCompare(b));
  }, [incomePerDate, expensePerDate]);

  const rows = useMemo(() => allDates.map(d => {
    const inc = incomePerDate.find(r => r.date === d)?.total || 0;
    const exp = expensePerDate.find(r => r.date === d)?.total || 0;
    return { date: d, income: inc, expense: exp, net: inc - exp };
  }), [allDates, incomePerDate, expensePerDate]);

  const cumNet = useMemo(() => {
    const arr: number[] = [];
    rows.reduce((acc, r, i) => { const s = acc + r.net; arr[i] = s; return s; }, 0);
    return arr;
  }, [rows]);

  const cumTrend = useMemo(() => trendline(cumNet), [cumNet]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Konsolidasi (Pendapatan vs Pengeluaran)</Typography>
        <Grid container spacing={2} alignItems='center'>
          <Grid size={4}><TextField label='Bulan' type='month' size='small' fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid>
          <Grid size={8}>
            <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
              <Chip label={`Pendapatan: ${currency(totalIncome)}`} color='success' />
              <Chip label={`Pengeluaran: ${currency(totalExpense)}`} color='error' />
              <Chip label={`Net: ${currency(totalIncome - totalExpense)}`} color={(totalIncome - totalExpense) >= 0 ? 'primary' : 'warning'} />
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Tabel Harian</Typography>
        <TableExportToolbar title='Konsolidasi - Tabel Harian' tableRef={tableRef} fileBaseName='konsolidasi-harian' />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell align='right'>Pendapatan</TableCell>
                <TableCell align='right'>Pengeluaran</TableCell>
                <TableCell align='right'>Net</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={4} align='center'>Tidak ada data</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.date}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell align='right'>{currency(r.income)}</TableCell>
                  <TableCell align='right'>{currency(r.expense)}</TableCell>
                  <TableCell align='right' sx={{ fontWeight: 600, color: r.net >= 0 ? 'success.main' : 'warning.main' }}>{currency(r.net)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(totalIncome)}</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(totalExpense)}</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(totalIncome - totalExpense)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Grafik Pendapatan vs Pengeluaran</Typography>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RTooltip formatter={(v: any) => currency(Number(v || 0))} />
            <RLegend />
            <RBar dataKey="income" name="Pendapatan" fill="#42a5f5" />
            <RBar dataKey="expense" name="Pengeluaran" fill="#ef5350" />
            <RLine type="monotone" dataKey="net" name="Net" stroke="#8d6e63" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      {rows.length > 0 && (
        <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
          <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Net Kumulatif + Trendline</Typography>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={rows.map((r, i) => ({ date: r.date, value: cumNet[i], trend: cumTrend[i] }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RTooltip formatter={(v: any) => currency(Number(v || 0))} />
              <RLegend />
              <RBar dataKey="value" name="Net Kumulatif" fill="#6d4c41" />
              <RLine type="monotone" dataKey="trend" name="Trendline" stroke="#ffa726" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default Konsolidasi;
