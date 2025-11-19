import { Box, Typography, TextField, Button, Alert, Paper, Stack, FormControlLabel, Checkbox, Link, InputAdornment } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAuth, LS_KEYS } from "../lib/auth";
import kvStore from "../lib/kvStore";

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  // Base accounts (management/admin/cs and one-per-division operators)
  const users =
    [
      { username: 'management', password: 'management-sakura', user: 'Management', role: 'management' },
      { username: 'admin', password: 'admin-sakura', user: 'Admin Produksi', role: 'admin_produksi' },
      { username: 'cs', password: 'cs-sakura', user: 'Customer Service', role: 'cs' },
      { username: 'operator', password: 'operator-sakura', user: 'Marketing', role: 'operator' },
      { username: 'operator-cutting', password: 'operator-cutting-sakura', user: 'Operator Cutting Pola', role: 'operator_cutting_pola' },
      { username: 'operator-desainer-pra', password: 'operator-desainer-pra-sakura', user: 'Operator Desainer Pra Produksi', role: 'operator_desainer_pra_produksi' },
      { username: 'operator-desainer-produksi', password: 'operator-desainer-produksi-sakura', user: 'Operator Desainer Produksi', role: 'operator_desainer_produksi' },
      { username: 'operator-stock-bordir', password: 'operator-stock-bordir-sakura', user: 'Operator Stock Bordir', role: 'operator_stock_bordir' },
      { username: 'operator-bordir', password: 'operator-bordir-sakura', user: 'Operator Bordir', role: 'operator_bordir' },
      { username: 'operator-setting', password: 'operator-setting-sakura', user: 'Operator Setting', role: 'operator_setting' },
      { username: 'operator-stock-jahit', password: 'operator-stock-jahit-sakura', user: 'Operator Stock Jahit', role: 'operator_stock_jahit' },
      { username: 'operator-jahit', password: 'operator-jahit-sakura', user: 'Operator Jahit', role: 'operator_jahit' },
      { username: 'operator-finishing', password: 'operator-finishing-sakura', user: 'Operator Finishing', role: 'operator_finishing' },
      { username: 'operator-foto-produk', password: 'operator-foto-produk-sakura', user: 'Operator Foto Produk', role: 'operator_foto_produk' },
      { username: 'operator-stock-nt', password: 'operator-stock-nt-sakura', user: 'Operator Stock Nomor Transaksi', role: 'operator_stock_nomor_transaksi' },
      { username: 'operator-pengiriman', password: 'operator-pengiriman-sakura', user: 'Operator Pengiriman', role: 'operator_pengiriman' },
    ] as Array<{ username: string; password: string; user: string; role: string }>;

  // Generate 4 operator accounts per division with pattern: operator-<segment>1..4
  const operatorDivisions: Array<{ segment: string; label: string; role: string }> = [
    { segment: 'desainer-pra', label: 'Operator Desainer Pra Produksi', role: 'operator_desainer_pra_produksi' },
    { segment: 'desainer-produksi', label: 'Operator Desainer Produksi', role: 'operator_desainer_produksi' },
    { segment: 'cutting', label: 'Operator Cutting Pola', role: 'operator_cutting_pola' },
    { segment: 'stock-bordir', label: 'Operator Stock Bordir', role: 'operator_stock_bordir' },
    { segment: 'bordir', label: 'Operator Bordir', role: 'operator_bordir' },
    { segment: 'setting', label: 'Operator Setting', role: 'operator_setting' },
    { segment: 'stock-jahit', label: 'Operator Stock Jahit', role: 'operator_stock_jahit' },
    { segment: 'jahit', label: 'Operator Jahit', role: 'operator_jahit' },
    { segment: 'finishing', label: 'Operator Finishing', role: 'operator_finishing' },
    { segment: 'foto-produk', label: 'Operator Foto Produk', role: 'operator_foto_produk' },
    { segment: 'stock-nt', label: 'Operator Stock Nomor Transaksi', role: 'operator_stock_nomor_transaksi' },
    { segment: 'pengiriman', label: 'Operator Pengiriman', role: 'operator_pengiriman' },
  ];

  const multiOperatorUsers = operatorDivisions.flatMap((d) =>
    Array.from({ length: 4 }, (_, i) => {
      const n = i + 1;
      const username = `operator-${d.segment}${n}`;
      return {
        username,
        password: `${username}-sakura`,
        user: `${d.label} #${n}`,
        role: d.role,
      };
    })
  );

  // Merge base and generated operator accounts
  const allUsers = [...users, ...multiOperatorUsers];

  // restore remembered username from kvStore
  useState(() => {
    (async () => {
      try {
        const saved = await kvStore.get(LS_KEYS.REMEMBER_USERNAME);
        if (typeof saved === 'string' && saved) {
          setUsername(saved);
          setRemember(true);
        }
      } catch {}
    })();
  });

  const handleLogin = (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // tiny delay for UX
    setTimeout(async () => {
  const user = allUsers.find(u => u.username === username && u.password === password);
      if (user) {
        // persist auth + role
        try {
          // cast to any to satisfy Role typing from helper (roles are controlled strings)
          await saveAuth(user.role as any, username, remember);
        } catch { /* ignore */ }
        navigate('/');
      } else {
        setError('Invalid Username or Password. Try Again');
        setLoading(false);
      }
    }, 450);
  }

  // simple login page (plain)

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
      background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)'}}>
      {/* decorative blobs */}
      <Box sx={{ position: 'absolute', top: -80, left: -80, width: 240, height: 240, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
      <Box sx={{ position: 'absolute', bottom: -100, right: -80, width: 300, height: 300, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: '50%', filter: 'blur(50px)' }} />

      <Box component='form' onSubmit={handleLogin} sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <Paper elevation={6} sx={{ p: 4, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)' }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center', mb: 1 }}>
              <Box component="img" src="/vite.svg" alt="logo" sx={{ height: 32 }} />
              <Typography variant="h6" fontWeight={800} color="#0d47a1">ERP Sakura Konveksi</Typography>
            </Box>
            <Typography variant="subtitle2" align="center" color="text.secondary">Masuk ke Akun</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required fullWidth autoComplete="username" />
            <TextField label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth autoComplete="current-password"
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <Button size="small" onClick={() => setShowPassword((v) => !v)} sx={{ minWidth: 0, px: 1 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputAdornment>
              ) }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label="Ingat saya" />
              <Link component="button" type="button" underline="hover" sx={{ fontSize: 12, color: 'primary.main' }} onClick={() => alert('Hubungi admin untuk reset sandi.')}>Lupa password?</Link>
            </Box>
            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{
              py: 1.25,
              fontWeight: 700,
              background: loading ? undefined : 'linear-gradient(90deg,#1565c0,#1e88e5)',
            }}>
              {loading ? 'Memproses…' : 'Login'}
            </Button>
          </Stack>
        </Paper>
        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'rgba(255,255,255,0.9)' }}>
          © {new Date().getFullYear()} Sakura Konveksi
        </Typography>
      </Box>
    </Box>
  );
}

export default Login;
