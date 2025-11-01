import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, TextField, MenuItem, Button, Stack } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import { useEffect, useRef, useState } from 'react';
import Api from '../../lib/api';
import { runAllMigrationsOnce } from '../../lib/migrations';
import TableExportToolbar from '../../components/TableExportToolbar';

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
    // Cari field selesai terakhir yang terisi
    for (let i = selesaiFields.length - 1; i >= 0; i--) {
        const key = selesaiFields[i].key;
        if (row[key]) {
            return `Selesai ${selesaiFields[i].label}`;
        }
    }
    return "Proses";
}

export default function ListCPKOnProgress() {
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

    // Calculate deadline as 30 days after input date and return ISO string
    const calcDeadlineISO = (inputDate?: string): string | undefined => {
        if (!inputDate) return undefined;
        const d = new Date(inputDate);
        if (isNaN(d.getTime())) return undefined;
        const ms = d.getTime() + 30 * 24 * 60 * 60 * 1000;
        return new Date(ms).toISOString();
    };

    // Live load from backend (pipeline + rekap + plotting) with local fallback
    useEffect(() => {
        // Run localStorage migrations once to normalize legacy data
        try { runAllMigrationsOnce(); } catch { }
        const refresh = async () => {
            try {
                let queue: any[] = [];
                let pipeline: any[] = [];
                let rbList: any[] = [];
                let adList: any[] = [];
                try {
                    const [pApi, rbApi, qApi, dApi] = await Promise.all([
                        Api.getPipeline(),
                        Api.getRekapBordir(),
                        Api.getPlottingQueue(),
                        Api.getDesignQueue(),
                    ]);
                    // Map API payloads to local shapes
                    const pipelineApi = Array.isArray(pApi) ? pApi.map((x) => ({
                        idSpk: x.id_spk,
                        idTransaksi: x.id_transaksi,
                        idRekapCustom: x.id_rekap_custom,
                        idCustom: x.id_custom,
                        namaDesain: x.nama_desain,
                        kuantity: x.kuantity,
                        selesaiPlottingBordir: x.selesai_plotting_bordir,
                        selesaiDesainProduksi: x.selesai_desain_produksi,
                        selesaiCuttingPola: x.selesai_cutting_pola,
                        selesaiStockBordir: x.selesai_stock_bordir,
                        selesaiBordir: x.selesai_bordir,
                        selesaiSetting: x.selesai_setting,
                        selesaiStockJahit: x.selesai_stock_jahit,
                        selesaiFinishing: x.selesai_finishing,
                        selesaiFotoProduk: x.selesai_foto_produk,
                        selesaiStockNt: x.selesai_stock_no_transaksi,
                        selesaiPengiriman: x.selesai_pengiriman,
                    })) : [];
                    const rbApiList = Array.isArray(rbApi) ? rbApi.map((rb) => ({
                        rekapId: rb.rekap_id,
                        createdAt: rb.created_at,
                        items: (rb.items || []).map((it: any) => ({ idSpk: it.id_spk }))
                    })) : [];
                    const queueApi = Array.isArray(qApi) ? qApi.map((q) => ({
                        idSpk: q.id_spk,
                        idTransaksi: q.id_transaksi,
                        idRekapCustom: q.id_rekap_custom,
                        idCustom: q.id_custom,
                        namaDesain: q.nama_desain,
                        kuantity: q.kuantity,
                    })) : [];
                    const adApiList = Array.isArray(dApi) ? dApi.map((d) => ({
                        idSpk: d.id_spk,
                        quantity: d.spk_quantity,
                        items: [],
                        tanggalInput: d.tanggal_input,
                    })) : [];

                    // Also load local mirrors and merge (avoid losing local optimistic updates)
                    const qKey = 'plotting_rekap_bordir_queue';
                    const pipeKey = 'spk_pipeline';
                    const rbKey = 'method_rekap_bordir';
                    const adKey = 'antrian_input_desain';
                    const qRawLocal = localStorage.getItem(qKey);
                    const pRawLocal = localStorage.getItem(pipeKey);
                    const rbRawLocal = localStorage.getItem(rbKey);
                    const adRawLocal = localStorage.getItem(adKey);
                    const queueLocal: any[] = qRawLocal ? JSON.parse(qRawLocal) : [];
                    const pipelineLocal: any[] = pRawLocal ? JSON.parse(pRawLocal) : [];
                    const rbLocal: any[] = rbRawLocal ? JSON.parse(rbRawLocal) : [];
                    const adLocal: any[] = adRawLocal ? JSON.parse(adRawLocal) : [];

                    const unionByIdSpk = (a: any[], b: any[]) => {
                        const out: any[] = [];
                        const seen = new Set<string>();
                        [...a, ...b].forEach((it) => {
                            const id = String(it?.idSpk || '').trim();
                            if (!id || seen.has(id)) return;
                            seen.add(id);
                            out.push(it);
                        });
                        return out;
                    };
                    const unionByKey = (a: any[], b: any[], key: string) => {
                        const out: any[] = [];
                        const seen = new Set<string>();
                        [...a, ...b].forEach((it) => {
                            const id = String(it?.[key] || '').trim();
                            if (!id || seen.has(id)) return;
                            seen.add(id);
                            out.push(it);
                        });
                        return out;
                    };

                    pipeline = unionByIdSpk(pipelineApi, pipelineLocal);
                    queue = unionByIdSpk(queueApi, queueLocal);
                    rbList = unionByKey(rbApiList, rbLocal, 'rekapId');
                    adList = unionByIdSpk(adApiList, adLocal);
                } catch {
                    const qKey = 'plotting_rekap_bordir_queue';
                    const pipeKey = 'spk_pipeline';
                    const rbKey = 'method_rekap_bordir';
                    const adKey = 'antrian_input_desain';
                    const qRaw = localStorage.getItem(qKey);
                    queue = qRaw ? JSON.parse(qRaw) : [];
                    const pRaw = localStorage.getItem(pipeKey);
                    pipeline = pRaw ? JSON.parse(pRaw) : [];
                    const rbRaw = localStorage.getItem(rbKey);
                    rbList = rbRaw ? JSON.parse(rbRaw) : [];
                    const adRaw = localStorage.getItem(adKey);
                    adList = adRaw ? JSON.parse(adRaw) : [];
                }

                // Load auxiliary sources to mirror PrintSPK data sourcing
                const keranjangRaw = localStorage.getItem('keranjang');
                const keranjangList: any[] = keranjangRaw ? JSON.parse(keranjangRaw) : [];
                const spkOrdersRaw = localStorage.getItem('spk_orders');
                const spkOrdersMap: Record<string, any> = spkOrdersRaw ? JSON.parse(spkOrdersRaw) : {};

                const rekapDate = new Map<string, string>(); // idSpk -> createdAt
                rbList.forEach((rb) => {
                    const createdAt = rb?.createdAt;
                    (rb?.items || []).forEach((it: any) => {
                        if (it?.idSpk && createdAt) rekapDate.set(it.idSpk, createdAt);
                    });
                });

                const adMap: Record<string, any> = {};
                adList.forEach((it) => { if (it?.idSpk) adMap[it.idSpk] = it; });
                const keranjangMap: Record<string, any> = {};
                keranjangList.forEach((it) => { if (it?.idSpk) keranjangMap[it.idSpk] = it; });

                // Robust idSpk lookup like PrintSPK
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

                // Compose combined list (dedupe by idSpk), prioritize pipeline record
                const byId: Record<string, SPKRow> = {};

                const parseNum = (v: any): number => {
                    const n = Number(String(v ?? '').toString().replace(/[^\d-]/g, ''));
                    return !isNaN(n) && n > 0 ? n : 0;
                };

                // Load production recap mapping to show 7-digit ID like in Method page
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
                    const src = adMap[it.idSpk] || {};
                    const keranjangData = keranjangMap[it.idSpk] || {};
                    const spkOrderData = robustMapGet(spkOrdersMap, String(it.idSpk)) || {};
                    let qty = typeof it.kuantity === 'number' && it.kuantity > 0 ? it.kuantity : parseNum(src?.quantity || spkOrderData?.quantity);
                    if (!qty && Array.isArray(src?.items)) qty = src.items.length;
                    if (!qty && Array.isArray(spkOrderData?.items)) qty = spkOrderData.items.length;
                    // tanggal order/input should match PrintSPK rules
                    const tglOrder = (
                        src?.tanggalInput || spkOrderData?.tanggalInput || it?.tanggalOrder || src?.input_date || src?.inputDate || src?.createdAt || it?.tglInputPesanan || it?.tanggalInput
                    );
                    // deadline: prefer explicit, else +30 days from tanggal order
                    const explicitDeadline = it?.deadline || spkOrderData?.deadline || keranjangData?.deadline;
                    const deadlineIso = explicitDeadline || calcDeadlineISO(typeof tglOrder === 'string' ? tglOrder : undefined);
                    byId[it.idSpk] = {
                        idRekapProduksi: getRecapId(it),
                        idTransaksi: it.idTransaksi || '-',
                        jumlahSpk: 1, // will recompute later by transaction
                        idSpk: it.idSpk,
                        idRekapCustom: it.idRekapCustom || it.idRekap,
                        idCustom: it.idCustom,
                        namaDesain: it.namaDesain,
                        kuantity: qty || 0,
                        statusDesain: 'Proses',
                        // Konten from Input Pesanan with robust fallbacks like PrintSPK
                        statusKonten: (src?.content || spkOrderData?.content || keranjangData?.konten || it?.konten || '-') as string,
                        tglInputPesanan: (typeof tglOrder === 'string' ? tglOrder : '-') as string,
                        deadlineKonsumen: (deadlineIso || '-') as string,
                        tglSpkTerbit: (it?.tglSpkTerbit || terbitMap[it.idSpk] || '-') as string,
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

                // Populate list from both sources
                (queue || []).forEach(pushFrom);
                (pipeline || []).forEach(pushFrom);

                // Compute jumlahSpk per idTransaksi
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

    // Ambil semua status unik dari hasil getStatusPesanan
    const statusOptions = Array.from(new Set(rows.map(getStatusPesanan)));

    // Filter dan search
    const filteredRows = rows.filter(row => {
        const statusPesanan = getStatusPesanan(row);
        const matchesStatus = statusFilter ? statusPesanan === statusFilter : true;
        const matchesSearch = search
            ? Object.values(row).some(val =>
                typeof val === "string" && val.toLowerCase().includes(search.toLowerCase())
            )
            : true;
        return matchesStatus && matchesSearch;
    });

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            p: 3,
            boxSizing: 'border-box',
            flexDirection: 'column',
        }}>
            <Box sx={{
                width: '100%',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                p: 3,
                mb: 3
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>List SPK On Proses</Typography>
                <Box sx={{ overflowX: 'auto', mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'nowrap', width: 'max-content' }}>
                        <TextField
                            label="Search"
                            variant="outlined"
                            size="small"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ width: { xs: 220, sm: 260, md: 380 } }}
                        />
                        <TextField
                            label="Status Pesanan"
                            variant="outlined"
                            size="small"
                            select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            sx={{ width: { xs: 180, sm: 200, md: 240 } }}
                        >
                            <MenuItem value="">Semua</MenuItem>
                            {statusOptions.map(opt => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ flex: 1 }} />
                        <TableExportToolbar title="List CPK On Progress" tableRef={tableRef} fileBaseName="list-cpk-on-progress" />
                    </Stack>
                </Box>
                <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 3200 }} aria-label="spk-on-proses-table" ref={tableRef}>
                        <TableHead sx={{
                            '& .MuiTableCell-head': {
                                whiteSpace: 'normal',
                                overflow: 'visible',
                                textOverflow: 'unset',
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }
                        }}>
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
    )
}