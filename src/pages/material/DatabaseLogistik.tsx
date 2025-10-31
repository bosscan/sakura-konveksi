import { useMemo, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material';
import { useRef } from 'react';
import TableExportToolbar from '../../components/TableExportToolbar';
import Grid from '@mui/material/GridLegacy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

type Item = { id: string; code: string; name: string; category: string; unit: string; minStock: number; note?: string };
const STORAGE_KEY = 'db_logistik_master';

export default function DatabaseLogistik() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [items, setItems] = useState<Item[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Omit<Item,'id'>>({ code:'', name:'', category:'Bahan', unit:'pcs', minStock:0, note:'' });
  const [editing, setEditing] = useState<Item | null>(null);

  const filtered = useMemo(() => items.filter(i => [i.code,i.name,i.category].join(' ').toLowerCase().includes(search.toLowerCase())), [items, search]);

  const handleChange = (k: keyof typeof form, v:any) => setForm(f=>({...f,[k]:v}));
  const saveItems = (list: Item[]) => { setItems(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
  const addItem = () => { if(!form.code || !form.name) return; const next: Item = { id: crypto.randomUUID(), ...form }; saveItems([next, ...items]); setForm({ code:'', name:'', category:'Bahan', unit:'pcs', minStock:0, note:'' }); };
  const removeItem = (id:string)=> saveItems(items.filter(i=>i.id!==id));
  const startEdit = (it: Item) => setEditing(it);
  const commitEdit = () => { if(!editing) return; const updated = items.map(i=> i.id===editing.id ? editing : i); saveItems(updated); setEditing(null); };

  return (
    <Box sx={{ p:3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Database Logistik</Typography>
      <Paper sx={{ p:2, mb:2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Kode" value={form.code} onChange={(e)=>handleChange('code', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Nama" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Kategori" select value={form.category} onChange={(e)=>handleChange('category', e.target.value)} size="small">{['Bahan','Aksesoris','Packing','Lainnya'].map(o=> <MenuItem key={o} value={o}>{o}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Satuan" value={form.unit} onChange={(e)=>handleChange('unit', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Min Stock" type="number" value={form.minStock} onChange={(e)=>handleChange('minStock', Number(e.target.value))} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Catatan" value={form.note} onChange={(e)=>handleChange('note', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={2}><Button fullWidth variant="contained" onClick={addItem} sx={{ height:40 }}>Tambah</Button></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Cari" value={search} onChange={(e)=>setSearch(e.target.value)} size="small" /></Grid>
        </Grid>
      </Paper>
      <TableExportToolbar title="Database Logistik" tableRef={tableRef} fileBaseName="database-logistik" />
      <TableContainer component={Paper}>
        <Table size="small" ref={tableRef}>
          <TableHead>
            <TableRow>
              <TableCell>Kode</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Satuan</TableCell>
              <TableCell align="right">Min Stock</TableCell>
              <TableCell>Catatan</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(it=> (
              <TableRow key={it.id}>
                <TableCell>{it.code}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.category}</TableCell>
                <TableCell>{it.unit}</TableCell>
                <TableCell align="right">{it.minStock}</TableCell>
                <TableCell>{it.note}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={()=>startEdit(it)}><EditIcon fontSize="small"/></IconButton>
                  <IconButton size="small" color="error" onClick={()=>removeItem(it.id)}><DeleteIcon fontSize="small"/></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && (<TableRow><TableCell colSpan={7} align="center">Belum ada data</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editing} onClose={()=>setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Kode" value={editing?.code||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, code:e.target.value}) : ed)} size="small" />
            <TextField label="Nama" value={editing?.name||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, name:e.target.value}) : ed)} size="small" />
            <TextField label="Kategori" select value={editing?.category||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, category:e.target.value}) : ed)} size="small">{['Bahan','Aksesoris','Packing','Lainnya'].map(o=> <MenuItem key={o} value={o}>{o}</MenuItem>)}</TextField>
            <TextField label="Satuan" value={editing?.unit||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, unit:e.target.value}) : ed)} size="small" />
            <TextField label="Min Stock" type="number" value={editing?.minStock||0} onChange={(e)=>setEditing(ed=> ed ? ({...ed, minStock:Number(e.target.value)}) : ed)} size="small" />
            <TextField label="Catatan" value={editing?.note||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, note:e.target.value}) : ed)} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setEditing(null)}>Batal</Button>
          <Button variant="contained" onClick={commitEdit}>Simpan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
