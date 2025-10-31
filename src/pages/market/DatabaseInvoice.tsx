import { Box, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';

function formatIDR(n: number): string {
  try { return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); } catch { return `Rp ${Math.round(n)}`; }
}

interface InvoiceRow { qty: number; name: string; price: number; nominal: number }
interface InvoiceRecord {
  no: string;
  jenis: string;
  rows?: InvoiceRow[];
  total: number;
  nominalTransaksi: number;
  kekurangan: number;
  ongkir?: number;
  namaKonsumen?: string;
  namaInstansi?: string;
  date?: string;
}

export default function DatabaseInvoice() {
  const [data, setData] = useState<InvoiceRecord[]>([]);
  const [selected, setSelected] = useState<InvoiceRecord | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const COMPANY_ADDR = "Jalan Langensuryo KT II/176, Panembahan, Kecamatan Kraton, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55131, Indonesia";
  const COMPANY_PHONE = "082245081126";

  useEffect(() => {
    try {
      const raw = localStorage.getItem('invoice_records');
      const map = raw ? JSON.parse(raw) : {} as Record<string, InvoiceRecord>;
      const arr: InvoiceRecord[] = Object.values(map || {});
      arr.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
      setData(arr);
    } catch {
      setData([]);
    }
  }, []);

  const openOrDownload = async (rec: InvoiceRecord, openInNewTab: boolean) => {
    setSelected(rec);
    // wait a tick to render the preview DOM
    setTimeout(async () => {
      if (!pageRef.current) return;
      const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const imgW = pageW; const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH, undefined, 'FAST');
      const fname = `invoice-${rec.no}.pdf`;
      if (openInNewTab) {
        const url = pdf.output('bloburl');
        window.open(url, '_blank');
      } else {
        pdf.save(fname);
      }
    }, 0);
  };

  const rowsToRender: InvoiceRow[] = useMemo(() => {
    if (!selected) return [];
    if (selected.rows && selected.rows.length) return selected.rows;
    // Fallback for older records: show Total Barang and Ongkir
    const arr: InvoiceRow[] = [];
    const ongkir = Number(selected.ongkir || 0);
    const totalBarang = Math.max(Number(selected.total || 0) - ongkir, 0);
    if (totalBarang > 0) arr.push({ qty: 1, name: 'Total Barang', price: totalBarang, nominal: totalBarang });
    if (ongkir > 0) arr.push({ qty: 1, name: 'Ongkir', price: ongkir, nominal: ongkir });
    return arr;
  }, [selected]);

  const totalNominal = rowsToRender.reduce((s, r) => s + r.nominal, 0);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Database Invoice</Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>No Invoice</TableCell>
              <TableCell>Tanggal</TableCell>
              <TableCell>Jenis</TableCell>
              <TableCell>Nama Konsumen</TableCell>
              <TableCell>Nama Instansi</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Nominal Transaksi</TableCell>
              <TableCell align="right">Kekurangan</TableCell>
              <TableCell align="right">Ongkir</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3, color: '#666' }}>Belum ada invoice tersimpan.</TableCell>
              </TableRow>
            ) : (
              data.map((rec) => (
                <TableRow key={rec.no} hover>
                  <TableCell>{rec.no}</TableCell>
                  <TableCell>{rec.date ? new Date(rec.date).toLocaleString('id-ID') : '-'}</TableCell>
                  <TableCell>{rec.jenis || '-'}</TableCell>
                  <TableCell>{rec.namaKonsumen || '-'}</TableCell>
                  <TableCell>{rec.namaInstansi || '-'}</TableCell>
                  <TableCell align="right">{formatIDR(rec.total || 0)}</TableCell>
                  <TableCell align="right">{formatIDR(rec.nominalTransaksi || 0)}</TableCell>
                  <TableCell align="right">{formatIDR(rec.kekurangan || 0)}</TableCell>
                  <TableCell align="right">{formatIDR(rec.ongkir || 0)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" onClick={() => openOrDownload(rec, true)} title="Buka PDF"><OpenInNewIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => openOrDownload(rec, false)} title="Unduh PDF"><DownloadIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Hidden printable invoice for the selected record */}
      {selected && (
        <Box ref={pageRef} sx={{ position: 'absolute', left: -99999, top: -99999, width: 900, p: 2, background: '#fff', color: '#000' }}>
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
              <Typography variant="body2">No: {selected.no}</Typography>
              <Typography variant="body2">{selected.date ? new Date(selected.date).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')}</Typography>
              <Typography variant="body2">Jenis: {selected.jenis || '-'}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Nama Konsumen</Typography>
              <Typography variant="body2">{selected.namaKonsumen || '-'}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Nama Instansi</Typography>
              <Typography variant="body2">{selected.namaInstansi || '-'}</Typography>
            </Box>
          </Box>
          <Table size="small" sx={{ border: '1px solid #000', '& td, & th': { color: '#000' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 120, fontWeight: 700, borderRight: '1px solid #000' }}>Jumlah Item</TableCell>
                <TableCell sx={{ fontWeight: 700, borderRight: '1px solid #000' }}>Nama Item</TableCell>
                <TableCell align="right" sx={{ width: 160, fontWeight: 700, borderRight: '1px solid #000' }}>Harga Satuan</TableCell>
                <TableCell align="right" sx={{ width: 180, fontWeight: 700 }}>Nominal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rowsToRender.map((r, i) => (
                <TableRow key={i}>
                  <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>{r.qty}</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #eee' }}>{r.name}</TableCell>
                  <TableCell align="right" sx={{ borderRight: '1px solid #eee' }}>{formatIDR(r.price)}</TableCell>
                  <TableCell align="right">{formatIDR(r.nominal)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 800, borderTop: '2px solid #000' }}>Total Nominal Transaksi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, borderTop: '2px solid #000' }}>{formatIDR(totalNominal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 700, borderTop: '1px solid #000' }}>Nominal Transaksi {selected.jenis || '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, borderTop: '1px solid #000' }}>{formatIDR(selected.nominalTransaksi || 0)}</TableCell>
              </TableRow>
              {(selected.kekurangan || 0) > 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 700 }}>Kekurangan Pembayaran</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatIDR(selected.kekurangan || 0)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
