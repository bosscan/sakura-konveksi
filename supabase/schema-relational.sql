-- Sakura Konveksi – Relational schema for large datasets (Supabase/Postgres)
-- Safe to run multiple times (create if not exists / drop-if-exists for policies/triggers only).

begin;
-- =========================
-- 0) Utility KV table (used by frontend kvStore)
-- =========================

create table if not exists public.kv_store (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);


-- Extensions commonly available on Supabase
create extension if not exists pgcrypto;       -- for gen_random_uuid()
create extension if not exists pg_trgm;        -- for trigram search indexes

-- =========================
-- 1) Master data
-- =========================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique,
  address text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Trigram search on name/address for flexible search in UI
create index if not exists customers_name_trgm_idx on public.customers using gin (name gin_trgm_ops);
create index if not exists customers_addr_trgm_idx on public.customers using gin (address gin_trgm_ops);

-- Logistics and patterns master (material DB)
create table if not exists public.logistics_master (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  category text not null check (category in ('Bahan','Aksesoris','Packing','Lainnya')),
  unit text not null,
  min_stock integer not null default 0,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists logistics_master_code_idx on public.logistics_master (code);

create table if not exists public.patterns_master (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  product text,
  size text,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists patterns_master_code_idx on public.patterns_master (code);

-- =========================
-- 1b) Landing CMS (for LandingContentEditor)
-- =========================

create table if not exists public.landing_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title text,
  content jsonb,
  order_no int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists landing_sections_active_order_idx on public.landing_sections (is_active, order_no);
create index if not exists landing_sections_title_trgm_idx on public.landing_sections using gin (title gin_trgm_ops);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'media_kind') then
    create type media_kind as enum ('mockup','produk','banner','logo','lainnya');
  end if;
end$$;
create table if not exists public.landing_media (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references public.landing_sections(id) on delete cascade,
  kind media_kind not null default 'lainnya',
  url text not null,
  thumb_url text,
  order_no int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists landing_media_section_idx on public.landing_media (section_id, order_no);

-- =========================
-- 2) Orders and design inputs
-- =========================

-- Orders (SPK)
create table if not exists public.orders (
  id_spk char(7) primary key,
  customer_id uuid references public.customers(id) on delete set null,
  nama_pemesan text,
  phone text,
  address text,
  region_province text,
  region_regency text,
  region_district text,
  region_village text,
  transaction_type text,
  cs_name text,
  nominal numeric,
  proof_url text,
  tanggal_input timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_region_idx on public.orders (region_province, region_regency, region_district);

-- Order line items
create table if not exists public.order_items (
  id bigserial primary key,
  order_id char(7) references public.orders(id_spk) on delete cascade,
  size text,
  nama text,
  format_nama text
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_nama_trgm_idx on public.order_items using gin (nama gin_trgm_ops);

-- Design queue (antrian desain) – stores design form + assets (JSON) submitted from DetailTambahan
create table if not exists public.design_queue (
  id uuid primary key default gen_random_uuid(),
  order_id char(7) references public.orders(id_spk) on delete cascade,
  id_rekap_custom char(7),
  id_custom char(7) unique,
  nama_desain text,
  jenis_produk text,
  jenis_pola text,
  tanggal_input date,
  nama_cs text,
  asset_link text,
  catatan text,
  assets jsonb,
  status text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists design_queue_order_idx on public.design_queue (order_id);
create index if not exists design_queue_rekap_idx on public.design_queue (id_rekap_custom);
create index if not exists design_queue_nama_trgm_idx on public.design_queue using gin (nama_desain gin_trgm_ops);

-- Design snapshot per SPK (spk_design) to support Print SPK fallback
create table if not exists public.design_snapshots (
  order_id char(7) primary key references public.orders(id_spk) on delete cascade,
  snapshot jsonb not null, -- merged form (produk + tambahan + core), consider normalizing later
  created_at timestamptz not null default timezone('utc', now())
);

-- Order snapshot mirror (spk_orders) – often redundant if orders/order_items filled; kept for compatibility
create table if not exists public.order_snapshots (
  order_id char(7) primary key references public.orders(id_spk) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- =========================
-- 2b) Product catalog & media (replacement for database_produk + photo previews)
-- =========================

create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  order_id char(7) references public.orders(id_spk) on delete set null,
  nama_desain text,
  jenis_produk text,
  jenis_pola text,
  search text generated always as (coalesce(nama_desain,'') || ' ' || coalesce(jenis_produk,'') || ' ' || coalesce(jenis_pola,'')) stored,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists product_catalog_order_idx on public.product_catalog (order_id);
create index if not exists product_catalog_search_trgm_idx on public.product_catalog using gin (search gin_trgm_ops);

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.product_catalog(id) on delete cascade,
  kind media_kind not null default 'produk',
  url text not null,
  thumb_url text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists product_media_product_idx on public.product_media (product_id, created_at desc);

-- =========================
-- 2c) Optional: Carts (keranjang) prior to checkout
-- =========================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active', -- 'active','checked_out','abandoned'
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cart_items (
  id bigserial primary key,
  cart_id uuid references public.carts(id) on delete cascade,
  order_id char(7) references public.orders(id_spk) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists cart_items_cart_idx on public.cart_items (cart_id, created_at desc);
create index if not exists cart_items_order_idx on public.cart_items (order_id);

-- =========================
-- 3) Checkout, transactions, and production recap
-- =========================

-- Transactions (keranjang checkout groups) – 7-digit char id
create table if not exists public.transactions (
  id_transaksi char(7) primary key,
  created_at timestamptz not null default timezone('utc', now())
);

-- Production recap batches (7-digit id with business rules, mapped per SPK)
create table if not exists public.production_recap (
  id bigserial primary key,
  recap_id char(7) unique not null,
  recap_date date not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Link each SPK to a production recap (previously production_recap_map)
create table if not exists public.order_recap (
  order_id char(7) primary key references public.orders(id_spk) on delete cascade,
  production_recap_id bigint references public.production_recap(id) on delete cascade
);
create index if not exists order_recap_recap_idx on public.order_recap (production_recap_id);

-- Pipeline status flags per SPK (dates when each stage finished)
create table if not exists public.pipeline (
  order_id char(7) primary key references public.orders(id_spk) on delete cascade,
  id_transaksi char(7) references public.transactions(id_transaksi) on delete set null,
  id_rekap_custom char(7),
  id_custom char(7),
  nama_desain text,
  kuantity integer,
  selesai_desain_produksi timestamptz,
  selesai_cutting_pola timestamptz,
  selesai_stock_bordir timestamptz,
  selesai_bordir timestamptz,
  selesai_setting timestamptz,
  selesai_stock_jahit timestamptz,
  selesai_jahit timestamptz,
  selesai_finishing timestamptz,
  selesai_foto_produk timestamptz,
  selesai_pengiriman timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists pipeline_transaksi_idx on public.pipeline (id_transaksi);
create index if not exists pipeline_foto_idx on public.pipeline (selesai_foto_produk);
create index if not exists pipeline_kirim_idx on public.pipeline (selesai_pengiriman);
create index if not exists pipeline_nama_trgm_idx on public.pipeline using gin (nama_desain gin_trgm_ops);

-- Plotting queue before Rekap Bordir generation
create table if not exists public.plotting_queue (
  id bigserial primary key,
  order_id char(7) references public.orders(id_spk) on delete cascade,
  id_transaksi char(7) references public.transactions(id_transaksi) on delete set null,
  id_rekap_produksi char(7),
  id_rekap_custom char(7),
  id_custom char(7),
  nama_desain text,
  jenis_produk text,
  jenis_pola text,
  tanggal_input date,
  tgl_spk_terbit timestamptz,
  kuantity integer,
  status_desain text default 'Proses',
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists plotting_queue_trans_idx on public.plotting_queue (id_transaksi, created_at desc);

-- Pipeline history (audit of stage changes)
create table if not exists public.pipeline_history (
  id bigserial primary key,
  order_id char(7) references public.orders(id_spk) on delete cascade,
  division text, -- e.g. 'desain_produksi','cutting_pola', ...
  action text,   -- 'masuk','selesai','kembali'
  note text,
  actor text,
  at timestamptz not null default timezone('utc', now())
);
create index if not exists pipeline_history_order_idx on public.pipeline_history (order_id, at desc);

-- Rekap Bordir history and its items
create table if not exists public.rekap_bordir (
  id bigserial primary key,
  rekap_id char(7) unique not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rekap_bordir_items (
  id bigserial primary key,
  rekap_bordir_id bigint references public.rekap_bordir(id) on delete cascade,
  order_id char(7) references public.orders(id_spk) on delete cascade,
  id_transaksi char(7),
  id_rekap_custom char(7),
  id_custom char(7),
  nama_desain text,
  kuantity integer
);
create index if not exists rb_items_rekap_idx on public.rekap_bordir_items (rekap_bordir_id);
create index if not exists rb_items_order_idx on public.rekap_bordir_items (order_id);

-- Mapping for penjahit assignment per SPK (frontend: penjahit_map)
create table if not exists public.penjahit_assignments (
  order_id char(7) primary key references public.orders(id_spk) on delete cascade,
  penjahit_name text,
  updated_at timestamptz not null default timezone('utc', now())
);

-- =========================
-- 3b) Urgent SPK
-- =========================
create table if not exists public.spk_urgent (
  id bigserial primary key,
  order_id char(7) references public.orders(id_spk) on delete cascade,
  alasan text,
  requested_by text,
  status text default 'Aktif',
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists spk_urgent_order_idx on public.spk_urgent (order_id, created_at desc);

-- =========================
-- 4) Finance: invoices, revenues, payments, expenses
-- =========================

-- Invoices and rows
create table if not exists public.invoices (
  id bigserial primary key,
  no text unique not null,
  jenis text,
  total numeric,
  nominal_transaksi numeric,
  kekurangan numeric,
  ongkir numeric,
  nama_konsumen text,
  nama_instansi text,
  date timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.invoice_rows (
  id bigserial primary key,
  invoice_id bigint references public.invoices(id) on delete cascade,
  qty integer,
  name text,
  price numeric,
  nominal numeric
);
create index if not exists invoice_rows_invoice_idx on public.invoice_rows (invoice_id);

-- Revenues (omset_pendapatan)
create table if not exists public.revenues (
  id bigserial primary key,
  id_spk char(7),
  tanggal timestamptz,
  nama_pemesan text,
  tipe_transaksi text,
  nominal numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists revenues_tanggal_idx on public.revenues (tanggal desc);

-- Payments (pelunasan_transaksi)
create table if not exists public.payments (
  id bigserial primary key,
  id_transaksi char(7) references public.transactions(id_transaksi) on delete set null,
  nominal numeric not null,
  bukti jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists payments_trans_idx on public.payments (id_transaksi, created_at desc);

-- Expenses (unified across categories)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'expense_category') then
    create type expense_category as enum (
      'pengeluaran_gaji',
      'pengeluaran_belanja_logistik',
      'pengeluaran_fee_jaringan',
      'pengeluaran_marketing_ads',
      'pengeluaran_ongkir',
      'pengeluaran_maintenance_mesin',
      'pengeluaran_overhead_pabrik'
    );
  end if;
end$$;

create table if not exists public.expenses (
  id bigserial primary key,
  category expense_category not null,
  tanggal date not null default (timezone('utc', now()))::date,
  amount numeric not null,
  meta jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists expenses_cat_date_idx on public.expenses (category, tanggal desc);

-- =========================
-- 4c) SPK Revisions (for RevisiSpk)
-- =========================

create table if not exists public.spk_revisions (
  id bigserial primary key,
  order_id char(7) references public.orders(id_spk) on delete cascade,
  fields jsonb,  -- fields changed or full revised payload
  note text,
  actor text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists spk_revisions_order_idx on public.spk_revisions (order_id, created_at desc);

-- =========================
-- 4b) Prognosis (InputPrognosis / DatabasePrognosis)
-- =========================

create table if not exists public.prognosis_entries (
  id bigserial primary key,
  tanggal date not null,
  jenis_produk text,
  jenis_pola text,
  qty integer not null default 0,
  note text,
  created_by text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists prognosis_tanggal_idx on public.prognosis_entries (tanggal desc);
create index if not exists prognosis_prod_pattern_idx on public.prognosis_entries (jenis_produk, jenis_pola);

-- =========================
-- 5) Material stock movements (consolidates 5 pages)
-- =========================

-- Use a single table with bucket (1..5) to distinguish screens/flows
create table if not exists public.material_stock (
  id uuid primary key default gen_random_uuid(),
  bucket smallint not null check (bucket between 1 and 5),
  date date not null,
  code text,
  name text,
  category text,
  unit text,
  qty_in integer not null default 0,
  qty_out integer not null default 0,
  price numeric not null default 0,
  supplier text,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists material_stock_bucket_date_idx on public.material_stock (bucket, date desc);
create index if not exists material_stock_code_idx on public.material_stock (code);

-- =========================
-- 5b) HR: employees, attendance, performance, rejects
-- =========================

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  division text, -- e.g. 'Desain','Produksi','Bordir','Jahit','Finishing','Pengiriman'
  position text,
  phone text,
  status text default 'Aktif',
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists employees_name_trgm_idx on public.employees using gin (name gin_trgm_ops);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('hadir','izin','sakit','alpa');
  end if;
end$$;
create table if not exists public.attendance_logs (
  id bigserial primary key,
  employee_id uuid references public.employees(id) on delete cascade,
  tanggal date not null,
  status attendance_status not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists attendance_unique_per_day on public.attendance_logs (employee_id, tanggal);
create index if not exists attendance_tanggal_idx on public.attendance_logs (tanggal desc);

create table if not exists public.employee_performance (
  id bigserial primary key,
  employee_id uuid references public.employees(id) on delete cascade,
  tanggal date not null,
  metric text, -- e.g., 'qty_produksi', 'jam_kerja'
  value numeric not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists employee_performance_emp_date_idx on public.employee_performance (employee_id, tanggal desc);

create table if not exists public.employee_rejects (
  id bigserial primary key,
  employee_id uuid references public.employees(id) on delete cascade,
  tanggal date not null,
  order_id char(7) references public.orders(id_spk) on delete set null,
  reason text,
  qty integer,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists employee_rejects_emp_date_idx on public.employee_rejects (employee_id, tanggal desc);

-- =========================
-- 5c) Machines and maintenance
-- =========================

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  brand text,
  model text,
  serial_no text,
  status text default 'Aktif',
  location text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists machines_name_trgm_idx on public.machines using gin (name gin_trgm_ops);

create table if not exists public.machine_maintenance_logs (
  id bigserial primary key,
  machine_id uuid references public.machines(id) on delete cascade,
  tanggal date not null,
  maintenance_type text, -- 'preventive','corrective','repair'
  description text,
  cost numeric default 0,
  status text default 'Selesai',
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists machine_maintenance_machine_date_idx on public.machine_maintenance_logs (machine_id, tanggal desc);

-- =========================
-- 6) Views (additional)
-- =========================

-- =========================
-- 6) Views to mimic existing local shapes (helps gradual migration)
-- =========================

-- Antrian Input Desain view (idSpk, namaPemesan, quantity, tipeTransaksi, namaCS, tanggalInput)
create or replace view public.view_antrian_input_desain as
select
  o.id_spk as "idSpk",
  coalesce(o.nama_pemesan, '') as "namaPemesan",
  coalesce((select count(1) from public.order_items oi where oi.order_id = o.id_spk), 0) as "quantity",
  coalesce(o.transaction_type, '-') as "tipeTransaksi",
  coalesce(o.cs_name, '-') as "namaCS",
  o.tanggal_input as "tanggalInput"
from public.orders o
order by o.created_at desc;

-- Division antrian base view joining pipeline with helpful fields
create or replace view public.view_pipeline_enriched as
select
  p.order_id as id_spk,
  p.id_transaksi,
  p.id_rekap_custom,
  p.id_custom,
  p.nama_desain,
  p.kuantity,
  -- stage timestamps
  p.selesai_desain_produksi,
  p.selesai_cutting_pola,
  p.selesai_stock_bordir,
  p.selesai_bordir,
  p.selesai_setting,
  p.selesai_stock_jahit,
  p.selesai_jahit,
  p.selesai_finishing,
  p.selesai_foto_produk,
  p.selesai_pengiriman,
  -- enrich
  (select d.snapshot->>'product' from public.design_snapshots d where d.order_id = p.order_id) as jenis_produk,
  (select d.snapshot->>'pattern' from public.design_snapshots d where d.order_id = p.order_id) as jenis_pola,
  (select o.tanggal_input from public.orders o where o.id_spk = p.order_id) as tanggal_input
from public.pipeline p;

-- Product trend view (approx replacement for database_trend)
-- Aggregates by product/pattern from design snapshots and counts SPK per day
create or replace view public.view_product_trend as
select
  (d.snapshot->>'product') as jenis_produk,
  (d.snapshot->>'pattern') as jenis_pola,
  date_trunc('day', o.created_at) as hari,
  count(*)::int as jumlah_spk
from public.design_snapshots d
join public.orders o on o.id_spk = d.order_id
group by 1,2,3
order by 3 desc, 4 desc;

-- Region distribution view (approx replacement for database_sebaran)
create or replace view public.view_region_distribution as
select
  coalesce(o.region_province,'') as province,
  coalesce(o.region_regency,'') as regency,
  count(*)::int as jumlah_pesanan
from public.orders o
group by 1,2
order by 3 desc;

-- Absensi harian agregasi
create or replace view public.view_absensi_harian as
select tanggal,
       sum(case when status = 'hadir' then 1 else 0 end) as hadir,
       sum(case when status = 'izin' then 1 else 0 end) as izin,
       sum(case when status = 'sakit' then 1 else 0 end) as sakit,
       sum(case when status = 'alpa' then 1 else 0 end) as alpa
from public.attendance_logs
group by tanggal
order by tanggal desc;

-- Ringkasan biaya maintenance per bulan
create or replace view public.view_maintenance_bulanan as
select date_trunc('month', tanggal) as bulan,
       sum(cost) as total_biaya
from public.machine_maintenance_logs
group by 1
order by 1 desc;

-- Transaksi progress ringkas (berdasarkan pipeline)
create or replace view public.view_transaksi_progress as
select p.id_transaksi,
       count(*)::int as total_spk,
       count(p.selesai_desain_produksi)::int as selesai_desain_produksi,
       count(p.selesai_cutting_pola)::int as selesai_cutting_pola,
       count(p.selesai_stock_bordir)::int as selesai_stock_bordir,
       count(p.selesai_bordir)::int as selesai_bordir,
       count(p.selesai_setting)::int as selesai_setting,
       count(p.selesai_stock_jahit)::int as selesai_stock_jahit,
       count(p.selesai_jahit)::int as selesai_jahit,
       count(p.selesai_finishing)::int as selesai_finishing,
       count(p.selesai_foto_produk)::int as selesai_foto_produk,
       count(p.selesai_pengiriman)::int as selesai_pengiriman
from public.pipeline p
where p.id_transaksi is not null
group by p.id_transaksi
order by max(p.created_at) desc;

-- SPK on Proses (semua SPK yang belum selesai pengiriman) + status ringkas
create or replace view public.view_spk_on_proses as
select
  p.order_id as id_spk,
  p.id_transaksi,
  p.nama_desain,
  p.kuantity,
  (select o.tanggal_input from public.orders o where o.id_spk = p.order_id) as tanggal_input,
  (select d.snapshot->>'product' from public.design_snapshots d where d.order_id = p.order_id) as jenis_produk,
  (select d.snapshot->>'pattern' from public.design_snapshots d where d.order_id = p.order_id) as jenis_pola,
  -- stage timestamps passthrough
  p.selesai_desain_produksi,
  p.selesai_cutting_pola,
  p.selesai_stock_bordir,
  p.selesai_bordir,
  p.selesai_setting,
  p.selesai_stock_jahit,
  p.selesai_jahit,
  p.selesai_finishing,
  p.selesai_foto_produk,
  p.selesai_pengiriman,
  -- derived fields
  case
    when p.selesai_desain_produksi is null then 'desain_produksi'
    when p.selesai_cutting_pola is null then 'cutting_pola'
    when p.selesai_stock_bordir is null then 'stock_bordir'
    when p.selesai_bordir is null then 'bordir'
    when p.selesai_setting is null then 'setting'
    when p.selesai_stock_jahit is null then 'stock_jahit'
    when p.selesai_jahit is null then 'jahit'
    when p.selesai_finishing is null then 'finishing'
    when p.selesai_foto_produk is null then 'foto_produk'
    when p.selesai_pengiriman is null then 'pengiriman'
    else 'Selesai'
  end as current_stage,
  case
    when p.selesai_desain_produksi is null then 'cutting_pola'
    when p.selesai_cutting_pola is null then 'stock_bordir'
    when p.selesai_stock_bordir is null then 'bordir'
    when p.selesai_bordir is null then 'setting'
    when p.selesai_setting is null then 'stock_jahit'
    when p.selesai_stock_jahit is null then 'jahit'
    when p.selesai_jahit is null then 'finishing'
    when p.selesai_finishing is null then 'foto_produk'
    when p.selesai_foto_produk is null then 'pengiriman'
    else null
  end as next_stage,
  round((
    (coalesce((p.selesai_desain_produksi is not null)::int,0) +
     coalesce((p.selesai_cutting_pola   is not null)::int,0) +
     coalesce((p.selesai_stock_bordir   is not null)::int,0) +
     coalesce((p.selesai_bordir         is not null)::int,0) +
     coalesce((p.selesai_setting        is not null)::int,0) +
     coalesce((p.selesai_stock_jahit    is not null)::int,0) +
     coalesce((p.selesai_jahit          is not null)::int,0) +
     coalesce((p.selesai_finishing      is not null)::int,0) +
     coalesce((p.selesai_foto_produk    is not null)::int,0) +
     coalesce((p.selesai_pengiriman     is not null)::int,0)
    ) * 100.0 / 10.0
  )::numeric, 1) as progress_pct
from public.pipeline p
where p.selesai_pengiriman is null
order by coalesce(p.selesai_foto_produk, p.selesai_finishing, p.selesai_jahit, p.selesai_stock_jahit, p.selesai_setting, p.selesai_bordir, p.selesai_stock_bordir, p.selesai_cutting_pola, p.selesai_desain_produksi, p.created_at) asc nulls first;

-- Antrian per divisi (eligible = semua sebelumnya sudah selesai dan tahap ini belum)
create or replace view public.view_antrian_desain_produksi as
  select * from public.view_pipeline_enriched v
  where v.selesai_desain_produksi is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_cutting_pola as
  select * from public.view_pipeline_enriched v
  where v.selesai_desain_produksi is not null and v.selesai_cutting_pola is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_stock_bordir as
  select * from public.view_pipeline_enriched v
  where v.selesai_cutting_pola is not null and v.selesai_stock_bordir is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_bordir as
  select * from public.view_pipeline_enriched v
  where v.selesai_stock_bordir is not null and v.selesai_bordir is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_setting as
  select * from public.view_pipeline_enriched v
  where v.selesai_bordir is not null and v.selesai_setting is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_stock_jahit as
  select * from public.view_pipeline_enriched v
  where v.selesai_setting is not null and v.selesai_stock_jahit is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_jahit as
  select * from public.view_pipeline_enriched v
  where v.selesai_stock_jahit is not null and v.selesai_jahit is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_finishing as
  select * from public.view_pipeline_enriched v
  where v.selesai_jahit is not null and v.selesai_finishing is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_foto_produk as
  select * from public.view_pipeline_enriched v
  where v.selesai_finishing is not null and v.selesai_foto_produk is null
  order by v.tanggal_input asc nulls last;

create or replace view public.view_antrian_pengiriman as
  select * from public.view_pipeline_enriched v
  where v.selesai_foto_produk is not null and v.selesai_pengiriman is null
  order by v.tanggal_input asc nulls last;

-- Konsolidasi Keuangan Harian dan Bulanan
create or replace view public.view_finance_harian as
with r as (
  select (date_trunc('day', tanggal))::date as hari, sum(nominal) as pendapatan
  from public.revenues
  group by 1
), e as (
  select tanggal as hari, sum(amount) as pengeluaran
  from public.expenses
  group by 1
)
select coalesce(r.hari, e.hari) as hari,
       coalesce(r.pendapatan, 0) as pendapatan,
       coalesce(e.pengeluaran, 0) as pengeluaran,
       coalesce(r.pendapatan, 0) - coalesce(e.pengeluaran, 0) as net
from r full outer join e on r.hari = e.hari
order by hari desc;

create or replace view public.view_finance_bulanan as
with r as (
  select date_trunc('month', tanggal) as bulan, sum(nominal) as pendapatan
  from public.revenues
  group by 1
), e as (
  select date_trunc('month', tanggal) as bulan, sum(amount) as pengeluaran
  from public.expenses
  group by 1
)
select coalesce(r.bulan, e.bulan) as bulan,
       coalesce(r.pendapatan, 0) as pendapatan,
       coalesce(e.pengeluaran, 0) as pengeluaran,
       coalesce(r.pendapatan, 0) - coalesce(e.pengeluaran, 0) as net
from r full outer join e on r.bulan = e.bulan
order by bulan desc;

-- =========================
-- 6b) Pattern HPP (material cost per pattern)
-- =========================

create table if not exists public.pattern_hpp (
  id bigserial primary key,
  pattern_code text not null,
  total_cost numeric not null default 0,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists pattern_hpp_code_idx on public.pattern_hpp (pattern_code);

create table if not exists public.pattern_hpp_items (
  id bigserial primary key,
  pattern_hpp_id bigint references public.pattern_hpp(id) on delete cascade,
  material_code text,
  qty numeric not null default 0,
  unit_cost numeric not null default 0,
  subtotal numeric generated always as (qty * unit_cost) stored
);
create index if not exists pattern_hpp_items_hdr_idx on public.pattern_hpp_items (pattern_hpp_id);
-- =========================
-- 7) RLS and Realtime (MVP policies – open; tighten later)
-- =========================

-- Enable RLS
alter table public.customers enable row level security;
alter table public.logistics_master enable row level security;
alter table public.patterns_master enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.design_queue enable row level security;
alter table public.design_snapshots enable row level security;
alter table public.order_snapshots enable row level security;
alter table public.transactions enable row level security;
alter table public.production_recap enable row level security;
alter table public.order_recap enable row level security;
alter table public.pipeline enable row level security;
alter table public.plotting_queue enable row level security;
alter table public.rekap_bordir enable row level security;
alter table public.rekap_bordir_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_rows enable row level security;
alter table public.revenues enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.material_stock enable row level security;

alter table public.landing_sections enable row level security;
alter table public.landing_media enable row level security;
alter table public.product_catalog enable row level security;
alter table public.product_media enable row level security;
alter table public.pipeline_history enable row level security;
alter table public.spk_urgent enable row level security;
alter table public.prognosis_entries enable row level security;
alter table public.employees enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.employee_performance enable row level security;
alter table public.employee_rejects enable row level security;
alter table public.machines enable row level security;
alter table public.machine_maintenance_logs enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.spk_revisions enable row level security;
alter table public.pattern_hpp enable row level security;
alter table public.pattern_hpp_items enable row level security;
alter table public.kv_store enable row level security;
alter table public.penjahit_assignments enable row level security;

-- Drop policies if they exist (to re-apply idempotently)
do $$
declare r record;
begin
  for r in (
    select schemaname, tablename from pg_tables where schemaname='public'
      and tablename in (
        'customers','logistics_master','patterns_master','landing_sections','landing_media','orders','order_items','design_queue','design_snapshots','order_snapshots','product_catalog','product_media','transactions','production_recap','order_recap','pipeline','pipeline_history','plotting_queue','rekap_bordir','rekap_bordir_items','spk_urgent','invoices','invoice_rows','revenues','payments','expenses','prognosis_entries','material_stock','employees','attendance_logs','employee_performance','employee_rejects','machines','machine_maintenance_logs','carts','cart_items','spk_revisions','pattern_hpp','pattern_hpp_items','kv_store','penjahit_assignments'
      )
  ) loop
    -- Drop previously created policy names to keep script idempotent
    execute format('drop policy if exists %I on %I.%I','all_select', r.schemaname, r.tablename);
    execute format('drop policy if exists %I on %I.%I','all_modify', r.schemaname, r.tablename);
    execute format('drop policy if exists %I on %I.%I','all_modify_update', r.schemaname, r.tablename);
    execute format('drop policy if exists %I on %I.%I','all_modify_delete', r.schemaname, r.tablename);
    execute format('drop policy if exists %I on %I.%I','all_insert', r.schemaname, r.tablename);
    execute format('drop policy if exists %I on %I.%I','all_update', r.schemaname, r.tablename);
    execute format('drop policy if exists %I on %I.%I','all_delete', r.schemaname, r.tablename);
  end loop;
end$$;

-- Permissive policies for MVP (allow anon full access)
do $$
declare r record;
begin
  for r in (
    select schemaname, tablename from pg_tables where schemaname='public'
      and tablename in (
        'customers','logistics_master','patterns_master','landing_sections','landing_media','orders','order_items','design_queue','design_snapshots','order_snapshots','product_catalog','product_media','transactions','production_recap','order_recap','pipeline','pipeline_history','plotting_queue','rekap_bordir','rekap_bordir_items','spk_urgent','invoices','invoice_rows','revenues','payments','expenses','prognosis_entries','material_stock','employees','attendance_logs','employee_performance','employee_rejects','machines','machine_maintenance_logs','carts','cart_items','spk_revisions','pattern_hpp','pattern_hpp_items'
      )
  ) loop
    execute format('create policy %I on %I.%I for select using (true)','all_select', r.schemaname, r.tablename);
    execute format('create policy %I on %I.%I for insert with check (true)','all_insert', r.schemaname, r.tablename);
    execute format('create policy %I on %I.%I for update using (true) with check (true)','all_update', r.schemaname, r.tablename);
    execute format('create policy %I on %I.%I for delete using (true)','all_delete', r.schemaname, r.tablename);
  end loop;
end$$;

-- Realtime publications
do $$
declare r record;
begin
  for r in (
    select unnest(array[
        'customers','logistics_master','patterns_master','landing_sections','landing_media','orders','order_items','design_queue','design_snapshots','order_snapshots','product_catalog','product_media','transactions','production_recap','order_recap','pipeline','pipeline_history','plotting_queue','rekap_bordir','rekap_bordir_items','spk_urgent','invoices','invoice_rows','revenues','payments','expenses','prognosis_entries','material_stock','employees','attendance_logs','employee_performance','employee_rejects','machines','machine_maintenance_logs'
      ,'carts','cart_items','kv_store','penjahit_assignments'
      ,'spk_revisions','pattern_hpp','pattern_hpp_items'
    ]) as tab
  ) loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = r.tab
    ) then
      execute format('alter publication %I add table %I.%I','supabase_realtime','public', r.tab);
    end if;
  end loop;
end$$;

commit;

-- Notes:
-- - For production, tighten RLS and use authenticated roles instead of anon open policies.
-- - Consider moving large binary assets to Supabase Storage and keep only URLs in DB.
-- - Add foreign keys from pipeline.plotting_queue to rekap tables after backend flow is finalized.
-- - Optional: Add server-side 7-digit counters if you decide to generate IDs on the DB.

-- Optional helpers (safe to run separately too): ID counters
-- Keep after commit to avoid affecting transaction if editor auto-commits views earlier
create table if not exists public.id_counters (
  name text primary key,
  last_value bigint not null default 0
);

create or replace function public.next_counter_7(p_name text)
returns char(7)
language plpgsql
as $$
declare v bigint;
begin
  insert into public.id_counters(name, last_value)
  values (p_name, 0)
  on conflict (name) do nothing;

  update public.id_counters
  set last_value = last_value + 1
  where name = p_name
  returning last_value into v;

  return lpad(v::text, 7, '0');
end$$;

-- RPC: Checkout keranjang -> generate id_transaksi, upsert pipeline, insert plotting_queue
-- Allocation rule for production_recap (id_rekap_produksi):
-- - Same day accumulates quantities up to 15 pcs; when exceeded, start a new recap ID.
-- - New day always starts a new recap ID.
create or replace function public.checkout_cart(p_items jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_tx char(7);
  v_now timestamptz := timezone('utc', now());
  v_out jsonb := '[]'::jsonb;
  v_item jsonb;
  v_qty int;
  v_order_id char(7);
  v_id_rekap_custom char(7);
  v_id_custom char(7);
  v_nama text;
  v_rekap_id char(7);
  v_current_rekap_id char(7);
  v_current_recap_qty int := 0;
  v_today date := (timezone('utc', now()))::date;
begin
  -- 1) Create transaction id
  v_tx := public.next_counter_7('transactions');
  insert into public.transactions(id_transaksi, created_at) values (v_tx, v_now);

  -- 2) Load latest recap for today and its current assigned qty
  select pr.recap_id
    into v_current_rekap_id
    from public.production_recap pr
    where pr.recap_date = v_today
    order by pr.id desc
    limit 1;

  if v_current_rekap_id is not null then
    select coalesce(sum(pq.kuantity),0)::int
      into v_current_recap_qty
      from public.plotting_queue pq
      where pq.id_rekap_produksi = v_current_rekap_id;
  end if;

  -- 3) Process items
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_order_id := nullif(trim(v_item->>'idSpk'), '')::char(7);
    v_id_rekap_custom := nullif(trim(v_item->>'idRekapCustom'), '')::char(7);
    v_id_custom := nullif(trim(v_item->>'idCustom'), '')::char(7);
    v_nama := v_item->>'namaDesain';
    v_qty := coalesce((v_item->>'kuantity')::int, 0);

    -- 3a) Ensure recap capacity
    if v_current_rekap_id is null then
      v_current_rekap_id := public.next_counter_7('production_recap');
      insert into public.production_recap(recap_id, recap_date) values (v_current_rekap_id, v_today);
      v_current_recap_qty := 0;
    end if;

    if v_current_recap_qty + coalesce(v_qty,0) > 15 then
      v_current_rekap_id := public.next_counter_7('production_recap');
      insert into public.production_recap(recap_id, recap_date) values (v_current_rekap_id, v_today);
      v_current_recap_qty := 0;
    end if;

    v_rekap_id := v_current_rekap_id;
    v_current_recap_qty := v_current_recap_qty + coalesce(v_qty,0);

    -- 3b) Upsert pipeline row
    insert into public.pipeline(order_id, id_transaksi, id_rekap_custom, id_custom, nama_desain, kuantity, created_at)
      values (v_order_id, v_tx, v_id_rekap_custom, v_id_custom, v_nama, v_qty, v_now)
    on conflict (order_id) do update
      set id_transaksi = excluded.id_transaksi,
          id_rekap_custom = coalesce(excluded.id_rekap_custom, public.pipeline.id_rekap_custom),
          id_custom = coalesce(excluded.id_custom, public.pipeline.id_custom),
          nama_desain = coalesce(excluded.nama_desain, public.pipeline.nama_desain),
          kuantity = coalesce(excluded.kuantity, public.pipeline.kuantity);

    -- 3c) Insert into plotting queue
    insert into public.plotting_queue(order_id, id_transaksi, id_rekap_produksi, id_rekap_custom, id_custom, nama_desain, kuantity, tgl_spk_terbit, status_desain)
      values (v_order_id, v_tx, v_rekap_id, v_id_rekap_custom, v_id_custom, v_nama, v_qty, v_now, 'Proses');

    -- 3d) Output element
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'idSpk', v_order_id,
      'idTransaksi', v_tx,
      'idRekapProduksi', v_rekap_id,
      'idRekapCustom', v_id_rekap_custom,
      'idCustom', v_id_custom,
      'namaDesain', v_nama,
      'kuantity', v_qty
    ));
  end loop;

  return jsonb_build_object('idTransaksi', v_tx, 'items', v_out);
end;
$$;

