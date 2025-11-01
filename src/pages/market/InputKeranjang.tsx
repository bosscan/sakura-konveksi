import { 
    Box, 
    TableContainer, 
    Table, 
    Paper, 
    TableCell, 
    TableRow, 
    TableHead, 
    TableBody, 
    Typography, 
    Button, 
    Modal,
    Checkbox
} from "@mui/material";
import { useEffect, useState } from "react";
import Api from "../../lib/api";
import DeleteIcon from '@mui/icons-material/Delete';

type KeranjangRow = {
    idRekap: string;
    idSpk: string;
    idCustom: string;
    namaDesain: string;
    namaKonsumen: string;
    kuantity: number;
    selected?: boolean;
};

// Persistent 7-digit transaction ID starting at 8000001, one per checkout
const TX_COUNTER_KEY = 'transaction_id_counter';
function nextTransactionId(): string {
    let counter = 8000000;
    try {
        const raw = Number(localStorage.getItem(TX_COUNTER_KEY) || 0);
        if (!isNaN(raw) && raw >= 8000000) counter = raw;
    } catch {}
    const next = counter + 1;
    try { localStorage.setItem(TX_COUNTER_KEY, String(next)); } catch {}
    return String(next).padStart(7, '0');
}

// Production recap ID: 7 digits starting at 4000001
// Rules: same-day recap accumulates quantities up to 15 pcs across multiple checkouts; when >15, start a new recap ID; new day always starts a new recap ID
const PR_COUNTER_KEY = 'production_recap_counter';
const PR_STATE_KEY = 'production_recap_state';
const PR_MAP_KEY = 'production_recap_map';
const TERBIT_MAP_KEY = 'spk_terbit_map';

type RecapState = { currentId: number; date: string; totalQty: number };

function getTodayStr(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function nextRecapId(): number {
    let counter = 4000000;
    try {
        const raw = Number(localStorage.getItem(PR_COUNTER_KEY) || 0);
        if (!isNaN(raw) && raw >= 4000000) counter = raw;
    } catch {}
    const next = counter + 1;
    try { localStorage.setItem(PR_COUNTER_KEY, String(next)); } catch {}
    return next;
}

function loadRecapState(): RecapState {
    try {
        const raw = localStorage.getItem(PR_STATE_KEY);
        if (raw) {
            const p = JSON.parse(raw);
            if (p && typeof p.currentId === 'number' && typeof p.date === 'string' && typeof p.totalQty === 'number') return p;
        }
    } catch {}
    return { currentId: 0, date: '', totalQty: 0 };
}

function saveRecapState(s: RecapState) {
    try { localStorage.setItem(PR_STATE_KEY, JSON.stringify(s)); } catch {}
}

// Allocate recap IDs for a batch of items while respecting cutoff rules
function allocateRecapForItems(items: Array<{ idSpk: string; qty: number }>): Record<string, number> {
    const today = getTodayStr();
    let state = loadRecapState();
    // reset if day changed or no current
    if (!state.currentId || state.date !== today) {
        state = { currentId: nextRecapId(), date: today, totalQty: 0 };
    }
    const mapping: Record<string, number> = {};
    items.forEach(({ idSpk, qty }) => {
        const q = isFinite(qty as any) && qty > 0 ? qty : 0;
        // if this item would push total over 15, start a new recap id first
        if (state.totalQty + q > 15) {
            state.currentId = nextRecapId();
            state.date = today;
            state.totalQty = 0;
        }
        mapping[idSpk] = state.currentId;
        state.totalQty += q;
    });
    saveRecapState(state);
    // persist mapping
    try {
        const raw = localStorage.getItem(PR_MAP_KEY);
        const map: Record<string, number> = raw ? JSON.parse(raw) : {};
        Object.assign(map, mapping);
        localStorage.setItem(PR_MAP_KEY, JSON.stringify(map));
    } catch {}
    return mapping;
}

function CheckoutModal({
    open,
    onClose,
    selectedCount,
    onConfirm
}: {
    open: boolean,
    onClose: () => void,
    selectedCount: number,
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
                    Checkout {selectedCount} Pesanan
                </Typography>
                <Typography sx={{ mb: 2, textAlign: 'center' }}>
                    Lanjut ke proses produksi?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 2 }}>
                    <Button variant="outlined" color="inherit" fullWidth onClick={onClose}>
                        Tidak
                    </Button>
                    <Button variant="contained" color="primary" fullWidth onClick={onConfirm}>Ya</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default function Keranjang() {
    const [rows, setRows] = useState<KeranjangRow[]>([]);
    useEffect(() => {
        const kRaw = localStorage.getItem('keranjang');
        const cart = kRaw ? JSON.parse(kRaw) : [];
        // Enrich with quantity if missing using antrian_input_desain as source
        try {
            const qRaw = localStorage.getItem('antrian_input_desain');
            const qList: Array<any> = qRaw ? JSON.parse(qRaw) : [];
            const idxMap: Record<string, any> = {};
            qList.forEach((q: any) => { if (q?.idSpk) idxMap[q.idSpk] = q; });
            const enriched = cart.map((it: any) => {
                if (typeof it.kuantity === 'number' && it.kuantity > 0) return it;
                const src = it.idSpk ? idxMap[it.idSpk] : null;
                const n = Number(String(src?.quantity ?? '').replace(/[^\d-]/g, ''));
                return { ...it, kuantity: !isNaN(n) && n > 0 ? n : (it.kuantity || 0) };
            });
            if (JSON.stringify(enriched) !== JSON.stringify(cart)) {
                localStorage.setItem('keranjang', JSON.stringify(enriched));
                setRows(enriched);
                return;
            }
            setRows(cart);
        } catch {
            setRows(cart);
        }
    }, []);
    
    const [openCheckout, setOpenCheckout] = useState(false);

    const toggleSelect = (idRekap: string) => {
        setRows(rows.map(row => 
            row.idRekap === idRekap 
                ? { ...row, selected: !row.selected } 
                : row
        ));
    };

    const toggleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRows(rows.map(row => ({
            ...row,
            selected: event.target.checked
        })));
    };

    const handleCheckout = () => {
        setOpenCheckout(true);
    };

    const persist = (data: KeranjangRow[]) => localStorage.setItem('keranjang', JSON.stringify(data));
    const handleConfirmCheckout = async () => {
        // 1) Collect selected items to checkout
        const toCheckout = rows.filter(r => r.selected);
        if (toCheckout.length > 0) {
            try {
                // 2) Generate a single 7-digit idTransaksi for this checkout batch
                const idTransaksi = nextTransactionId();
                // Capture checkout timestamp (Tanggal SPK Terbit)
                const terbitAt = new Date().toISOString();

                // 3) Build lookup from antrian_input_desain to enrich metadata
                const qRaw = localStorage.getItem('antrian_input_desain');
                const qList: any[] = qRaw ? JSON.parse(qRaw) : [];
                const spkInfo: Record<string, any> = {};
                qList.forEach((q) => { if (q?.idSpk) spkInfo[q.idSpk] = q; });

                const parseNum = (v: any): number => {
                    const n = Number(String(v ?? '').toString().replace(/[^\d-]/g, ''));
                    return !isNaN(n) && n > 0 ? n : 0;
                };

                // 4) Prepare payload and hit backend; fallback to localStorage if API fails
                const items = toCheckout.map((it) => {
                    const src = spkInfo[it.idSpk] || {};
                    let kuantity = typeof it.kuantity === 'number' && it.kuantity > 0
                        ? it.kuantity
                        : parseNum(src?.quantity);
                    if (!kuantity && Array.isArray(src?.items)) kuantity = src.items.length;
                    return {
                        idSpk: it.idSpk,
                        idRekapCustom: it.idRekap,
                        idCustom: it.idCustom,
                        namaDesain: it.namaDesain,
                        kuantity,
                    };
                });

                // 4.1) Allocate production recap IDs for this batch under cutoff rules
                const recapMap = allocateRecapForItems(items.map(it => ({ idSpk: it.idSpk, qty: it.kuantity })));
                const itemsWithRecap = items.map(it => ({ ...it, idRekapProduksi: String(recapMap[it.idSpk]).padStart(7, '0') }));

                // 4.2) Optimistically update local plotting queue (so Market & Method pages refresh immediately)
                {
                    const queueKey = 'plotting_rekap_bordir_queue';
                    const rawQ = localStorage.getItem(queueKey);
                    const plottingQueue: any[] = rawQ ? JSON.parse(rawQ) : [];
                    const exists = new Set<string>((plottingQueue || [])
                      .map((p: any) => String(p?.idSpk || '').trim())
                      .filter(Boolean));
                    itemsWithRecap.forEach((it) => {
                        const id = String(it?.idSpk || '').trim();
                        if (!id || exists.has(id)) return;
                        const src = spkInfo[id] || {};
                        plottingQueue.push({
                            idSpk: id,
                            idTransaksi,
                            idRekapProduksi: it.idRekapProduksi,
                            idRekapCustom: it.idRekapCustom,
                            idCustom: it.idCustom,
                            namaDesain: it.namaDesain,
                            jenisProduk: src?.jenisProduk,
                            jenisPola: src?.jenisPola,
                            tanggalInput: src?.tanggalInput,
                            tglSpkTerbit: terbitAt,
                            kuantity: it.kuantity,
                            statusDesain: 'Proses',
                        });
                        exists.add(id);
                    });
                    localStorage.setItem(queueKey, JSON.stringify(plottingQueue));
                }

                // 4.3) Best-effort server sync (no-op if backend unavailable)
                try {
                    await Api.postCheckout({ idTransaksi, items: itemsWithRecap });
                } catch {
                    // ignore; local state already updated
                }

                // 5) Persist mapping idSpk -> idTransaksi for all items in this checkout
                try {
                    const mapKey = 'transaction_id_map';
                    const rawMap = localStorage.getItem(mapKey);
                    const txMap: Record<string, number | string> = rawMap ? JSON.parse(rawMap) : {};
                    itemsWithRecap.forEach((it) => { if (it?.idSpk) txMap[it.idSpk] = Number(idTransaksi) || idTransaksi; });
                    localStorage.setItem(mapKey, JSON.stringify(txMap));
                } catch {}

                // 6) Persist tgl spk terbit mapping for each item
                try {
                    const rawTerbit = localStorage.getItem(TERBIT_MAP_KEY);
                    const terbitMap: Record<string, string> = rawTerbit ? JSON.parse(rawTerbit) : {};
                    itemsWithRecap.forEach((it) => { if (it?.idSpk) terbitMap[it.idSpk] = terbitAt; });
                    localStorage.setItem(TERBIT_MAP_KEY, JSON.stringify(terbitMap));
                } catch {}
            } catch (e) {
                // no-op on failure
            }
        }

        // 7) Remove selected items from keranjang as before
        const updatedRows = rows.filter(row => !row.selected);
        setRows(updatedRows);
        persist(updatedRows);
    setOpenCheckout(false);
    };

    const handleDeleteSelected = () => {
        const updatedRows = rows.filter(row => !row.selected);
        setRows(updatedRows);
        persist(updatedRows);
    };

    // Hitung total nominal dan jumlah item yang dipilih
    const selectedRows = rows.filter(row => row.selected);
    const selectedCount = selectedRows.length;

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
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Keranjang</Typography>
                
                {selectedCount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1">
                            {selectedCount} item dipilih
                        </Typography>
                        <Box>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleDeleteSelected}
                                sx={{ mr: 1 }}
                            >
                                Hapus
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCheckout}
                            >
                                Checkout ({selectedCount})
                            </Button>
                        </Box>
                    </Box>
                )}
                
                <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 1000 }} aria-label="keranjang-table">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selectedCount > 0 && selectedCount < rows.length}
                                        checked={rows.length > 0 && selectedCount === rows.length}
                                        onChange={toggleSelectAll}
                                    />
                                </TableCell>
                                <TableCell>No</TableCell>
                                <TableCell>ID Rekap Custom</TableCell>
                                <TableCell>ID SPK</TableCell>
                                <TableCell>ID Custom</TableCell>
                                <TableCell>Detail Pesanan</TableCell>
                                <TableCell>Kuantity</TableCell>                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={index} selected={row.selected}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={row.selected || false}
                                            onChange={() => toggleSelect(row.idRekap)}
                                        />
                                    </TableCell>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{row.idRekap}</TableCell>
                                    <TableCell>{row.idSpk}</TableCell>
                                    <TableCell>{row.idCustom}</TableCell>
                                    <TableCell>
                                        {row.namaDesain}<br />
                                        {row.namaKonsumen}
                                    </TableCell>
                                    <TableCell>{row.kuantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            
            <CheckoutModal
                open={openCheckout}
                onClose={() => setOpenCheckout(false)}
                selectedCount={selectedCount}
                onConfirm={handleConfirmCheckout}
            />
        </Box>
    )
}