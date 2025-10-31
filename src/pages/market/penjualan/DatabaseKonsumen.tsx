import React, { useState, useEffect, useRef } from 'react';
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
    IconButton,
    Typography,
    Paper,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button
} from '@mui/material';
import TableExportToolbar from '../../../components/TableExportToolbar';
import {
    Search as SearchIcon,
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

interface Konsumen {
    id: string;
    nama: string;
    telepon: string;
    alamat: string;
    createdAt: string;
}

// Dummy removed; start empty when no localStorage

const DatabaseKonsumen: React.FC = () => {
    const [konsumenList, setKonsumenList] = useState<Konsumen[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Load data dari localStorage
    useEffect(() => {
        loadKonsumenData();
    }, []);

    const loadKonsumenData = () => {
        try {
            const storedData = localStorage.getItem('database_konsumen');
            if (storedData) {
                setKonsumenList(JSON.parse(storedData));
            } else {
                setKonsumenList([]);
                localStorage.setItem('database_konsumen', JSON.stringify([]));
            }
        } catch (error) {
            console.error('Error loading konsumen data:', error);
            setAlert({ type: 'error', message: 'Gagal memuat data konsumen' });
        }
    };


    const handleWhatsapp = (telepon: string) => {
        const phoneNumber = telepon.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${phoneNumber}`;
        window.open(whatsappUrl, '_blank');
    }

    // Get unique dates for dropdown
    const uniqueDates = Array.from(new Set(konsumenList.map(k => k.createdAt).filter(Boolean)));

    const filteredKonsumen = konsumenList.filter(konsumen => {
        const matchSearch =
            konsumen.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            konsumen.telepon.includes(searchTerm) ||
            konsumen.alamat.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDate = selectedDate ? konsumen.createdAt === selectedDate : true;
        return matchSearch && matchDate;
    });

    const tableRef = useRef<HTMLTableElement | null>(null);
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
                    Database Konsumen
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
                            placeholder="Cari konsumen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                            size='small'
                            sx={{ width: 250 }}
                        />
                        <FormControl size='small' sx={{ m: 1, minWidth: 150 }}>
                            <InputLabel id='filter-tanggal'>Tanggal Awal</InputLabel>
                            <Select
                                labelId='filter-tanggal'
                                value={selectedDate}
                                label='Filter Tanggal'
                                onChange={e => setSelectedDate(e.target.value)}
                            >
                                <MenuItem value=''>Semua Tanggal</MenuItem>
                                {uniqueDates.map(date => (
                                    <MenuItem key={date} value={date}>{date}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size='small' sx={{ m: 1, minWidth: 150 }}>
                            <InputLabel id='filter-tanggal'>Tanggal Akhir</InputLabel>
                            <Select
                                labelId='filter-tanggal'
                                value={selectedDate}
                                label='Filter Tanggal'
                                onChange={e => setSelectedDate(e.target.value)}
                            >
                                <MenuItem value=''>Semua Tanggal</MenuItem>
                                {uniqueDates.map(date => (
                                    <MenuItem key={date} value={date}>{date}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button variant='outlined' size='small' onClick={() => setSelectedDate(selectedDate)}>Cari</Button>
                    </Box>

                    <TableExportToolbar title="Database Konsumen" tableRef={tableRef} fileBaseName="database-konsumen" />
                    <TableContainer component={Paper}>
                        <Table ref={tableRef}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>No</TableCell>
                                    <TableCell>Nama</TableCell>
                                    <TableCell>Telepon</TableCell>
                                    <TableCell>Alamat</TableCell>
                                    <TableCell align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredKonsumen
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((konsumen, idx) => (
                                        <TableRow key={`${konsumen.telepon}-${konsumen.createdAt}`}>
                                            <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell>{konsumen.nama}</TableCell>
                                            <TableCell>{konsumen.telepon}</TableCell>
                                            <TableCell>{konsumen.alamat}</TableCell>
                                            <TableCell align="center">

                                                <IconButton
                                                    color='success'
                                                    onClick={() => handleWhatsapp(konsumen.telepon)}
                                                    size='small'>
                                                    <WhatsAppIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredKonsumen.length}
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

export default DatabaseKonsumen;