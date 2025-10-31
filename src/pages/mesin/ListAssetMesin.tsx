import { useMemo, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Stack } from '@mui/material';
import { useRef } from 'react';
import TableExportToolbar from '../../components/TableExportToolbar';
import Grid from '@mui/material/GridLegacy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

type Machine = { id: string; code: string; name: string; brand: string; model: string; location: string; status: 'Aktif'|'Tidak Aktif'|'Maintenance'; lastService?: string; nextService?: string; };
const STORAGE_KEY = 'mesin_assets';

export default function ListAssetMesin() {
	const tableRef = useRef<HTMLTableElement | null>(null);
	const [items, setItems] = useState<Machine[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
	const [search, setSearch] = useState('');
	const [form, setForm] = useState<Omit<Machine,'id'>>({ code:'', name:'', brand:'', model:'', location:'', status:'Aktif', lastService:'', nextService:'' });
	const [editing, setEditing] = useState<Machine | null>(null);

	const save = (list:Machine[])=>{ setItems(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
	const handleChange = (k:keyof typeof form, v:any)=> setForm(f=>({...f,[k]:v}));
	const add = ()=>{ if(!form.code || !form.name) return; const next: Machine = { id: crypto.randomUUID(), ...form }; save([next, ...items]); setForm({ code:'', name:'', brand:'', model:'', location:'', status:'Aktif', lastService:'', nextService:'' }); };
	const remove = (id:string)=> save(items.filter(i=>i.id!==id));
	const commitEdit = ()=> { if(!editing) return; const updated = items.map(i=> i.id===editing.id? editing: i); save(updated); setEditing(null); };
	const filtered = useMemo(()=> items.filter(i => [i.code,i.name,i.brand,i.model,i.location,i.status].join(' ').toLowerCase().includes(search.toLowerCase())), [items, search]);

	return (
		<Box sx={{ p:3 }}>
			<Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>List Asset Mesin</Typography>
					<Paper sx={{ p:2, mb:2 }}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Kode" value={form.code} onChange={(e)=>handleChange('code', e.target.value)} size="small" /></Grid>
							<Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Nama" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} size="small" /></Grid>
							<Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Brand" value={form.brand} onChange={(e)=>handleChange('brand', e.target.value)} size="small" /></Grid>
							<Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Model" value={form.model} onChange={(e)=>handleChange('model', e.target.value)} size="small" /></Grid>
							<Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Lokasi" value={form.location} onChange={(e)=>handleChange('location', e.target.value)} size="small" /></Grid>
							<Grid item xs={12} sm={6} md={2}><TextField fullWidth select label="Status" value={form.status} onChange={(e)=>handleChange('status', e.target.value)} size="small">{['Aktif','Tidak Aktif','Maintenance'].map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
							<Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Last Service" type="date" InputLabelProps={{ shrink:true }} value={form.lastService} onChange={(e)=>handleChange('lastService', e.target.value)} size="small" /></Grid>
							<Grid item xs={12} sm={6} md={2}><TextField fullWidth label="Next Service" type="date" InputLabelProps={{ shrink:true }} value={form.nextService} onChange={(e)=>handleChange('nextService', e.target.value)} size="small" /></Grid>
							<Grid item xs={12} sm={6} md={2}><Button fullWidth variant="contained" onClick={add} sx={{ height:40 }}>Tambah</Button></Grid>
							<Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Cari" value={search} onChange={(e)=>setSearch(e.target.value)} size="small" /></Grid>
						</Grid>
					</Paper>

			<TableExportToolbar title="List Asset Mesin" tableRef={tableRef} fileBaseName="list-asset-mesin" />
			<TableContainer component={Paper}>
				<Table size="small" ref={tableRef}>
					<TableHead>
						<TableRow>
							<TableCell>Kode</TableCell>
							<TableCell>Nama</TableCell>
							<TableCell>Brand</TableCell>
							<TableCell>Model</TableCell>
							<TableCell>Lokasi</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Last Service</TableCell>
							<TableCell>Next Service</TableCell>
							<TableCell>Aksi</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtered.map(it=> (
							<TableRow key={it.id}>
								<TableCell>{it.code}</TableCell>
								<TableCell>{it.name}</TableCell>
								<TableCell>{it.brand}</TableCell>
								<TableCell>{it.model}</TableCell>
								<TableCell>{it.location}</TableCell>
								<TableCell>{it.status}</TableCell>
								<TableCell>{it.lastService}</TableCell>
								<TableCell>{it.nextService}</TableCell>
								<TableCell>
									<IconButton size="small" onClick={()=>setEditing(it)}><EditIcon fontSize="small"/></IconButton>
									<IconButton size="small" color="error" onClick={()=>remove(it.id)}><DeleteIcon fontSize="small"/></IconButton>
								</TableCell>
							</TableRow>
						))}
						{filtered.length===0 && (<TableRow><TableCell colSpan={9} align="center">Belum ada data</TableCell></TableRow>)}
					</TableBody>
				</Table>
			</TableContainer>

			<Dialog open={!!editing} onClose={()=>setEditing(null)} maxWidth="md" fullWidth>
				<DialogTitle>Edit Asset Mesin</DialogTitle>
				<DialogContent>
					<Stack direction={{ xs:'column', sm:'row' }} spacing={2} flexWrap="wrap" sx={{ mt:1 }}>
						<TextField label="Kode" value={editing?.code||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, code:e.target.value}):ed)} size="small" />
						<TextField label="Nama" value={editing?.name||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, name:e.target.value}):ed)} size="small" />
						<TextField label="Brand" value={editing?.brand||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, brand:e.target.value}):ed)} size="small" />
						<TextField label="Model" value={editing?.model||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, model:e.target.value}):ed)} size="small" />
						<TextField label="Lokasi" value={editing?.location||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, location:e.target.value}):ed)} size="small" />
						<TextField select label="Status" value={editing?.status||'Aktif'} onChange={(e)=>setEditing(ed=> ed? ({...ed, status:e.target.value as any}):ed)} size="small">{['Aktif','Tidak Aktif','Maintenance'].map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
						<TextField label="Last Service" type="date" InputLabelProps={{ shrink:true }} value={editing?.lastService||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, lastService:e.target.value}):ed)} size="small" />
						<TextField label="Next Service" type="date" InputLabelProps={{ shrink:true }} value={editing?.nextService||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, nextService:e.target.value}):ed)} size="small" />
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
