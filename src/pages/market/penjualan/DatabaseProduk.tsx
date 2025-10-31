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
    Typography,
    Paper,
    Alert,
    Modal,
    Button
} from '@mui/material';
import {
    Search as SearchIcon,
} from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TableExportToolbar from '../../../components/TableExportToolbar';

interface DatabaseProduk {
    id: string
    id_spk: string
    nama_desain: string
    foto: string
}

// Dummy removed; start empty when no localStorage

export default function DatabaseProduk() {
    const [produkList, setProdukList] = useState<DatabaseProduk[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const [selectedProdukId, setSelectedProdukId] = useState<string | null>(null);
    const [showTable, setShowTable] = useState(false); // State untuk mengontrol tampilan tabel
    const tableRef = useRef<HTMLTableElement | null>(null);

    const handleOpen = (id: string) => {
        setSelectedProdukId(id);
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setSelectedProdukId(null);
    };

    // Load data dari localStorage
    useEffect(() => {
        loadDatabaseProduk();
    }, []);

    const loadDatabaseProduk = () => {
        try {
            const storedData = localStorage.getItem('database_produk');
            if (storedData) {
                setProdukList(JSON.parse(storedData));
            } else {
                setProdukList([]);
                localStorage.setItem('database_produk', JSON.stringify([]));
            }
        } catch (error) {
            console.error('Error loading database produk:', error);
            setAlert({ type: 'error', message: 'Gagal memuat data produk' });
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        // Tampilkan tabel hanya jika search term tidak kosong
        setShowTable(value.length > 0);
    };

    const filteredProduk = produkList.filter(produk =>
        produk.id_spk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produk.nama_desain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = () => {
        if (!selectedProdukId) return;

        const produk = produkList.find(p => p.id === selectedProdukId);
        if (produk && produk.foto) {
            const link = document.createElement('a');
            link.href = produk.foto;
            link.download = produk.foto.split('/').pop() || 'image.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

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
                    Database Produk
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
                <TextField
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ width: 250, mb: 2 }}
                />

                {showTable && ( // Hanya tampilkan tabel jika showTable true
                    <>
                        <TableExportToolbar title="Database Produk" tableRef={tableRef} fileBaseName="database-produk" />
                        <TableContainer component={Paper}>
                            <Table ref={tableRef}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No</TableCell>
                                        <TableCell>ID SPK</TableCell>
                                        <TableCell>Nama Desain</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredProduk
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((produk, index) => (
                                            <TableRow key={produk.id}>
                                                <TableCell>{index + 1 + (page * rowsPerPage)}</TableCell>
                                                <TableCell>{produk.id_spk}</TableCell>
                                                <TableCell>{produk.nama_desain}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => handleOpen(produk.id)}>
                                                        <VisibilityIcon />
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
                            count={filteredProduk.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                        />
                    </>
                )}

                <Modal
                    open={openModal}
                    onClose={handleClose}
                    aria-labelledby="gambar-modal-title"
                    aria-describedby="gambar-modal"
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,
                        alignItems: 'center',
                        flexDirection: 'column',
                    }}>
                        <Typography id='gambar-modal-title' variant="h6" component="h2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                            Gambar Produk
                        </Typography>
                        <Box id='gambar-modal' sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            {selectedProdukId && (() => {
                                const produk = produkList.find(p => p.id === selectedProdukId);
                                return produk ? (
                                    <img
                                        src={produk.foto}
                                        alt={produk.nama_desain}
                                        style={{ maxWidth: '100%', borderRadius: 8 }}
                                    />
                                ) : (
                                    <Typography variant="body2">Gambar tidak ditemukan</Typography>
                                );
                            })()}
                        </Box>
                        <Button
                            variant="contained"
                            sx={{ mt: 2 }}
                            onClick={handleDownload}
                            fullWidth
                        >
                            Download
                        </Button>
                    </Box>
                </Modal>
            </Box>
        </Box>
    );
};