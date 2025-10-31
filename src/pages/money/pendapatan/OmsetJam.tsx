import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, TableFooter, MenuItem, Select } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import TableExportToolbar from '../../../components/TableExportToolbar';

type Row = {
  id: number;
  date: string; // YYYY-MM-DD
  hour: string; // HH (00-23)
  slotDp: number;
  omsetDp: number;
  slotPelunasan: number;
  omsetPelunasan: number;
  slotDpl: number;
  omsetDpl: number;
  slotKumulatif: number;
  omsetKumulatif: number;
};

// Data will be read from localStorage('omset_pendapatan')

const currency = (n: number) => n.toLocaleString('id-ID');
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

const OmsetJam: React.FC = () => {
  const [date, setDate] = useState<string>('');
  const [hour, setHour] = useState<string>('');
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === 'omset_pendapatan') setVersion(v => v + 1); };
    window.addEventListener('storage', onStorage);
    const t = setInterval(() => setVersion(v => v + 1), 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(t); };
  }, []);

  const allRows: Row[] = useMemo(() => {
    const raw = localStorage.getItem('omset_pendapatan');
    const list: Array<{ tanggal: string; tipeTransaksi: string; nominal: number }> = raw ? JSON.parse(raw) : [];
    const map = new Map<string, Row>();
    list.forEach((r) => {
      const ymd = (r.tanggal || '').slice(0, 10);
      const hh = (r.tanggal || '').slice(11, 13) || '00';
      if (!ymd) return;
      const key = `${ymd}-${hh}`;
      const tipe = (r.tipeTransaksi || '').toLowerCase();
      const nominal = Number(r.nominal) || 0;
      const cur = map.get(key) || { id: 0, date: ymd, hour: hh, slotDp: 0, omsetDp: 0, slotPelunasan: 0, omsetPelunasan: 0, slotDpl: 0, omsetDpl: 0, slotKumulatif: 0, omsetKumulatif: 0 };
      if (tipe === 'dp') { cur.slotDp += 1; cur.omsetDp += nominal; }
      else if (tipe === 'pelunasan') { cur.slotPelunasan += 1; cur.omsetPelunasan += nominal; }
      else if (tipe === 'dpl') { cur.slotDpl += 1; cur.omsetDpl += nominal; }
      cur.slotKumulatif += 1;
      cur.omsetKumulatif += nominal;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a,b) => (a.date + a.hour).localeCompare(b.date + b.hour)).map((v, i) => ({ ...v, id: i + 1 }));
  }, [version]);

  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (date && r.date !== date) return false;
      if (hour && r.hour !== hour) return false;
      return true;
    });
  }, [date, hour, allRows]);

  // agregasi per jam bila tanggal dipilih
  const perHour = useMemo(() => {
    const map = new Map<string, Row>();
    filtered.forEach((r) => {
      const key = r.hour;
      const cur = map.get(key) || { id: 0, date: r.date, hour: r.hour, slotDp: 0, omsetDp: 0, slotPelunasan: 0, omsetPelunasan: 0, slotDpl: 0, omsetDpl: 0, slotKumulatif: 0, omsetKumulatif: 0 };
      cur.slotDp += r.slotDp;
      cur.omsetDp += r.omsetDp;
      cur.slotPelunasan += r.slotPelunasan;
      cur.omsetPelunasan += r.omsetPelunasan;
      cur.slotDpl += r.slotDpl;
      cur.omsetDpl += r.omsetDpl;
      cur.slotKumulatif += r.slotKumulatif;
      cur.omsetKumulatif += r.omsetKumulatif;
      map.set(key, cur);
    });
    const rows = Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([_, v], i) => ({ ...v, id: i+1 }));
    return rows;
  }, [filtered]);

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

  const resetFilter = () => { setDate(''); setHour(''); };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Omset Per Jam</Typography>

        {/* Filter Tanggal dan Jam */}
        <Grid container spacing={2} alignItems="center">
          <Grid size={6}>
            <TextField label="Tanggal" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={date} onChange={(e) => setDate(e.target.value)} />
          </Grid>
          <Grid size={4}>
            <Select value={hour} onChange={(e) => setHour(e.target.value as string)} displayEmpty fullWidth size='small'>
              <MenuItem value=''>Semua Jam</MenuItem>
              {hours.map(h => (
                <MenuItem key={h} value={h}>{h}:00</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid size={2}>
            <Button variant='outlined' onClick={resetFilter} fullWidth sx={{ height: 40 }}>Reset</Button>
          </Grid>
        </Grid>

  {/* Tabel Per Jam (satu hari) */}
        <TableExportToolbar title="Omset Per Jam" fileBaseName="omset-jam" tableRef={tableRef} />
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label='omset-jam' ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Tanggal</TableCell>
                <TableCell>Jam</TableCell>
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
                  <TableCell colSpan={11} align="center">Tidak ada data untuk filter dipilih</TableCell>
                </TableRow>
              ) : (
                (date ? perHour : filtered).map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.hour}:00</TableCell>
                    <TableCell>{row.slotDp}</TableCell>
                    <TableCell>{currency(row.omsetDp)}</TableCell>
                    <TableCell>{row.slotPelunasan}</TableCell>
                    <TableCell>{currency(row.omsetPelunasan)}</TableCell>
                    <TableCell>{row.slotDpl}</TableCell>
                    <TableCell>{currency(row.omsetDpl)}</TableCell>
                    <TableCell>{row.slotKumulatif}</TableCell>
                    <TableCell>{currency(row.omsetKumulatif)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ fontWeight: 'bold' }}>
                <TableCell>Total</TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
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
      </Box>
      {/* Grafik per Jam untuk hari dipilih */}
      {date && perHour.length > 0 && (
        <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
          <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Grafik per Jam ({date})</Typography>
      <BarChart
            height={280}
            xAxis={[{ scaleType: 'band', data: perHour.map(r => `${r.hour}:00`) }]}
            series={[
        { data: perHour.map(r => r.slotDp), label: 'Slot DP', color: '#1976d2', valueFormatter: (v: number | null) => (v == null ? '0' : v.toLocaleString('id-ID')) },
        { data: perHour.map(r => r.slotPelunasan), label: 'Slot Pelunasan', color: '#9c27b0', valueFormatter: (v: number | null) => (v == null ? '0' : v.toLocaleString('id-ID')) },
        { data: perHour.map(r => r.slotDpl), label: 'Slot DPL', color: '#2e7d32', valueFormatter: (v: number | null) => (v == null ? '0' : v.toLocaleString('id-ID')) },
            ]}
            yAxis={[{ valueFormatter: (v: number | string) => (typeof v === 'number' ? v.toLocaleString('id-ID') : String(v)) }]}
          />
          <BarChart
            height={280}
            xAxis={[{ scaleType: 'band', data: perHour.map(r => `${r.hour}:00`) }]}
            series={[
        { data: perHour.map(r => r.omsetDp), label: 'Omset DP', color: '#42a5f5', valueFormatter: (v: number | null) => `Rp ${(v == null ? 0 : v).toLocaleString('id-ID')}` },
        { data: perHour.map(r => r.omsetPelunasan), label: 'Omset Pelunasan', color: '#ce93d8', valueFormatter: (v: number | null) => `Rp ${(v == null ? 0 : v).toLocaleString('id-ID')}` },
        { data: perHour.map(r => r.omsetDpl), label: 'Omset DPL', color: '#81c784', valueFormatter: (v: number | null) => `Rp ${(v == null ? 0 : v).toLocaleString('id-ID')}` },
            ]}
            yAxis={[{ valueFormatter: (v: number | string) => (typeof v === 'number' ? v.toLocaleString('id-ID') : String(v)) }]}
          />
        </Box>
      )}
    </Box>
  );
};

export default OmsetJam;
 
