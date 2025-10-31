import { Box, TextField, Typography, Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CuttingPola() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const goDetail = () => {
        const spk = search.trim();
        if (!spk) return;
        navigate(`/method/update-divisi/cutting-pola/detail-lembar-kerja?spk=${encodeURIComponent(spk)}`);
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
                width: '80%',
                height: '500',
                display: 'flex',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                mb: 3
            }}>
                <Typography variant="h6" fontWeight={700}>Divisi Cutting Pola</Typography>
                <TextField
                required
                id='lembar-cutting-pola'
                label='Masukkan ID SPK'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') goDetail(); }}
                sx={{
                    mt: 2,
                    minWidth: 320
                }} />
                <Button sx={{mt: 2}} variant='contained' color='primary' disabled={!search.trim()} onClick={goDetail}>
                    Kerjakan
                </Button>
            </Box>

        </Box>);
}