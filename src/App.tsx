import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { AppProvider } from '@toolpad/core';
import './App.css'
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import MoneyIcon from '@mui/icons-material/Money';
import ComputerIcon from '@mui/icons-material/Computer';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useEffect, useMemo, useState } from 'react';
import { allowedMenusForRole, LS_KEYS, clearAuth } from './lib/auth';
import kvStore from './lib/kvStore';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
// GlobalLoader removed per request (overlay spinner felt disruptive)

const NAVIGATION = [
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <HomeOutlinedIcon />,
  },
  {
    segment: 'market',
    title: 'Market',
    icon: <StorefrontIcon />,
    children: [
      {
        segment: 'input-pesanan',
        title: 'Input Pesanan',
        icon: ''
      },
      {
        segment: 'input-desain',
        title: 'Input Desain',
        icon: '',
        children: [
          {
            segment: 'antrian-input',
            title: 'Antrian Input Desain',
            icon: ''
          }
        ]
      },
      {
        segment: 'antrian-pengerjaan',
        title: 'Antrian Pengerjaan Desain',
        icon: ''
      },
      {
        segment: 'keranjang',
        title: 'Keranjang',
        icon: ''
      },
      {
        segment: 'spk-proses',
        title: 'List SPK On Proses',
        icon: ''
      },
      {
        segment: 'kelola-landing',
        title: 'Kelola Landing Page',
        icon: ''
      },
      {
        segment: 'spk-urgent',
        title: 'SPK Urgent',
        icon: '',
        children: [
          { segment: 'input-spk-urgent', title: 'Input SPK Urgent', icon: '' },
          { segment: 'list-spk-urgent', title: 'List SPK Urgent', icon: '' },
        ],
      },
      {
        segment: 'print-spk',
        title: 'Print SPK',
        icon: ''
      },
      {
        segment: 'revisi-spk',
        title: 'Revisi SPK',
        icon: ''
      },
      {
        segment: 'cetak-invoice',
        title: 'Cetak Invoice DP/DPL',
        icon: ''
      },
      {
        segment: 'cetak-invoice-pelunasan',
        title: 'Cetak Invoice Pelunasan',
        icon: ''
      },
      {
        segment: 'database-invoice',
        title: 'Database Invoice',
        icon: ''
      },
      {
        segment: 'penjualan',
        title: 'Penjualan',
        icon: '',
        children: [
          {
            segment: 'database-konsumen',
            title: 'Database Konsumen',
            icon: ''
          },
          {
            segment: 'trend-pesanan',
            title: 'Trend Pesanan',
            icon: ''
          },
          {
            segment: 'sebaran-wilayah',
            title: 'Sebaran Wilayah Penjualan',
            icon: ''
          },
          {
            segment: 'database-produk',
            title: 'Database Foto Produk',
            icon: ''
          }
        ]
      },
      {
        segment: 'cek-pesanan',
        title: 'Cek Pesanan',
        icon: ''
      }
      ,{
        segment: 'input-pelunasan',
        title: 'Input Pelunasan',
        icon: ''
      }
    ]
  },
  {
    segment: 'method',
    title: 'Method',
    icon: <ComputerIcon />,
    children: [
      {
        segment: 'update-divisi',
        title: 'Update Status Divisi',
        icon: '',
        children: [
          {
            segment: 'pra-produksi',
            title: 'Divisi Desainer Pra Produksi',
            icon: '',
            children: [
              {
                segment: 'antrian-desain',
                title: 'Antrian Pengerjaan Desain',
                icon: ''
              },
              {
                segment: 'revisi-desain',
                title: 'Antrian Pengerjaan Revisi Desain',
                icon: ''
              }
            ]
          },
          {
            segment: 'produksi',
            title: 'Divisi Desainer Produksi',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Desain Produksi', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Desainer Produksi', icon: '' },
            ]
          },
          {
            segment: 'cutting-pola',
            title: 'Divisi Cutting Pola',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Cutting Pola', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Cutting Pola', icon: '' },
            ]
          },
          {
            segment: 'stock-bordir',
            title: 'Divisi Stock Bordir',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Stock Bordir', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Stock Bordir', icon: '' },
            ]
          },
          {
            segment: 'bordir',
            title: 'Divisi Bordir',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Bordir', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Bordir', icon: '' },
            ]
          },
          {
            segment: 'setting',
            title: 'Divisi Setting',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Setting', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Setting', icon: '' },
            ]
          },
          {
            segment: 'stock-jahit',
            title: 'Divisi Stock Jahit',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Stock Jahit', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Stock Jahit', icon: '' },
            ]
          },
          {
            segment: 'jahit',
            title: 'Divisi Jahit',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Jahit', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Jahit', icon: '' },
            ]
          },
          {
            segment: 'finishing',
            title: 'Divisi Finishing',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Finishing', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Finishing', icon: '' },
            ]
          },
          {
            segment: 'foto-produk',
            title: 'Divisi Foto Produk',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Foto Produk', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Foto Produk', icon: '' },
            ]
          },
          {
            segment: 'stock-nomor-transaksi',
            title: 'Divisi Stock Nomor Transaksi',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Stock Nomor Transaksi', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Stock Nomor Transaksi', icon: '' },
            ]
          },
          {
            segment: 'pengiriman',
            title: 'Divisi Pengiriman',
            icon: '',
            children: [
              { segment: 'antrian', title: 'Antrian Pekerjaan Pengiriman', icon: '' },
              { segment: 'lembar-kerja', title: 'Lembar Kerja Pengiriman', icon: '' },
            ]
          },
        ]
      },
      {
        segment: 'spk-on-proses',
        title: 'List SPK On Proses',
        icon: ''
      },
      {
        segment: 'tabel-proses',
        title: 'Tabel Proses',
        icon: '',
        children: [
          {
            segment: 'desain',
            title: 'Desain',
            icon: ''
          },
          {
            segment: 'produksi',
            title: 'Produksi',
            icon: ''
          }
        ]
      },
      {
        segment: 'cek-produksi',
        title: 'Cek Status Produksi',
        icon: ''
      },
      {
        segment: 'plotting-rekap-bordir',
        title: 'Plotting Rekap Bordir',
        icon: ''
      },
      {
        segment: 'list-rekap-bordir',
        title: 'List Rekap Bordir',
        icon: ''
      },
      {
        segment: 'database-asset-desain',
        title: 'Database Asset Desain Jadi',
        icon: ''
      },
      {
        segment: 'desain',
        title: 'Desain',
        icon: '',
        children: [
          {
            segment: 'antrian-desain',
            title: 'List Antrian Desain',
            icon: ''
          },
          {
            segment: 'revisi-desain',
            title: 'List Revisi Desain',
            icon: ''
          }
        ]
      }
    ]
  },
  {
    segment: 'money',
    title: 'Money',
    icon: <MoneyIcon />,
    children: [
      {
        segment: 'pendapatan',
        title: 'Pendapatan',
        icon: '',
        children: [
          {
            segment: 'omset-harian',
            title: 'Report Omset Harian',
            icon: ''
          },
          {
            segment: 'omset-tanggal',
            title: 'Report Omset Per Tanggal',
            icon: ''
          },
          {
            segment: 'omset-jam',
            title: 'Report Omset Per Jam',
            icon: ''
          },
          {
            segment: 'omset-kumulatif',
            title: 'Omset Kumulatif',
            icon: ''
          },
        ]
      },
      {
        segment: 'pengeluaran',
        title: 'Pengeluaran',
        icon: '',
        children: [
          {
            segment: 'pengeluaran-kumulatif',
            title: 'Pengeluaran Kumulatif',
            icon: ''
          },
              {
                segment: 'maintenance-mesin',
                title: 'Biaya Maintenance Mesin',
                icon: '',
                children: [
                  { segment: 'maintenance-input', title: 'Input', icon: '' },
                  { segment: 'maintenance-report', title: 'Report', icon: '' },
                ]
              },
              {
                segment: 'overhead-pabrik',
                title: 'Biaya Overhead Pabrik',
                icon: '',
                children: [
                  { segment: 'overhead-input', title: 'Input', icon: '' },
                  { segment: 'overhead-report', title: 'Report', icon: '' },
                ]
              },
          {
            segment: 'gaji',
            title: 'Gaji',
            icon: '',
            children: [
              {
                segment: 'gaji-input',
                title: 'Input',
                icon: ''
              },
              {
                segment: 'gaji-report',
                title: 'Report',
                icon: ''
              }
            ]
          },
          {
            segment: 'belanja-logistik',
            title: 'Belanja Logistik',
            icon: '',
            children: [
              {
                segment: 'belanja-input',
                title: 'Input',
                icon: ''
              },
              {
                segment: 'belanja-report',
                title: 'Report',
                icon: ''
              }
            ]
          },
          {
            segment: 'fee-jaringan',
            title: 'Fee Jaringan',
            icon: '',
            children: [
              { segment: 'fee-input', title: 'Input', icon: '' },
              { segment: 'fee-report', title: 'Report', icon: '' },
            ]
          },
          {
            segment: 'biaya-marketing',
            title: 'Biaya Marketing',
            icon: '',
            children: [
              { segment: 'marketing-ads-input', title: 'Ads Input', icon: '' },
              { segment: 'marketing-ads-report', title: 'Ads Report', icon: '' },
            ]
          },
          {
            segment: 'ongkir',
            title: 'Ongkir Dibayarkan',
            icon: '',
            children: [
              { segment: 'ongkir-input', title: 'Input', icon: '' },
              { segment: 'ongkir-report', title: 'Report', icon: '' },
            ]
          }
        ]
      }
      ,{
        segment: 'konsolidasi',
        title: 'Konsolidasi',
        icon: '',
        children: [
          { segment: 'summary', title: 'Summary', icon: '' }
        ]
      }
    ]
  },
  {
    segment: 'material',
    title: 'Material',
    icon: <InventoryIcon />,
    children: [
      {
        segment: 'input-stock',
        title: 'Input Stock',
        icon: '',
        children: [
          {
            segment: 'logistik-1',
            title: 'Logistik 1',
            icon: ''
          },
          {
            segment: 'logistik-2',
            title: 'Logistik 2',
            icon: ''
          },
          {
            segment: 'logistik-3',
            title: 'Logistik 3',
            icon: ''
          },
          {
            segment: 'logistik-4',
            title: 'Logistik 4',
            icon: ''
          },
          {
            segment: 'logistik-5',
            title: 'Logistik 5',
            icon: ''
          },
        ]
      },
      {
        segment: 'report-stock',
        title: 'Report Stock',
        icon: '',
        children: [
          {
            segment: 'logistik-1',
            title: 'Logistik 1',
            icon: ''
          },
          {
            segment: 'logistik-2',
            title: 'Logistik 2',
            icon: ''
          },
          {
            segment: 'logistik-3',
            title: 'Logistik 3',
            icon: ''
          },
          {
            segment: 'logistik-4',
            title: 'Logistik 4',
            icon: ''
          },
          {
            segment: 'logistik-5',
            title: 'Logistik 5',
            icon: ''
          },
        ]
      },
      {
        segment: 'database-logistik',
        title: 'Database Logistik',
        icon: ''
      },
      {
        segment: 'database-pola',
        title: 'Database Pola',
        icon: ''
      },
      {
        segment: 'hpp-logistik-pola',
        title: 'HPP Logistik Pola',
        icon: ''
      }
    ]
  },
  {
    segment: 'mesin',
    title: 'Mesin',
    icon: <SettingsIcon />,
    children: [
      {
        segment: 'list-asset-mesin',
        title: 'List Asset Mesin',
        icon: ''
      },
      {
        segment: 'report-maintenance-mesin',
        title: 'Report Maintenance Mesin',
        icon: ''
      }
    ]
  },
  {
    segment: 'man-power',
    title: 'Man Power',
    icon: <PersonIcon />,
    children: [
      {
        segment: 'data-karyawan',
        title: 'Data Karyawan',
        icon: ''
      },
      {
        segment: 'absensi-karyawan',
        title: 'Absensi Karyawan',
        icon: ''
      },
      {
        segment: 'capaian-karyawan',
        title: 'Capaian Karyawan',
        icon: ''
      },
      {
        segment: 'reject-karyawan',
        title: 'Reject Karyawan',
        icon: ''
      }
    ]
  }
]

function App() {
  const [session, setSession] = useState({})
  const [role, setRole] = useState<string | undefined>(undefined);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [openHomeConfirm, setOpenHomeConfirm] = useState(false);
  const navigate = useNavigate()
  const location = useLocation()

  // Otomatis expand parent items berdasarkan current route
  useEffect(() => {
    const pathSegments: string[] = location.pathname.split('/').filter(Boolean);
    const newExpandedItems: Record<string, boolean> = { ...expandedItems };
    
    pathSegments.forEach((segment: string, index: number) => {
      if (index < pathSegments.length - 1) {
        newExpandedItems[segment] = true;
      }
    });
    
    setExpandedItems(newExpandedItems);
  }, [location.pathname]);

  const navigationWithExpanded = useMemo(() => {
    const addExpandedState = (items: any[]): any[] => {
      return items.map(item => ({
        ...item,
        expanded: expandedItems[item.segment] || false,
        children: item.children ? addExpandedState(item.children) : undefined
      }));
    };

    return addExpandedState(NAVIGATION);
  }, [expandedItems]);

  // Filter navigation based on role stored in kvStore
  const navigationFiltered = useMemo(() => {
    try {
      const currentRole = role as any;
      // management should see everything
      if (!currentRole) return navigationWithExpanded;
      const allowed = allowedMenusForRole(currentRole);

      const mapSegment = (segment: string) => {
        // normalize segment names to match MENU keys in auth
        if (segment === 'man-power') return 'manpower';
        return segment;
      };

      // Only filter top-level navigation entries. If a top-level segment is allowed,
      // keep it and preserve its children (don't re-filter child segments).
      const result = navigationWithExpanded.filter(it => {
        if (it.segment === 'dashboard') return true;
        const seg = mapSegment(it.segment || '');
        return allowed.includes(seg as any);
      });

      return result;
    } catch {
      return navigationWithExpanded;
    }
  }, [navigationWithExpanded]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [authVal, roleVal] = await Promise.all([
          kvStore.get(LS_KEYS.IS_AUTH),
          kvStore.get(LS_KEYS.USER_ROLE),
        ]);
        if (!mounted) return;
        const authed = !!authVal;
        setRole(typeof roleVal === 'string' ? roleVal : undefined);
        if (authed) {
          const userData = {}
          setSession({ user: userData })
        } else {
          navigate('/landing')
        }
      } catch {
        navigate('/landing');
      }
    })();
    const subR = kvStore.subscribe(LS_KEYS.USER_ROLE, (v) => { try { setRole(typeof v === 'string' ? v : undefined); } catch {} });
    return () => { mounted = false; try { subR.unsubscribe(); } catch {} };
  }, [])

  const authentication = useMemo(() => ({
    signIn: () => {
      // Implement signIn logic here if needed, but do not accept arguments
      // Example: setUser({}); setSession({ user: {} });
    },
    signOut: async () => {
      try { await clearAuth(); } catch {}
      setSession({})
      // Redirect to public landing after sign out
      navigate('/landing')
    }
  }), [])

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }} className="app-shell">
    <AppProvider
      session={session}
      navigation={navigationFiltered}
      authentication={authentication}
      router={{
        pathname: location.pathname,
        searchParams: new URLSearchParams(location.search || ''),
        navigate: (url: string | URL) => {
          const to = typeof url === 'string' ? url : url.toString();
          navigate(to);
        },
      }}
      // Clicking the app brand should go to the public landing page even when logged in
      // Show logo element instead of text title
      branding={{
        logo: (
          <Box
            component="button"
            onClick={() => setOpenHomeConfirm(true)}
            sx={{
              background: 'none',
              border: 'none',
              p: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <img
              src="/logo-sakura.png"
              alt="Sakura Konveksi"
              className="app-shell-logo"
              style={{ height: 64, width: 'auto' }}
            />
          </Box>
        ),
        title: '',
        // homeUrl intentionally omitted to allow custom confirm before navigating
      }}
    >
      <Outlet />
    </AppProvider>
    {/* Confirm navigate to landing */}
    <Dialog open={openHomeConfirm} onClose={() => setOpenHomeConfirm(false)}>
      <DialogTitle>Konfirmasi</DialogTitle>
      <DialogContent>
        <Typography>Anda yakin akan keluar ke landing page?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenHomeConfirm(false)} color="inherit" variant="outlined">Batal</Button>
        <Button onClick={() => { setOpenHomeConfirm(false); navigate('/landing'); }} color="primary" variant="contained">Ya</Button>
      </DialogActions>
    </Dialog>
    </Box>
  )
}

export default App
