import { Box, Button, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import kvStore from "../../lib/kvStore";

function formatIDR(n: number): string {
  try { return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); } catch { return `Rp ${Math.round(n)}`; }
}

const DEFAULT_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  jenis_produk: [
    { value: "JAKET", label: "JAKET" },
    { value: "PDH_PDL", label: "PDH/PDL" },
    { value: "SAFETY", label: "SAFETY" },
    { value: "TACTICAL", label: "TACTICAL" },
    { value: "KAOS", label: "KAOS" },
    { value: "POLO", label: "POLO" },
    { value: "CELANA_PANJANG", label: "CELANA PANJANG" },
    { value: "CEK_CATATAN", label: "CEK CATATAN" },
    { value: "ROMPI", label: "ROMPI" },
  ],
  jenis_pola: [
    { value: "KAOS", label: "KAOS" },
    { value: "POLO", label: "POLO" },
    { value: "PDH", label: "PDH" },
    { value: "TACTICAL_KJ", label: "TACTICAL KJ" },
    { value: "TACTICAL_PLANTERS", label: "TACTICAL PLANTERS" },
    { value: "SAFETY", label: "SAFETY" },
    { value: "PETROSEA", label: "PETROSEA" },
    { value: "BERAU", label: "BERAU" },
    { value: "ADARO", label: "ADARO" },
    { value: "PAMA", label: "PAMA" },
    { value: "KPC_2_WARNA", label: "KPC 2 WARNA" },
    { value: "GRASBERG", label: "GRASBERG" },
    { value: "JEANS", label: "JEANS" },
    { value: "CARGO", label: "CARGO" },
    { value: "SOLIDARITAS", label: "SOLIDARITAS" },
    { value: "CEK_CATATAN", label: "CEK CATATAN" },
    { value: "ROMPI", label: "ROMPI" },
  ],
  jenis_transaksi: [
    { value: "DP", label: "DP" },
    { value: "DPL", label: "DPL" },
    { value: "PELUNASAN", label: "Pelunasan" },
  ],
};

type ItemForm = { produk: string; pola: string; qty: string; price?: string; nominal?: string };

export default function CetakInvoice() {
  const [items, setItems] = useState<ItemForm[]>([{ produk: "", pola: "", qty: "1", price: "", nominal: "" }]);
  const [jenisTransaksi, setJenisTransaksi] = useState("DP");
  const [nominalTransaksi, setNominalTransaksi] = useState<string>("");
  const [namaKonsumen, setNamaKonsumen] = useState<string>("");
  const [namaInstansi, setNamaInstansi] = useState<string>("");
  const [nominalOngkir, setNominalOngkir] = useState<string>("");
  const COMPANY_ADDR = "Jalan Langensuryo KT II/176, Panembahan, Kecamatan Kraton, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55131, Indonesia";
  const COMPANY_PHONE = "082245081126";
  const [ready, setReady] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const pageRef = useRef<HTMLDivElement | null>(null);
  // const barangRef = useRef<HTMLInputElement | null>(null);
  const ongkirRef = useRef<HTMLInputElement | null>(null);
  const nominalTransaksiRef = useRef<HTMLInputElement | null>(null);
  const konsumenRef = useRef<HTMLInputElement | null>(null);
  const instansiRef = useRef<HTMLInputElement | null>(null);
  const qtyRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const priceRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const pointerDownRef = useRef(false);
  const lastKeyRef = useRef<string | null>(null);
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const stopFormHotkeys = (e: React.KeyboardEvent) => {
    // Stop semua hotkey global ketika fokus berada di elemen editable
    const t = e.target as HTMLElement | null;
    const isEditable = !!t && (
      t.tagName === 'INPUT' ||
      t.tagName === 'TEXTAREA' ||
      (t as any).isContentEditable
    );
    if (!isEditable) return;
    // Biarkan kombinasi shortcut (Cmd/Ctrl/Alt) tetap bekerja, dan allow Tab/Enter/Escape
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') return;
    // Untuk semua tombol biasa (huruf, angka, spasi, dll) tahan agar tidak naik ke App shell
    e.stopPropagation();
  };

  // Global capture-phase guard to stop App shell hotkeys while typing in inputs
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      const isEditable = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || (t as any).isContentEditable);
      if (!isEditable) return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.key === 'Tab' || ev.key === 'Enter' || ev.key === 'Escape') return;
      ev.stopPropagation();
    };
    const keydownTrack = (ev: KeyboardEvent) => { lastKeyRef.current = ev.key; };
    const keyupClear = () => { lastKeyRef.current = null; };
    window.addEventListener('keydown', handler, true);
    window.addEventListener('keyup', handler, true);
    window.addEventListener('keypress', handler, true);
    window.addEventListener('keydown', keydownTrack, true);
    window.addEventListener('keyup', keyupClear, true);
    const focusGuard = (ev: FocusEvent) => {
      // Jika fokus keluar dari panel form tanpa klik/Tab/Enter/Escape, kembalikan fokus ke input aktif
      const allowKeys = new Set(['Tab','Enter','Escape']);
      const target = ev.target as Node | null;
      if (!paperRef.current || !activeInputRef.current) return;
      const leavingPanel = target && !paperRef.current.contains(target);
      if (leavingPanel && !pointerDownRef.current && !allowKeys.has(lastKeyRef.current || '')) {
        setTimeout(() => {
          try { activeInputRef.current?.focus({ preventScroll: true }); } catch {}
        }, 0);
      }
    };
    window.addEventListener('focusin', focusGuard, true);
    return () => {
      window.removeEventListener('keydown', handler, true as any);
      window.removeEventListener('keyup', handler, true as any);
      window.removeEventListener('keypress', handler, true as any);
      window.removeEventListener('keydown', keydownTrack, true as any);
      window.removeEventListener('keyup', keyupClear, true as any);
      window.removeEventListener('focusin', focusGuard, true as any);
    };
  }, []);

  const cleanNumber = (s: string) => {
    const n = Number(String(s || "").replace(/[^\d.-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  // Re-focus helper to defeat external/global key handlers that may steal focus
  const ensureFocus = (ref: React.RefObject<HTMLInputElement | null>) => {
    queueMicrotask(() => {
      const el = ref.current;
      if (!el) return;
      if (document.activeElement !== el) {
        el.focus({ preventScroll: true });
      }
      // Keep caret at end after programmatic focus
      const len = el.value?.length ?? 0;
      try { el.setSelectionRange?.(len, len); } catch {}
    });
  };
  const ensureFocusIdx = (map: React.MutableRefObject<Record<number, HTMLInputElement | null>>, idx: number) => {
    queueMicrotask(() => {
      const el = map.current[idx];
      if (!el) return;
      if (document.activeElement !== el) {
        el.focus({ preventScroll: true });
      }
      const len = el.value?.length ?? 0;
      try { el.setSelectionRange?.(len, len); } catch {}
    });
  };

  // removed stopAll helper (no longer needed after switching to TextField approach)

  // removed NumericInput in favor of TextField with the same anti-jump strategy as text inputs

  const onInputData = () => {
    const hasValidItem = items.some((it) => {
      const price = cleanNumber(it.price || "");
      const qty = Math.max(1, Number(String(it.qty).replace(/\D/g, "")) || 1);
      const nominal = price > 0 ? price * qty : cleanNumber(it.nominal || "");
      return !!it.produk && nominal > 0;
    });
    if (!hasValidItem) return setReady(false);
    // Generate sequential invoice number (5 digits) starting from 00001
    (async () => {
      try {
        const key = "invoice_counter";
        const raw = await kvStore.get(key);
        const current = Math.max(0, Number(raw || 0));
        const next = current + 1;
        try { await kvStore.set(key, String(next)); } catch {}
        const formatted = String(next).padStart(5, '0');
        setInvoiceNo(formatted);
        // Persist essential invoice DP/DPL data for Pelunasan lookup
        try {
          const storeKey = 'invoice_records';
          const rawMap = await kvStore.get(storeKey);
          const map = rawMap && typeof rawMap === 'object' ? rawMap : (rawMap ? JSON.parse(String(rawMap)) : {});
          const rec = {
            no: formatted,
            jenis: jenisTransaksi,
            rows, // snapshot of item rows including Ongkir row if any
            total,
            nominalTransaksi: nominalTransaksiNum,
            kekurangan,
            ongkir: cleanNumber(nominalOngkir),
            namaKonsumen,
            namaInstansi,
            date: new Date().toISOString(),
          } as any;
          map[formatted] = rec;
          await kvStore.set(storeKey, map);
        } catch {}
      } catch {}
      setReady(true);
      // tiny debounce to ensure preview updates before print if clicked fast
      setTimeout(() => {}, 50);
    })();
  };

  const rows = useMemo(() => {
    const arr: Array<{ qty: number; name: string; price: number; nominal: number }> = [];
    // Items
    for (const it of items) {
      const nmBarang = ["Barang", it.produk || "", it.pola ? `- ${it.pola}` : ""].join(" ").replace(/\s+/g, " ").trim();
      const price = cleanNumber(it.price || "");
      const qb = Math.max(1, Number(String(it.qty).replace(/\D/g, "")) || 1);
      const nb = price > 0 ? price * qb : cleanNumber(it.nominal || "");
      const unit = price > 0 ? price : (nb > 0 ? Math.round(nb / qb) : 0);
      if (nb > 0) arr.push({ qty: qb, name: nmBarang, price: unit, nominal: nb });
    }
    const ng = cleanNumber(nominalOngkir);
    if (ng > 0) arr.push({ qty: 1, name: "Ongkir", price: ng, nominal: ng });
    return arr;
  }, [items, nominalOngkir]);

  const total = rows.reduce((s, r) => s + r.nominal, 0);
  const nominalTransaksiNum = cleanNumber(nominalTransaksi);
  const kekurangan = Math.max(total - nominalTransaksiNum, 0);

  const generatePdf = async (openInNewTab: boolean) => {
    if (!pageRef.current || !ready || rows.length === 0) return;
    const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH, undefined, "FAST");
    const fname = `invoice-${invoiceNo || Date.now()}.pdf`;
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
      {/* Controls (hidden in print) */}
      <Box sx={{ mb: 2 }}>
  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Cetak Invoice DP/DPL</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2 }}>
          <Box>
            <Paper sx={{ p: 2 }} onKeyDownCapture={stopFormHotkeys} onKeyUpCapture={stopFormHotkeys}
              onMouseDownCapture={() => { pointerDownRef.current = true; }}
              onMouseUpCapture={() => { pointerDownRef.current = false; }}
              ref={paperRef}
            >
              <Field label="Nama Konsumen">
                <TextField
                  fullWidth
                  size="small"
                  value={namaKonsumen}
                  onChange={(e) => { setNamaKonsumen(e.target.value); ensureFocus(konsumenRef); }}
                  placeholder="cth: Budi Santoso"
                  type="text"
                  onKeyDown={(e) => {
                    // Hindari hotkey global dari AppShell saat mengetik huruf
                    if (!(e.metaKey || e.ctrlKey || e.altKey)) { e.stopPropagation(); ensureFocus(konsumenRef); }
                  }}
                  inputRef={konsumenRef}
                />
              </Field>
              <Field label="Nama Instansi">
                <TextField
                  fullWidth
                  size="small"
                  value={namaInstansi}
                  onChange={(e) => { setNamaInstansi(e.target.value); ensureFocus(instansiRef); }}
                  placeholder="cth: PT Maju Mundur"
                  type="text"
                  onKeyDown={(e) => {
                    if (!(e.metaKey || e.ctrlKey || e.altKey)) { e.stopPropagation(); ensureFocus(instansiRef); }
                  }}
                  inputRef={instansiRef}
                />
              </Field>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Daftar Item Barang</Typography>
              {items.map((it, idx) => {
                const qtyRefSetter = (el: HTMLInputElement | null) => { qtyRefs.current[idx] = el; };
                const priceRefSetter = (el: HTMLInputElement | null) => { priceRefs.current[idx] = el; };
                const priceNum = cleanNumber(it.price || "");
                const qtyNum = Math.max(1, Number(String(it.qty).replace(/\D/g, "")) || 1);
                const nominalComputed = priceNum > 0 ? priceNum * qtyNum : cleanNumber(it.nominal || "");
                return (
                <Box key={idx} sx={{ mb: 1.5, p: 1, border: '1px dashed #555', borderRadius: 1 }}>
                  <Field label={`Jenis Produk #${idx + 1}`}>
                    <Select fullWidth size="small" value={it.produk} onChange={(e: SelectChangeEvent) => {
                      const v = e.target.value as string; setItems(prev => prev.map((p,i)=> i===idx? { ...p, produk: v }: p));
                    }} displayEmpty>
                      <MenuItem value="">Pilih Jenis Produk</MenuItem>
                      {(DEFAULT_OPTIONS["jenis_produk"] || []).map(o => <MenuItem key={o.value} value={o.label}>{o.label}</MenuItem>)}
                    </Select>
                  </Field>
                  <Field label={`Jenis Pola #${idx + 1}`}>
                    <Select fullWidth size="small" value={it.pola} onChange={(e: SelectChangeEvent) => {
                      const v = e.target.value as string; setItems(prev => prev.map((p,i)=> i===idx? { ...p, pola: v }: p));
                    }} displayEmpty>
                      <MenuItem value="">Pilih Jenis Pola</MenuItem>
                      {(DEFAULT_OPTIONS["jenis_pola"] || []).map(o => <MenuItem key={o.value} value={o.label}>{o.label}</MenuItem>)}
                    </Select>
                  </Field>
                  <Field label="Harga Satuan Barang">
                    <TextField
                      fullWidth
                      size="small"
                      value={it.price || ""}
                      placeholder="cth: 150000 (per unit)"
                      type="text"
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', autoComplete: 'off' }}
                      onChange={(e) => {
                        const v = (e.target as HTMLInputElement).value;
                        setItems(prev => prev.map((p,i)=> i===idx? { ...p, price: v }: p));
                        ensureFocusIdx(priceRefs, idx);
                      }}
                      onKeyDown={(e) => {
                        if (!(e.metaKey || e.ctrlKey || e.altKey)) { e.stopPropagation(); ensureFocusIdx(priceRefs, idx); }
                      }}
                      inputRef={(el) => { priceRefSetter(el); if (el) activeInputRef.current = el; }}
                      onFocus={(e) => { activeInputRef.current = e.target as HTMLInputElement; }}
                    />
                  </Field>
                  <Field label="Jumlah Item Barang">
                    <TextField
                      fullWidth
                      size="small"
                      value={it.qty}
                      placeholder="cth: 12"
                      type="text"
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', autoComplete: 'off' }}
                      onChange={(e) => {
                        const v = (e.target as HTMLInputElement).value;
                        setItems(prev => prev.map((p,i)=> i===idx? { ...p, qty: v }: p));
                        ensureFocusIdx(qtyRefs, idx);
                      }}
                      onKeyDown={(e) => {
                        if (!(e.metaKey || e.ctrlKey || e.altKey)) { e.stopPropagation(); ensureFocusIdx(qtyRefs, idx); }
                      }}
                      inputRef={(el) => { qtyRefSetter(el); if (el) activeInputRef.current = el; }}
                      onFocus={(e) => { activeInputRef.current = e.target as HTMLInputElement; }}
                    />
                  </Field>
                  <Field label="Nominal Barang (Total Baris)">
                    <TextField
                      fullWidth
                      size="small"
                      value={nominalComputed ? formatIDR(nominalComputed) : "-"}
                      disabled
                    />
                  </Field>
                  <Stack direction="row" justifyContent="flex-end">
                    {items.length > 1 && (
                      <Button color="error" size="small" onClick={() => setItems(prev => prev.filter((_,i)=> i!==idx))}>Hapus Item</Button>
                    )}
                  </Stack>
                </Box>
              )})}
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button variant="outlined" size="small" onClick={() => setItems(prev => [...prev, { produk: "", pola: "", qty: "1", price: "", nominal: "" }])}>Tambah Item</Button>
              </Stack>
              <Field label="Jenis Transaksi">
                <Select fullWidth size="small" value={jenisTransaksi} onChange={(e: SelectChangeEvent) => setJenisTransaksi(e.target.value)}>
                  {(DEFAULT_OPTIONS["jenis_transaksi"] || []).map(o => <MenuItem key={o.value} value={o.label}>{o.label}</MenuItem>)}
                </Select>
              </Field>
              <Field label="Nominal Transaksi">
                <TextField
                  fullWidth
                  size="small"
                  value={nominalTransaksi}
                  onChange={(e) => { setNominalTransaksi(e.target.value); ensureFocus(nominalTransaksiRef); }}
                  placeholder="cth: 1500000"
                  type="text"
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  onKeyDown={(e) => {
                    if (!(e.metaKey || e.ctrlKey || e.altKey)) { e.stopPropagation(); ensureFocus(nominalTransaksiRef); }
                  }}
                  inputRef={nominalTransaksiRef}
                />
              </Field>
              <Field label="Nominal Ongkir">
                <TextField
                  fullWidth
                  size="small"
                  value={nominalOngkir}
                  onChange={(e) => { setNominalOngkir(e.target.value); ensureFocus(ongkirRef); }}
                  placeholder="cth: 20000"
                  type="text"
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  onKeyDown={(e) => {
                    // Hindari hotkey global dari AppShell menangkap angka dan menggeser fokus
                    e.stopPropagation();
                    ensureFocus(ongkirRef);
                  }}
                  inputRef={ongkirRef}
                />
              </Field>
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button variant="contained" onClick={onInputData}>Input Data</Button>
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

      {/* Printable Invoice */}
      {ready && (
      <Box ref={pageRef} className="invoice-page" sx={{ maxWidth: 900, mx: 'auto', p: 2, background: '#fff', color: '#000', borderRadius: 1, boxShadow: 1 }}>
        {/* Kop nota */}
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
            <Typography variant="h6" sx={{ fontWeight: 800 }}>NOTA INVOICE</Typography>
            <Typography variant="body2">No: {invoiceNo || '-'}</Typography>
            <Typography variant="body2">{new Date().toLocaleString('id-ID')}</Typography>
            <Typography variant="body2">Jenis: {jenisTransaksi || '-'}</Typography>
          </Box>
        </Box>

        {/* Identitas konsumen */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Nama Konsumen</Typography>
            <Typography variant="body2">{namaKonsumen || '-'}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Nama Instansi</Typography>
            <Typography variant="body2">{namaInstansi || '-'}</Typography>
          </Box>
        </Box>

        {/* Tabel isi nota */}
        <TableContainer>
          <Table
            size="small"
            sx={{
              border: '1px solid #000',
              // Paksa warna teks hitam untuk mengatasi tema gelap yang membuat teks putih di atas background putih
              '& td, & th': { color: '#000' },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 120, fontWeight: 700, borderRight: '1px solid #000' }}>Jumlah Item</TableCell>
                <TableCell sx={{ fontWeight: 700, borderRight: '1px solid #000' }}>Nama Item</TableCell>
                <TableCell align="right" sx={{ width: 160, fontWeight: 700, borderRight: '1px solid #000' }}>Harga Satuan</TableCell>
                <TableCell align="right" sx={{ width: 180, fontWeight: 700 }}>Nominal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#666' }}>Belum ada data. Isi form dan klik Input Data.</TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>{r.qty}</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #eee' }}>{r.name}</TableCell>
                    <TableCell align="right" sx={{ borderRight: '1px solid #eee' }}>{formatIDR(r.price)}</TableCell>
                    <TableCell align="right">{formatIDR(r.nominal)}</TableCell>
                  </TableRow>
                ))
              )}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 800, borderTop: '2px solid #000' }}>Total Nominal Transaksi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, borderTop: '2px solid #000' }}>{formatIDR(total)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 700, borderTop: '1px solid #000' }}>Nominal Transaksi {jenisTransaksi || '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: '1px solid #000' }}>{formatIDR(nominalTransaksiNum)}</TableCell>
              </TableRow>
              {kekurangan > 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 700 }}>Kekurangan Pembayaran</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatIDR(kekurangan)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      )}
    </Box>
  );
}
