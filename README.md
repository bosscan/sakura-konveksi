# ERP Sakura Frontend

Custom React + TypeScript + Vite SPA for Sakura Konveksi internal ERP.

## Current Architecture (Post-Migration)

- Data persistence (lightweight): custom backend key-value HTTP + realtime WebSocket (see `src/lib/kvStore.ts`).
- File uploads: multipart to backend `/api/landing/upload/` (see `src/lib/landingRemote.ts`).
- Backend stack (separate project folder `backend/`): Express + SQLite + ws + Multer.
- No external BaaS dependencies; previous cloud client removed.

## Environment Variables

Frontend expects:

```
VITE_API_URL=http://localhost:4000
```

Remove any legacy variables no longer used.

## Development

1. Start backend (in backend folder): `npm install && npm run dev` (port 4000 assumed).
2. Start frontend: `npm install && npm run dev`.
3. Open http://localhost:5173.

## Build

`npm run build` outputs production assets to `dist/`.

## Realtime KV Usage

```ts
import useKV from './lib/useKV';
const { value, set, loading } = useKV('landing_images_keys', []);
```

## Landing Page Content Flow

1. User selects images; blobs stored in IndexedDB (`landingStore.ts`).
2. Optional sync to server using "Sinkronkan" actions (uploads via backend; persistent URLs returned).
3. Keys & URLs saved to KV store for cross-session usage.

## Removing Archived Schema

The `supabase/` folder now only contains minimal archival notes. It can be deleted safely when no longer needed for reference.

## Future Improvements

- Replace monolithic bundles with manual chunks (dynamic imports) to reduce large build warning.
- Harden backend (auth, validation, rate limiting).
- Add automated tests (Jest or Vitest) for kvStore logic and landing content serialization.

## License

Internal proprietary (not for public distribution).
