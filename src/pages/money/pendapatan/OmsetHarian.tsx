import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, TableFooter } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import TableExportToolbar from '../../../components/TableExportToolbar';

type Row = {
  id: number;
  date: string; // YYYY-MM-DD
  slotDp: number;
  omsetDp: number;
  slotPelunasan: number;
  omsetPelunasan: number;
  slotDpl: number;
  omsetDpl: number;
  slotKumulatif: number;
  omsetKumulatif: number;
};

const currency = (n: number) => n.toLocaleString('id-ID');

const OmsetHarian: React.FC = () => {
  const [date, setDate] = useState<string>('');
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === 'omset_pendapatan') setVersion(v => v + 1); };
    window.addEventListener('storage', onStorage);
    const t = setInterval(() => setVersion(v => v + 1), 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(t); };
  }, []);

  const filtered = useMemo(() => {
    if (!date) return [] as Row[];
    const raw = localStorage.getItem('omset_pendapatan');
    const list: Array<{ tanggal: string; tipeTransaksi: string; nominal: number }> = raw ? JSON.parse(raw) : [];
    const ymd = date;
    const day = list.filter(r => (r.tanggal || '').slice(0, 10) === ymd);
    const slotDp = day.filter(r => r.tipeTransaksi?.toLowerCase() === 'dp').length;
    const omsetDp = day.filter(r => r.tipeTransaksi?.toLowerCase() === 'dp').reduce((s, r) => s + (Number(r.nominal) || 0), 0);
    const slotPelunasan = day.filter(r => r.tipeTransaksi?.toLowerCase() === 'pelunasan').length;
    const omsetPelunasan = day.filter(r => r.tipeTransaksi?.toLowerCase() === 'pelunasan').reduce((s, r) => s + (Number(r.nominal) || 0), 0);
    const slotDpl = day.filter(r => r.tipeTransaksi?.toLowerCase() === 'dpl').length;
    const omsetDpl = day.filter(r => r.tipeTransaksi?.toLowerCase() === 'dpl').reduce((s, r) => s + (Number(r.nominal) || 0), 0);
    const row: Row = {
      id: 1,
      date: ymd,
      slotDp,
      omsetDp,
      slotPelunasan,
      omsetPelunasan,
      slotDpl,
      omsetDpl,
      slotKumulatif: slotDp + slotPelunasan + slotDpl,
      omsetKumulatif: omsetDp + omsetPelunasan + omsetDpl,
    };
    return day.length ? [row] : [];
  }, [date, version]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.slotDp += r.slotDp;
        acc.omsetDp += r.omsetDp;
        acc.slotPelunasan += r.slotPelunasan;
        acc.omsetPelunasan += r.omsetPelunasan;
        acc.slotDpl += r.slotDpl;
        acc.omsetDpl += r.omsetDpl;
        acc.slotKumulatif += r.slotKumulatif;
        acc.omsetKumulatif += r.omsetKumulatif;
        return acc;
      },
      { slotDp: 0, omsetDp: 0, slotPelunasan: 0, omsetPelunasan: 0, slotDpl: 0, omsetDpl: 0, slotKumulatif: 0, omsetKumulatif: 0 }
    );
  }, [filtered]);

  const resetFilter = () => setDate('');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Omset Harian</Typography>
        {/* Filter Tanggal */}
        <Grid container spacing={2} alignItems="center">
          <Grid size={6}>
            <TextField label="Tanggal" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={date} onChange={(e) => setDate(e.target.value)} />
          </Grid>
          <Grid size={2}>
            <Button variant='outlined' onClick={resetFilter} fullWidth sx={{ height: 40 }}>Reset</Button>
          </Grid>
        </Grid>

        {/* Tabel Ringkasan Harian */}
        <TableExportToolbar title="Omset Harian" fileBaseName="omset-harian" tableRef={tableRef} />
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label='omset-harian' ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Slot DP</TableCell>
                <TableCell>Omset DP</TableCell>
                <TableCell>Slot Pelunasan</TableCell>
                <TableCell>Omset Pelunasan</TableCell>
                <TableCell>Slot DPL</TableCell>
                <TableCell>Omset DPL</TableCell>
                <TableCell>Slot Komulatif</TableCell>
                <TableCell>Omset Komulatif</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">Tidak ada data pada tanggal dipilih</TableCell>
                </TableRow>
              ) : (
                // satu baris ringkasan harian
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>{totals.slotDp}</TableCell>
                  <TableCell>{currency(totals.omsetDp)}</TableCell>
                  <TableCell>{totals.slotPelunasan}</TableCell>
                  <TableCell>{currency(totals.omsetPelunasan)}</TableCell>
                  <TableCell>{totals.slotDpl}</TableCell>
                  <TableCell>{currency(totals.omsetDpl)}</TableCell>
                  <TableCell>{totals.slotKumulatif}</TableCell>
                  <TableCell>{currency(totals.omsetKumulatif)}</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ fontWeight: 'bold' }}>
                <TableCell>Total</TableCell>
                <TableCell>{totals.slotDp}</TableCell>
                <TableCell>{currency(totals.omsetDp)}</TableCell>
                <TableCell>{totals.slotPelunasan}</TableCell>
                <TableCell>{currency(totals.omsetPelunasan)}</TableCell>
                <TableCell>{totals.slotDpl}</TableCell>
                <TableCell>{currency(totals.omsetDpl)}</TableCell>
                <TableCell>{totals.slotKumulatif}</TableCell>
                <TableCell>{currency(totals.omsetKumulatif)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

        {/* Grafik Komposisi Harian */}
        {filtered.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid size={6}>
              <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Komposisi Slot</Typography>
              <PieChart
                height={260}
                series={[{
                  data: [
                    { id: 0, value: totals.slotDp, label: 'Slot DP' },
                    { id: 1, value: totals.slotPelunasan, label: 'Slot Pelunasan' },
                    { id: 2, value: totals.slotDpl, label: 'Slot DPL' },
                  ],
                  valueFormatter: (item) => item.value?.toLocaleString('id-ID') ?? '0',
                }]}
              />
            </Grid>
            <Grid size={6}>
              <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Komposisi Omset</Typography>
              <PieChart
                height={260}
                series={[{
                  data: [
                    { id: 0, value: totals.omsetDp, label: 'Omset DP' },
                    { id: 1, value: totals.omsetPelunasan, label: 'Omset Pelunasan' },
                    { id: 2, value: totals.omsetDpl, label: 'Omset DPL' },
                  ],
                  valueFormatter: (item) => `Rp ${item.value?.toLocaleString('id-ID') ?? '0'}`,
                }]}
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default OmsetHarian;
 
