import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';
export default function SettingAntrian() {
  return (
    <Box sx={{ p: 3 }}>
  <DivisionAntrianTable title="Antrian Pekerjaan Setting" divisionKey="setting" />
    </Box>
  );
}
