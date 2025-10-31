import { Box, Paper, Typography, TextField, Button, Snackbar, Alert, Stack } from '@mui/material';
import { useMemo, useState } from 'react';

type PelunasanRecord = {
  idTransaksi: string;
  nominal: number;
  bukti?: { name: string; type: string; size: number; dataUrl: string } | null;
  createdAt: string;
};

export default function InputPelunasan() {
  const [idTransaksi, setIdTransaksi] = useState('');
  const [nominal, setNominal] = useState('');
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
  const nominalNumber = useMemo(() => {
    const n = Number(String(nominal).replace(/[^\d-]/g, ''));
    return isNaN(n) ? 0 : n;
  }, [nominal]);

  const handleSave = async () => {
    const trx = idTransaksi.trim();
    if (!trx) { setSnack({ open: true, message: 'ID Transaksi wajib diisi', severity: 'error' }); return; }
    if (nominalNumber <= 0) { setSnack({ open: true, message: 'Nominal pelunasan tidak valid', severity: 'error' }); return; }

    // Load pipeline and update selesaiPelunasan for all items with this idTransaksi
    let updated = false;
    try {
      const raw = localStorage.getItem('spk_pipeline');
      const list: any[] = raw ? JSON.parse(raw) : [];
      const now = new Date().toISOString();
      for (const it of list) {
        if ((it?.idTransaksi || '').trim() === trx) {
          // Mark as selesai pelunasan if not already
          if (!it.selesaiPelunasan) { it.selesaiPelunasan = now; updated = true; }
        }
      }
      if (updated) localStorage.setItem('spk_pipeline', JSON.stringify(list));
    } catch {}

    // Persist pelunasan record with optional proof
    let record: PelunasanRecord | null = null;
    try {
      let proof: PelunasanRecord['bukti'] = null;
      if (buktiFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Gagal membaca file'));
          reader.readAsDataURL(buktiFile);
        });
        proof = { name: buktiFile.name, type: buktiFile.type, size: buktiFile.size, dataUrl };
      }
      record = { idTransaksi: trx, nominal: nominalNumber, bukti: proof, createdAt: new Date().toISOString() };
      const key = 'pelunasan_transaksi';
      const raw = localStorage.getItem(key);
      const arr: PelunasanRecord[] = raw ? JSON.parse(raw) : [];
      arr.push(record);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}

    if (!updated) {
      setSnack({ open: true, message: 'ID Transaksi tidak ditemukan pada pipeline, tetapi data pelunasan disimpan.', severity: 'info' });
    } else {
      setSnack({ open: true, message: 'Pelunasan disimpan dan status SPK diperbarui.', severity: 'success' });
      // Optional: clear form
      setIdTransaksi('');
      setNominal('');
      setBuktiFile(null);
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
      <Paper sx={{ p: 3, width: '100%', maxWidth: 560 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Input Pelunasan</Typography>
        <Stack spacing={2}>
          <TextField
            label="ID Transaksi"
            value={idTransaksi}
            onChange={(e) => setIdTransaksi(e.target.value)}
            fullWidth
          />
          <TextField
            label="Nominal Pelunasan"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            fullWidth
            placeholder="cth: 1500000"
            inputProps={{ inputMode: 'numeric' }}
          />
          <Button variant="outlined" component="label">
            Upload Bukti Transaksi
            <input type="file" hidden onChange={(e) => setBuktiFile(e.target.files?.[0] || null)} />
          </Button>
          {buktiFile && (
            <Typography variant="body2" color="text.secondary">
              File: {buktiFile.name} ({Math.round(buktiFile.size / 1024)} KB)
            </Typography>
          )}
          <Button variant="contained" color="primary" onClick={handleSave}>Simpan</Button>
        </Stack>
      </Paper>
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
