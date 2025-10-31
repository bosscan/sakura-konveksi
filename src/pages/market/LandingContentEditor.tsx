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
import { getObjectUrl, getObjectUrls, saveFiles } from '../../lib/landingStore';

// Storage keys
const K = {
  // For large images we only store KEYS (ids) in localStorage, blobs live in IndexedDB
  imagesKeys: 'landing_images_keys',
  katalog: 'landing_katalog', // items may contain imageKey
  testimonials: 'landing_testimonials',
  prices: 'landing_prices',
  galleryKeys: 'landing_gallery_keys',
  socials: 'landing_social_links',
} as const;

// Types
type KatalogItem = { title: string; description?: string; image?: string; imageKey?: string };
type Testimonial = { name: string; quote: string };
type PriceItem = { name: string; price: string; description?: string };

type SocialLinks = typeof SOCIAL_LINKS;

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    const parsed = JSON.parse(v);
    return parsed as T;
  } catch {
    return fallback;
  }
}

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
  const [imageKeys, setImageKeys] = useState<string[]>(() => readLS<string[]>(K.imagesKeys, []));
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  // Backward fallback for old saved URLs or default images
  const legacyImages = readLS<string[]>('landing_images', LANDING_IMAGES);

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
  const [katalog, setKatalog] = useState<KatalogItem[]>(() => readLS<KatalogItem[]>(K.katalog, [
    { title: 'Jaket Varsity', description: 'Bahan premium, sablon/bordir rapi', image: LANDING_IMAGES[0] },
    { title: 'Jaket Hoodie', description: 'Nyaman dipakai harian', image: LANDING_IMAGES[1] },
    { title: 'Jaket Coach', description: 'Ringan dan stylish', image: LANDING_IMAGES[2] },
  ]));

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => readLS<Testimonial[]>(K.testimonials, [
    { name: 'Pelanggan #1', quote: 'Respon cepat, hasil jahit rapi, pengiriman tepat waktu.' },
    { name: 'Pelanggan #2', quote: 'Kualitas premium dan pelayanan ramah.' },
  ]));

  // Price list
  const [prices, setPrices] = useState<PriceItem[]>(() => readLS<PriceItem[]>(K.prices, [
    { name: 'Varsity', price: 'Mulai 250K', description: 'Free konsultasi desain' },
    { name: 'Hoodie', price: 'Mulai 200K', description: 'Minimal order fleksibel' },
    { name: 'Coach', price: 'Mulai 230K', description: 'Harga transparan' },
  ]));

  // Gallery
  const [galleryKeys, setGalleryKeys] = useState<string[]>(() => readLS<string[]>(K.galleryKeys, []));
  const [galleryUrls, setGalleryUrls] = useState<Record<string, string>>({});

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
  const [socials, setSocials] = useState<SocialLinks>(() => readLS<SocialLinks>(K.socials, SOCIAL_LINKS));

  const saveAll = async () => {
    try {
      setSaving(true);
      // Simulate micro-task flush and ensure no UI lock
      await Promise.resolve();
  // Persist only keys, blobs stay in IndexedDB
  localStorage.setItem(K.imagesKeys, JSON.stringify(imageKeys));
      localStorage.setItem(K.katalog, JSON.stringify(katalog));
      localStorage.setItem(K.testimonials, JSON.stringify(testimonials));
      localStorage.setItem(K.prices, JSON.stringify(prices));
  localStorage.setItem(K.galleryKeys, JSON.stringify(galleryKeys));
      localStorage.setItem(K.socials, JSON.stringify(socials));
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
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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
            </Stack>

            {(imageKeys.length === 0 && legacyImages.length === 0) ? (
              <Typography variant="body2" color="text.secondary">Belum ada foto.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                {(imageKeys.length ? imageKeys : legacyImages).map((keyOrUrl, idx) => {
                  const src = imageKeys.length ? (imageUrls[keyOrUrl] || '') : keyOrUrl;
                  return (
                  <Card key={`${keyOrUrl}-${idx}`}>
                    <CardMedia component="img" height="160" image={src} alt={`slider-${idx}`} />
                    <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <IconButton size="small" onClick={() => imageKeys.length ? setImageKeys(prev => move(prev, idx, -1)) : null} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => imageKeys.length ? setImageKeys(prev => move(prev, idx, 1)) : null} disabled={idx === (imageKeys.length ? imageKeys.length : legacyImages.length) - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => imageKeys.length ? setImageKeys(prev => prev.filter((_, i) => i !== idx)) : null}><DeleteIcon fontSize="small" /></IconButton>
                    </CardActions>
                  </Card>
                );})}
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
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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
            </Stack>
            {galleryKeys.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Belum ada foto.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                {galleryKeys.map((key, idx) => (
                  <Card key={`${key}-${idx}`}>
                    <CardMedia component="img" height="140" image={galleryUrls[key]} alt={`galeri-${idx}`} />
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
