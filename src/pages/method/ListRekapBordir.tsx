import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import TableExportToolbar from "../../components/TableExportToolbar";

type RekapItem = {
  idRekapProduksi: string;
  idTransaksi: string;
  jumlahSpk: number;
  idSpk: string;
  idRekapCustom: string;
  idCustom: string;
  namaDesain: string;
  kuantity: number;
  statusDesain: string;
};

type RekapBordir = {
  rekapId: string;
  createdAt: string;
  items: RekapItem[];
};

export default function ListRekapBordir() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [data, setData] = useState<RekapBordir[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("method_rekap_bordir");
      setData(raw ? JSON.parse(raw) : []);
    } catch {
      setData([]);
    }
  }, []);

  const rows = useMemo(() => {
    return data.map((d) => {
      const items = d.items || [];
      const jumlahSpk = items.length;
      const listSpkArr = items.map((i) => i.idSpk);
      const qtyArr = items.map((i) => i.kuantity || 0);
      const totalQty = items.reduce((a, b) => a + (b.kuantity || 0), 0);
      return { rekapId: d.rekapId, jumlahSpk, listSpkArr, qtyArr, totalQty };
    });
  }, [data]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", maxHeight: "calc(100vh - 64px)", overflowY: "auto", p: 3, boxSizing: "border-box", flexDirection: "column" }}>
      <Box sx={{ width: "100%", borderRadius: 2, boxShadow: 2, flexDirection: "column", p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>List Rekap Bordir</Typography>
        <TableExportToolbar title="List Rekap Bordir" fileBaseName="list-rekap-bordir" tableRef={tableRef} />
        <TableContainer component={Paper}>
          <Table ref={tableRef} sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell align="center">No</TableCell>
                <TableCell align="center">ID REKAP BORDIR</TableCell>
                <TableCell align="center">JUMLAH SPK</TableCell>
                <TableCell align="center">LIST SPK</TableCell>
                <TableCell align="center">KUANTITY PER SPK</TableCell>
                <TableCell align="center">TOTAL KUANTITY</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Tidak ada data</TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={r.rekapId}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell align="center">{r.rekapId}</TableCell>
                    <TableCell align="center">{r.jumlahSpk}</TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>
                      {r.listSpkArr.map((spk, i) => (
                        <div key={`${r.rekapId}-spk-${i}`}>{spk}</div>
                      ))}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>
                      {r.qtyArr.map((q, i) => (
                        <div key={`${r.rekapId}-qty-${i}`}>{q}</div>
                      ))}
                    </TableCell>
                    <TableCell align="center">{r.totalQty}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
