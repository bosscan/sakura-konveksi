import { useMemo, useRef, useState } from 'react';
import { Box, Typography, TextField, Paper, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, MenuItem } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import DeleteIcon from '@mui/icons-material/Delete';
import TableExportToolbar from '../../../components/TableExportToolbar';

type StockItem = { id: string; date: string; code: string; name: string; category: string; unit: string; qtyIn: number; qtyOut: number; price: number; supplier: string; note: string; };
const STORAGE_KEY = 'material_logistik3';

export default function Logistik3() {
  const [items, setItems] = useState<StockItem[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
  const [form, setForm] = useState<Omit<StockItem,'id'>>({ date: new Date().toISOString().slice(0,10), code:'', name:'', category:'Bahan', unit:'pcs', qtyIn:0, qtyOut:0, price:0, supplier:'', note:'' });
  const handleChange = (k: keyof typeof form, v:any) => setForm((f)=>({...f,[k]:v}));
  const addItem = () => { if(!form.name) return; const next: StockItem = { id: crypto.randomUUID(), ...form } as StockItem; const updated=[next,...items]; setItems(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); setForm((f)=>({...f,code:'',name:'',qtyIn:0,qtyOut:0,price:0,supplier:'',note:''})); };
  const removeItem = (id:string)=>{ const updated = items.filter(i=>i.id!==id); setItems(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); };
  const totalValue = useMemo(()=> items.reduce((a,it)=> a + (it.qtyIn-it.qtyOut)*it.price, 0), [items]);

  const tableRef = useRef<HTMLTableElement | null>(null);
  return (
    <Box sx={{ p:3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Input Stock - Logistik 3</Typography>
      <Paper sx={{ p:2, mb:2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Tanggal" type="date" InputLabelProps={{ shrink:true }} value={form.date} onChange={(e)=>handleChange('date', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Kode" value={form.code} onChange={(e)=>handleChange('code', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Nama Barang" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Kategori" select value={form.category} onChange={(e)=>handleChange('category', e.target.value)} size="small">{['Bahan','Aksesoris','Packing','Lainnya'].map(opt=> <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Satuan" value={form.unit} onChange={(e)=>handleChange('unit', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Qty Masuk" type="number" value={form.qtyIn} onChange={(e)=>handleChange('qtyIn', Number(e.target.value))} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Qty Keluar" type="number" value={form.qtyOut} onChange={(e)=>handleChange('qtyOut', Number(e.target.value))} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Harga/Unit" type="number" value={form.price} onChange={(e)=>handleChange('price', Number(e.target.value))} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Supplier" value={form.supplier} onChange={(e)=>handleChange('supplier', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={8} md={6}><TextField fullWidth label="Catatan" value={form.note} onChange={(e)=>handleChange('note', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={4} md={2}><Button fullWidth variant="contained" onClick={addItem} sx={{ height:40 }}>Simpan</Button></Grid>
        </Grid>
      </Paper>
      <TableExportToolbar title="Input Stock - Logistik 3" tableRef={tableRef} fileBaseName="logistik3-input" />
      <TableContainer component={Paper}>
        <Table size="small" ref={tableRef}>
          <TableHead><TableRow><TableCell>Tanggal</TableCell><TableCell>Kode</TableCell><TableCell>Nama</TableCell><TableCell>Kategori</TableCell><TableCell>Satuan</TableCell><TableCell align="right">Masuk</TableCell><TableCell align="right">Keluar</TableCell><TableCell align="right">Harga</TableCell><TableCell align="right">Nilai Bersih</TableCell><TableCell>Supplier</TableCell><TableCell>Catatan</TableCell><TableCell>Aksi</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map(it=>(<TableRow key={it.id}>
              <TableCell>{it.date}</TableCell><TableCell>{it.code}</TableCell><TableCell>{it.name}</TableCell><TableCell>{it.category}</TableCell><TableCell>{it.unit}</TableCell><TableCell align="right">{it.qtyIn}</TableCell><TableCell align="right">{it.qtyOut}</TableCell><TableCell align="right">{it.price.toLocaleString()}</TableCell><TableCell align="right">{(((it.qtyIn-it.qtyOut)*it.price)||0).toLocaleString()}</TableCell><TableCell>{it.supplier}</TableCell><TableCell>{it.note}</TableCell>
              <TableCell><IconButton color="error" size="small" onClick={()=>removeItem(it.id)}><DeleteIcon fontSize="small"/></IconButton></TableCell>
            </TableRow>))}
            {items.length===0 && (<TableRow><TableCell colSpan={12} align="center">Belum ada data</TableCell></TableRow>)}
            {items.length>0 && (<TableRow><TableCell colSpan={8} align="right" sx={{ fontWeight:700 }}>Total Nilai Bersih</TableCell><TableCell align="right" sx={{ fontWeight:700 }}>{totalValue.toLocaleString()}</TableCell><TableCell colSpan={3}/></TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
