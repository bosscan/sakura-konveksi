import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button } from "@mui/material";
import { useEffect, useRef, useState } from 'react';
import kvStore from '../../../lib/kvStore';
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

    const migrateOldSpkData = async () => {
        const key = 'antrian_input_desain';
        try {
            let raw: any = null;
            try { raw = await kvStore.get(key); } catch { raw = null; }
            if (!raw) return;
            const list: any[] = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []);
            let changed = false;
            // helper to get next 7-digit id (keeps and updates spk_auto_seq)
            const seqKey = 'spk_auto_seq';
            const nextId = async () => {
                try {
                    const sraw = await kvStore.get(seqKey);
                    let seq = Number.isFinite(Number(sraw)) ? parseInt(String(sraw), 10) : NaN;
                    if (!Number.isFinite(seq) || seq < 1000000) seq = 1000000;
                    seq += 1;
                    await kvStore.set(seqKey, String(seq));
                    return String(seq).padStart(7, '0');
                } catch { return String(1000001).padStart(7, '0'); }
            };
            const cleaned = await Promise.all(list.map(async (row) => {
                const orig = String(row?.idSpk ?? '');
                const normalized = orig.replace(/\s+/g, '').replace(/SPK-/gi, '');
                if (!/^\d{7}$/.test(normalized)) {
                    const fresh = await nextId();
                    changed = true;
                    return { ...row, idSpk: fresh };
                }
                if (normalized !== row?.idSpk) { changed = true; return { ...row, idSpk: normalized }; }
                return row;
            }));
            if (changed) {
                try { await kvStore.set(key, cleaned); } catch {}
            }
            // Sync auto sequence with current max ID
            const nums = cleaned
                .map((r: any) => parseInt(String(r?.idSpk ?? '').replace(/\D/g, ''), 10))
                .filter((n: number) => Number.isFinite(n));
            if (nums.length) {
                const maxNum = Math.max(...nums);
                try {
                    const curRaw = await kvStore.get(seqKey);
                    const cur = Number.isFinite(Number(curRaw)) ? parseInt(String(curRaw), 10) : 1000000;
                    if (!Number.isFinite(cur) || cur < maxNum) {
                        try { await kvStore.set(seqKey, String(maxNum)); } catch {}
                    }
                } catch {}
            }
        } catch {}
    };

    const refresh = async () => {
        try {
            const raw = await kvStore.get('antrian_input_desain');
            const list: QueueItem[] = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []);
            setRows(list);
        } catch { setRows([]); }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            await migrateOldSpkData();
            if (!mounted) return;
            await refresh();
            try {
                const sub = kvStore.subscribe('antrian_input_desain', (v) => {
                    try {
                        const list = Array.isArray(v) ? v : (v ? JSON.parse(String(v)) : []);
                        setRows(list);
                    } catch { setRows([]); }
                });
                return () => { try { sub.unsubscribe(); } catch {} };
            } catch {}
        })();
        return () => { mounted = false; };
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
                width: { xs: '100%', md: '80%' },
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
                <Table sx={{ minWidth: 720 }} aria-label="antrian-input" ref={tableRef}>
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
                                        onClick={async () => {
                                            try { await kvStore.set('current_spk_context', row); } catch {}
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