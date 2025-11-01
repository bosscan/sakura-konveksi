import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

// Lightweight camera-based barcode/QR scanner using the Web Barcode Detector API.
// Falls back to manual entry if the API or camera is not available.

export type BarcodeScanButtonProps = {
  onDetected: (code: string) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
  dialogTitle?: string;
};

export default function BarcodeScanButton({ onDetected, label = 'Scan', size = 'small', variant = 'outlined', disabled, dialogTitle = 'Scan Barcode / QR' }: BarcodeScanButtonProps) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);

  const stop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const s = streamRef.current; streamRef.current = null;
    if (s) s.getTracks().forEach((t) => t.stop());
  }, []);

  const close = useCallback(() => { setOpen(false); }, []);

  const loop = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return;
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (Array.isArray(barcodes) && barcodes.length > 0) {
        const raw = String(barcodes[0]?.rawValue || '').trim();
        if (raw) {
          stop();
          setOpen(false);
          onDetected(raw);
          return;
        }
      }
    } catch {}
    rafRef.current = requestAnimationFrame(loop);
  }, [onDetected, stop]);

  const openScanner = useCallback(async () => {
    try {
      // @ts-ignore
      const Supported = typeof window !== 'undefined' && (window as any).BarcodeDetector;
      if (!Supported) { alert('Scanner tidak didukung di browser ini. Silakan ketik ID SPK secara manual.'); return; }
      // @ts-ignore
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      const formats = ['qr_code','code_128','code_39','ean_13','ean_8','upc_a','upc_e','itf','codabar','data_matrix','pdf417','aztec'];
      detectorRef.current = new BarcodeDetectorCtor({ formats });

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setOpen(true);
      // Wait dialog to render video
      setTimeout(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().then(() => { rafRef.current = requestAnimationFrame(loop); }).catch(() => { /* no-op */ });
      }, 50);
    } catch (e) {
      alert('Tidak bisa mengakses kamera. Pastikan izin kamera diberikan.');
    }
  }, [loop]);

  useEffect(() => { return () => { stop(); }; }, [stop]);

  return (
    <>
      <Button size={size} variant={variant} onClick={openScanner} startIcon={<CameraAltIcon />} disabled={disabled} sx={{ whiteSpace: 'nowrap' }}>{label}</Button>
      <Dialog open={open} onClose={() => { stop(); close(); }} maxWidth="xs" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', background: '#000', borderRadius: 1, overflow: 'hidden' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '2px dashed rgba(255,255,255,0.7)', m: 2, borderRadius: 1 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { stop(); close(); }} color="inherit">Tutup</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
