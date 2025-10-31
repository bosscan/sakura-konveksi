import { Box, TextField, Typography, Select, MenuItem, Button, Snackbar, Alert, RadioGroup, FormControlLabel, Radio, Grid } from '@mui/material';
import { useState } from 'react';

/**
 * Input Prognosis
 * Form untuk CS menginput prognosis transaksi calon pelanggan.
 * Disimpan ke localStorage key: `database_prognosis`.
 * Field: Nama Calon Pelanggan, Nomor HP, Tanggal Chat (yyyy-mm-dd), Waktu (pagi/siang/malam), Source.
 */
export default function InputPrognosis() {
  const [nama, setNama] = useState('');
  const [hp, setHp] = useState('');
  const [tanggalChat, setTanggalChat] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [waktu, setWaktu] = useState<'pagi'|'siang'|'malam'|''>('');
  const [source, setSource] = useState('');
  const [produk, setProduk] = useState('');
  const [snack, setSnack] = useState<{open:boolean;message:string;severity:'success'|'error'|'info'}>({open:false,message:'',severity:'success'});
  const csName = (typeof window !== 'undefined' ? localStorage.getItem('current_cs') : '') || '-';

  const resetForm = () => {
    setNama('');
    setHp('');
    setTanggalChat(new Date().toISOString().slice(0,10));
    setWaktu('');
    setSource('');
  setProduk('');
  };

  const handleSave = () => {
    if(!nama || !hp || !tanggalChat || !waktu || !source){
      setSnack({open:true,message:'Lengkapi semua field',severity:'error'});
      return;
    }
    try {
      const key = 'database_prognosis';
      const raw = localStorage.getItem(key);
      const list: any[] = raw ? JSON.parse(raw) : [];
      const now = new Date().toISOString();
      const payload = {
        id: `PROG-${Date.now()}`,
        namaCalon: nama,
        nomorHp: hp,
        tanggalChat,
        waktu,
        source,
        produkDitanyakan: produk,
        namaCS: csName,
        createdAt: now,
        updatedAt: now,
      };
      list.push(payload);
      localStorage.setItem(key, JSON.stringify(list));
      setSnack({open:true,message:'Prognosis tersimpan',severity:'success'});
      resetForm();
    } catch (e) {
      setSnack({open:true,message:'Gagal simpan prognosis',severity:'error'});
    }
  };

  return (
    <Box sx={{p:3, width:'100%', display:'flex', justifyContent:'center'}}>
      <Box sx={{width:'70%', maxWidth:900}}>
        <Typography variant="h6" sx={{fontWeight:'bold', mb:2}}>Input Prognosis</Typography>
        <Grid container spacing={3}>
          <Grid size={6}>
            <Box sx={{display:'flex', alignItems:'center'}}>
              <Typography sx={{mr:1}}>Nama Calon Pelanggan:</Typography>
              <TextField fullWidth size="small" value={nama} onChange={e=>setNama(e.target.value)} />
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{display:'flex', alignItems:'center'}}>
              <Typography sx={{mr:1}}>Nomor HP:</Typography>
              <TextField fullWidth size="small" value={hp} onChange={e=>setHp(e.target.value)} />
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{display:'flex', alignItems:'center'}}>
              <Typography sx={{mr:1}}>Tanggal Chat:</Typography>
              <TextField type="date" fullWidth size="small" value={tanggalChat} onChange={e=>setTanggalChat(e.target.value)} />
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{display:'flex', alignItems:'center'}}>
              <Typography sx={{mr:1}}>Waktu:</Typography>
              <RadioGroup row value={waktu} onChange={e=>setWaktu(e.target.value as any)}>
                <FormControlLabel value="pagi" control={<Radio size="small"/>} label="Pagi" />
                <FormControlLabel value="siang" control={<Radio size="small"/>} label="Siang" />
                <FormControlLabel value="malam" control={<Radio size="small"/>} label="Malam" />
              </RadioGroup>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{display:'flex', alignItems:'center'}}>
              <Typography sx={{mr:1}}>Source:</Typography>
              <Select fullWidth size="small" value={source} displayEmpty onChange={e=>setSource(e.target.value as string)}>
                <MenuItem value="">Pilih Source</MenuItem>
                <MenuItem value="WA">WA</MenuItem>
                <MenuItem value="IG">IG</MenuItem>
                <MenuItem value="FB">FB</MenuItem>
                <MenuItem value="Tiktok">Tiktok</MenuItem>
                <MenuItem value="Marketplace">Marketplace</MenuItem>
                <MenuItem value="Lainnya">Lainnya</MenuItem>
              </Select>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{display:'flex', alignItems:'center'}}>
              <Typography sx={{mr:1}}>Produk yang ditanyakan:</Typography>
              <TextField fullWidth size="small" value={produk} onChange={e=>setProduk(e.target.value)} />
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{display:'flex', alignItems:'center'}}>
              <Typography sx={{mr:1}}>Nama CS:</Typography>
              <TextField fullWidth size="small" value={csName} InputProps={{readOnly:true}} />
            </Box>
          </Grid>
          <Grid size={12}>
            <Box sx={{display:'flex', justifyContent:'flex-end', gap:2}}>
              <Button variant="outlined" onClick={resetForm}>Reset</Button>
              <Button variant="contained" onClick={handleSave}>Simpan</Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={()=>setSnack(s=>({...s,open:false}))} anchorOrigin={{vertical:'bottom', horizontal:'center'}}>
        <Alert onClose={()=>setSnack(s=>({...s,open:false}))} severity={snack.severity} variant='filled' sx={{width:'100%'}}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
