import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';
export default function PengirimanAntrian() {
  return (
    <Box sx={{ p: 3 }}>
  <DivisionAntrianTable title="Antrian Pekerjaan Pengiriman" divisionKey="pengiriman" />
    </Box>
  );
}
