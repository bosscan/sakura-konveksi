import express from 'express';
import http from 'http';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { kv } from './db.js';
import { initRealtime } from './realtime.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.set('trust proxy', 1); // allow secure cookies if added later behind proxy
const server = http.createServer(app);
const hub = initRealtime(server);

// CORS configuration: support comma-separated origins via CORS_ORIGIN or BACKEND_CORS_ORIGINS
const corsOrigins = (process.env.CORS_ORIGIN || process.env.BACKEND_CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : true }));
app.use(express.json({ limit: '10mb' }));

// Health (includes basic metrics)
app.get('/health', (_req: any, res: any) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: Date.now(), version: process.env.APP_VERSION || 'dev' });
});

// KV endpoints
app.get('/kv/:key', (req: any, res: any) => {
  const v = kv.get(req.params.key);
  res.json({ value: v });
});

app.put('/kv/:key', (req: any, res: any) => {
  kv.set(req.params.key, req.body?.value ?? null);
  hub.broadcastKv(req.params.key, req.body?.value ?? null);
  res.json({ ok: true });
});

app.delete('/kv/:key', (req: any, res: any) => {
  kv.remove(req.params.key);
  hub.broadcastKv(req.params.key, null);
  res.json({ ok: true });
});

// Uploads
const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = (multer as any).diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname || '.jpg') || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});
const uploader = (multer as any)({ storage });

app.post('/api/landing/upload', (uploader as any).array('files', 50), (req: any, res: any) => {
  const files = (req.files as any[]) || [];
  const baseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const urls = files.map((f) => `${baseUrl}/uploads/${path.basename(f.path)}`);
  res.json({ urls });
});

// Static serve uploads (behind reverse proxy ideally)
app.use('/uploads', express.static(uploadDir, { maxAge: '1h', index: false }));

const port = Number(process.env.PORT || 8080);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${port}`);
});

// Graceful shutdown
function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('HTTP server closed. Bye');
    process.exit(0);
  });
  // Fallback force exit after timeout
  setTimeout(() => process.exit(1), 10000).unref();
}
['SIGTERM', 'SIGINT'].forEach(sig => process.on(sig as any, () => shutdown(sig)));
