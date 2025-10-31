import { useMemo, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material';
import { useRef } from 'react';
import TableExportToolbar from '../../components/TableExportToolbar';
import Grid from '@mui/material/GridLegacy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

type Pattern = { id: string; code: string; name: string; product: string; size: string; note?: string };
const STORAGE_KEY = 'db_pola_master';

export default function DatabasePola() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [items, setItems] = useState<Pattern[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Omit<Pattern,'id'>>({ code:'', name:'', product:'', size:'', note:'' });
  const [editing, setEditing] = useState<Pattern | null>(null);

  const filtered = useMemo(() => items.filter(i => [i.code,i.name,i.product,i.size].join(' ').toLowerCase().includes(search.toLowerCase())), [items, search]);
  const saveItems = (list: Pattern[]) => { setItems(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
  const handleChange = (k: keyof typeof form, v:any) => setForm(f=>({...f,[k]:v}));
  const addItem = () => { if(!form.code || !form.name) return; const next: Pattern = { id: crypto.randomUUID(), ...form }; saveItems([next, ...items]); setForm({ code:'', name:'', product:'', size:'', note:'' }); };
  const removeItem = (id:string)=> saveItems(items.filter(i=>i.id!==id));
  const commitEdit = () => { if(!editing) return; const updated = items.map(i=> i.id===editing.id ? editing : i); saveItems(updated); setEditing(null); };

  return (
    <Box sx={{ p:3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Database Pola</Typography>
      <Paper sx={{ p:2, mb:2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Kode" value={form.code} onChange={(e)=>handleChange('code', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Nama Pola" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Produk" value={form.product} onChange={(e)=>handleChange('product', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Ukuran" value={form.size} onChange={(e)=>handleChange('size', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="Catatan" value={form.note} onChange={(e)=>handleChange('note', e.target.value)} size="small" /></Grid>
          <Grid item xs={12} sm={6} md={2}><Button fullWidth variant="contained" onClick={addItem} sx={{ height:40 }}>Tambah</Button></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Cari" value={search} onChange={(e)=>setSearch(e.target.value)} size="small" /></Grid>
        </Grid>
      </Paper>

      <TableExportToolbar title="Database Pola" tableRef={tableRef} fileBaseName="database-pola" />
      <TableContainer component={Paper}>
        <Table size="small" ref={tableRef}>
          <TableHead>
            <TableRow>
              <TableCell>Kode</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Produk</TableCell>
              <TableCell>Ukuran</TableCell>
              <TableCell>Catatan</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(it => (
              <TableRow key={it.id}>
                <TableCell>{it.code}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.product}</TableCell>
                <TableCell>{it.size}</TableCell>
                <TableCell>{it.note}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={()=>setEditing(it)}><EditIcon fontSize="small"/></IconButton>
                  <IconButton size="small" color="error" onClick={()=>removeItem(it.id)}><DeleteIcon fontSize="small"/></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length===0 && (<TableRow><TableCell colSpan={6} align="center">Belum ada data</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editing} onClose={()=>setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Pola</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Kode" value={editing?.code||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, code:e.target.value}) : ed)} size="small" />
            <TextField label="Nama" value={editing?.name||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, name:e.target.value}) : ed)} size="small" />
            <TextField label="Produk" value={editing?.product||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, product:e.target.value}) : ed)} size="small" />
            <TextField label="Ukuran" value={editing?.size||''} onChange={(e)=>setEditing(ed=> ed ? ({...ed, size:e.target.value}) : ed)} size="small" />
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
