import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';
export default function BordirAntrian() {
  return (
    <Box sx={{ p: 3 }}>
  <DivisionAntrianTable title="Antrian Pekerjaan Bordir" divisionKey="bordir" />
    </Box>
  );
}
