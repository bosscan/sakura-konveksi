import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';
export default function StockJahitAntrian() {
  return (
    <Box sx={{ p: 3 }}>
  <DivisionAntrianTable title="Antrian Pekerjaan Stock Jahit" divisionKey="stock-jahit" />
    </Box>
  );
}
