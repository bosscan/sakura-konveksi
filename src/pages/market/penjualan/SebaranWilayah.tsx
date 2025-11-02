import { useState, useEffect } from 'react';
import kvStore from '../../../lib/kvStore';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Stack
} from '@mui/material';
import {
    Search as SearchIcon,
} from '@mui/icons-material';

interface SebaranWilayah {
    id: string
    kecamatan: string
    kabupaten: string
    provinsi: string
    jumlah_konsumen: string
    total_pesanan: string
    updatedAt?: string
}

// Dummy removed; start empty when no localStorage

export default function SebaranWilayah() {
    const [sebaranList, setSebaranList] = useState<SebaranWilayah[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Load data from kvStore and subscribe
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                let arr: any[] = [];
                try { const raw = await kvStore.get('database_sebaran'); arr = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []); } catch { arr = []; }
                if (mounted) setSebaranList(arr);
            } catch (e) {
                console.error('Error loading sebaran data:', e);
                if (mounted) setAlert({ type: 'error', message: 'Gagal memuat data sebaran' });
            }
        };
        load();
        const sub = kvStore.subscribe('database_sebaran', (v: any) => {
            try { const arr = Array.isArray(v) ? v : (v ? JSON.parse(String(v)) : []); if (mounted) setSebaranList(arr); } catch {}
        });
        return () => { mounted = false; try { sub.unsubscribe(); } catch {} };
    }, []);

    const filteredSebaran = sebaranList.filter(sebaran =>{
        const matchSearch =
            sebaran.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sebaran.kabupaten.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sebaran.provinsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sebaran.jumlah_konsumen.includes(searchTerm)
        const matchDate = selectedDate ? sebaran.updatedAt === selectedDate : true;
        return matchSearch && matchDate;
    });

    const uniqueDates = Array.from(new Set(sebaranList.map(sebaran => sebaran.updatedAt)));

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
                    Sebaran Wilayah Konsumen
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
                    <Box sx={{ overflowX: 'auto', mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'nowrap', width: 'max-content' }}>
                            <TextField
                                placeholder="Cari sebaran Wilayah..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                }}
                                size='small'
                                sx={{ width: { xs: 220, sm: 260, md: 320 } }}
                            />
                            <FormControl size='small' sx={{ minWidth: { xs: 160, sm: 180, md: 200 } }}>
                                <InputLabel id='filter-tanggal-awal'>Tanggal Awal</InputLabel>
                                <Select
                                    labelId='filter-tanggal-awal'
                                    value={selectedDate}
                                    label='Tanggal Awal'
                                    onChange={e => setSelectedDate(e.target.value)}
                                >
                                    <MenuItem value=''>Semua Tanggal</MenuItem>
                                    {uniqueDates.map(date => (
                                        <MenuItem key={date} value={date}>{date}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size='small' sx={{ minWidth: { xs: 160, sm: 180, md: 200 } }}>
                                <InputLabel id='filter-tanggal-akhir'>Tanggal Akhir</InputLabel>
                                <Select
                                    labelId='filter-tanggal-akhir'
                                    value={selectedDate}
                                    label='Tanggal Akhir'
                                    onChange={e => setSelectedDate(e.target.value)}
                                >
                                    <MenuItem value=''>Semua Tanggal</MenuItem>
                                    {uniqueDates.map(date => (
                                        <MenuItem key={date} value={date}>{date}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button variant='outlined' size='small' onClick={() => setSelectedDate(selectedDate)}>Cari</Button>
                        </Stack>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>No</TableCell>
                                    <TableCell>Kecamatan</TableCell>
                                    <TableCell>Kabupaten</TableCell>
                                    <TableCell>Provinsi</TableCell>
                                    <TableCell>Jumlah Konsumen</TableCell>
                                    <TableCell>Jumlah PCS Dipesan</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSebaran
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((trend, idx) => (
                                        <TableRow key={`${trend.kecamatan}-${trend.kabupaten}-${trend.provinsi}`}>
                                            <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell>{trend.kecamatan}</TableCell>
                                            <TableCell>{trend.kabupaten}</TableCell>
                                            <TableCell>{trend.provinsi}</TableCell>
                                            <TableCell>{trend.jumlah_konsumen}</TableCell>
                                            <TableCell>{trend.total_pesanan}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredSebaran.length}
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