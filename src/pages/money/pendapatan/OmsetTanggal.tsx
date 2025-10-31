import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, TableFooter } from '@mui/material';
// (using Recharts for composed charts)
import { ResponsiveContainer, ComposedChart, Bar as RBar, Line as RLine, XAxis as RXAxis, YAxis as RYAxis, CartesianGrid, Tooltip as RTooltip, Legend as RLegend } from 'recharts';
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

// Data will be derived from localStorage('omset_pendapatan')

const currency = (n: number) => n.toLocaleString('id-ID');

const OmsetTanggal: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
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
      const date = (r.tanggal || '').slice(0, 10);
      if (!date) return;
      const tipe = (r.tipeTransaksi || '').toLowerCase();
      const nominal = Number(r.nominal) || 0;
      const cur = map.get(date) || { id: 0, date, slotDp: 0, omsetDp: 0, slotPelunasan: 0, omsetPelunasan: 0, slotDpl: 0, omsetDpl: 0, slotKumulatif: 0, omsetKumulatif: 0 };
      if (tipe === 'dp') { cur.slotDp += 1; cur.omsetDp += nominal; }
      else if (tipe === 'pelunasan') { cur.slotPelunasan += 1; cur.omsetPelunasan += nominal; }
      else if (tipe === 'dpl') { cur.slotDpl += 1; cur.omsetDpl += nominal; }
      cur.slotKumulatif += 1;
      cur.omsetKumulatif += nominal;
      map.set(date, cur);
    });
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([_, v], i) => ({ ...v, id: i + 1 }));
  }, [version]);

  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      const d = r.date;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [startDate, endDate, allRows]);

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

  // agregasi per tanggal (group by date) agar relevan dengan rentang tanggal
  const perDate = filtered;

  const resetFilter = () => { setStartDate(''); setEndDate(''); };

  // util: linear trendline y = a + b*x for x=0..n-1
  const trendline = (values: number[]): number[] => {
    const n = values.length;
    if (n === 0) return [];
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

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Omset Per Tanggal</Typography>
        {/* Filter Tanggal */}
        <Grid container spacing={2} alignItems="center">
          <Grid size={6}>
            <TextField label="Dari" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Grid>
          <Grid size={6}>
            <TextField label="Sampai" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Grid>
          <Grid size={2}>
            <Button variant='outlined' onClick={resetFilter} fullWidth sx={{ height: 40 }}>Reset</Button>
          </Grid>
        </Grid>

  {/* Tabel Per Tanggal */}
        <TableExportToolbar title="Omset Per Tanggal" fileBaseName="omset-tanggal" tableRef={tableRef} />
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label='omset-tanggal' ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Tanggal</TableCell>
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
                  <TableCell colSpan={10} align="center">Tidak ada data pada rentang tanggal dipilih</TableCell>
                </TableRow>
              ) : (
                perDate.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.date}</TableCell>
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
      {/* Grafik Per Tanggal */}
      {perDate.length > 0 && (
        <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
          <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Grafik Per Tanggal</Typography>
          {/* Slot per jenis dan Omset per jenis dengan trendline (gabung bar + line menggunakan Recharts) */}
          {(() => {
            const labels = perDate.map(r => r.date);
            // Slot
            const sDP = perDate.map(r => r.slotDp);
            const sPelunasan = perDate.map(r => r.slotPelunasan);
            const sDpl = perDate.map(r => r.slotDpl);
            const tSDP = trendline(sDP);
            const tSPelunasan = trendline(sPelunasan);
            const tSDpl = trendline(sDpl);
            const slotDPData = labels.map((d, i) => ({ date: d, value: sDP[i], trend: tSDP[i] }));
            const slotPelData = labels.map((d, i) => ({ date: d, value: sPelunasan[i], trend: tSPelunasan[i] }));
            const slotDplData = labels.map((d, i) => ({ date: d, value: sDpl[i], trend: tSDpl[i] }));
            const dataDP = perDate.map(r => r.omsetDp);
            const dataPelunasan = perDate.map(r => r.omsetPelunasan);
            const dataDpl = perDate.map(r => r.omsetDpl);
            const tDP = trendline(dataDP);
            const tPelunasan = trendline(dataPelunasan);
            const tDpl = trendline(dataDpl);
            const omsetDPData = labels.map((d, i) => ({ date: d, value: dataDP[i], trend: tDP[i] }));
            const omsetPelData = labels.map((d, i) => ({ date: d, value: dataPelunasan[i], trend: tPelunasan[i] }));
            const omsetDplData = labels.map((d, i) => ({ date: d, value: dataDpl[i], trend: tDpl[i] }));

            // Cumulative series across the selected date range
            const dailySlotTotal = perDate.map(r => r.slotDp + r.slotPelunasan + r.slotDpl);
            const dailyOmsetTotal = perDate.map(r => r.omsetDp + r.omsetPelunasan + r.omsetDpl);
            const cumSlot: number[] = [];
            const cumOmset: number[] = [];
            dailySlotTotal.reduce((acc, v, i) => { const s = acc + v; cumSlot[i] = s; return s; }, 0);
            dailyOmsetTotal.reduce((acc, v, i) => { const s = acc + v; cumOmset[i] = s; return s; }, 0);
            const slotCumTrend = trendline(cumSlot);
            const omsetCumTrend = trendline(cumOmset);
            const slotCumData = labels.map((d, i) => ({ date: d, value: cumSlot[i], trend: slotCumTrend[i] }));
            const omsetCumData = labels.map((d, i) => ({ date: d, value: cumOmset[i], trend: omsetCumTrend[i] }));
            return (
              <>
                <Typography variant='subtitle1' sx={{ mt: 1, mb: 1, fontWeight: 600 }}>Slot DP</Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={slotDPData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <RXAxis dataKey="date" />
                    <RYAxis tickFormatter={(v: number) => v.toLocaleString('id-ID')} />
                    <RTooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
                    <RLegend />
                    <RBar dataKey="value" name="Slot DP" fill="#1976d2" />
                    <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>

                <Typography variant='subtitle1' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Slot Pelunasan</Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={slotPelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <RXAxis dataKey="date" />
                    <RYAxis tickFormatter={(v: number) => v.toLocaleString('id-ID')} />
                    <RTooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
                    <RLegend />
                    <RBar dataKey="value" name="Slot Pelunasan" fill="#9c27b0" />
                    <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>

                <Typography variant='subtitle1' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Slot DPL</Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={slotDplData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <RXAxis dataKey="date" />
                    <RYAxis tickFormatter={(v: number) => v.toLocaleString('id-ID')} />
                    <RTooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
                    <RLegend />
                    <RBar dataKey="value" name="Slot DPL" fill="#2e7d32" />
                    <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>

                <Typography variant='subtitle1' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Omset DP</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={omsetDPData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <RXAxis dataKey="date" />
                    <RYAxis tickFormatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
                    <RTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                    <RLegend />
                    <RBar dataKey="value" name="Omset DP" fill="#42a5f5" />
                    <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>

                <Typography variant='subtitle1' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Omset Pelunasan</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={omsetPelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <RXAxis dataKey="date" />
                    <RYAxis tickFormatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
                    <RTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                    <RLegend />
                    <RBar dataKey="value" name="Omset Pelunasan" fill="#ce93d8" />
                    <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>

                <Typography variant='subtitle1' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Omset DPL</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={omsetDplData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <RXAxis dataKey="date" />
                    <RYAxis tickFormatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
                    <RTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                    <RLegend />
                    <RBar dataKey="value" name="Omset DPL" fill="#81c784" />
                    <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Cumulative charts */}
                <Typography variant='subtitle1' sx={{ mt: 4, mb: 1, fontWeight: 600 }}>Slot Kumulatif</Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={slotCumData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <RXAxis dataKey="date" />
                    <RYAxis tickFormatter={(v: number) => v.toLocaleString('id-ID')} />
                    <RTooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
                    <RLegend />
                    <RBar dataKey="value" name="Slot Kumulatif" fill="#455a64" />
                    <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>

                <Typography variant='subtitle1' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Omset Kumulatif</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={omsetCumData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <RXAxis dataKey="date" />
                    <RYAxis tickFormatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
                    <RTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                    <RLegend />
                    <RBar dataKey="value" name="Omset Kumulatif" fill="#6d4c41" />
                    <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" />
                  </ComposedChart>
                </ResponsiveContainer>
              </>
            );
          })()}
        </Box>
      )}
    </Box>
  );
};

export default OmsetTanggal;
