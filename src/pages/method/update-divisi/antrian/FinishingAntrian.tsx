import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';
export default function FinishingAntrian() {
  return (
    <Box sx={{ p: 3 }}>
  <DivisionAntrianTable title="Antrian Pekerjaan Finishing" divisionKey="finishing" />
    </Box>
  );
}
