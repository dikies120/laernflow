const UsersModel = require('../models/UsersModel');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

class UsersController {
  static async getSiswa(req, res) {
    try {
      const rows = await UsersModel.getSiswaWithAverageScore();
      res.json({
        success: true,
        users: rows.map(row => ({
          id: row.USER_ID,
          username: row.USERNAME,
          email: row.EMAIL,
          kelas: row.KELAS,
          nama_lengkap: row.NAMA_LENGKAP,
          foto_profil: row.FOTO_PROFIL,
          tanggal_daftar: row.CREATED_DATE,
          average_score: row.AVERAGE_SCORE
        }))
      });
    } catch (err) {
      console.error('[usersController.js] Fetch users error:', err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.', error: err.message });
    }
  }

  static async getProfile(req, res) {
    const { userId } = req.params; 
    const numericUserId = parseInt(userId);
    if (!userId || isNaN(numericUserId)) {
        return res.status(400).json({ success: false, message: "User ID tidak valid." });
    }

    try {
      const userDb = await UsersModel.getUserProfile(numericUserId);
      if (!userDb) {
          return res.status(404).json({ success: false, message: "User tidak ditemukan." });
      }
      res.json({
          success: true,
          user: { 
              ID_USER: userDb.USER_ID, USERNAME: userDb.USERNAME, EMAIL: userDb.EMAIL,
              KELAS: userDb.KELAS, NAMA_LENGKAP: userDb.NAMA_LENGKAP || "",
              TANGGAL_LAHIR: userDb.TANGGAL_LAHIR || "", ALAMAT: userDb.ALAMAT || "",
              NO_TELEPON: userDb.NO_TELEPON || "", FOTO_PROFIL: userDb.FOTO_PROFIL || ""
          }
      });
    } catch (err) {
      console.error(`[usersController.js] Error GET profile for user ${numericUserId}:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil profil pengguna.', error: err.message });
    }
  }

  static async updateProfile(req, res) {
    const { userId } = req.params; 
    const numericUserId = parseInt(userId);
    const { USERNAME, EMAIL, KELAS, NAMA_LENGKAP, TANGGAL_LAHIR, ALAMAT, NO_TELEPON } = req.body;
    let fotoProfilDiRequestBody = req.body.FOTO_PROFIL; 

    if (!userId || isNaN(numericUserId)) {
        if (req.file) fs.unlink(req.file.path, (err) => {});
        return res.status(400).json({ success: false, message: "User ID tidak valid." });
    }
    if (!USERNAME || !EMAIL) {
        if (req.file) fs.unlink(req.file.path, (err) => {}); 
        return res.status(400).json({ success: false, message: "Username dan Email wajib diisi." });
    }

    let urlFotoUntukDb = fotoProfilDiRequestBody;
    if (req.file) {
        urlFotoUntukDb = `/uploads/${req.file.filename}`;
    } else if (fotoProfilDiRequestBody === '' || fotoProfilDiRequestBody === null || typeof fotoProfilDiRequestBody === 'undefined') {
        urlFotoUntukDb = null;
    }

    try {
      const data = {
        USERNAME, EMAIL, KELAS, NAMA_LENGKAP, TANGGAL_LAHIR, ALAMAT, NO_TELEPON, urlFotoUntukDb,
        checkOldPhoto: (req.file || (urlFotoUntukDb === null && fotoProfilDiRequestBody !== null && typeof fotoProfilDiRequestBody !== 'undefined' && fotoProfilDiRequestBody !== ''))
      };

      const result = await UsersModel.updateUserProfile(numericUserId, data);

      if (!result.success) {
        if (req.file) fs.unlink(req.file.path, (err) => {}); 
        return res.status(404).json({ success: false, message: "User tidak ditemukan atau tidak ada data yang berubah." });
      }

      if (result.pathFotoProfilLamaDiFs) {
          const oldFileFullPath = path.join(UPLOADS_DIR, path.basename(result.pathFotoProfilLamaDiFs));
          const isNewFileDifferentFromOld = req.file ? oldFileFullPath !== path.join(UPLOADS_DIR, req.file.filename) : true;
          if (isNewFileDifferentFromOld && fs.existsSync(oldFileFullPath)) { 
              fs.unlink(oldFileFullPath, err => { });
          }
      }

      const feUser = result.feUser ? {
          ID_USER: result.feUser.USER_ID, USERNAME: result.feUser.USERNAME,
          EMAIL: result.feUser.EMAIL, KELAS: result.feUser.KELAS,
          NAMA_LENGKAP: result.feUser.NAMA_LENGKAP, TANGGAL_LAHIR: result.feUser.TANGGAL_LAHIR,
          ALAMAT: result.feUser.ALAMAT, NO_TELEPON: result.feUser.NO_TELEPON,
          FOTO_PROFIL: result.feUser.FOTO_PROFIL
      } : null;

      res.json({ success: true, message: "Profil berhasil diperbarui.", user: feUser });

    } catch (err) {
      console.error(`[usersController.js] Error PUT profile for user ${numericUserId}:`, err.message, err.stack);
      if (req.file && fs.existsSync(req.file.path)) {
           fs.unlink(req.file.path, (unlinkErr) => {});
      }
      res.status(500).json({ success: false, message: 'Gagal memperbarui profil karena kesalahan server.', error: err.message });
    }
  }

  static async completeMaterial(req, res) {
    const { userId, materiId } = req.params; 
    const numericUserId = parseInt(userId);
    const numericMateriId = parseInt(materiId);
    if (!userId || isNaN(numericUserId) || !materiId || isNaN(numericMateriId)) {
      return res.status(400).json({ success: false, message: "User ID atau Materi ID tidak valid." });
    }

    try {
      await UsersModel.completeMaterial(numericUserId, numericMateriId);
      res.json({ success: true, message: 'Materi berhasil ditandai sebagai selesai.' });
    } catch (err) {
      console.error(`[usersController.js] API /complete DB Error for user ${numericUserId}:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal menandai materi selesai.', error: err.message });
    }
  }

  static async getDashboardStats(req, res) {
    const { userId } = req.params; 
    const numericUserId = parseInt(userId);
    if (!userId || isNaN(numericUserId)) {
      return res.status(400).json({ success: false, message: "User ID tidak valid." });
    }

    try {
      const stats = await UsersModel.getDashboardStats(numericUserId);
      res.json({ success: true, stats });
    } catch (err) {
      console.error(`[usersController.js] Error stats for user ${numericUserId}:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard.', error: err.message });
    }
  }

  static async deleteUser(req, res) {
    const { userId } = req.params; 
    const numericUserId = parseInt(userId);
    if (!userId || isNaN(numericUserId)) {
        return res.status(400).json({ success: false, message: "User ID tidak valid." });
    }

    try {
      const result = await UsersModel.deleteUser(numericUserId);
      
      if (!result.success) {
          return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }
      
      if (result.fotoProfilDb) {
          const fotoProfilPath = path.join(UPLOADS_DIR, path.basename(result.fotoProfilDb)); 
          if (fs.existsSync(fotoProfilPath)) { 
              fs.unlink(fotoProfilPath, (err) => {});
          }
      }
      res.json({ success: true, message: 'User berhasil dihapus.' });
    } catch (err) {
      console.error(`[usersController.js] Error deleting user ${numericUserId}:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal menghapus user.', error: err.message });
    }
  }

  static async getMaterialProgress(req, res) {
    const { userId } = req.params; 
    const numericUserId = parseInt(userId);
    if (!userId || isNaN(numericUserId)) {
      return res.status(400).json({ success: false, message: "User ID tidak valid." });
    }

    try {
      const rows = await UsersModel.getMaterialProgress(numericUserId);
      res.json({
        success: true,
        progress: rows.map(row => ({
          materiId: row.MATERI_ID,
          namaMateri: row.NAMA_MATERI,
          kelasMateri: row.MATERI_KELAS,
          tipeMateri: row.TIPE_MATERI,
          status: row.STATUS,
          lastAccessedAt: row.LAST_ACCESSED_AT,
          completedAt: row.COMPLETED_AT
        }))
      });
    } catch (err) {
      console.error(`[usersController.js] Error material progress for user ${numericUserId}:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil progres materi pengguna.', error: err.message });
    }
  }
}

module.exports = UsersController;
