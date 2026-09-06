
const express = require('express');
const router = express.Router();
const { getConnection } = require('../db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR_RELATIVE_FROM_ROOT = 'uploads/dokumen_materi/';
const UPLOAD_DIR_ABSOLUTE = path.resolve(__dirname, '..', '..', UPLOAD_DIR_RELATIVE_FROM_ROOT); 

if (!fs.existsSync(UPLOAD_DIR_ABSOLUTE)){
    fs.mkdirSync(UPLOAD_DIR_ABSOLUTE, { recursive: true });
    console.log(`[materi.js] Upload directory created: ${UPLOAD_DIR_ABSOLUTE}`);
} else {
    console.log(`[materi.js] Upload directory already exists: ${UPLOAD_DIR_ABSOLUTE}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR_ABSOLUTE); 
  },
  filename: function (req, file, cb) { 
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|txt|png|jpg|jpeg|gif|webp|mp4|mov|avi|zip|rar/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    console.warn(`[materi.js] File type not allowed: ${file.originalname} (mimetype: ${file.mimetype}, ext: ${path.extname(file.originalname)})`);
    cb(new Error("Error: Tipe file tidak diizinkan! (" + path.extname(file.originalname).toLowerCase() + ")"));
  },
  limits: { fileSize: 100 * 1024 * 1024 } 
}).single('dokumenFile');

router.get('/crud-materi', async (req, res) => {
  let conn = null;
  console.log("[materi.js] Attempting to GET /crud-materi");
  try {
    conn = await getConnection();
    console.log("[materi.js] DB connection acquired for GET /crud-materi");
    const result = await conn.execute(
      `SELECT ID, KELAS, NAMA_MATERI, LINK_YOUTUBE, TIPE_MATERI, LINK_DOKUMEN, ISI_TEKS, ORDER_INDEX 
       FROM MATERI 
       ORDER BY KELAS ASC, NAMA_MATERI ASC, ORDER_INDEX ASC`
    );
    console.log(`[materi.js] Successfully fetched ${result.rows.length} materi.`);
    
    res.json(result.rows.map(row => ({
        ID: row.ID,
        KELAS: row.KELAS,
        NAMA_MATERI: row.NAMA_MATERI,
        LINK_YOUTUBE: row.LINK_YOUTUBE,
        TIPE_MATERI: row.TIPE_MATERI,
        LINK_DOKUMEN: row.LINK_DOKUMEN,
        ISI_TEKS: row.ISI_TEKS,
        ORDER_INDEX: row.ORDER_INDEX,
        DESKRIPSI: null, 
        DURASI: null,
        RATING: null,
        LINK_GAMBAR: null
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

router.post('/crud-materi', (req, res) => {
  upload(req, res, async function (multerErr) {
    if (multerErr) {
      console.error("[materi.js] Multer/File upload error:", multerErr.message || multerErr);
      if (multerErr instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Kesalahan upload file: ${multerErr.code}` });
      }
      return res.status(400).json({ success: false, message: multerErr.message || "Terjadi kesalahan saat mengunggah file." });
    }

    const { kelas, nama_materi, tipe_materi, link_youtube, isi_teks, order_index } = req.body;
    let conn = null;

    console.log("[materi.js] Attempting to POST /crud-materi with body:", req.body);
    if(req.file) console.log("[materi.js] File received:", req.file.filename, "saved to:", req.file.path);


    if (!kelas || !nama_materi || !tipe_materi) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); console.log(`[materi.js] Deleted uploaded file ${req.file.filename} due to validation error.`); } 
        catch (e) { console.error("[materi.js] Error deleting file after validation error:", e); }
      }
      return res.status(400).json({ success: false, message: 'Field Kelas, Nama Materi, dan Tipe Materi wajib diisi!' });
    }

    let linkDokumenPathDb = null; 
    let finalLinkYoutube = link_youtube || null;
    let finalIsiTeks = isi_teks || null;

    if (tipe_materi === "Video") {
        if (!finalLinkYoutube) {
          if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { console.error("[materi.js] Error deleting file after validation error (Video type):", e); }
          }
          return res.status(400).json({ success: false, message: 'Link Video Youtube wajib diisi untuk Tipe Materi Video!' });
        }
    }
    
    if (tipe_materi === "Dokumen") {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File Dokumen wajib diunggah untuk Tipe Materi Dokumen!' });
      }
      linkDokumenPathDb = path.join(path.basename(UPLOAD_DIR_RELATIVE_FROM_ROOT), req.file.filename).replace(/\\/g, "/");
      
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
      const idResult = await conn.execute(`SELECT MATERI_SEQ.NEXTVAL AS ID FROM DUAL`);
      const id = idResult.rows[0].ID;
      console.log(`[materi.js] Generated new materi ID: ${id}`);

      const sql = `INSERT INTO MATERI (ID, KELAS, NAMA_MATERI, LINK_YOUTUBE, TIPE_MATERI, LINK_DOKUMEN, ISI_TEKS, ORDER_INDEX)
                   VALUES (:id, :kelas, :nama_materi, :link_youtube_val, :tipe_materi, :link_dokumen_val, :isi_teks_val, :order_index_val)`;
      
      const orderIndexVal = (order_index !== undefined && order_index !== null && order_index.trim() !== '') ? parseInt(order_index) : null;

      await conn.execute(sql, {
          id,
          kelas,
          nama_materi,
          link_youtube_val: finalLinkYoutube,
          tipe_materi,
          link_dokumen_val: linkDokumenPathDb, 
          isi_teks_val: finalIsiTeks,
          order_index_val: orderIndexVal 
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
      res.status(500).json({ success: false, message: 'Gagal menambah materi ke database.', error: dbErr.message });
    } finally {
      if (conn) try { 
          console.log("[materi.js] Closing DB connection for POST /crud-materi");
          await conn.close(); 
      } catch(e) { console.error('[materi.js] Error closing connection:', e.message); }
    }
  });
});

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
      const relativePathInDb = materiResult.rows[0].LINK_DOKUMEN; 
      const filePathToDelete = path.resolve(__dirname, '..', '..', 'uploads', relativePathInDb);
      
      console.log(`[materi.js] Attempting to delete file: ${filePathToDelete} (from DB value: ${relativePathInDb})`);
      if (fs.existsSync(filePathToDelete)) {
        try {
          fs.unlinkSync(filePathToDelete);
          console.log(`[materi.js] File ${filePathToDelete} berhasil dihapus.`);
        }
        catch (unlinkErr) {
          console.error(`[materi.js] Error deleting file ${filePathToDelete} from server:`, unlinkErr.message);
        }
      } else {
         console.warn(`[materi.js] File ${filePathToDelete} (dari LINK_DOKUMEN: ${relativePathInDb}) tidak ditemukan di server untuk dihapus.`);
      }
    }
    res.json({ success: true, message: 'Materi berhasil dihapus!' });
  } catch (err) {
    console.error(`[materi.js] DELETE /crud-materi/${numericId} error:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal menghapus materi.', error: err.message });
  } finally {
    if (conn) try { 
        console.log("[materi.js] Closing DB connection for DELETE /crud-materi");
        await conn.close(); 
    } catch(e) { console.error('[materi.js] Error closing connection:', e.message); }
  }
});

module.exports = router;