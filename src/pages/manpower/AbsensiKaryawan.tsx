import { useMemo, useRef, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, MenuItem } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import TableExportToolbar from '../../components/TableExportToolbar';

type Attendance = { id: string; date: string; name: string; status: 'Hadir'|'Izin'|'Sakit'|'Alpa'; note?: string };
const STORAGE_KEY = 'mp_absensi';

export default function AbsensiKaryawan() {
	const [rows, setRows] = useState<Attendance[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
	const [form, setForm] = useState<Omit<Attendance,'id'>>({ date:new Date().toISOString().slice(0,10), name:'', status:'Hadir', note:'' });
	const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
	const [search, setSearch] = useState('');
	const handleChange = (k:keyof typeof form, v:any)=> setForm(f=>({...f,[k]:v}));
	const save = (list:Attendance[])=>{ setRows(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
	const add = ()=>{ if(!form.name) return; const next:Attendance = { id: crypto.randomUUID(), ...form }; save([next, ...rows]); setForm({ date:new Date().toISOString().slice(0,10), name:'', status:'Hadir', note:'' }); };
	const filtered = useMemo(()=> rows.filter(r => r.date.startsWith(month) && [r.name,r.status,r.note||''].join(' ').toLowerCase().includes(search.toLowerCase())), [rows, month, search]);
	const totals = useMemo(()=> filtered.reduce((acc,r)=>{ acc[r.status] = (acc[r.status]||0)+1; return acc; }, {} as Record<Attendance['status'], number>), [filtered]);
	const tableRef = useRef<HTMLTableElement | null>(null);

	return (
		<Box sx={{ p:3 }}>
			<Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Absensi Karyawan</Typography>
			<Paper sx={{ p:2, mb:2 }}>
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth type="date" label="Tanggal" InputLabelProps={{ shrink:true }} value={form.date} onChange={(e)=>handleChange('date', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Nama" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth select label="Status" value={form.status} onChange={(e)=>handleChange('status', e.target.value)} size="small">{['Hadir','Izin','Sakit','Alpa'].map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Catatan" value={form.note} onChange={(e)=>handleChange('note', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={2}>
						<Button fullWidth variant="contained" onClick={add}>Tambah</Button>
					</Grid>

					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth type="month" label="Bulan" InputLabelProps={{ shrink:true }} value={month} onChange={(e)=>setMonth(e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Cari" value={search} onChange={(e)=>setSearch(e.target.value)} size="small" />
					</Grid>
				</Grid>
			</Paper>

			<TableExportToolbar title="Absensi Karyawan" tableRef={tableRef} fileBaseName="absensi-karyawan" />
			<TableContainer component={Paper}>
				<Table size="small" ref={tableRef}>
					<TableHead>
						<TableRow>
							<TableCell>Tanggal</TableCell>
							<TableCell>Nama</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Catatan</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtered.map(r => (
							<TableRow key={r.id}>
								<TableCell>{r.date}</TableCell>
								<TableCell>{r.name}</TableCell>
								<TableCell>{r.status}</TableCell>
								<TableCell>{r.note}</TableCell>
							</TableRow>
						))}
						{filtered.length===0 && (<TableRow><TableCell colSpan={4} align="center">Belum ada data</TableCell></TableRow>)}
						{filtered.length>0 && (
							<TableRow>
								<TableCell colSpan={2} align="right" sx={{ fontWeight:700 }}>Rekap</TableCell>
								<TableCell colSpan={2}>{['Hadir','Izin','Sakit','Alpa'].map(s=> `${s}: ${totals[s as keyof typeof totals]||0}`).join(' | ')}</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
