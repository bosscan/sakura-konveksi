-- Migrate selected data from kv_store JSON blobs into relational tables
-- Run after executing schema-relational.sql
-- Safe-ish: uses ON CONFLICT where applicable; adjust as needed.

begin;

-- 1) Database Konsumen -> public.customers
-- Assumes kv_store.key = 'database_konsumen' and value is jsonb array of objects
-- shape: { nama, telepon, alamat, createdAt }
with src as (
  select (value)::jsonb as arr
  from public.kv_store
  where key = 'database_konsumen'
), flat as (
  select jsonb_array_elements(coalesce(arr, '[]'::jsonb)) as o from src
)
insert into public.customers(id, name, phone, address, created_at)
select
  coalesce(nullif(o->>'id','')::uuid, gen_random_uuid()) as id,
  o->>'nama'   as name,
  o->>'telepon' as phone,
  o->>'alamat' as address,
  coalesce((o->>'createdAt')::timestamptz, now()) as created_at
from flat
on conflict (id) do update
  set name = excluded.name,
      phone = excluded.phone,
      address = excluded.address;

-- 2) Design queue (optional): if you kept a 'design_queue' array in kv_store
-- This is highly dependent on your actual JSON shape; adjust field mapping.
-- Example mapping below attempts common fields used in UI.
with src2 as (
  select (value)::jsonb as arr
  from public.kv_store
  where key = 'design_queue'
), flat2 as (
  select jsonb_array_elements(coalesce(arr, '[]'::jsonb)) as o from src2
)
insert into public.design_queue(id, order_id, id_rekap_custom, id_custom, nama_desain, jenis_produk, jenis_pola, tanggal_input, nama_cs, asset_link, catatan, assets, status, created_at)
select
  coalesce(nullif(o->>'id','')::uuid, gen_random_uuid()) as id,
  nullif(o->>'idSpk','')::char(7) as order_id,
  nullif(o->>'idRekapCustom','')::char(7) as id_rekap_custom,
  nullif(o->>'idCustom','')::char(7) as id_custom,
  o->>'namaDesain' as nama_desain,
  o->>'jenisProduk' as jenis_produk,
  o->>'jenisPola' as jenis_pola,
  nullif(o->>'tanggalInput','')::date as tanggal_input,
  o->>'namaCS' as nama_cs,
  o->>'assetLink' as asset_link,
  o->>'catatan' as catatan,
  coalesce(o->'assets','[]'::jsonb) as assets,
  coalesce(o->>'status','Proses') as status,
  now() as created_at
from flat2
on conflict (id) do update
  set order_id = excluded.order_id,
      nama_desain = excluded.nama_desain,
      jenis_produk = excluded.jenis_produk,
      jenis_pola = excluded.jenis_pola,
      status = excluded.status;

-- 3) Pipeline snapshot (if you stored 'spk_pipeline' in kv_store)
with src3 as (
  select (value)::jsonb as arr
  from public.kv_store
  where key = 'spk_pipeline'
), flat3 as (
  select jsonb_array_elements(coalesce(arr, '[]'::jsonb)) as o from src3
)
insert into public.pipeline(order_id, id_transaksi, id_rekap_custom, id_custom, nama_desain, kuantity,
  selesai_desain_produksi, selesai_cutting_pola, selesai_stock_bordir, selesai_bordir, selesai_setting,
  selesai_stock_jahit, selesai_jahit, selesai_finishing, selesai_foto_produk, selesai_pengiriman, created_at)
select
  nullif(o->>'idSpk','')::char(7) as order_id,
  nullif(o->>'idTransaksi','')::char(7) as id_transaksi,
  nullif(o->>'idRekapCustom','')::char(7) as id_rekap_custom,
  nullif(o->>'idCustom','')::char(7) as id_custom,
  o->>'namaDesain' as nama_desain,
  (o->>'kuantity')::int as kuantity,
  nullif(o->>'selesaiDesainProduksi','')::timestamptz,
  nullif(o->>'selesaiCuttingPola','')::timestamptz,
  nullif(o->>'selesaiStockBordir','')::timestamptz,
  nullif(o->>'selesaiBordir','')::timestamptz,
  nullif(o->>'selesaiSetting','')::timestamptz,
  nullif(o->>'selesaiStockJahit','')::timestamptz,
  nullif(o->>'selesaiJahit','')::timestamptz,
  nullif(o->>'selesaiFinishing','')::timestamptz,
  nullif(o->>'selesaiFotoProduk','')::timestamptz,
  nullif(o->>'selesaiPengiriman','')::timestamptz,
  now()
from flat3
on conflict (order_id) do update
  set id_transaksi = coalesce(excluded.id_transaksi, public.pipeline.id_transaksi),
      id_rekap_custom = coalesce(excluded.id_rekap_custom, public.pipeline.id_rekap_custom),
      id_custom = coalesce(excluded.id_custom, public.pipeline.id_custom),
      nama_desain = coalesce(excluded.nama_desain, public.pipeline.nama_desain),
      kuantity = coalesce(excluded.kuantity, public.pipeline.kuantity),
      selesai_desain_produksi = coalesce(excluded.selesai_desain_produksi, public.pipeline.selesai_desain_produksi),
      selesai_cutting_pola = coalesce(excluded.selesai_cutting_pola, public.pipeline.selesai_cutting_pola),
      selesai_stock_bordir = coalesce(excluded.selesai_stock_bordir, public.pipeline.selesai_stock_bordir),
      selesai_bordir = coalesce(excluded.selesai_bordir, public.pipeline.selesai_bordir),
      selesai_setting = coalesce(excluded.selesai_setting, public.pipeline.selesai_setting),
      selesai_stock_jahit = coalesce(excluded.selesai_stock_jahit, public.pipeline.selesai_stock_jahit),
      selesai_jahit = coalesce(excluded.selesai_jahit, public.pipeline.selesai_jahit),
      selesai_finishing = coalesce(excluded.selesai_finishing, public.pipeline.selesai_finishing),
      selesai_foto_produk = coalesce(excluded.selesai_foto_produk, public.pipeline.selesai_foto_produk),
      selesai_pengiriman = coalesce(excluded.selesai_pengiriman, public.pipeline.selesai_pengiriman);

commit;
