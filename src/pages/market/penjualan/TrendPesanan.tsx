import { useState, useEffect } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Typography,
    Paper,
    Alert,
    Button
} from '@mui/material';
import {
    Search as SearchIcon,
} from '@mui/icons-material';

interface Trend {
    id: string;
    jenis_produk: string;
    jenis_pola: string;
    quantity: string;
    updatedAt?: string;
}

// Dummy removed; start empty when no localStorage

export default function TrendPesanan() {
    const [trendList, setTrendList] = useState<Trend[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    

    // Load data dari localStorage
    useEffect(() => {
        loadTrendData();
    }, []);

    const loadTrendData = () => {
        try {
            const storedData = localStorage.getItem('database_trend');
            if (storedData) {
                setTrendList(JSON.parse(storedData));
            } else {
                setTrendList([]);
                localStorage.setItem('database_trend', JSON.stringify([]));
            }
        } catch (error) {
            console.error('Error loading trend data:', error);
            setAlert({ type: 'error', message: 'Gagal memuat data trend' });
        }
    };

    

    const filteredTrend = trendList.filter(trend =>{
        const matchSearch = 
            trend.jenis_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trend.jenis_pola.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trend.quantity.includes(searchTerm)
        const d = trend.updatedAt || '';
        const inStart = startDate ? d >= startDate : true;
        const inEnd = endDate ? d <= endDate : true;
        const matchDate = inStart && inEnd;
        return matchSearch && matchDate
    });


    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            alignItem: 'center',
            p: 3,
            boxSizing: 'border-box',
            flexDirection: 'column',
        }}>
            <Box sx={{
                width: '80%',
                height: '500',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                p: 3,
                mb: 3
            }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
                    Trend Pesanan
                </Typography>

                {alert && (
                    <Alert
                        severity={alert.type}
                        onClose={() => setAlert(null)}
                        sx={{ mb: 2 }}
                    >
                        {alert.message}
                    </Alert>
                )}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <TextField
                            placeholder="Cari trend..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                            size='small'
                            sx={{ width: 250 }}
                        />
                        <TextField
                            label="Tanggal Awal"
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                            InputLabelProps={{ shrink: true }}
                            size='small'
                            sx={{ width: 180, ml: 2 }}
                        />
                        <TextField
                            label="Tanggal Akhir"
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                            InputLabelProps={{ shrink: true }}
                            size='small'
                            sx={{ width: 180, ml: 2 }}
                        />
                        <Button variant='outlined' size='small' sx={{ ml: 2 }} onClick={() => { setStartDate(''); setEndDate(''); setPage(0); }}>Reset</Button>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>No</TableCell>
                                    <TableCell>Jenis Produk</TableCell>
                                    <TableCell>Jenis Pola</TableCell>
                                    <TableCell>Quantity</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTrend
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((trend, idx) => (
                                        <TableRow key={`${trend.jenis_produk}-${trend.jenis_pola}-${trend.quantity}-${trend.updatedAt ?? ''}-${idx}`}>
                                            <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell>{trend.jenis_produk}</TableCell>
                                            <TableCell>{trend.jenis_pola}</TableCell>
                                            <TableCell>{trend.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredTrend.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
            </Box>
        </Box>
    );
};