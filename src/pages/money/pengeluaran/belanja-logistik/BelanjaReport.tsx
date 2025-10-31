import React, { useMemo, useState, useRef } from "react";
import { Box, Typography, Grid, TextField, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, TableFooter } from '@mui/material';
import { ResponsiveContainer, ComposedChart, Bar as RBar, Line as RLine, XAxis as RXAxis, YAxis as RYAxis, CartesianGrid, Tooltip as RTooltip, Legend as RLegend } from 'recharts';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type Item = {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
};

const STORAGE_KEY = 'pengeluaran_belanja_logistik';
const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const BelanjaReport: React.FC = () => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);

  const items: Item[] = useMemo(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  }, []);

  const filtered = useMemo(() => items.filter(i => i.date.startsWith(`${month}-`)), [items, month]);

  const perDate = useMemo(() => {
    const map = new Map<string, { total: number }>();
    filtered.forEach(i => {
      const key = i.date;
      const total = i.qty * i.price;
      map.set(key, { total: (map.get(key)?.total || 0) + total });
    });
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, total: v.total }));
  }, [filtered]);

  const perCategory = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(i => {
      const key = i.category || 'Lainnya';
      map.set(key, (map.get(key) || 0) + i.qty * i.price);
    });
    return Array.from(map.entries()).sort((a,b) => b[1] - a[1]).map(([category, total]) => ({ category, total }));
  }, [filtered]);

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
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Belanja Logistik - Report</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={6}><TextField label="Bulan" type="month" size="small" fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Tabel Harian</Typography>
        <TableExportToolbar title="Belanja Logistik - Tabel Harian" fileBaseName="belanja-logistik-report" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell align='right'>Total Belanja</TableCell>
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
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(totalPerDate)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Box>

      {perCategory.length > 0 && (
        <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
          <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Belanja per Kategori (Bulan Ini)</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={perCategory.map(c => ({ name: c.category, value: c.total }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <RXAxis dataKey="name" />
              <RYAxis tickFormatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
              <RTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
              <RLegend />
              <RBar dataKey="value" name="Total" fill="#1976d2" />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      )}

      {cumData.length > 0 && (
        <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
          <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Belanja Kumulatif Bulanan + Trendline</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={cumData}>
              <CartesianGrid strokeDasharray="3 3" />
              <RXAxis dataKey="date" />
              <RYAxis tickFormatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
              <RTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
              <RLegend />
              <RBar dataKey="value" name="Belanja Kumulatif" fill="#6d4c41" />
              <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default BelanjaReport;
