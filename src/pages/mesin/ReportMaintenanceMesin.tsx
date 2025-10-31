import { useMemo, useState } from 'react';
import { Box, Typography, Paper, Stack, TextField, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, MenuItem } from '@mui/material';
import { useRef } from 'react';
import TableExportToolbar from '../../components/TableExportToolbar';

type Maintenance = { id: string; date: string; machineCode: string; action: string; technician: string; status: 'Selesai'|'Proses'|'Tertunda'; cost: number; note?: string };
const STORAGE_KEY = 'mesin_maintenance_logs';

export default function ReportMaintenanceMesin() {
	const tableRef = useRef<HTMLTableElement | null>(null);
	const [logs, setLogs] = useState<Maintenance[]>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } });
	const [form, setForm] = useState<Omit<Maintenance,'id'>>({ date:new Date().toISOString().slice(0,10), machineCode:'', action:'', technician:'', status:'Selesai', cost:0, note:'' });
	const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7));
	const [status, setStatus] = useState<'ALL'|Maintenance['status']>('ALL');
	const [search, setSearch] = useState('');

	const save = (list:Maintenance[])=>{ setLogs(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
	const handleChange = (k:keyof typeof form, v:any)=> setForm(f=>({...f,[k]:v}));
	const add = ()=>{ if(!form.machineCode || !form.action) return; const next:Maintenance = { id: crypto.randomUUID(), ...form }; save([next, ...logs]); setForm({ date:new Date().toISOString().slice(0,10), machineCode:'', action:'', technician:'', status:'Selesai', cost:0, note:'' }); };

	const filtered = useMemo(()=> logs.filter(l => l.date.startsWith(month) && (status==='ALL' || l.status===status) && [l.machineCode,l.action,l.technician,l.note||''].join(' ').toLowerCase().includes(search.toLowerCase())), [logs, month, status, search]);
	const totals = useMemo(()=> filtered.reduce((a,l)=> a + l.cost, 0), [filtered]);

	return (
		<Box sx={{ p:3 }}>
			<Typography variant="h6" fontWeight={700} sx={{ mb:2, textAlign:'center' }}>Report Maintenance Mesin</Typography>
			<Paper sx={{ p:2, mb:2 }}>
				<Stack direction={{ xs:'column', sm:'row' }} spacing={2} flexWrap="wrap">
					<TextField type="date" label="Tanggal" InputLabelProps={{ shrink:true }} value={form.date} onChange={(e)=>handleChange('date', e.target.value)} size="small" />
					<TextField label="Kode Mesin" value={form.machineCode} onChange={(e)=>handleChange('machineCode', e.target.value)} size="small" />
					<TextField label="Tindakan" value={form.action} onChange={(e)=>handleChange('action', e.target.value)} size="small" sx={{ minWidth:200 }} />
					<TextField label="Teknisi" value={form.technician} onChange={(e)=>handleChange('technician', e.target.value)} size="small" />
					<TextField select label="Status" value={form.status} onChange={(e)=>handleChange('status', e.target.value)} size="small">{['Selesai','Proses','Tertunda'].map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
					<TextField label="Biaya" type="number" value={form.cost} onChange={(e)=>handleChange('cost', Number(e.target.value))} size="small" />
					<TextField label="Catatan" value={form.note} onChange={(e)=>handleChange('note', e.target.value)} size="small" sx={{ minWidth:200 }} />
					<Button variant="contained" onClick={add} sx={{ alignSelf:'center' }}>Tambah</Button>
					<Box sx={{ flex:1 }} />
					<TextField type="month" label="Bulan" InputLabelProps={{ shrink:true }} value={month} onChange={(e)=>setMonth(e.target.value)} size="small" />
					<TextField select label="Filter Status" value={status} onChange={(e)=>setStatus(e.target.value as any)} size="small" sx={{ minWidth:140 }}>
						{['ALL','Selesai','Proses','Tertunda'].map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}
					</TextField>
					<TextField label="Cari" value={search} onChange={(e)=>setSearch(e.target.value)} size="small" sx={{ minWidth:200 }} />
				</Stack>
			</Paper>

			<TableExportToolbar title="Report Maintenance Mesin" tableRef={tableRef} fileBaseName="report-maintenance-mesin" />
			<TableContainer component={Paper}>
				<Table size="small" ref={tableRef}>
					<TableHead>
						<TableRow>
							<TableCell>Tanggal</TableCell>
							<TableCell>Kode Mesin</TableCell>
							<TableCell>Tindakan</TableCell>
							<TableCell>Teknisi</TableCell>
							<TableCell>Status</TableCell>
							<TableCell align="right">Biaya</TableCell>
							<TableCell>Catatan</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filtered.map(it => (
							<TableRow key={it.id}>
								<TableCell>{it.date}</TableCell>
								<TableCell>{it.machineCode}</TableCell>
								<TableCell>{it.action}</TableCell>
								<TableCell>{it.technician}</TableCell>
								<TableCell>{it.status}</TableCell>
								<TableCell align="right">{it.cost.toLocaleString()}</TableCell>
								<TableCell>{it.note}</TableCell>
							</TableRow>
						))}
						{filtered.length===0 && (<TableRow><TableCell colSpan={7} align="center">Belum ada data</TableCell></TableRow>)}
						{filtered.length>0 && (
							<TableRow>
								<TableCell colSpan={5} align="right" sx={{ fontWeight:700 }}>Total Biaya</TableCell>
								<TableCell align="right" sx={{ fontWeight:700 }}>{totals.toLocaleString()}</TableCell>
								<TableCell/>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
