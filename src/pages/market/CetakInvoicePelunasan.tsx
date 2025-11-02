import { Box, Button, Paper, Stack, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import kvStore from "../../lib/kvStore";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useMemo, useRef, useState } from "react";

function formatIDR(n: number): string {
  try { return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); } catch { return `Rp ${Math.round(n)}`; }
}

export default function CetakInvoicePelunasan() {
  const [invoiceNoQuery, setInvoiceNoQuery] = useState("");
  const [nominalOngkir, setNominalOngkir] = useState("");
  const [record, setRecord] = useState<any | null>(null);
  const [ready, setReady] = useState(false);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const ongkirRef = useRef<HTMLInputElement | null>(null);
  const invRef = useRef<HTMLInputElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);

  const COMPANY_ADDR = "Jalan Langensuryo KT II/176, Panembahan, Kecamatan Kraton, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55131, Indonesia";
  const COMPANY_PHONE = "082245081126";

  const cleanNumber = (s: string) => {
    const n = Number(String(s || "").replace(/[^\d.-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  // Prevent app shell hotkeys from stealing focus when typing in inputs
  const stopFormHotkeys = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    const isEditable = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || (t as any).isContentEditable);
    if (!isEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') return;
    e.stopPropagation();
  };

  // Keep focus and caret inside the active input
  const ensureFocus = (ref: React.RefObject<HTMLInputElement | null>) => {
    queueMicrotask(() => {
      const el = ref.current;
      if (!el) return;
      if (document.activeElement !== el) {
        el.focus({ preventScroll: true });
      }
      const len = el.value?.length ?? 0;
      try { el.setSelectionRange?.(len, len); } catch {}
    });
  };

  const fetchRecord = () => {
    (async () => {
      try {
        let map: Record<string, any> = {};
        try {
          const raw = await (kvStore.get as any)('invoice_records');
          map = raw && typeof raw === 'object' ? raw : (raw ? JSON.parse(String(raw)) : {});
        } catch {}
        const rec = map[invoiceNoQuery];
        if (!rec) {
          alert('Nomor invoice tidak ditemukan.');
          setRecord(null);
          setReady(false);
          return;
        }
        setRecord(rec);
        setReady(true);
      } catch {
        alert('Gagal membaca data invoice.');
        setRecord(null);
        setReady(false);
      }
    })();
  };

  const rows = useMemo(() => {
    const arr: Array<{ name: string; nominal: number }> = [];
    if (record) {
      const kekurangan = Math.max((record.total || 0) - (record.nominalTransaksi || 0), record.kekurangan || 0);
      const kek = record.kekurangan != null ? record.kekurangan : kekurangan;
      if (kek > 0) arr.push({ name: 'Kekurangan Pembayaran', nominal: kek });
    }
    const ongkir = cleanNumber(nominalOngkir);
    if (ongkir > 0) arr.push({ name: 'Ongkir', nominal: ongkir });
    return arr;
  }, [record, nominalOngkir]);

  const total = rows.reduce((s, r) => s + r.nominal, 0);

  const generatePdf = async (openInNewTab: boolean) => {
    if (!pageRef.current || !ready || rows.length === 0) return;
    const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH, undefined, "FAST");
    const fname = `invoice-pelunasan-${invoiceNoQuery || Date.now()}.pdf`;
    if (openInNewTab) {
      const url = pdf.output("bloburl");
      window.open(url, "_blank");
    } else {
      pdf.save(fname);
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      <Typography sx={{ minWidth: 160 }}>{label}</Typography>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Stack>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Cetak Invoice Pelunasan</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2 }}>
          <Box>
            <Paper sx={{ p: 2 }} onKeyDownCapture={stopFormHotkeys} onKeyUpCapture={stopFormHotkeys} ref={paperRef}>
              <Field label="Nomor Invoice DP/DPL">
                <TextField
                  fullWidth size="small"
                  value={invoiceNoQuery}
                  onChange={(e) => { setInvoiceNoQuery(e.target.value); ensureFocus(invRef); }}
                  placeholder="cth: 00015"
                  onKeyDown={(e) => { if (!(e.metaKey || e.ctrlKey || e.altKey)) { e.stopPropagation(); ensureFocus(invRef); } }}
                  inputRef={invRef}
                />
              </Field>
              <Field label="Nominal Ongkir">
                <TextField
                  fullWidth size="small"
                  value={nominalOngkir}
                  onChange={(e) => { setNominalOngkir(e.target.value); ensureFocus(ongkirRef); }}
                  placeholder="cth: 20000"
                  type="text"
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  onKeyDown={(e) => { if (!(e.metaKey || e.ctrlKey || e.altKey)) { e.stopPropagation(); ensureFocus(ongkirRef); } }}
                  inputRef={ongkirRef}
                />
              </Field>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="contained" onClick={fetchRecord}>Cek Kekurangan Pembayaran</Button>
                {ready && rows.length > 0 && (
                  <>
                    <Button variant="outlined" onClick={() => generatePdf(true)}>Buka PDF</Button>
                    <Button variant="outlined" onClick={() => generatePdf(false)}>Unduh PDF</Button>
                  </>
                )}
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Box>

      {ready && (
      <Box ref={pageRef} className="invoice-page" sx={{ maxWidth: 900, mx: 'auto', p: 2, background: '#fff', color: '#000', borderRadius: 1, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '2px solid #000', pb: 1, mb: 1 }}>
          <Box sx={{ width: 120, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo-sakura.png" alt="Sakura Konveksi" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>SAKURA KONVEKSI</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{COMPANY_ADDR}</Typography>
            <Typography variant="body2">Telp/WA: {COMPANY_PHONE}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>NOTA INVOICE PELUNASAN</Typography>
            <Typography variant="body2">Ref: {invoiceNoQuery || '-'}</Typography>
            <Typography variant="body2">{new Date().toLocaleString('id-ID')}</Typography>
          </Box>
        </Box>

        {record && (
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Nama Konsumen</Typography>
              <Typography variant="body2">{record.namaKonsumen || '-'}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Nama Instansi</Typography>
              <Typography variant="body2">{record.namaInstansi || '-'}</Typography>
            </Box>
          </Box>
        )}

        <TableContainer>
          <Table size="small" sx={{ border: '1px solid #000', '& td, & th': { color: '#000' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nama Item</TableCell>
                <TableCell align="right" sx={{ width: 200, fontWeight: 700 }}>Nominal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 4, color: '#666' }}>Belum ada data. Isi form dan klik cek.</TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell align="right">{formatIDR(r.nominal)}</TableCell>
                  </TableRow>
                ))
              )}
              <TableRow>
                <TableCell align="right" sx={{ fontWeight: 800, borderTop: '2px solid #000' }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, borderTop: '2px solid #000' }}>{formatIDR(total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      )}
    </Box>
  );
}
