const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');

// GET semua materi (untuk user & admin)
router.get('/crud-materi', async (req, res) => {
  let conn = null;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM materi ORDER BY id DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil materi', error: err.message });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

// POST tambah materi (khusus admin)
router.post('/crud-materi', async (req, res) => {
  const { kelas, nama_materi, link_youtube } = req.body;
  let conn = null;
  if (!kelas || !nama_materi || !link_youtube) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi!' });
  }
  try {
    conn = await getConnection();
    const idResult = await conn.execute(`SELECT materi_seq.NEXTVAL AS id FROM dual`);
    const id = idResult.rows[0].ID;
    await conn.execute(
      `INSERT INTO materi (id, kelas, nama_materi, link_youtube) VALUES (:id, :kelas, :nama_materi, :link_youtube)`,
      { id, kelas, nama_materi, link_youtube },
      { autoCommit: true }
    );
    res.status(201).json({ success: true, message: 'Materi berhasil ditambahkan!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menambah materi', error: err.message });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

// DELETE materi (khusus admin)
router.delete('/crud-materi/:id', async (req, res) => {
  let conn = null;
  try {
    conn = await getConnection();
    await conn.execute(
      `DELETE FROM materi WHERE id = :id`,
      { id: req.params.id },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Materi berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus materi', error: err.message });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;