import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import kvStore from '../../../lib/kvStore';

type UrgentItem = {
  idSpk: string;
  deadline: string; // ISO date (yyyy-mm-dd) or ISO string
  note: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const STORAGE_KEY = 'spk_urgent_list';

export default function InputSpkUrgent() {
  const [idSpk, setIdSpk] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [list, setList] = useState<UrgentItem[]>([]);
  const [msg, setMsg] = useState<string>('');

  const load = useCallback(async () => {
    try {
      let arr: UrgentItem[] = [];
      try {
        const raw = await kvStore.get(STORAGE_KEY);
        arr = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []);
      } catch { arr = []; }
      setList(arr);
    } catch { setList([]); }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await load();
      try {
        const sub = kvStore.subscribe(STORAGE_KEY, (v) => {
          try { const arr = Array.isArray(v) ? v : (v ? JSON.parse(String(v)) : []); if (mounted) setList(arr); } catch { if (mounted) setList([]); }
        });
        return () => { try { sub.unsubscribe(); } catch {} };
      } catch {
        // fallback: no kvStore subscribe available
      }
    })();
    return () => { mounted = false; };
  }, [load]);

  const parseSmart = (value?: string) => {
    if (!value) return null as Date | null;
    const s = String(value);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const dt = new Date(s); return isNaN(dt.getTime()) ? null : dt;
  };
  const formatWIB = (value?: string) => {
    const d = parseSmart(value); if (!d) return value || '-';
    const date = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d).replace(/\//g, '-');
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
    return `${date} ${time}`;
  };

  const save = async () => {
    const id = idSpk.trim();
    if (!id) { setMsg('ID SPK wajib diisi'); return; }
    if (!deadline) { setMsg('Tanggal deadline urgent wajib diisi'); return; }
    const now = new Date().toISOString();
    const next: UrgentItem[] = [...list];
    const idx = next.findIndex((it) => (it.idSpk || '').trim() === id);
    if (idx >= 0) {
      next[idx] = { ...next[idx], idSpk: id, deadline, note: note.trim(), updatedAt: now };
    } else {
      next.unshift({ idSpk: id, deadline, note: note.trim(), createdAt: now, updatedAt: now });
    }
    try {
      await kvStore.set(STORAGE_KEY, next);
      setList(next);
    } catch { setList(next); }
    setMsg('Data SPK Urgent tersimpan.');
    setIdSpk('');
    setDeadline('');
    setNote('');
  };

  const last5 = useMemo(() => list.slice(0, 5), [list]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Input SPK Urgent</Typography>
      <Paper sx={{ p: 2, maxWidth: 640 }}>
        <Stack spacing={2}>
          <TextField label="ID SPK" value={idSpk} onChange={(e) => setIdSpk(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }} required />
          <TextField label="Deadline Urgent" type="date" InputLabelProps={{ shrink: true }}
            value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          <TextField label="Keterangan Urgent" value={note} onChange={(e) => setNote(e.target.value)}
            multiline minRows={2} placeholder="Alasan atau catatan urgent" />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={save}>Simpan</Button>
            <Button variant="text" onClick={() => { setIdSpk(''); setDeadline(''); setNote(''); setMsg(''); }}>Reset</Button>
          </Stack>
          {msg && <Typography color="success.main">{msg}</Typography>}
        </Stack>
      </Paper>

      {last5.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>5 Data Terakhir</Typography>
          <Paper sx={{ p: 2 }}>
            {last5.map((it, idx) => (
              <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                • {it.idSpk} · Deadline Urgent: {formatWIB(it.deadline)} · {it.note || '-'}
              </Typography>
            ))}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
