import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, TableFooter } from '@mui/material';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type Maint = { id: string; date: string; machine: string; work: string; vendor: string; amount: number; note?: string };
const STORAGE_KEY = 'pengeluaran_maintenance_mesin';
const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const MaintenanceInput: React.FC = () => {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
  const [form, setForm] = useState<Maint>({ id: '', date: new Date().toISOString().slice(0,10), machine: '', work: '', vendor: '', amount: 0, note: '' });
  const [items, setItems] = useState<Maint[]>([]);
  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const filtered = useMemo(() => items.filter(i => i.date?.startsWith(`${month}-`)), [items, month]);
  const totalFiltered = useMemo(() => filtered.reduce((a, b) => a + (b.amount || 0), 0), [filtered]);

  const update = (k: keyof Maint, v: string) => {
    if (k === 'amount') setForm((f) => ({ ...f, amount: Number(v || 0) }));
    else setForm((f) => ({ ...f, [k]: v } as any));
  };
  const add = () => {
    if (!form.machine || !form.work || !form.amount) return;
    const id = `${form.date}-${Date.now()}`;
    setItems((prev) => [{ ...form, id }, ...prev]);
    setForm({ id: '', date: new Date().toISOString().slice(0,10), machine: '', work: '', vendor: '', amount: 0, note: '' });
  };
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Biaya Maintenance Mesin - Input</Typography>
        <Grid container spacing={2} alignItems='center'>
          <Grid size={6}><TextField label='Filter Bulan' type='month' size='small' fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Input Maintenance</Typography>
        <Grid container spacing={2}>
          <Grid size={3}><TextField label='Tanggal' type='date' size='small' fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => update('date', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Mesin' size='small' fullWidth value={form.machine} onChange={(e) => update('machine', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Jenis Pekerjaan/Part' size='small' fullWidth value={form.work} onChange={(e) => update('work', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Vendor/Teknisi' size='small' fullWidth value={form.vendor} onChange={(e) => update('vendor', e.target.value)} /></Grid>
          <Grid size={3}><TextField label='Biaya' type='number' size='small' fullWidth value={form.amount} onChange={(e) => update('amount', e.target.value)} /></Grid>
          <Grid size={9}><TextField label='Catatan' size='small' fullWidth value={form.note} onChange={(e) => update('note', e.target.value)} /></Grid>
          <Grid size={12}><Button variant='contained' onClick={add}>Tambah</Button></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Daftar Maintenance (Bulan Dipilih)</Typography>
        <TableExportToolbar title="Maintenance Mesin - Daftar" fileBaseName="maintenance-mesin-input" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell>Mesin</TableCell>
                <TableCell>Pekerjaan/Part</TableCell>
                <TableCell>Vendor/Teknisi</TableCell>
                <TableCell align='right'>Biaya</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align='center'>Tidak ada data</TableCell></TableRow>
              ) : filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.date}</TableCell>
                  <TableCell>{i.machine}</TableCell>
                  <TableCell>{i.work}</TableCell>
                  <TableCell>{i.vendor}</TableCell>
                  <TableCell align='right'>{currency(i.amount)}</TableCell>
                  <TableCell><Button color='error' onClick={() => remove(i.id)}>Hapus</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(totalFiltered)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default MaintenanceInput;
