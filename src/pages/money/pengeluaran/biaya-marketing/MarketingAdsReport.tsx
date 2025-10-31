import React, { useMemo, useState, useRef } from 'react';
import { Box, Typography, Grid, TextField, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, TableFooter } from '@mui/material';
import { ResponsiveContainer, ComposedChart, Bar as RBar, Line as RLine, XAxis as RXAxis, YAxis as RYAxis, CartesianGrid, Tooltip as RTooltip, Legend as RLegend } from 'recharts';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type Ads = { id: string; date: string; channel: string; campaign: string; spend: number };
const STORAGE_KEY = 'pengeluaran_marketing_ads';
const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const trendline = (values: number[]): number[] => {
  const n = values.length; if (n === 0) return [];
  const xs = values.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXX = xs.reduce((a, b) => a + b * b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * values[i], 0);
  const denom = n * sumXX - sumX * sumX;
  const b = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  return xs.map((x) => a + b * x);
};

const MarketingAdsReport: React.FC = () => {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
  const data: Ads[] = useMemo(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }, []);
  const filtered = useMemo(() => data.filter(i => i.date.startsWith(`${month}-`)), [data, month]);
  const perDate = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(i => map.set(i.date, (map.get(i.date) || 0) + i.spend));
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ date, total }));
  }, [filtered]);

  const cumData = useMemo(() => {
    const d = perDate.map(p => p.total);
    const labels = perDate.map(p => p.date);
    const cum: number[] = [];
    d.reduce((acc, v, i) => { const s = acc + v; cum[i] = s; return s; }, 0);
    const tr = trendline(cum);
    return labels.map((date, i) => ({ date, value: cum[i], trend: tr[i] }));
  }, [perDate]);
  const totalPerDate = useMemo(() => perDate.reduce((a, b) => a + b.total, 0), [perDate]);

  const tableRef = useRef<HTMLTableElement | null>(null);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Marketing Ads - Report</Typography>
        <Grid container spacing={2}><Grid size={6}><TextField label='Bulan' type='month' size='small' fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid></Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Tabel Harian</Typography>
        <TableExportToolbar title="Marketing Ads - Report" fileBaseName="marketing-ads-report" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead><TableRow><TableCell>Tanggal</TableCell><TableCell align='right'>Spend</TableCell></TableRow></TableHead>
            <TableBody>
              {perDate.length === 0 ? (<TableRow><TableCell colSpan={2} align='center'>Tidak ada data</TableCell></TableRow>) : perDate.map(r => (
                <TableRow key={r.date}><TableCell>{r.date}</TableCell><TableCell align='right'>{currency(r.total)}</TableCell></TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(totalPerDate)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Box>

      {cumData.length > 0 && (
        <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
          <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Spend Kumulatif Bulanan + Trendline</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={cumData}>
              <CartesianGrid strokeDasharray="3 3" />
              <RXAxis dataKey="date" />
              <RYAxis tickFormatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
              <RTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
              <RLegend />
              <RBar dataKey="value" name="Kumulatif" fill="#6d4c41" />
              <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default MarketingAdsReport;
