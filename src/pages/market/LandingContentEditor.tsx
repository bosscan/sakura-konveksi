import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  IconButton,
  Card,
  CardMedia,
  CardActions,
  Divider,
  Paper,
  Stack,
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { LANDING_IMAGES, SOCIAL_LINKS } from '../../lib/landingConfig';
import kvStore from '../../lib/kvStore';
import { getObjectUrl, getObjectUrls, saveFiles, getBlob } from '../../lib/landingStore';
import { uploadFilesToCloud } from '../../lib/landingRemote';

// Storage keys
const K = {
  // For large images we only store KEYS (ids) via kvStore; blobs live in IndexedDB
  imagesKeys: 'landing_images_keys',
  imagesUrls: 'landing_images_urls',
  katalog: 'landing_katalog', // items may contain imageKey
  testimonials: 'landing_testimonials',
  prices: 'landing_prices',
  galleryKeys: 'landing_gallery_keys',
  galleryUrls: 'landing_gallery_urls',
  socials: 'landing_social_links',
} as const;

// Types
type KatalogItem = { title: string; description?: string; image?: string; imageKey?: string };
type Testimonial = { name: string; quote: string };
type PriceItem = { name: string; price: string; description?: string };

type SocialLinks = typeof SOCIAL_LINKS;

// Frontend-only: store images as Blobs in IndexedDB and return generated ids (keys)
async function uploadFilesGetKeys(files: FileList | null): Promise<string[]> {
  if (!files || files.length === 0) return [];
  return saveFiles(files);
}

export default function LandingContentEditor() {
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

  // Slider images: keys persisted; urls resolved for preview
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageCloud, setImageCloud] = useState<string[]>([]);
  // Default images if no keys are set
  const legacyImages = LANDING_IMAGES;

  useEffect(() => {
    let active = true;
    (async () => {
      if (imageKeys.length === 0) {
        setImageUrls({});
        return;
      }
      const urls = await getObjectUrls(imageKeys);
      if (active) setImageUrls(urls);
    })();
    return () => { active = false; };
  }, [imageKeys]);

  // Katalog
  const [katalog, setKatalog] = useState<KatalogItem[]>([
    { title: 'Jaket Varsity', description: 'Bahan premium, sablon/bordir rapi', image: LANDING_IMAGES[0] },
    { title: 'Jaket Hoodie', description: 'Nyaman dipakai harian', image: LANDING_IMAGES[1] },
    { title: 'Jaket Coach', description: 'Ringan dan stylish', image: LANDING_IMAGES[2] },
  ]);

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    { name: 'Pelanggan #1', quote: 'Respon cepat, hasil jahit rapi, pengiriman tepat waktu.' },
    { name: 'Pelanggan #2', quote: 'Kualitas premium dan pelayanan ramah.' },
  ]);

  // Price list
  const [prices, setPrices] = useState<PriceItem[]>([
    { name: 'Varsity', price: 'Mulai 250K', description: 'Free konsultasi desain' },
    { name: 'Hoodie', price: 'Mulai 200K', description: 'Minimal order fleksibel' },
    { name: 'Coach', price: 'Mulai 230K', description: 'Harga transparan' },
  ]);

  // Gallery
  const [galleryKeys, setGalleryKeys] = useState<string[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<Record<string, string>>({});
  const [galleryCloud, setGalleryCloud] = useState<string[]>([]);

  useEffect(() => {
    let ok = true;
    (async () => {
      if (galleryKeys.length === 0) { setGalleryUrls({}); return; }
      const urls = await getObjectUrls(galleryKeys);
      if (ok) setGalleryUrls(urls);
    })();
    return () => { ok = false; };
  }, [galleryKeys]);

  // Social links
  const [socials, setSocials] = useState<SocialLinks>(SOCIAL_LINKS);

  // Hydrate from kvStore and subscribe to external changes
  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const [ik, kat, test, pr, gk, soc, iu, gu] = await Promise.all([
          kvStore.get(K.imagesKeys),
          kvStore.get(K.katalog),
          kvStore.get(K.testimonials),
          kvStore.get(K.prices),
          kvStore.get(K.galleryKeys),
          kvStore.get(K.socials),
          kvStore.get(K.imagesUrls),
          kvStore.get(K.galleryUrls),
        ]);
        if (!mounted) return;
        if (Array.isArray(ik)) setImageKeys(ik as string[]);
        if (Array.isArray(iu)) setImageCloud(iu as string[]);
        if (Array.isArray(kat)) setKatalog(kat as KatalogItem[]);
        if (Array.isArray(test)) setTestimonials(test as Testimonial[]);
        if (Array.isArray(pr)) setPrices(pr as PriceItem[]);
        if (Array.isArray(gk)) setGalleryKeys(gk as string[]);
        if (Array.isArray(gu)) setGalleryCloud(gu as string[]);
        if (soc && typeof soc === 'object') setSocials(soc as SocialLinks);
      } catch {}
    };
    hydrate();
    const subs = [K.imagesKeys, K.katalog, K.testimonials, K.prices, K.galleryKeys, K.socials, K.imagesUrls, K.galleryUrls]
      .map((key) => kvStore.subscribe(key, () => { try { hydrate(); } catch {} }));
    return () => { mounted = false; subs.forEach(s => { try { s.unsubscribe(); } catch {} }); };
  }, []);

  const saveAll = async () => {
    try {
      setSaving(true);
      // Simulate micro-task flush and ensure no UI lock
      await Promise.resolve();
      // Persist only keys and structured data; blobs stay in IndexedDB
      try { await kvStore.set(K.imagesKeys, imageKeys); } catch {}
      try { await kvStore.set(K.imagesUrls, imageCloud); } catch {}
      try { await kvStore.set(K.katalog, katalog); } catch {}
      try { await kvStore.set(K.testimonials, testimonials); } catch {}
      try { await kvStore.set(K.prices, prices); } catch {}
      try { await kvStore.set(K.galleryKeys, galleryKeys); } catch {}
      try { await kvStore.set(K.galleryUrls, galleryCloud); } catch {}
      try { await kvStore.set(K.socials, socials); } catch {}
      setSnack({ open: true, message: 'Perubahan berhasil disimpan.', severity: 'success' });
    } catch (e) {
      const isQuota = (e as any)?.name === 'QuotaExceededError' || (e as any)?.code === 22;
      setSnack({ open: true, message: isQuota ? 'Gagal menyimpan: storage penuh. Kurangi ukuran/jumlah foto.' : 'Gagal menyimpan. Coba lagi.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setImageKeys([]);
    setKatalog([
      { title: 'Jaket Varsity', description: 'Bahan premium, sablon/bordir rapi', image: LANDING_IMAGES[0] },
      { title: 'Jaket Hoodie', description: 'Nyaman dipakai harian', image: LANDING_IMAGES[1] },
      { title: 'Jaket Coach', description: 'Ringan dan stylish', image: LANDING_IMAGES[2] },
    ]);
    setTestimonials([
      { name: 'Pelanggan #1', quote: 'Respon cepat, hasil jahit rapi, pengiriman tepat waktu.' },
      { name: 'Pelanggan #2', quote: 'Kualitas premium dan pelayanan ramah.' },
    ]);
    setPrices([
      { name: 'Varsity', price: 'Mulai 250K', description: 'Free konsultasi desain' },
      { name: 'Hoodie', price: 'Mulai 200K', description: 'Minimal order fleksibel' },
      { name: 'Coach', price: 'Mulai 230K', description: 'Harga transparan' },
    ]);
    setGalleryKeys([]);
    setSocials(SOCIAL_LINKS);
    setSnack({ open: true, message: 'Konten dikembalikan ke default (belum disimpan).', severity: 'info' });
  };

  const move = <T,>(arr: T[], idx: number, dir: -1 | 1) => {
    const copy = [...arr];
    const next = idx + dir;
    if (next < 0 || next >= copy.length) return arr;
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    return copy;
  };

  // Merge arrays without duplicates while preserving existing order
  const mergeUnique = (prev: string[], next: string[]) => {
    const out = [...prev];
    const seen = new Set(prev);
    for (const val of next) {
      if (val && !seen.has(val)) {
        out.push(val);
        seen.add(val);
      }
    }
    return out;
  };

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>Kelola Landing Page</Typography>
        <Box>
          <Button startIcon={<RestoreIcon />} onClick={resetDefaults} sx={{ mr: 1 }}>Reset Default</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveAll} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Semua'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Slider Foto" />
          <Tab label="Katalog" />
          <Tab label="Testimoni" />
          <Tab label="Price List" />
          <Tab label="Galeri" />
          <Tab label="Link Sosial" />
        </Tabs>
        <Divider />

        {/* Slider Foto */}
        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button variant="outlined" startIcon={<UploadIcon />} component="label">
                Upload Foto
                <input type="file" accept="image/*" multiple hidden onChange={async (e) => {
                  try {
                    const keys = await uploadFilesGetKeys(e.target.files);
                    if (keys.length) {
                      setImageKeys(prev => [...prev, ...keys]);
                      // prime preview urls
                      const urls = await getObjectUrls(keys);
                      setImageUrls(prev => ({ ...prev, ...urls }));
                    }
                  } catch (err: any) {
                    setSnack({ open: true, message: `Gagal menyimpan gambar: ${err?.message || 'IndexedDB error'}`, severity: 'error' });
                  }
                }} />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                Cloud di VPS aktif. File akan diunggah ke server (folder uploads).
              </Typography>
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    // Migrate local IndexedDB blobs to cloud
                    const blobs: Blob[] = [];
                    for (const k of imageKeys) {
                      const b = await getBlob(k);
                      if (b) blobs.push(b);
                    }
                    if (blobs.length === 0) { setSnack({ open: true, message: 'Tidak ada foto lokal untuk disinkronkan.', severity: 'info' }); return; }
                    const urls = await uploadFilesToCloud(blobs, 'slider');
                    setImageCloud((prev) => mergeUnique(prev, urls));
                    setSnack({ open: true, message: 'Sinkronisasi slider ke cloud berhasil. Klik Simpan.', severity: 'success' });
                  } catch (err: any) {
                    setSnack({ open: true, message: `Sinkronisasi gagal: ${err?.message || 'Cloud upload error'}`, severity: 'error' });
                  }
                }}
              >
                Sinkronkan Slider ke Cloud
              </Button>
            </Stack>

            {(imageKeys.length === 0 && imageCloud.length === 0 && legacyImages.length === 0) && (
              <Typography variant="body2" color="text.secondary">Belum ada foto.</Typography>
            )}

            {imageCloud.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Foto di Cloud</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {imageCloud.map((url, idx) => (
                    <Card key={`cloud-${idx}`}>
                      <CardMedia component="img" height="160" image={url} alt={`slider-cloud-${idx}`} />
                      <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <IconButton size="small" onClick={() => setImageCloud(prev => move(prev, idx, -1))} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => setImageCloud(prev => move(prev, idx, 1))} disabled={idx === imageCloud.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setImageCloud(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {imageKeys.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Belum Disinkronkan (Lokal)</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {imageKeys.map((key, idx) => (
                    <Card key={`local-${key}-${idx}`}>
                      <CardMedia component="img" height="160" image={imageUrls[key] || ''} alt={`slider-local-${idx}`} />
                      <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <IconButton size="small" onClick={() => setImageKeys(prev => move(prev, idx, -1))} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => setImageKeys(prev => move(prev, idx, 1))} disabled={idx === imageKeys.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setImageKeys(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {(imageCloud.length === 0 && imageKeys.length === 0 && legacyImages.length > 0) && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Default</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {legacyImages.map((url, idx) => (
                    <Card key={`legacy-${idx}`}>
                      <CardMedia component="img" height="160" image={url} alt={`slider-default-${idx}`} />
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Katalog */}
        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <Button startIcon={<AddIcon />} onClick={() => setKatalog(prev => [...prev, { title: 'Produk Baru', description: '' }])}>Tambah Item</Button>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {katalog.map((item, idx) => (
                <Paper key={idx} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <TextField label="Judul" value={item.title} onChange={(e) => setKatalog(prev => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} />
                    <TextField label="Deskripsi" value={item.description || ''} onChange={(e) => setKatalog(prev => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                        Ganti Gambar
                        <input type="file" accept="image/*" hidden onChange={async (e) => {
                          try {
                            const [key] = await uploadFilesGetKeys(e.target.files);
                            if (key) {
                              const url = await getObjectUrl(key);
                              setKatalog(prev => prev.map((x, i) => i === idx ? { ...x, imageKey: key, image: undefined } : x));
                              // Update preview map locally
                              setGalleryUrls(prev => ({ ...prev, [key]: url || '' }));
                            }
                          } catch (err: any) {
                            setSnack({ open: true, message: `Gagal menyimpan gambar: ${err?.message || 'IndexedDB error'}`, severity: 'error' });
                          }
                        }} />
                      </Button>
                      {(() => {
                        const src = item.imageKey ? galleryUrls[item.imageKey] : item.image;
                        return src ? <Box component="img" src={src} alt="thumb" sx={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 1 }} /> : null;
                      })()}
                    </Stack>
                    <Box>
                      <IconButton size="small" onClick={() => setKatalog(prev => move(prev, idx, -1))} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setKatalog(prev => move(prev, idx, 1))} disabled={idx === katalog.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setKatalog(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Testimoni */}
        {tab === 2 && (
          <Box sx={{ p: 2 }}>
            <Button startIcon={<AddIcon />} onClick={() => setTestimonials(prev => [...prev, { name: 'Pelanggan', quote: '' }])}>Tambah Testimoni</Button>
            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {testimonials.map((t, idx) => (
                <Paper key={idx} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <TextField label="Nama" value={t.name} onChange={(e) => setTestimonials(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                    <TextField label="Quote" value={t.quote} multiline minRows={2} onChange={(e) => setTestimonials(prev => prev.map((x, i) => i === idx ? { ...x, quote: e.target.value } : x))} />
                    <Box>
                      <IconButton size="small" onClick={() => setTestimonials(prev => move(prev, idx, -1))} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setTestimonials(prev => move(prev, idx, 1))} disabled={idx === testimonials.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setTestimonials(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Price List */}
        {tab === 3 && (
          <Box sx={{ p: 2 }}>
            <Button startIcon={<AddIcon />} onClick={() => setPrices(prev => [...prev, { name: 'Produk', price: '', description: '' }])}>Tambah Harga</Button>
            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {prices.map((p, idx) => (
                <Paper key={idx} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <TextField label="Nama" value={p.name} onChange={(e) => setPrices(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                    <TextField label="Harga" value={p.price} onChange={(e) => setPrices(prev => prev.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))} />
                    <TextField label="Deskripsi" value={p.description || ''} onChange={(e) => setPrices(prev => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                    <Box>
                      <IconButton size="small" onClick={() => setPrices(prev => move(prev, idx, -1))} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setPrices(prev => move(prev, idx, 1))} disabled={idx === prices.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setPrices(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Galeri */}
        {tab === 4 && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<UploadIcon />} component="label">
                Upload Foto
                <input type="file" accept="image/*" multiple hidden onChange={async (e) => {
                  try {
                    const keys = await uploadFilesGetKeys(e.target.files);
                    if (keys.length) {
                      setGalleryKeys(prev => [...prev, ...keys]);
                      const urls = await getObjectUrls(keys);
                      setGalleryUrls(prev => ({ ...prev, ...urls }));
                    }
                  } catch (err: any) {
                    setSnack({ open: true, message: `Gagal menyimpan gambar: ${err?.message || 'IndexedDB error'}`, severity: 'error' });
                  }
                }} />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                Cloud di VPS aktif. File akan diunggah ke server (folder uploads).
              </Typography>
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    const blobs: Blob[] = [];
                    for (const k of galleryKeys) {
                      const b = await getBlob(k);
                      if (b) blobs.push(b);
                    }
                    if (blobs.length === 0) { setSnack({ open: true, message: 'Tidak ada foto galeri lokal untuk disinkronkan.', severity: 'info' }); return; }
                    const urls = await uploadFilesToCloud(blobs, 'gallery');
                    setGalleryCloud((prev) => mergeUnique(prev, urls));
                    setSnack({ open: true, message: 'Sinkronisasi galeri ke cloud berhasil. Klik Simpan.', severity: 'success' });
                  } catch (err: any) {
                    setSnack({ open: true, message: `Sinkronisasi gagal: ${err?.message || 'Cloud upload error'}`, severity: 'error' });
                  }
                }}
              >
                Sinkronkan Galeri ke Cloud
              </Button>
            </Stack>
            {(galleryCloud.length === 0 && galleryKeys.length === 0) && (
              <Typography variant="body2" color="text.secondary">Belum ada foto.</Typography>
            )}

            {galleryCloud.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Foto di Cloud</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                  {galleryCloud.map((url, idx) => (
                    <Card key={`g-cloud-${idx}`}>
                      <CardMedia component="img" height="140" image={url} alt={`galeri-cloud-${idx}`} />
                      <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <IconButton size="small" onClick={() => setGalleryCloud(prev => move(prev, idx, -1))} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => setGalleryCloud(prev => move(prev, idx, 1))} disabled={idx === galleryCloud.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setGalleryCloud(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {galleryKeys.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Belum Disinkronkan (Lokal)</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                  {galleryKeys.map((key, idx) => (
                    <Card key={`g-local-${key}-${idx}`}>
                      <CardMedia component="img" height="140" image={galleryUrls[key]} alt={`galeri-local-${idx}`} />
                      <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <IconButton size="small" onClick={() => setGalleryKeys(prev => move(prev, idx, -1))} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => setGalleryKeys(prev => move(prev, idx, 1))} disabled={idx === galleryKeys.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setGalleryKeys(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Link Sosial */}
        {tab === 5 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Instagram" value={socials.instagram} onChange={(e) => setSocials(s => ({ ...s, instagram: e.target.value }))} />
              <TextField label="Facebook" value={socials.facebook} onChange={(e) => setSocials(s => ({ ...s, facebook: e.target.value }))} />
              <TextField label="WhatsApp (wa.me)" value={socials.whatsapp} onChange={(e) => setSocials(s => ({ ...s, whatsapp: e.target.value }))} />
              <TextField label="TikTok" value={socials.tiktok} onChange={(e) => setSocials(s => ({ ...s, tiktok: e.target.value }))} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Tips: Gunakan format WhatsApp wa.me/62xxxx tanpa tanda tambah.
            </Typography>
          </Box>
        )}
      </Paper>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
