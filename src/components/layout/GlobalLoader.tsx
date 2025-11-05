import { Backdrop, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import LoadingBus from '../../lib/loadingBus';

// Global overlay loader: shows a spinner whenever there are in-flight kvStore.get calls.
export default function GlobalLoader() {
  const [open, setOpen] = useState(false);
  // Optional small delay to avoid flicker on very fast requests
  useEffect(() => {
    let isMounted = true;
    let showTimer: any = null;
    const sub = LoadingBus.subscribe((count) => {
      if (!isMounted) return;
      if (count > 0) {
        // wait ~150ms before showing to avoid flashing
        if (showTimer) return;
        showTimer = setTimeout(() => { setOpen(true); }, 150);
      } else {
        if (showTimer) { clearTimeout(showTimer); showTimer = null; }
        setOpen(false);
      }
    });
    return () => { isMounted = false; if (showTimer) clearTimeout(showTimer); try { sub.unsubscribe(); } catch {} };
  }, []);

  return (
    <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }} open={open}>
      <CircularProgress color="inherit" thickness={5} />
    </Backdrop>
  );
}
