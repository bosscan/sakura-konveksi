import { WebSocketServer } from 'ws';
import type { Server } from 'http';

export interface RealtimeHub {
  broadcastKv(key: string, value: any | null): void;
}

export function initRealtime(server: Server): RealtimeHub {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: any) => {
    ws.on('message', (msg: any) => {
      // Protocol: client may send {type:'subscribe', keys:['a','b']} but we keep broadcast to all for simplicity now
      // Future: maintain per-connection subscription sets.
      try { JSON.parse(msg.toString()); } catch {}
    });
  });

  function broadcastKv(key: string, value: any | null) {
    const payload = JSON.stringify({ type: 'kv', key, value });
    (wss.clients as any).forEach((c: any) => { try { c.send(payload); } catch {} });
  }

  return { broadcastKv };
}
