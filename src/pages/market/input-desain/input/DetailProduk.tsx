import { Box, Button, Grid, Typography, Select, MenuItem } from '@mui/material'
import { useEffect, useState, useMemo } from 'react';
import kvStore from '../../../../lib/kvStore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function InputDetail() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const spkId = useMemo(() => {
        const p = new URLSearchParams(search);
        return (p.get('spk') || '').trim();
    }, [search]);

    const [application, setApplication] = useState('');
    const [bordir, setBordir] = useState('');
    const [sablon, setSablon] = useState('');
    const [jahitan, setJahitan] = useState('');
    const [hoodie, setHoodie] = useState('');
    const [cuttingButtom, setCuttingButtom] = useState('');
    const [sideSlit, setSideSlit] = useState('')
    const [neck, setNeck] = useState('')
    const [placard, setPlacard] = useState('')
    const [pocket, setPocket] = useState('')
    const [bottomPocket, setBottomPocket] = useState('')
    const [furingPocket, setFuringPocket] = useState('')
    const [armEnd, setArmEnd] = useState('')
    const [frontButton, setFrontButton] = useState('')

    const [options] = useState<Record<string, Array<{ value: string; label: string }>>>({})

    const getLabel = (key: string, value: string): string => {
        try {
            const arr = options[key] || [];
            const f = arr.find(o => o.value === value);
            return f?.label || value || '';
        } catch { return value || ''; }
    };

    // useEffect(() => {
    //     const load = async () => {
    //         try {
    //             const optList = await fetch('/api/dropdown/options').then(r => r.json()).catch(() => []);
    //             // Build map: key -> options[] (attribute key directly)
    //             const map: Record<string, Array<{ value: string; label: string }>> = {};
    //             (optList || []).forEach((o: any) => {
    //                 if (!o?.attribute || o.is_active === false) return;
    //                 const key = String(o.attribute);
    //                 const arr = map[key] || [];
    //                 arr.push({ value: o.value, label: o.label || o.value });
    //                 map[key] = arr;
    //             });
    //             setOptions(map);
    //         } catch {
    //             setOptions({});
    //         }
    //     };
    //     load();
    // }, [])

    // Load previous selections only if they belong to the current SPK
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const raw = await kvStore.get('inputProdukForm');
                const d = raw && typeof raw === 'object' ? raw : (raw ? JSON.parse(String(raw)) : null);
                if (!d) return;
                if (d && (!d.spkId || (spkId && d.spkId === spkId))) {
                    if (mounted) {
                        setApplication(d.application || '');
                        setBordir(d.bordir || '');
                        setSablon(d.sablon || '');
                        setJahitan(d.jahitan || '');
                        setHoodie(d.hoodie || '');
                        setCuttingButtom(d.cuttingButtom || '');
                        setSideSlit(d.sideSlit || '');
                        setNeck(d.neck || '');
                        setPlacard(d.placard || '');
                        setPocket(d.pocket || '');
                        setBottomPocket(d.bottomPocket || '');
                        setFuringPocket(d.furingPocket || '');
                        setArmEnd(d.armEnd || '');
                        setFrontButton(d.frontButton || '');
                    }
                }
            } catch {}
        })();
        return () => { mounted = false; };
    }, [spkId]);

    // Persist on change (async kvStore preferred)
    useEffect(() => {
        const save = async () => {
            try {
                const data = {
                    spkId: spkId || undefined,
                    application,
                    bordir,
                    sablon,
                    jahitan,
                    hoodie,
                    cuttingButtom,
                    sideSlit,
                    neck,
                    placard,
                    pocket,
                    bottomPocket,
                    furingPocket,
                    armEnd,
                    frontButton,
                    // Labels for print
                    applicationLabel: getLabel('aplikasi', application),
                    bordirLabel: getLabel('jenis_bordir', bordir),
                    sablonLabel: getLabel('jenis_sablon', sablon),
                    jahitanLabel: getLabel('jahitan', jahitan),
                    hoodieLabel: getLabel('hoodie', hoodie),
                    cuttingButtomLabel: getLabel('potongan_bawah', cuttingButtom),
                    sideSlitLabel: getLabel('belahan_samping', sideSlit),
                    neckLabel: getLabel('kerah', neck),
                    placardLabel: getLabel('plaket', placard),
                    pocketLabel: getLabel('saku', pocket),
                    bottomPocketLabel: getLabel('saku_bawah', bottomPocket),
                    furingPocketLabel: getLabel('saku_furing', furingPocket),
                    armEndLabel: getLabel('ujung_lengan', armEnd),
                    frontButtonLabel: getLabel('kancing_depan', frontButton),
                };
                await kvStore.set('inputProdukForm', data);
            } catch {}
        };
        save();
    }, [application, bordir, sablon, jahitan, hoodie, cuttingButtom, sideSlit, neck, placard, pocket, bottomPocket, furingPocket, armEnd, frontButton, options]);

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
                width: '100%',
                height: '500',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                p: 3,
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Detail Produk</Typography>
                <Grid container spacing={2} justifyContent="flex-start" alignItems='flex-start'>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Aplikasi :</Typography>
                            <Select labelId='product-select-label' size='small' value={application} onChange={(e) => setApplication(e.target.value)}>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
                                <MenuItem value='BORDIR'>Bordir</MenuItem>
                                <MenuItem value='SABLON'>Sablon</MenuItem>
                                <MenuItem value='KOMBINASI'>Kombinasi</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Jenis Bordir :</Typography>
                            <Select labelId='sample-select-label' size='small' value={bordir} onChange={(e) => setBordir(e.target.value)}>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
                                <MenuItem value='LANGSUNG'>Langsung</MenuItem>
                                <MenuItem value='TIMBUL'>Timbul</MenuItem>
                                <MenuItem value='BADGE'>Badge</MenuItem>
                                <MenuItem value='LANGSUNG + BADGE'>Langsung + Badge</MenuItem>
                                <MenuItem value='LANGSUNG + TIMBUL'>Langsung + Timbul</MenuItem>
                                <MenuItem value='BADGE + TIMBUL'>Badge + Timbul</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Jenis Sablon :</Typography>
                            <Select labelId='product-select-label' size='small' value={sablon} onChange={(e) => setSablon(e.target.value)}>
                                <MenuItem value='DTF'>DTF</MenuItem>
                                <MenuItem value='RUBBER'>Rubber</MenuItem>
                                <MenuItem value='PLASTISOL'>Plastisol</MenuItem>
                                <MenuItem value='KOMBINASI'>Kombinasi</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Jahitan :</Typography>
                            <Select labelId='product-select-label' size='small' value={jahitan} onChange={(e) => setJahitan(e.target.value)}>
                                <MenuItem value='STANDAR'>Standar</MenuItem>
                                <MenuItem value='SINGLE'>Single</MenuItem>
                                <MenuItem value='DOUBLE'>Double</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Hoodie :</Typography>
                            <Select labelId='pattern-select-label' size='small' value={hoodie} onChange={(e) => setHoodie(e.target.value)}>
                                <MenuItem value='PATEN'>Paten</MenuItem>
                                <MenuItem value='LEPAS-PASANG'>Lepas Pasang</MenuItem>
                                <MenuItem value='LIPAT'>Lipat</MenuItem>
                                <MenuItem value='MASUK KERAH'>Masuk Kerah</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Potongan Bawah :</Typography>
                            <Select labelId='fabric-select-label' size='small' value={cuttingButtom} onChange={(e) => setCuttingButtom(e.target.value)}>
                                <MenuItem value='LURUS'>Lurus</MenuItem>
                                <MenuItem value='LENGKUNG'>Lengkung</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Belahan Samping :</Typography>
                            <Select labelId='fabric-select-label' size='small' value={sideSlit} onChange={(e) => setSideSlit(e.target.value)}>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
                                <MenuItem value='PAKAI'>Pakai</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Kerah :</Typography>
                            <Select labelId='product-select-label' size='small' value={neck} onChange={(e) => setNeck(e.target.value)}>
                                <MenuItem value='STANDAR'>Standar</MenuItem>
                                <MenuItem value='O_NECK'>O-Neck</MenuItem>
                                <MenuItem value='V_NECK'>V-Neck</MenuItem>
                                <MenuItem value='SHANGHAI'>Shanghai</MenuItem>
                                <MenuItem value='KERAH JADI'>Kerah Jadi</MenuItem>
                                <MenuItem value='KERAH BIKIN'>Kerah Bikin</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Plaket :</Typography>
                            <Select labelId='product-select-label' size='small' value={placard} onChange={(e) => setPlacard(e.target.value)}>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
                                <MenuItem value='KNOP DALAM 3 PCS - HITAM'>Knop Dalam 3 pcs - Hitam</MenuItem>
                                <MenuItem value='KNOP DALAM 3 PCS - NAVY'>Knop Dalam 3 pcs - Navy</MenuItem>
                                <MenuItem value='KNOP DALAM 3 PCS - MERAH'>Knop Dalam 3 pcs - Merah</MenuItem>
                                <MenuItem value='KNOP LUAR 4 PCS - HITAM'>Knop Luar 4 pcs - Hitam</MenuItem>
                                <MenuItem value='VELCRO 3 PCS - HITAM'>Velcro 3 pcs - Hitam</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Saku :</Typography>
                            <Select labelId='product-select-label' size='small' value={pocket} onChange={(e) => setPocket(e.target.value)}>
                                <MenuItem value='STANDAR POLA'>Standar Pola</MenuItem>
                                <MenuItem value='GELEMBUNG'>Gelembung</MenuItem>
                                <MenuItem value='DALAM'>Dalam</MenuItem>
                                <MenuItem value='TEMPEL'>Tempel</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Saku Bawah :</Typography>
                            <Select labelId='product-select-label' size='small' value={bottomPocket} onChange={(e) => setBottomPocket(e.target.value)}>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
                                <MenuItem value='TANPA ZIPPER'>Tanpa Zipper</MenuItem>
                                <MenuItem value='PAKAI ZIPPER'>Pakai Zipper</MenuItem>
                                <MenuItem value='GEMBUNG'>Gembung</MenuItem>
                                <MenuItem value='TEMPEL'>Tempel</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Saku Furing :</Typography>
                            <Select labelId='product-select-label' size='small' value={furingPocket} onChange={(e) => setFuringPocket(e.target.value)}>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
                                <MenuItem value='KANAN KIRI'>Kanan-Kiri</MenuItem>
                                <MenuItem value='KANAN'>Kanan</MenuItem>
                                <MenuItem value='KIRI'>Kiri</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Ujung Lengan :</Typography>
                            <Select labelId='product-select-label' size='small' value={armEnd} onChange={(e) => setArmEnd(e.target.value)}>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
                                <MenuItem value='VELCRO'>Velcro</MenuItem>
                                <MenuItem value='KERUT_VELCRO'>Kerut Velcro</MenuItem>
                                <MenuItem value='KERUT'>Kerut</MenuItem>
                                <MenuItem value='MANSET PINGGUL'>Manset Pinggul</MenuItem>
                                <MenuItem value='MANSET JADI'>Manset Jadi</MenuItem>
                                <MenuItem value='MANSET LIPAT LANGSUNG'>Manset Lipat Langsung</MenuItem>
                                <MenuItem value='MANSET PENDEK'>Manset Pendek</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Kancing Depan :</Typography>
                            <Select labelId='product-select-label' size='small' value={frontButton} onChange={(e) => setFrontButton(e.target.value)}>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
                                <MenuItem value='LUAR'>Luar</MenuItem>
                                <MenuItem value='DALAM'>Dalam</MenuItem>
                                <MenuItem value='ZIPPER LUAR'>Zipper Luar</MenuItem>
                                <MenuItem value='ZIPPER DALAM'>Zipper Dalam</MenuItem>
                                <MenuItem value='ZIPPER PLAKET'>Zipper Plaket</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 2,
                width: '100%',
            }}>
                <Button variant='contained' size='medium' onClick={() => navigate('/market/input-desain/input-spesifikasi')}>Kembali</Button>
                <Button variant='contained' size='medium' onClick={() => navigate('/market/input-desain/input-tambahan')}>Selanjutnya</Button>
            </Box>
        </Box>
    )
}