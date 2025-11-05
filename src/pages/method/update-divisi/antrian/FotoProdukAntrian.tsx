import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';
export default function FotoProdukAntrian() {
  return (
    <Box sx={{ p: 3 }}>
  <DivisionAntrianTable title="Antrian Pekerjaan Foto Produk" divisionKey="foto-produk" />
    </Box>
  );
}
