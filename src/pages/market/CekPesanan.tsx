import { useRef, useState } from "react";
import { Box, Typography, TextField, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from "@mui/material";
import TableExportToolbar from '../../components/TableExportToolbar';

// Data diambil dari ListSPKOnProses
const rows = [
    {
        idRekapProduksi: "RP-001",
        idTransaksi: "TRX-001",
        jumlahSpk: 1,
    idSpk: "3001",
        idRekapCustom: "RC-1001",
        idCustom: "CUST-2001",
        namaDesain: "Desain 1",
        kuantity: 10,
        statusDesain: "Proses",
        statusKonten: "Lengkap",
        tglInputPesanan: "2025-09-09",
        deadlineKonsumen: "2025-09-15",
        tglSpkTerbit: "2025-09-10",
        selesaiDesainProduksi: "2025-09-11",
        selesaiCuttingPola: "2025-09-12",
        selesaiStockBordir: "",
        selesaiBordir: "",
        selesaiSetting: "",
        selesaiStockJahit: "",
        selesaiJahit: "",
        selesaiFinishing: "",
        selesaiFotoProduk: "",
        selesaiStockNt: "",
        selesaiPelunasan: "",
        selesaiPengiriman: "",
    },
    // Tambahkan data lain sesuai kebutuhan
];

type RowType = typeof rows[0];

function getStatusPesanan(row: RowType) {
    const selesaiFields: { key: keyof RowType; label: string }[] = [
        { key: "selesaiDesainProduksi", label: "Desain Produksi" },
        { key: "selesaiCuttingPola", label: "Cutting Pola" },
        { key: "selesaiStockBordir", label: "Stock Bordir" },
        { key: "selesaiBordir", label: "Bordir" },
        { key: "selesaiSetting", label: "Setting" },
        { key: "selesaiStockJahit", label: "Stock Jahit" },
        { key: "selesaiJahit", label: "Jahit" },
        { key: "selesaiFinishing", label: "Finishing" },
        { key: "selesaiFotoProduk", label: "Foto Produk" },
        { key: "selesaiStockNt", label: "Stock NT" },
        { key: "selesaiPelunasan", label: "Pelunasan" },
        { key: "selesaiPengiriman", label: "Pengiriman" },
    ];
    for (let i = selesaiFields.length - 1; i >= 0; i--) {
        const key = selesaiFields[i].key;
        if (row[key]) {
            return `Selesai ${selesaiFields[i].label}`;
        }
    }
    return "Proses";
}

export default function CekPesanan() {
    const [search, setSearch] = useState("");
    const tableRef = useRef<HTMLTableElement | null>(null);

    // Data hanya muncul jika search diisi dan cocok
    const result = search
        ? rows.filter(row =>
            row.idSpk.toLowerCase().includes(search.toLowerCase()) ||
            row.idTransaksi.toLowerCase().includes(search.toLowerCase()) ||
            row.idCustom.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                Cek Status Pesanan
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
                <TextField
                    label="Cari ID SPK / ID Transaksi / ID Custom"
                    variant="outlined"
                    size="small"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    sx={{ minWidth: 300 }}
                />
            </Box>
            {search && (
                <>
                <TableExportToolbar title="Cek Status Pesanan" tableRef={tableRef} fileBaseName="cek-status-pesanan" />
                <TableContainer component={Paper}>
                    <Table ref={tableRef}>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID SPK</TableCell>
                                <TableCell>ID Transaksi</TableCell>
                                <TableCell>ID Custom</TableCell>
                                <TableCell>Nama Desain</TableCell>
                                <TableCell>Kuantity</TableCell>
                                <TableCell>Status Pesanan</TableCell>
                                <TableCell>Deadline Konsumen</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {result.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{row.idSpk}</TableCell>
                                    <TableCell>{row.idTransaksi}</TableCell>
                                    <TableCell>{row.idCustom}</TableCell>
                                    <TableCell>{row.namaDesain}</TableCell>
                                    <TableCell>{row.kuantity}</TableCell>
                                    <TableCell>{getStatusPesanan(row)}</TableCell>
                                    <TableCell>{row.deadlineKonsumen}</TableCell>
                                </TableRow>
                            ))}
                            {result.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Tidak ada data ditemukan</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                </>
            )}
        </Box>
    );
}