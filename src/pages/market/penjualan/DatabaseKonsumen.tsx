import React, { useState, useEffect, useRef } from 'react';
import kvStore from '../../../lib/kvStore';
import { supabase } from '../../../lib/supabaseClient';
import { Skeleton } from '@mui/material';
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
    Button,
    Stack
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
    const [loading, setLoading] = useState<boolean>(true);

    // Load data, prefer relational table 'customers', fallback ke kv_store('database_konsumen')
    useEffect(() => {
        let mounted = true;

        const mapFromCustomers = (rows: any[]): Konsumen[] =>
            rows.map((r) => ({
                id: r.id,
                nama: r.name ?? '',
                telepon: r.phone ?? '',
                alamat: r.address ?? '',
                createdAt: r.created_at ?? '',
            }));

        const mapFromKV = (arr: any[]): Konsumen[] =>
            arr.map((k: any, i: number) => ({
                id: k.id || String(i + 1),
                nama: k.nama || '',
                telepon: k.telepon || '',
                alamat: k.alamat || '',
                createdAt: k.createdAt || k.created_at || '',
            }));

        const loadFromCustomers = async (): Promise<boolean> => {
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('id,name,phone,address,created_at')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                if (!mounted) return true;
                setKonsumenList(mapFromCustomers(data || []));
                setLoading(false);
                return true;
            } catch (err) {
                return false;
            }
        };

        const loadFromKV = async () => {
            try {
                // warm from cache if available
                let arr: any[] = [];
                try {
                    const cached = kvStore.peek('database_konsumen');
                    if (cached) arr = Array.isArray(cached) ? cached : (cached ? JSON.parse(String(cached)) : []);
                    if (arr.length) setKonsumenList(mapFromKV(arr));
                } catch {}
                try {
                    const raw = await kvStore.get('database_konsumen');
                    arr = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []);
                } catch { arr = []; }
                if (mounted) { setKonsumenList(mapFromKV(arr)); setLoading(false); }
            } catch (error) {
                console.error('Error loading konsumen data:', error);
                if (mounted) { setAlert({ type: 'error', message: 'Gagal memuat data konsumen' }); setLoading(false); }
            }
        };

        const load = async () => {
            const ok = await loadFromCustomers();
            if (!ok) await loadFromKV();
        };

        load();

        // Realtime: subscribe customers; fallback: kv_store subscription
        const ch = supabase
          .channel('rt_customers')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async () => {
            if (!mounted) return;
            try {
              const { data, error } = await supabase
                .from('customers')
                .select('id,name,phone,address,created_at')
                .order('created_at', { ascending: false });
              if (!error && mounted) setKonsumenList(mapFromCustomers(data || []));
            } catch {}
          })
          .subscribe();

        const subKV = kvStore.subscribe('database_konsumen', (v: any) => {
            try { const arr = Array.isArray(v) ? v : (v ? JSON.parse(String(v)) : []); if (mounted) { setKonsumenList(mapFromKV(arr)); setLoading(false); } } catch {}
        });

        return () => { mounted = false; try { supabase.removeChannel(ch); } catch {}; try { subKV.unsubscribe(); } catch {} };
    }, []);


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
                    <Box sx={{ overflowX: 'auto', mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'nowrap', width: 'max-content' }}>
                            <TextField
                                placeholder="Cari konsumen..."
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
                            <Box sx={{ flex: 1 }} />
                            <TableExportToolbar title="Database Konsumen" tableRef={tableRef} fileBaseName="database-konsumen" />
                        </Stack>
                    </Box>
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
                                {loading && filteredKonsumen.length === 0 ? (
                                    Array.from({ length: 8 }).map((_, idx) => (
                                        <TableRow key={`sk-${idx}`}>
                                            <TableCell><Skeleton width={24} /></TableCell>
                                            <TableCell><Skeleton width={200} /></TableCell>
                                            <TableCell><Skeleton width={140} /></TableCell>
                                            <TableCell><Skeleton width={260} /></TableCell>
                                            <TableCell align="center"><Skeleton width={60} /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredKonsumen
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