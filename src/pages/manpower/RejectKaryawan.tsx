import { useMemo, useRef, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import TableExportToolbar from '../../components/TableExportToolbar';
import Grid from '@mui/material/GridLegacy';

type Reject = { id: string; date: string; name: string; count: number; reason: string; note?: string };
const STORAGE_KEY = 'mp_rejects';

export default function RejectKaryawan() {
	const [rows, setRows] = useState<Reject[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
	const [form, setForm] = useState<Omit<Reject,'id'>>({ date:new Date().toISOString().slice(0,10), name:'', count:0, reason:'', note:'' });
	const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
	const [search, setSearch] = useState('');
	const handleChange = (k:keyof typeof form, v:any)=> setForm(f=>({...f,[k]:v}));
	const save = (list:Reject[])=>{ setRows(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
	const add = ()=>{ if(!form.name) return; const next:Reject = { id: crypto.randomUUID(), ...form }; save([next, ...rows]); setForm({ date:new Date().toISOString().slice(0,10), name:'', count:0, reason:'', note:'' }); };
	const filtered = useMemo(()=> rows.filter(r => r.date.startsWith(month) && [r.name,r.reason,r.note||''].join(' ').toLowerCase().includes(search.toLowerCase())), [rows, month, search]);
	const totals = useMemo(()=> filtered.reduce((acc,r)=> acc + r.count, 0), [filtered]);
	const tableRef = useRef<HTMLTableElement | null>(null);

	return (
		<Box sx={{ p:3 }}>
			<Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Reject Karyawan</Typography>
			<Paper sx={{ p:2, mb:2 }}>
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth type="date" label="Tanggal" InputLabelProps={{ shrink:true }} value={form.date} onChange={(e)=>handleChange('date', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Nama" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth label="Jumlah Reject" type="number" value={form.count} onChange={(e)=>handleChange('count', Number(e.target.value))} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Alasan" value={form.reason} onChange={(e)=>handleChange('reason', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={2}>
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

			<TableExportToolbar title="Reject Karyawan" tableRef={tableRef} fileBaseName="reject-karyawan" />
			<TableContainer component={Paper}>
				<Table size="small" ref={tableRef}>
					<TableHead>
						<TableRow>
							<TableCell>Tanggal</TableCell>
							<TableCell>Nama</TableCell>
							<TableCell align="right">Jumlah</TableCell>
							<TableCell>Alasan</TableCell>
							<TableCell>Catatan</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtered.map(r => (
							<TableRow key={r.id}>
								<TableCell>{r.date}</TableCell>
								<TableCell>{r.name}</TableCell>
								<TableCell align="right">{r.count}</TableCell>
								<TableCell>{r.reason}</TableCell>
								<TableCell>{r.note}</TableCell>
							</TableRow>
						))}
						{filtered.length===0 && (<TableRow><TableCell colSpan={5} align="center">Belum ada data</TableCell></TableRow>)}
						{filtered.length>0 && (
							<TableRow>
								<TableCell colSpan={2} align="right" sx={{ fontWeight:700 }}>Total Reject</TableCell>
								<TableCell align="right" sx={{ fontWeight:700 }}>{totals}</TableCell>
								<TableCell colSpan={2}/>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
