import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Link } from '@mui/material';

type Row = { name: string; count: number; qtyTotal?: number };

type Props = {
	rows: Array<Row>;
	title?: string;
	onOpenDetails?: (name: string) => void;
};

export default function ProductTable({ rows, title = 'Ringkasan Produk', onOpenDetails }: Props) {
	return (
		<Paper sx={{ p: 2 }}>
			<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>{title}</Typography>
			<TableContainer>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Produk</TableCell>
							<TableCell align="right">Jumlah SPK</TableCell>
							<TableCell align="right">Quantity</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow><TableCell colSpan={3} align="center">Tidak ada data</TableCell></TableRow>
						) : rows.map((r) => (
							<TableRow key={r.name}>
								<TableCell>{r.name}</TableCell>
								<TableCell align="right">
									{typeof onOpenDetails === 'function' ? (
										<Link component="button" type="button" onClick={() => onOpenDetails(r.name)} underline="hover" sx={{ color: 'primary.main', fontWeight: 700 }}>
											{r.count}
										</Link>
									) : r.count}
								</TableCell>
								<TableCell align="right">{r.qtyTotal ?? 0}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
}
