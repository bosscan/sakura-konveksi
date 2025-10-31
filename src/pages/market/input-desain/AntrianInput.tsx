import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button } from "@mui/material";
import { useEffect, useRef, useState } from 'react';
import TableExportToolbar from '../../../components/TableExportToolbar';
import { useNavigate } from "react-router-dom";

export default function AntrianInput() {
    const navigate = useNavigate();
    const tableRef = useRef<HTMLTableElement | null>(null);
    type QueueItem = {
        idSpk: string;
        namaPemesan: string;
        quantity: string;
        tipeTransaksi: string;
        namaCS: string;
        tanggalInput: string;
    };
    const [rows, setRows] = useState<QueueItem[]>([]);

    const migrateOldSpkData = () => {
        const key = 'antrian_input_desain';
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const list: any[] = JSON.parse(raw) || [];
            let changed = false;
            // helper to get next 7-digit id (keeps and updates spk_auto_seq)
            const seqKey = 'spk_auto_seq';
            const nextId = () => {
                let seq = parseInt(localStorage.getItem(seqKey) || '1000000', 10);
                if (!Number.isFinite(seq) || seq < 1000000) seq = 1000000;
                seq += 1;
                localStorage.setItem(seqKey, String(seq));
                return String(seq).padStart(7, '0');
            };
            const cleaned = list.map((row) => {
                const orig = String(row?.idSpk ?? '');
                const normalized = orig.replace(/\s+/g, '').replace(/SPK-/gi, '');
                // if not exactly 7 digits, remap to new 7-digit sequence
                if (!/^\d{7}$/.test(normalized)) {
                    const fresh = nextId();
                    changed = true;
                    return { ...row, idSpk: fresh };
                }
                if (normalized !== row?.idSpk) { changed = true; return { ...row, idSpk: normalized }; }
                return row;
            });
            if (changed) {
                localStorage.setItem(key, JSON.stringify(cleaned));
            }
            // Sync auto sequence with current max ID
            const nums = cleaned
                .map((r: any) => parseInt(String(r?.idSpk ?? '').replace(/\D/g, ''), 10))
                .filter((n: number) => Number.isFinite(n));
            if (nums.length) {
                const maxNum = Math.max(...nums);
                const cur = parseInt(localStorage.getItem(seqKey) || '1000000', 10);
                if (!Number.isFinite(cur) || cur < maxNum) {
                    localStorage.setItem(seqKey, String(maxNum));
                }
            }
        } catch {}
    };

    const refresh = () => {
        const raw = localStorage.getItem('antrian_input_desain');
        const list: QueueItem[] = raw ? JSON.parse(raw) : [];
        setRows(list);
    };

    useEffect(() => {
        migrateOldSpkData();
        refresh();
        const onStorage = (e: StorageEvent) => { if (e.key === 'antrian_input_desain') refresh(); };
        window.addEventListener('storage', onStorage);
        const timer = setInterval(refresh, 2000);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
    }, []);

    const formatWIB = (value?: string) => {
        if (!value) return '-';
        
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        const date = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).format(d).replace(/\//g, '-');
        const time = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(d);
        return `${date} ${time}`;
    };

    return (
        <Box
        sx={{
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
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Antrian Input Desain</Typography>
                <Box>
                    <TableExportToolbar title="Antrian Input Desain" tableRef={tableRef} fileBaseName="antrian-input-desain" />
                    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650}} aria-label="antrian-input" ref={tableRef}>
                    <TableHead>
                        <TableRow>
                            <TableCell>No</TableCell>
                            <TableCell>No. SPK</TableCell>
                            <TableCell>Nama Pemesan</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Tipe Transaksi</TableCell>
                            <TableCell>Nama CS Input</TableCell>
                            <TableCell>Tanggal Input Pesanan</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={row.idSpk}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {(() => {
                                        const raw = String(row.idSpk || '-');
                                        return raw.replace(/\s+/g, '').replace(/SPK-/gi, '');
                                    })()}
                                </TableCell>
                                <TableCell>{row.namaPemesan}</TableCell>
                                <TableCell>{row.quantity}</TableCell>
                                <TableCell>{row.tipeTransaksi}</TableCell>
                                <TableCell>{row.namaCS}</TableCell>
                                <TableCell>{formatWIB(row.tanggalInput)}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => {
                                            try {
                                                localStorage.setItem('current_spk_context', JSON.stringify(row));
                                            } catch {}
                                            navigate('/market/input-desain/input-spesifikasi');
                                        }}
                                    >
                                        Input Desain
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center">Tidak ada antrian</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
                </Box>
            </Box>
        </Box>
    )
}