import { Box, Typography, Paper, TableContainer, TableHead, TableRow, TableCell, Table, Card, CardContent, TableBody, Checkbox, Button, Modal, Snackbar, Alert } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { markSelesai, isSpkInDivisionQueue } from "../../../../../lib/pipelineHelpers";

export default function LembarCuttingPola() {
    type AnyRec = Record<string, any>;
    const [rowChecks, setRowChecks] = useState<boolean[]>([]);
    const [open, setOpen] = useState(false);
    const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
    const { search } = useLocation();
    const navigate = useNavigate();
    const spkId = useMemo(() => {
        const p = new URLSearchParams(search);
        return (p.get('spk') || '').trim();
    }, [search]);

    const [mockupUrl, setMockupUrl] = useState<string>('');
    const [items, setItems] = useState<Array<{ size?: string; nama?: string; formatNama?: string }>>([]);
    const [spes, setSpes] = useState<{ product?: string; pattern?: string; fabric?: string; fabricColor?: string; colorCombination?: string }>({});

    // Helpers to read localStorage safely
    const loadLs = <T = any,>(key: string, fallback: T): T => {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
    };

    useEffect(() => {
        if (!spkId) {
            setMockupUrl('');
            setItems([]);
            setSpes({});
            setRowChecks([]);
            return;
        }

        // Gate: must be in Cutting Pola queue
        if (!isSpkInDivisionQueue(spkId, 'cutting-pola')) {
            setSnack({ open: true, message: 'SPK ini belum masuk ke antrian divisi tersebut.', severity: 'info' });
            navigate('/method/update-divisi/cutting-pola/antrian');
            return;
        }

    // 1) Items (size/nama/formatNama) from antrian_input_desain by idSpk, fallback ke snapshot spk_orders[idSpk]
    const antrian: AnyRec[] = loadLs('antrian_input_desain', [] as AnyRec[]);
    const spkOrdersMap: Record<string, AnyRec> = loadLs('spk_orders', {} as Record<string, AnyRec>);
    const antrianItem = antrian.find((x: AnyRec) => String(x?.idSpk ?? '').trim() === spkId) || spkOrdersMap[spkId];
    const itemList = Array.isArray(antrianItem?.items) ? (antrianItem!.items as AnyRec[]) : [];
        setItems(itemList);
        setRowChecks(itemList.map(() => false));

        // 2) Mockup image and worksheet: prefer spk_design snapshot, then design_queue/antrian_pengerjaan_desain, then thumbnail map
        let designSnapMap: Record<string, AnyRec> = loadLs('spk_design', {} as Record<string, AnyRec>);
        let snap = designSnapMap[spkId];
    const designQueue: AnyRec[] = loadLs('design_queue', [] as AnyRec[]);
        const antrianDesain: AnyRec[] = loadLs('antrian_pengerjaan_desain', [] as AnyRec[]);
        const design = designQueue.find((d: AnyRec) => String(d?.idSpk ?? '').trim() === spkId);
        const designNext = antrianDesain.find((d: AnyRec) => String(d?.idSpk ?? '').trim() === spkId);

        // Priority: PRA-PRODUKSI upload (design_queue / antrian desain) -> snapshot -> thumbnail map -> assets/link
        let resolvedMock: string | undefined =
            design?.worksheet?.mockup?.file ||
            designNext?.worksheet?.mockup?.file ||
            undefined;
        if (!resolvedMock) {
            const snapshotHasMock = !!(snap?.worksheet?.mockup?.file || snap?.mockupUrl);
            if (snapshotHasMock) resolvedMock = snap?.worksheet?.mockup?.file || snap?.mockupUrl;
        }
        if (!resolvedMock) {
            // Fallback to thumbnail map via queueId
            const rawT = localStorage.getItem('mockup_thumb_map');
            const thumbMap = rawT ? (() => { try { return JSON.parse(rawT); } catch { return {}; } })() : {};
            let qid = (design as AnyRec)?.queueId || (designNext as AnyRec)?.queueId;
            if (!qid) {
                // Legacy mapping idSpk -> queueId
                try {
                    const r2 = localStorage.getItem('design_queueid_by_spk');
                    const m2 = r2 ? JSON.parse(r2) : {};
                    qid = m2?.[spkId];
                } catch {}
            }
            // Heuristik namaDesain: cari di design_queue berdasarkan nameDesign dari form jika mapping kosong
            if (!qid) {
                try {
                    const formDetail: AnyRec | null = loadLs('inputDetailForm', null as any);
                    const candName = String(formDetail?.nameDesign || '').trim();
                    if (candName) {
                        const found = [...(designQueue || [])].reverse().find(q => String(q?.namaDesain || '').trim().toLowerCase() === candName.toLowerCase());
                        if (found?.queueId) qid = found.queueId;
                    }
                } catch {}
            }
            if (qid && thumbMap[qid]) resolvedMock = thumbMap[qid];
        }
        if (!resolvedMock && snap) {
            const fromAssets = Array.isArray(snap?.assets) ? snap.assets.find((a: any) => String(a?.attribute||'').toLowerCase().includes('mockup'))?.file : undefined;
            resolvedMock = fromAssets || snap?.assetLink || resolvedMock;
        }

        // Ensure worksheet carried over even if mockup absent
    // carry worksheet implicitly via design snapshots; not displayed directly here
        setMockupUrl(resolvedMock || '');

        // 3) Spesifikasi Produk from design snapshot or input forms
        const formDetail: AnyRec | null = loadLs('inputDetailForm', null as any);
        const formProduk: AnyRec | null = loadLs('inputProdukForm', null as any);
        const S = (k: string) => ((snap?.[k]) ?? (formProduk?.[k]) ?? (formDetail?.[k]) ?? '') as string;
        setSpes({
            product: (snap?.product || formDetail?.product || '') as string,
            pattern: (snap?.pattern || formProduk?.pattern || formDetail?.pattern || '') as string,
            fabric: (snap?.fabric || formProduk?.fabric || formDetail?.fabric || '') as string,
            fabricColor: (snap?.fabricColor || formProduk?.fabricColor || formDetail?.fabricColor || '') as string,
            colorCombination: (S('colorCombination') || formDetail?.colorCombination || '') as string,
        });
    }, [spkId]);

    const handleConfirm = async () => {
        try {
            const updated = await markSelesai(spkId, 'selesai_cutting_pola', 'selesaiCuttingPola');
            setOpen(false);
            setSnack({ open: true, message: updated ? 'Status divisi Cutting Pola diset selesai. Diteruskan ke antrian.' : 'ID SPK tidak ditemukan.', severity: updated ? 'success' : 'info' });
            if (updated) setTimeout(() => navigate('/method/update-divisi/cutting-pola/antrian'), 600);
        } catch {
            setOpen(false);
            setSnack({ open: true, message: 'Terjadi kesalahan saat menyimpan.', severity: 'error' });
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            // alignItem is a no-op; alignItems above handles centering
            p: 3,
            boxSizing: 'border-box',
            flexDirection: 'column',
        }}>
            <Box sx={{
                width: '100%',
                height: 'auto',
                display: 'flex',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                mb: 3
            }}>
                {/* Title centered */}
                <Typography variant="h6" fontWeight={700} align="center" sx={{ width: '100%' }}>
                    Lembar Kerja Divisi Cutting Pola {spkId ? `(SPK: ${spkId})` : ''}
                </Typography>

                {/* Content row: mockup on the left, table on the right */}
                <Box
                    sx={{
                        mt: 2,
                        width: '100%',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        alignItems: 'stretch',
                        justifyContent: 'center',
                    }}
                >
                    {/* Left: View Mockup */}
                    <Box sx={{ width: { xs: '100%', md: 350, lg: 400 } }}>
                        <Card>
                            <CardContent>
                                <Typography variant="body1" fontWeight={600}>View Mockup:</Typography>
                                {/* Mockup image resolved from localStorage queues/snapshots */}
                                <Box sx={{
                                    mt: 1,
                                    width: '100%',
                                    height: 300,
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                }}>
                                    {mockupUrl ? (
                                        <img src={mockupUrl} alt="mockup" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <Typography variant="caption" color="textSecondary">Mockup belum tersedia</Typography>
                                    )}
                                </Box>
                                <Typography variant="body2" align="center" fontWeight={600} sx={{ mt: 1,  }}> Spesifikasi Produk </Typography>
                                <Typography variant="body2" align="left" sx={{ mt: 1 }}> Jenis Produk : {spes.product || ''} </Typography>
                                <Typography variant="body2" align="left" sx={{ mt: 1 }}> Jenis Pola : {spes.pattern || ''} </Typography>
                                <Typography variant="body2" align="left" sx={{ mt: 1 }}> Jenis Kain : {spes.fabric || ''} </Typography>
                                <Typography variant="body2" align="left" sx={{ mt: 1 }}> Warna Kain : {spes.fabricColor || ''} </Typography>
                                <Typography variant="body2" align="left" sx={{ mt: 1 }}> Warna Kombinasi Kain : {spes.colorCombination || ''} </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Right: Table with constrained width */}
                    <Box sx={{ width: { xs: '100%', md: 480 }, ml: { xs: 0, md: 2} }}>
                        <TableContainer component={Paper} sx={{ width: '100%' }}>
                            <Table
                                aria-label="lembar-cutting-pola"
                                size="small"
                                sx={{
                                    '& .MuiTableCell-root': { py: 0.5, px: 1, fontSize: '0.875rem' },
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No.</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Format Nama</TableCell>
                                        <TableCell>Checkbox</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(items || []).map((it, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>{it?.size || ''}</TableCell>
                                            <TableCell>{it?.formatNama || ''}</TableCell>
                                            <TableCell>
                                                <Checkbox
                                                    checked={!!rowChecks[idx]}
                                                    onChange={(_, v) => setRowChecks((prev) => {
                                                        const n = prev.slice();
                                                        n[idx] = v;
                                                        return n;
                                                    })}
                                                    inputProps={{ 'aria-label': `pilih baris ${idx + 1}` }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!items || items.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">Belum ada item dari Input Pesanan</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3 }}
                    disabled={items.length > 0 ? rowChecks.every(v => !v) : true}
                    onClick={() => setOpen(true)}
                >
                    Selesai
                </Button>

                {/* Confirmation Modal */}
                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    aria-labelledby="konfirmasi-title"
                    aria-describedby="konfirmasi-desc"
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', sm: 420 },
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: 24,
                            p: 3,
                            outline: 'none',
                        }}
                    >
                        <Typography id="konfirmasi-title" variant="h6" fontWeight={700} gutterBottom>
                            Konfirmasi
                        </Typography>
                        <Typography id="konfirmasi-desc" variant="body2" color="text.secondary">
                            Apakah Anda yakin sudah selesai mengerjakan dan sudah di cek semua dengan teliti?
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
                            <Button color="error" onClick={() => setOpen(false)} variant="outlined">
                                Tidak yakin
                            </Button>
                            <Button onClick={handleConfirm} color="primary" variant="contained">
                                Yakin
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            </Box>
            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}