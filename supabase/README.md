   select url from public.product_media pm where pm.product_id = pc.id order by pm.created_at asc limit 1
) pm on true
   name text primary key,
   last_value bigint not null default 0
# Archived schema (not used)

This folder previously contained a relational schema used during an earlier iteration. It's no longer used by the app after the VPS migration.

You can safely delete this folder. Kept temporarily for reference only.
