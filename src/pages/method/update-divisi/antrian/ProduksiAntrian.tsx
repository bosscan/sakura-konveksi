import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';
export default function ProduksiAntrian() {
  return (
    <Box sx={{ p: 3 }}>
  <DivisionAntrianTable title="Antrian Pekerjaan Desain Produksi" divisionKey="desain-produksi" />
    </Box>
  );
}
