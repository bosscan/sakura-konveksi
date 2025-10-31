import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import TableExportToolbar from "../../../components/TableExportToolbar";
import { useNavigate } from "react-router-dom";

type QueueItem = {
  idRekapCustom: string;
  idSpk?: string;
  idCustom: string;
  namaDesain: string;
  jenisProduk: string;
  jenisPola: string;
  tanggalInput: string;
  namaCS: string;
  assets: Array<{ file: string | null; attribute: string; size: string; distance: string; description: string }>;
  status: string;
};

export default function AntrianPengerjaanDesain() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const navigate = useNavigate();
  const [rows, setRows] = useState<QueueItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('design_queue');
    const list: QueueItem[] = raw ? JSON.parse(raw) : [];
    setRows(list);
  }, []);

  const handleKerjakan = (id: string) => {
    navigate(`/method/update-divisi/pra-produksi/antrian-desain?rekap=${encodeURIComponent(id)}`);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '100%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Antrian Pengerjaan Desain (Method)</Typography>
        <TableExportToolbar title="Antrian Pengerjaan Desain" tableRef={tableRef} fileBaseName="method-antrian-pengerjaan-desain" />
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200 }} aria-label="antrian-pengerjaan-desain" ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID Rekap Custom</TableCell>
                <TableCell>ID Custom</TableCell>
                <TableCell>Nama Desain</TableCell>
                <TableCell>Jenis Produk</TableCell>
                <TableCell>Jenis Pola</TableCell>
                <TableCell>Tanggal Input Desain</TableCell>
                <TableCell>Nama CS</TableCell>
                <TableCell>Asset Desain</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${row.idRekapCustom}-${row.idSpk || index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.idRekapCustom}</TableCell>
                  <TableCell>{row.idSpk || '-'}</TableCell>
                  <TableCell>{row.idCustom}</TableCell>
                  <TableCell>{row.namaDesain}</TableCell>
                  <TableCell>{row.jenisProduk}</TableCell>
                  <TableCell>{row.jenisPola}</TableCell>
                  <TableCell>{row.tanggalInput}</TableCell>
                  <TableCell>{row.namaCS}</TableCell>
                  <TableCell>{row.assets?.length || 0} file</TableCell>
                  <TableCell>
                    <Button variant="contained" onClick={() => handleKerjakan(row.idRekapCustom)}>Kerjakan</Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">Tidak ada antrian</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
