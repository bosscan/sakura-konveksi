import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import kvStore from './lib/kvStore'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './layouts/Layout.tsx'
import InputPesanan from './pages/market/InputPesanan.tsx'
import AntrianInput from './pages/market/input-desain/AntrianInput.tsx'
import InputSpesifikasi from './pages/market/input-desain/input/Spesifikasi.tsx'
import InputDetail from './pages/market/input-desain/input/DetailProduk.tsx'
import DetailTambahan from './pages/market/input-desain/input/DetailTambahan.tsx'
import CekPesanan from './pages/market/CekPesanan.tsx'
import InputKeranjang from './pages/market/InputKeranjang.tsx'
import ListSPKOnProses from './pages/market/ListCPKOnProgress.tsx'
import InputPelunasan from './pages/market/InputPelunasan.tsx'
import PrintSPK from './pages/market/PrintSPK.tsx'
import RevisiSpk from './pages/market/RevisiSpk.tsx'
import Login from './auth/Login.tsx'
import Landing from './pages/Landing.tsx'
import LandingContentEditor from './pages/market/LandingContentEditor.tsx'
import AntrianPengerjaan from './pages/market/AntrianPengerjaan.tsx'
import DatabaseKonsumen from './pages/market/penjualan/DatabaseKonsumen.tsx'
import TrendPesanan from './pages/market/penjualan/TrendPesanan.tsx'
import SebaranWilayah from './pages/market/penjualan/SebaranWilayah.tsx'
import DatabaseProduk from './pages/market/penjualan/DatabaseProduk.tsx'
import InputSpkUrgent from './pages/market/spk-urgent/InputSpkUrgent.tsx'
import ListSpkUrgent from './pages/market/spk-urgent/ListSpkUrgent.tsx'
import CetakInvoice from './pages/market/CetakInvoice'
import CetakInvoicePelunasan from './pages/market/CetakInvoicePelunasan.tsx'
import DatabaseInvoice from './pages/market/DatabaseInvoice'
import Logistik1Input from './pages/material/input-stock/Logistik1';
import Logistik2Input from './pages/material/input-stock/Logistik2';
import Logistik3Input from './pages/material/input-stock/Logistik3';
import Logistik4Input from './pages/material/input-stock/Logistik4';
import Logistik5Input from './pages/material/input-stock/Logistik5';
import Logistik1Report from './pages/material/report-stock/Logistik1';
import Logistik2Report from './pages/material/report-stock/Logistik2';
import Logistik3Report from './pages/material/report-stock/Logistik3';
import Logistik4Report from './pages/material/report-stock/Logistik4';
import Logistik5Report from './pages/material/report-stock/Logistik5';
import DatabaseLogistik from './pages/material/DatabaseLogistik';
import DatabasePola from './pages/material/DatabasePola';
import HppLogistikPola from './pages/material/HppLogistikPola';
import { OmsetHarian, OmsetTanggal, OmsetJam, OmsetKumulatif } from './pages/money/pendapatan';
import { Konsolidasi } from './pages/money/konsolidasi';
import { GajiInput, GajiReport, BelanjaInput, BelanjaReport, FeeJaringan, FeeJaringanReport, MarketingAds, MarketingAdsReport, Ongkir, OngkirReport, PengeluaranKumulatif, MaintenanceInput, MaintenanceReport, OverheadInput, OverheadReport } from './pages/money/pengeluaran';
import PraProduksiAntrian from './pages/method/update-divisi/PraProduksiAntrian';
import PraProduksiRevisi from './pages/method/update-divisi/PraProduksiRevisi';
// Antrian pages per division
import ProduksiAntrian from './pages/method/update-divisi/antrian/ProduksiAntrian';
import CuttingPolaAntrian from './pages/method/update-divisi/antrian/CuttingPolaAntrian';
import StockBordirAntrian from './pages/method/update-divisi/antrian/StockBordirAntrian';
import BordirAntrian from './pages/method/update-divisi/antrian/BordirAntrian';
import SettingAntrian from './pages/method/update-divisi/antrian/SettingAntrian';
import StockJahitAntrian from './pages/method/update-divisi/antrian/StockJahitAntrian';
import JahitAntrian from './pages/method/update-divisi/antrian/JahitAntrian';
import FinishingAntrian from './pages/method/update-divisi/antrian/FinishingAntrian';
import FotoProdukAntrian from './pages/method/update-divisi/antrian/FotoProdukAntrian';
import PengirimanAntrian from './pages/method/update-divisi/antrian/PengirimanAntrian';
import StockNomorTransaksiAntrian from './pages/method/update-divisi/antrian/StockNomorTransaksiAntrian';
import TabelProsesDesain from './pages/method/TabelProsesDesain.tsx';
import TabelProsesProduksi from './pages/method/TabelProsesProduksi.tsx';
import SpkOnProses from './pages/method/spk-on-proses/SpkOnProses';
import CekProduksi from './pages/method/cek-produksi/CekProduksi';
import ListAntrianDesain from './pages/method/desain/ListAntrianDesain';
import ListRevisiDesain from './pages/method/desain/ListRevisiDesain';
import PlottingRekapBordir from './pages/method/PlottingRekapBordir';
import ListRekapBordir from './pages/method/ListRekapBordir';
import DatabaseAssetDesainJadi from './pages/method/DatabaseAssetDesainJadi';
import ListAssetMesin from './pages/mesin/ListAssetMesin';
import ReportMaintenanceMesin from './pages/mesin/ReportMaintenanceMesin';
import DataKaryawan from './pages/manpower/DataKaryawan';
import AbsensiKaryawan from './pages/manpower/AbsensiKaryawan';
import CapaianKaryawan from './pages/manpower/CapaianKaryawan';
import RejectKaryawan from './pages/manpower/RejectKaryawan';
import Dashboard from './layouts/Dashboard.tsx';
//lembar kerja 
import Produksi from './pages/method/update-divisi/lembar-kerja/produksi/Produksi.tsx'
import LembarProduksi from './pages/method/update-divisi/lembar-kerja/produksi/LembarProduksi.tsx'

import CuttingPola from './pages/method/update-divisi/lembar-kerja/cutting-pola/CuttingPola.tsx'
import LembarCuttingPola from './pages/method/update-divisi/lembar-kerja/cutting-pola/LembarCuttingPola.tsx'

import StockBordir from './pages/method/update-divisi/lembar-kerja/stock-bordir/StockBordir.tsx'
import LembarStockBordir from './pages/method/update-divisi/lembar-kerja/stock-bordir/LembarStockBordir.tsx'

import Bordir from './pages/method/update-divisi/lembar-kerja/bordir/Bordir.tsx'
import LembarBordir from './pages/method/update-divisi/lembar-kerja/bordir/LembarBordir.tsx'

import Setting from './pages/method/update-divisi/lembar-kerja/setting/Setting.tsx'
import LembarSetting from './pages/method/update-divisi/lembar-kerja/setting/LembarSetting.tsx'

import StockJahit from './pages/method/update-divisi/lembar-kerja/stock-jahit/StockJahit.tsx'
import LembarStockJahit from './pages/method/update-divisi/lembar-kerja/stock-jahit/LembarStockJahit.tsx'

import Jahit from './pages/method/update-divisi/lembar-kerja/jahit/Jahit.tsx'
import LembarJahit from './pages/method/update-divisi/lembar-kerja/jahit/LembarJahit.tsx'

import Finishing from './pages/method/update-divisi/lembar-kerja/finishing/Finishing.tsx'
import LembarFinishing from './pages/method/update-divisi/lembar-kerja/finishing/LembarFinishing.tsx'

import FotoProduk from './pages/method/update-divisi/lembar-kerja/foto-produk/FotoProduk.tsx'
import LembarFotoProduk from './pages/method/update-divisi/lembar-kerja/foto-produk/LembarFotoProduk.tsx'

import StockNomorTransaksi from './pages/method/update-divisi/lembar-kerja/stock-nomor-transaksi/StockNomorTransaksi.tsx'
import LembarStockTransaksi from './pages/method/update-divisi/lembar-kerja/stock-nomor-transaksi/LembarStokTransaksi.tsx'

import Pengiriman from './pages/method/update-divisi/lembar-kerja/pengiriman/Pengiriman.tsx'
import LembarPengiriman from './pages/method/update-divisi/lembar-kerja/pengiriman/LembarPengiriman.tsx'

// Optional: allow manual reset by visiting any route with ?reset=all (kvStore only)
try {
  const url = new URL(window.location.href);
  if (url.searchParams.get('reset') === 'all') {
    const keysToClear = [
      'antrian_input_desain',
      'design_queue',
      'keranjang',
      'plotting_rekap_bordir_queue',
      'spk_pipeline',
      'method_rekap_bordir',
      'database_produk',
      'database_konsumen',
      'database_trend',
      'database_sebaran',
      'omset_pendapatan',
      'current_spk_context',
      'pelunasan_transaksi',
    ];
    await Promise.all(keysToClear.map((k) => kvStore.remove(k)));
    // strip the reset param and reload
    url.searchParams.delete('reset');
    window.history.replaceState({}, '', url.toString());
  }
} catch {}

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: 'dashboard', Component: Dashboard },
          {
            path: '/market/input-pesanan',
            Component: InputPesanan,
          },
          {
            path: '/market/input-desain/antrian-input',
            Component: AntrianInput,
          },
          {
            path: '/market/input-desain/input-spesifikasi',
            Component: InputSpesifikasi,
          },
          {
            path: '/market/input-desain/input-detail',
            Component: InputDetail,
          },
          {
            path: '/market/input-desain/input-tambahan',
            Component: DetailTambahan,
          },
          {
            path: '/market/input-desain/cek-pesananan',
            Component: CekPesanan,
          },
          {
            path: 'market/antrian-pengerjaan',
            Component: AntrianPengerjaan,
          },
          {
            path: 'market/keranjang',
            Component: InputKeranjang,
          },
          {
            path: 'market/input-pelunasan',
            Component: InputPelunasan,
          },
          {
            path: 'market/spk-proses',
            Component: ListSPKOnProses,
          },
          {
            path: 'market/kelola-landing',
            Component: LandingContentEditor,
          },
          {
            path: 'market/spk-urgent/input-spk-urgent',
            Component: InputSpkUrgent,
          },
          {
            path: 'market/spk-urgent/list-spk-urgent',
            Component: ListSpkUrgent,
          },
          {
            path: 'market/print-spk',
            Component: PrintSPK,
          },
          {
            path: 'market/revisi-spk',
            Component: RevisiSpk,
          },
          {
            path: 'market/cek-pesanan',
            Component: CekPesanan
          },
          {
            path: 'market/penjualan/database-konsumen',
            Component: DatabaseKonsumen
          },
          {
            path: 'market/penjualan/trend-pesanan',
            Component: TrendPesanan
          },
          {
            path: 'market/penjualan/sebaran-wilayah',
            Component: SebaranWilayah
          },
          {
            path: 'market/penjualan/database-produk',
            Component: DatabaseProduk
          }
          ,{ path: 'market/cetak-invoice', Component: CetakInvoice }
          ,{ path: 'market/cetak-invoice-pelunasan', Component: CetakInvoicePelunasan }
          ,{ path: 'market/database-invoice', Component: DatabaseInvoice }
          ,{ path: 'method/update-divisi/pra-produksi/antrian-desain', Component: PraProduksiAntrian }
          ,{ path: 'method/update-divisi/pra-produksi/revisi-desain', Component: PraProduksiRevisi }
          // Method - Update Divisi - sub pages (antrian & lembar-kerja)
          ,{ path: 'method/update-divisi/produksi/antrian', Component: ProduksiAntrian }
          ,{ path: 'method/update-divisi/produksi/lembar-kerja', Component: Produksi },
          {path: 'method/update-divisi/produksi/detail-lembar-kerja', Component: LembarProduksi}

          ,{ path: 'method/update-divisi/cutting-pola/antrian', Component: CuttingPolaAntrian }
          ,{ path: 'method/update-divisi/cutting-pola/lembar-kerja', Component: CuttingPola }
          ,{ path: 'method/update-divisi/cutting-pola/detail-lembar-kerja', Component: LembarCuttingPola }


          ,{ path: 'method/update-divisi/stock-bordir/lembar-kerja', Component: StockBordir }
          ,{ path: 'method/update-divisi/stock-bordir/antrian', Component: StockBordirAntrian }
          ,{ path: 'method/update-divisi/stock-bordir/detail-lembar-kerja', Component: LembarStockBordir }

          ,{ path: 'method/update-divisi/bordir/lembar-kerja', Component: Bordir }
          ,{ path: 'method/update-divisi/bordir/antrian', Component: BordirAntrian }
          ,{ path: 'method/update-divisi/bordir/detail-lembar-kerja', Component: LembarBordir }

          ,{ path: 'method/update-divisi/setting/lembar-kerja', Component: Setting }
          ,{ path: 'method/update-divisi/setting/antrian', Component: SettingAntrian }
          ,{ path: 'method/update-divisi/setting/detail-lembar-kerja', Component: LembarSetting }

          ,{ path: 'method/update-divisi/stock-jahit/lembar-kerja', Component: StockJahit }
          ,{ path: 'method/update-divisi/stock-jahit/antrian', Component: StockJahitAntrian }
          ,{ path: 'method/update-divisi/stock-jahit/detail-lembar-kerja', Component: LembarStockJahit }

          ,{ path: 'method/update-divisi/jahit/lembar-kerja', Component: Jahit }
          ,{ path: 'method/update-divisi/jahit/antrian', Component: JahitAntrian }
          ,{ path: 'method/update-divisi/jahit/detail-lembar-kerja', Component: LembarJahit }

          ,{ path: 'method/update-divisi/finishing/lembar-kerja', Component: Finishing }
          ,{ path: 'method/update-divisi/finishing/antrian', Component: FinishingAntrian }
          ,{ path: 'method/update-divisi/finishing/detail-lembar-kerja', Component: LembarFinishing }

          ,{ path: 'method/update-divisi/foto-produk/lembar-kerja', Component: FotoProduk }
          ,{ path: 'method/update-divisi/foto-produk/antrian', Component: FotoProdukAntrian }
          ,{ path: 'method/update-divisi/foto-produk/detail-lembar-kerja', Component: LembarFotoProduk }

          ,{ path: 'method/update-divisi/stock-nomor-transaksi/lembar-kerja', Component: StockNomorTransaksi }
          ,{ path: 'method/update-divisi/stock-nomor-transaksi/antrian', Component: StockNomorTransaksiAntrian }
          ,{ path: 'method/update-divisi/stock-nomor-transaksi/detail-lembar-kerja', Component: LembarStockTransaksi }

          ,{ path: 'method/update-divisi/pengiriman/lembar-kerja', Component: Pengiriman }
          ,{ path: 'method/update-divisi/pengiriman/antrian', Component: PengirimanAntrian }
          ,{ path: 'method/update-divisi/pengiriman/detail-lembar-kerja', Component: LembarPengiriman }
          
          // Method - SPK & Tables & Cek Produksi
          ,{ path: 'method/spk-on-proses', Component: SpkOnProses }
          ,{ path: 'method/tabel-proses/desain', Component: TabelProsesDesain }
          ,{ path: 'method/tabel-proses/produksi', Component: TabelProsesProduksi }
          ,{ path: 'method/cek-produksi', Component: CekProduksi }
          ,{ path: 'method/plotting-rekap-bordir', Component: PlottingRekapBordir }
          ,{ path: 'method/list-rekap-bordir', Component: ListRekapBordir }
          ,{ path: 'method/database-asset-desain', Component: DatabaseAssetDesainJadi }
          // Method - Desain Lists
          ,{ path: 'method/desain/antrian-desain', Component: ListAntrianDesain }
          ,{ path: 'method/desain/revisi-desain', Component: ListRevisiDesain }
          // Mesin
          ,{ path: 'mesin/list-asset-mesin', Component: ListAssetMesin }
          ,{ path: 'mesin/report-maintenance-mesin', Component: ReportMaintenanceMesin }
          // Man Power
          ,{ path: 'man-power/data-karyawan', Component: DataKaryawan }
          ,{ path: 'man-power/absensi-karyawan', Component: AbsensiKaryawan }
          ,{ path: 'man-power/capaian-karyawan', Component: CapaianKaryawan }
          ,{ path: 'man-power/reject-karyawan', Component: RejectKaryawan }
          // Material
          ,{ path: 'material/input-stock/logistik-1', Component: Logistik1Input }
          ,{ path: 'material/input-stock/logistik-2', Component: Logistik2Input }
          ,{ path: 'material/input-stock/logistik-3', Component: Logistik3Input }
          ,{ path: 'material/input-stock/logistik-4', Component: Logistik4Input }
          ,{ path: 'material/input-stock/logistik-5', Component: Logistik5Input }
          ,{ path: 'material/report-stock/logistik-1', Component: Logistik1Report }
          ,{ path: 'material/report-stock/logistik-2', Component: Logistik2Report }
          ,{ path: 'material/report-stock/logistik-3', Component: Logistik3Report }
          ,{ path: 'material/report-stock/logistik-4', Component: Logistik4Report }
          ,{ path: 'material/report-stock/logistik-5', Component: Logistik5Report }
          ,{ path: 'material/database-logistik', Component: DatabaseLogistik }
          ,{ path: 'material/database-pola', Component: DatabasePola }
          ,{ path: 'material/hpp-logistik-pola', Component: HppLogistikPola }
            // Money - Pendapatan
            ,{ path: 'money/pendapatan/omset-harian', Component: OmsetHarian }
            ,{ path: 'money/pendapatan/omset-tanggal', Component: OmsetTanggal }
            ,{ path: 'money/pendapatan/omset-jam', Component: OmsetJam }
            ,{ path: 'money/pendapatan/omset-kumulatif', Component: OmsetKumulatif }
            ,{ path: 'money/pendapatan/omset-kumulatif/omset-report', Component: OmsetKumulatif }
            // Money - Konsolidasi
            ,{ path: 'money/konsolidasi/summary', Component: Konsolidasi }
            // Money - Pengeluaran
            ,{ path: 'money/pengeluaran/gaji/gaji-input', Component: GajiInput }
            ,{ path: 'money/pengeluaran/gaji/gaji-report', Component: GajiReport }
            ,{ path: 'money/pengeluaran/belanja-logistik/belanja-input', Component: BelanjaInput }
            ,{ path: 'money/pengeluaran/belanja-logistik/belanja-report', Component: BelanjaReport }
            ,{ path: 'money/pengeluaran/fee-jaringan/fee-input', Component: FeeJaringan }
            ,{ path: 'money/pengeluaran/fee-jaringan/fee-report', Component: FeeJaringanReport }
            ,{ path: 'money/pengeluaran/biaya-marketing/marketing-ads-input', Component: MarketingAds }
            ,{ path: 'money/pengeluaran/biaya-marketing/marketing-ads-report', Component: MarketingAdsReport }
            ,{ path: 'money/pengeluaran/ongkir/ongkir-input', Component: Ongkir }
            ,{ path: 'money/pengeluaran/ongkir/ongkir-report', Component: OngkirReport }
            ,{ path: 'money/pengeluaran/maintenance-mesin/maintenance-input', Component: MaintenanceInput }
            ,{ path: 'money/pengeluaran/maintenance-mesin/maintenance-report', Component: MaintenanceReport }
            ,{ path: 'money/pengeluaran/overhead-pabrik/overhead-input', Component: OverheadInput }
            ,{ path: 'money/pengeluaran/overhead-pabrik/overhead-report', Component: OverheadReport }
            ,{ path: 'money/pengeluaran/pengeluaran-kumulatif', Component: PengeluaranKumulatif }
        ],
      }
    ],
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/landing',
    Component: Landing,
  }
])

// CloudStorageBridge removed: kvStore is the single source of truth across the app

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
