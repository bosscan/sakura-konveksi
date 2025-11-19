import { Box, Typography, TextField, Button, Alert, Paper, Stack, FormControlLabel, Checkbox, Link, InputAdornment } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAuth, LS_KEYS } from "../lib/auth";
import kvStore from "../lib/kvStore";
import { supabase } from "../lib/supabaseClient";

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  // Auth now uses Supabase RPC verify_login_v2

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
      try {
        // Prefer the v2 RPC which also logs login events; fallback to v1 if v2 is unavailable
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
        // Try v2 with p_meta first to disambiguate if multiple overloaded functions exist.
        let data: any = null;
        let rpcError: string | undefined;

        const callV2WithMeta = async () => supabase.rpc('verify_login_v2', {
          p_username: username,
          p_password: password,
          p_user_agent: userAgent ?? null,
          p_ip: null,
          // include meta to force 5-arg overload when present
          p_meta: { remember } as any,
        } as any);

        const callV2NoMeta = async () => supabase.rpc('verify_login_v2', {
          p_username: username,
          p_password: password,
          p_user_agent: userAgent ?? null,
          p_ip: null,
        } as any);

        const callV1 = async () => supabase.rpc('verify_login', {
          p_username: username,
          p_password: password,
        } as any);

        let res = await callV2WithMeta();
        if (res.error) {
          const msg = res.error.message?.toLowerCase() || '';
          if (msg.includes('does not exist') || msg.includes('could not choose the best candidate function')) {
            // Retry v2 without meta (handles 4-arg variant)
            res = await callV2NoMeta();
          }
        }
        if (res.error) {
          const msg = res.error.message?.toLowerCase() || '';
          if (msg.includes('does not exist') || msg.includes('could not choose the best candidate function')) {
            // Fallback to v1
            const resV1 = await callV1();
            data = resV1.data;
            rpcError = resV1.error?.message;
          } else {
            data = res.data;
            rpcError = res.error?.message;
          }
        } else {
          data = res.data;
          rpcError = undefined;
        }

        if (rpcError) {
          setError(rpcError || 'Gagal login. Coba lagi.');
          setLoading(false);
          return;
        }

        // PostgREST returns either a single row or null
        if (!data) {
          setError('Username atau Password salah.');
          setLoading(false);
          return;
        }

        // Try to extract role from common field names provided by our RPC
        const roleName = (data.role_name ?? data.role ?? data.role_id ?? '').toString();
        if (!roleName) {
          setError('Login berhasil tetapi role tidak ditemukan. Hubungi admin.');
          setLoading(false);
          return;
        }

        try {
          await saveAuth(roleName as any, username, remember);
        } catch { /* ignore */ }
        navigate('/');
      } catch (err: any) {
        setError(err?.message || 'Terjadi kesalahan saat login.');
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
