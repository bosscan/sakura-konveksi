import { useMemo, useRef, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material';
import TableExportToolbar from '../../components/TableExportToolbar';
import Grid from '@mui/material/GridLegacy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

type Employee = { id: string; name: string; division: string; role: string; status: 'Aktif'|'Nonaktif' };
const STORAGE_KEY = 'mp_employees';

export default function DataKaryawan() {
	const [items, setItems] = useState<Employee[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
	const [search, setSearch] = useState('');
	const [form, setForm] = useState<Omit<Employee,'id'>>({ name:'', division:'Produksi', role:'', status:'Aktif' });
	const [editing, setEditing] = useState<Employee | null>(null);
	const save = (list:Employee[])=>{ setItems(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
	const handleChange = (k:keyof typeof form, v:any)=> setForm(f=>({...f,[k]:v}));
	const add = ()=>{ if(!form.name) return; const next:Employee = { id: crypto.randomUUID(), ...form }; save([next, ...items]); setForm({ name:'', division:'Produksi', role:'', status:'Aktif' }); };
	const remove = (id:string)=> save(items.filter(i=>i.id!==id));
	const commitEdit = ()=>{ if(!editing) return; save(items.map(i=> i.id===editing.id? editing: i)); setEditing(null); };
	const filtered = useMemo(()=> items.filter(i=> [i.name,i.division,i.role,i.status].join(' ').toLowerCase().includes(search.toLowerCase())), [items, search]);
	const tableRef = useRef<HTMLTableElement | null>(null);

	return (
		<Box sx={{ p:3 }}>
			<Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Data Karyawan</Typography>
			<Paper sx={{ p:2, mb:2 }}>
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Nama" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth select label="Divisi" value={form.division} onChange={(e)=>handleChange('division', e.target.value)} size="small">{['Produksi','Desain','Gudang','Marketing','Finance','Admin'].map(d=> <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Jabatan" value={form.role} onChange={(e)=>handleChange('role', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth select label="Status" value={form.status} onChange={(e)=>handleChange('status', e.target.value)} size="small">{['Aktif','Nonaktif'].map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
					</Grid>
					<Grid item xs={12} sm={6} md={1}>
						<Button fullWidth variant="contained" onClick={add}>Tambah</Button>
					</Grid>

					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Cari" value={search} onChange={(e)=>setSearch(e.target.value)} size="small" />
					</Grid>
				</Grid>
			</Paper>

			<TableExportToolbar title="Data Karyawan" tableRef={tableRef} fileBaseName="data-karyawan" />
			<TableContainer component={Paper}>
				<Table size="small" ref={tableRef}>
					<TableHead>
						<TableRow>
							<TableCell>Nama</TableCell>
							<TableCell>Divisi</TableCell>
							<TableCell>Jabatan</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Aksi</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtered.map(it=> (
							<TableRow key={it.id}>
								<TableCell>{it.name}</TableCell>
								<TableCell>{it.division}</TableCell>
								<TableCell>{it.role}</TableCell>
								<TableCell>{it.status}</TableCell>
								<TableCell>
									<IconButton size="small" onClick={()=>setEditing(it)}><EditIcon fontSize="small"/></IconButton>
									<IconButton size="small" color="error" onClick={()=>remove(it.id)}><DeleteIcon fontSize="small"/></IconButton>
								</TableCell>
							</TableRow>
						))}
						{filtered.length===0 && (<TableRow><TableCell colSpan={5} align="center">Belum ada data</TableCell></TableRow>)}
					</TableBody>
				</Table>
			</TableContainer>

			<Dialog open={!!editing} onClose={()=>setEditing(null)} maxWidth="sm" fullWidth>
				<DialogTitle>Edit Karyawan</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt:1 }}>
						<TextField label="Nama" value={editing?.name||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, name:e.target.value}):ed)} size="small" />
						<TextField select label="Divisi" value={editing?.division||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, division:e.target.value}):ed)} size="small">{['Produksi','Desain','Gudang','Marketing','Finance','Admin'].map(d=> <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField>
						<TextField label="Jabatan" value={editing?.role||''} onChange={(e)=>setEditing(ed=> ed? ({...ed, role:e.target.value}):ed)} size="small" />
						<TextField select label="Status" value={editing?.status||'Aktif'} onChange={(e)=>setEditing(ed=> ed? ({...ed, status:e.target.value as any}):ed)} size="small">{['Aktif','Nonaktif'].map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
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
