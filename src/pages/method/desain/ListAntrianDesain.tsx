import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import TableExportToolbar from '../../../components/TableExportToolbar';

type RowData = {
	idRekap: string;
	idCustom: string;
	namaDesain: string;
	produk: string;
	tanggalInput: string;
	namaCS: string;
	status: string;
};

export default function ListAntrianDesain() {
	const tableRef = useRef<HTMLTableElement | null>(null);
	const [rows, setRows] = useState<RowData[]>([]);

	useEffect(() => {
		const raw = localStorage.getItem('design_queue');
		const list: any[] = raw ? JSON.parse(raw) : [];
		const mapped: RowData[] = list.map((it: any) => ({
			idRekap: it.idRekapCustom,
			idCustom: it.idCustom,
			namaDesain: it.namaDesain,
			produk: it.jenisProduk,
			tanggalInput: it.tanggalInput,
			namaCS: it.namaCS,
			status: it.status || '-',
		}));
		setRows(mapped);
	}, []);

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
			<Box sx={{ width: '100%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>List Antrian Desain</Typography>
				<TableExportToolbar title="List Antrian Desain" tableRef={tableRef} fileBaseName="list-antrian-desain" />
				<TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
					<Table sx={{ minWidth: 1000 }} aria-label="list-antrian-desain" ref={tableRef}>
						<TableHead>
							<TableRow>
								<TableCell>No</TableCell>
								<TableCell>ID Rekap Custom</TableCell>
								<TableCell>ID Custom</TableCell>
								<TableCell>Nama Desain</TableCell>
								<TableCell>Produk</TableCell>
								<TableCell>Tanggal Input</TableCell>
								<TableCell>Nama CS</TableCell>
								<TableCell>Status</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((row, idx) => (
								<TableRow key={row.idRekap}>
									<TableCell>{idx + 1}</TableCell>
									<TableCell>{row.idRekap}</TableCell>
									<TableCell>{row.idCustom}</TableCell>
									<TableCell>{row.namaDesain}</TableCell>
									<TableCell>{row.produk}</TableCell>
									<TableCell>{row.tanggalInput}</TableCell>
									<TableCell>{row.namaCS}</TableCell>
									<TableCell>{row.status}</TableCell>
								</TableRow>
							))}
							{rows.length === 0 && (
								<TableRow>
									<TableCell colSpan={8} align="center">Tidak ada data</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		</Box>
	);
}
