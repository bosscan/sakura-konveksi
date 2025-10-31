import React, { useEffect, useMemo, useState, useRef } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody } from '@mui/material';
import TableExportToolbar from '../../../components/TableExportToolbar';

type Row = { id: string; date: string; ekspedisi: string; resi: string; tujuan: string; amount: number; note?: string };
const STORAGE_KEY = 'pengeluaran_ongkir';
const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const Ongkir: React.FC = () => {
  const [form, setForm] = useState<Row>({ id: '', date: new Date().toISOString().slice(0,10), ekspedisi: '', resi: '', tujuan: '', amount: 0, note: '' });
  const [items, setItems] = useState<Row[]>([]);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const filtered = useMemo(() => items.filter(i => i.date.startsWith(`${month}-`)), [items, month]);
  // Per tanggal aggregation can be added later if needed for charts

  const update = (k: keyof Row, v: string) => {
    if (k === 'amount') setForm((f) => ({ ...f, amount: Number(v || 0) }));
    else setForm((f) => ({ ...f, [k]: v } as any));
  };
  const add = () => {
    if (!form.ekspedisi || !form.resi || !form.amount) return;
    const id = `${form.date}-${Date.now()}`;
    setItems((prev) => [{ ...form, id }, ...prev]);
    setForm({ id: '', date: new Date().toISOString().slice(0,10), ekspedisi: '', resi: '', tujuan: '', amount: 0, note: '' });
  };
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Ongkir Dibayarkan</Typography>
        <Grid container spacing={2} alignItems='center'>
          <Grid size={6}><TextField label='Filter Bulan' type='month' size='small' fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Input Ongkir</Typography>
        <Grid container spacing={2}>
          <Grid size={3}><TextField label='Tanggal' type='date' size='small' fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => update('date', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Ekspedisi' size='small' fullWidth value={form.ekspedisi} onChange={(e) => update('ekspedisi', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='No Resi' size='small' fullWidth value={form.resi} onChange={(e) => update('resi', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Tujuan' size='small' fullWidth value={form.tujuan} onChange={(e) => update('tujuan', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Nominal' type='number' size='small' fullWidth value={form.amount} onChange={(e) => update('amount', e.target.value)} /></Grid>
          <Grid size={6}><TextField label='Catatan' size='small' fullWidth value={form.note} onChange={(e) => update('note', e.target.value)} /></Grid>
          <Grid size={12}><Button variant='contained' onClick={add}>Tambah</Button></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Daftar Ongkir (Bulan Dipilih)</Typography>
        <TableExportToolbar title="Ongkir - Daftar" fileBaseName="ongkir-input" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell>Ekspedisi</TableCell>
                <TableCell>No Resi</TableCell>
                <TableCell>Tujuan</TableCell>
                <TableCell align='right'>Nominal</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align='center'>Tidak ada data</TableCell></TableRow>
              ) : filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.date}</TableCell>
                  <TableCell>{i.ekspedisi}</TableCell>
                  <TableCell>{i.resi}</TableCell>
                  <TableCell>{i.tujuan}</TableCell>
                  <TableCell align='right'>{currency(i.amount)}</TableCell>
                  <TableCell><Button color='error' onClick={() => remove(i.id)}>Hapus</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default Ongkir;
