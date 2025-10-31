/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, Dialog, DialogContent, DialogTitle, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Paper, Button, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TableExportToolbar from '../../components/TableExportToolbar';

// Small helper to read localStorage safely
const loadLs = <T = any,>(key: string, def: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : def; } catch { return def; }
};

type AnyRec = Record<string, any>;

type AssetBlock = { file: string | null; ukuran: string; jarak: string; keterangan: string };

type GroupRow = {
  idSpk: string;
  idRekapCustom?: string;
  idCustom?: string;
  namaDesain?: string;
  jenisProduk?: string;
  tanggalInput?: string;
  status?: string;
  linkDriveAssetJadi?: string;
  blocks: Partial<Record<AttrKey, AssetBlock>>;
  available: AttrKey[];
  cdr?: { file: string | null; filename?: string };
};

const ATTR_LABEL: Record<string, string> = {
  dadaKanan: 'ATRIBUT DADA KANAN',
  dadaKiri: 'ATRIBUT DADA KIRI',
  lenganKanan: 'ATRIBUT LENGAN KANAN',
  lenganKiri: 'ATRIBUT LENGAN KIRI',
  belakang: 'ATRIBUT BELAKANG',
  tambahanReferensi: 'DETAIL TAMBAHAN/REFERENSI',
  mockup: 'MOCKUP',
};

const ATTR_KEYS = ['dadaKanan','dadaKiri','lenganKanan','lenganKiri','belakang','tambahanReferensi','mockup'] as const;

type AttrKey = typeof ATTR_KEYS[number];

export default function DatabaseAssetDesainJadi() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [query, setQuery] = useState('');
  const [attrFilter, setAttrFilter] = useState<AttrKey | ''>('');
  const [preview, setPreview] = useState<{ open: boolean; row?: GroupRow }>()

  const makeGroups = (): GroupRow[] => {
    // Sources
    const dq: AnyRec[] = loadLs('design_queue', []);
    const antri: AnyRec[] = loadLs('antrian_pengerjaan_desain', []);
    const snapRaw: AnyRec = loadLs('spk_design', {});
    const snaps: AnyRec[] = Object.keys(snapRaw || {}).map((idSpk) => ({ idSpk, ...(snapRaw[idSpk] || {}) }));
    const order: Record<'antrian' | 'queue' | 'snapshot', number> = { antrian: 3, queue: 2, snapshot: 1 };
    const combine = (cur?: AssetBlock | null, next?: AssetBlock | null, prefer: number = 0, curPrefer: number = 0): { pick?: AssetBlock; prefer: number } => {
      if (!next) return { pick: cur || undefined, prefer: curPrefer };
      if (!cur) return { pick: next, prefer };
      const nHas = !!next.file; const cHas = !!cur.file;
      if (nHas !== cHas) return { pick: nHas ? next : cur, prefer: nHas ? prefer : curPrefer };
      // else prefer higher order
      return (prefer >= curPrefer) ? { pick: next, prefer } : { pick: cur, prefer: curPrefer };
    };

    const groups = new Map<string, GroupRow & { prefer: Partial<Record<AttrKey, number>>; cdrPrefer?: number }>();
    const feed = (it: AnyRec, source: 'queue' | 'antrian' | 'snapshot') => {
      const idSpk = String(it?.idSpk || ''); if (!idSpk) return;
      const ws: AnyRec = it?.worksheet || {};
      const base: GroupRow = {
        idSpk,
        idRekapCustom: it?.idRekapCustom,
        idCustom: it?.idCustom,
        namaDesain: it?.namaDesain || it?.nameDesign,
        jenisProduk: it?.jenisProduk || it?.product,
        tanggalInput: it?.tanggalInput,
        status: it?.status,
        linkDriveAssetJadi: ws?.linkDriveAssetJadi || it?.linkDriveAssetJadi,
        blocks: {},
        available: [],
      };
  const cur = groups.get(idSpk) || { ...base, prefer: {} };
      // update meta if missing
      (['idRekapCustom','idCustom','namaDesain','jenisProduk','tanggalInput','status','linkDriveAssetJadi'] as const).forEach((k)=>{
        // @ts-ignore
        if (!cur[k] && base[k]) cur[k] = base[k] as any;
      });
      const pref = order[source];
      // pick CDR by preference
      if (ws?.cdr && (ws.cdr.file || ws.cdr.filename)) {
        const curPref = cur.cdrPrefer ?? 0;
        if (!cur.cdr || pref >= curPref) {
          cur.cdr = { file: ws.cdr.file || null, filename: ws.cdr.filename };
          cur.cdrPrefer = pref;
        }
      }
      ATTR_KEYS.forEach((k)=>{
        const b = ws?.[k];
        const hasAny = b && (b.file || b.ukuran || b.jarak || b.keterangan);
        if (!hasAny) return;
        const curPrefer = cur.prefer[k] ?? 0;
        const res = combine(cur.blocks[k] as any, {
          file: b.file || null,
          ukuran: String(b.ukuran || ''),
          jarak: String(b.jarak || ''),
          keterangan: String(b.keterangan || ''),
        }, pref, curPrefer);
        if (res.pick) {
          cur.blocks[k] = res.pick;
          cur.prefer[k] = res.prefer;
        }
      });
      groups.set(idSpk, cur);
    };

    dq.forEach((it)=>feed(it, 'queue'));
    antri.forEach((it)=>feed(it, 'antrian'));
    snaps.forEach((it)=>feed(it, 'snapshot'));

    const out: GroupRow[] = Array.from(groups.values()).map((g)=>({
      ...g,
      available: ATTR_KEYS.filter((k)=>{
        const b = g.blocks[k];
        return b && (b.file || b.ukuran || b.jarak || b.keterangan);
      }) as AttrKey[],
    }));

    return out.sort((a,b)=> (a.idSpk||'').localeCompare(b.idSpk||''));
  };

  const [rows, setRows] = useState<GroupRow[]>([]);
  useEffect(() => {
    const refresh = () => setRows(makeGroups());
    refresh();
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (attrFilter) {
        if (!r.available.includes(attrFilter)) return false;
      }
      if (!query) return true;
      const q = query.toLowerCase();
      return String(r.idSpk||'').toLowerCase().includes(q) || String(r.namaDesain||'').toLowerCase().includes(q);
    });
  }, [rows, query, attrFilter]);

  const exportHeaders = ['ID SPK','ID REKAP CUSTOM','ID CUSTOM','NAMA DESAIN','JENIS PRODUK','BAGIAN TERSEDIA'];
  const exportRows = filtered.map((r) => ({
    'ID SPK': r.idSpk,
    'ID REKAP CUSTOM': r.idRekapCustom || '',
    'ID CUSTOM': r.idCustom || '',
    'NAMA DESAIN': r.namaDesain || '',
    'JENIS PRODUK': r.jenisProduk || '',
    'BAGIAN TERSEDIA': [
      ...r.available.map((k)=>ATTR_LABEL[k]),
      ...(r.cdr?.file ? ['FILE CDR'] : [])
    ].join(', '),
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>Database Asset Desain Jadi</Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <TextField size="small" placeholder="Cari ID SPK / Nama Desain"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 380 }}
        />
        <TextField size="small" select label="Bagian Atribut" value={attrFilter}
          onChange={(e)=>setAttrFilter((e.target.value||'') as AttrKey | '')}
          sx={{ width: 240 }}>
          <MenuItem value="">Semua</MenuItem>
          {ATTR_KEYS.map(k => <MenuItem key={k} value={k}>{ATTR_LABEL[k]}</MenuItem>)}
        </TextField>
  {/* Removed checkbox: Hanya yang ada gambar */}
        <Box sx={{ flex: 1 }} />
        <TableExportToolbar headers={exportHeaders} rows={exportRows} title="Database Asset Desain Jadi" fileBaseName="database-asset-desain" />
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small" stickyHeader ref={tableRef}>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>ID SPK</TableCell>
              <TableCell>ID Rekap Custom</TableCell>
              <TableCell>ID Custom</TableCell>
              <TableCell>Nama Desain</TableCell>
              <TableCell>Jenis Produk</TableCell>
              <TableCell>Bagian Tersedia</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r, i) => (
              <TableRow key={`${r.idSpk}`}>
                <TableCell>{i + 1}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{r.idSpk}</TableCell>
                <TableCell>{r.idRekapCustom || '-'}</TableCell>
                <TableCell>{r.idCustom || '-'}</TableCell>
                <TableCell>{r.namaDesain || '-'}</TableCell>
                <TableCell>{r.jenisProduk || '-'}</TableCell>
                <TableCell>
                  {(r.available.length === 0) ? (
                    <span style={{ color: '#999' }}>-</span>
                  ) : (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                      {r.available.map((k)=> (
                        <Chip key={k} size="small" label={ATTR_LABEL[k]} sx={{ mb: 0.5 }} />
                      ))}
                    </Stack>
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton aria-label="Lihat detail" onClick={()=>setPreview({ open: true, row: r })}>
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">Tidak ada data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!preview?.open} onClose={()=>setPreview({ open: false })} maxWidth="lg" fullWidth>
        <DialogTitle>
          {preview?.row ? `Preview Asset Desain - SPK ${preview.row.idSpk}${preview.row.namaDesain ? ` - ${preview.row.namaDesain}` : ''}` : 'Preview'}
        </DialogTitle>
        <DialogContent dividers>
          {preview?.row ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {[ 'mockup', 'dadaKanan','dadaKiri','lenganKanan','lenganKiri','belakang','tambahanReferensi' ].map((kk) => {
                const k = kk as AttrKey;
                const b = preview.row!.blocks[k] as AssetBlock | undefined;
                const has = !!(b && (b.file || b.ukuran || b.jarak || b.keterangan));
                return (
                  <Box key={k} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{ATTR_LABEL[k]}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, background: '#fafafa', border: '1px dashed #e0e0e0', borderRadius: 1 }}>
                      {b?.file ? (
                        <img src={b.file} alt={ATTR_LABEL[k]} style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain' }} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">Tidak ada gambar</Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1, mt: 1 }}>
                      <TextField size="small" label="Ukuran" value={b?.ukuran || ''} InputProps={{ readOnly: true }} />
                      <TextField size="small" label="Jarak" value={b?.jarak || ''} InputProps={{ readOnly: true }} />
                      <TextField size="small" label="Keterangan" value={b?.keterangan || ''} InputProps={{ readOnly: true }} />
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {b?.file && (
                        <Button size="small" variant="outlined" onClick={() => {
                          try {
                            const a = document.createElement('a');
                            a.href = b.file!;
                            a.download = `${preview.row!.idSpk}-${k}.jpg`;
                            a.click();
                          } catch {}
                        }}>Download</Button>
                      )}
                      {!has && (
                        <Chip size="small" label="Kosong" />
                      )}
                    </Stack>
                  </Box>
                );
              })}
              {/* CDR file preview/download */}
              <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>FILE CDR (COREL DRAW)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, background: '#fafafa', border: '1px dashed #e0e0e0', borderRadius: 1 }}>
                  {preview.row.cdr?.file ? (
                    <Chip size="small" label={preview.row.cdr?.filename || 'file.cdr'} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">Tidak ada file</Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {preview.row.cdr?.file && (
                    <Button size="small" variant="outlined" onClick={() => {
                      try {
                        const a = document.createElement('a');
                        a.href = preview.row!.cdr!.file!;
                        a.download = `${preview.row!.idSpk}-desain.cdr`;
                        a.click();
                      } catch {}
                    }}>Download CDR</Button>
                  )}
                </Stack>
              </Box>
            </Box>
          ) : 'Tidak ada data'}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
