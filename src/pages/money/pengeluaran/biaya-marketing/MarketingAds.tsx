import React, { useEffect, useMemo, useState, useRef } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody } from '@mui/material';
import { ResponsiveContainer, ComposedChart, Bar as RBar, Line as RLine, XAxis as RXAxis, YAxis as RYAxis, CartesianGrid, Tooltip as RTooltip, Legend as RLegend } from 'recharts';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type Ads = { id: string; date: string; channel: string; campaign: string; spend: number; note?: string; };
const STORAGE_KEY = 'pengeluaran_marketing_ads';
const SETTINGS_KEY = 'pengeluaran_marketing_ads_settings';
const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const MarketingAds: React.FC = () => {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
  const [form, setForm] = useState<Ads>({ id: '', date: new Date().toISOString().slice(0,10), channel: '', campaign: '', spend: 0, note: '' });
  const [items, setItems] = useState<Ads[]>([]);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [budget, setBudget] = useState<number>(() => {
    try { return Number(localStorage.getItem(SETTINGS_KEY) || 0); } catch { return 0; }
  });

  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, String(budget || 0)); }, [budget]);

  const filtered = useMemo(() => items.filter(i => i.date.startsWith(`${month}-`)), [items, month]);
  const totalSpend = useMemo(() => filtered.reduce((a,b) => a + b.spend, 0), [filtered]);

  const update = (k: keyof Ads, v: string) => {
    if (k === 'spend') setForm((f) => ({ ...f, spend: Number(v || 0) }));
    else setForm((f) => ({ ...f, [k]: v } as any));
  };
  const add = () => {
    if (!form.channel || !form.campaign || !form.spend) return;
    const id = `${form.date}-${Date.now()}`;
    setItems((prev) => [{ ...form, id }, ...prev]);
    setForm({ id: '', date: new Date().toISOString().slice(0,10), channel: '', campaign: '', spend: 0, note: '' });
  };
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const perDate = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(i => { map.set(i.date, (map.get(i.date) || 0) + i.spend); });
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, total: v }));
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

  // cumData will be built inline where rendered

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Biaya Marketing - Ads</Typography>
        <Grid container spacing={2} alignItems='center'>
          <Grid size={4}><TextField label='Bulan' type='month' size='small' fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid>
          <Grid size={4}><TextField label='Budget Bulanan' type='number' size='small' fullWidth value={budget} onChange={(e) => setBudget(Number(e.target.value || 0))} /></Grid>
          <Grid size={4}><TextField label='Realisasi (Bulan Ini)' size='small' fullWidth value={currency(totalSpend)} InputProps={{ readOnly: true }} /></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Input Pengeluaran Iklan</Typography>
        <Grid container spacing={2}>
          <Grid size={3}><TextField label='Tanggal' type='date' size='small' fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => update('date', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Channel' size='small' fullWidth value={form.channel} onChange={(e) => update('channel', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Campaign' size='small' fullWidth value={form.campaign} onChange={(e) => update('campaign', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Spend' type='number' size='small' fullWidth value={form.spend} onChange={(e) => update('spend', e.target.value)} /></Grid>
          <Grid size={12}><TextField label='Catatan' size='small' fullWidth value={form.note} onChange={(e) => update('note', e.target.value)} /></Grid>
          <Grid size={12}><Button variant='contained' onClick={add}>Tambah</Button></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Daftar Pengeluaran (Bulan Dipilih)</Typography>
        <TableExportToolbar title="Marketing Ads - Daftar" fileBaseName="marketing-ads-input" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Campaign</TableCell>
                <TableCell align='right'>Spend</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} align='center'>Tidak ada data</TableCell></TableRow>
              ) : filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.date}</TableCell>
                  <TableCell>{i.channel}</TableCell>
                  <TableCell>{i.campaign}</TableCell>
                  <TableCell align='right'>{currency(i.spend)}</TableCell>
                  <TableCell><Button color='error' onClick={() => remove(i.id)}>Hapus</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {perDate.length > 0 && (
        <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
          <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Spend Kumulatif Bulanan + Trendline</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={(() => {
              const labels = perDate.map(p => p.date);
              const d = perDate.map(p => p.total);
              const cum: number[] = [];
              d.reduce((acc, v, i) => { const s = acc + v; cum[i] = s; return s; }, 0);
              const tr = trendline(cum);
              return labels.map((date, i) => ({ date, value: cum[i], trend: tr[i] }));
            })()}>
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

export default MarketingAds;
