import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://vfttuiqelnxhgykkcrsq.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdHR1aXFlbG54aGd5a2tjcnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDUxNzAsImV4cCI6MjA3NzU4MTE3MH0.WmpjNhL7ia3NCfplCc-X-uvacQIFFlejXRfCuz7wP_I';

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export function getSupabaseEnvInfo() {
  return { url, hasKey: !!anonKey };
}
