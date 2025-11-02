import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button, Modal, TextField, Snackbar, Alert, Chip } from "@mui/material";
import { useEffect, useRef, useState } from 'react';
import TableExportToolbar from '../../components/TableExportToolbar';
import kvStore from '../../lib/kvStore';

function RevisiDesainModal({ open, onClose, onSubmit }: { open: boolean, onClose: () => void, onSubmit: (payload: { catatan: string }) => void }) {
    type Asset = {
        file: File | null;
        ukuran: string;
        jarak: string;
        keterangan: string;
    };

    const [assets, setAssets] = useState<Asset[]>([
        { file: null, ukuran: '', jarak: '', keterangan: '' },
        { file: null, ukuran: '', jarak: '', keterangan: '' },
        { file: null, ukuran: '', jarak: '', keterangan: '' },
        { file: null, ukuran: '', jarak: '', keterangan: '' },
    ]);
    const [catatan, setCatatan] = useState("");

    const handleFileChange = (idx: number, file: File | null) => {
        const newAssets = [...assets];
        newAssets[idx].file = file;
        setAssets(newAssets);
    };

    const handleChange = (
        idx: number,
        field: 'ukuran' | 'jarak' | 'keterangan',
        value: string
    ) => {
        const newAssets = [...assets];
        newAssets[idx][field] = value;
        setAssets(newAssets);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ catatan });
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                minWidth: 600,
                borderRadius: 2,
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                    Asset Revisi Desain
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        {assets.map((asset, idx) => (
                            <Box key={idx} sx={{ border: '1px solid #ccc', p: 2, borderRadius: 1, width: '25%' }}>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>Asset Revisi {idx + 1}</Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    sx={{ mb: 1 }}
                                >
                                    Upload
                                    <input
                                        type="file"
                                        hidden
                                        onChange={e => handleFileChange(idx, e.target.files?.[0] || null)}
                                    />
                                </Button>
                                <TextField
                                    label="Ukuran"
                                    size="small"
                                    fullWidth
                                    sx={{ mb: 1 }}
                                    value={asset.ukuran}
                                    onChange={e => handleChange(idx, 'ukuran', e.target.value)}
                                />
                                <TextField
                                    label="Jarak"
                                    size="small"
                                    fullWidth
                                    sx={{ mb: 1 }}
                                    value={asset.jarak}
                                    onChange={e => handleChange(idx, 'jarak', e.target.value)}
                                />
                                <TextField
                                    label="Keterangan"
                                    size="small"
                                    fullWidth
                                    value={asset.keterangan}
                                    onChange={e => handleChange(idx, 'keterangan', e.target.value)}
                                />
                            </Box>
                        ))}
                    </Box>
                    <TextField
                        label="Catatan Revisi Desain"
                        multiline
                        rows={3}
                        fullWidth
                        sx={{ mb: 2 }}
                        value={catatan}
                        onChange={e => setCatatan(e.target.value)}
                    />
                    <Button type="submit" variant="contained" fullWidth>
                        Submit
                    </Button>
                </form>
            </Box>
        </Modal>
    );
}

function MockupDetailModal({ open, onClose, mockupUrl }: { open: boolean, onClose: () => void, mockupUrl: string }) {
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 300,
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Preview Mockup</Typography>
                <img
                    src={mockupUrl}
                    alt="Mockup"
                    style={{ width: 300, height: 300, objectFit: 'contain', borderRadius: 8, marginBottom: 16 }}
                />
                <a
                    href={mockupUrl}
                    download="mockup-desain.jpg"
                    style={{ textDecoration: 'none', width: '100%' }}
                >
                    <Button variant="contained" color="primary" fullWidth>
                        Download
                    </Button>
                </a>
            </Box>
        </Modal>
    );
}

function ValidasiConfirmModal({
    open,
    onClose,
    onConfirm
}: {
    open: boolean,
    onClose: () => void,
    onConfirm: () => void
}) {
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                minWidth: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                    Anda yakin akan memvalidasi desain ini?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 2 }}>
                    <Button variant="outlined" color="inherit" fullWidth onClick={onClose}>
                        Tidak
                    </Button>
                    <Button variant="contained" color="primary" fullWidth onClick={onConfirm}>
                        Ya
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}

// ResetAllSpkConfirmModal removed per request

type RowData = {
    queueId?: string;
    idRekap: string;
    idSpk: string; // Kolom baru
    idCustom: string;
    namaDesain: string;
    produk: string;
    tanggalInput: string;
    namaCS: string;
    status: string;
    mockupUrl: string;
};

export default function AntrianPengerjaan() {
    const tableRef = useRef<HTMLTableElement | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [openMockupModal, setOpenMockupModal] = useState(false);
    const [mockupUrl, setMockupUrl] = useState<string>("");
    const [openValidasiModal, setOpenValidasiModal] = useState(false);
    const [validasiRow, setValidasiRow] = useState<number | null>(null);
    // const [openResetModal, setOpenResetModal] = useState(false);

    const [rows, setRows] = useState<RowData[]>([]);
    const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

    // Load from shared queue as report source
    const refresh = async () => {
        try {
            const raw = await kvStore.get('design_queue') || [];
            const list: any[] = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
            // One-time migration: inject queueId if missing
            let mutated = false;
            for (const it of list) {
                if (!it.queueId) { it.queueId = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; mutated = true; }
            }
            if (mutated) { try { await kvStore.set('design_queue', list); } catch {} }

            // read thumbnail map keyed by queueId
            let thumbMap: Record<string, string> = {};
            try {
                const rawThumb = await kvStore.get('mockup_thumb_map') || {};
                thumbMap = rawThumb && typeof rawThumb === 'object' ? rawThumb : (typeof rawThumb === 'string' ? JSON.parse(rawThumb) : {});
            } catch { }
            let dsMap: Record<string, any> = {};
            try {
                const rawDs = await kvStore.get('spk_design') || {};
                dsMap = rawDs && typeof rawDs === 'object' ? rawDs : (typeof rawDs === 'string' ? JSON.parse(rawDs) : {});
            } catch { }

            const mapped: RowData[] = list
                .filter(it => ((it.status || '').trim().toLowerCase()) !== 'desain di validasi')
                .map((it) => ({
                    queueId: it.queueId,
                    idRekap: it.idRekapCustom,
                    idSpk: it.idSpk || '-',
                    idCustom: it.idCustom,
                    namaDesain: it.namaDesain,
                    produk: it.jenisProduk,
                    tanggalInput: it.tanggalInput,
                    namaCS: it.namaCS,
                    status: it.status || 'Update Status',
                    mockupUrl: it?.worksheet?.mockup?.file || it.assets?.[0]?.file || thumbMap?.[it.queueId] || (dsMap?.[it.idSpk || '']?.mockupUrl || 'https://via.placeholder.com/300x300?text=Mockup'),
                }));
            setRows(mapped);
        } catch (e) {
            // fallback to empty
            setRows([]);
        }
    };
    useEffect(() => {
        let mounted = true;
        const run = async () => { if (!mounted) return; await refresh(); };
        run();
        const sub = kvStore.subscribe('design_queue', () => { run().catch(() => {}); });
        const timer = setInterval(() => { run().catch(() => {}); }, 2000);
        return () => { mounted = false; try { sub.unsubscribe(); } catch {} ; clearInterval(timer); };
    }, []);

    // Ubah status menjadi "Antrian revisi"
    const handleRevisiSubmit = async ({ catatan }: { catatan: string }) => {
        if (selectedRow !== null) {
            const newRows = [...rows];
            newRows[selectedRow].status = "Antrian revisi";
            setRows(newRows);
            // persist back to queue with revisi catatan
            try {
                const raw = await kvStore.get('design_queue') || [];
                const list: any[] = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
                const target = newRows[selectedRow!];
                const idx = list.findIndex((x) => (target.queueId && x.queueId === target.queueId)
                    || (x.idRekapCustom === target.idRekap && String(x.idSpk || '') === String(target.idSpk || '')));
                if (idx >= 0) {
                    list[idx].status = newRows[selectedRow!].status;
                    list[idx].revisiCatatan = catatan;
                    try { await kvStore.set('design_queue', list); } catch {}
                }
            } catch {}
            setSnack({ open: true, message: 'Masuk ke Antrian Revisi Desain', severity: 'success' });
        }
    };

    // Konfirmasi validasi
    const handleValidasi = (index: number) => {
        setValidasiRow(index);
        setOpenValidasiModal(true);
    };

    // Jika klik "Ya" pada konfirmasi validasi
    const handleConfirmValidasi = async () => {
        if (validasiRow !== null) {
            const newRows = [...rows];
            newRows[validasiRow].status = "Desain di validasi";
            setRows(newRows.filter(r => r.status !== 'Desain di validasi'));
            try {
                const raw = await kvStore.get('design_queue') || [];
                const list: any[] = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
                const target = newRows[validasiRow!];
                const idx = list.findIndex((x) => (target.queueId && x.queueId === target.queueId)
                    || (x.idRekapCustom === target.idRekap && String(x.idSpk || '') === String(target.idSpk || '')));
                if (idx >= 0) {
                    const source = list[idx];
                    // push into keranjang FIRST
                    const kKey = 'keranjang';
                    const kRaw = await kvStore.get(kKey) || [];
                    const cart = Array.isArray(kRaw) ? kRaw : (typeof kRaw === 'string' ? JSON.parse(kRaw) : []);
                    const item = newRows[validasiRow!];
                    const exists = cart.some((c: any) => c.idRekap === item.idRekap);
                    if (!exists) {
                        const isGood = (v: any) => typeof v === 'string' && /^\d{7}$/.test(v);
                        let finalIdSpk = isGood(item.idSpk) ? item.idSpk : '';
                        if (!finalIdSpk && isGood(source?.idSpk)) finalIdSpk = source.idSpk;
                        if (!finalIdSpk) {
                            try {
                                const qRaw = await kvStore.get('antrian_input_desain') || [];
                                const qList = Array.isArray(qRaw) ? qRaw : (typeof qRaw === 'string' ? JSON.parse(qRaw) : []);
                                const candidates = [item.idSpk, source?.idSpk].filter(Boolean);
                                const found = qList.find((q: any) => candidates.includes(q?.idSpk));
                                if (isGood(found?.idSpk)) finalIdSpk = found.idSpk;
                            } catch { }
                        }
                        if (!finalIdSpk) {
                            setSnack({ open: true, message: 'Gagal memasukkan ke keranjang: ID SPK tidak ditemukan.', severity: 'error' });
                            return;
                        }
                        let qtyStr = String(source?.spkQuantity || '');
                        if (!qtyStr) {
                            try {
                                const qRaw = await kvStore.get('antrian_input_desain') || [];
                                const qList = Array.isArray(qRaw) ? qRaw : (typeof qRaw === 'string' ? JSON.parse(qRaw) : []);
                                const found = qList.find((q: any) => q?.idSpk === finalIdSpk);
                                const n = Number(String(found?.quantity ?? '').replace(/[^\d-]/g, ''));
                                qtyStr = !isNaN(n) && n > 0 ? String(n) : '0';
                            } catch { }
                        }
                        cart.push({
                            idRekap: item.idRekap,
                            idSpk: finalIdSpk,
                            idCustom: item.idCustom,
                            namaDesain: item.namaDesain,
                            namaKonsumen: '-',
                            kuantity: Number(qtyStr) || 0,
                            selected: false,
                        });
                        try { await kvStore.set(kKey, cart); } catch {}
                        // Persist mockup snapshot for Print SPK
                        try {
                            const dsKey = 'spk_design';
                            const dsRaw = await kvStore.get(dsKey) || {};
                            const dsMap = dsRaw && typeof dsRaw === 'object' ? dsRaw : (typeof dsRaw === 'string' ? JSON.parse(dsRaw) : {});
                            const prev = dsMap[finalIdSpk] || {};
                            let thumb: string | undefined = undefined;
                            try {
                                const rawMap = await kvStore.get('mockup_thumb_map') || {};
                                const thumbMap = rawMap && typeof rawMap === 'object' ? rawMap : (typeof rawMap === 'string' ? JSON.parse(rawMap) : {});
                                const qid = source?.queueId || item.queueId;
                                if (qid && thumbMap[qid]) thumb = thumbMap[qid];
                            } catch { }
                            const mockupUrl = source?.worksheet?.mockup?.file || thumb || prev.mockupUrl;
                            const worksheet = source?.worksheet || prev.worksheet;
                            const linkDriveAssetJadi = source?.worksheet?.linkDriveAssetJadi || prev.linkDriveAssetJadi;
                            dsMap[finalIdSpk] = { ...prev, mockupUrl, worksheet, linkDriveAssetJadi };
                            try { await kvStore.set(dsKey, dsMap); } catch {}
                        } catch { }
                    }
                    // now mark validated and remove from queue
                    list[idx].status = newRows[validasiRow!].status;
                    const removed = list.splice(idx, 1)[0];
                    try { await kvStore.set('design_queue', list); } catch {}
                    // Cleanup thumbnail map
                    try {
                        const rawMap = await kvStore.get('mockup_thumb_map') || {};
                        const thumbMap = rawMap && typeof rawMap === 'object' ? rawMap : (typeof rawMap === 'string' ? JSON.parse(rawMap) : {});
                        const qid = removed?.queueId || target.queueId;
                        if (qid && thumbMap[qid]) {
                            delete thumbMap[qid];
                            try { await kvStore.set('mockup_thumb_map', thumbMap); } catch {}
                        }
                    } catch { }
                }
            } catch {}
        }
        setOpenValidasiModal(false);
        setValidasiRow(null);
        await refresh();
        setSnack({ open: true, message: 'Desain divalidasi dan dimasukkan ke keranjang', severity: 'success' });
    };

    // handleResetAllSpk removed

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            p: 3,
            boxSizing: 'border-box',
            flexDirection: 'column',
        }}>
            <Box sx={{
                width: '80%',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                p: 3,
                mb: 3
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Antrian Pengerjaan Desain</Typography>
                <TableExportToolbar title="Antrian Pengerjaan" tableRef={tableRef} fileBaseName="antrian-pengerjaan" />
                <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 1250 }} aria-label="antrian-pengerjaan" ref={tableRef}>
                        <TableHead>
                            <TableRow>
                                <TableCell>No</TableCell>
                                <TableCell>ID Rekap Custom</TableCell>
                                <TableCell>ID SPK</TableCell>
                                <TableCell>ID Custom</TableCell>
                                <TableCell>Nama Desain</TableCell>
                                <TableCell>Produk</TableCell>
                                <TableCell>Tanggal Input Desain</TableCell>
                                <TableCell>Nama CS</TableCell>
                                <TableCell>Status Desain</TableCell>
                                <TableCell>View Mockup</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{row.idRekap}</TableCell>
                                    <TableCell>{row.idSpk}</TableCell>
                                    <TableCell>{row.idCustom}</TableCell>
                                    <TableCell>{row.namaDesain}</TableCell>
                                    <TableCell>{row.produk}</TableCell>
                                    <TableCell>{row.tanggalInput}</TableCell>
                                    <TableCell>{row.namaCS}</TableCell>
                                    <TableCell>
                                        <Chip size="small" label={row.status} color={row.status === 'Selesai' ? 'success' : row.status === 'Antrian revisi' ? 'warning' : row.status === 'Desain di validasi' ? 'info' : 'default'} />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setMockupUrl(row.mockupUrl);
                                                setOpenMockupModal(true);
                                            }}
                                        >
                                            Detail
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            sx={{ mr: 1 }}
                                            onClick={() => {
                                                setSelectedRow(index);
                                                setOpenModal(true);
                                            }}
                                        >
                                            Revisi
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            disabled={row.status !== 'Selesai'}
                                            onClick={() => {
                                                if (row.status !== 'Selesai') {
                                                    setSnack({ open: true, message: 'Validasi hanya tersedia untuk status Selesai', severity: 'info' });
                                                    return;
                                                }
                                                handleValidasi(index)
                                            }}
                                        >
                                            Validasi
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <RevisiDesainModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSubmit={handleRevisiSubmit}
            />
            <MockupDetailModal
                open={openMockupModal}
                onClose={() => setOpenMockupModal(false)}
                mockupUrl={mockupUrl}
            />
            <ValidasiConfirmModal
                open={openValidasiModal}
                onClose={() => setOpenValidasiModal(false)}
                onConfirm={handleConfirmValidasi}
            />
            {/* reset modal removed */}
            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}