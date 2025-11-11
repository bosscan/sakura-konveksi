import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'sakura.db');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Create kv_store table
(db.prepare(`
  create table if not exists kv_store (
    key text primary key,
    value text
  )
`) as any).run();

export const kv = {
  get(key: string): any | null {
    const row = db.prepare('select value from kv_store where key = ?').get(key) as { value: string } | undefined;
    if (!row) return null;
    try { return JSON.parse(row.value); } catch { return row.value; }
  },
  set(key: string, value: any) {
    const j = JSON.stringify(value);
    db.prepare('insert into kv_store(key, value) values(?, ?) on conflict(key) do update set value=excluded.value').run(key, j);
  },
  remove(key: string) {
    db.prepare('delete from kv_store where key = ?').run(key);
  }
};
