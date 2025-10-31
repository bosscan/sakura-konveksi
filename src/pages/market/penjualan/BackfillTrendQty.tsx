import { Box, Button, Typography, Alert } from '@mui/material';
import { useState } from 'react';

export default function BackfillTrendQty() {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const run = () => {
    setError('');
    try {
      const trendKey = 'database_trend';
      const trendRaw = localStorage.getItem(trendKey);
      const trendList: Array<any> = trendRaw ? JSON.parse(trendRaw) : [];
      const queueRaw = localStorage.getItem('antrian_input_desain');
      const queue: Array<any> = queueRaw ? JSON.parse(queueRaw) : [];

      const sanitize = (v: any) => {
        const n = Number(String(v ?? '').replace(/[^\d-]/g, ''));
        return !isNaN(n) && n > 0 ? String(n) : '';
      };

      let updated = 0;
      const qIndex: Record<string, any> = {};
      queue.forEach(spk => { if (spk?.idSpk) qIndex[spk.idSpk] = spk; });

      const newTrend = trendList.map((t) => {
        const curQty = sanitize(t.quantity);
        if (curQty) return t; // already filled
        // Prefer matching by idSpk if present
        const spk = t.idSpk ? qIndex[t.idSpk] : null;
        let qty = sanitize(spk?.quantity);
        if (!qty && spk?.items) qty = sanitize(spk.items.length);
        if (!qty) qty = '0';
        if (qty !== (t.quantity ?? '')) {
          updated += 1;
          return { ...t, quantity: qty };
        }
        return t;
      });

      localStorage.setItem(trendKey, JSON.stringify(newTrend));
      setResult(`Backfill selesai. Baris diperbarui: ${updated}`);
    } catch (e: any) {
      setError('Gagal menjalankan backfill.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Backfill Trend Quantity</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {result && <Alert severity="success" sx={{ mb: 2 }}>{result}</Alert>}
      <Button variant="contained" onClick={run}>Run Backfill</Button>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Catatan: Utilitas ini memperbarui quantity pada database_trend yang kosong/0 berdasarkan data SPK di antrian_input_desain.
      </Typography>
    </Box>
  );
}
