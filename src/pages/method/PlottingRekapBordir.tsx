import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, TextField, MenuItem, Checkbox, Button, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import TableExportToolbar from "../../components/TableExportToolbar";
import Api from "../../lib/api";

type Row = {
  idRekapProduksi: string;
  idTransaksi: string;
  jumlahSpk: number;
  idSpk: string;
  idRekapCustom: string;
  idCustom: string;
  namaDesain: string;
  kuantity: number;
  statusDesain: string;
  // tanggal status proses produksi (opsional)
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

const selesaiFields: { key: keyof Row; label: string }[] = [
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

function getStatusPesanan(row: Row) {
  for (let i = selesaiFields.length - 1; i >= 0; i--) {
    const key = selesaiFields[i].key;
    if (row[key]) return `Selesai ${selesaiFields[i].label}`;
  }
  return "Proses";
}

export default function PlottingRekapBordir() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  // Load queue via API with localStorage fallback and live-refresh
  useEffect(() => {
    const key = 'plotting_rekap_bordir_queue';
    const refresh = async () => {
      try {
        let list: any[] = [];
        try {
          const apiList = await Api.getPlottingQueue();
          list = Array.isArray(apiList) ? apiList.map((x) => ({
            idSpk: x.id_spk,
            idTransaksi: x.id_transaksi,
            idRekapCustom: x.id_rekap_custom,
            idCustom: x.id_custom,
            namaDesain: x.nama_desain,
            kuantity: x.kuantity,
            statusDesain: 'Proses',
          })) : [];
        } catch {
          const raw = localStorage.getItem(key);
          list = raw ? JSON.parse(raw) : [];
        }
        // Load production recap mapping and helpers
        const prRaw = localStorage.getItem('production_recap_map');
        const prMap: Record<string, any> = prRaw ? JSON.parse(prRaw) : {};
        const format7 = (v: any) => {
          const m = String(v || '').match(/(\d{1,})/);
          return m ? String(Number(m[1])).padStart(7, '0') : '';
        };
        const getRecapId = (it: any): string => {
          if (it && it.idRekapProduksi) return format7(it.idRekapProduksi);
          const v = it?.idSpk ? prMap[it.idSpk] : undefined;
          return v ? format7(v) : '';
        };
        const mapped: Row[] = (list || []).map((it) => ({
          idRekapProduksi: getRecapId(it),
          idTransaksi: it?.idTransaksi || '-',
          jumlahSpk: 1,
          idSpk: it?.idSpk,
          idRekapCustom: it?.idRekapCustom || it?.idRekap,
          idCustom: it?.idCustom,
          namaDesain: it?.namaDesain,
          kuantity: (() => {
            const n = Number(String(it?.kuantity ?? '').toString().replace(/[^\d-]/g, ''));
            if (!isNaN(n) && n > 0) return n;
            const srcQty = Number(String(it?.quantity ?? '').toString().replace(/[^\d-]/g, ''));
            if (!isNaN(srcQty) && srcQty > 0) return srcQty;
            return Array.isArray(it?.items) ? it.items.length : 0;
          })(),
          statusDesain: it?.statusDesain || 'Proses',
        }));
        setRows(mapped);
      } catch {
        setRows([]);
      }
    };
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === key) refresh(); };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const statusOptions = useMemo(() => Array.from(new Set(rows.map(getStatusPesanan))), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const statusPesanan = getStatusPesanan(row);
      const matchesStatus = statusFilter ? statusPesanan === statusFilter : true;
      const matchesSearch = search
        ? [
            row.idRekapProduksi,
            row.idTransaksi,
            row.idSpk,
            row.idRekapCustom,
            row.idCustom,
            row.namaDesain,
            String(row.jumlahSpk),
            String(row.kuantity),
            row.statusDesain,
            statusPesanan,
          ]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [rows, search, statusFilter]);

  const allVisibleIds = filteredRows.map((r) => r.idSpk);
  const allChecked = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));
  const someChecked = allVisibleIds.some((id) => selectedIds.includes(id));

  const toggleAllVisible = () => {
    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
    }
  };

  const toggleOne = (idSpk: string) => {
    setSelectedIds((prev) => (prev.includes(idSpk) ? prev.filter((id) => id !== idSpk) : [...prev, idSpk]));
  };

  const canGenerate = selectedIds.length > 0;
  const performGenerate = async () => {
    const selectedRows = rows.filter((r) => selectedIds.includes(r.idSpk));
    if (selectedRows.length === 0) return;
    // Rekap Bordir ID: 7 digits starting at 0000001, increments every plotting action
    const RB_COUNTER_KEY = 'rekap_bordir_counter';
    const nextRekapBordirId = (): string => {
      let counter = 0;
      try {
        const raw = Number(localStorage.getItem(RB_COUNTER_KEY) || 0);
        if (!isNaN(raw) && raw >= 0) counter = raw;
      } catch {}
      const next = counter + 1;
      try { localStorage.setItem(RB_COUNTER_KEY, String(next)); } catch {}
      return String(next).padStart(7, '0');
    };
    const rekapId = nextRekapBordirId();
    try {
      // 1) Call backend to generate; fallback to localStorage history
      const payload = { rekapId, items: selectedRows.map((it) => ({
        idSpk: it.idSpk,
        idTransaksi: it.idTransaksi,
        idRekapCustom: it.idRekapCustom,
        idCustom: it.idCustom,
        namaDesain: it.namaDesain,
        kuantity: it.kuantity,
      })) };
      let usedApi = false;
      try {
        await Api.generateRekap(payload);
        usedApi = true;
      } catch {
        // noop, will do local storage shadow below
      }

      // 1b) Persist to method_rekap_bordir (history) locally for compatibility
      const rbKey = "method_rekap_bordir";
      const rbRaw = localStorage.getItem(rbKey);
      const rbList: any[] = rbRaw ? JSON.parse(rbRaw) : [];
  const createdAt = new Date().toISOString();
  rbList.push({ rekapId, createdAt, items: selectedRows });
      localStorage.setItem(rbKey, JSON.stringify(rbList));

      // 2) Seed selected items into spk_pipeline locally if API failed to do it
      const pipeKey = 'spk_pipeline';
      const pRaw = localStorage.getItem(pipeKey);
      const pipeline: any[] = pRaw ? JSON.parse(pRaw) : [];
      const exists = new Set<string>((pipeline || []).map((p: any) => p?.idSpk).filter(Boolean));

      if (!usedApi) {
        selectedRows.forEach((it) => {
          if (!it?.idSpk || exists.has(it.idSpk)) return;
          const qty = (() => {
            const n = Number(String(it?.kuantity ?? '').toString().replace(/[^\d-]/g, ''));
            if (!isNaN(n) && n > 0) return n;
            const srcQty = Number(String((it as any)?.quantity ?? '').toString().replace(/[^\d-]/g, ''));
            if (!isNaN(srcQty) && srcQty > 0) return srcQty;
            return Array.isArray((it as any)?.items) ? (it as any).items.length : 0;
          })();
          pipeline.push({
            idSpk: it.idSpk,
            idTransaksi: it.idTransaksi,
            idRekapCustom: it.idRekapCustom,
            idCustom: it.idCustom,
            namaDesain: it.namaDesain,
            kuantity: qty,
            selesaiPlottingBordir: createdAt,
          });
        });
        localStorage.setItem(pipeKey, JSON.stringify(pipeline));
      }

      // 3) Remove selected from plotting queue locally (backend already deletes on success)
      const qKey = 'plotting_rekap_bordir_queue';
      const qRaw = localStorage.getItem(qKey);
      const queue: any[] = qRaw ? JSON.parse(qRaw) : [];
      const remaining = (queue || []).filter((q) => !selectedIds.includes(q?.idSpk));
      localStorage.setItem(qKey, JSON.stringify(remaining));

  alert(`Rekap Bordir berhasil dibuat: ${rekapId}`);
      setSelectedIds([]);
    } catch {
      alert("Gagal menyimpan Rekap Bordir.");
    }
  };
  const handleGenerate = () => { setConfirmOpen(true); };
  const handleConfirmNo = () => setConfirmOpen(false);
  const handleConfirmYes = () => { setConfirmOpen(false); performGenerate(); };

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
      <Box sx={{ width: "100%", borderRadius: 2, boxShadow: 2, flexDirection: "column", p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>
          Plotting Rekap Bordir
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
          />
          <TextField
            label="Status Pesanan"
            variant="outlined"
            size="small"
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Semua</MenuItem>
            {statusOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" color="primary" disabled={!canGenerate} onClick={handleGenerate}>
            Generate Rekap Bordir
          </Button>
        </Stack>

        <TableExportToolbar title="Plotting Rekap Bordir" tableRef={tableRef} fileBaseName="plotting-rekap-bordir" />
        <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }}>
          <Table sx={{ minWidth: 1800 }} aria-label="plotting-rekap-bordir" ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox indeterminate={someChecked && !allChecked} checked={allChecked} onChange={toggleAllVisible} />
                </TableCell>
                <TableCell>No</TableCell>
                <TableCell>ID REKAP PRODUKSI</TableCell>
                <TableCell>ID TRANSAKSI</TableCell>
                <TableCell>JUMLAH SPK</TableCell>
                <TableCell>ID SPK</TableCell>
                <TableCell>ID REKAP CUSTOM</TableCell>
                <TableCell>ID CUSTOM</TableCell>
                <TableCell>NAMA DESAIN</TableCell>
                <TableCell>KUANTITY</TableCell>
                <TableCell>STATUS DESAIN</TableCell>
                <TableCell>STATUS PESANAN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row, index) => {
                const id = row.idSpk;
                const checked = selectedIds.includes(id);
                return (
                  <TableRow key={id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox checked={checked} onChange={() => toggleOne(id)} />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.idRekapProduksi}</TableCell>
                    <TableCell>{row.idTransaksi}</TableCell>
                    <TableCell>{row.jumlahSpk}</TableCell>
                    <TableCell>{row.idSpk}</TableCell>
                    <TableCell>{row.idRekapCustom}</TableCell>
                    <TableCell>{row.idCustom}</TableCell>
                    <TableCell>{row.namaDesain}</TableCell>
                    <TableCell>{row.kuantity}</TableCell>
                    <TableCell>{row.statusDesain}</TableCell>
                    <TableCell>{getStatusPesanan(row)}</TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog open={confirmOpen} onClose={handleConfirmNo}>
        <DialogTitle>Konfirmasi</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Generate Rekap Bordir untuk {selectedIds.length} SPK yang dipilih?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmNo} color="inherit">Tidak</Button>
          <Button onClick={handleConfirmYes} variant="contained" color="primary" autoFocus>Ya</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
