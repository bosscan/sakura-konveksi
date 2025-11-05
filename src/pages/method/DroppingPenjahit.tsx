import { Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import kvStore from '../../lib/kvStore';
import BarcodeScanButton from '../../components/BarcodeScanButton';

const KEY = 'penjahit_map'; // idSpk -> namaPenjahit

export default function DroppingPenjahit() {
  const [idSpk, setIdSpk] = useState('');
  const [nama, setNama] = useState('');
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const raw = await kvStore.get(KEY);
        const m = raw && typeof raw === 'object' ? raw as Record<string,string> : (raw ? JSON.parse(String(raw)) : {});
        if (mounted) setMap(m || {});
      } catch { if (mounted) setMap({}); }
    };
    refresh();
    const sub = kvStore.subscribe(KEY, () => { try { refresh(); } catch {} });
    return () => { mounted = false; try { sub.unsubscribe(); } catch {} };
  }, []);

  const handleSimpan = async () => {
    const k = idSpk.trim();
    const v = nama.trim();
    if (!k || !v) { alert('Isi ID SPK dan Nama Penjahit.'); return; }
    try {
      const newMap = { ...(map || {}) };
      newMap[k] = v;
      await kvStore.set(KEY, newMap);
      setIdSpk('');
      setNama('');
    } catch { alert('Gagal menyimpan.'); }
  };

  const handleHapus = async (k: string) => {
    try {
      const newMap = { ...(map || {}) };
      delete newMap[k];
      await kvStore.set(KEY, newMap);
    } catch { alert('Gagal menghapus.'); }
  };

  const rows = useMemo(() => Object.entries(map || {}).map(([k,v]) => ({ idSpk: k, nama: v })), [map]);

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Paper sx={{ width: '100%', maxWidth: 900, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}>
          Dropping Penjahit
        </Typography>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
          <TextField label="ID SPK" value={idSpk} onChange={(e)=>setIdSpk(e.target.value)} size="small" sx={{ flex: 1 }} />
          <BarcodeScanButton
            label="Scan ID SPK"
            size="small"
            variant="outlined"
            onDetected={(code) => {
              const text = String(code || '').trim();
              if (text) setIdSpk(text);
            }}
          />
          <TextField label="Nama Penjahit" value={nama} onChange={(e)=>setNama(e.target.value)} size="small" sx={{ flex: 1 }} />
          <Button variant="contained" onClick={handleSimpan}>Simpan</Button>
        </Stack>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID SPK</TableCell>
                <TableCell>Nama Penjahit</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">Belum ada data</TableCell></TableRow>
              ) : rows.map((r, idx) => (
                <TableRow key={r.idSpk}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{r.idSpk}</TableCell>
                  <TableCell>{r.nama}</TableCell>
                  <TableCell>
                    <Button size="small" color="error" variant="outlined" onClick={() => handleHapus(r.idSpk)}>Hapus</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
