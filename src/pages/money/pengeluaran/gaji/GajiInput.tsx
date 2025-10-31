import React, { useEffect, useMemo, useState, useRef } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody } from '@mui/material';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type GajiEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  employee: string;
  division: string;
  base: number;
  overtime: number;
  bonus: number;
  deduction: number;
  notes?: string;
};

const STORAGE_KEY = 'pengeluaran_gaji';

const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const GajiInput: React.FC = () => {
  const [form, setForm] = useState<GajiEntry>({
    id: '',
    date: new Date().toISOString().slice(0, 10),
    employee: '',
    division: '',
    base: 0,
    overtime: 0,
    bonus: 0,
    deduction: 0,
    notes: '',
  });
  const [entries, setEntries] = useState<GajiEntry[]>([]);
  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const total = useMemo(() => form.base + form.overtime + form.bonus - form.deduction, [form]);

  const update = (k: keyof GajiEntry, v: string) => {
    if (k === 'base' || k === 'overtime' || k === 'bonus' || k === 'deduction') {
      setForm((f) => ({ ...f, [k]: Number(v || 0) } as any));
    } else {
      setForm((f) => ({ ...f, [k]: v } as any));
    }
  };

  const addEntry = () => {
    if (!form.employee || !form.date) return;
    const id = `${form.date}-${Date.now()}`;
    setEntries((prev) => [{ ...form, id }, ...prev]);
    setForm((f) => ({ ...f, employee: '', division: '', base: 0, overtime: 0, bonus: 0, deduction: 0, notes: '' }));
  };

  const remove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Gaji - Input</Typography>
        <Grid container spacing={2}>
          <Grid size={3}><TextField label="Tanggal" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => update('date', e.target.value)} /></Grid>
          <Grid size={3}><TextField label="Karyawan" size="small" fullWidth value={form.employee} onChange={(e) => update('employee', e.target.value)} /></Grid>
          <Grid size={3}><TextField label="Divisi" size="small" fullWidth value={form.division} onChange={(e) => update('division', e.target.value)} /></Grid>
          <Grid size={3}><TextField label="Gaji Pokok" size="small" type="number" fullWidth value={form.base} onChange={(e) => update('base', e.target.value)} /></Grid>
          <Grid size={3}><TextField label="Lembur" size="small" type="number" fullWidth value={form.overtime} onChange={(e) => update('overtime', e.target.value)} /></Grid>
          <Grid size={3}><TextField label="Bonus/Insentif" size="small" type="number" fullWidth value={form.bonus} onChange={(e) => update('bonus', e.target.value)} /></Grid>
          <Grid size={3}><TextField label="Potongan" size="small" type="number" fullWidth value={form.deduction} onChange={(e) => update('deduction', e.target.value)} /></Grid>
          <Grid size={3}><TextField label="Catatan" size="small" fullWidth value={form.notes} onChange={(e) => update('notes', e.target.value)} /></Grid>
          <Grid size={3}><TextField label="Total" size="small" fullWidth value={currency(total)} InputProps={{ readOnly: true }} /></Grid>
          <Grid size={12}><Button variant='contained' onClick={addEntry}>Tambah</Button></Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Entri Terbaru</Typography>
        <TableExportToolbar title="Gaji - Entri Terbaru" fileBaseName="gaji-input" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell>Karyawan</TableCell>
                <TableCell>Divisi</TableCell>
                <TableCell align="right">Gaji Pokok</TableCell>
                <TableCell align="right">Lembur</TableCell>
                <TableCell align="right">Bonus</TableCell>
                <TableCell align="right">Potongan</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow><TableCell colSpan={9} align='center'>Belum ada data</TableCell></TableRow>
              ) : entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.date}</TableCell>
                  <TableCell>{e.employee}</TableCell>
                  <TableCell>{e.division}</TableCell>
                  <TableCell align='right'>{currency(e.base)}</TableCell>
                  <TableCell align='right'>{currency(e.overtime)}</TableCell>
                  <TableCell align='right'>{currency(e.bonus)}</TableCell>
                  <TableCell align='right'>{currency(e.deduction)}</TableCell>
                  <TableCell align='right'>{currency(e.base + e.overtime + e.bonus - e.deduction)}</TableCell>
                  <TableCell><Button color='error' onClick={() => remove(e.id)}>Hapus</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default GajiInput;
