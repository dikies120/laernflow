const MateriModel = require('../models/MateriModel');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR_RELATIVE_FROM_ROOT = 'uploads/dokumen_materi/';

class MateriController {
  static async getAllMateri(req, res) {
    console.log("[materiController.js] Attempting to GET /crud-materi");
    try {
      const rows = await MateriModel.getAllMateri();
      console.log(`[materiController.js] Successfully fetched ${rows.length} materi.`);
      
      res.json(rows.map(row => ({
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
      console.error("[materiController.js] GET /crud-materi error:", err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil data materi', error: err.message });
    }
  }

  static async createMateri(req, res) {
    const { kelas, nama_materi, tipe_materi, link_youtube, isi_teks, order_index } = req.body;

    console.log("[materiController.js] Attempting to POST /crud-materi with body:", req.body);
    if(req.file) console.log("[materiController.js] File received:", req.file.filename, "saved to:", req.file.path);

    if (!kelas || !nama_materi || !tipe_materi) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); console.log(`[materiController.js] Deleted uploaded file ${req.file.filename} due to validation error.`); } 
        catch (e) { console.error("[materiController.js] Error deleting file after validation error:", e); }
      }
      return res.status(400).json({ success: false, message: 'Field Kelas, Nama Materi, dan Tipe Materi wajib diisi!' });
    }

    let linkDokumenPathDb = null; 
    let finalLinkYoutube = link_youtube || null;
    let finalIsiTeks = isi_teks || null;

    if (tipe_materi === "Video") {
        if (!finalLinkYoutube) {
          if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { console.error("[materiController.js] Error deleting file after validation error (Video type):", e); }
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
          console.warn(`[materiController.js] File ${req.file.filename} terupload untuk tipe materi ${tipe_materi} (non-Dokumen), file akan dihapus.`);
          try { fs.unlinkSync(req.file.path); } catch (e) { console.error("[materiController.js] Error deleting unnecessary uploaded file:", e); }
      }
    }

    try {
      const data = {
        kelas,
        nama_materi,
        link_youtube_val: finalLinkYoutube,
        tipe_materi,
        link_dokumen_val: linkDokumenPathDb, 
        isi_teks_val: finalIsiTeks,
        order_index
      };

      const id = await MateriModel.createMateri(data);

      console.log(`[materiController.js] Materi ID ${id} successfully added to database.`);
      res.status(201).json({ success: true, message: 'Materi berhasil ditambahkan!', materiId: id });
    } catch (dbErr) {
      console.error("[materiController.js] POST /crud-materi DB error:", dbErr.message, dbErr.stack);
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); console.log(`[materiController.js] Deleted uploaded file ${req.file.filename} after DB error.`); }
        catch (unlinkErr) { console.error("[materiController.js] Error deleting uploaded file after DB error:", unlinkErr); }
      }
      res.status(500).json({ success: false, message: 'Gagal menambah materi ke database.', error: dbErr.message });
    }
  }

  static async deleteMateri(req, res) {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: "ID Materi tidak valid."});
    }
    const numericId = parseInt(id);
    console.log(`[materiController.js] Attempting to DELETE /crud-materi/${numericId}`);

    try {
      const materiData = await MateriModel.getMateriById(numericId);
      const deleted = await MateriModel.deleteMateri(numericId);

      if (!deleted) {
        console.log(`[materiController.js] Materi ID ${numericId} not found for deletion.`);
        return res.status(404).json({ success: false, message: 'Materi tidak ditemukan untuk dihapus.' });
      }
      console.log(`[materiController.js] Materi ID ${numericId} successfully deleted from database.`);

      if (materiData && materiData.LINK_DOKUMEN) {
        const relativePathInDb = materiData.LINK_DOKUMEN; 
        const filePathToDelete = path.resolve(__dirname, '..', '..', 'uploads', relativePathInDb);
        
        console.log(`[materiController.js] Attempting to delete file: ${filePathToDelete} (from DB value: ${relativePathInDb})`);
        if (fs.existsSync(filePathToDelete)) {
          try {
            fs.unlinkSync(filePathToDelete);
            console.log(`[materiController.js] File ${filePathToDelete} berhasil dihapus.`);
          }
          catch (unlinkErr) {
            console.error(`[materiController.js] Error deleting file ${filePathToDelete} from server:`, unlinkErr.message);
          }
        } else {
           console.warn(`[materiController.js] File ${filePathToDelete} (dari LINK_DOKUMEN: ${relativePathInDb}) tidak ditemukan di server untuk dihapus.`);
        }
      }
      res.json({ success: true, message: 'Materi berhasil dihapus!' });
    } catch (err) {
      console.error(`[materiController.js] DELETE /crud-materi/${numericId} error:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal menghapus materi.', error: err.message });
    }
  }
}

module.exports = MateriController;
