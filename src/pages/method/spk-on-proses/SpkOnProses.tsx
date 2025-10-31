import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, TextField, MenuItem, Button, Stack } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import { runAllMigrationsOnce } from '../../../lib/migrations';
import { useEffect, useRef, useState } from "react";
import TableExportToolbar from '../../../components/TableExportToolbar';

type SPKRow = {
  idRekapProduksi: string;
  idTransaksi: string;
  jumlahSpk: number;
  idSpk: string;
  idRekapCustom: string;
  idCustom: string;
  namaDesain: string;
  kuantity: number;
  statusDesain: string;
  statusKonten: string;
  tglInputPesanan: string;
  deadlineKonsumen: string;
  tglSpkTerbit: string;
  selesaiPlottingBordir?: string;
  selesaiDesainProduksi?: string;
  selesaiCuttingPola?: string;
  selesaiStockBordir?: string;
  selesaiBordir?: string;
  selesaiSetting?: string;
  selesaiStockJahit?: string;
  selesaiJahit?: string;
  selesaiFinishing?: string;
  selesaiFotoProduk?: string;
  selesaiStockNt?: string;
  selesaiPelunasan?: string;
  selesaiPengiriman?: string;
};

const selesaiFields: { key: keyof SPKRow; label: string }[] = [
  { key: "selesaiPlottingBordir", label: "Plotting Bordir" },
  { key: "selesaiDesainProduksi", label: "Desain Produksi" },
  { key: "selesaiCuttingPola", label: "Cutting Pola" },
  { key: "selesaiStockBordir", label: "Stock Bordir" },
  { key: "selesaiBordir", label: "Bordir" },
  { key: "selesaiSetting", label: "Setting" },
  { key: "selesaiStockJahit", label: "Stock Jahit" },
  { key: "selesaiJahit", label: "Jahit" },
  { key: "selesaiFinishing", label: "Finishing" },
  { key: "selesaiFotoProduk", label: "Foto Produk" },
  { key: "selesaiStockNt", label: "Stock NT" },
  { key: "selesaiPelunasan", label: "Pelunasan" },
  { key: "selesaiPengiriman", label: "Pengiriman" },
];

function getStatusPesanan(row: SPKRow) {
  for (let i = selesaiFields.length - 1; i >= 0; i--) {
    const key = selesaiFields[i].key;
    if (row[key]) {
      return `Selesai ${selesaiFields[i].label}`;
    }
  }
  return "Proses";
}

export default function SpkOnProses() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [rows, setRows] = useState<SPKRow[]>([]);
  // Format to Asia/Jakarta (GMT+7) as "HH:mm:ss dd-mm-yyyy"
  const formatWIB = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const date = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(d).replace(/\//g, '-');
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(d);
    return `${date} ${time}`;
  };

  useEffect(() => {
    // Normalize legacy localStorage data
    try { runAllMigrationsOnce(); } catch { }
    const refresh = () => {
      try {
        const qKey = 'plotting_rekap_bordir_queue';
        const pipeKey = 'spk_pipeline';
        const rbKey = 'method_rekap_bordir';
        const adKey = 'antrian_input_desain';

        const qRaw = localStorage.getItem(qKey);
        const queue: any[] = qRaw ? JSON.parse(qRaw) : [];
        const pRaw = localStorage.getItem(pipeKey);
        const pipeline: any[] = pRaw ? JSON.parse(pRaw) : [];
        const rbRaw = localStorage.getItem(rbKey);
        const rbList: any[] = rbRaw ? JSON.parse(rbRaw) : [];
        const adRaw = localStorage.getItem(adKey);
        const adList: any[] = adRaw ? JSON.parse(adRaw) : [];

        // Load additional data sources for better data mapping
        const keranjangRaw = localStorage.getItem('keranjang');
        const keranjangList: any[] = keranjangRaw ? JSON.parse(keranjangRaw) : [];
        const spkOrdersRaw = localStorage.getItem('spk_orders');
        const spkOrdersMap: Record<string, any> = spkOrdersRaw ? JSON.parse(spkOrdersRaw) : {};

        // Robust lookup helper (same strategy as PrintSPK) to tolerate whitespace/number formatting
        const robustMapGet = (mapObj: Record<string, any>, key: string) => {
          if (!mapObj || !key) return undefined;
          if (mapObj[key] != null) return mapObj[key];
          const t = key.trim();
          if (t && mapObj[t] != null) return mapObj[t];
          const num = (s: string) => (s || '').replace(/\D+/g, '');
          const nk = num(key);
          if (nk) {
            const k = Object.keys(mapObj).find((kk) => num(kk) === nk);
            if (k) return mapObj[k];
          }
          const k2 = Object.keys(mapObj).find((kk) => kk.trim().toLowerCase() === t.toLowerCase());
          return k2 ? mapObj[k2] : undefined;
        };

        const rekapDate = new Map<string, string>();
        rbList.forEach((rb) => {
          const createdAt = rb?.createdAt;
          (rb?.items || []).forEach((it: any) => {
            if (it?.idSpk && createdAt) rekapDate.set(it.idSpk, createdAt);
          });
        });

        const adMap: Record<string, any> = {};
        adList.forEach((it) => { if (it?.idSpk) adMap[it.idSpk] = it; });

        // Create mapping for keranjang data
        const keranjangMap: Record<string, any> = {};
        keranjangList.forEach((it) => { if (it?.idSpk) keranjangMap[it.idSpk] = it; });

        const byId: Record<string, SPKRow> = {};
        const parseNum = (v: any): number => {
          const n = Number(String(v ?? '').toString().replace(/[^\d-]/g, ''));
          return !isNaN(n) && n > 0 ? n : 0;
        };

        const prRaw = localStorage.getItem('production_recap_map');
        const prMap: Record<string, any> = prRaw ? JSON.parse(prRaw) : {};
        const terbitRaw = localStorage.getItem('spk_terbit_map');
        const terbitMap: Record<string, string> = terbitRaw ? JSON.parse(terbitRaw) : {};
        const format7 = (v: any) => {
          const m = String(v || '').match(/(\d{1,})/);
          return m ? String(Number(m[1])).padStart(7, '0') : '';
        };
        const getRecapId = (it: any): string => {
          if (it && it.idRekapProduksi) return format7(it.idRekapProduksi);
          const v = it?.idSpk ? prMap[it.idSpk] : undefined;
          return v ? format7(v) : '';
        };

        const pushFrom = (it: any) => {
          if (!it?.idSpk) return;
          // Get data from multiple sources with priority order
          const src = adMap[it.idSpk] || {};
          const keranjangData = keranjangMap[it.idSpk] || {};
          const spkOrderData = robustMapGet(spkOrdersMap, String(it.idSpk)) || {};

          let qty = typeof it.kuantity === 'number' && it.kuantity > 0 ? it.kuantity : parseNum(src?.quantity || spkOrderData?.quantity);
          if (!qty && Array.isArray(src?.items)) qty = src.items.length;
          if (!qty && Array.isArray(spkOrderData?.items)) qty = spkOrderData.items.length;

          // Get content from input pesanan data (antrian_input_desain.content) with fallbacks
          const konten = src?.content || spkOrderData?.content || keranjangData?.konten || it?.konten || '-';

          // Tanggal Order/Input Pesanan (harus sama dengan lembar SPK)
          const tglOrder = (
            src?.tanggalInput || spkOrderData?.tanggalInput || it?.tanggalOrder || src?.input_date || src?.inputDate || src?.createdAt || it?.tglInputPesanan || it?.tanggalInput || '-'
          );

          // Checkout time (SPK terbit) from keranjang checkout; used to compute deadline konsumen
          const tglTerbit = (it?.tglSpkTerbit || terbitMap[it.idSpk] || '-') as string;

          // Calculate deadline: prefer explicit fields, else 30 days after tanggalOrder (same as PrintSPK)
          const calculateDeadline = () => {
            const explicit = it?.deadline || it?.deadlineKonsumen || src?.deadline || spkOrderData?.deadline || keranjangData?.deadline;
            if (explicit) return explicit;
            const baseStr = tglOrder;
            if (!baseStr || baseStr === '-') return '-';
            try {
              const base = new Date(baseStr);
              if (isNaN(base.getTime())) return '-';
              const deadline = new Date(base.getTime());
              deadline.setDate(deadline.getDate() + 30);
              return deadline.toISOString();
            } catch {
              return '-';
            }
          };

          byId[it.idSpk] = {
            idRekapProduksi: getRecapId(it),
            idTransaksi: it.idTransaksi || '-',
            jumlahSpk: 1,
            idSpk: it.idSpk,
            idRekapCustom: it.idRekapCustom || it.idRekap,
            idCustom: it.idCustom,
            namaDesain: it.namaDesain,
            kuantity: qty || 0,
            statusDesain: 'Proses',
            statusKonten: konten,
            tglInputPesanan: tglOrder,
            deadlineKonsumen: calculateDeadline(),
            tglSpkTerbit: tglTerbit,
            selesaiPlottingBordir: rekapDate.get(it.idSpk) || it.selesaiPlottingBordir,
            selesaiDesainProduksi: it.selesaiDesainProduksi,
            selesaiCuttingPola: it.selesaiCuttingPola,
            selesaiStockBordir: it.selesaiStockBordir,
            selesaiBordir: it.selesaiBordir,
            selesaiSetting: it.selesaiSetting,
            selesaiStockJahit: it.selesaiStockJahit,
            selesaiJahit: it.selesaiJahit,
            selesaiFinishing: it.selesaiFinishing,
            selesaiFotoProduk: it.selesaiFotoProduk,
            selesaiStockNt: it.selesaiStockNt,
            selesaiPelunasan: it.selesaiPelunasan,
            selesaiPengiriman: it.selesaiPengiriman,
          };
        };

        (queue || []).forEach(pushFrom);
        (pipeline || []).forEach(pushFrom);

        const arr = Object.values(byId);
        const byTrx = new Map<string, number>();
        arr.forEach((r) => {
          const t = r.idTransaksi || '-';
          byTrx.set(t, (byTrx.get(t) || 0) + 1);
        });
        arr.forEach((r) => { r.jumlahSpk = byTrx.get(r.idTransaksi || '-') || 1; });
        setRows(arr);
      } catch {
        setRows([]);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if ([
        'plotting_rekap_bordir_queue',
        'spk_pipeline',
        'method_rekap_bordir',
        'antrian_input_desain',
        'spk_orders',
        'keranjang',
        'spk_terbit_map'
      ].includes(e.key || '')) refresh();
    };
    refresh();
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const statusOptions = Array.from(new Set(rows.map(getStatusPesanan)));

  const filteredRows = rows.filter((row) => {
    const statusPesanan = getStatusPesanan(row);
    const matchesStatus = statusFilter ? statusPesanan === statusFilter : true;
    const matchesSearch = search
      ? Object.values(row).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(search.toLowerCase())
      )
      : true;
    return matchesStatus && matchesSearch;
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        maxHeight: "calc(100vh - 64px)",
        overflowY: "auto",
        p: 3,
        boxSizing: "border-box",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          width: "100%",
          borderRadius: 2,
          boxShadow: 2,
          flexDirection: "column",
          p: 3,
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>
          List SPK On Proses
        </Typography>
        <Box sx={{ overflowX: 'auto', mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'nowrap', width: 'max-content' }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: 220, sm: 260, md: 380 } }}
            />
            <TextField
              label="Status Pesanan"
              variant="outlined"
              size="small"
              select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ width: { xs: 180, sm: 200, md: 240 } }}
            >
              <MenuItem value="">Semua</MenuItem>
              {statusOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ flex: 1 }} />
            <TableExportToolbar title="List SPK On Proses" tableRef={tableRef} fileBaseName="spk-on-proses" />
          </Stack>
        </Box>
        <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }}>
          <Table sx={{ minWidth: 3200 }} aria-label="spk-on-proses-table" ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID REKAP PRODUKSI</TableCell>
                <TableCell>ID TRANSAKSI</TableCell>
                <TableCell>JUMLAH SPK</TableCell>
                <TableCell>ID SPK</TableCell>
                <TableCell>PRINT SPK</TableCell>
                <TableCell>ID REKAP CUSTOM</TableCell>
                <TableCell>ID CUSTOM</TableCell>
                <TableCell>NAMA DESAIN</TableCell>
                <TableCell>KUANTITY</TableCell>
                <TableCell>STATUS DESAIN</TableCell>
                <TableCell>STATUS PESANAN</TableCell>
                <TableCell>KONTEN</TableCell>
                <TableCell>TGL INPUT PESANAN</TableCell>
                <TableCell>DEADLINE KONSUMEN</TableCell>
                <TableCell>TGL SPK TERBIT</TableCell>
                <TableCell>SELESAI PLOTTING BORDIR</TableCell>
                <TableCell>SELESAI DESAIN PRODUKSI</TableCell>
                <TableCell>SELESAI CUTTING POLA</TableCell>
                <TableCell>SELESAI STOCK BORDIR</TableCell>
                <TableCell>SELESAI BORDIR</TableCell>
                <TableCell>SELESAI SETTING</TableCell>
                <TableCell>SELESAI STOCK JAHIT</TableCell>
                <TableCell>SELESAI JAHIT</TableCell>
                <TableCell>SELESAI FINISHING</TableCell>
                <TableCell>SELESAI FOTO PRODUK</TableCell>
                <TableCell>SELESAI STOCK NT</TableCell>
                <TableCell>SELESAI PELUNASAN</TableCell>
                <TableCell>SELESAI PENGIRIMAN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.idRekapProduksi}</TableCell>
                  <TableCell>{row.idTransaksi}</TableCell>
                  <TableCell>{row.jumlahSpk}</TableCell>
                  <TableCell>{row.idSpk}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      component="a"
                      href={`/market/print-spk?idSpk=${encodeURIComponent(row.idSpk)}&mode=pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Print
                    </Button>
                  </TableCell>
                  <TableCell>{row.idRekapCustom}</TableCell>
                  <TableCell>{row.idCustom}</TableCell>
                  <TableCell>{row.namaDesain}</TableCell>
                  <TableCell>{row.kuantity}</TableCell>
                  <TableCell>{row.statusDesain}</TableCell>
                  <TableCell>{getStatusPesanan(row)}</TableCell>
                  <TableCell>{row.statusKonten}</TableCell>
                  <TableCell>{formatWIB(row.tglInputPesanan)}</TableCell>
                  <TableCell>{formatWIB(row.deadlineKonsumen)}</TableCell>
                  <TableCell>{formatWIB(row.tglSpkTerbit)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiPlottingBordir)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiDesainProduksi)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiCuttingPola)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiStockBordir)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiBordir)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiSetting)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiStockJahit)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiJahit)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiFinishing)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiFotoProduk)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiStockNt)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiPelunasan)}</TableCell>
                  <TableCell>{formatWIB(row.selesaiPengiriman)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
