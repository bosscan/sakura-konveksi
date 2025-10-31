import React, { useMemo, useState, useRef } from 'react';
import { Box, Typography, Grid, TextField, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Chip, Stack, TableFooter } from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip, Legend as RLegend } from 'recharts';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type Gaji = { date: string; base: number; overtime: number; bonus: number; deduction: number };
type Belanja = { date: string; qty: number; price: number };
type Fee = { date: string; amount: number };
type Ads = { date: string; spend: number };
type Ongkir = { date: string; amount: number };
type Maint = { date: string; amount: number };
type Overhead = { date: string; amount: number };

const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const PengeluaranKumulatif: React.FC = () => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);

  // Load all expense datasets from localStorage
  const gaji: Gaji[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_gaji') || '[]'); } catch { return []; } }, []);
  const belanja: Belanja[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_belanja_logistik') || '[]'); } catch { return []; } }, []);
  const fee: Fee[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_fee_jaringan') || '[]'); } catch { return []; } }, []);
  const ads: Ads[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_marketing_ads') || '[]'); } catch { return []; } }, []);
  const ongkir: Ongkir[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_ongkir') || '[]'); } catch { return []; } }, []);
  const maint: Maint[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_maintenance_mesin') || '[]'); } catch { return []; } }, []);
  const overhead: Overhead[] = useMemo(() => { try { return JSON.parse(localStorage.getItem('pengeluaran_overhead_pabrik') || '[]'); } catch { return []; } }, []);

  // Filter by selected month
  const gajiM = useMemo(() => gaji.filter(i => i.date?.startsWith(`${month}-`)), [gaji, month]);
  const belanjaM = useMemo(() => belanja.filter(i => i.date?.startsWith(`${month}-`)), [belanja, month] as any);
  const feeM = useMemo(() => fee.filter(i => i.date?.startsWith(`${month}-`)), [fee, month]);
  const adsM = useMemo(() => ads.filter(i => i.date?.startsWith(`${month}-`)), [ads, month]);
  const ongkirM = useMemo(() => ongkir.filter(i => i.date?.startsWith(`${month}-`)), [ongkir, month]);
  const maintM = useMemo(() => maint.filter(i => i.date?.startsWith(`${month}-`)), [maint, month]);
  const overheadM = useMemo(() => overhead.filter(i => i.date?.startsWith(`${month}-`)), [overhead, month]);

  // Per-date totals across all categories
  const perDate = useMemo(() => {
    const map = new Map<string, number>();
    gajiM.forEach(g => {
      const t = (g.base || 0) + (g.overtime || 0) + (g.bonus || 0) - (g.deduction || 0);
      map.set(g.date, (map.get(g.date) || 0) + t);
    });
    (belanjaM as (Belanja & {date: string})[]).forEach(b => {
      const t = (b.qty || 0) * (b.price || 0);
      map.set(b.date, (map.get(b.date) || 0) + t);
    });
    feeM.forEach(f => { map.set(f.date, (map.get(f.date) || 0) + (f.amount || 0)); });
    adsM.forEach(a => { map.set(a.date, (map.get(a.date) || 0) + (a.spend || 0)); });
    ongkirM.forEach(o => { map.set(o.date, (map.get(o.date) || 0) + (o.amount || 0)); });
    maintM.forEach(m => { map.set(m.date, (map.get(m.date) || 0) + (m.amount || 0)); });
    overheadM.forEach(ov => { map.set(ov.date, (map.get(ov.date) || 0) + (ov.amount || 0)); });
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ date, total }));
  }, [gajiM, belanjaM, feeM, adsM, ongkirM, maintM, overheadM]);

  // Totals per category (for summary chips)
  const totalGaji = useMemo(() => gajiM.reduce((a, g) => a + (g.base + g.overtime + g.bonus - g.deduction), 0), [gajiM]);
  const totalBelanja = useMemo(() => (belanjaM as (Belanja & {date: string})[]).reduce((a, b) => a + b.qty * b.price, 0), [belanjaM]);
  const totalFee = useMemo(() => feeM.reduce((a, f) => a + f.amount, 0), [feeM]);
  const totalAds = useMemo(() => adsM.reduce((a, d) => a + d.spend, 0), [adsM]);
  const totalOngkir = useMemo(() => ongkirM.reduce((a, o) => a + o.amount, 0), [ongkirM]);
  const totalMaint = useMemo(() => maintM.reduce((a, m) => a + m.amount, 0), [maintM]);
  const totalOverhead = useMemo(() => overheadM.reduce((a, ov) => a + ov.amount, 0), [overheadM]);
  const grandTotal = totalGaji + totalBelanja + totalFee + totalAds + totalOngkir + totalMaint + totalOverhead;

  // Pie colors
  const COLORS = ['#6d4c41', '#1e88e5', '#43a047', '#f4511e', '#8e24aa', '#00acc1', '#9e9d24', '#5e35b1'];

  // Rows for category summary table
  const byCategory = useMemo(() => {
    const rows = [
      { name: 'Gaji', value: totalGaji },
      { name: 'Belanja Logistik', value: totalBelanja },
      { name: 'Fee Jaringan', value: totalFee },
      { name: 'Biaya Marketing (Ads)', value: totalAds },
      { name: 'Ongkir Dibayarkan', value: totalOngkir },
      { name: 'Maintenance Mesin', value: totalMaint },
      { name: 'Overhead Pabrik', value: totalOverhead },
    ];
    return rows.map(r => ({ ...r, pct: grandTotal > 0 ? (r.value / grandTotal) * 100 : 0 }));
  }, [totalGaji, totalBelanja, totalFee, totalAds, totalOngkir, totalMaint, totalOverhead, grandTotal]);

  const ringkasanRef = useRef<HTMLTableElement | null>(null);
  const gabunganRef = useRef<HTMLTableElement | null>(null);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Pengeluaran Kumulatif (Semua Jenis)</Typography>
        <Grid container spacing={2} alignItems='center'>
          <Grid size={4}><TextField label='Bulan' type='month' size='small' fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid>
          <Grid size={8}>
            <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
              <Chip label={`Gaji: ${currency(totalGaji)}`} color='default' />
              <Chip label={`Belanja: ${currency(totalBelanja)}`} color='default' />
              <Chip label={`Fee: ${currency(totalFee)}`} color='default' />
              <Chip label={`Marketing: ${currency(totalAds)}`} color='default' />
              <Chip label={`Ongkir: ${currency(totalOngkir)}`} color='default' />
              <Chip label={`Maintenance: ${currency(totalMaint)}`} color='default' />
              <Chip label={`Overhead: ${currency(totalOverhead)}`} color='default' />
              <Chip label={`Total: ${currency(grandTotal)}`} color='primary' />
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Ringkasan per Kategori</Typography>
        <TableExportToolbar title="Pengeluaran - Ringkasan per Kategori" fileBaseName="pengeluaran-ringkasan-kategori" tableRef={ringkasanRef} />
        <TableContainer component={Paper}>
          <Table ref={ringkasanRef}>
            <TableHead>
              <TableRow>
                <TableCell>Kategori</TableCell>
                <TableCell align='right'>Total</TableCell>
                <TableCell align='right'>Persentase</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {byCategory.length === 0 ? (
                <TableRow><TableCell colSpan={3} align='center'>Tidak ada data</TableCell></TableRow>
              ) : byCategory.map((r) => (
                <TableRow key={r.name}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell align='right'>{currency(r.value)}</TableCell>
                  <TableCell align='right'>{r.pct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(grandTotal)}</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>100%</TableCell>
              </TableRow>
            </TableFooter>
    </Table>
  </TableContainer>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Tabel Harian (Gabungan)</Typography>
        <TableExportToolbar title="Pengeluaran - Tabel Harian Gabungan" fileBaseName="pengeluaran-harian-gabungan" tableRef={gabunganRef} />
        <TableContainer component={Paper}>
          <Table ref={gabunganRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell align='right'>Total Pengeluaran</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {perDate.length === 0 ? (
                <TableRow><TableCell colSpan={2} align='center'>Tidak ada data</TableCell></TableRow>
              ) : perDate.map((r) => (
                <TableRow key={r.date}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell align='right'>{currency(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(perDate.reduce((a, b) => a + b.total, 0))}</TableCell>
              </TableRow>
            </TableFooter>
    </Table>
  </TableContainer>
      </Box>

      {grandTotal > 0 && (
        <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
          <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Distribusi Pengeluaran per Kategori (Persentase)</Typography>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={byCategory.filter(r => r.value > 0)}
                dataKey="pct"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={(e: any) => {
                  const name = e?.payload?.name ?? e?.name;
                  const pct = typeof e?.payload?.pct === 'number' ? e.payload.pct : (typeof e?.percent === 'number' ? e.percent * 100 : 0);
                  const nominal = typeof e?.payload?.value === 'number' ? e.payload.value : 0;
                  return `${name} ${pct.toFixed(1)}% (${currency(nominal)})`;
                }}
              >
                {byCategory.filter(r => r.value > 0).map((entry, index) => (
                  <Cell key={`slice-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RTooltip formatter={(value: number, name: string, props: any) => {
                if (props?.payload) {
                  const v = props.payload.value as number;
                  const pct = props.payload.pct as number;
                  return [ `${pct.toFixed(1)}% (${currency(v)})`, name ];
                }
                return [ `${(value as number).toFixed(1)}%`, name ];
              }} />
              <RLegend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default PengeluaranKumulatif;
