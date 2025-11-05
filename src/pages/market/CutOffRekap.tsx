import { Box, Typography, Button, TextField, Paper } from "@mui/material";
import { useEffect, useState } from "react";
import kvStore from '../../lib/kvStore';

// Production recap keys and helper functions
const PR_COUNTER_KEY = 'production_recap_counter';
const PR_STATE_KEY = 'production_recap_state';

type RecapState = { currentId: number; date: string; totalQty: number };

function getTodayStr(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

async function nextRecapId(): Promise<number> {
    let counter = 4000000;
    try {
        const raw = await kvStore.get(PR_COUNTER_KEY);
        const n = Number(raw || 0);
        if (!isNaN(n) && n >= 4000000) counter = n;
    } catch {}
    const next = counter + 1;
    try { await kvStore.set(PR_COUNTER_KEY, String(next)); } catch {}
    return next;
}

async function loadRecapState(): Promise<RecapState> {
    try {
        const raw = await kvStore.get(PR_STATE_KEY);
        if (raw) {
            const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (p && typeof p.currentId === 'number' && typeof p.date === 'string' && typeof p.totalQty === 'number') return p;
        }
    } catch {}
    return { currentId: 0, date: '', totalQty: 0 };
}

async function saveRecapState(s: RecapState) {
    try { await kvStore.set(PR_STATE_KEY, s); } catch {}
}

export default function CutOffRekap() {
    const [currentRecapState, setCurrentRecapState] = useState<RecapState>({ currentId: 0, date: '', totalQty: 0 });
    const [manualRecapValue, setManualRecapValue] = useState('');
    const [loading, setLoading] = useState(false);

    // Load current recap state
    useEffect(() => {
        const loadCurrentState = async () => {
            const state = await loadRecapState();
            setCurrentRecapState(state);
        };
        loadCurrentState();

        // Subscribe to changes
        const sub = kvStore.subscribe(PR_STATE_KEY, () => {
            loadCurrentState();
        });

        return () => {
            try { sub.unsubscribe(); } catch {}
        };
    }, []);

    const handleCutOffSekarang = async () => {
        setLoading(true);
        try {
            // Start new recap with next ID
            const newId = await nextRecapId();
            const newState = { currentId: newId, date: getTodayStr(), totalQty: 0 };
            await saveRecapState(newState);
            try { await kvStore.set(PR_COUNTER_KEY, String(newId)); } catch {}
            alert(`Cut off berhasil. Rekap baru dimulai: ${String(newId).padStart(7, '0')}`);
        } catch (e) {
            console.error(e);
            alert('Gagal melakukan cut off rekap');
        } finally {
            setLoading(false);
        }
    };

    const handleSetManual = async () => {
        const cleaned = String(manualRecapValue || '').replace(/\D/g, '');
        if (!cleaned) {
            alert('Masukkan nomor rekap yang valid (7 digit)');
            return;
        }
        
        const newIdNum = Number(cleaned);
        if (isNaN(newIdNum) || newIdNum <= 0) {
            alert('Nomor rekap tidak valid');
            return;
        }

        setLoading(true);
        try {
            // Set manual recap number
            const newState = { currentId: newIdNum, date: getTodayStr(), totalQty: 0 };
            await saveRecapState(newState);
            try { await kvStore.set(PR_COUNTER_KEY, String(newIdNum)); } catch {}
            alert(`Nomor rekap berhasil diset manual: ${String(newIdNum).padStart(7, '0')}`);
            setManualRecapValue('');
        } catch (e) {
            console.error(e);
            alert('Gagal melakukan set manual rekap');
        } finally {
            setLoading(false);
        }
    };

    const formatRecapId = (id: number) => String(id || 0).padStart(7, '0');

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 'calc(100vh - 64px)',
            p: 3,
            boxSizing: 'border-box',
        }}>
            <Paper sx={{
                width: '100%',
                maxWidth: 600,
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: 3
            }}>
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                    Cut Off Rekap Produksi
                </Typography>

                {/* Current Recap Info */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                        Nomor Rekap Saat Ini
                    </Typography>
                    <Typography variant="h2" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                        {formatRecapId(currentRecapState.currentId)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Tanggal Aktif
                            </Typography>
                            <Typography variant="h6">
                                {currentRecapState.date || getTodayStr()}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Total Quantity di Rekap Ini
                            </Typography>
                            <Typography variant="h6">
                                {currentRecapState.totalQty || 0}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Cut Off Button */}
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleCutOffSekarang}
                    disabled={loading}
                    sx={{ mb: 4, py: 2, px: 4, fontSize: '1.1rem' }}
                >
                    CUT OFF SEKARANG (MULAI REKAP BARU)
                </Button>

                {/* Manual Set Section */}
                <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Set Nomor Rekap Manual (Opsional)
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <TextField
                            label="Nomor Rekap (7 digit)"
                            value={manualRecapValue}
                            onChange={(e) => setManualRecapValue(e.target.value)}
                            placeholder="Contoh: 4000123"
                            variant="outlined"
                            size="medium"
                            sx={{ minWidth: 200 }}
                            disabled={loading}
                        />
                        <Button
                            variant="outlined"
                            onClick={handleSetManual}
                            disabled={loading || !manualRecapValue.trim()}
                            sx={{ py: 1.8, px: 3 }}
                        >
                            SET MANUAL
                        </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Catatan: Cut off akan memulai rekap baru untuk checkout berikutnya. Penetapan manual akan mengganti nomor rekap aktif tanpa menunggu 15 pcs atau pergantian hari.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}