# Supabase Relational Schema for ERP Sakura

This schema normalizes the large datasets previously stored in localStorage into first-class Postgres tables on Supabase. It preserves current UI needs while enabling efficient queries, constraints, and realtime updates.

## Files
- `schema-relational.sql` — DDL to create tables, indexes, views, permissive RLS (MVP), and realtime publications.

## Apply the schema
Run in Supabase SQL editor (Project > SQL):

1) Ensure you’ve configured your project with the default `postgres` database and have `supabase_realtime` publication present (default on Supabase).
2) Paste and execute `schema-relational.sql`. It’s idempotent.

## Incremental migration approach
You’re already syncing localStorage to the `kv_store` mirror via the bridge. Migrate screen-by-screen by switching reads/writes to the relational tables:

1. Start with high-read datasets:
   - `orders`, `order_items`
   - `pipeline` (and view `view_pipeline_enriched`)
   - `design_queue`, `design_snapshots`
2. Keep writing to `kv_store` during transition if needed, then remove it once screens are fully on relational queries.

## Targeted query examples

### 1) Antrian Input Desain
- Current screen expects: `idSpk, namaPemesan, quantity, tipeTransaksi, namaCS, tanggalInput`
- Use the provided view:

```sql
select * from public.view_antrian_input_desain limit 100;
```

### 2) Division queues (generic)
- Base data comes from `pipeline`, enriched with snapshot fields:

```sql
select *
from public.view_pipeline_enriched
order by coalesce(selesai_bordir, selesai_setting, selesai_jahit, selesai_finishing, selesai_foto_produk, selesai_pengiriman) nulls first, id_spk desc
limit 200;
```

Filter per division by null/not-null of the relevant `selesai_*` columns.

You can also use ready-made views per division:

```sql
select * from public.view_antrian_desain_produksi limit 100;
select * from public.view_antrian_cutting_pola limit 100;
select * from public.view_antrian_stock_bordir limit 100;
select * from public.view_antrian_bordir limit 100;
select * from public.view_antrian_setting limit 100;
select * from public.view_antrian_stock_jahit limit 100;
select * from public.view_antrian_jahit limit 100;
select * from public.view_antrian_finishing limit 100;
select * from public.view_antrian_foto_produk limit 100;
select * from public.view_antrian_pengiriman limit 100;
```

### 3) Mark a stage selesai (example: Bordir)

```sql
update public.pipeline
set selesai_bordir = now()
where order_id = '1234567'
returning *;
```

### 4) Plotting → Rekap Bordir
- List plotting queue waiting items for a transaksi:

```sql
select * from public.plotting_queue
where id_transaksi = '7654321'
order by created_at asc;
```

- Create a Rekap Bordir header and attach items:

```sql
insert into public.rekap_bordir (rekap_id)
values ('0004321')
returning id;

-- Suppose it returns id = 42
insert into public.rekap_bordir_items (rekap_bordir_id, order_id, id_transaksi, id_rekap_custom, id_custom, nama_desain, kuantity)
select 42, order_id, id_transaksi, id_rekap_custom, id_custom, nama_desain, kuantity
from public.plotting_queue
where id_transaksi = '7654321';
```

### 5) Orders and items

```sql
-- Create order
insert into public.orders (id_spk, nama_pemesan, phone, address, region_province, region_regency, transaction_type, cs_name, nominal, tanggal_input)
values ('1234567', 'Budi', '0812...', 'Jl. Mawar', 'Jawa Barat', 'Bandung', 'Tunai', 'CS-1', 500000, now())
returning *;

-- Add items
insert into public.order_items (order_id, size, nama, format_nama)
values ('1234567', 'L', 'Jersey Tim A', 'TIM-A-L'), ('1234567', 'M', 'Jersey Tim A', 'TIM-A-M');
```

### 6) Invoices

```sql
insert into public.invoices (no, jenis, total, nominal_transaksi, kekurangan, ongkir, nama_konsumen, nama_instansi, date)
values ('INV-2025-001', 'Pelunasan', 1500000, 1500000, 0, 20000, 'Budi', 'Toko Budi', now())
returning id;

insert into public.invoice_rows (invoice_id, qty, name, price, nominal)
values (1, 3, 'Jersey Tim A', 500000, 1500000);
```

### 7) Payments (Pelunasan)

```sql
insert into public.payments (id_transaksi, nominal, bukti)
values ('7654321', 500000, '{"fileName":"bukti.jpg","url":"https://..."}'::jsonb);
```

### 8) Revenues (Omset)

```sql
select date_trunc('day', tanggal) as hari, sum(nominal) as total
from public.revenues
where tanggal >= now() - interval '30 days'
group by 1
order by 1 asc;
```

### 9) Materials: master and stock movements

```sql
-- Master
insert into public.logistics_master (code, name, category, unit, min_stock)
values ('LG001', 'Kain Drifit', 'Bahan', 'meter', 50);

-- Movement (bucket 1..5)
insert into public.material_stock (bucket, date, code, name, category, unit, qty_in, price, supplier, note)
values (1, current_date, 'LG001', 'Kain Drifit', 'Bahan', 'meter', 100, 25000, 'CV. Tekstil', 'Datang awal bulan');
```

### 10) Product catalog and media (database_produk replacement)

```sql
-- Create a catalog entry (often alongside design snapshots)
insert into public.product_catalog (order_id, nama_desain, jenis_produk, jenis_pola)
values ('1234567', 'Jersey Tim A', 'Jersey', 'Sablon');

-- Attach photo(s)
insert into public.product_media (product_id, kind, url, thumb_url)
values ('<product_uuid>', 'produk', 'https://storage.../produk.jpg', 'https://storage.../produk-thumb.jpg');

-- Search by SPK/name/product/pattern
select pc.*, pm.url as photo
from public.product_catalog pc
left join lateral (
   select url from public.product_media pm where pm.product_id = pc.id order by pm.created_at asc limit 1
) pm on true
where pc.order_id = '1234567' or pc.search ilike '%jersey%';
```

### 11) Landing CMS

```sql
-- Sections
insert into public.landing_sections (section_key, title, content, order_no)
values ('hero', 'Selamat Datang', '{"subtitle":"Sakura Konveksi"}'::jsonb, 1)
on conflict (section_key) do update set title = excluded.title, content = excluded.content, order_no = excluded.order_no;

-- Media in a section
insert into public.landing_media (section_id, kind, url, thumb_url, order_no)
values ('<section_uuid>', 'banner', 'https://storage.../banner.jpg', null, 1);

-- Fetch active sections with media
select s.*, json_agg(m.* order by m.order_no) as media
from public.landing_sections s
left join public.landing_media m on m.section_id = s.id
where s.is_active
group by s.id
order by s.order_no;
```

### 12) Urgent SPK

```sql
insert into public.spk_urgent (order_id, alasan, requested_by)
values ('1234567', 'Deadline mepet', 'Admin');

-- List latest urgent requests
select * from public.spk_urgent order by created_at desc limit 50;
```

### 13) Prognosis

```sql
insert into public.prognosis_entries (tanggal, jenis_produk, jenis_pola, qty, note, created_by)
values (current_date, 'Jersey', 'Sablon', 120, 'Perkiraan minggu depan', 'Planner');

-- Ringkas per hari dan kategori
select tanggal, jenis_produk, jenis_pola, sum(qty) as total
from public.prognosis_entries
where tanggal between current_date - interval '30 days' and current_date
group by 1,2,3
order by 1 desc, 4 desc;
```

### 14) HR: Karyawan, Absensi, Capaian, Reject

```sql
-- Karyawan
insert into public.employees (name, division, position, phone)
values ('Andi', 'Produksi', 'Operator Jahit', '0812...');

-- Absensi
insert into public.attendance_logs (employee_id, tanggal, status, note)
values ('<employee_uuid>', current_date, 'hadir', 'Shift pagi');

-- Capaian
insert into public.employee_performance (employee_id, tanggal, metric, value, note)
values ('<employee_uuid>', current_date, 'qty_produksi', 25, 'Tim A');

-- Reject produksi terkait SPK (opsional)
insert into public.employee_rejects (employee_id, tanggal, order_id, reason, qty)
values ('<employee_uuid>', current_date, '1234567', 'Jahit kurang rapi', 2);

-- Rekap absensi harian siap pakai (view)
select * from public.view_absensi_harian limit 30;
```

### 15) Mesin & Maintenance

```sql
-- Daftar mesin
insert into public.machines (code, name, brand, model, serial_no, location)
values ('MSN-01', 'Mesin Jahit 1', 'Juki', 'DLM-555', 'SN-001', 'Workshop A');

-- Catatan maintenance
insert into public.machine_maintenance_logs (machine_id, tanggal, maintenance_type, description, cost)
values ('<machine_uuid>', current_date, 'preventive', 'Ganti oli', 50000);

-- Total biaya per bulan (view)
select * from public.view_maintenance_bulanan where bulan >= date_trunc('month', now() - interval '6 months');
```

### 16) Pipeline history (audit)

```sql
insert into public.pipeline_history (order_id, division, action, note, actor)
values ('1234567', 'bordir', 'selesai', 'Selesai bordir', 'Operator B');

-- Timeline sebuah SPK
select * from public.pipeline_history where order_id = '1234567' order by at asc;
```

### 17) ID counters (7-digit)

If you want server-side 7-digit IDs (for SPK/Transaksi/Rekap/Custom) use the `id_counters` function below (to be added):

```sql
-- Create table
create table if not exists public.id_counters (
   name text primary key,
   last_value bigint not null default 0
);

-- Function to atomically get next 7-digit string
create or replace function public.next_counter_7(p_name text)
returns char(7)
language plpgsql
as $$
declare v bigint;
begin
   insert into public.id_counters(name, last_value) values (p_name, 0)
   on conflict (name) do nothing;

   update public.id_counters set last_value = last_value + 1 where name = p_name returning last_value into v;
   return lpad(v::text, 7, '0');
end$$;

-- Usage
select public.next_counter_7('spk_auto_seq');
```

### 18) Carts (keranjang)

```sql
-- Create a cart and add orders into it before checkout
insert into public.carts default values returning id;

insert into public.cart_items (cart_id, order_id)
values ('<cart_uuid>', '1234567');

-- Fetch cart items
select ci.*, o.nama_pemesan, o.transaction_type
from public.cart_items ci
join public.orders o on o.id_spk = ci.order_id
where ci.cart_id = '<cart_uuid>'
order by ci.created_at asc;
```

### 19) Transaksi progress (summary per id_transaksi)

```sql
select * from public.view_transaksi_progress order by id_transaksi desc limit 50;
```

### 21) SPK On Proses (semua SPK yang belum selesai)

```sql
select *
from public.view_spk_on_proses
where (jenis_produk ilike '%jersey%' or '1234567' = id_spk)
order by tanggal_input desc
limit 200 offset 0;
```

### 20) Pattern HPP (if used by your HPP pages)

You can model HPP per pola/pattern with two tables:

```sql
create table if not exists public.pattern_hpp (
   id bigserial primary key,
   pattern_code text not null,
   total_cost numeric not null default 0,
   note text,
   created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pattern_hpp_items (
   id bigserial primary key,
   pattern_hpp_id bigint references public.pattern_hpp(id) on delete cascade,
   material_code text,
   qty numeric not null default 0,
   unit_cost numeric not null default 0,
   subtotal numeric generated always as (qty * unit_cost) stored
);

-- Example usage
insert into public.pattern_hpp (pattern_code, note) values ('POLA-001', 'Jersey A') returning id;
insert into public.pattern_hpp_items (pattern_hpp_id, material_code, qty, unit_cost)
values (1, 'LG001', 2.5, 25000);
update public.pattern_hpp set total_cost = (select coalesce(sum(subtotal),0) from public.pattern_hpp_items where pattern_hpp_id = 1) where id = 1;
```

## RLS notes
- The schema enables RLS and installs open (anon) policies for MVP so reads/writes work immediately like localStorage.
- For production, restrict to authenticated users/roles and add row ownership.

## Storage for images
- Large images (mockup, produk) should go to Supabase Storage buckets; keep only URLs in DB. For MVP, `design_queue.assets` stores JSONB to avoid breaking current UI.

## Realtime
- All major tables are added to `supabase_realtime` publication so the existing bridge and any direct listeners can subscribe.

## Next steps (suggested)
- Add foreign keys from pipeline/plotting to rekap after backend flow is finalized.
- Introduce auth and role-based RLS.
- Incrementally switch screens to relational queries (keep the kv_store bridge until complete).
 - For barcode/lookup heavy screens, create RPCs (SQL functions) for faster computed responses and to encapsulate joins.
