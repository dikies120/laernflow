// backend/routes/materi.js
const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = 'uploads/dokumen_materi/'; // Pastikan path ini benar relatif terhadap root project Anda
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`[materi.js] Upload directory created: ${path.resolve(UPLOAD_DIR)}`);
} else {
    console.log(`[materi.js] Upload directory already exists: ${path.resolve(UPLOAD_DIR)}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOAD_DIR); },
  filename: function (req, file, cb) { 
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|txt|png|jpg|jpeg|mp4|zip|rar/; // Tambahkan tipe file yang diizinkan
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    console.warn(`[materi.js] File type not allowed: ${file.originalname} (mimetype: ${file.mimetype}, ext: ${path.extname(file.originalname)})`);
    cb(new Error("Error: Tipe file tidak diizinkan!"));
  },
  limits: { fileSize: 100 * 1024 * 1024 } // Batas ukuran file 100MB (opsional)
}).single('dokumenFile'); // Nama field di form frontend harus 'dokumenFile'

// GET semua materi
router.get('/crud-materi', async (req, res) => {
  let conn = null;
  console.log("[materi.js] Attempting to GET /crud-materi");
  try {
    conn = await getConnection();
    console.log("[materi.js] DB connection acquired for GET /crud-materi");
    // Query ini hanya mengambil kolom dasar. Jika frontend butuh lebih, query ini atau tabel MATERI perlu disesuaikan.
    const result = await conn.execute(
      `SELECT ID, KELAS, NAMA_MATERI, LINK_YOUTUBE, TIPE_MATERI, LINK_DOKUMEN, ISI_TEKS 
       FROM MATERI 
       ORDER BY KELAS ASC, NAMA_MATERI ASC` // Pastikan nama tabel MATERI benar
    );
    console.log(`[materi.js] Successfully fetched ${result.rows.length} materi.`);
    // Frontend akan mengharapkan field seperti DESKRIPSI, DURASI, RATING, LINK_GAMBAR.
    // Karena query ini tidak mengambilnya, frontend perlu menangani kasus di mana field tersebut null/undefined.
    res.json(result.rows.map(row => ({
        ID: row.ID,
        KELAS: row.KELAS,
        NAMA_MATERI: row.NAMA_MATERI,
        LINK_YOUTUBE: row.LINK_YOUTUBE,
        TIPE_MATERI: row.TIPE_MATERI,
        LINK_DOKUMEN: row.LINK_DOKUMEN, // Ini akan menjadi path relatif dari UPLOAD_DIR
        ISI_TEKS: row.ISI_TEKS,
        // Berikan nilai default jika frontend mengharapkannya dan tidak ada di SELECT
        DESKRIPSI: row.DESKRIPSI || null, 
        DURASI: row.DURASI || null,
        RATING: row.RATING || null,
        LINK_GAMBAR: row.LINK_GAMBAR || null
    })));
  } catch (err) {
    console.error("[materi.js] GET /crud-materi error:", err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal mengambil data materi', error: err.message });
  } finally {
    if (conn) try { 
        console.log("[materi.js] Closing DB connection for GET /crud-materi");
        await conn.close(); 
    } catch(e) { console.error('[materi.js] Error closing connection:', e.message); }
  }
});

// POST tambah materi (dengan file upload dan input dinamis)
router.post('/crud-materi', (req, res) => {
  upload(req, res, async function (multerErr) {
    if (multerErr) {
      console.error("[materi.js] Multer/File upload error:", multerErr.message || multerErr);
      if (multerErr instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Kesalahan upload file: ${multerErr.code}` });
      }
      return res.status(400).json({ success: false, message: multerErr.message || "Terjadi kesalahan saat mengunggah file." });
    }

    // Ambil semua field dari body, termasuk yang baru jika ada di form frontend
    const { kelas, nama_materi, tipe_materi, link_youtube, isi_teks, deskripsi, durasi, rating, link_gambar } = req.body;
    let conn = null;

    console.log("[materi.js] Attempting to POST /crud-materi with body:", req.body);
    if(req.file) console.log("[materi.js] File received:", req.file.filename);


    if (!kelas || !nama_materi || !tipe_materi) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); console.log(`[materi.js] Deleted uploaded file ${req.file.filename} due to validation error.`); } 
        catch (e) { console.error("[materi.js] Error deleting file after validation error:", e); }
      }
      return res.status(400).json({ success: false, message: 'Field Kelas, Nama Materi, dan Tipe Materi wajib diisi!' });
    }

    let linkDokumenPath = null;
    let finalLinkYoutube = link_youtube || null;
    let finalIsiTeks = isi_teks || null;
    let finalLinkGambar = link_gambar || null;

    if (tipe_materi === "Video" && !finalLinkYoutube) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) { console.error("[materi.js] Error deleting file after validation error (Video type):", e); }
      }
      return res.status(400).json({ success: false, message: 'Link Video Youtube wajib diisi untuk Tipe Materi Video!' });
    }
    
    if (tipe_materi === "Dokumen") {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File Dokumen wajib diunggah untuk Tipe Materi Dokumen!' });
      }
      linkDokumenPath = path.join(UPLOAD_DIR, req.file.filename).replace(/\\/g, "/");
      linkDokumenPath = req.file.path.replace(/\\/g, "/");


      finalLinkYoutube = null;
      finalIsiTeks = null;
    } else {
      if (req.file && fs.existsSync(req.file.path)) {
          console.warn(`[materi.js] File ${req.file.filename} terupload untuk tipe materi ${tipe_materi} (non-Dokumen), file akan dihapus.`);
          try { fs.unlinkSync(req.file.path); } catch (e) { console.error("[materi.js] Error deleting unnecessary uploaded file:", e); }
      }
    }

    try {
      conn = await getConnection();
      console.log("[materi.js] DB connection acquired for POST /crud-materi");
      const idResult = await conn.execute(`SELECT MATERI_SEQ.NEXTVAL AS ID FROM DUAL`); // Pastikan MATERI_SEQ ada
      const id = idResult.rows[0].ID;
      console.log(`[materi.js] Generated new materi ID: ${id}`);

      // Sesuaikan query INSERT untuk memasukkan semua kolom yang ada di tabel MATERI Anda
      // Termasuk DESKRIPSI, DURASI, RATING, LINK_GAMBAR jika sudah Anda tambahkan ke tabel MATERI
      const sql = `INSERT INTO MATERI (ID, KELAS, NAMA_MATERI, LINK_YOUTUBE, TIPE_MATERI, LINK_DOKUMEN, ISI_TEKS, DESKRIPSI, DURASI, RATING, LINK_GAMBAR)
                   VALUES (:id, :kelas, :nama_materi, :link_youtube_val, :tipe_materi, :link_dokumen_val, :isi_teks_val, :deskripsi, :durasi, :rating, :link_gambar_val)`;
      
      await conn.execute(sql, {
          id,
          kelas,
          nama_materi,
          link_youtube_val: finalLinkYoutube,
          tipe_materi,
          link_dokumen_val: linkDokumenPath,
          isi_teks_val: finalIsiTeks,
          deskripsi: deskripsi || null, // Tambahkan jika ada di form & tabel
          durasi: durasi || null,       // Tambahkan jika ada di form & tabel
          rating: rating || null,       // Tambahkan jika ada di form & tabel
          link_gambar_val: finalLinkGambar // Tambahkan jika ada di form & tabel
        },
        { autoCommit: true }
      );
      console.log(`[materi.js] Materi ID ${id} successfully added to database.`);
      res.status(201).json({ success: true, message: 'Materi berhasil ditambahkan!', materiId: id });
    } catch (dbErr) {
      console.error("[materi.js] POST /crud-materi DB error:", dbErr.message, dbErr.stack);
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); console.log(`[materi.js] Deleted uploaded file ${req.file.filename} after DB error.`); }
        catch (unlinkErr) { console.error("[materi.js] Error deleting uploaded file after DB error:", unlinkErr); }
      }
      res.status(500).json({ success: false, message: 'Gagal menambah materi ke database', error: dbErr.message });
    } finally {
      if (conn) try { 
          console.log("[materi.js] Closing DB connection for POST /crud-materi");
          await conn.close(); 
      } catch(e) { console.error('[materi.js] Error closing connection:', e.message); }
    }
  });
});

// DELETE materi (hapus file jika ada)
router.delete('/crud-materi/:id', async (req, res) => {
  let conn = null;
  const { id } = req.params;

  if (isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: "ID Materi tidak valid."});
  }
  const numericId = parseInt(id);
  console.log(`[materi.js] Attempting to DELETE /crud-materi/${numericId}`);

  try {
    conn = await getConnection();
    console.log("[materi.js] DB connection acquired for DELETE /crud-materi");
    const materiResult = await conn.execute(
      `SELECT LINK_DOKUMEN FROM MATERI WHERE ID = :id`,
      { id: numericId }
    );

    const result = await conn.execute(
      `DELETE FROM MATERI WHERE ID = :id`,
      { id: numericId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      console.log(`[materi.js] Materi ID ${numericId} not found for deletion.`);
      return res.status(404).json({ success: false, message: 'Materi tidak ditemukan untuk dihapus.' });
    }
    console.log(`[materi.js] Materi ID ${numericId} successfully deleted from database.`);

    if (materiResult.rows.length > 0 && materiResult.rows[0].LINK_DOKUMEN) {
      // LINK_DOKUMEN disimpan sebagai path relatif dari root project, misal 'uploads/dokumen_materi/file.pdf'
      const filePathToDelete = path.resolve(materiResult.rows[0].LINK_DOKUMEN);
      if (fs.existsSync(filePathToDelete)) {
        try {
          fs.unlinkSync(filePathToDelete);
          console.log(`[materi.js] File ${filePathToDelete} berhasil dihapus.`);
        }
        catch (unlinkErr) {
          console.error("[materi.js] Error deleting file from server:", unlinkErr.message);
        }
      } else {
         console.warn(`[materi.js] File ${filePathToDelete} (dari LINK_DOKUMEN: ${materiResult.rows[0].LINK_DOKUMEN}) tidak ditemukan di server untuk dihapus.`);
      }
    }
    res.json({ success: true, message: 'Materi berhasil dihapus!' });
  } catch (err) {
    console.error(`[materi.js] DELETE /crud-materi/${numericId} error:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal menghapus materi', error: err.message });
  } finally {
    if (conn) try { 
        console.log("[materi.js] Closing DB connection for DELETE /crud-materi");
        await conn.close(); 
    } catch(e) { console.error('[materi.js] Error closing connection:', e.message); }
  }
});

module.exports = router;
