-- Sakura Konveksi – Full Tables for MariaDB/MySQL (phpMyAdmin-friendly)
-- IMPORTANT: This file creates TABLES ONLY (no RLS, no realtime, no RPC, no views)
-- Default engine/charset and conservative types for widest compatibility
-- JSON/JSONB mapped to LONGTEXT; TIMESTAMPTZ mapped to TIMESTAMP

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Utility kv_store (frontend kvStore)
CREATE TABLE IF NOT EXISTS kv_store (
  `key` VARCHAR(190) NOT NULL,
  `value` LONGTEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master data
CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) NOT NULL,
  name TEXT NOT NULL,
  phone VARCHAR(64) UNIQUE,
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX IF NOT EXISTS customers_created_idx ON customers (created_at);

CREATE TABLE IF NOT EXISTS logistics_master (
  id CHAR(36) NOT NULL,
  code VARCHAR(128) NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR(32) NOT NULL,
  unit VARCHAR(32) NOT NULL,
  min_stock INT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_logistics_master_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patterns_master (
  id CHAR(36) NOT NULL,
  code VARCHAR(128) NOT NULL,
  name TEXT NOT NULL,
  product TEXT,
  size TEXT,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patterns_master_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Landing CMS
CREATE TABLE IF NOT EXISTS landing_sections (
  id CHAR(36) NOT NULL,
  section_key VARCHAR(190) NOT NULL,
  title TEXT,
  content LONGTEXT,
  order_no INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_landing_sections_key (section_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS landing_media (
  id CHAR(36) NOT NULL,
  section_id CHAR(36) NULL,
  kind VARCHAR(32) NOT NULL DEFAULT 'lainnya',
  url TEXT NOT NULL,
  thumb_url TEXT,
  order_no INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_landing_media_section (section_id),
  CONSTRAINT fk_landing_media_section FOREIGN KEY (section_id) REFERENCES landing_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders and design inputs
CREATE TABLE IF NOT EXISTS orders (
  id_spk CHAR(7) NOT NULL,
  customer_id CHAR(36) NULL,
  nama_pemesan TEXT,
  phone VARCHAR(64),
  address TEXT,
  region_province TEXT,
  region_regency TEXT,
  region_district TEXT,
  region_village TEXT,
  transaction_type TEXT,
  cs_name TEXT,
  nominal DECIMAL(18,2),
  proof_url TEXT,
  tanggal_input TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_spk),
  KEY idx_orders_created (created_at),
  KEY idx_orders_customer (customer_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id CHAR(7) NULL,
  size TEXT,
  nama TEXT,
  format_nama TEXT,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS design_queue (
  id CHAR(36) NOT NULL,
  order_id CHAR(7) NULL,
  id_rekap_custom CHAR(7) NULL,
  id_custom CHAR(7) NULL,
  nama_desain TEXT,
  jenis_produk TEXT,
  jenis_pola TEXT,
  tanggal_input DATE NULL,
  nama_cs TEXT,
  asset_link TEXT,
  catatan TEXT,
  assets LONGTEXT,
  status TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_design_queue_id_custom (id_custom),
  KEY idx_design_queue_order (order_id),
  KEY idx_design_queue_rekap (id_rekap_custom),
  CONSTRAINT fk_design_queue_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS design_snapshots (
  order_id CHAR(7) NOT NULL,
  snapshot LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_design_snapshots_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_snapshots (
  order_id CHAR(7) NOT NULL,
  snapshot LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_order_snapshots_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product catalog & media
CREATE TABLE IF NOT EXISTS product_catalog (
  id CHAR(36) NOT NULL,
  order_id CHAR(7) NULL,
  nama_desain TEXT,
  jenis_produk TEXT,
  jenis_pola TEXT,
  search TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_catalog_order (order_id),
  CONSTRAINT fk_product_catalog_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_media (
  id CHAR(36) NOT NULL,
  product_id CHAR(36) NULL,
  kind VARCHAR(32) NOT NULL DEFAULT 'produk',
  url TEXT NOT NULL,
  thumb_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_media_product (product_id),
  CONSTRAINT fk_product_media_product FOREIGN KEY (product_id) REFERENCES product_catalog(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  id CHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  cart_id CHAR(36) NULL,
  order_id CHAR(7) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cart_items_cart (cart_id, created_at),
  KEY idx_cart_items_order (order_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Checkout, transactions, and production recap
CREATE TABLE IF NOT EXISTS transactions (
  id_transaksi CHAR(7) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_transaksi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS production_recap (
  id BIGINT NOT NULL AUTO_INCREMENT,
  recap_id CHAR(7) NOT NULL,
  recap_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_production_recap_recap_id (recap_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_recap (
  order_id CHAR(7) NOT NULL,
  production_recap_id BIGINT NULL,
  PRIMARY KEY (order_id),
  KEY idx_order_recap_recap (production_recap_id),
  CONSTRAINT fk_order_recap_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE,
  CONSTRAINT fk_order_recap_recap FOREIGN KEY (production_recap_id) REFERENCES production_recap(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipeline (
  order_id CHAR(7) NOT NULL,
  id_transaksi CHAR(7) NULL,
  id_rekap_custom CHAR(7) NULL,
  id_custom CHAR(7) NULL,
  nama_desain TEXT,
  kuantity INT,
  selesai_desain_produksi TIMESTAMP NULL,
  selesai_cutting_pola TIMESTAMP NULL,
  selesai_stock_bordir TIMESTAMP NULL,
  selesai_bordir TIMESTAMP NULL,
  selesai_setting TIMESTAMP NULL,
  selesai_stock_jahit TIMESTAMP NULL,
  selesai_jahit TIMESTAMP NULL,
  selesai_finishing TIMESTAMP NULL,
  selesai_foto_produk TIMESTAMP NULL,
  selesai_pengiriman TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  KEY idx_pipeline_transaksi (id_transaksi),
  KEY idx_pipeline_foto (selesai_foto_produk),
  KEY idx_pipeline_kirim (selesai_pengiriman),
  CONSTRAINT fk_pipeline_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE,
  CONSTRAINT fk_pipeline_trans FOREIGN KEY (id_transaksi) REFERENCES transactions(id_transaksi) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plotting_queue (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id CHAR(7) NULL,
  id_transaksi CHAR(7) NULL,
  id_rekap_produksi CHAR(7) NULL,
  id_rekap_custom CHAR(7) NULL,
  id_custom CHAR(7) NULL,
  nama_desain TEXT,
  jenis_produk TEXT,
  jenis_pola TEXT,
  tanggal_input DATE,
  tgl_spk_terbit TIMESTAMP NULL,
  kuantity INT,
  status_desain TEXT DEFAULT 'Proses',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_plotting_queue_trans (id_transaksi, created_at),
  CONSTRAINT fk_plotting_queue_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE,
  CONSTRAINT fk_plotting_queue_trans FOREIGN KEY (id_transaksi) REFERENCES transactions(id_transaksi) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pipeline_history (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id CHAR(7) NULL,
  division TEXT,
  action TEXT,
  note TEXT,
  actor TEXT,
  at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pipeline_history_order (order_id, at),
  CONSTRAINT fk_pipeline_history_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rekap_bordir (
  id BIGINT NOT NULL AUTO_INCREMENT,
  rekap_id CHAR(7) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rekap_bordir_rekap_id (rekap_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rekap_bordir_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  rekap_bordir_id BIGINT NULL,
  order_id CHAR(7) NULL,
  id_transaksi CHAR(7) NULL,
  id_rekap_custom CHAR(7) NULL,
  id_custom CHAR(7) NULL,
  nama_desain TEXT,
  kuantity INT,
  PRIMARY KEY (id),
  KEY idx_rb_items_rekap (rekap_bordir_id),
  KEY idx_rb_items_order (order_id),
  CONSTRAINT fk_rb_items_rekap FOREIGN KEY (rekap_bordir_id) REFERENCES rekap_bordir(id) ON DELETE CASCADE,
  CONSTRAINT fk_rb_items_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mapping penjahit per SPK
CREATE TABLE IF NOT EXISTS penjahit_assignments (
  order_id CHAR(7) NOT NULL,
  penjahit_name TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_penjahit_assign_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Urgent SPK
CREATE TABLE IF NOT EXISTS spk_urgent (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id CHAR(7) NULL,
  alasan TEXT,
  requested_by TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_spk_urgent_order (order_id, created_at),
  CONSTRAINT fk_spk_urgent_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Finance
CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT NOT NULL AUTO_INCREMENT,
  no VARCHAR(190) NOT NULL,
  jenis TEXT,
  total DECIMAL(18,2),
  nominal_transaksi DECIMAL(18,2),
  kekurangan DECIMAL(18,2),
  ongkir DECIMAL(18,2),
  nama_konsumen TEXT,
  nama_instansi TEXT,
  date TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoices_no (no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_rows (
  id BIGINT NOT NULL AUTO_INCREMENT,
  invoice_id BIGINT NULL,
  qty INT,
  name TEXT,
  price DECIMAL(18,2),
  nominal DECIMAL(18,2),
  PRIMARY KEY (id),
  KEY idx_invoice_rows_invoice (invoice_id),
  CONSTRAINT fk_invoice_rows_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS revenues (
  id BIGINT NOT NULL AUTO_INCREMENT,
  id_spk CHAR(7),
  tanggal TIMESTAMP NULL,
  nama_pemesan TEXT,
  tipe_transaksi TEXT,
  nominal DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_revenues_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  id_transaksi CHAR(7) NULL,
  nominal DECIMAL(18,2) NOT NULL,
  bukti LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_trans (id_transaksi, created_at),
  CONSTRAINT fk_payments_trans FOREIGN KEY (id_transaksi) REFERENCES transactions(id_transaksi) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT NOT NULL AUTO_INCREMENT,
  category VARCHAR(64) NOT NULL,
  tanggal DATE NOT NULL DEFAULT (CURRENT_DATE),
  amount DECIMAL(18,2) NOT NULL,
  meta LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_expenses_cat_date (category, tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prognosis
CREATE TABLE IF NOT EXISTS prognosis_entries (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tanggal DATE NOT NULL,
  jenis_produk TEXT,
  jenis_pola TEXT,
  qty INT NOT NULL DEFAULT 0,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prognosis_tanggal (tanggal),
  KEY idx_prognosis_prod_pattern (jenis_produk(100), jenis_pola(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Material stock movements
CREATE TABLE IF NOT EXISTS material_stock (
  id CHAR(36) NOT NULL,
  bucket TINYINT NOT NULL,
  date DATE NOT NULL,
  code VARCHAR(128),
  name TEXT,
  category TEXT,
  unit VARCHAR(32),
  qty_in INT NOT NULL DEFAULT 0,
  qty_out INT NOT NULL DEFAULT 0,
  price DECIMAL(18,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_material_stock_bucket_date (bucket, date),
  KEY idx_material_stock_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HR
CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) NOT NULL,
  name TEXT NOT NULL,
  division TEXT,
  position TEXT,
  phone VARCHAR(64),
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employees_name (name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id CHAR(36) NULL,
  tanggal DATE NOT NULL,
  status VARCHAR(16) NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_unique_per_day (employee_id, tanggal),
  KEY idx_attendance_tanggal (tanggal),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_performance (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id CHAR(36) NULL,
  tanggal DATE NOT NULL,
  metric VARCHAR(64),
  value DECIMAL(18,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employee_perf_emp_date (employee_id, tanggal),
  CONSTRAINT fk_employee_perf_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_rejects (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id CHAR(36) NULL,
  tanggal DATE NOT NULL,
  order_id CHAR(7) NULL,
  reason TEXT,
  qty INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employee_rejects_emp_date (employee_id, tanggal),
  CONSTRAINT fk_employee_rejects_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_employee_rejects_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Machines & maintenance
CREATE TABLE IF NOT EXISTS machines (
  id CHAR(36) NOT NULL,
  code VARCHAR(128) UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_no TEXT,
  status TEXT DEFAULT 'Aktif',
  location TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS machine_maintenance_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  machine_id CHAR(36) NULL,
  tanggal DATE NOT NULL,
  maintenance_type VARCHAR(32),
  description TEXT,
  cost DECIMAL(18,2) DEFAULT 0,
  status TEXT DEFAULT 'Selesai',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_machine_maint_machine_date (machine_id, tanggal),
  CONSTRAINT fk_machine_maint_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SPK revisions
CREATE TABLE IF NOT EXISTS spk_revisions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id CHAR(7) NULL,
  fields LONGTEXT,
  note TEXT,
  actor TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_spk_revisions_order (order_id, created_at),
  CONSTRAINT fk_spk_revisions_order FOREIGN KEY (order_id) REFERENCES orders(id_spk) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pattern HPP
CREATE TABLE IF NOT EXISTS pattern_hpp (
  id BIGINT NOT NULL AUTO_INCREMENT,
  pattern_code VARCHAR(128) NOT NULL,
  total_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pattern_hpp_code (pattern_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pattern_hpp_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  pattern_hpp_id BIGINT NULL,
  material_code VARCHAR(128),
  qty DECIMAL(18,4) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(18,4) NOT NULL DEFAULT 0,
  subtotal DECIMAL(18,4) GENERATED ALWAYS AS (qty * unit_cost) STORED,
  PRIMARY KEY (id),
  KEY idx_pattern_hpp_items_hdr (pattern_hpp_id),
  CONSTRAINT fk_pattern_hpp_items_hdr FOREIGN KEY (pattern_hpp_id) REFERENCES pattern_hpp(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional counters (IDs like 7-digit strings)
CREATE TABLE IF NOT EXISTS id_counters (
  name VARCHAR(190) NOT NULL,
  last_value BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Implementing next_counter_7 and checkout_cart RPCs requires MySQL stored routines;
-- omitted here since the frontend currently targets Supabase RPC. If needed, we can add
-- MySQL procedures later.
