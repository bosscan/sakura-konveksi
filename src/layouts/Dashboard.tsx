/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Grid, Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import DashboardCard from '../components/dashboard/DashboardCard';
import ProductTable from '../components/dashboard/ProductTable';
import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip as RTooltip,
    Legend as RLegend,
    LineChart,
    Line,
    CartesianGrid,
} from 'recharts';

type Omset = { id: string; idSpk?: string; tanggal: string; namaPemesan?: string; tipeTransaksi?: string; nominal: number };
type Gaji = { date: string; base: number; overtime: number; bonus: number; deduction: number };
type Belanja = { date: string; qty: number; price: number };
type Fee = { date: string; amount: number };
type Ads = { date: string; spend: number };
type Ongkir = { date: string; amount: number };
type Maint = { date: string; amount: number };
type Overhead = { date: string; amount: number };

type SpkItem = {
    idSpk?: string;
    idRekapCustom?: string;
    idRekap?: string;
    idCustom?: string;
    namaDesain?: string;
    kuantity?: number;
    konten?: string;
    statusKonten?: string;
    jenisProduk?: string;
    jenisPola?: string;
};

const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function Dashboard() {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [designQueueCount, setDesignQueueCount] = useState(0); // pra produksi desain (active statuses)
    const [antrianInputCount, setAntrianInputCount] = useState(0);
    const [keranjangCount, setKeranjangCount] = useState(0);
    const [plottingCount, setPlottingCount] = useState(0);
    const [spkItems, setSpkItems] = useState<SpkItem[]>([]);
    const [omsetMonth, setOmsetMonth] = useState<Omset[]>([]);
    const [expenseMonth, setExpenseMonth] = useState({
        gaji: [] as Gaji[], belanja: [] as Belanja[], fee: [] as Fee[], ads: [] as Ads[], ongkir: [] as Ongkir[], maint: [] as Maint[], overhead: [] as Overhead[],
    });

    useEffect(() => {
    const refresh = () => {
            try {
                // Pra produksi design queue: count active tasks
                const dqRaw = localStorage.getItem('design_queue');
                const dq: any[] = dqRaw ? JSON.parse(dqRaw) : [];
                const norm = (s?: string) => (s || '').trim().toLowerCase();
                const activeDq = dq.filter((it) => {
                    const st = norm(it?.status);
                    return st !== 'antrian revisi' && st !== 'desain di validasi' && st !== 'selesai';
                });
                setDesignQueueCount(activeDq.length);
            } catch { setDesignQueueCount(0); }

            try { setAntrianInputCount((JSON.parse(localStorage.getItem('antrian_input_desain') || '[]') as any[]).length); } catch { setAntrianInputCount(0); }
            try { setKeranjangCount((JSON.parse(localStorage.getItem('keranjang') || '[]') as any[]).length); } catch { setKeranjangCount(0); }
            try { setPlottingCount((JSON.parse(localStorage.getItem('plotting_rekap_bordir_queue') || '[]') as any[]).length); } catch { setPlottingCount(0); }

            try {
                // Merge pipeline and plotting queue as active SPKs like SpkOnProses does
                        const qRaw = localStorage.getItem('plotting_rekap_bordir_queue');
                        const pRaw = localStorage.getItem('spk_pipeline');
                        const adRaw = localStorage.getItem('antrian_input_desain');
                        const dqRaw = localStorage.getItem('design_queue');
                        const dsRaw = localStorage.getItem('spk_design');
                        const kRaw = localStorage.getItem('keranjang');
                const queue: any[] = qRaw ? JSON.parse(qRaw) : [];
                const pipe: any[] = pRaw ? JSON.parse(pRaw) : [];
                        const adList: any[] = adRaw ? JSON.parse(adRaw) : [];
                        const dqueue: any[] = dqRaw ? JSON.parse(dqRaw) : [];
                        const dsMap: Record<string, any> = dsRaw ? JSON.parse(dsRaw) : {};
                        const cart: any[] = kRaw ? JSON.parse(kRaw) : [];
                        const adMap: Record<string, any> = {};
                        (adList || []).forEach((it) => { if (it?.idSpk) adMap[it.idSpk] = it; });
                        const dMap: Record<string, any> = {};
                        (dqueue || []).forEach((it) => { if (it?.idSpk) dMap[it.idSpk] = it; });
                        const qLookup: Record<string, number> = {};
                        // quantities from queues/pipeline
                        (queue || []).forEach((it) => { if (it?.idSpk && typeof it.kuantity === 'number') qLookup[it.idSpk] = Math.max(qLookup[it.idSpk] || 0, it.kuantity); });
                        (pipe || []).forEach((it) => { if (it?.idSpk && typeof it.kuantity === 'number') qLookup[it.idSpk] = Math.max(qLookup[it.idSpk] || 0, it.kuantity); });
                        // quantities from cart
                        (cart || []).forEach((it) => { if (it?.idSpk && typeof it.kuantity === 'number') qLookup[it.idSpk] = Math.max(qLookup[it.idSpk] || 0, it.kuantity); });
                        // fallback from Input Desain quantity
                        (adList || []).forEach((q) => {
                            const idSpk = q?.idSpk; const n = Number(String(q?.quantity ?? '').replace(/[^\d-]/g, ''));
                            if (idSpk && !isNaN(n)) qLookup[idSpk] = Math.max(qLookup[idSpk] || 0, n);
                        });
                const byId: Record<string, SpkItem> = {};
                        const pushFrom = (it: any) => {
                    if (!it?.idSpk) return;
                            const src = adMap[it.idSpk] || {};
                            const dsrc = dMap[it.idSpk] || {};
                            const dss = dsMap?.[it.idSpk] || {};
                    byId[it.idSpk] = {
                        idSpk: it.idSpk,
                        idRekapCustom: it.idRekapCustom || it.idRekap,
                        idCustom: it.idCustom,
                        namaDesain: dsrc?.namaDesain || it.namaDesain,
                                            kuantity: qLookup[it.idSpk] ?? it.kuantity ?? 0,
                                konten: src?.content ?? it?.konten ?? '',
                                statusKonten: src?.content ?? it?.statusKonten ?? '',
                                jenisProduk: dsrc?.jenisProduk || dss?.product || src?.tipeTransaksi || '',
                                jenisPola: dsrc?.jenisPola || dss?.pattern || '',
                    };
                };
                queue.forEach(pushFrom);
                pipe.forEach(pushFrom);
                setSpkItems(Object.values(byId));
            } catch { setSpkItems([]); }

            // Load omset for the current month
            try {
                const raw = localStorage.getItem('omset_pendapatan');
                const list: Omset[] = raw ? JSON.parse(raw) : [];
                const monthList = list.filter((r) => (r?.tanggal || '').startsWith(`${ym}-`));
                setOmsetMonth(monthList);
            } catch { setOmsetMonth([]); }

            // Load expenses for current month
            try {
                const gaji = (JSON.parse(localStorage.getItem('pengeluaran_gaji') || '[]') as Gaji[]).filter((i) => i.date?.startsWith(`${ym}-`));
                const belanja = (JSON.parse(localStorage.getItem('pengeluaran_belanja_logistik') || '[]') as Belanja[]).filter((i: any) => i.date?.startsWith(`${ym}-`));
                const fee = (JSON.parse(localStorage.getItem('pengeluaran_fee_jaringan') || '[]') as Fee[]).filter((i) => i.date?.startsWith(`${ym}-`));
                const ads = (JSON.parse(localStorage.getItem('pengeluaran_marketing_ads') || '[]') as Ads[]).filter((i) => i.date?.startsWith(`${ym}-`));
                const ongkir = (JSON.parse(localStorage.getItem('pengeluaran_ongkir') || '[]') as Ongkir[]).filter((i) => i.date?.startsWith(`${ym}-`));
                const maint = (JSON.parse(localStorage.getItem('pengeluaran_maintenance_mesin') || '[]') as Maint[]).filter((i) => i.date?.startsWith(`${ym}-`));
                const overhead = (JSON.parse(localStorage.getItem('pengeluaran_overhead_pabrik') || '[]') as Overhead[]).filter((i) => i.date?.startsWith(`${ym}-`));
                setExpenseMonth({ gaji, belanja, fee, ads, ongkir, maint, overhead });
            } catch {
                setExpenseMonth({ gaji: [], belanja: [], fee: [], ads: [], ongkir: [], maint: [], overhead: [] });
            }
        };

        refresh();
        const onStorage = (e: StorageEvent) => {
            if ([
                'design_queue','antrian_input_desain','keranjang','plotting_rekap_bordir_queue','spk_pipeline','spk_design','omset_pendapatan',
                'pengeluaran_gaji','pengeluaran_belanja_logistik','pengeluaran_fee_jaringan','pengeluaran_marketing_ads','pengeluaran_ongkir','pengeluaran_maintenance_mesin','pengeluaran_overhead_pabrik'
            ].includes(e.key || '')) refresh();
        };
        window.addEventListener('storage', onStorage);
        const timer = setInterval(refresh, 2000);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
    }, [ym]);

    // Finance aggregates
        const totalOmset = useMemo(() => omsetMonth.reduce((a, r) => a + (Number(r.nominal) || 0), 0), [omsetMonth]);
        // Proyeksi Omset (By Trend): gunakan rata-rata omset harian bulan berjalan x jumlah hari dalam bulan
    const projectedOmset = useMemo(() => {
            if (!omsetMonth.length) return 0;
            const perDay = new Map<string, number>();
            omsetMonth.forEach((r) => {
                const d = (r.tanggal || '').slice(0, 10);
                if (!d || !d.startsWith(`${ym}-`)) return;
                perDay.set(d, (perDay.get(d) || 0) + (Number(r.nominal) || 0));
            });
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dayOfMonth = today.getDate();
            // average based on elapsed days (to avoid bias of zeros for future days)
            const elapsedDays = Math.max(1, Math.min(dayOfMonth, daysInMonth));
            // sum over actual elapsed days that have entries; if missing a day, treat as 0
            // build yyyy-mm-01..yyyy-mm-elapsed range
            let sumElapsed = 0;
            for (let d = 1; d <= elapsedDays; d++) {
                const ds = `${ym}-${String(d).padStart(2, '0')}`;
                sumElapsed += perDay.get(ds) || 0;
            }
            const avg = sumElapsed / elapsedDays;
            return Math.round(avg * daysInMonth);
        }, [omsetMonth, ym]);

    // Average Omset per Day (month-to-date)
    const avgOmsetPerDay = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const dayOfMonth = today.getDate();
        // Build per-day omset map for the month
        const perDay = new Map<string, number>();
        omsetMonth.forEach((r) => {
            const d = (r.tanggal || '').slice(0, 10);
            if (!d || !d.startsWith(`${ym}-`)) return;
            perDay.set(d, (perDay.get(d) || 0) + (Number(r.nominal) || 0));
        });
        // Sum omset up to today (inclusive)
        let sumElapsed = 0;
        let workingDaysElapsed = 0;
        for (let d = 1; d <= dayOfMonth; d++) {
            const dateObj = new Date(year, month, d);
            const isSunday = dateObj.getDay() === 0; // 0 = Sunday
            const ds = `${ym}-${String(d).padStart(2, '0')}`;
            sumElapsed += perDay.get(ds) || 0;
            if (!isSunday) workingDaysElapsed += 1;
        }
        if (workingDaysElapsed <= 0) return 0;
        return Math.round(sumElapsed / workingDaysElapsed);
    }, [omsetMonth, ym]);

    // Product classification prioritizing structured jenisProduk/jenisPola from Input Desain
            const productNames: string[] = [
                'JAKET',
                'PDH/PDL',
                'SAFETY',
                'TACTICAL',
                'KAOS',
                'POLO',
                'CELANA PANJANG',
                'CEK CATATAN',
                'ROMPI',
            ];

            const productBuckets = useMemo(() => {
                const buckets: Record<string, number> = Object.fromEntries(productNames.map((k) => [k, 0]));
                const details: Record<string, Array<{ idSpk: string; jenis: string; namaDesain: string; quantity: number }>> = Object.fromEntries(productNames.map((k) => [k, []]));
            const norm = (s?: string) => (s || '').toString().toLowerCase();
                const classify = (it: SpkItem): keyof typeof buckets => {
                    const jp = (it.jenisProduk || '').toString().toUpperCase();
                    const jp2 = (it.jenisPola || '').toString().toUpperCase();
                    // Direct structured mappings first
                    if (/ROMPI/.test(jp) || /ROMPI/.test(jp2)) return 'ROMPI';
                    if (/(JAKET|JKT|BOMBER|VARSITY|PARKA|WINDBREAKER)/.test(jp) || /(JAKET|JKT|BOMBER|VARSITY|PARKA|WINDBREAKER)/.test(jp2)) return 'JAKET';
                    if (/(PDH|PDL)/.test(jp) || /(PDH|PDL)/.test(jp2)) return 'PDH/PDL';
                    if (/SAFETY/.test(jp) || /SAFETY/.test(jp2)) return 'SAFETY';
                    if (/TACTICAL/.test(jp) || /TACTICAL/.test(jp2)) return 'TACTICAL';
                    if (/(KAOS|T\s?-?SHIRT|TEE)/.test(jp) || /(KAOS|T\s?-?SHIRT|TEE)/.test(jp2)) return 'KAOS';
                    if (/POLO/.test(jp) || /POLO/.test(jp2)) return 'POLO';
                    if (/CELANA/.test(jp) || /CELANA/.test(jp2)) return 'CELANA PANJANG';
                    // Fallback: parse free text
                    const txt = `${norm(it.statusKonten)} ${norm(it.konten)} ${norm(it.namaDesain)}`;
                    if (/(\bjaket\b|\bjkt\b|\bbomber\b|\bvarsity\b|\bparka\b|\bwindbreaker\b)/i.test(txt)) return 'JAKET';
                    if (/\b(pdh|pdl)\b/i.test(txt)) return 'PDH/PDL';
                    if (/\bsafety\b/i.test(txt)) return 'SAFETY';
                    if (/\btactical\b/i.test(txt)) return 'TACTICAL';
                    if (/(\bkaos\b|t-?shirt|\btee\b)/i.test(txt)) return 'KAOS';
                    if (/\bpolo\b/i.test(txt)) return 'POLO';
                    if (/(\bcelana\b).*(\bpanjang\b)/i.test(txt) || /\bcelana panjang\b/i.test(txt)) return 'CELANA PANJANG';
                    if (/cek\s*catatan/i.test(txt)) return 'CEK CATATAN';
                    if (/\brompi\b/i.test(txt)) return 'ROMPI';
                    return 'CEK CATATAN';
                };
            (spkItems || []).forEach((it) => {
                const cat = classify(it);
                buckets[cat] = (buckets[cat] || 0) + 1;
                const qty = Number(it.kuantity || 0) || 0;
                const jenisForDetail = it.jenisProduk || cat;
                details[cat].push({ idSpk: it.idSpk || '-', jenis: jenisForDetail, namaDesain: it.namaDesain || '-', quantity: qty });
            });
                return { buckets, details } as any;
        }, [spkItems]);

            const productChartData = useMemo(() => {
                const b: Record<string, number> = (productBuckets as any).buckets || productBuckets;
                const d: Record<string, Array<{ quantity: number }>> = (productBuckets as any).details || {};
                return productNames.map((name) => ({ name, count: (b[name] || 0), qtyTotal: (d[name] || []).reduce((a, r) => a + (r.quantity || 0), 0) }));
            }, [productBuckets]);

            // Dialog state for per-category details
            const [openCat, setOpenCat] = useState(false);
            const [catTitle, setCatTitle] = useState('');
            const [catRows, setCatRows] = useState<Array<{ idSpk: string; jenis: string; namaDesain: string; quantity: number }>>([]);
            const openDetails = (name: string) => {
                const d: Record<string, Array<{ idSpk: string; jenis: string; namaDesain: string; quantity: number }>> = (productBuckets as any).details || {};
                setCatTitle(name);
                setCatRows((d[name] || []).sort((a,b)=> (a.idSpk||'').localeCompare(b.idSpk||'')));
                setOpenCat(true);
            };

    // Omset vs Pengeluaran per day of month
    const omsetVsExpenseDaily = useMemo(() => {
        const map = new Map<string, { date: string; omset: number; pengeluaran: number }>();
        omsetMonth.forEach((r) => {
            const d = (r.tanggal || '').slice(0, 10);
            if (!d) return;
            const cur = map.get(d) || { date: d, omset: 0, pengeluaran: 0 };
            cur.omset += Number(r.nominal) || 0;
            map.set(d, cur);
        });
        expenseMonth.gaji.forEach((g) => {
            const d = g.date;
            const cur = map.get(d) || { date: d, omset: 0, pengeluaran: 0 };
            cur.pengeluaran += (g.base + g.overtime + g.bonus - g.deduction);
            map.set(d, cur);
        });
        (expenseMonth.belanja as (Belanja & {date: string})[]).forEach((b) => {
            const d = (b as any).date;
            const cur = map.get(d) || { date: d, omset: 0, pengeluaran: 0 };
            cur.pengeluaran += (b.qty * b.price);
            map.set(d, cur);
        });
        expenseMonth.fee.forEach((f) => {
            const d = f.date; const cur = map.get(d) || { date: d, omset: 0, pengeluaran: 0 }; cur.pengeluaran += f.amount; map.set(d, cur);
        });
        expenseMonth.ads.forEach((a) => {
            const d = a.date; const cur = map.get(d) || { date: d, omset: 0, pengeluaran: 0 }; cur.pengeluaran += a.spend; map.set(d, cur);
        });
        expenseMonth.ongkir.forEach((o) => {
            const d = o.date; const cur = map.get(d) || { date: d, omset: 0, pengeluaran: 0 }; cur.pengeluaran += o.amount; map.set(d, cur);
        });
        expenseMonth.maint.forEach((m) => {
            const d = m.date; const cur = map.get(d) || { date: d, omset: 0, pengeluaran: 0 }; cur.pengeluaran += m.amount; map.set(d, cur);
        });
        expenseMonth.overhead.forEach((ov) => {
            const d = ov.date; const cur = map.get(d) || { date: d, omset: 0, pengeluaran: 0 }; cur.pengeluaran += ov.amount; map.set(d, cur);
        });
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [omsetMonth, expenseMonth]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Dashboard</Typography>

            {/* Top KPIs */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DashboardCard title="Omset Bulan Ini" value={currency(totalOmset)} color="#1e88e5" subtitle={ym} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DashboardCard title="Rata-rata Omset per Hari" value={currency(avgOmsetPerDay)} color="#e53935" subtitle={ym} />
                </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard title="Proyeksi Omset (By Trend)" value={currency(projectedOmset)} color="#43a047" subtitle={ym} />
                        </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DashboardCard title="Total SPK On Proses" value={String(spkItems.length)} color="#8e24aa" subtitle="Akhir Pipeline" />
                </Grid>
            </Grid>

            {/* Queue summary */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DashboardCard title="Pra Produksi (Desainer)" value={String(designQueueCount)} color="#6d4c41" subtitle="Antrian aktif" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DashboardCard title="Antrian Input Desain" value={String(antrianInputCount)} color="#00acc1" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DashboardCard title="Keranjang" value={String(keranjangCount)} color="#ffb300" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <DashboardCard title="Plotting Rekap Bordir" value={String(plottingCount)} color="#5e35b1" />
                </Grid>
            </Grid>

            {/* Charts row: Product distribution and Omset vs Pengeluaran */}
            <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <ProductTable title="Antrian Produksi per Jenis Produk" rows={productChartData} onOpenDetails={openDetails} />
                        </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Omset vs Pengeluaran (Harian)</Typography>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={omsetVsExpenseDaily}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RTooltip formatter={(v: any) => currency(Number(v)||0)} />
                                <RLegend />
                                <Line type="monotone" dataKey="omset" name="Omset" stroke="#43a047" dot={false} />
                                <Line type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#e53935" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
                {/* Details dialog */}
                <Dialog open={openCat} onClose={() => setOpenCat(false)} maxWidth="md" fullWidth>
                    <DialogTitle>{catTitle} · Detail Antrian</DialogTitle>
                    <DialogContent dividers>
                        {catRows.length === 0 ? (
                            <Typography align="center">Tidak ada data</Typography>
                        ) : (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No</TableCell>
                                        <TableCell>ID SPK</TableCell>
                                        <TableCell>Jenis Produk</TableCell>
                                        <TableCell>Nama Desain</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {catRows.map((r, idx) => (
                                        <TableRow key={`${r.idSpk}-${idx}`}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>{r.idSpk}</TableCell>
                                            <TableCell>{r.jenis}</TableCell>
                                            <TableCell>{r.namaDesain}</TableCell>
                                            <TableCell align="right">{r.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </DialogContent>
                </Dialog>
        </Box>
    );
}