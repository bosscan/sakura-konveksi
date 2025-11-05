import { Box, Button, Grid, Typography, TextField, Select, MenuItem } from '@mui/material'
import { useState } from 'react';
import kvStore from '../../../../lib/kvStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function InputSpesifikasi() {
    const navigate = useNavigate();
    // const { search } = useLocation();

    // const spkId = useMemo(() => {
    //     const p = new URLSearchParams(search);
    //     return (p.get('spk') || '').trim();
    // }, [search]);


    const [nameDesign, setNameDesign] = useState('');
    const [sample, setSample] = useState('');
    const [product, setProduct] = useState('');
    const [pattern, setPattern] = useState('');
    const [fabric, setFabric] = useState('');
    const [fabricColor, setFabricColor] = useState('')
    const [colorCombination, setColorCombination] = useState('')
    const [codeColor, setCodeColor] = useState('')


    // const [options, setOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({})
    // const [optionsError, setOptionsError] = useState<string>('')

    // // Minimal offline defaults so dropdowns still usable if API is down
    // const DEFAULT_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
    //     sample: [
    //         { value: 'ADA', label: 'Ada' },
    //         { value: 'TIDAK', label: 'Tidak' },
    //     ],
    //     jenis_produk: [
    //         { value: 'KAOS', label: 'Kaos' },
    //         { value: 'JAKET', label: 'Jaket' },
    //         { value: 'CELANA', label: 'Celana' },
    //         { value: 'KEMEJA', label: 'Kemeja' },
    //         { value: 'POLO', label: 'Polo' },
    //     ],
    //     jenis_pola: [
    //         { value: 'KAOS', label: 'Kaos' },
    //         { value: 'POLO', label: 'Polo' },
    //         { value: 'PDH', label: 'PDH' },
    //         { value: 'TACTICAL', label: 'Tactical' },
    //     ],
    //     jenis_kain: [
    //         { value: 'AMERICAN_DRILL', label: 'American Drill' },
    //         { value: 'NAGATA_DRILL', label: 'Nagata Drill' },
    //         { value: 'COMBED_30S', label: 'Combed 30S' },
    //     ],
    // }

    // Load form data and dropdown options on mount
    // useEffect(() => {
    //             const savedData = localStorage.getItem('inputDetailForm');
    //             if (savedData) {
    //                     const parsedData = JSON.parse(savedData);
    //                     setNameDesign(parsedData.nameDesign || '');
    //                     setSample(parsedData.sample || '');
    //                     setProduct(parsedData.product || '');
    //                     setPattern(parsedData.pattern || '');
    //                     setFabric(parsedData.fabric || '');
    //                     setFabricColor(parsedData.fabricColor || '');
    //                     setColorCombination(parsedData.colorCombination || '');
    //                     setCodeColor(parsedData.codeColor || '');
    //             }
    //             // Fetch dropdown enums
    //             (async () => {
    //                 try {
    //                     const res = await fetch('/api/dropdown/options');
    //                     if (!res.ok) throw new Error('HTTP '+res.status);
    //                     const optList = await res.json();
    //                     const byKey: Record<string, Array<{ value: string; label: string }>> = {};
    //                     (optList || []).forEach((o: any) => {
    //                         if (!o?.attribute) return;
    //                         const arr = byKey[o.attribute] || [];
    //                         arr.push({ value: o.value, label: o.label || o.value });
    //                         byKey[o.attribute] = arr;
    //                     });
    //                     setOptions(byKey);
    //                     setOptionsError('');
    //                     // cache
    //                     try { localStorage.setItem('dropdown_options_cache', JSON.stringify(byKey)); } catch {}
    //                 } catch (err) {
    //                     // Fallback to cache or defaults
    //                     try {
    //                         const raw = localStorage.getItem('dropdown_options_cache');
    //                         if (raw) {
    //                             setOptions(JSON.parse(raw));
    //                             setOptionsError('Gagal memuat pilihan, gunakan data cache.');
    //                             return;
    //                         }
    //                     } catch {}
    //                     setOptions(DEFAULT_OPTIONS);
    //                     setOptionsError('Gagal memuat pilihan, menggunakan pilihan default.');
    //                 }
    //             })();
    // }, []);

    // Save form data to KV (with localStorage fallback) whenever it changes
    useEffect(() => {
        const formData = {
            nameDesign,
            sample,
            product,
            pattern,
            fabric,
            fabricColor,
            colorCombination,
            codeColor,
        };
        (async () => {
            try {
                await kvStore.set('inputDetailForm', formData);
            } catch {}
        })();
    }, [nameDesign, sample, product, pattern, fabric, fabricColor, colorCombination, codeColor]);

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
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Spesifikasi Desain</Typography>
                {/* {optionsError && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {optionsError}
                    </Alert>
                )} */}
                <Grid container spacing={2} justifyContent="flex-start" alignItems="flex-start">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: { xs: 'stretch', md: 'center' },
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Nama Desain :</Typography>
                            <TextField variant='outlined' size='small' value={nameDesign} onChange={(e) => setNameDesign(e.target.value)} sx={{flex: 1}}/>
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
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 }}}>Sample :</Typography>
                            <Select labelId='sample-select-label' size='small' value={sample} onChange={(e) => setSample(e.target.value)}>
                                <MenuItem value='ADA'>Ada</MenuItem>
                                <MenuItem value='TIDAK'>Tidak</MenuItem>
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
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Jenis Produk :</Typography>
                            <Select labelId='product-select-label' size='small' value={product} onChange={(e) => setProduct(e.target.value)}>
                                <MenuItem value='JAKET'>Jaket</MenuItem>
                                <MenuItem value='PDL/PDH'>PDL/PDH</MenuItem>
                                <MenuItem value='ROMPI'>Rompi</MenuItem>
                                <MenuItem value='SAFETY'>Safety</MenuItem>
                                <MenuItem value='TACTICAL'>Tactical</MenuItem>
                                <MenuItem value='KAOS'>Kaos</MenuItem>
                                <MenuItem value='CELANA PANJANG'>Celana Panjang</MenuItem>
                                <MenuItem value='POLO'>Polo</MenuItem>
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
                            }}>
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Jenis Pola :</Typography>
                            <Select labelId='pattern-select-label' size='small' value={pattern} onChange={(e) => setPattern(e.target.value)} >
                                <MenuItem value=''>Pilih Jenis Pola</MenuItem>
                                <MenuItem value='KAOS'>Kaos</MenuItem>
                                <MenuItem value='POLO'>Polo</MenuItem>
                                <MenuItem value='PDH'>PDH</MenuItem>
                                <MenuItem value='TACTICAL PLANTERS'>Tactical Planters</MenuItem>
                                <MenuItem value='TACTICAL KJ'>Tactical KJ</MenuItem>
                                <MenuItem value='SAFETY'>Safety</MenuItem>
                                <MenuItem value='PETROSEA'>Petrosea</MenuItem>
                                <MenuItem value='BERAU'>Berau</MenuItem>
                                <MenuItem value='ADARO'>Adaro</MenuItem>
                                <MenuItem value='PAMA'>Pama</MenuItem>
                                <MenuItem value='KPC 2 WARNA'>KPC 2 Warna</MenuItem>
                                <MenuItem value='GRASBERG'>Grasberg</MenuItem>
                                <MenuItem value='JEANS'>Jeans</MenuItem>
                                <MenuItem value='CARGO'>Cargo</MenuItem>
                                <MenuItem value='SOLIDARITAS'>Solidaritas</MenuItem>
                                <MenuItem value='ROMPI'>Rompi</MenuItem>
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
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Jenis Kain :</Typography>
                            <Select labelId='fabric-select-label' size='small' value={fabric} onChange={(e) => setFabric(e.target.value)}>
                                <MenuItem value='AMERICAN DRILL'>American Drill</MenuItem>
                                <MenuItem value='HIROKAYA DRILL'>Hirokaya Drill</MenuItem>
                                <MenuItem value='NAGATA DRILL'>Nagata Drill</MenuItem>
                                <MenuItem value='TEXMOODA'>Texmooda</MenuItem>
                                <MenuItem value='BABY CANVAS'>Baby Canvas</MenuItem>
                                <MenuItem value='TASLAN BALLON'>Taslan Balloon</MenuItem>
                                <MenuItem value='TASLAN / MICRO POLY BALON (STOK)'>Taslan / Micro Poly Balon (Stok)</MenuItem>
                                <MenuItem value='TASLAN MILKY'>Taslan Milky</MenuItem>
                                <MenuItem value='COMBED 30S'>Combed 30S</MenuItem>
                                <MenuItem value='COMBED 24S'>Combed 24S</MenuItem>
                                <MenuItem value='LACOSTE PE'>Lacoste PE</MenuItem>
                                <MenuItem value='LACOSTE COTTON'>Lacoste Cotton</MenuItem>
                                <MenuItem value='LACOSTE CVC'>Lacoste CVC</MenuItem>
                                <MenuItem value='DENIM'>Denim</MenuItem>
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
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Warna Kain :</Typography>
                            <TextField  size='small' value={fabricColor} onChange={(e) => setFabricColor(e.target.value)} sx={{flex: 1}} />
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
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Kombinasi Warna Kain :</Typography>
                            <TextField  size='small' value={colorCombination} onChange={(e) => setColorCombination(e.target.value)} sx={{flex: 1}} />
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
                            <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Kode Warna Kain :</Typography>
                            <TextField  size='small' value={codeColor} onChange={(e) => setCodeColor(e.target.value)} sx={{flex: 1}}/>
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
                <Button variant='contained' size='medium' onClick={() => navigate('/market/input-desain/antrian-input')}>Kembali</Button>
                <Button variant='contained' size='medium' onClick={() => navigate('/market/input-desain/input-detail')}>Selanjutnya</Button>
            </Box>
        </Box>
    )
}