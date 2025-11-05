import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button, Dialog, AppBar, Toolbar, IconButton, TextField, MenuItem, Stack, Snackbar, Alert, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useRef, useState } from 'react';
import kvStore from '../../../lib/kvStore';

type AssetBlock = { file: string | null; ukuran: string; jarak: string; keterangan: string };
type Worksheet = {
  dadaKanan: AssetBlock; dadaKiri: AssetBlock; lenganKanan: AssetBlock; lenganKiri: AssetBlock; belakang: AssetBlock; tambahanReferensi: AssetBlock; mockup: AssetBlock;
  linkDriveInputCS: string; linkDriveAssetJadi: string; catatan?: string;
};
type QueueItem = {
  queueId?: string;
  idRekapCustom: string; idSpk?: string; idCustom: string; namaDesain: string; jenisProduk: string; jenisPola: string; tanggalInput: string; namaCS: string; status?: string; revisiCatatan?: string; worksheet?: Worksheet;
};

export default function PraProduksiRevisi() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [rows, setRows] = useState<QueueItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QueueItem | null>(null);
  const [status, setStatus] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [ws, setWs] = useState<Worksheet | null>(null);
  const [showRevisiDetail, setShowRevisiDetail] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState<{ mockup?: string } | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Helpers to avoid storing large base64 images in localStorage
  const sanitizeWorksheet = (w?: Worksheet | null, note?: string): Worksheet | undefined => {
    if (!w) return undefined;
    const trim = (s?: string) => (s ?? '').toString();
    const strip = (b: AssetBlock): AssetBlock => ({ file: null, ukuran: trim(b.ukuran), jarak: trim(b.jarak), keterangan: trim(b.keterangan) });
    return {
      dadaKanan: strip(w.dadaKanan),
      dadaKiri: strip(w.dadaKiri),
      lenganKanan: strip(w.lenganKanan),
      lenganKiri: strip(w.lenganKiri),
      belakang: strip(w.belakang),
      tambahanReferensi: strip(w.tambahanReferensi),
      mockup: strip(w.mockup),
      linkDriveInputCS: trim(w.linkDriveInputCS),
      linkDriveAssetJadi: trim(w.linkDriveAssetJadi),
      catatan: trim(note ?? w.catatan ?? ''),
    };
  };

  const persistDesignQueue = async (list: QueueItem[]) => {
    try {
      await kvStore.set('design_queue', list);
      return true;
    } catch (err) {
      try {
        const shrunkList = list.map((it) => ({ ...it, worksheet: it.worksheet ? sanitizeWorksheet(it.worksheet) : undefined }));
        await kvStore.set('design_queue', shrunkList);
        return true;
      } catch {
        return false;
      }
    }
  };

  // Simple client-side image downscale to keep thumbnail small
  const downscaleImage = (dataUrl: string, maxSize = 700, quality = 0.78): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height *= maxSize / width; width = maxSize; }
        } else {
          if (height > maxSize) { width *= maxSize / height; height = maxSize; }
        }
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const out = canvas.toDataURL('image/jpeg', quality);
          resolve(out || dataUrl);
        } catch { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const raw = await kvStore.get('design_queue');
        const list: QueueItem[] = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []);
        // ensure queueIds
        let mutated = false;
        for (const it of list) {
          if (!it.queueId) { (it as any).queueId = (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`); mutated = true; }
        }
        if (mutated) { try { await kvStore.set('design_queue', list); } catch {} }
        if (mounted) setRows(list.filter(it => it.status === 'Antrian revisi'));
      } catch { if (mounted) setRows([]); }
    };
    refresh();
    const unsub = kvStore.subscribe('design_queue', () => { try { refresh(); } catch {} });
    const timer = setInterval(refresh, 6000);
    return () => { mounted = false; try { (unsub as any)?.unsubscribe?.(); } catch {} clearInterval(timer); };
  }, []);

  const openWorksheet = (rekapId: string, idSpk?: string) => {
    const found = rows.find(r => r.idRekapCustom === rekapId && String(r.idSpk || '') === String(idSpk || '')) || null;
    if (!found) return;
    setActive(found);
    setStatus(found.status || 'Antrian revisi');
    setCatatan(found.worksheet?.catatan || '');
    setWs(found.worksheet || {
      dadaKanan: { file: null, ukuran: '', jarak: '', keterangan: '' },
      dadaKiri: { file: null, ukuran: '', jarak: '', keterangan: '' },
      lenganKanan: { file: null, ukuran: '', jarak: '', keterangan: '' },
      lenganKiri: { file: null, ukuran: '', jarak: '', keterangan: '' },
      belakang: { file: null, ukuran: '', jarak: '', keterangan: '' },
      tambahanReferensi: { file: null, ukuran: '', jarak: '', keterangan: '' },
      mockup: { file: null, ukuran: '', jarak: '', keterangan: '' },
      linkDriveInputCS: '', linkDriveAssetJadi: '', catatan: ''
    });
    setOpen(true);
  };

  const persist = (list: QueueItem[]) => persistDesignQueue(list);

  const handleSave = async () => {
    if (!active) return;
    try {
      const raw = await kvStore.get('design_queue');
      const all: QueueItem[] = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []);
      const safeWs = sanitizeWorksheet(ws, catatan);
      const updAll = all.map((it: QueueItem) => (it.idRekapCustom === active.idRekapCustom && String(it.idSpk || '') === String((active as any).idSpk || '')) ? { ...it, status, worksheet: safeWs } : it);
      const ok = await persist(updAll);
      if (!ok) { setSnack({ open: true, message: 'Gagal menyimpan perubahan', severity: 'error' }); return; }
      // save thumbnail to map if available
      try {
        if (active.queueId && ws?.mockup?.file) {
          const mapKey = 'mockup_thumb_map';
          const rawMap = await kvStore.get(mapKey);
          const thumbMap = rawMap && typeof rawMap === 'object' ? rawMap as Record<string, string> : (rawMap ? JSON.parse(String(rawMap)) : {});
          thumbMap[active.queueId] = ws.mockup.file as string;
          await kvStore.set(mapKey, thumbMap);
        }
      } catch {}
      setRows(updAll.filter((x: QueueItem) => x.status === 'Antrian revisi'));
      setOpen(false); setActive(null);
      setSnack({ open: true, message: 'Worksheet revisi disimpan', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Gagal menyimpan perubahan', severity: 'error' });
    }
  };

  const handleSelesai = async () => {
    if (saving) return;
    if (!active) return;
    setSaving(true);
    const errs: { mockup?: string } = {};
    if (!ws?.mockup?.file) errs.mockup = 'Mockup revisi wajib diupload.';
    if (Object.keys(errs).length > 0) { setErrors(errs); setSnack({ open: true, message: 'Lengkapi data revisi', severity: 'error' }); setSaving(false); return; }
    try {
      const raw = await kvStore.get('design_queue');
      const all: QueueItem[] = Array.isArray(raw) ? raw : (raw ? JSON.parse(String(raw)) : []);
      const safeWs = sanitizeWorksheet(ws, catatan);
      const updAll = all.map((it: QueueItem) => (it.idRekapCustom === active.idRekapCustom && String(it.idSpk || '') === String((active as any).idSpk || '')) ? { ...it, status: 'Selesai', worksheet: safeWs } : it);
      const ok = await persist(updAll);
      if (!ok) { setSnack({ open: true, message: 'Gagal menyelesaikan revisi (server)', severity: 'error' }); setSaving(false); return; }
      // keep latest thumbnail
      try {
        if (active.queueId && ws?.mockup?.file) {
          const mapKey = 'mockup_thumb_map';
          const rawMap = await kvStore.get(mapKey);
          const thumbMap = rawMap && typeof rawMap === 'object' ? rawMap as Record<string, string> : (rawMap ? JSON.parse(String(rawMap)) : {});
          thumbMap[active.queueId] = ws.mockup.file as string;
          await kvStore.set(mapKey, thumbMap);
        }
      } catch {}
      setRows(updAll.filter((x: QueueItem) => x.status === 'Antrian revisi'));
      setOpen(false); setActive(null);
      setSnack({ open: true, message: 'Revisi diselesaikan', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Gagal menyelesaikan revisi', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '100%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Divisi Desainer Pra Produksi - Antrian Pengerjaan Revisi Desain</Typography>
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1300 }} aria-label="pra-produksi-revisi" ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID Rekap Custom</TableCell>
                <TableCell>ID Custom</TableCell>
                <TableCell>Nama Desain</TableCell>
                <TableCell>Jenis Produk</TableCell>
                <TableCell>Jenis Pola</TableCell>
                <TableCell>Tanggal Input</TableCell>
                <TableCell>Nama CS</TableCell>
                <TableCell>Detail Revisi</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${row.idRekapCustom}-${row.idSpk || index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.idRekapCustom}</TableCell>
                  <TableCell>{row.idCustom}</TableCell>
                  <TableCell>{row.namaDesain}</TableCell>
                  <TableCell>{row.jenisProduk}</TableCell>
                  <TableCell>{row.jenisPola}</TableCell>
                  <TableCell>{row.tanggalInput}</TableCell>
                  <TableCell>{row.namaCS}</TableCell>
                  <TableCell>
                    <Button variant="outlined" onClick={() => setShowRevisiDetail(row.revisiCatatan || 'Tidak ada catatan')}>Detail</Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" onClick={() => openWorksheet(row.idRekapCustom, row.idSpk)}>Kerjakan Revisi</Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">Tidak ada antrian revisi</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Detail Revisi simple dialog */}
      <Dialog open={!!showRevisiDetail} onClose={() => setShowRevisiDetail(null)}>
        <Box sx={{ p: 3, minWidth: 360 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Catatan Revisi</Typography>
          <Typography whiteSpace="pre-wrap">{showRevisiDetail}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => setShowRevisiDetail(null)}>Tutup</Button>
          </Box>
        </Box>
      </Dialog>

      {/* Worksheet Dialog (same layout as desain) */}
      <Dialog fullScreen open={open} onClose={() => { setOpen(false); setActive(null); }} PaperProps={{ sx: { pointerEvents: 'auto' } }}>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => { setOpen(false); setActive(null); }} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6">Divisi Revisi Desain</Typography>
            <Button color="inherit" variant="outlined" onClick={handleSave}>Simpan</Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3, pointerEvents: 'auto' }}>
          {active && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 2, mb: 3 }}>
                <TextField label="ID Rekap Custom" value={active.idRekapCustom} size="small" InputProps={{ readOnly: true }} />
                <TextField label="ID Custom" value={active.idCustom} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Nama Desain" value={active.namaDesain} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Jenis Produk" value={active.jenisProduk} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Jenis Pola" value={active.jenisPola} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Tanggal Input" value={active.tanggalInput} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Nama CS" value={active.namaCS} size="small" InputProps={{ readOnly: true }} />
                <TextField select label="Status" value={status} size="small" onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="Antrian revisi">Antrian revisi</MenuItem>
                  <MenuItem value="Sedang dikerjakan">Sedang dikerjakan</MenuItem>
                  <MenuItem value="Selesai">Selesai</MenuItem>
                </TextField>
              </Box>
              <Typography variant="h6" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>ASSET DESAIN JADI</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {[
                  { key: 'dadaKanan', label: 'ATTRIBUT DADA KANAN' },
                  { key: 'dadaKiri', label: 'ATTRIBUT DADA KIRI' },
                  { key: 'lenganKanan', label: 'ATTRIBUT LENGAN KANAN' },
                  { key: 'lenganKiri', label: 'ATTRIBUT LENGAN KIRI' },
                  { key: 'belakang', label: 'ATTRIBUT BELAKANG' },
                  { key: 'tambahanReferensi', label: 'DETAIL TAMBAHAN/REFERENSI' },
                  { key: 'mockup', label: 'MOCKUP' },
                ].map((sec) => (
                  <Box key={sec.key} sx={{ minWidth: 0 }}>
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>{sec.label}</Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <Button variant="outlined" component="label" size="small">
                          Upload
                          <input type="file" accept="image/*" hidden onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const dataUrl = reader.result as string;
                              if (sec.key === 'mockup') {
                                const thumb = await downscaleImage(dataUrl);
                                setWs((prev) => prev ? ({ ...prev, [sec.key]: { ...prev[sec.key as keyof Worksheet] as AssetBlock, file: thumb } }) : prev);
                                try {
                                  if (active?.queueId && thumb) {
                                    const mapKey = 'mockup_thumb_map';
                                    const rawMap = await kvStore.get(mapKey);
                                    const thumbMap = rawMap && typeof rawMap === 'object' ? rawMap as Record<string, string> : (rawMap ? JSON.parse(String(rawMap)) : {});
                                    thumbMap[active.queueId] = thumb;
                                    await kvStore.set(mapKey, thumbMap);
                                  }
                                } catch {}
                              } else {
                                setWs((prev) => prev ? ({ ...prev, [sec.key]: { ...prev[sec.key as keyof Worksheet] as AssetBlock, file: dataUrl } }) : prev);
                              }
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </Button>
                        {ws && (ws[sec.key as keyof Worksheet] as AssetBlock)?.file && (
                          <img src={(ws[sec.key as keyof Worksheet] as AssetBlock).file as string} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                        )}
                        {sec.key === 'mockup' && errors?.mockup && <Chip color="error" size="small" label={errors.mockup} />}
                      </Stack>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1 }}>
                        <TextField fullWidth size="small" label="UKURAN" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).ukuran : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), ukuran: e.target.value } }) : prev)} />
                        <TextField fullWidth size="small" label="JARAK" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).jarak : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), jarak: e.target.value } }) : prev)} />
                        <TextField fullWidth size="small" label="KETERANGAN" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).keterangan : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), keterangan: e.target.value } }) : prev)} />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
                <TextField fullWidth size="small" label="LINK DRIVE INPUT CS" value={ws?.linkDriveInputCS || ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, linkDriveInputCS: e.target.value }) : prev)} />
                <TextField fullWidth size="small" label="LINK DRIVE ASSET JADI" value={ws?.linkDriveAssetJadi || ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, linkDriveAssetJadi: e.target.value }) : prev)} />
              </Box>
              <TextField sx={{ mt: 2 }} label="Catatan" multiline rows={4} fullWidth value={catatan} onChange={(e) => setCatatan(e.target.value)} />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button variant="contained" color="success" onClick={handleSelesai} disabled={saving} sx={{ pointerEvents: 'auto', cursor: saving ? 'not-allowed' : 'pointer' }}>Selesai Desain</Button>
              </Box>
            </>
          )}
        </Box>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
