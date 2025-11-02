import { Box, Button, Grid, Typography, TextField, Select, MenuItem, Modal, TableHead, TableContainer, Table, TableCell, TableRow, TableBody, Paper, FormControl, InputLabel, Snackbar, Alert } from '@mui/material'
import { useRef } from 'react'
import TableExportToolbar from '../../../../components/TableExportToolbar'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import kvStore from '../../../../lib/kvStore';

interface Asset {
  file: string | null // Data URL for the file
  attribute: string
  size: string
  distance: string
  description: string
}

export default function DetailTambahan() {
  const tableRef = useRef<HTMLTableElement | null>(null)
  const navigate = useNavigate();

  const [bottomStrap, setBottomStrap] = useState('')
  const [armStrap, setArmStrap] = useState('')
  const [bottomTire, setBottomTire] = useState('')
  const [skoder, setSkoder] = useState('')
  const [pocketVariant, setPocketVariant] = useState('')
  const [reflector, setReflector] = useState('')
  const [colorReflector, setColorReflector] = useState('')
  const [ventilation, setVentilation] = useState('')
  const [jahitanVentilasiHorz, setJahitanVentilasiHorz] = useState('')
  const [penHolder, setPenHolder] = useState('')
  const [catTongue, setCatTongue] = useState('')
  const [lanyardHolder, setLanyardHolder] = useState('')
  const [HThanger, setHTHanger] = useState('')
  const [options] = useState<Record<string, Array<{ value: string; label: string }>>>({})
  // Tambahan: Link Asset Desain & Catatan
  const [assetLink, setAssetLink] = useState('')
  const [catatan, setCatatan] = useState('')
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

  // Load and persist tambahan form so it survives navigation and can be used by Print SPK
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await kvStore.get('inputTambahanForm');
        const d = raw && typeof raw === 'object' ? raw : (raw ? JSON.parse(String(raw)) : null);
        if (!d) throw new Error('no-kv');
        if (mounted) {
          setBottomStrap(d.bottomStrap || '');
          setArmStrap(d.armStrap || '');
          setBottomTire(d.bottomTire || '');
          setSkoder(d.skoder || '');
          setPocketVariant(d.pocketVariant || '');
          setReflector(d.reflector || '');
          setColorReflector(d.colorReflector || '');
          setVentilation(d.ventilation || '');
          setJahitanVentilasiHorz(d.jahitanVentilasiHorz || '');
          setPenHolder(d.penHolder || '');
          setCatTongue(d.catTongue || '');
          setLanyardHolder(d.lanyardHolder || '');
          setHTHanger(d.HThanger || '');
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);
    // (dropdown enums loading removed — kept options placeholder)

  useEffect(() => {
    const save = async () => {
      try {
        const data = {
          bottomStrap, armStrap, bottomTire, skoder, pocketVariant, reflector, colorReflector, ventilation, jahitanVentilasiHorz, penHolder, catTongue, lanyardHolder, HThanger,
          // Store labels for printing
          bottomStrapLabel: (options['tali_bawah'] || []).find(o => o.value === bottomStrap)?.label || bottomStrap,
          armStrapLabel: (options['tali_lengan'] || []).find(o => o.value === armStrap)?.label || armStrap,
          bottomTireLabel: (options['ban_bawah'] || []).find(o => o.value === bottomTire)?.label || bottomTire,
          skoderLabel: (options['skoder'] || []).find(o => o.value === skoder)?.label || skoder,
          pocketVariantLabel: (options['varian_saku'] || []).find(o => o.value === pocketVariant)?.label || pocketVariant,
          reflectorLabel: reflector,
          colorReflectorLabel: (options['warna_list_reflektor'] || []).find(o => o.value === colorReflector)?.label || colorReflector,
          ventilationLabel: (options['ventilasi'] || []).find(o => o.value === ventilation)?.label || ventilation,
          penHolderLabel: (options['tempat_pulpen'] || []).find(o => o.value === penHolder)?.label || penHolder,
          catTongueLabel: (options['lidah_kucing'] || []).find(o => o.value === catTongue)?.label || catTongue,
          lanyardHolderLabel: (options['tempat_lanyard'] || []).find(o => o.value === lanyardHolder)?.label || lanyardHolder,
          HThangerLabel: (options['gantungan_ht'] || []).find(o => o.value === HThanger)?.label || HThanger,
        };
        await kvStore.set('inputTambahanForm', data);
      } catch {}
    };
    save();
  }, [bottomStrap, armStrap, bottomTire, skoder, pocketVariant, reflector, colorReflector, ventilation, penHolder, catTongue, lanyardHolder, HThanger, jahitanVentilasiHorz, options]);

  // Modal state
  const [addAssets, setAddAssets] = useState(false);
  const [editAssetIndex, setEditAssetIndex] = useState<number | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newAsset, setNewAsset] = useState<Asset>({
    file: null,
    attribute: '',
    size: '',
    distance: '',
    description: '',
  });
  const [editAsset, setEditAsset] = useState<Asset>({
    file: null,
    attribute: '',
    size: '',
    distance: '',
    description: '',
  });

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAsset({ ...newAsset, file: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAsset({ ...editAsset, file: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };


  const handleDeleteAsset = (index: number) => {
    const asset = assets[index];
    if (asset) {
      setAssets(assets.filter((_, i) => i !== index));
    }
  };

  const handleEditAsset = (index: number) => {
    setEditAssetIndex(index);
    setEditAsset(assets[index]);
  };

  const handleSaveEditAsset = () => {
    if (editAssetIndex !== null) {
      const updatedAssets = [...assets];
      updatedAssets[editAssetIndex] = editAsset;
      setAssets(updatedAssets);
      setEditAssetIndex(null);
    }
  };

  // Handle saving new asset
  const handleSaveAsset = () => {
    if (newAsset.size && newAsset.distance && newAsset.description) {
      setAssets([...assets, newAsset]);
      setNewAsset({ file: null, attribute: '', size: '', distance: '', description: '' });
      setAddAssets(false);
    } else {
      alert('Please fill in all required fields.');
    }
  };

  // Finalize Input Desain -> push to design queue (kvStore first, localStorage fallback)
  const handleSubmitToQueue = async () => {
    try {
      // Load working form from kvStore
      let form: any = {};
      try {
        const raw = await kvStore.get('inputDetailForm');
        form = raw && typeof raw === 'object' ? raw : (raw ? JSON.parse(String(raw)) : {});
      } catch {}

      // Load SPK context
      let spkCtx: any = null;
  try { const r = await kvStore.get('current_spk_context'); spkCtx = r && typeof r === 'object' ? r : (r ? JSON.parse(String(r)) : null); } catch {}

      const sanitizeQty = (val: any): string => {
        const n = Number(String(val ?? '').toString().replace(/[^\d-]/g, ''));
        return !isNaN(n) && n > 0 ? String(n) : '0';
      };

      // Helpers that persist counters into kvStore only
      const nextCustomId = async (): Promise<string> => {
        const key = 'custom_auto_seq';
        try {
          const raw = await kvStore.get(key);
          let seq = Number.isFinite(Number(raw)) ? parseInt(String(raw), 10) : NaN;
          if (!Number.isFinite(seq) || seq < 5000000) seq = 5000000;
          seq += 1;
          await kvStore.set(key, String(seq));
          return String(seq).padStart(7, '0');
        } catch { return String(5000001).padStart(7, '0'); }
      };

      const nextRekapIdForToday = async (): Promise<string> => {
        const today = new Date().toISOString().slice(0, 10);
        const dateKey = 'rekap_auto_date';
        const idKey = 'rekap_auto_id';
        const seqKey = 'rekap_auto_seq';
        try {
          const curDate = (await kvStore.get(dateKey)) || '';
          if (curDate === today) {
            const existing = await kvStore.get(idKey);
            if (existing && /^\d{7}$/.test(String(existing))) return String(existing);
          }
          const rawSeq = await kvStore.get(seqKey);
          let seq = Number.isFinite(Number(rawSeq)) ? parseInt(String(rawSeq), 10) : 9000000;
          if (!Number.isFinite(seq) || seq < 9000000) seq = 9000000;
          seq += 1;
          const id = String(seq).padStart(7, '0');
          await kvStore.set(seqKey, String(seq));
          await kvStore.set(dateKey, today);
          await kvStore.set(idKey, id);
          return id;
        } catch { return String(9000001).padStart(7, '0'); }
      };

      const spkId = spkCtx?.idSpk || '';
      if (!spkId) {
        alert('ID SPK tidak ditemukan. Silakan pilih pesanan dari Antrian Input Desain terlebih dahulu.');
        return;
      }
      const spkQty = sanitizeQty(spkCtx?.quantity);
      // Generate IDs as requested
      const idRekapCustom = await nextRekapIdForToday(); // 7-digit, start 9000001, one per day
      const idCustom = await nextCustomId(); // 7-digit, start 5000001
      const item = {
        queueId: (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`,
        idRekapCustom,
        idCustom,
        idSpk: spkId,
        spkQuantity: spkQty,
        namaDesain: form.nameDesign || 'Desain Baru',
        jenisProduk: form.product || '-',
        jenisPola: form.pattern || '-',
        tanggalInput: new Date().toISOString().slice(0, 10),
        namaCS: 'CS Marketing',
        assetLink: assetLink || '',
        catatan: catatan || '',
        assets: assets.map(a => ({ file: a.file, attribute: a.attribute, size: a.size, distance: a.distance, description: a.description })),
        status: 'Menunggu dikerjakan'
      };

      // push into design_queue (kvStore only)
      try {
        const rawQueue = await kvStore.get('design_queue') || [];
        const list = Array.isArray(rawQueue) ? rawQueue : (typeof rawQueue === 'string' ? JSON.parse(rawQueue) : []);
        list.push(item);
        await kvStore.set('design_queue', list);
      } catch {}

      // Snapshot order and design details keyed by idSpk for Print SPK usage
      try {
        // 1) Persist original order (from antrian_input_desain)
        try {
          const qRaw2 = await kvStore.get('antrian_input_desain') || [];
          const qList2 = Array.isArray(qRaw2) ? qRaw2 : (typeof qRaw2 === 'string' ? JSON.parse(qRaw2) : []);
          const original = qList2.find((q: any) => String(q?.idSpk || '') === String(spkId));
          if (original) {
            const orderRaw = await kvStore.get('spk_orders') || {};
            const orderMap = orderRaw && typeof orderRaw === 'object' ? (orderRaw as any) : (typeof orderRaw === 'string' ? JSON.parse(orderRaw as any) : {});
            (orderMap as any)[String(spkId)] = original;
            await kvStore.set('spk_orders', orderMap);
          }
        } catch {}

        // 2) Persist design form snapshot keyed by idSpk
        try {
          const designRaw = await kvStore.get('spk_design') || {};
          const designMap = designRaw && typeof designRaw === 'object' ? designRaw : (typeof designRaw === 'string' ? JSON.parse(designRaw) : {});
          let produkForm: any = {};
          try { const pf = await kvStore.get('inputProdukForm'); produkForm = pf && typeof pf === 'object' ? pf : (pf ? JSON.parse(String(pf)) : {}); } catch { produkForm = {}; }
          let tambahanForm: any = {};
          try { const tf = await kvStore.get('inputTambahanForm'); tambahanForm = tf && typeof tf === 'object' ? tf : (tf ? JSON.parse(String(tf)) : {}); } catch { tambahanForm = {}; }
          (designMap as any)[String(spkId)] = { ...form, ...produkForm, ...tambahanForm, assets, assetLink, catatan };
          await kvStore.set('spk_design', designMap);
        } catch {}
      } catch { }

      // Remove this SPK from Antrian Input Desain
      try {
        const qRaw = await kvStore.get('antrian_input_desain') || [];
        const qList = Array.isArray(qRaw) ? qRaw : (typeof qRaw === 'string' ? JSON.parse(qRaw) : []);
        const filtered = qList.filter((q: any) => String(q?.idSpk || '') !== String(spkId));
        await kvStore.set('antrian_input_desain', filtered);
      } catch {}

      // Clear current context to avoid accidental reuse
  try { await kvStore.set('current_spk_context', null); } catch {}

      // Tambahkan ke database_trend (via Input Desain) with quantity from SPK
      try {
  let trendList: any[] = [];
  try { const tr = await kvStore.get('database_trend'); trendList = Array.isArray(tr) ? tr : (tr ? JSON.parse(String(tr)) : []); } catch { trendList = []; }
        const today = new Date().toISOString().slice(0, 10);
        const jenisProduk = form.product || '-';
        const jenisPola = form.pattern || '-';
        // Determine quantity from SPK context or queue
        const sanitizeQty2 = (val: any): string => { const n = Number(String(val ?? '').toString().replace(/[^\d-]/g, '')); return !isNaN(n) && n > 0 ? String(n) : ''; };
        let qtyStr = sanitizeQty2(spkCtx?.quantity);
        if (!qtyStr) {
          try {
            const queueRaw = await kvStore.get('antrian_input_desain') || [];
            const queue = Array.isArray(queueRaw) ? queueRaw : (typeof queueRaw === 'string' ? JSON.parse(queueRaw) : []);
            const found = spkCtx?.idSpk ? queue.find((q: any) => q?.idSpk === spkCtx.idSpk) : null;
            qtyStr = sanitizeQty2(found?.quantity);
            if (!qtyStr && found?.items) qtyStr = sanitizeQty2(found.items.length);
          } catch {}
        }
        if (!qtyStr) qtyStr = '0';
        trendList.push({ jenis_produk: jenisProduk, jenis_pola: jenisPola, quantity: qtyStr, updatedAt: today, idSpk: spkCtx?.idSpk });
  try { await kvStore.set('database_trend', trendList); } catch {}
      } catch { }

      setSnack({ open: true, message: `Input desain tersimpan (Rekap: ${idRekapCustom}). Mengarahkan ke Antrian Input Desain…`, severity: 'success' });
      // Optionally clear draft form // localStorage.removeItem('inputDetailForm');
      setTimeout(() => navigate('/market/input-desain/antrian-input'), 600);
    } catch (e) {
      setSnack({ open: true, message: 'Gagal menyimpan ke antrian desain.', severity: 'error' });
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      maxHeight: 'calc(100vh - 64px)',
      overflowY: 'auto',
      // alignItem: 'center',
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
        mb: 3
      }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Detail Tambahan</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'stretch', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: 1,
                width: '100%',
              }}>
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Tali Bawah :</Typography>
              <Select labelId='product-select-label' size='small' value={bottomStrap} onChange={(e) => setBottomStrap(e.target.value)}>
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
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Tali Lengan :</Typography>
              <Select labelId='sample-select-label' size='small' value={armStrap} onChange={(e) => setArmStrap(e.target.value)}>
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
              }}>
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Ban Bawah :</Typography>
              <Select labelId='product-select-label' size='small' value={bottomTire} onChange={(e) => setBottomTire(e.target.value)}>
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
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Skoder :</Typography>
              <Select labelId='pattern-select-label' size='small' value={skoder} onChange={(e) => setSkoder(e.target.value)}>
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
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Varian Saku :</Typography>
              <Select labelId='fabric-select-label' size='small' value={pocketVariant} onChange={(e) => setPocketVariant(e.target.value)}>
                <MenuItem value='TIDAK'>Tidak</MenuItem>
                <MenuItem value='STANDAR POLA'>Standar Pola</MenuItem>
                <MenuItem value='TEMPEL - VRS POLOS'>Tempel - VRS Polos</MenuItem>
                <MenuItem value='TEMPEL - VRS HIDUP'>Tempel - VRS Hidup</MenuItem>
                <MenuItem value='TEMPEL - VRS MATI'>Tempel - VRS Mati</MenuItem>
                <MenuItem value='DALAM'>Dalam</MenuItem>
                <MenuItem value='GEMBUNG'>Gembung</MenuItem>
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
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Jenis Reflektor :</Typography>
              <Select labelId='fabric-select-label' size='small' value={reflector} onChange={(e) => setReflector(e.target.value)}>
                <MenuItem value='5 JADI'>5 Jadi</MenuItem>
                <MenuItem value='5 BIKIN'>5 Bikin</MenuItem>
                <MenuItem value='LIST CPT 0.5 + 5'>List CPT 0.5 + 5</MenuItem>
                <MenuItem value='2,5 JADI'>2,5 Jadi</MenuItem>
                <MenuItem value='2,5 BIKIN'>2,5 Bikin</MenuItem>
                <MenuItem value='7 POLOS'>7 Polos</MenuItem>
                <MenuItem value='7 BIKIN'>7 Bikin</MenuItem>
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
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Warna List Reflektor :</Typography>
              <Select labelId='product-select-label' size='small' value={colorReflector} onChange={(e) => setColorReflector(e.target.value)}>
                <MenuItem value='TIDAK'>Tidak</MenuItem>
                <MenuItem value='HIJAU STABILO'>Hijau Stabilo</MenuItem>
                <MenuItem value='KUNING STABILO'>Kuning Stabilo</MenuItem>
                <MenuItem value='ORANGE STABILO'>Orange Stabilo</MenuItem>
                <MenuItem value='MERAH'>Merah</MenuItem>
                <MenuItem value='BIRU'>Biru</MenuItem>
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
              <Typography variant='body1' sx={{ minWidth: 180 }}>Ventilasi :</Typography>
              <Select labelId='product-select-label' size='small' value={ventilation} onChange={(e) => setVentilation(e.target.value)}>
                <MenuItem value='TIDAK'>Tidak</MenuItem>
                <MenuItem value='VERTIKAL TEMPEL'>Vertikal Tembus</MenuItem>
                <MenuItem value='VERTIKAL TIDAK TEMBUS'>Vertikal Tidak Tembus</MenuItem>
                <MenuItem value='HORIZONTAL'>Horizontal</MenuItem>
                <MenuItem value='VERTIKAL KETIAK'>Vertikal Ketiak</MenuItem>
                <MenuItem value='HORIZONTAL KETIAK'>Horizontal Ketiak</MenuItem>
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
              {/* belum beres */}
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Jahitan Ventilasi Horz :</Typography>
              <Select labelId='product-select-label' size='small' value={jahitanVentilasiHorz} onChange={(e) => setJahitanVentilasiHorz(e.target.value)}>
                <MenuItem value='2 TITIK'>2 Titik</MenuItem>
                <MenuItem value='3 TITIK'>3 Titik</MenuItem>
                <MenuItem value='JAHIT TENGAH'>Jahit Tengah</MenuItem>
                <MenuItem value='4 TITIK (SUDUT + TENGAH 2)'>4 Titik (Sudut + Tengah 2)</MenuItem>
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
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Tempat Pulpen :</Typography>
              <Select labelId='product-select-label' size='small' value={penHolder} onChange={(e) => setPenHolder(e.target.value)}>
                <MenuItem value='POJOK SAKU KANAN'>Pojok Saku Kanan</MenuItem>
                <MenuItem value='SAKU KANAN (TENGAH)'>Saku Kanan (Tengah)</MenuItem>
                <MenuItem value='POJOK SAKU KIRI'>Pojok Saku Kiri</MenuItem>
                <MenuItem value='SAKU KIRI (TENGAH)'>Saku Kiri (Tengah)</MenuItem>
                <MenuItem value='LENGAN KANAN'>Lengan Kanan</MenuItem>
                <MenuItem value='LENGAN KIRI'>Lengan Kiri</MenuItem>
                <MenuItem value='KOMBINASI'>Kombinasi</MenuItem>
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
                width: '100%',
                gap: 1,
              }}>
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Lidah Kucing :</Typography>
              <Select labelId='product-select-label' size='small' value={catTongue} onChange={(e) => setCatTongue(e.target.value)}>
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
                width: '100%',
                gap: 1,
              }}>
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Tempat Lanyard :</Typography>
              <Select labelId='product-select-label' size='small' value={lanyardHolder} onChange={(e) => setLanyardHolder(e.target.value)}>
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
                width: '100%',
                gap: 1,
              }}>
              <Typography variant='body1' sx={{ minWidth: { xs: 'auto', md: 180 } }}>Gantungan HT :</Typography>
              <Select labelId='product-select-label' size='small' value={HThanger} onChange={(e) => setHTHanger(e.target.value)}>
                <MenuItem value='TIDAK'>Tidak</MenuItem>
                <MenuItem value='DADA KIRI'>Dada Kiri</MenuItem>
                <MenuItem value='DADA KANAN'>Dada Kanan</MenuItem>
                <MenuItem value='LENGAN KIRI'>Lengan Kiri</MenuItem>
                <MenuItem value='LENGAN KANAN'>Lengan Kanan</MenuItem>
              </Select>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Atribut */}
      <Box sx={{
        width: '100%',
        height: '500',
        borderRadius: 2,
        boxShadow: 2,
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'column',
        p: 3,
        mb: 3
      }}>
        <Typography variant='body1' sx={{ mb: 1, fontWeight: 'bold' }} >Atribut</Typography>
        <Button variant='outlined' onClick={() => setAddAssets(true)}>Tambahkan</Button>
        {assets.length > 0 ? (<>
          <TableExportToolbar title='Atribut Desain' tableRef={tableRef} fileBaseName='atribut-desain' />
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="assets table" ref={tableRef}>
              <TableHead>
                <TableRow>
                  <TableCell>Preview</TableCell>
                  <TableCell>Bagian Atribut</TableCell>
                  <TableCell>Ukuran</TableCell>
                  <TableCell>Jarak</TableCell>
                  <TableCell>Keterangan</TableCell>
                  <TableCell>Edit</TableCell>
                  <TableCell>Hapus</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((asset, index) => (
                  <TableRow key={index}>
                    {/* preview image */}
                    <TableCell>
                      {asset.file ? (
                        <img src={asset.file} style={{ maxWidth: '100px', maxHeight: '100px' }} />
                      ) : (
                        'No Image'
                      )}
                    </TableCell>
                    <TableCell>{asset.attribute}</TableCell>
                    <TableCell>{asset.size}</TableCell>
                    <TableCell>{asset.distance}</TableCell>
                    <TableCell>{asset.description}</TableCell>
                    <TableCell><Button onClick={() => handleEditAsset(index)}><EditIcon /></Button></TableCell>
                    <TableCell><Button color="error" onClick={() => handleDeleteAsset(index)}>Hapus</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer></>) : (<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Belum ada aset ditambahkan.
          </Typography>)}
        <Modal
          open={addAssets}
          onClose={() => setAddAssets(false)}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 5,
              borderRadius: 2,
              boxShadow: 24,
              maxHeight: 650,
              maxWidth: 800,
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Tambah File
            </Typography>
            <Grid container spacing={2}>
              <Grid size={3}>
                <Button variant="outlined" component="label" fullWidth size='medium'>
                  Upload File
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
                {newAsset.file && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={newAsset.file}
                      alt="Preview"
                      style={{ maxWidth: '100px', maxHeight: '100px' }}
                    />
                  </Box>
                )}
              </Grid>
              <Grid size={3}>
                <FormControl sx={{ minWidth: 160 }} size='small'>
                  <InputLabel id='atribut'> Bagian Atribut
                  </InputLabel>
                  <Select
                    labelId='bagian-atribut'
                    id='bagian-attribut'
                    value={newAsset.attribute}
                    onChange={(e) => setNewAsset({ ...newAsset, attribute: e.target.value })}>
                    <MenuItem value=''>Pilih Bagian Atribut</MenuItem>
                    <MenuItem value='DADA KANAN'>Dada Kanan</MenuItem>
                    <MenuItem value='DADA KIRI'>Dada Kiri</MenuItem>
                    <MenuItem value='LENGAN KANAN'>Lengan Kanan</MenuItem>
                    <MenuItem value='LENGAN KIRI'>Lengan Kiri</MenuItem>
                    <MenuItem value='BELAKANG'>Belakang</MenuItem>
                    <MenuItem value='TAMBAHAN'>Tambahan</MenuItem>
                    <MenuItem value='REFERENSI'>Referensi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Ukuran"
                  value={newAsset.size}
                  onChange={(e) => setNewAsset({ ...newAsset, size: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Jarak"
                  value={newAsset.distance}
                  onChange={(e) => setNewAsset({ ...newAsset, distance: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Keterangan"
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  multiline
                  rows={1}
                  required
                />
              </Grid>
              <Grid size={3}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={() => setAddAssets(false)}>
                    Batal
                  </Button>
                  <Button variant="contained" onClick={handleSaveAsset}>
                    Simpan
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Modal>

        <Modal
          open={editAssetIndex !== null}
          onClose={() => setEditAssetIndex(null)}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 5,
              borderRadius: 2,
              boxShadow: 24,
              maxHeight: 600,
              maxWidth: 800,
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Edit File
            </Typography>
            <Grid container spacing={2}>
              <Grid size={3}>
                <Button variant="outlined" component="label" fullWidth size='small'>
                  Upload File
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleEditFileChange}
                  />
                </Button>
                {editAsset.file && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={editAsset.file}
                      alt="Preview"
                      style={{ maxWidth: '100px', maxHeight: '100px' }}
                    />
                  </Box>
                )}
              </Grid>
              <Grid size={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Ukuran"
                  value={editAsset.size}
                  onChange={(e) => setEditAsset({ ...editAsset, size: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Jarak"
                  value={editAsset.distance}
                  onChange={(e) => setEditAsset({ ...editAsset, distance: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Keterangan"
                  value={editAsset.description}
                  onChange={(e) => setEditAsset({ ...editAsset, description: e.target.value })}
                  multiline
                  rows={1}
                  required
                />
              </Grid>
              <Grid size={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button variant="outlined" onClick={() => setEditAssetIndex(null)}>
                    Batal
                  </Button>
                  <Button variant="contained" onClick={handleSaveEditAsset}>
                    Simpan Perubahan
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Modal>
      </Box>

      {/* Link Asset Desain & Catatan */}
      <Box sx={{
        width: '100%',
        height: '500',
        borderRadius: 2,
        boxShadow: 2,
        flexDirection: 'column',
        p: 3,
      }}>
        <Typography variant='body1' sx={{ mb: 1, fontWeight: 'bold' }} >Link Asset Desain</Typography>
        <TextField
          fullWidth
          variant='outlined'
          size='small'
          placeholder='https://drive.google.com/… atau URL lain'
          value={assetLink}
          onChange={(e) => setAssetLink(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Typography variant='body1' sx={{ mb: 1, fontWeight: 'bold' }} >Catatan</Typography>
        <TextField
          fullWidth
          variant='outlined'
          size='small'
          multiline
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </Box>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        mt: 2,
      }}>
        <Button variant='contained' size='medium' sx={{ mr: 65 }} onClick={() => navigate('/market/input-desain/input-detail')}>Kembali</Button>
        <Button variant='contained' size='medium' color='primary' onClick={handleSubmitToQueue}>Simpan & Kirim ke Antrian</Button>

      </Box>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}