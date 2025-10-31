import { useMemo, useRef, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import TableExportToolbar from '../../components/TableExportToolbar';
import Grid from '@mui/material/GridLegacy';

type Output = { id: string; date: string; name: string; output: number; hours: number; note?: string };
const STORAGE_KEY = 'mp_capaian';

export default function CapaianKaryawan() {
	const [rows, setRows] = useState<Output[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
	const [form, setForm] = useState<Omit<Output,'id'>>({ date:new Date().toISOString().slice(0,10), name:'', output:0, hours:0, note:'' });
	const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
	const [search, setSearch] = useState('');
	const handleChange = (k:keyof typeof form, v:any)=> setForm(f=>({...f,[k]:v}));
	const save = (list:Output[])=>{ setRows(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
	const add = ()=>{ if(!form.name) return; const next:Output = { id: crypto.randomUUID(), ...form }; save([next, ...rows]); setForm({ date:new Date().toISOString().slice(0,10), name:'', output:0, hours:0, note:'' }); };
	const filtered = useMemo(()=> rows.filter(r => r.date.startsWith(month) && [r.name,r.note||''].join(' ').toLowerCase().includes(search.toLowerCase())), [rows, month, search]);
	const totals = useMemo(()=> filtered.reduce((acc,r)=>{ acc.output+=r.output; acc.hours+=r.hours; return acc; }, { output:0, hours:0 }), [filtered]);
	const tableRef = useRef<HTMLTableElement | null>(null);

	return (
		<Box sx={{ p:3 }}>
			<Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Capaian Karyawan</Typography>
			<Paper sx={{ p:2, mb:2 }}>
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth type="date" label="Tanggal" InputLabelProps={{ shrink:true }} value={form.date} onChange={(e)=>handleChange('date', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField fullWidth label="Nama" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth label="Output" type="number" value={form.output} onChange={(e)=>handleChange('output', Number(e.target.value))} size="small" />
					</Grid>
					<Grid item xs={12} sm={6} md={2}>
						<TextField fullWidth label="Jam Kerja" type="number" value={form.hours} onChange={(e)=>handleChange('hours', Number(e.target.value))} size="small" />
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

			<TableExportToolbar title="Capaian Karyawan" tableRef={tableRef} fileBaseName="capaian-karyawan" />
			<TableContainer component={Paper}>
				<Table size="small" ref={tableRef}>
					<TableHead>
						<TableRow>
							<TableCell>Tanggal</TableCell>
							<TableCell>Nama</TableCell>
							<TableCell align="right">Output</TableCell>
							<TableCell align="right">Jam</TableCell>
							<TableCell>Catatan</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtered.map(r => (
							<TableRow key={r.id}>
								<TableCell>{r.date}</TableCell>
								<TableCell>{r.name}</TableCell>
								<TableCell align="right">{r.output}</TableCell>
								<TableCell align="right">{r.hours}</TableCell>
								<TableCell>{r.note}</TableCell>
							</TableRow>
						))}
						{filtered.length===0 && (<TableRow><TableCell colSpan={5} align="center">Belum ada data</TableCell></TableRow>)}
						{filtered.length>0 && (
							<TableRow>
								<TableCell colSpan={2} align="right" sx={{ fontWeight:700 }}>Total</TableCell>
								<TableCell align="right" sx={{ fontWeight:700 }}>{totals.output}</TableCell>
								<TableCell align="right" sx={{ fontWeight:700 }}>{totals.hours}</TableCell>
								<TableCell/>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
