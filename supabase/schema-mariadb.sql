-- Sakura Konveksi – Minimal MariaDB schema for compatibility
-- Use this ONLY if you are running MariaDB/MySQL.
-- The React app in this repo is wired to Supabase (Postgres) by default.
-- For full functionality (RLS, realtime, RPC), prefer supabase/schema-relational.sql on Supabase.

-- Notes:
-- - JSON columns use MariaDB JSON type (10.4+). If your version lacks JSON, switch to LONGTEXT.
-- - No schemas (public. prefix removed)
-- - No RLS, publications, or Postgres extensions/functions
-- - No foreign keys to tables that may not exist in MariaDB
-- - Column `key` is quoted with backticks since it's reserved

-- 0) kv_store (for kvStore bridge)
CREATE TABLE IF NOT EXISTS kv_store (
  `key` VARCHAR(190) NOT NULL,
  `value` LONGTEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1) penjahit_assignments (for Dropping Penjahit)
CREATE TABLE IF NOT EXISTS penjahit_assignments (
  order_id CHAR(7) NOT NULL,
  penjahit_name TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) design_queue (mirror of key design data used by bridge)
CREATE TABLE IF NOT EXISTS design_queue (
  id CHAR(36) NOT NULL,
  order_id CHAR(7) NULL,
  id_rekap_custom CHAR(7) NULL,
  id_custom CHAR(7) NULL,
  nama_desain TEXT NULL,
  jenis_produk TEXT NULL,
  jenis_pola TEXT NULL,
  tanggal_input DATE NULL,
  nama_cs TEXT NULL,
  asset_link TEXT NULL,
  catatan TEXT NULL,
  assets LONGTEXT NULL,
  status TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_design_queue_id_custom (id_custom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional indexes (uncomment to add). If your server errors on duplicate index, drop before re-running.
-- CREATE INDEX idx_design_queue_order ON design_queue (order_id);
-- CREATE INDEX idx_design_queue_rekap ON design_queue (id_rekap_custom);

-- Minimal tables above are enough to support the current relational bridge
-- (kv_store, penjahit_assignments, design_queue).
-- The rest of the Postgres schema (orders, pipeline, views, RLS, RPC) would require
-- a more extensive MySQL/MariaDB rewrite and is not included here.
