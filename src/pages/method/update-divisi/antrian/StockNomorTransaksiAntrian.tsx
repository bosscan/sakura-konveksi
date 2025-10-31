import { Box } from '@mui/material';
import DivisionAntrianTable from './DivisionAntrianTable';

export default function StockNomorTransaksiAntrian() {
  return (
    <Box sx={{ p: 3 }}>
      <DivisionAntrianTable title="Antrian Stock Nomor Transaksi" divisionKey="stock-no-transaksi" />
    </Box>
  );
}
