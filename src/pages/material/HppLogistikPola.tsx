import { useMemo, useState } from 'react';
import { Box, Typography, Paper, Stack, TextField, MenuItem, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { useRef } from 'react';
import TableExportToolbar from '../../components/TableExportToolbar';

type MasterItem = { id: string; code: string; name: string; category: string; unit: string; minStock: number; note?: string };
type Consumption = { id: string; itemCode: string; qty: number; price: number };

const MASTER_KEY = 'db_logistik_master';
const PRICE_SOURCES = ['Rata2 Input', 'Manual'] as const;

export default function HppLogistikPola() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const masters: MasterItem[] = useMemo(()=>{ try { const raw = localStorage.getItem(MASTER_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }, []);
  const [priceSource, setPriceSource] = useState<(typeof PRICE_SOURCES)[number]>('Manual');
  const [cons, setCons] = useState<Consumption[]>([]);
  const [form, setForm] = useState<{ itemCode: string; qty: number; price: number }>({ itemCode:'', qty:1, price:0 });

  const addRow = () => { if(!form.itemCode || form.qty<=0) return; const exists = masters.find(m=>m.code===form.itemCode); if(!exists) return; setCons(cs=> [{ id: crypto.randomUUID(), itemCode: form.itemCode, qty: form.qty, price: form.price }, ...cs]); setForm({ itemCode:'', qty:1, price:0 }); };
  const removeRow = (id:string)=> setCons(cs=> cs.filter(c=>c.id!==id));

  const total = useMemo(()=> cons.reduce((a,c)=> a + c.qty * c.price, 0), [cons]);

  return (
    <Box sx={{ p:3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>HPP Logistik Pola</Typography>
      <Paper sx={{ p:2, mb:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} flexWrap="wrap">
          <TextField select label="Sumber Harga" value={priceSource} onChange={(e)=>setPriceSource(e.target.value as any)} size="small" sx={{ minWidth:160 }}>{PRICE_SOURCES.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
          <TextField select label="Item" value={form.itemCode} onChange={(e)=> setForm(f=>({...f, itemCode:e.target.value}))} size="small" sx={{ minWidth:220 }}>
            {masters.map(m=> <MenuItem key={m.code} value={m.code}>{m.code} - {m.name}</MenuItem>)}
          </TextField>
          <TextField label="Qty" type="number" value={form.qty} onChange={(e)=> setForm(f=>({...f, qty:Number(e.target.value)}))} size="small" sx={{ minWidth:120 }} />
          <TextField label="Harga (Manual)" type="number" disabled={priceSource!=='Manual'} value={form.price} onChange={(e)=> setForm(f=>({...f, price:Number(e.target.value)}))} size="small" sx={{ minWidth:160 }} />
          <TextField label="Auto Harga (Opsional)" disabled value={0} size="small" sx={{ minWidth:160 }} helperText="Rata2 dari input stock (belum diimplementasi)"/>
          <TextField label="Catatan Pola (opsional)" size="small" sx={{ minWidth:260 }} />
          <TextField label="Produk / SPK" size="small" sx={{ minWidth:200 }} />
          <TextField label="Ukuran / Variant" size="small" sx={{ minWidth:160 }} />
          <TextField label="Batch Qty" type="number" size="small" sx={{ minWidth:120 }} />
          <TextField label="Output Per Batch" type="number" size="small" sx={{ minWidth:160 }} helperText="Unit hasil produksi per batch" />
          <TextField label="Total HPP (otomatis)" value={total.toLocaleString()} size="small" InputProps={{ readOnly:true }} sx={{ minWidth:200 }} />
          <TextField label="HPP Per Unit (otomatis)" value={total.toLocaleString()} size="small" InputProps={{ readOnly:true }} sx={{ minWidth:220 }} />
          <TextField label="Markup % (opsional)" type="number" size="small" sx={{ minWidth:140 }} />
          <TextField label="Harga Jual (otomatis)" size="small" sx={{ minWidth:200 }} InputProps={{ readOnly:true }} />
          <TextField label="Ppn 11% (opsional)" size="small" sx={{ minWidth:160 }} />
          <TextField label="Harga Jual + PPN" size="small" sx={{ minWidth:200 }} InputProps={{ readOnly:true }} />
          <TextField label="Catatan" size="small" sx={{ minWidth:240 }} />
          <Button variant="contained" onClick={addRow} sx={{ alignSelf:'center' }}>Tambah ke list</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" sx={{ mb:1 }}>Konsumsi Logistik</Typography>
      <TableExportToolbar title="HPP Logistik Pola" tableRef={tableRef} fileBaseName="hpp-logistik-pola" />
      <TableContainer component={Paper}>
        <Table size="small" ref={tableRef}>
          <TableHead>
            <TableRow>
              <TableCell>Kode</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Harga</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{form.itemCode}</TableCell>
              <TableCell>{masters.find(m=>m.code===form.itemCode)?.name||''}</TableCell>
              <TableCell align="right">{form.qty}</TableCell>
              <TableCell align="right">{form.price.toLocaleString()}</TableCell>
              <TableCell align="right">{(form.qty*form.price).toLocaleString()}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {cons.map(c=> (
              <TableRow key={c.id}>
                <TableCell>{c.itemCode}</TableCell>
                <TableCell>{masters.find(m=>m.code===c.itemCode)?.name||''}</TableCell>
                <TableCell align="right">{c.qty}</TableCell>
                <TableCell align="right">{c.price.toLocaleString()}</TableCell>
                <TableCell align="right">{(c.qty*c.price).toLocaleString()}</TableCell>
                <TableCell><a style={{ cursor:'pointer', color:'#d32f2f' }} onClick={()=>removeRow(c.id)}>hapus</a></TableCell>
              </TableRow>
            ))}
            {cons.length===0 && !form.itemCode && (<TableRow><TableCell colSpan={6} align="center">Belum ada konsumsi. Pilih item dan isi qty/harga, lalu tambahkan.</TableCell></TableRow>)}
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ fontWeight:700 }}>Total HPP</TableCell>
              <TableCell align="right" sx={{ fontWeight:700 }}>{total.toLocaleString()}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
