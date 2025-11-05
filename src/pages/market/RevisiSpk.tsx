import { Alert, Box, Button, Grid, Paper, Select, MenuItem, Snackbar, Stack, TextField, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import kvStore from '../../lib/kvStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

type AnyRec = Record<string, any>;

const LS_KEY = 'spk_design';
const ORDER_SNAP_KEY = 'spk_orders';
const INPUT_QUEUE_KEY = 'antrian_input_desain';

// Helpers: async accessors for snapshots
async function loadDesignSnapshotAsync(idSpk: string): Promise<AnyRec | null> {
  try {
    const raw = await kvStore.get(LS_KEY);
    const map = raw && typeof raw === 'object' ? raw : (typeof raw === 'string' ? JSON.parse(raw) : {});
    const snap = map?.[idSpk] || null;
    if (snap && typeof snap === 'object') return snap;
  } catch { return null; }
  return null;
}

async function saveDesignSnapshotAsync(idSpk: string, patch: AnyRec) {
  try {
    const raw = await kvStore.get(LS_KEY) || {};
    const map = raw && typeof raw === 'object' ? raw : (typeof raw === 'string' ? JSON.parse(raw) : {});
    const prev = map?.[idSpk] || {};
    map[idSpk] = { ...prev, ...patch };
    await kvStore.set(LS_KEY, map);
    return true;
  } catch { return false; }
}

export default function RevisiSpk() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

  const [idInput, setIdInput] = useState<string>(() => params.get('idSpk') || '');
  const idSpk = useMemo(() => (idInput || '').trim(), [idInput]);

  // Spesifikasi Desain
  const [nameDesign, setNameDesign] = useState('');
  const [sample, setSample] = useState('');
  const [product, setProduct] = useState('');
  const [pattern, setPattern] = useState('');
  const [fabric, setFabric] = useState('');
  const [fabricColor, setFabricColor] = useState('');
  const [colorCombination, setColorCombination] = useState('');
  const [codeColor, setCodeColor] = useState('');

  // Detail Produk
  const [application, setApplication] = useState('');
  const [bordir, setBordir] = useState('');
  const [sablon, setSablon] = useState('');
  const [jahitan, setJahitan] = useState('');
  const [hoodie, setHoodie] = useState('');
  const [cuttingButtom, setCuttingButtom] = useState('');
  const [sideSlit, setSideSlit] = useState('');
  const [neck, setNeck] = useState('');
  const [placard, setPlacard] = useState('');
  const [pocket, setPocket] = useState('');
  const [bottomPocket, setBottomPocket] = useState('');
  const [furingPocket, setFuringPocket] = useState('');
  const [armEnd, setArmEnd] = useState('');
  const [frontButton, setFrontButton] = useState('');

  // Detail Tambahan
  const [bottomStrap, setBottomStrap] = useState('');
  const [armStrap, setArmStrap] = useState('');
  const [bottomTire, setBottomTire] = useState('');
  const [skoder, setSkoder] = useState('');
  const [pocketVariant, setPocketVariant] = useState('');
  const [reflector, setReflector] = useState('');
  const [colorReflector, setColorReflector] = useState('');
  const [ventilation, setVentilation] = useState('');
  const [jahitanVentilasiHorz, setJahitanVentilasiHorz] = useState('');
  const [penHolder, setPenHolder] = useState('');
  const [catTongue, setCatTongue] = useState('');
  const [lanyardHolder, setLanyardHolder] = useState('');
  const [HThanger, setHTHanger] = useState('');

  // Lainnya
  const [assetLink, setAssetLink] = useState('');
  const [catatan, setCatatan] = useState('');

  // =========================
  // Editor: Input Pesanan-like
  // =========================
  type Province = { id: string; name: string };
  type Regency = { id: string; name: string; province_id: string };
  type District = { id: string; name: string; regency_id: string };
  type Village = { id: string; name: string; district_id: string };
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [province, setProvince] = useState('');
  const [regency, setRegency] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [namaPemesan, setNamaPemesan] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [content, setContent] = useState('');
  const [quantity, setQuantity] = useState('');
  const [size, setSize] = useState('');
  const [nameset, setNameset] = useState('');
  const [formatName, setFormatName] = useState('');
  type LineItem = { size: string; nama: string; formatNama: string };
  const [items, setItems] = useState<LineItem[]>([]);
  const [transaction, setTransaction] = useState('');
  const [nominal, setNominal] = useState('');
  const [proof, setProof] = useState<string | null>(null);

  // Auto-load snapshot when idSpk set
  const loadById = async (id: string) => {
    const snap = await loadDesignSnapshotAsync(id);
    if (!snap) {
      setSnack({ open: true, message: 'Snapshot desain belum ada untuk ID ini. Anda bisa mengisi baru lalu Simpan.', severity: 'info' });
      // reset design fields
      setNameDesign(''); setSample(''); setProduct(''); setPattern(''); setFabric(''); setFabricColor(''); setColorCombination(''); setCodeColor('');
      setApplication(''); setBordir(''); setSablon(''); setJahitan(''); setHoodie(''); setCuttingButtom(''); setSideSlit(''); setNeck(''); setPlacard(''); setPocket(''); setBottomPocket(''); setFuringPocket(''); setArmEnd(''); setFrontButton('');
      setBottomStrap(''); setArmStrap(''); setBottomTire(''); setSkoder(''); setPocketVariant(''); setReflector(''); setColorReflector(''); setVentilation(''); setJahitanVentilasiHorz(''); setPenHolder(''); setCatTongue(''); setLanyardHolder(''); setHTHanger('');
      setAssetLink(''); setCatatan('');
  } else {
      // Spesifikasi
      setNameDesign(snap.nameDesign || snap.namaDesain || '');
      setSample(snap.sample || '');
      setProduct(snap.product || snap.jenisProduk || '');
      setPattern(snap.pattern || snap.jenisPola || '');
      setFabric(snap.fabric || '');
      setFabricColor(snap.fabricColor || '');
      setColorCombination(snap.colorCombination || '');
      setCodeColor(snap.codeColor || '');
      // Detail Produk
      setApplication(snap.application || '');
      setBordir(snap.bordir || '');
      setSablon(snap.sablon || '');
      setJahitan(snap.jahitan || '');
      setHoodie(snap.hoodie || '');
      setCuttingButtom(snap.cuttingButtom || '');
      setSideSlit(snap.sideSlit || '');
      setNeck(snap.neck || '');
      setPlacard(snap.placard || '');
      setPocket(snap.pocket || '');
      setBottomPocket(snap.bottomPocket || '');
      setFuringPocket(snap.furingPocket || '');
      setArmEnd(snap.armEnd || '');
      setFrontButton(snap.frontButton || '');
      // Detail Tambahan
      setBottomStrap(snap.bottomStrap || '');
      setArmStrap(snap.armStrap || '');
      setBottomTire(snap.bottomTire || '');
      setSkoder(snap.skoder || '');
      setPocketVariant(snap.pocketVariant || '');
      setReflector(snap.reflector || '');
      setColorReflector(snap.colorReflector || '');
      setVentilation(snap.ventilation || snap.ventilasi || '');
      setJahitanVentilasiHorz(snap.jahitanVentilasiHorz || '');
      setPenHolder(snap.penHolder || snap.tempatPulpen || '');
      setCatTongue(snap.catTongue || snap.lidahKancing || '');
      setLanyardHolder(snap.lanyardHolder || snap.tempatLanyard || '');
      setHTHanger(snap.HThanger || snap.gantunganHt || '');
      // Lainnya
      setAssetLink(snap.assetLink || '');
      setCatatan(snap.catatan || '');
    }

    // Load order snapshot (spk_orders -> antrian_input_desain fallback)
    try {
      const orderRaw = await kvStore.get(ORDER_SNAP_KEY) || {};
      const orderMap = orderRaw && typeof orderRaw === 'object' ? orderRaw : (typeof orderRaw === 'string' ? JSON.parse(orderRaw) : {});
      let ord = orderMap?.[id] || null;
      if (!ord) {
        const qRaw = await kvStore.get(INPUT_QUEUE_KEY) || [];
        const qList = Array.isArray(qRaw) ? qRaw : (typeof qRaw === 'string' ? JSON.parse(qRaw) : []);
        ord = qList.find((r: AnyRec) => String(r?.idSpk || '') === String(id)) || null;
      }
      if (ord) {
        setNamaPemesan(ord.namaPemesan || '');
        setQuantity(ord.quantity || '');
        setTransaction(ord.tipeTransaksi || '');
        setAddress(ord.address || '');
        setNumber(ord.number || '');
        setContent(ord.content || '');
        setItems(Array.isArray(ord.items) ? ord.items : []);
        setNominal(ord.nominal || '');
        setProof(ord.proof || null);
        const w = ord.wilayah || {};
        setProvince(w.province || '');
        setRegency(w.regency || '');
        setDistrict(w.district || '');
        setVillage(w.village || '');
      } else {
        // reset order fields
        setNamaPemesan(''); setQuantity(''); setTransaction(''); setAddress(''); setNumber(''); setContent(''); setItems([]); setNominal(''); setProof(null);
        setProvince(''); setRegency(''); setDistrict(''); setVillage('');
      }
    } catch {}
  };

  useEffect(() => {
    const q = params.get('idSpk') || '';
    if (q) { setIdInput(q); (async () => { await loadById(q); })(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Load wilayah options and cascade loaders like InputPesanan
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const data = await res.json();
        setProvinces(data || []);
      } catch { setProvinces([]); }
    })();
  }, []);
  useEffect(() => {
    if (!province) { setRegencies([]); setRegency(''); return; }
    const p = provinces.find((x) => x.name === province);
    if (!p) { setRegencies([]); setRegency(''); return; }
    (async () => {
      try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${p.id}.json`);
        const data = await res.json();
        setRegencies(data || []);
      } catch { setRegencies([]); }
    })();
  }, [province, provinces]);
  useEffect(() => {
    if (!regency) { setDistricts([]); setDistrict(''); return; }
    const r = regencies.find((x) => x.name === regency);
    if (!r) { setDistricts([]); setDistrict(''); return; }
    (async () => {
      try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${r.id}.json`);
        const data = await res.json();
        setDistricts(data || []);
      } catch { setDistricts([]); }
    })();
  }, [regency, regencies]);
  useEffect(() => {
    if (!district) { setVillages([]); setVillage(''); return; }
    const d = districts.find((x) => x.name === district);
    if (!d) { setVillages([]); setVillage(''); return; }
    (async () => {
      try {
        const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${d.id}.json`);
        const data = await res.json();
        setVillages(data || []);
      } catch { setVillages([]); }
    })();
  }, [district, districts]);

  const onLoadClick = async () => {
    if (!idSpk) { setSnack({ open: true, message: 'Isi ID SPK terlebih dahulu.', severity: 'error' }); return; }
    const p = new URLSearchParams(params);
    p.set('idSpk', idSpk);
    setParams(p, { replace: true });
    await loadById(idSpk);
  };

  const onSave = async () => {
    if (!idSpk) { setSnack({ open: true, message: 'ID SPK belum diisi.', severity: 'error' }); return; }
    const patch: AnyRec = {
      idSpk,
      nameDesign,
      sample,
      product,
      pattern,
      fabric,
      fabricColor,
      colorCombination,
      codeColor,
      application,
      bordir,
      sablon,
      jahitan,
      hoodie,
      cuttingButtom,
      sideSlit,
      neck,
      placard,
      pocket,
      bottomPocket,
      furingPocket,
      armEnd,
      frontButton,
      bottomStrap,
      armStrap,
      bottomTire,
      skoder,
      pocketVariant,
      reflector,
      colorReflector,
      ventilation,
      jahitanVentilasiHorz,
      penHolder,
      catTongue,
      lanyardHolder,
      HThanger,
      assetLink,
      catatan,
      // Friendly labels for PrintSPK fallbacks
      applicationLabel: application,
      bordirLabel: bordir,
      sablonLabel: sablon,
      jahitanLabel: jahitan,
      hoodieLabel: hoodie,
      cuttingButtomLabel: cuttingButtom,
      sideSlitLabel: sideSlit,
      neckLabel: neck,
      placardLabel: placard,
      pocketLabel: pocket,
      bottomPocketLabel: bottomPocket,
      furingPocketLabel: furingPocket,
      armEndLabel: armEnd,
      bottomStrapLabel: bottomStrap,
      armStrapLabel: armStrap,
      bottomTireLabel: bottomTire,
      colorReflectorLabel: colorReflector,
      ventilationLabel: ventilation,
    };
    const ok = await saveDesignSnapshotAsync(idSpk, patch);
    setSnack({ open: true, message: ok ? 'Revisi SPK tersimpan.' : 'Gagal menyimpan revisi.', severity: ok ? 'success' : 'error' });
  };

  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
      <Paper sx={{ p: 2, width: '100%', maxWidth: 1200 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TextField label="ID SPK" size="small" value={idInput} onChange={(e) => setIdInput(e.target.value)} />
          <Button variant="outlined" onClick={onLoadClick}>Muat</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" color="primary" onClick={() => navigate(`/market/print-spk?idSpk=${encodeURIComponent(idSpk)}`)} disabled={!idSpk}>Lihat SPK</Button>
        </Stack>

        {/* ======================== */}
        {/* Editor: Data Konsumen   */}
        {/* ======================== */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Data Konsumen</Typography>
          <Grid container spacing={2}>
            <Grid size={6}>
              <LabeledText label="Nama Konsumen" value={namaPemesan} onChange={setNamaPemesan} />
            </Grid>
            <Grid size={6}>
              <LabeledText label="Alamat Lengkap" value={address} onChange={setAddress} />
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Pilih Provinsi</Typography>
                <Select value={province} onChange={(e) => setProvince(String(e.target.value))} size="small" displayEmpty fullWidth>
                  <MenuItem value="">Pilih Provinsi</MenuItem>
                  {(provinces||[]).map((p) => (<MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>))}
                </Select>
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Pilih Kabupaten</Typography>
                <Select value={regency} onChange={(e) => setRegency(String(e.target.value))} size="small" displayEmpty fullWidth disabled={!province}>
                  <MenuItem value="">Pilih Kabupaten</MenuItem>
                  {(regencies||[]).map((r) => (<MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>))}
                </Select>
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Pilih Kecamatan</Typography>
                <Select value={district} onChange={(e) => setDistrict(String(e.target.value))} size="small" displayEmpty fullWidth disabled={!regency}>
                  <MenuItem value="">Pilih Kecamatan</MenuItem>
                  {(districts||[]).map((d) => (<MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>))}
                </Select>
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Pilih Desa</Typography>
                <Select value={village} onChange={(e) => setVillage(String(e.target.value))} size="small" displayEmpty fullWidth disabled={!district}>
                  <MenuItem value="">Pilih Desa</MenuItem>
                  {(villages||[]).map((v) => (<MenuItem key={v.id} value={v.name}>{v.name}</MenuItem>))}
                </Select>
              </Box>
            </Grid>
            <Grid size={6}>
              <LabeledText label="Nomor HP" value={number} onChange={setNumber} />
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Konten</Typography>
                <Select
                  value={content}
                  onChange={(e) => setContent(String(e.target.value))}
                  size="small"
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">Pilih</MenuItem>
                  <MenuItem value="Boleh">Boleh</MenuItem>
                  <MenuItem value="Tidak">Tidak</MenuItem>
                </Select>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* ======================== */}
        {/* Editor: Data Pesanan    */}
        {/* ======================== */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Data Pesanan</Typography>
          <Grid container spacing={2}>
            <Grid size={6}><LabeledText label="Quantity" value={quantity} onChange={setQuantity} /></Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ minWidth: 80 }}>Size</Typography>
                <RadioGroup row name="size" value={size} onChange={(e) => setSize(e.target.value)}>
                  {['XS','S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','Custom'].map((s) => (
                    <FormControlLabel key={s} value={s} control={<Radio />} label={s} />
                  ))}
                </RadioGroup>
              </Box>
            </Grid>
            <Grid size={6}><LabeledText label="Nama" value={nameset} onChange={setNameset} /></Grid>
            <Grid size={6}><LabeledText label="Format Nama" value={formatName} onChange={setFormatName} /></Grid>
            <Grid size={3}>
              <Button variant="contained" onClick={() => {
                if (!size || !nameset || !formatName) { setSnack({ open: true, message: 'Lengkapi Size, Nama, dan Format Nama', severity: 'error' }); return; }
                setItems(prev => [...prev, { size, nama: nameset, formatNama: formatName }]);
                setSize(''); setNameset(''); setFormatName('');
                setSnack({ open: true, message: 'Data ditambahkan ke List Pesanan', severity: 'success' });
              }}>Input Data</Button>
            </Grid>
          </Grid>
        </Box>

        {/* ======================== */}
        {/* Editor: List Pesanan    */}
        {/* ======================== */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>List Pesanan</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>Format Nama</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{it.size}</TableCell>
                    <TableCell>{it.nama}</TableCell>
                    <TableCell>{it.formatNama}</TableCell>
                    <TableCell>
                      <Button size="small" color="error" onClick={() => setItems(items.filter((_, i) => i !== idx))}>Hapus</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">Belum ada data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ======================== */}
        {/* Editor: Data Transaksi  */}
        {/* ======================== */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Data Transaksi</Typography>
          <Grid container spacing={2}>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Tipe Transaksi</Typography>
                <Select size="small" value={transaction} onChange={(e) => setTransaction(String(e.target.value))}>
                  <MenuItem value="dp">DP</MenuItem>
                  <MenuItem value="pelunasan">Pelunasan</MenuItem>
                  <MenuItem value="dpl">DPL</MenuItem>
                </Select>
              </Box>
            </Grid>
            <Grid size={6}><LabeledText label="Nominal Transaksi" value={nominal} onChange={setNominal} /></Grid>
            <Grid size={6}>
              <Button variant="outlined" component="label">Bukti Transaksi
                <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onloadend = () => setProof(String(reader.result||''));
                  reader.readAsDataURL(f);
                }} />
              </Button>
            </Grid>
          </Grid>
          {/* Tombol simpan disatukan di bagian paling bawah */}
        </Box>

        {/* Spesifikasi Desain */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Spesifikasi Desain</Typography>
          <Grid container spacing={2}>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Nama Desain</Typography>
                <TextField value={nameDesign} size="small" onChange={(e) => setNameDesign(e.target.value)} fullWidth />
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Sample</Typography>
                <Select size="small" value={sample} onChange={(e) => setSample(e.target.value)}>
                  <MenuItem value="ADA">Ada</MenuItem>
                  <MenuItem value="TIDAK">Tidak</MenuItem>
                </Select>
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Jenis Produk</Typography>
                <Select size="small" value={product} onChange={(e) => setProduct(e.target.value)}>
                  <MenuItem value="JAKET">Jaket</MenuItem>
                  <MenuItem value="PDL/PDH">PDL/PDH</MenuItem>
                  <MenuItem value="ROMPI">Rompi</MenuItem>
                  <MenuItem value="SAFETY">Safety</MenuItem>
                  <MenuItem value="TACTICAL">Tactical</MenuItem>
                  <MenuItem value="KAOS">Kaos</MenuItem>
                  <MenuItem value="CELANA PANJANG">Celana Panjang</MenuItem>
                  <MenuItem value="POLO">Polo</MenuItem>
                </Select>
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Jenis Pola</Typography>
                <Select size="small" value={pattern} onChange={(e) => setPattern(e.target.value)}>
                  <MenuItem value="">Pilih Jenis Pola</MenuItem>
                  <MenuItem value="KAOS">Kaos</MenuItem>
                  <MenuItem value="POLO">Polo</MenuItem>
                  <MenuItem value="PDH">PDH</MenuItem>
                  <MenuItem value="TACTICAL PLANTERS">Tactical Planters</MenuItem>
                  <MenuItem value="TACTICAL KJ">Tactical KJ</MenuItem>
                  <MenuItem value="SAFETY">Safety</MenuItem>
                  <MenuItem value="PETROSEA">Petrosea</MenuItem>
                  <MenuItem value="BERAU">Berau</MenuItem>
                  <MenuItem value="ADARO">Adaro</MenuItem>
                  <MenuItem value="PAMA">Pama</MenuItem>
                  <MenuItem value="KPC 2 WARNA">KPC 2 Warna</MenuItem>
                  <MenuItem value="GRASBERG">Grasberg</MenuItem>
                  <MenuItem value="JEANS">Jeans</MenuItem>
                  <MenuItem value="CARGO">Cargo</MenuItem>
                  <MenuItem value="SOLIDARITAS">Solidaritas</MenuItem>
                  <MenuItem value="ROMPI">Rompi</MenuItem>
                </Select>
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Jenis Kain</Typography>
                <Select size="small" value={fabric} onChange={(e) => setFabric(e.target.value)}>
                  <MenuItem value="AMERICAN DRILL">American Drill</MenuItem>
                  <MenuItem value="HIROKAYA DRILL">Hirokaya Drill</MenuItem>
                  <MenuItem value="NAGATA DRILL">Nagata Drill</MenuItem>
                  <MenuItem value="TEXMOODA">Texmooda</MenuItem>
                  <MenuItem value="BABY CANVAS">Baby Canvas</MenuItem>
                  <MenuItem value="TASLAN BALLON">Taslan Balloon</MenuItem>
                  <MenuItem value="TASLAN / MICRO POLY BALON (STOK)">Taslan / Micro Poly Balon (Stok)</MenuItem>
                  <MenuItem value="TASLAN MILKY">Taslan Milky</MenuItem>
                  <MenuItem value="COMBED 30S">Combed 30S</MenuItem>
                  <MenuItem value="COMBED 24S">Combed 24S</MenuItem>
                  <MenuItem value="LACOSTE PE">Lacoste PE</MenuItem>
                  <MenuItem value="LACOSTE COTTON">Lacoste Cotton</MenuItem>
                  <MenuItem value="LACOSTE CVC">Lacoste CVC</MenuItem>
                  <MenuItem value="DENIM">Denim</MenuItem>
                </Select>
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Warna Kain</Typography>
                <TextField value={fabricColor} size="small" onChange={(e) => setFabricColor(e.target.value)} fullWidth />
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Kombinasi Warna Kain</Typography>
                <TextField value={colorCombination} size="small" onChange={(e) => setColorCombination(e.target.value)} fullWidth />
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ minWidth: 180 }}>Kode Warna Kain</Typography>
                <TextField value={codeColor} size="small" onChange={(e) => setCodeColor(e.target.value)} fullWidth />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Detail Produk */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Detail Produk</Typography>
          <Grid container spacing={2}>
            <Grid size={6}><LabeledSelect label="Aplikasi" value={application} onChange={setApplication} options={['TIDAK','BORDIR','SABLON','KOMBINASI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Jenis Bordir" value={bordir} onChange={setBordir} options={['TIDAK','LANGSUNG','TIMBUL','BADGE','LANGSUNG + BADGE','LANGSUNG + TIMBUL','BADGE + TIMBUL']} /></Grid>
            <Grid size={6}><LabeledSelect label="Jenis Sablon" value={sablon} onChange={setSablon} options={['DTF','RUBBER','PLASTISOL','KOMBINASI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Jahitan" value={jahitan} onChange={setJahitan} options={['STANDAR','SINGLE','DOUBLE']} /></Grid>
            <Grid size={6}><LabeledSelect label="Hoodie" value={hoodie} onChange={setHoodie} options={['PATEN','LEPAS-PASANG','LIPAT','MASUK KERAH']} /></Grid>
            <Grid size={6}><LabeledSelect label="Potongan Bawah" value={cuttingButtom} onChange={setCuttingButtom} options={['LURUS','LENGKUNG']} /></Grid>
            <Grid size={6}><LabeledSelect label="Belahan Samping" value={sideSlit} onChange={setSideSlit} options={['TIDAK','PAKAI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Kerah" value={neck} onChange={setNeck} options={['STANDAR','O_NECK','V_NECK','SHANGHAI','KERAH JADI','KERAH BIKIN']} /></Grid>
            <Grid size={6}><LabeledSelect label="Plaket" value={placard} onChange={setPlacard} options={['TIDAK','KNOP DALAM 3 PCS - HITAM','KNOP DALAM 3 PCS - NAVY','KNOP DALAM 3 PCS - MERAH','KNOP LUAR 4 PCS - HITAM','VELCRO 3 PCS - HITAM']} /></Grid>
            <Grid size={6}><LabeledSelect label="Saku" value={pocket} onChange={setPocket} options={['STANDAR POLA','GELEMBUNG','DALAM','TEMPEL']} /></Grid>
            <Grid size={6}><LabeledSelect label="Saku Bawah" value={bottomPocket} onChange={setBottomPocket} options={['TIDAK','TANPA ZIPPER','PAKAI ZIPPER','GEMBUNG','TEMPEL']} /></Grid>
            <Grid size={6}><LabeledSelect label="Saku Furing" value={furingPocket} onChange={setFuringPocket} options={['TIDAK','KANAN KIRI','KANAN','KIRI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Ujung Lengan" value={armEnd} onChange={setArmEnd} options={['TIDAK','VELCRO','KERUT_VELCRO','KERUT','MANSET PINGGUL','MANSET JADI','MANSET LIPAT LANGSUNG','MANSET PENDEK']} /></Grid>
            <Grid size={6}><LabeledSelect label="Kancing Depan" value={frontButton} onChange={setFrontButton} options={['TIDAK','LUAR','DALAM','ZIPPER LUAR','ZIPPER DALAM','ZIPPER PLAKET']} /></Grid>
          </Grid>
        </Box>

        {/* Detail Tambahan */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Detail Tambahan</Typography>
          <Grid container spacing={2}>
            <Grid size={6}><LabeledSelect label="Tali Bawah" value={bottomStrap} onChange={setBottomStrap} options={['TIDAK','PAKAI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Tali Lengan" value={armStrap} onChange={setArmStrap} options={['TIDAK','PAKAI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Ban Bawah" value={bottomTire} onChange={setBottomTire} options={['TIDAK','PAKAI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Skoder" value={skoder} onChange={setSkoder} options={['TIDAK','PAKAI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Varian Saku" value={pocketVariant} onChange={setPocketVariant} options={['TIDAK','STANDAR POLA','TEMPEL - VRS POLOS','TEMPEL - VRS HIDUP','TEMPEL - VRS MATI','DALAM','GEMBUNG']} /></Grid>
            <Grid size={6}><LabeledSelect label="Jenis Reflektor" value={reflector} onChange={setReflector} options={['5 JADI','5 BIKIN','LIST CPT 0.5 + 5','2,5 JADI','2,5 BIKIN','7 POLOS','7 BIKIN']} /></Grid>
            <Grid size={6}><LabeledSelect label="Warna List Reflektor" value={colorReflector} onChange={setColorReflector} options={['TIDAK','HIJAU STABILO','KUNING STABILO','ORANGE STABILO','MERAH','BIRU']} /></Grid>
            <Grid size={6}><LabeledSelect label="Ventilasi" value={ventilation} onChange={setVentilation} options={['TIDAK','VERTIKAL TEMPEL','VERTIKAL TIDAK TEMBUS','HORIZONTAL','VERTIKAL KETIAK','HORIZONTAL KETIAK']} /></Grid>
            <Grid size={6}><LabeledSelect label="Jahitan Ventilasi Horz" value={jahitanVentilasiHorz} onChange={setJahitanVentilasiHorz} options={['2 TITIK','3 TITIK','JAHIT TENGAH','4 TITIK (SUDUT + TENGAH 2)']} /></Grid>
            <Grid size={6}><LabeledSelect label="Tempat Pulpen" value={penHolder} onChange={setPenHolder} options={['POJOK SAKU KANAN','SAKU KANAN (TENGAH)','POJOK SAKU KIRI','SAKU KIRI (TENGAH)','LENGAN KANAN','LENGAN KIRI','KOMBINASI','TIDAK']} /></Grid>
            <Grid size={6}><LabeledSelect label="Lidah Kucing" value={catTongue} onChange={setCatTongue} options={['TIDAK','PAKAI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Tempat Lanyard" value={lanyardHolder} onChange={setLanyardHolder} options={['TIDAK','PAKAI']} /></Grid>
            <Grid size={6}><LabeledSelect label="Gantungan HT" value={HThanger} onChange={setHTHanger} options={['TIDAK','DADA KIRI','DADA KANAN','LENGAN KIRI','LENGAN KANAN']} /></Grid>
          </Grid>
        </Box>

        {/* Lainnya */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Link Asset & Catatan</Typography>
          <Stack spacing={2}>
            <TextField label="Link Asset Desain" size="small" value={assetLink} onChange={(e) => setAssetLink(e.target.value)} fullWidth placeholder="https://drive.google.com/..." />
            <TextField label="Catatan" size="small" value={catatan} onChange={(e) => setCatatan(e.target.value)} fullWidth multiline minRows={2} />
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => { if (idSpk) loadById(idSpk); }}>Reset Perubahan</Button>
          <Button variant="contained" color="success" onClick={async () => {
            if (!idSpk) { setSnack({ open: true, message: 'ID SPK belum diisi.', severity: 'error' }); return; }
            // 1) Simpan snapshot PESANAN -> spk_orders
            try {
              const payload = {
                idSpk,
                namaPemesan,
                quantity,
                tipeTransaksi: transaction || '-',
                namaCS: '-',
                tanggalInput: new Date().toISOString(),
                wilayah: { province, regency, district, village },
                address,
                number,
                content,
                items,
                nominal,
                proof,
              };
              try {
                const raw = await kvStore.get(ORDER_SNAP_KEY) || {};
                const map = raw && typeof raw === 'object' ? raw : (typeof raw === 'string' ? JSON.parse(raw) : {});
                map[String(idSpk)] = payload;
                await kvStore.set(ORDER_SNAP_KEY, map);
              } catch {}
            } catch {}

            // 2) Simpan snapshot DESAIN -> spk_design (pakai onSave)
            onSave();
          }}>Simpan</Button>
        </Stack>
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={2200} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography sx={{ minWidth: 180 }}>{label} :</Typography>
      <Select size="small" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((op) => (
          <MenuItem key={op} value={op}>{op}</MenuItem>
        ))}
      </Select>
    </Box>
  );
}

function LabeledText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography sx={{ minWidth: 180 }}>{label}</Typography>
      <TextField size="small" fullWidth value={value} onChange={(e) => onChange(e.target.value)} />
    </Box>
  );
}
