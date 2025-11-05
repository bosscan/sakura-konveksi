import { Box, Button, Stack } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn';
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type TableRowData = Record<string, any>;
type DataShape = { hdrs: string[]; body: Array<Record<string, any>> };

type Props = {
  title?: string;
  headers?: string[]; // optional: display headers in order
  rows?: TableRowData[]; // optional: rows matching headers
  tableRef?: React.RefObject<HTMLTableElement | null>; // alternative: parse from DOM
  fileBaseName?: string; // base name for downloads
};

export default function TableExportToolbar({ title, headers, rows, tableRef, fileBaseName = 'export' }: Props) {
  const filename = `${fileBaseName}-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}`;

  const doCopy = async () => {
    try {
      const { hdrs, body }: DataShape = getData();
      const tsv = [
        hdrs.join('\t'),
        ...body.map((r: Record<string, any>) => hdrs.map((h: string) => sanitize(r[h])).join('\t')),
      ].join('\n');
      await navigator.clipboard.writeText(tsv);
    } catch {}
  };

  const sanitize = (v: any) => (v === undefined || v === null ? '' : String(v));

  const fromDom = () => {
    const el = tableRef?.current;
    if (!el) return { headers: [] as string[], rows: [] as string[][] };
    const headCells = Array.from(el.querySelectorAll('thead th, thead td')) as HTMLElement[];
    const headers = headCells.map((c) => c.innerText.trim());
    const bodyRows = Array.from(el.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
    const rows = bodyRows.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td as HTMLElement).innerText.trim()));
    return { headers, rows };
  };

  const getData = () => {
    if (headers && rows) {
      return { hdrs: headers, body: rows as Array<Record<string, any>> } as DataShape;
    }
    const dom = fromDom();
    const hdrs: string[] = dom.headers.length ? dom.headers : [];
    const body: Array<Record<string, any>> = dom.rows.map((arr) => {
      const obj: Record<string, any> = {};
      hdrs.forEach((h, i) => { obj[h] = arr[i] ?? ''; });
      return obj;
    });
    return { hdrs, body } as DataShape;
  };

  const downloadExcel = async () => {
    const { hdrs, body }: DataShape = getData();
    const wb = new Workbook();
    const ws = wb.addWorksheet('Sheet1');

    // Header row
    if (hdrs.length) {
      ws.addRow(hdrs.map((h) => sanitize(h)));
    }
    // Data rows
    body.forEach((r: Record<string, any>) => {
      ws.addRow(hdrs.map((h: string) => sanitize(r[h])));
    });

    // Auto width per column (basic)
    ws.columns?.forEach((col: any, idx: number) => {
      let max = 10;
      // Start from header length if present
      if (Array.isArray(hdrs) && hdrs[idx]) {
        max = Math.max(max, String(hdrs[idx]).length);
      }
      if (col && typeof col.eachCell === 'function') {
        col.eachCell({ includeEmpty: true }, (cell: any) => {
          const len = String(cell?.value ?? '').length;
          if (len > max) max = len;
        });
      }
      if (col) {
        col.width = Math.min(Math.max(max + 2, 10), 60);
      }
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  };

  const downloadPdf = () => {
    const { hdrs, body }: DataShape = getData();
    const doc = new jsPDF({ orientation: 'landscape' });
    if (title) doc.text(title, 14, 14);
    autoTable(doc, {
      head: [hdrs],
      body: body.map((r: Record<string, any>) => hdrs.map((h: string) => sanitize(r[h]))),
      startY: title ? 18 : undefined,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 243] },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} / ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      },
    });
    doc.save(`${filename}.pdf`);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={doCopy}>Copy</Button>
        <Button size="small" variant="outlined" startIcon={<GridOnIcon />} onClick={downloadExcel}>Excel</Button>
        <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={downloadPdf}>PDF</Button>
      </Stack>
    </Box>
  );
}
