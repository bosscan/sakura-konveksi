import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';
export default function CuttingPolaAntrian() {
  return (
    <Box sx={{ p: 3 }}>
  <DivisionAntrianTable title="Antrian Pekerjaan Cutting Pola" divisionKey="cutting-pola" />
    </Box>
  );
}
