import { useMemo, useState } from 'react';
import { Box, Typography, Paper, Stack, TextField, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useRef } from 'react';
import TableExportToolbar from '../../../components/TableExportToolbar';

type StockItem = { id: string; date: string; code: string; name: string; category: string; unit: string; qtyIn: number; qtyOut: number; price: number; supplier: string; note: string; };
const STORAGE_KEY = 'material_logistik4';

export default function Logistik4() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
  const [search, setSearch] = useState<string>('');
  const items: StockItem[] = useMemo(()=>{ try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }, []);
  const filtered = useMemo(()=> items.filter(it => it.date?.startsWith(month) && (it.code?.toLowerCase().includes(search.toLowerCase()) || it.name?.toLowerCase().includes(search.toLowerCase()))), [items, month, search]);
  const totals = useMemo(()=> filtered.reduce((acc, it)=>{ acc.in += it.qtyIn; acc.out += it.qtyOut; acc.value += (it.qtyIn - it.qtyOut) * it.price; return acc; }, { in:0, out:0, value:0 }), [filtered]);

  return (
    <Box sx={{ p:3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Report Stock - Logistik 4</Typography>
      <Paper sx={{ p:2, mb:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
          <TextField label="Bulan" type="month" InputLabelProps={{ shrink:true }} value={month} onChange={(e)=>setMonth(e.target.value)} size="small" sx={{ minWidth:180 }} />
          <TextField label="Cari Kode/Nama" value={search} onChange={(e)=>setSearch(e.target.value)} size="small" sx={{ minWidth:240 }} />
        </Stack>
      </Paper>
      <TableExportToolbar title="Report Stock - Logistik 4" tableRef={tableRef} fileBaseName="logistik4-report" />
      <TableContainer component={Paper}>
        <Table size="small" ref={tableRef}>
          <TableHead>
            <TableRow>
              <TableCell>Tanggal</TableCell>
              <TableCell>Kode</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Satuan</TableCell>
              <TableCell align="right">Masuk</TableCell>
              <TableCell align="right">Keluar</TableCell>
              <TableCell align="right">Harga</TableCell>
              <TableCell align="right">Nilai Bersih</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Catatan</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(it => (
              <TableRow key={it.id}>
                <TableCell>{it.date}</TableCell>
                <TableCell>{it.code}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.category}</TableCell>
                <TableCell>{it.unit}</TableCell>
                <TableCell align="right">{it.qtyIn}</TableCell>
                <TableCell align="right">{it.qtyOut}</TableCell>
                <TableCell align="right">{it.price.toLocaleString()}</TableCell>
                <TableCell align="right">{(((it.qtyIn-it.qtyOut)*it.price)||0).toLocaleString()}</TableCell>
                <TableCell>{it.supplier}</TableCell>
                <TableCell>{it.note}</TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">Tidak ada data untuk filter ini</TableCell>
              </TableRow>
            )}
            {filtered.length>0 && (
              <TableRow>
                <TableCell colSpan={5} align="right" sx={{ fontWeight:700 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight:700 }}>{totals.in}</TableCell>
                <TableCell align="right" sx={{ fontWeight:700 }}>{totals.out}</TableCell>
                <TableCell/>
                <TableCell align="right" sx={{ fontWeight:700 }}>{totals.value.toLocaleString()}</TableCell>
                <TableCell colSpan={2}/>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
