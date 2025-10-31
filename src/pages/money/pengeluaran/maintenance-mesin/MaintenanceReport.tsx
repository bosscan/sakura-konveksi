import React, { useMemo, useState, useRef } from 'react';
import { Box, Typography, Grid, TextField, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, TableFooter } from '@mui/material';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type Maint = { id: string; date: string; amount: number };
const STORAGE_KEY = 'pengeluaran_maintenance_mesin';
const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const MaintenanceReport: React.FC = () => {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
  const data: Maint[] = useMemo(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }, []);
  const filtered = useMemo(() => data.filter(i => i.date?.startsWith(`${month}-`)), [data, month]);
  const perDate = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(i => map.set(i.date, (map.get(i.date) || 0) + (i.amount || 0)));
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ date, total }));
  }, [filtered]);
  const totalSum = useMemo(() => perDate.reduce((a, b) => a + b.total, 0), [perDate]);

  const tableRef = useRef<HTMLTableElement | null>(null);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '80%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>Biaya Maintenance Mesin - Report</Typography>
        <Grid container spacing={2}><Grid size={6}><TextField label='Bulan' type='month' size='small' fullWidth InputLabelProps={{ shrink: true }} value={month} onChange={(e) => setMonth(e.target.value)} /></Grid></Grid>
        <TableExportToolbar title="Maintenance Mesin - Report" fileBaseName="maintenance-mesin-report" tableRef={tableRef} />
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table ref={tableRef}>
            <TableHead><TableRow><TableCell>Tanggal</TableCell><TableCell align='right'>Total</TableCell></TableRow></TableHead>
            <TableBody>
              {perDate.length === 0 ? (<TableRow><TableCell colSpan={2} align='center'>Tidak ada data</TableCell></TableRow>) : perDate.map(r => (
                <TableRow key={r.date}><TableCell>{r.date}</TableCell><TableCell align='right'>{currency(r.total)}</TableCell></TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>{currency(totalSum)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default MaintenanceReport;
