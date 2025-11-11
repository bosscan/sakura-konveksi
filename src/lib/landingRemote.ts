import Api from './api';

export const landingBucketName = 'landing'; // preserved constant for compatibility

// Upload through backend API; folder hint passed in FormData filename suffix
export async function uploadFilesToCloud(files: FileList | File[] | Blob[], _folder: 'slider' | 'gallery' | 'katalog' = 'slider'): Promise<string[]> {
  const arr = Array.isArray(files) ? files : Array.from(files as any);
  // Api.uploadLandingImages already handles multipart; just forward real Files.
  // Ensure we have File objects; if Blob, wrap into File.
  const normalized: File[] = arr.map((b: any, i) => {
    if (b instanceof File) return b;
    return new File([b], `blob-${i}.bin`, { type: b.type || 'application/octet-stream' });
  });
  return Api.uploadLandingImages(normalized);
}

export async function getPublicUrlFromPath(path: string): Promise<string | null> {
  // Backend already returns public URLs; here we just return path if absolute
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || '';
  return `${base}/uploads/${path.replace(/^\//,'')}`;
}
