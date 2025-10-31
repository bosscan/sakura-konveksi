import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button, Dialog, AppBar, Toolbar, IconButton, TextField, MenuItem, Stack, Snackbar, Alert, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useEffect, useRef, useState } from 'react';
import TableExportToolbar from '../../../components/TableExportToolbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type QueueItem = {
  queueId?: string;
  idRekapCustom: string;
  idSpk?: string;
  idCustom: string;
  namaDesain: string;
  jenisProduk: string;
  jenisPola: string;
  tanggalInput: string;
  namaCS: string;
  assets: Array<{ 
    file: string | null
    attribute: string 
    size: string 
    distance: string 
    description: string }>;
  status?: string;
  worksheet?: Worksheet;
};

type AssetBlock = {
  file: string | null;
  ukuran: string;
  jarak: string;
  keterangan: string;
};

type Worksheet = {
  dadaKanan: AssetBlock;
  dadaKiri: AssetBlock;
  lenganKanan: AssetBlock;
  lenganKiri: AssetBlock;
  belakang: AssetBlock;
  tambahanReferensi: AssetBlock;
  mockup: AssetBlock;
  linkDriveInputCS: string;
  linkDriveAssetJadi: string;
  catatan?: string;
  cdr?: { file: string | null; filename?: string };
};

export default function PraProduksiAntrian() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [rows, setRows] = useState<QueueItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QueueItem | null>(null);
  const [status, setStatus] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [ws, setWs] = useState<Worksheet | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>(
    { open: false, message: '', severity: 'success' }
  );
  const [errors, setErrors] = useState<{ mockup?: string; links?: string } | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [csPreview, setCsPreview] = useState<{ open: boolean; item?: QueueItem } | null>(null);

  // Simple client-side image downscale to keep thumbnail small
  const downscaleImage = (dataUrl: string, maxSize = 600, quality = 0.7): Promise<string> => {
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
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Helpers to avoid storing large base64 images in localStorage
  const sanitizeWorksheet = (w?: Worksheet | null, note?: string): Worksheet | undefined => {
    if (!w) return undefined;
    const trim = (s?: string) => (s ?? '').toString();
    const strip = (b: AssetBlock): AssetBlock => ({ 
      file: b.file,
      // file: null, 
      ukuran: trim(b.ukuran), 
      jarak: trim(b.jarak), 
      keterangan: trim(b.keterangan) 
    });

    return {
      dadaKanan: strip(w.dadaKanan),
      dadaKiri: strip(w.dadaKiri),
      lenganKanan: strip(w.lenganKanan),
      lenganKiri: strip(w.lenganKiri),
      belakang: strip(w.belakang),
      tambahanReferensi: strip(w.tambahanReferensi),
      mockup: strip(w.mockup),
      cdr: w.cdr ? { file: w.cdr.file, filename: trim(w.cdr.filename) } : undefined,
      linkDriveInputCS: trim(w.linkDriveInputCS),
      linkDriveAssetJadi: trim(w.linkDriveAssetJadi),
      catatan: trim(note ?? w.catatan ?? ''),
    };
  };

  const sanitizeAssetsFile = (assets?: QueueItem['assets']): QueueItem['assets'] => {
    if (!Array.isArray(assets)) return [];
    return assets.map(a => ({ ...a}));
    // return assets.map(a => ({ ...a, file: null as string | null }));
  };

  const updateAssetsFromWorksheet = (assets: QueueItem['assets'], worksheet: Worksheet): QueueItem['assets'] => {
    const assetMap: Record<string, Partial<QueueItem['assets'][0]>> = {};

    assets.forEach(asset => {
      assetMap[asset.attribute] = asset
    })

    const WorksheetSections = [
      { attribute: 'dadaKanan', block: worksheet.dadaKanan },
      { attribute: 'dadaKiri', block: worksheet.dadaKiri },
      { attribute: 'lenganKanan', block: worksheet.lenganKanan },
      { attribute: 'lenganKiri', block: worksheet.lenganKiri },
      { attribute: 'belakang', block: worksheet.belakang },
      { attribute: 'tambahanReferensi', block: worksheet.tambahanReferensi },
      { attribute: 'mockup', block: worksheet.mockup },
    ]

    WorksheetSections.forEach(({attribute, block}) => {
      if (block.file || block.ukuran || block.jarak || block.keterangan) {
        assetMap[attribute] = {
          attribute,
          file: block.file, 
          size: block.ukuran,
          distance: block.jarak,
          description: block.keterangan,
        }
      }
    })

    return Object.values(assetMap) as QueueItem['assets']
  }

  const persistDesignQueue = (list: QueueItem[]) => {
    try {
      localStorage.setItem('design_queue', JSON.stringify(list));
      return true;
    } catch (err) {
      console.error('persistDesignQueue initial failed, try shrink', err);
      try {
        // Shrink existing stored list (remove any file base64 already saved previously)
        const raw = localStorage.getItem('design_queue');
        const existing: QueueItem[] = raw ? JSON.parse(raw) : [];
        const shrunk = existing.map((it) => ({
          ...it,
          assets: sanitizeAssetsFile(it.assets),
          worksheet: it.worksheet ? sanitizeWorksheet(it.worksheet) : undefined,
        }));
        localStorage.setItem('design_queue', JSON.stringify(shrunk));
      } catch (e2) {
        console.error('persistDesignQueue shrink existing failed', e2);
      }
      try {
        // Also shrink the list to be saved, then retry
        const shrunkList = list.map((it) => ({
          ...it,
          assets: sanitizeAssetsFile(it.assets),
          worksheet: it.worksheet ? sanitizeWorksheet(it.worksheet) : undefined,
        }));
        localStorage.setItem('design_queue', JSON.stringify(shrunkList));
        return true;
      } catch (e3) {
        console.error('persistDesignQueue retry failed', e3);
        return false;
      }
    }
  };

  useEffect(() => {
    const refresh = () => {
      const raw = localStorage.getItem('design_queue');
      const list: QueueItem[] = raw ? JSON.parse(raw) : [];
      // Pastikan setiap item punya queueId unik
      let mutated = false;
      for (const it of list) {
        if (!it.queueId) { (it as any).queueId = (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`); mutated = true; }
      }
      if (mutated) {
        try { localStorage.setItem('design_queue', JSON.stringify(list)); } catch { }
      }
      const filtered = list.filter(it => !['Antrian revisi', 'Selesai', 'Desain di validasi'].includes(it.status || ''));
      setRows(filtered);
    };
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === 'design_queue') refresh(); };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);

  const handleKerjakan = (rekapId: string, idSpk?: string) => {
    // Pilih item unik berdasarkan kombinasi Rekap + SPK
    const found = rows.find(r => r.idRekapCustom === rekapId && String(r.idSpk || '') === String(idSpk || '')) || null;
    if (!found) return;
    setActive(found);
    setStatus(found.status || 'Sedang dikerjakan');
    setCatatan(found.worksheet?.catatan || '');
    setWs(found.worksheet || {
      dadaKanan: { file: null, ukuran: '', jarak: '', keterangan: '' },
      dadaKiri: { file: null, ukuran: '', jarak: '', keterangan: '' },
      lenganKanan: { file: null, ukuran: '', jarak: '', keterangan: '' },
      lenganKiri: { file: null, ukuran: '', jarak: '', keterangan: '' },
      belakang: { file: null, ukuran: '', jarak: '', keterangan: '' },
      tambahanReferensi: { file: null, ukuran: '', jarak: '', keterangan: '' },
      mockup: { file: null, ukuran: '', jarak: '', keterangan: '' },
      cdr: { file: null, filename: '' },
      linkDriveInputCS: '',
      linkDriveAssetJadi: '',
      catatan: ''
    });
    setOpen(true);
    // also persist status change immediately
    // update in full list stored, then refresh filtered view
    const allRaw = localStorage.getItem('design_queue');
    const allList: QueueItem[] = allRaw ? JSON.parse(allRaw) : [];
    const updAll = allList.map(it => (it.idRekapCustom === rekapId && String(it.idSpk || '') === String(idSpk || '')) ? { ...it, status: 'Sedang dikerjakan' } : it);
    const ok = persistDesignQueue(updAll);
    if (!ok) {
      setSnack({ open: true, message: 'Gagal mengubah status ke Sedang dikerjakan (penyimpanan).', severity: 'error' });
    }
    const filtered = updAll.filter(it => !['Antrian revisi', 'Selesai', 'Desain di validasi'].includes(it.status || ''));
    setRows(filtered);
  };

  const handleClose = () => { setOpen(false); setActive(null); };

  const persist = (list: QueueItem[]) => persistDesignQueue(list);

  const handleSaveWorksheet = () => {
    if (!active || !ws) return;

    const allRaw = localStorage.getItem('design_queue');
    const allList: QueueItem[] = allRaw ? JSON.parse(allRaw) : [];

    const updatedAssets = updateAssetsFromWorksheet(active.assets || [], ws)

    const safeWs = sanitizeWorksheet(ws, catatan);
    const updAll = allList.map(it => 
      (it.idRekapCustom === active.idRekapCustom && String(it.idSpk || '') === String((active).idSpk || ''))
       ? { 
        ...it, 
        status, 
        worksheet: safeWs, 
        assets: updatedAssets
      } 
        : it);

    const ok = persist(updAll);
    if (!ok) {
      setSnack({ open: true, message: 'Gagal menyimpan perubahan ke localStorage.', severity: 'error' });
      return;
    }
    // Persist thumbnail mockup ringan ke map agar bisa dipreview di Antrian Pengerjaan
    try {
      if (active?.queueId && (ws?.mockup?.file || '')) {
        const mapKey = 'mockup_thumb_map';
        const rawMap = localStorage.getItem(mapKey);
        const thumbMap = rawMap ? JSON.parse(rawMap) : {};
        thumbMap[active.queueId] = ws.mockup.file; // di titik ini file masih ada di memori; map bisa ditimpa nantinya saat selesai
        localStorage.setItem(mapKey, JSON.stringify(thumbMap));
      }
    } catch { }

    const filtered = updAll.filter(it => !['Antrian revisi', 'Selesai', 'Desain di validasi'].includes(it.status || ''));
    setRows(filtered);
    setOpen(false);
    setActive(null);
    setSnack({ open: true, message: 'Worksheet dan disimpan', severity: 'success' });
  };

  const handleSelesaiDesain = () => {
    if (saving) { console.log('handleSelesaiDesain skipped: saving in progress'); return; }
    setSaving(true);

    try {
      if (!active) { console.warn('handleSelesaiDesain: no active item'); return; }
      // Validasi minimal: mockup atau link wajib ada
      setErrors(null);
      const hasMockup = Boolean(ws?.mockup?.file);
      const hasLink = Boolean((ws?.linkDriveAssetJadi || '').trim());

      console.log('handleSelesaiDesain start', { hasMockup, hasLink, active, idSpk: (active as any)?.idSpk });
      if (!hasMockup && !hasLink) {
        setErrors({ mockup: 'Upload mockup atau isi Link Asset Jadi.' });
        setSnack({ open: true, message: 'Upload mockup atau isi Link Asset Jadi terlebih dahulu', severity: 'error' });
        return;
      }

      const allRaw = localStorage.getItem('design_queue');
      let allList: QueueItem[] = allRaw ? JSON.parse(allRaw) : [];

      const updatedAssets = updateAssetsFromWorksheet(active.assets || [], ws!)

      const idRekapActive = String(active.idRekapCustom);
      const idSpkActive = String(active.idSpk || '');
      const safeWs = sanitizeWorksheet(ws, catatan);

      let matched = 0;

      // try {
      //   allList = allRaw ? JSON.parse(allRaw) : [];
      // } catch (err) {
      //   console.error('JSON parse design_queue failed', err, { allRaw });
      //   setSnack({ open: true, message: 'Data antrian tidak valid (localStorage).', severity: 'error' });
      //   return;
      // }
      
      
      // // simpan thumbnail terbaru ke map jika ada
      // try {
      //   if (active.queueId && ws?.mockup?.file) {
      //     const mapKey = 'mockup_thumb_map';
      //     const rawMap = localStorage.getItem(mapKey);
      //     const thumbMap = rawMap ? JSON.parse(rawMap) : {};
      //     thumbMap[active.queueId] = ws.mockup.file;
      //     localStorage.setItem(mapKey, JSON.stringify(thumbMap));
      //   }
      // } catch { }
      let updAll = allList.map(it => {
        const isMatch = (String(it.idRekapCustom) === idRekapActive) && (String(it.idSpk || '') === idSpkActive);
        if (isMatch) { 
          matched++; 
          return { ...it, 
            status: 'Selesai', 
            worksheet: safeWs, 
            assets: updatedAssets
          }; 
        }
        return it;
      });

      if (matched === 0) {
        updAll = updAll.map(it => {
          const isMatch = (String(it.idRekapCustom) === idRekapActive);
          if (isMatch) { matched++; return { ...it, status: 'Selesai', worksheet: safeWs, assets: sanitizeAssetsFile(it.assets) }; }
          return it;
        });
      }
      console.log('handleSelesaiDesain persist', { total: allList.length, matched, idRekapActive, idSpkActive });
      const ok = persist(updAll);
      if (!ok) {
        console.error('persist design_queue failed after retry');
        setSnack({ open: true, message: 'Gagal menyimpan perubahan ke localStorage.', severity: 'error' });
        return;
      }
      // Pindahkan ke antrian market: antrian_pengerjaan_desain
      try {
        const rawNext = localStorage.getItem('antrian_pengerjaan_desain');
        const nextList = rawNext ? JSON.parse(rawNext) : [];
        const moved = { ...active, status: 'Menunggu validasi', worksheet: safeWs, assets: sanitizeAssetsFile(active.assets) } as any;
        if (!moved.queueId) moved.queueId = active.queueId || (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
        nextList.push(moved);
        localStorage.setItem('antrian_pengerjaan_desain', JSON.stringify(nextList));
        // Simpan peta idSpk -> queueId agar Print SPK bisa menemukan thumbnail mockup
        try {
          const idSpkFin = String((active as any)?.idSpk || '');
          if (idSpkFin && moved.queueId) {
            const mapKey = 'design_queueid_by_spk';
            const raw = localStorage.getItem(mapKey);
            const map = raw ? JSON.parse(raw) : {};
            map[idSpkFin] = moved.queueId;
            localStorage.setItem(mapKey, JSON.stringify(map));
          }
        } catch { }
      } catch (e) { console.warn('move to antrian_pengerjaan_desain failed', e); }

      // propagate (best-effort)
      try {
        const ts = new Date().toISOString();
        const idSpk = String((active as any).idSpk || '');
        if (idSpk) {
          const pipeKey = 'spk_pipeline';
          const pipeRaw = localStorage.getItem(pipeKey);
          const pipeList = pipeRaw ? JSON.parse(pipeRaw) : [];
          const newPipe = pipeList.map((p: any) => p?.idSpk === idSpk ? { ...p, selesaiDesainProduksi: ts } : p);
          if (JSON.stringify(newPipe) !== JSON.stringify(pipeList)) localStorage.setItem(pipeKey, JSON.stringify(newPipe));

          const qKey = 'plotting_rekap_bordir_queue';
          const qRaw = localStorage.getItem(qKey);
          const qList = qRaw ? JSON.parse(qRaw) : [];
          const newQ = qList.map((q: any) => q?.idSpk === idSpk ? { ...q, selesaiDesainProduksi: ts } : q);
          if (JSON.stringify(newQ) !== JSON.stringify(qList)) localStorage.setItem(qKey, JSON.stringify(newQ));
        }
      } catch (err) {
        console.error('handleSelesaiDesain propagate error', err);
      }
      const filteredNow = updAll.filter(it => !['Antrian revisi', 'Selesai', 'Desain di validasi'].includes(it.status || ''));
      console.log('handleSelesaiDesain filteredNow length', filteredNow.length);
      setRows(filteredNow);
      // Fallback hapus lokal jika belum berkurang
      try {
        if (Array.isArray(rows) && filteredNow.length === rows.length) {
          const afterLocal = rows.filter(r => !(String(r.idRekapCustom) === idRekapActive && String((r as any).idSpk || '') === idSpkActive));
          if (afterLocal.length !== rows.length) {
            console.log('handleSelesaiDesain local remove applied');
            setRows(afterLocal);
          }
        }
      } catch (err) {
        console.error('local remove fallback error', err);
      }
      if (matched > 0) {
        setSnack({ open: true, message: 'Desain diselesaikan dan dihapus dari antrian', severity: 'success' });
      } else {
        setSnack({ open: true, message: 'Item tidak ditemukan di antrian, cek ID Rekap/ID SPK', severity: 'error' });
      }
      handleClose();
      console.log('handleSelesaiDesain done');
    } finally {
      setSaving(false);
    }
  };

  const exportWorksheetPdf = () => {
    if (!active) return;
    const doc = new jsPDF();
    doc.text('Divisi Desainer Pra Produksi', 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [['Field', 'Value']],
      body: [
        ['ID Rekap Custom', active.idRekapCustom],
        ['ID Custom', active.idCustom],
        ['Nama Desain', active.namaDesain],
        ['Jenis Produk', active.jenisProduk],
        ['Jenis Pola', active.jenisPola],
        ['Tanggal Input', active.tanggalInput],
        ['Nama CS', active.namaCS],
        ['Status', status],
        ['Link Drive Input CS', ws?.linkDriveInputCS || '-'],
        ['Link Drive Asset Jadi', ws?.linkDriveAssetJadi || '-'],
        ['Catatan', catatan || '-'],
      ]
    });
    doc.save(`worksheet-${active.idRekapCustom}.pdf`);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '100%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Divisi Desainer Pra Produksi - Antrian Pengerjaan Desain</Typography>
        <TableExportToolbar title="Antrian Pengerjaan Desain (Pra Produksi)" tableRef={tableRef} fileBaseName="pra-produksi-antrian-pengerjaan-desain" />
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1300 }} aria-label="pra-produksi-antrian" ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID Rekap Custom</TableCell>
                <TableCell>ID Custom</TableCell>
                <TableCell>Nama Desain</TableCell>
                <TableCell>Jenis Produk</TableCell>
                <TableCell>Jenis Pola</TableCell>
                <TableCell>Tanggal Input Desain</TableCell>
                <TableCell>Nama CS</TableCell>
                <TableCell align="center">Lihat Asset</TableCell>
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
                  <TableCell align="center">
                    <IconButton aria-label="Lihat asset input CS" onClick={() => setCsPreview({ open: true, item: row })}>
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" onClick={() => handleKerjakan(row.idRekapCustom, row.idSpk)}>Kerjakan</Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">Tidak ada antrian</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* Full-screen Divisi Dialog */}
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { pointerEvents: 'auto' } }}
      >
        <AppBar sx={{ position: 'relative', zIndex: (theme) => theme.zIndex.modal + 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Divisi Desainer Pra Produksi
            </Typography>
            <Button autoFocus color="inherit" onClick={handleSaveWorksheet} variant="outlined">
              Simpan
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3, pointerEvents: 'auto', position: 'relative' }}>
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
                  <MenuItem value="Menunggu dikerjakan">Menunggu dikerjakan</MenuItem>
                  <MenuItem value="Sedang dikerjakan">Sedang dikerjakan</MenuItem>
                  <MenuItem value="Selesai">Selesai</MenuItem>
                </TextField>
              </Box>
              {/* Worksheet sections as per sketch */}
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
                  { key: 'cdr', label: 'FILE CDR (COREL DRAW)' },
                ].map((sec) => (
                  <Box key={sec.key} sx={{ minWidth: 0 }}>
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>{sec.label}</Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <Button variant="outlined" component="label" size="small">
                          Upload
                          <input type="file" accept={sec.key === 'cdr' ? '.cdr,application/octet-stream,application/x-coreldraw' : 'image/*'} hidden onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const dataUrl = reader.result as string;
                              if (sec.key === 'mockup') {
                                const thumb = await downscaleImage(dataUrl, 700, 0.78);
                                setWs((prev) => prev ? ({ ...prev, mockup: { ...(prev.mockup as AssetBlock), file: thumb } }) : prev);
                                // Simpan ke map thumbnail agar tetap bisa dipreview di Antrian Pengerjaan
                                try {
                                  if (active?.queueId && thumb) {
                                    const mapKey = 'mockup_thumb_map';
                                    const rawMap = localStorage.getItem(mapKey);
                                    const thumbMap = rawMap ? JSON.parse(rawMap) : {};
                                    thumbMap[active.queueId] = thumb;
                                    localStorage.setItem(mapKey, JSON.stringify(thumbMap));
                                  }
                                } catch { }
                              } else if (sec.key === 'cdr') {
                                setWs((prev) => prev ? ({ ...prev, cdr: { file: dataUrl, filename: file.name } }) : prev);
                              } else {
                                setWs((prev) => prev ? ({ ...prev, [sec.key]: { ...prev[sec.key as keyof Worksheet] as AssetBlock, file: dataUrl } }) : prev);
                              }
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </Button>
                        {ws && sec.key !== 'cdr' && (ws[sec.key as keyof Worksheet] as AssetBlock)?.file && (
                          <img src={(ws[sec.key as keyof Worksheet] as AssetBlock).file as string} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                        )}
                        {ws && sec.key === 'cdr' && ws.cdr?.file && (
                          <Chip size="small" label={ws.cdr?.filename || 'file.cdr'} />
                        )}
                        {sec.key === 'mockup' && errors?.mockup && (
                          <Chip color="error" size="small" label={errors.mockup} />
                        )}
                      </Stack>
                      {sec.key !== 'cdr' && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1 }}>
                          <TextField fullWidth size="small" label="UKURAN" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).ukuran : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), ukuran: e.target.value } }) : prev)} />
                          <TextField fullWidth size="small" label="JARAK" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).jarak : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), jarak: e.target.value } }) : prev)} />
                          <TextField fullWidth size="small" label="KETERANGAN" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).keterangan : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), keterangan: e.target.value } }) : prev)} />
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
                <TextField fullWidth size="small" label="LINK DRIVE INPUT CS" value={ws?.linkDriveInputCS || ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, linkDriveInputCS: e.target.value }) : prev)} />
                <Box>
                  <TextField fullWidth size="small" label="LINK DRIVE ASSET JADI" value={ws?.linkDriveAssetJadi || ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, linkDriveAssetJadi: e.target.value }) : prev)} />
                  {errors?.links && <Typography variant="caption" color="error">{errors.links}</Typography>}
                </Box>
              </Box>

              <TextField sx={{ mt: 2 }} label="Catatan" multiline rows={4} fullWidth value={catatan} onChange={(e) => setCatatan(e.target.value)} />

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
                <Button type="button" variant="outlined" color="primary" onClick={exportWorksheetPdf}>Export PDF</Button>
                <Button
                  type="button"
                  variant="contained"
                  color="success"
                  id="btn-selesai-desain"
                  aria-label="Selesai Desain"
                  sx={{ pointerEvents: 'auto', cursor: saving ? 'not-allowed' : 'pointer' }}
                  disabled={saving}
                  onClick={() => { console.log('Selesai Desain clicked'); handleSelesaiDesain(); }}
                >
                  Selesai Desain
                </Button>
              </Box>

            </>
          )}
        </Box>
      </Dialog>
      {/* Popup preview untuk Asset yang diupload CS saat Input Desain */}
      <Dialog open={!!csPreview?.open} onClose={() => setCsPreview({ open: false })} maxWidth="lg" fullWidth>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 700 }}>
            Asset Input CS{csPreview?.item?.namaDesain ? ` - ${csPreview.item.namaDesain}` : ''}
          </Typography>
          {csPreview?.item?.assets && csPreview.item.assets.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {csPreview.item.assets.map((a, idx) => (
                <Box key={idx} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{a.attribute || 'Asset'}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, background: '#fafafa', border: '1px dashed #e0e0e0', borderRadius: 1 }}>
                    {a.file ? (
                      <img src={a.file} alt={a.attribute} style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain' }} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">Tidak ada gambar</Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1, mt: 1 }}>
                    <TextField size="small" label="Ukuran" value={a.size || ''} InputProps={{ readOnly: true }} />
                    <TextField size="small" label="Jarak" value={a.distance || ''} InputProps={{ readOnly: true }} />
                    <TextField size="small" label="Keterangan" value={a.description || ''} InputProps={{ readOnly: true }} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography align="center" color="text.secondary">Tidak ada asset dari CS</Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button onClick={() => setCsPreview({ open: false })} variant="contained">Tutup</Button>
          </Box>
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
