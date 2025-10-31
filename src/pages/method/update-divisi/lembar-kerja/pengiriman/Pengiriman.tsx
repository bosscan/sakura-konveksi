import { Box, TextField, Typography, Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pengiriman() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const goDetail = () => {
        const spk = search.trim();
        if (!spk) return;
        navigate(`/method/update-divisi/pengiriman/detail-lembar-kerja?spk=${encodeURIComponent(spk)}`);
    };

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
                                width: { xs: '100%', md: '80%' },
                height: '500',
                display: 'flex',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                                alignItems: 'stretch',
                p: 3,
                mb: 3
            }}>
                <Typography variant="h6" fontWeight={700}>Divisi Pengiriman</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                                    <TextField
                                        required
                                        id='lembar-pengiriman'
                                        label='Masukkan ID SPK'
                                        size='small'
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') goDetail(); }}
                                        sx={{ flex: 1, minWidth: 0 }}
                                    />
                                    <Button variant='contained' color='primary' disabled={!search.trim()} onClick={goDetail} sx={{ whiteSpace: 'nowrap' }}>
                                        Kerjakan
                                    </Button>
                                </Box>
            </Box>

        </Box>);
}