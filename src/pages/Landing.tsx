import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { AppBar, Box, Button, Container, Divider, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { BRAND, LANDING_IMAGES, SOCIAL_LINKS } from '../lib/landingConfig';
import { getObjectUrls } from '../lib/landingStore';
import kvStore from '../lib/kvStore';

function useAutoSlider(length: number, intervalMs = 4000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => setIndex((i: number) => (i + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);
  const goTo = (i: number) => setIndex(((i % length) + length) % length);
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);
  return { index, goTo, prev, next };
}

function NavLink({ label, targetId }: { label: string; targetId: string }) {
  const handleClick = () => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <Button color="inherit" onClick={handleClick} sx={{ textTransform: 'none', fontWeight: 600, mx: 0.5 }}>
      {label}
    </Button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  // Auth state from kvStore (kvStore-only); tolerate legacy string 'true'
  const isAuthRef = useRef<boolean>(false);
  useEffect(() => {
    (async () => {
      try {
        const v = await kvStore.get('isAuthenticated');
        if (typeof v === 'boolean') isAuthRef.current = v;
        else if (v === 'true') isAuthRef.current = true;
      } catch {}
    })();
    const sub = kvStore.subscribe('isAuthenticated', (v) => {
      if (typeof v === 'boolean') isAuthRef.current = v;
      else if (v === 'true') isAuthRef.current = true;
    });
    return () => { try { sub.unsubscribe(); } catch {} };
  }, []);
  // Slider images: prefer IndexedDB keys -> object URLs; fallback to legacy URLs/defaults
  const [images, setImages] = useState<string[]>(LANDING_IMAGES);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const keys = (await kvStore.get('landing_images_keys')) as string[] | null;
        if (Array.isArray(keys) && keys.length) {
          const urlsMap = await getObjectUrls(keys);
          const ordered = keys.map(k => urlsMap[k]).filter(Boolean);
          if (mounted && ordered.length) setImages(ordered);
          return;
        }
      } catch { /* ignore */ }
    })();
    const sub = kvStore.subscribe('landing_images_keys', async (v) => {
      try {
        const keys = Array.isArray(v) ? v as string[] : [];
        if (keys.length) {
          const urlsMap = await getObjectUrls(keys);
          const ordered = keys.map(k => urlsMap[k]).filter(Boolean);
          if (mounted) setImages(ordered);
        }
      } catch {}
    });
    return () => { mounted = false; try { sub.unsubscribe(); } catch {} };
  }, []);

  // Previously we redirected authenticated users away from landing.
  // Requirement update: always allow opening landing, even when logged in.

  const { index, goTo, prev, next } = useAutoSlider(images.length, 4500);

  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);
  const [contactAnchor, setContactAnchor] = useState<null | HTMLElement>(null);
  const isMobileMenuOpen = Boolean(mobileAnchor);
  const isContactOpen = Boolean(contactAnchor);

  // Load dynamic content for other sections (katalog, testimonials, prices, gallery, socials) from kvStore
  const [katalog, setKatalog] = useState<{ title: string; description?: string; image?: string; imageKey?: string }[]>([
    { title: 'Jaket Varsity', description: 'Bahan premium, sablon/bordir rapi', image: images[0] },
    { title: 'Jaket Hoodie', description: 'Nyaman dipakai harian', image: images[1 % images.length] },
    { title: 'Jaket Coach', description: 'Ringan dan stylish', image: images[2 % images.length] },
  ]);
  useEffect(() => { (async () => { try { const v = await kvStore.get('landing_katalog'); if (Array.isArray(v)) setKatalog(v as any); } catch {} })(); const s = kvStore.subscribe('landing_katalog', (v)=>{ try { if (Array.isArray(v)) setKatalog(v as any); } catch {} }); return () => { try { s.unsubscribe(); } catch {} } }, []);
  // Resolve katalog imageKey -> object URL map
  const [katalogUrls, setKatalogUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let mounted = true;
    (async () => {
      const keys = Array.from(new Set(katalog.map(k => k.imageKey).filter(Boolean) as string[]));
      if (keys.length === 0) { setKatalogUrls({}); return; }
      const urls = await getObjectUrls(keys);
      if (mounted) setKatalogUrls(urls);
    })();
    return () => { mounted = false; };
  }, [JSON.stringify(katalog.map(k => k.imageKey))]);
  const [testimonials, setTestimonials] = useState<{ name: string; quote: string }[]>([
    { name: 'Pelanggan #1', quote: 'Respon cepat, hasil jahit rapi, pengiriman tepat waktu.' },
    { name: 'Pelanggan #2', quote: 'Kualitas premium dan pelayanan ramah.' },
  ]);
  useEffect(() => { (async () => { try { const v = await kvStore.get('landing_testimonials'); if (Array.isArray(v)) setTestimonials(v as any); } catch {} })(); const s = kvStore.subscribe('landing_testimonials', (v)=>{ try { if (Array.isArray(v)) setTestimonials(v as any); } catch {} }); return () => { try { s.unsubscribe(); } catch {} } }, []);
  const [prices, setPrices] = useState<{ name: string; price: string; description?: string }[]>([
    { name: 'Varsity', price: 'Mulai 250K', description: 'Free konsultasi desain' },
    { name: 'Hoodie', price: 'Mulai 200K', description: 'Minimal order fleksibel' },
    { name: 'Coach', price: 'Mulai 230K', description: 'Harga transparan' },
  ]);
  useEffect(() => { (async () => { try { const v = await kvStore.get('landing_prices'); if (Array.isArray(v)) setPrices(v as any); } catch {} })(); const s = kvStore.subscribe('landing_prices', (v)=>{ try { if (Array.isArray(v)) setPrices(v as any); } catch {} }); return () => { try { s.unsubscribe(); } catch {} } }, []);
  const [gallery, setGallery] = useState<string[]>(images);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const keys = (await kvStore.get('landing_gallery_keys')) as string[] | null;
        if (Array.isArray(keys) && keys.length) {
          const urlsMap = await getObjectUrls(keys);
          const ordered = keys.map(k => urlsMap[k]).filter(Boolean);
          if (live) setGallery(ordered);
        }
      } catch {}
    })();
    const sub = kvStore.subscribe('landing_gallery_keys', async (v) => {
      try {
        const keys = Array.isArray(v) ? (v as string[]) : [];
        if (keys.length) {
          const urlsMap = await getObjectUrls(keys);
          const ordered = keys.map(k => urlsMap[k]).filter(Boolean);
          if (live) setGallery(ordered);
        } else if (live) {
          setGallery(images);
        }
      } catch {}
    });
    return () => { live = false; try { sub.unsubscribe(); } catch {} };
  }, []);
  const [socials, setSocials] = useState<typeof SOCIAL_LINKS>(SOCIAL_LINKS);
  useEffect(() => { (async () => { try { const v = await kvStore.get('landing_social_links'); if (v && typeof v === 'object') setSocials(v as any); } catch {} })(); const s = kvStore.subscribe('landing_social_links', (v)=>{ try { if (v && typeof v === 'object') setSocials(v as any); } catch {} }); return () => { try { s.unsubscribe(); } catch {} } }, []);
  // Company address and Google Maps link
  const addressText = 'Jalan Langensuryo KT II/176, Panembahan, Kecamatan Kraton, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55131, Indonesia';
  const addressMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
  // Gallery carousel index (show 4 at a time)
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryNext = () => setGalleryIndex(i => (gallery.length ? (i + 1) % gallery.length : 0));
  const galleryPrev = () => setGalleryIndex(i => (gallery.length ? (i - 1 + gallery.length) % gallery.length : 0));
  // Katalog carousel: one row only with arrows
  const isSmUp = useMediaQuery('(min-width:600px)');
  const isMdUp = useMediaQuery('(min-width:900px)');
  const katalogVisible = Math.max(1, Math.min(katalog.length, isMdUp ? 4 : isSmUp ? 3 : 2));
  const [katalogIndex, setKatalogIndex] = useState(0);
  const katalogNext = () => setKatalogIndex(i => (katalog.length ? (i + 1) % katalog.length : 0));
  const katalogPrev = () => setKatalogIndex(i => (katalog.length ? (i - 1 + katalog.length) % katalog.length : 0));
  // Testimonials carousel: one row with arrows
  const testimonialVisible = Math.max(1, Math.min(testimonials.length, isMdUp ? 2 : 1));
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonialNext = () => setTestimonialIndex(i => (testimonials.length ? (i + 1) % testimonials.length : 0));
  const testimonialPrev = () => setTestimonialIndex(i => (testimonials.length ? (i - 1 + testimonials.length) % testimonials.length : 0));

  const menuItems = useMemo<{ label: string; id: string }[]>(
    () => [
      { label: 'Katalog Produk', id: 'katalog' },
      { label: 'Testimoni Produk', id: 'testimoni' },
      { label: 'Price List', id: 'price' },
      { label: 'Galeri', id: 'galeri' },
    ],
    []
  );

  return (
    <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', color: '#111827' }}>
      {/* Navbar */}
  <AppBar position="sticky" elevation={0} sx={{ color: 'white' }} className="glass">
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src="/logo-sakura.png"
              alt={BRAND.name}
              sx={{ height: { xs: 40, md: 48 }, width: 'auto', cursor: 'pointer' }}
              onClick={() => navigate('/landing')}
            />
          </Box>
          {/* Desktop menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            {menuItems.map((m: { label: string; id: string }) => (
              <Box key={m.id}>
                <NavLink label={m.label} targetId={m.id} />
              </Box>
            ))}
            <Button
              color="inherit"
              endIcon={<KeyboardArrowDownIcon />}
              onClick={(e: React.MouseEvent<HTMLElement>) => setContactAnchor(e.currentTarget)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Hubungi Kami
            </Button>
            <Menu anchorEl={contactAnchor} open={isContactOpen} onClose={() => setContactAnchor(null)}>
              <MenuItem component="a" href={socials.instagram} target="_blank" rel="noreferrer">
                <InstagramIcon fontSize="small" sx={{ mr: 1 }} /> Instagram
              </MenuItem>
              <MenuItem component="a" href={socials.facebook} target="_blank" rel="noreferrer">
                <FacebookIcon fontSize="small" sx={{ mr: 1 }} /> Facebook
              </MenuItem>
              <MenuItem component="a" href={socials.whatsapp} target="_blank" rel="noreferrer">
                <WhatsAppIcon fontSize="small" sx={{ mr: 1 }} /> WhatsApp
              </MenuItem>
              <MenuItem component="a" href={socials.tiktok} target="_blank" rel="noreferrer">
                <MusicNoteIcon fontSize="small" sx={{ mr: 1 }} /> TikTok
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                navigate(isAuthRef.current ? '/' : '/login');
              }}
              sx={{ ml: 1 }}
            >
              Masuk
            </Button>
          </Box>

          {/* Mobile button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton size="large" color="inherit" onClick={(e: React.MouseEvent<HTMLElement>) => setMobileAnchor(e.currentTarget)}>
              <MenuIcon />
            </IconButton>
            <Menu anchorEl={mobileAnchor} open={isMobileMenuOpen} onClose={() => setMobileAnchor(null)}>
              {menuItems.map((m: { label: string; id: string }) => (
                <MenuItem key={m.id} onClick={() => { setMobileAnchor(null); const el = document.getElementById(m.id); el?.scrollIntoView({ behavior: 'smooth' }); }}>
                  {m.label}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={(e: React.MouseEvent<HTMLElement>) => setContactAnchor(e.currentTarget)}>
                Hubungi Kami
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setMobileAnchor(null); navigate(isAuthRef.current ? '/' : '/login'); }}>Masuk</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero + Slider (4:5) */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 5' }}>
          {images.map((src, i) => (
            <Box
              key={src}
              component="img"
              src={src}
              alt={`slide-${i}`}
              sx={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: index === i ? 1 : 0,
                transition: 'opacity 800ms ease',
              }}
            />
          ))}
          {/* Overlays */}
          <Box className="heroGradient" />
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)' }} />
          <Container sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'white' }}>
              <Typography variant="h3" fontWeight={800} gutterBottom className="gradient-text">
                {BRAND.tagline}
              </Typography>
              <Typography variant="h6" sx={{ maxWidth: 720, opacity: 0.95, mx: 'auto' }}>
                Sakura Konveksi adalah produsen pakaian custom satuan kualitas premium. Sekarang Kamu bisa PESAN PAKAIAN CUSTOM TANPA MINIMAL ORDER
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'center' }} className="fadeSlide">
                <Button
                  variant="contained"
                  color="primary"
                  component="a"
                  href={socials.whatsapp}
                  className="neon-btn"
                >
                  Mulai Pesan
                </Button>
                <Button variant="outlined" color="inherit" onClick={() => document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' })} className="neon-btn">
                  Lihat Katalog
                </Button>
              </Box>
            </Box>
          </Container>
          {/* Controls: dots */}
          <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
            {images.map((_, i) => (
              <Box key={i} onClick={() => goTo(i)} className={`dot ${index === i ? 'active' : ''}`} sx={{ width: 10, height: 10, borderRadius: '50%', cursor: 'pointer', bgcolor: index === i ? 'white' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </Box>

          {/* Controls: arrows */}
          <IconButton aria-label="Sebelumnya" onClick={prev} sx={{
            position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)',
            color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }, boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
            zIndex: 2
          }}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton aria-label="Berikutnya" onClick={next} sx={{
            position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
            color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }, boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
            zIndex: 2
          }}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Sections */}
      <Container sx={{ py: 8 }}>
        <Box id="katalog" sx={{ py: 6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Katalog Produk
          </Typography>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Pilih kategori jaket favorit Anda. Hubungi kami untuk sample dan harga grosir.
          </Typography>
          <Box sx={{ position: 'relative' }}>
            {katalog.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Katalog belum tersedia.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${katalogVisible}, 1fr)`, gap: 2 }} className="fadeSlide">
                {Array.from({ length: katalogVisible }).map((_, idx) => {
                  const item = katalog[(katalogIndex + idx) % katalog.length];
                  const fallbackImg = images[(katalogIndex + idx) % images.length];
                  const src = item.image || (item.imageKey ? katalogUrls[item.imageKey] : undefined) || fallbackImg;
                  return (
                    <Box key={`${item.title}-${idx}`} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 1, bgcolor: 'background.paper' }} className="elevate-card">
                      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 5' }}>
                        <Box component="img" src={src} alt={item.title} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Box sx={{ p: 2 }}>
                        <Typography fontWeight={700}>{item.title}</Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            {katalog.length > 1 && (
              <>
                <IconButton aria-label="Sebelumnya" onClick={katalogPrev} sx={{
                  position: 'absolute', top: '50%', left: -6, transform: 'translateY(-50%)',
                  color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}>
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton aria-label="Berikutnya" onClick={katalogNext} sx={{
                  position: 'absolute', top: '50%', right: -6, transform: 'translateY(-50%)',
                  color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}>
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box id="testimoni" sx={{ py: 6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Testimoni Produk
          </Typography>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Cerita dari pelanggan yang puas dengan hasil produksi kami.
          </Typography>
          <Box sx={{ position: 'relative' }}>
            {testimonials.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Belum ada testimoni.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${testimonialVisible}, 1fr)`, gap: 2 }} className="fadeSlide">
                {Array.from({ length: testimonialVisible }).map((_, idx) => {
                  const t = testimonials[(testimonialIndex + idx) % testimonials.length];
                  return (
                    <Box key={`${t.name}-${idx}`} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }} className="elevate-card">
                      <Typography fontWeight={700}>{t.name}</Typography>
                      <Typography variant="body2" color="text.secondary">“{t.quote}”</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
            {testimonials.length > 1 && (
              <>
                <IconButton aria-label="Sebelumnya" onClick={testimonialPrev} sx={{
                  position: 'absolute', top: '50%', left: -6, transform: 'translateY(-50%)',
                  color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}>
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton aria-label="Berikutnya" onClick={testimonialNext} sx={{
                  position: 'absolute', top: '50%', right: -6, transform: 'translateY(-50%)',
                  color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}>
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box id="price" sx={{ py: 6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Price List
          </Typography>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Estimasi harga per item (harga dapat menyesuaikan desain dan jumlah).
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            {prices.map((p) => (
              <Box key={p.name} sx={{ p: 3, borderRadius: 2, bgcolor: '#0f172a', color: 'white' }}>
                <Typography fontWeight={800}>{p.name}</Typography>
                <Typography variant="h5" fontWeight={900}>{p.price}</Typography>
                {p.description && <Typography variant="body2" sx={{ opacity: 0.9 }}>{p.description}</Typography>}
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box id="galeri" sx={{ py: 6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Galeri
          </Typography>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Dokumentasi produksi dan hasil jadi dari projek terbaru.
          </Typography>
          <Box sx={{ position: 'relative' }}>
            {gallery.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Belum ada foto galeri.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1 }} className="fadeSlide">
                {Array.from({ length: Math.min(4, gallery.length) }).map((_, idx) => {
                  const src = gallery[(galleryIndex + idx) % gallery.length];
                  return (
                    <Box key={`${src}-${idx}`} sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', borderRadius: 1, overflow: 'hidden' }}>
                      <Box component="img" src={src} alt={`galeri-${(galleryIndex + idx) % gallery.length}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  );
                })}
              </Box>
            )}
            {/* Gallery arrows */}
            {gallery.length > 1 && (
              <>
                <IconButton aria-label="Sebelumnya" onClick={galleryPrev} sx={{
                  position: 'absolute', top: '50%', left: -6, transform: 'translateY(-50%)',
                  color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}>
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton aria-label="Berikutnya" onClick={galleryNext} sx={{
                  position: 'absolute', top: '50%', right: -6, transform: 'translateY(-50%)',
                  color: 'white', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}>
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
      </Container>

      <Box sx={{ bgcolor: '#0f172a', color: 'white', py: 4, mt: 4 }}>
        <Container sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Alamat: {' '}
              <Box
                component="a"
                href={addressMapLink}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                {addressText}
              </Box>
            </Typography>
          </Box>
          <Box>
            <Button color="inherit" component="a" href={socials.whatsapp} target="_blank" sx={{ textTransform: 'none' }}>
              Hubungi via WhatsApp
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
