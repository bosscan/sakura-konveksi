import { useEffect, useRef, useState } from 'react';
import kvStore from '../../lib/kvStore';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer } from '@mui/material';
import TableExportToolbar from '../../components/TableExportToolbar';

interface PrognosisItem { id:string; namaCalon:string; nomorHp:string; tanggalChat:string; waktu:string; source:string; produkDitanyakan?:string; namaCS?:string; tanggalDeal?:string; createdAt?:string; updatedAt?:string }
interface PesananItem { number?:string; tanggalInput?:string }

function sanitizeHp(hp:string){ return (hp||'').replace(/\D/g,''); }

export default function DatabasePrognosis(){
  const tableRef = useRef<HTMLTableElement|null>(null);
  const [rows,setRows] = useState<PrognosisItem[]>([]);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try {
        const key = 'database_prognosis';
        let list:PrognosisItem[] = [];
        try { const raw = await kvStore.get(key); list = Array.isArray(raw)? raw : (raw ? JSON.parse(String(raw)) : []); } catch {}
        let pesList:PesananItem[] = [];
        try { const rawPes = await kvStore.get('antrian_input_desain'); pesList = Array.isArray(rawPes)? rawPes : (rawPes ? JSON.parse(String(rawPes)) : []); } catch {}
        const dealMap = new Map<string,string>(); // hpSanitized -> tanggalDeal
        pesList.forEach(p=>{
          const hpSan = sanitizeHp(p.number||'');
          if(!hpSan) return;
          if(!dealMap.has(hpSan)){
            const t = p.tanggalInput || new Date().toLocaleDateString();
            dealMap.set(hpSan, t);
          }
        });
        let mutated = false;
        const enriched = list.map(it=>{
          const hpSan = sanitizeHp(it.nomorHp);
          const deal = dealMap.get(hpSan);
          if(deal && !it.tanggalDeal){ it.tanggalDeal = deal; mutated = true; }
          return it;
        });
        if(mutated){
          try { await kvStore.set(key, enriched); } catch {}
        }
        enriched.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
        if(mounted) setRows(enriched);
      } catch {}
    })();
    return ()=>{ mounted = false; };
  },[]);

  return (
    <Box sx={{p:3}}>
      <Typography variant='h6' sx={{fontWeight:'bold', mb:2}}>Database Prognosis</Typography>
      <TableExportToolbar title='Database Prognosis' tableRef={tableRef} fileBaseName='database-prognosis' />
      <TableContainer component={Paper} sx={{width:'100%', overflowX:'auto'}}>
        <Table sx={{minWidth:900}} ref={tableRef} aria-label='database-prognosis-table'>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Nama Calon Pelanggan</TableCell>
              <TableCell>Nomor HP</TableCell>
              <TableCell>Nama CS</TableCell>
              <TableCell>Tanggal Chat</TableCell>
              <TableCell>Waktu</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Produk yang Ditanyakan</TableCell>
              <TableCell>Tanggal Deal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r,idx)=>(
              <TableRow key={r.id}>
                <TableCell>{idx+1}</TableCell>
                <TableCell>{r.namaCalon}</TableCell>
                <TableCell>{r.nomorHp}</TableCell>
                <TableCell>{r.namaCS||''}</TableCell>
                <TableCell>{r.tanggalChat}</TableCell>
                <TableCell sx={{textTransform:'capitalize'}}>{r.waktu}</TableCell>
                <TableCell>{r.source}</TableCell>
                <TableCell>{r.produkDitanyakan||''}</TableCell>
                <TableCell>{r.tanggalDeal||''}</TableCell>
              </TableRow>
            ))}
            {rows.length===0 && (
              <TableRow><TableCell colSpan={7} align='center'>Belum ada data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
