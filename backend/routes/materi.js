const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = 'uploads/dokumen_materi/';
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOAD_DIR); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|txt|png|jpg|jpeg|mp4/; // Tambahkan tipe file yang diizinkan
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: Tipe file tidak diizinkan!");
  }
}).single('dokumenFile');

// GET semua materi
router.get('/crud-materi', async (req, res) => {
  let conn = null;
  try {
    conn = await getConnection();
    // Tambahkan ISI_TEKS ke SELECT jika sudah ada kolomnya
    const result = await conn.execute(`SELECT ID, KELAS, NAMA_MATERI, LINK_YOUTUBE, TIPE_MATERI, LINK_DOKUMEN, ISI_TEKS FROM materi ORDER BY KELAS ASC, NAMA_MATERI ASC`);
    res.json(result.rows);
  } catch (err) { /* ... error handling ... */ }
  // ... finally ...
});

// POST tambah materi (dengan file upload dan input dinamis)
router.post('/crud-materi', (req, res) => {
  upload(req, res, async function (err) {
    if (err) { /* ... error handling multer ... */
        console.error("Multer/File upload error:", err);
        return res.status(400).json({ success: false, message: (err instanceof multer.MulterError) ? `Kesalahan upload file: ${err.message}` : err });
    }

    const { kelas, nama_materi, tipe_materi, link_youtube, isi_teks } = req.body; // Ambil semua field teks
    let conn = null;

    if (!kelas || !nama_materi || !tipe_materi) {
      return res.status(400).json({ success: false, message: 'Field Kelas, Nama Materi, dan Tipe Materi wajib diisi!' });
    }

    let linkDokumenPath = null;
    let finalLinkYoutube = link_youtube || null;
    let finalIsiTeks = isi_teks || null;

    if (tipe_materi === "Video" && !finalLinkYoutube) {
      return res.status(400).json({ success: false, message: 'Link Video Youtube wajib diisi untuk Tipe Materi Video!' });
    }
    if (tipe_materi === "Teks" && !finalIsiTeks) {
      // Jika Anda membuat ISI_TEKS wajib untuk tipe Teks
      // return res.status(400).json({ success: false, message: 'Isi Teks Materi wajib diisi untuk Tipe Materi Teks!' });
      // Untuk saat ini, biarkan opsional jika tidak ada input dari frontend, akan jadi NULL di DB
    }
    if (tipe_materi === "Dokumen") {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File Dokumen wajib diunggah untuk Tipe Materi Dokumen!' });
      }
      linkDokumenPath = req.file.path.replace(/\\/g, "/");
      finalLinkYoutube = null; // Biasanya dokumen tidak pakai link_youtube, tapi bisa disesuaikan
      finalIsiTeks = null;     // Dokumen tidak pakai isi_teks langsung
    }


    try {
      conn = await getConnection();
      const idResult = await conn.execute(`SELECT materi_seq.NEXTVAL AS id FROM dual`);
      const id = idResult.rows[0].ID;

      // Sesuaikan query INSERT dengan semua field yang mungkin
      await conn.execute(
        `INSERT INTO materi (id, kelas, nama_materi, link_youtube, tipe_materi, link_dokumen, isi_teks)
         VALUES (:id, :kelas, :nama_materi, :link_youtube_val, :tipe_materi, :link_dokumen_val, :isi_teks_val)`,
        {
          id,
          kelas,
          nama_materi,
          link_youtube_val: finalLinkYoutube,
          tipe_materi,
          link_dokumen_val: linkDokumenPath,
          isi_teks_val: finalIsiTeks
        },
        { autoCommit: true }
      );
      res.status(201).json({ success: true, message: 'Materi berhasil ditambahkan!' });
    } catch (dbErr) { /* ... error handling DB & hapus file jika gagal ... */
        console.error("POST /crud-materi DB error:", dbErr.message);
        if (linkDokumenPath && fs.existsSync(linkDokumenPath)) {
            try { fs.unlinkSync(linkDokumenPath); console.log("Uploaded file deleted due to DB error:", linkDokumenPath); }
            catch (unlinkErr) { console.error("Error deleting uploaded file after DB error:", unlinkErr); }
        }
        res.status(500).json({ success: false, message: 'Gagal menambah materi ke database', error: dbErr.message });
    } finally {
      if (conn) try { await conn.close(); } catch(e) { /* ... */ }
    }
  });
});

// DELETE materi (pastikan juga menghapus ISI_TEKS jika perlu)
router.delete('/crud-materi/:id', async (req, res) => {
  // ... (logika delete yang sudah ada, termasuk menghapus file dari LINK_DOKUMEN) ...
  let conn = null;
  try {
    conn = await getConnection();
    const materiResult = await conn.execute(
        `SELECT LINK_DOKUMEN FROM materi WHERE id = :id`,
        { id: req.params.id }
    );

    const result = await conn.execute(
      `DELETE FROM materi WHERE id = :id`,
      { id: req.params.id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
        return res.status(404).json({ success: false, message: 'Materi tidak ditemukan untuk dihapus.' });
    }

    if (materiResult.rows.length > 0 && materiResult.rows[0].LINK_DOKUMEN) {
        const filePath = materiResult.rows[0].LINK_DOKUMEN;
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); console.log("Associated file deleted:", filePath); }
            catch (unlinkErr) { console.error("Error deleting file from server:", unlinkErr); }
        }
    }
    res.json({ success: true, message: 'Materi berhasil dihapus!' });
  } catch (err) { /* ... error handling ... */ }
  // ... finally ...
});

module.exports = router;