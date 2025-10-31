import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Grid, TextField, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, TableFooter } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { ResponsiveContainer, ComposedChart, Line as RLine, XAxis as RXAxis, YAxis as RYAxis, CartesianGrid, Tooltip as RTooltip, Legend as RLegend, Bar as RBar } from 'recharts';
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

const toYMD = (d: Date) => d.toISOString().slice(0, 10);
const endOfMonthYMD = (year: number, monthIndex0: number) => {
  // monthIndex0: 0-11
  const end = new Date(year, monthIndex0 + 1, 0);
  return toYMD(end);
};

const OmsetKumulatif: React.FC = () => {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const trendRef = useRef<HTMLTableElement | null>(null);
  // default bulan: bulan berjalan (YYYY-MM)
  const now = new Date();
  const defaultMonth = useMemo(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,[now]);
  const [month, setMonth] = useState<string>(defaultMonth); // YYYY-MM
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === 'omset_pendapatan') setVersion(v => v + 1); };
    window.addEventListener('storage', onStorage);
    const t = setInterval(() => setVersion(v => v + 1), 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(t); };
  }, []);

  const { periodEndYMD, isCurrentMonth, monthLabel } = useMemo(() => {
    if (!month || month.length < 7) {
      const label = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return { periodEndYMD: toYMD(now), isCurrentMonth: true, monthLabel: label };
    }
    const [yStr, mStr] = month.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10); // 1-12
    const isCurrent = y === now.getFullYear() && m === (now.getMonth() + 1);
    const endYMD = isCurrent ? toYMD(now) : endOfMonthYMD(y, m - 1);
    const label = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return { periodEndYMD: endYMD, isCurrentMonth: isCurrent, monthLabel: label };
  }, [month, now]);

  const filtered: Row[] = useMemo(() => {
    const raw = localStorage.getItem('omset_pendapatan');
    const list: Array<{ tanggal: string; tipeTransaksi: string; nominal: number }> = raw ? JSON.parse(raw) : [];
    const prefix = month ? `${month}-` : '';
    const map = new Map<string, Row>();
    list.forEach((r) => {
      const date = (r.tanggal || '').slice(0, 10);
      if (!date) return;
      if (prefix && !date.startsWith(prefix)) return;
      if (isCurrentMonth && date > periodEndYMD) return;
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
    return Array.from(map.values()).sort((a,b) => a.date.localeCompare(b.date)).map((v, i) => ({ ...v, id: i + 1 }));
  }, [month, isCurrentMonth, periodEndYMD, version]);

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

  const resetFilter = () => { setMonth(defaultMonth); };

  // util: linear trendline y = a + b*x over sequence values
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

  // Siapkan deret harian (urut tanggal) untuk chart kumulatif
  const dailySeries = useMemo(() => {
    const rows = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    const labels: string[] = [];
    const cumSlot: number[] = [];
    const cumOmset: number[] = [];
    let sSlot = 0;
    let sOmset = 0;
    rows.forEach((r) => {
      labels.push(r.date);
      sSlot += r.slotKumulatif;
      sOmset += r.omsetKumulatif;
      cumSlot.push(sSlot);
      cumOmset.push(sOmset);
    });
    return { labels, cumSlot, cumOmset };
  }, [filtered]);

  // Hitung hari kerja (tanpa Minggu) untuk bulan terpilih
  const { totalWorkingDaysInMonth, workingDaysElapsed, omsetTrend } = useMemo(() => {
    if (!month || month.length < 7) {
      return { totalWorkingDaysInMonth: 0, workingDaysElapsed: 0, omsetTrend: 0 };
    }
    const [yStr, mStr] = month.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10); // 1-12

    const daysInMonth = new Date(y, m, 0).getDate();

    const countWorkingDays = (endDay: number) => {
      let cnt = 0;
      for (let d = 1; d <= endDay; d++) {
        const wd = new Date(y, m - 1, d).getDay();
        if (wd !== 0) cnt++; // 0 = Minggu
      }
      return cnt;
    };

    const totalWD = countWorkingDays(daysInMonth);

    // tentukan cutoff day (hari berjalan atau akhir bulan)
    let cutoffDay = daysInMonth;
    if (isCurrentMonth) {
      const [, , ddStr] = periodEndYMD.split('-');
      cutoffDay = parseInt(ddStr, 10);
      if (cutoffDay < 1) cutoffDay = 1;
      if (cutoffDay > daysInMonth) cutoffDay = daysInMonth;
    }

    const elapsedWD = countWorkingDays(cutoffDay);
    const trend = elapsedWD > 0 ? Math.round((totals.omsetKumulatif / elapsedWD) * totalWD) : 0;

    return { totalWorkingDaysInMonth: totalWD, workingDaysElapsed: elapsedWD, omsetTrend: trend };
  }, [month, isCurrentMonth, periodEndYMD, totals.omsetKumulatif]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Omset Kumulatif</Typography>
        {/* Filter Bulan */}
        <Grid container spacing={2} alignItems="center">
          <Grid size={6}>
            <TextField label="Bulan" type="month" size="small" fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} />
          </Grid>
          <Grid size={2}>
            <Button variant='outlined' onClick={resetFilter} fullWidth sx={{ height: 40 }}>Reset</Button>
          </Grid>
        </Grid>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Periode: {monthLabel} {isCurrentMonth ? `(s.d. ${periodEndYMD})` : `(s.d. akhir bulan)`}
        </Typography>

        {/* Tabel */}
        <TableExportToolbar title="Omset Kumulatif" fileBaseName="omset-kumulatif" tableRef={tableRef} />
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label='omset-kumulatif' ref={tableRef}>
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
                  <TableCell colSpan={9} align="center">Tidak ada data untuk bulan dipilih</TableCell>
                </TableRow>
              ) : (
                // tampilkan satu baris kumulatif bulanan
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

        {/* Tabel Kecil: Omset by Trend */}
        <TableExportToolbar title="Omset by Trend" fileBaseName="omset-trend" tableRef={trendRef} />
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto', mt: 2 }}>
          <Table size="small" aria-label='omset-trend' ref={trendRef}>
            <TableHead>
              <TableRow>
                <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Omset by Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Hari Kerja Berjalan</TableCell>
                <TableCell width={240}>{workingDaysElapsed}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Hari Kerja Bulan Ini</TableCell>
                <TableCell>{totalWorkingDaysInMonth}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Proyeksi Omset (Trend)</TableCell>
                <TableCell>Rp {currency(omsetTrend)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        {/* Charts */}
        <Box sx={{ mt: 4 }}>
          <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>Grafik Slot</Typography>
          <BarChart
            height={260}
            series={[
              { data: [totals.slotDp], label: 'Slot DP', color: '#1976d2', valueFormatter: (v: number | null) => (v == null ? '0' : v.toLocaleString('id-ID')) },
              { data: [totals.slotPelunasan], label: 'Slot Pelunasan', color: '#9c27b0', valueFormatter: (v: number | null) => (v == null ? '0' : v.toLocaleString('id-ID')) },
              { data: [totals.slotDpl], label: 'Slot DPL', color: '#2e7d32', valueFormatter: (v: number | null) => (v == null ? '0' : v.toLocaleString('id-ID')) },
            ]}
            xAxis={[{ scaleType: 'band', data: ['Kumulatif'] }]}
            yAxis={[{ valueFormatter: (v: number | string) => (typeof v === 'number' ? v.toLocaleString('id-ID') : String(v)) }]}
          />

          <Typography variant='subtitle1' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Grafik Omset</Typography>
      <BarChart
            height={260}
            series={[
              { data: [totals.omsetDp], label: 'Omset DP', color: '#42a5f5', valueFormatter: (v: number | null) => `Rp ${(v == null ? 0 : v).toLocaleString('id-ID')}` },
              { data: [totals.omsetPelunasan], label: 'Omset Pelunasan', color: '#ce93d8', valueFormatter: (v: number | null) => `Rp ${(v == null ? 0 : v).toLocaleString('id-ID')}` },
              { data: [totals.omsetDpl], label: 'Omset DPL', color: '#81c784', valueFormatter: (v: number | null) => `Rp ${(v == null ? 0 : v).toLocaleString('id-ID')}` },
            ]}
            xAxis={[{ scaleType: 'band', data: ['Kumulatif'] }]}
            yAxis={[{ valueFormatter: (v: number | string) => (typeof v === 'number' ? v.toLocaleString('id-ID') : String(v)) }]}
          />

          {/* Cumulative charts with trendlines */}
          {dailySeries.labels.length > 0 && (
            <>
              <Typography variant='subtitle1' sx={{ mt: 4, mb: 1, fontWeight: 600 }}>Slot Kumulatif per Hari + Trendline</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dailySeries.labels.map((d, i) => ({ date: d, value: dailySeries.cumSlot[i] }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <RXAxis dataKey="date" />
                  <RYAxis tickFormatter={(v: number) => v.toLocaleString('id-ID')} />
                  <RTooltip formatter={(value: number) => value.toLocaleString('id-ID')} />
                  <RLegend />
                  <RBar dataKey="value" name="Slot Kumulatif" fill="#455a64" />
                  {(() => {
                    const t = trendline(dailySeries.cumSlot);
                    const d = dailySeries.labels.map((date, i) => ({ date, trend: t[i] }));
                    return <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" data={d} />;
                  })()}
                </ComposedChart>
              </ResponsiveContainer>

              <Typography variant='subtitle1' sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Omset Kumulatif per Hari + Trendline</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dailySeries.labels.map((d, i) => ({ date: d, value: dailySeries.cumOmset[i] }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <RXAxis dataKey="date" />
                  <RYAxis tickFormatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} />
                  <RTooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <RLegend />
                  <RBar dataKey="value" name="Omset Kumulatif" fill="#6d4c41" />
                  {(() => {
                    const t = trendline(dailySeries.cumOmset);
                    const d = dailySeries.labels.map((date, i) => ({ date, trend: t[i] }));
                    return <RLine dataKey="trend" name="Trendline" stroke="#ff7043" dot={false} strokeDasharray="4 4" data={d} />;
                  })()}
                </ComposedChart>
              </ResponsiveContainer>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default OmsetKumulatif;
