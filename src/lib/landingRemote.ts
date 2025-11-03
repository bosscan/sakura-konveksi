import { supabase } from './supabaseClient';

const BUCKET = 'landing';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function uploadFilesToCloud(files: FileList | File[] | Blob[], folder: 'slider' | 'gallery' | 'katalog' = 'slider'): Promise<string[]> {
  const arr = Array.isArray(files) ? files : Array.from(files as any);
  const urls: string[] = [];
  for (const f of arr) {
    // File or Blob
    const name = (f as any).name as string | undefined;
    const ext = (name ? name.split('.').pop() : undefined) || 'jpg';
    const path = `${folder}/${uuid()}.${ext}`;
  const body = f as Blob; // Supabase accepts Blob/File
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, body, { upsert: false, cacheControl: '3600' });
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
