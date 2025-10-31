import React, { useEffect, useMemo, useState, useRef } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody } from '@mui/material';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type Item = {
  id: string;
  date: string; // YYYY-MM-DD
  category: string; // e.g., Kain, Benang, Aksesoris, dll
  description: string;
  qty: number;
  unit: string; // roll, pcs, m, kg
  price: number; // per unit
  notes?: string;
};

const STORAGE_KEY = 'pengeluaran_belanja_logistik';
const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const BelanjaInput: React.FC = () => {
  const [form, setForm] = useState<Item>({
    id: '', date: new Date().toISOString().slice(0,10), category: '', description: '', qty: 0, unit: 'pcs', price: 0, notes: ''
  });
  const [items, setItems] = useState<Item[]>([]);
  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const total = useMemo(() => form.qty * form.price, [form]);

  const update = (k: keyof Item, v: string) => {
    if (k === 'qty' || k === 'price') setForm((f) => ({ ...f, [k]: Number(v || 0) } as any));
    else setForm((f) => ({ ...f, [k]: v } as any));
  };

  const add = () => {
    if (!form.category || !form.description) return;
    const id = `${form.date}-${Date.now()}`;
    setItems((prev) => [{ ...form, id }, ...prev]);
    setForm((f) => ({ ...f, category: '', description: '', qty: 0, unit: 'pcs', price: 0, notes: '' }));
  };
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Belanja Logistik - Input</Typography>
        <Grid container spacing={2}>
          <Grid size={3}><TextField label='Tanggal' type='date' size='small' fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => update('date', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Kategori' size='small' fullWidth value={form.category} onChange={(e) => update('category', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Uraian' size='small' fullWidth value={form.description} onChange={(e) => update('description', e.target.value)} /></Grid>
          <Grid size={1.5}><TextField label='Qty' type='number' size='small' fullWidth value={form.qty} onChange={(e) => update('qty', e.target.value)} /></Grid>
          <Grid size={1.5}><TextField label='Unit' size='small' fullWidth value={form.unit} onChange={(e) => update('unit', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Harga/Unit' type='number' size='small' fullWidth value={form.price} onChange={(e) => update('price', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Catatan' size='small' fullWidth value={form.notes} onChange={(e) => update('notes', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Total' size='small' fullWidth value={currency(total)} InputProps={{ readOnly: true }} /></Grid>
          <Grid size={12}><Button variant='contained' onClick={add}>Tambah</Button></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Daftar Belanja</Typography>
        <TableExportToolbar title="Belanja Logistik - Daftar" fileBaseName="belanja-logistik-input" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Uraian</TableCell>
                <TableCell align='right'>Qty</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align='right'>Harga/Unit</TableCell>
                <TableCell align='right'>Total</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={8} align='center'>Belum ada data</TableCell></TableRow>
              ) : items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.date}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell>{i.description}</TableCell>
                  <TableCell align='right'>{i.qty}</TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell align='right'>{currency(i.price)}</TableCell>
                  <TableCell align='right'>{currency(i.qty * i.price)}</TableCell>
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

export default BelanjaInput;
