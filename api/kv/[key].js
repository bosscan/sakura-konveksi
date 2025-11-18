const { query } = require('../_db');

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch { return text; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = (req.query && req.query.key) || (req.url || '').split('/').pop();
  if (!key) return res.status(400).json({ error: 'Missing key' });

  try {
    if (req.method === 'GET') {
      const rows = await query('SELECT `value` FROM kv_store WHERE `key`=? LIMIT 1', [key]);
      if (!rows || rows.length === 0) return res.status(200).json({ value: null });
      const raw = rows[0].value;
      const value = typeof raw === 'string' ? tryParseJSON(raw) : raw;
      return res.status(200).json({ value });
    }

    if (req.method === 'PUT') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const payload = body ? JSON.parse(body) : {};
      const value = payload?.value ?? null;
      const stored = JSON.stringify(value);

      await query('INSERT INTO kv_store(`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`), updated_at=CURRENT_TIMESTAMP', [key, stored]);

      // Side-effects: mirror to relational tables for specific keys
      if (key === 'penjahit_map' && value && typeof value === 'object') {
        const entries = Object.entries(value);
        for (const [idSpk, nama] of entries) {
          await query(
            'INSERT INTO penjahit_assignments(order_id, penjahit_name, updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE penjahit_name=VALUES(penjahit_name), updated_at=CURRENT_TIMESTAMP',
            [String(idSpk).padStart(7, '0').slice(0,7), nama || null]
          );
        }
      }

      if (key === 'design_queue' && Array.isArray(value)) {
        for (const it of value) {
          const orderId = (it?.idSpk || '').toString().padStart(7, '0').slice(0,7) || null;
          const idRekapCustom = it?.idRekapCustom || it?.idRekap || null;
          const idCustom = it?.idCustom || null;
          const namaDesain = it?.namaDesain || null;
          const jenisProduk = it?.jenisProduk || null;
          const jenisPola = it?.jenisPola || null;
          const tanggalInput = it?.tanggalInput ? new Date(it.tanggalInput) : null;
          const namaCS = it?.namaCS || null;
          const assetLink = it?.assetLink || null;
          const catatan = it?.catatan || null;
          const assets = it?.assets ? JSON.stringify(it.assets) : null;
          const status = it?.status || null;

          if (idCustom) {
            await query(
              'INSERT INTO design_queue(id, order_id, id_rekap_custom, id_custom, nama_desain, jenis_produk, jenis_pola, tanggal_input, nama_cs, asset_link, catatan, assets, status, created_at) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE order_id=VALUES(order_id), id_rekap_custom=VALUES(id_rekap_custom), nama_desain=VALUES(nama_desain), jenis_produk=VALUES(jenis_produk), jenis_pola=VALUES(jenis_pola), tanggal_input=VALUES(tanggal_input), nama_cs=VALUES(nama_cs), asset_link=VALUES(asset_link), catatan=VALUES(catatan), assets=VALUES(assets), status=VALUES(status)',
              [orderId, idRekapCustom, idCustom, namaDesain, jenisProduk, jenisPola, tanggalInput ? tanggalInput.toISOString().slice(0,10) : null, namaCS, assetLink, catatan, assets, status]
            );
          } else if (orderId) {
            // If no id_custom, upsert by generating a stable placeholder unique per order+rekap
            // We'll attempt an insert; duplicates will create another row which is acceptable for history
            await query(
              'INSERT INTO design_queue(id, order_id, id_rekap_custom, id_custom, nama_desain, jenis_produk, jenis_pola, tanggal_input, nama_cs, asset_link, catatan, assets, status, created_at) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)',
              [orderId, idRekapCustom, null, namaDesain, jenisProduk, jenisPola, tanggalInput ? tanggalInput.toISOString().slice(0,10) : null, namaCS, assetLink, catatan, assets, status]
            );
          }
        }
      }

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM kv_store WHERE `key`=?', [key]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('kv handler error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
