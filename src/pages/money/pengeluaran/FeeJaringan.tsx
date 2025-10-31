import React, { useEffect, useMemo, useState, useRef } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody } from '@mui/material';
import TableExportToolbar from '../../../components/TableExportToolbar';

type Fee = {
  id: string;
  date: string; // YYYY-MM-DD
  partner: string; // reseller/afiliasi
  description: string;
  amount: number;
};

const STORAGE_KEY = 'pengeluaran_fee_jaringan';
const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const FeeJaringan: React.FC = () => {
  const [form, setForm] = useState<Fee>({ id: '', date: new Date().toISOString().slice(0,10), partner: '', description: '', amount: 0 });
  const [items, setItems] = useState<Fee[]>([]);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const filtered = useMemo(() => items.filter(i => i.date.startsWith(`${month}-`)), [items, month]);

  const update = (k: keyof Fee, v: string) => {
    if (k === 'amount') setForm((f) => ({ ...f, amount: Number(v || 0) }));
    else setForm((f) => ({ ...f, [k]: v } as any));
  };
  const add = () => {
    if (!form.partner || !form.amount) return;
    const id = `${form.date}-${Date.now()}`;
    setItems((prev) => [{ ...form, id }, ...prev]);
    setForm({ id: '', date: new Date().toISOString().slice(0,10), partner: '', description: '', amount: 0 });
  };
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Fee Jaringan</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={6}><TextField label='Filter Bulan' type='month' size='small' fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Input Fee</Typography>
        <Grid container spacing={2}>
          <Grid size={3}><TextField label='Tanggal' type='date' size='small' fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => update('date', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Partner' size='small' fullWidth value={form.partner} onChange={(e) => update('partner', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Uraian' size='small' fullWidth value={form.description} onChange={(e) => update('description', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Nominal' type='number' size='small' fullWidth value={form.amount} onChange={(e) => update('amount', e.target.value)} /></Grid>
          <Grid size={12}><Button variant='contained' onClick={add}>Tambah</Button></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Daftar Fee (Bulan Dipilih)</Typography>
        <TableExportToolbar title="Fee Jaringan - Daftar" fileBaseName="fee-jaringan-input" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell>Partner</TableCell>
                <TableCell>Uraian</TableCell>
                <TableCell align='right'>Nominal</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} align='center'>Tidak ada data</TableCell></TableRow>
              ) : filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.date}</TableCell>
                  <TableCell>{i.partner}</TableCell>
                  <TableCell>{i.description}</TableCell>
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

export default FeeJaringan;
