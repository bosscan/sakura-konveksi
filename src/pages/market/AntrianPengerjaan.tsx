import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button, Modal, TextField, Snackbar, Alert, Chip } from "@mui/material";
import { useEffect, useRef, useState } from 'react';
import TableExportToolbar from '../../components/TableExportToolbar';

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
    const refresh = () => {
        const raw = localStorage.getItem('design_queue');
        const list: any[] = raw ? JSON.parse(raw) : [];
        // One-time migration: inject queueId if missing to uniquely identify entries even when idRekapCustom duplicates
        let mutated = false;
        for (const it of list) {
            if (!it.queueId) { it.queueId = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; mutated = true; }
        }
        if (mutated) { try { localStorage.setItem('design_queue', JSON.stringify(list)); } catch { } }
        // read thumbnail map keyed by queueId, created by PraProduksiAntrian
        let thumbMap: Record<string, string> = {};
        try {
            const rawThumb = localStorage.getItem('mockup_thumb_map');
            thumbMap = rawThumb ? JSON.parse(rawThumb) : {};
        } catch { }
        let dsMap: Record<string, any> = {};
        try {
            const rawDs = localStorage.getItem('spk_design');
            dsMap = rawDs ? JSON.parse(rawDs) : {};
        } catch { }

        const mapped: RowData[] = list
            // hide validated regardless of casing/whitespace
            .filter(it => ((it.status || '').trim().toLowerCase()) !== 'desain di validasi')
            .map((it) => ({
                queueId: it.queueId,
                idRekap: it.idRekapCustom,
                // idSpk must be consistent end-to-end: never fabricate fallback values here
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
    };
    useEffect(() => {
        refresh();
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'design_queue') refresh();
        };
        window.addEventListener('storage', onStorage);
        const timer = setInterval(refresh, 2000); // light polling fallback
        return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
    }, []);

    // Ubah status menjadi "Antrian revisi"
    const handleRevisiSubmit = ({ catatan }: { catatan: string }) => {
        if (selectedRow !== null) {
            const newRows = [...rows];
            newRows[selectedRow].status = "Antrian revisi";
            setRows(newRows);
            // persist back to queue with revisi catatan
            const raw = localStorage.getItem('design_queue');
            const list: any[] = raw ? JSON.parse(raw) : [];
            // Utamakan queueId untuk identifikasi unik; fallback ke kombinasi idRekapCustom + idSpk
            const target = newRows[selectedRow!];
            const idx = list.findIndex((x) => (target.queueId && x.queueId === target.queueId)
                || (x.idRekapCustom === target.idRekap && String(x.idSpk || '') === String(target.idSpk || '')));
            if (idx >= 0) {
                list[idx].status = newRows[selectedRow!].status;
                list[idx].revisiCatatan = catatan;
                localStorage.setItem('design_queue', JSON.stringify(list));
            }
            setSnack({ open: true, message: 'Masuk ke Antrian Revisi Desain', severity: 'success' });
        }
    };

    // Konfirmasi validasi
    const handleValidasi = (index: number) => {
        setValidasiRow(index);
        setOpenValidasiModal(true);
    };

    // Jika klik "Ya" pada konfirmasi validasi
    const handleConfirmValidasi = () => {
        if (validasiRow !== null) {
            const newRows = [...rows];
            newRows[validasiRow].status = "Desain di validasi";
            // Immediately hide from UI
            setRows(newRows.filter(r => r.status !== 'Desain di validasi'));
            const raw = localStorage.getItem('design_queue');
            const list: any[] = raw ? JSON.parse(raw) : [];
            // Targetkan item spesifik: queueId jika ada, jika tidak gunakan kombinasi idRekapCustom + idSpk
            const target = newRows[validasiRow!];
            const idx = list.findIndex((x) => (target.queueId && x.queueId === target.queueId)
                || (x.idRekapCustom === target.idRekap && String(x.idSpk || '') === String(target.idSpk || '')));
            if (idx >= 0) {
                // capture source before any mutation
                const source = list[idx];
                // push into keranjang FIRST
                const kKey = 'keranjang';
                const kRaw = localStorage.getItem(kKey);
                const cart = kRaw ? JSON.parse(kRaw) : [];
                const item = newRows[validasiRow!];
                const exists = cart.some((c: any) => c.idRekap === item.idRekap);
                if (!exists) {
                    // Determine stable idSpk (must exist, 7-digit)
                    const isGood = (v: any) => typeof v === 'string' && /^\d{7}$/.test(v);
                    let finalIdSpk = isGood(item.idSpk) ? item.idSpk : '';
                    if (!finalIdSpk && isGood(source?.idSpk)) finalIdSpk = source.idSpk;
                    if (!finalIdSpk) {
                        try {
                            const qRaw = localStorage.getItem('antrian_input_desain');
                            const qList = qRaw ? JSON.parse(qRaw) : [];
                            const candidates = [item.idSpk, source?.idSpk].filter(Boolean);
                            const found = qList.find((q: any) => candidates.includes(q?.idSpk));
                            if (isGood(found?.idSpk)) finalIdSpk = found.idSpk;
                        } catch { }
                    }
                    if (!finalIdSpk) {
                        setSnack({ open: true, message: 'Gagal memasukkan ke keranjang: ID SPK tidak ditemukan.', severity: 'error' });
                        return; // do not remove from queue if we failed to push cart
                    }
                    // Quantity from source, else lookup queue
                    let qtyStr = String(source?.spkQuantity || '');
                    if (!qtyStr) {
                        try {
                            const qRaw = localStorage.getItem('antrian_input_desain');
                            const qList = qRaw ? JSON.parse(qRaw) : [];
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
                    localStorage.setItem(kKey, JSON.stringify(cart));
                    // Persist mockup snapshot for Print SPK (spk_design)
                    try {
                        const dsKey = 'spk_design';
                        const dsRaw = localStorage.getItem(dsKey);
                        const dsMap = dsRaw ? JSON.parse(dsRaw) : {};
                        const prev = dsMap[finalIdSpk] || {};
                        // Get thumbnail before we clean it up below
                        let thumb: string | undefined = undefined;
                        try {
                            const mapKey = 'mockup_thumb_map';
                            const rawMap = localStorage.getItem(mapKey);
                            const thumbMap = rawMap ? JSON.parse(rawMap) : {};
                            const qid = source?.queueId || item.queueId;
                            if (qid && thumbMap[qid]) thumb = thumbMap[qid];
                        } catch { }
                        const mockupUrl = source?.worksheet?.mockup?.file || thumb || prev.mockupUrl;
                        const worksheet = source?.worksheet || prev.worksheet;
                        const linkDriveAssetJadi = source?.worksheet?.linkDriveAssetJadi || prev.linkDriveAssetJadi;
                        dsMap[finalIdSpk] = { ...prev, mockupUrl, worksheet, linkDriveAssetJadi };
                        localStorage.setItem(dsKey, JSON.stringify(dsMap));
                    } catch { }
                }
                // now mark validated and remove from queue (source of truth)
                list[idx].status = newRows[validasiRow!].status;
                const removed = list.splice(idx, 1)[0];
                localStorage.setItem('design_queue', JSON.stringify(list));
                // Cleanup thumbnail map for this queueId
                try {
                    const mapKey = 'mockup_thumb_map';
                    const rawMap = localStorage.getItem(mapKey);
                    const thumbMap = rawMap ? JSON.parse(rawMap) : {};
                    const qid = removed?.queueId || target.queueId;
                    if (qid && thumbMap[qid]) {
                        delete thumbMap[qid];
                        localStorage.setItem(mapKey, JSON.stringify(thumbMap));
                    }
                } catch { }
            }
        }
        setOpenValidasiModal(false);
        setValidasiRow(null);
        refresh();
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