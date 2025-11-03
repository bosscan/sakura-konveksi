import { supabase } from './supabaseClient';

const BUCKET = 'landing';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function uploadFilesToCloud(files: FileList | File[], folder: 'slider' | 'gallery' | 'katalog' = 'slider'): Promise<string[]> {
  const arr = Array.isArray(files) ? files : Array.from(files);
  const urls: string[] = [];
  for (const f of arr) {
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${folder}/${uuid()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, f, { upsert: false, cacheControl: '3600' });
    if (upErr) {
      // stop early on first failure to surface error quickly
      throw upErr;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }
  return urls;
}

export async function getPublicUrlFromPath(path: string): Promise<string | null> {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}
