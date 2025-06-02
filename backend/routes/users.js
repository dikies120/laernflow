// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { getConnection } = require('../db'); // Pastikan path ke db.js sudah benar
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tentukan direktori untuk menyimpan file yang diunggah
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Pastikan direktori uploads ada
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`[users.js] Direktori ${UPLOADS_DIR} berhasil dibuat.`);
  } catch (err) {
    console.error(`[users.js] Gagal membuat direktori ${UPLOADS_DIR}:`, err);
  }
} else {
  console.log(`[users.js] Direktori ${UPLOADS_DIR} sudah ada.`);
}

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan! (png, jpg, jpeg, gif)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET all users (Siswa) with their average quiz score
router.get('/siswa', async (req, res) => {
  let conn = null;
  try {
    conn = await getConnection();
    console.log('[API /siswa] Attempting to fetch users with average scores.');
    const result = await conn.execute(
      `SELECT
           u.USER_ID,
           u.USERNAME,
           u.EMAIL,
           u.KELAS,
           u.NAMA_LENGKAP,
           u.FOTO_PROFIL,
           u.CREATED_DATE,
           NVL(AVG(uqa.SCORE), 0) AS AVERAGE_SCORE
       FROM USERS u
       LEFT JOIN USER_QUIZ_ATTEMPTS uqa ON u.USER_ID = uqa.USER_ID
       GROUP BY
           u.USER_ID,
           u.USERNAME,
           u.EMAIL,
           u.KELAS,
           u.NAMA_LENGKAP,
           u.FOTO_PROFIL,
           u.CREATED_DATE
       ORDER BY u.CREATED_DATE DESC`
    );
    console.log(`[API /siswa] Fetched ${result.rows.length} users.`);
    res.json({
      success: true,
      users: result.rows.map(row => ({
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
    console.error('[API /siswa] Fetch users error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.', error: err.message });
  } finally {
    if (conn) { try { await conn.close(); } catch (err) { console.error('[API /siswa] Error closing connection:', err.message); }}
  }
});

// Endpoint untuk mengambil profil pengguna spesifik
router.get('/:userId/profile', async (req, res) => {
    const { userId } = req.params;
    let conn = null;
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ success: false, message: "User ID tidak valid." });
    }
    const numericUserId = parseInt(userId);
    try {
        conn = await getConnection();
        console.log(`[API GET /profile] Fetching profile for user ID: ${numericUserId}`);
        const userResult = await conn.execute(
            `SELECT USER_ID, USERNAME, EMAIL, KELAS, NAMA_LENGKAP,
                    TO_CHAR(TANGGAL_LAHIR, 'YYYY-MM-DD') AS TANGGAL_LAHIR,
                    ALAMAT, NO_TELEPON, FOTO_PROFIL
             FROM USERS
             WHERE USER_ID = :pUserId`,
            { pUserId: numericUserId }
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan." });
        }
        const userDb = userResult.rows[0];
        res.json({
            success: true,
            user: { // Map to frontend expected fields if different
                ID_USER: userDb.USER_ID, USERNAME: userDb.USERNAME, EMAIL: userDb.EMAIL,
                KELAS: userDb.KELAS, NAMA_LENGKAP: userDb.NAMA_LENGKAP || "",
                TANGGAL_LAHIR: userDb.TANGGAL_LAHIR || "", ALAMAT: userDb.ALAMAT || "",
                NO_TELEPON: userDb.NO_TELEPON || "", FOTO_PROFIL: userDb.FOTO_PROFIL || ""
            }
        });
    } catch (err) {
        console.error(`[API GET /profile] Error for user ${numericUserId}:`, err.message, err.stack);
        res.status(500).json({ success: false, message: 'Gagal mengambil profil pengguna.', error: err.message });
    } finally {
        if (conn) { try { await conn.close(); } catch (e) { console.error('[API GET /profile] Error closing connection:', e.message); }}
    }
});

// Endpoint untuk update profil pengguna
router.put('/:userId/profile', upload.single('profilePicFile'), async (req, res) => {
    const { userId } = req.params;
    const { USERNAME, EMAIL, KELAS, NAMA_LENGKAP, TANGGAL_LAHIR, ALAMAT, NO_TELEPON } = req.body;
    let fotoProfilDiRequestBody = req.body.FOTO_PROFIL;
    let urlFotoUntukDb = fotoProfilDiRequestBody;

    let conn = null;
    const numericUserId = parseInt(userId);

    if (!userId || isNaN(numericUserId)) {
        if (req.file) fs.unlink(req.file.path, (err) => { if(err) console.error("Error deleting temp upload on ID validation fail", err); });
        return res.status(400).json({ success: false, message: "User ID tidak valid." });
    }
    if (!USERNAME || !EMAIL) {
        if (req.file) fs.unlink(req.file.path, (err) => { if(err) console.error("Error deleting temp upload on field validation fail", err); });
        return res.status(400).json({ success: false, message: "Username dan Email wajib diisi." });
    }

    if (req.file) {
        urlFotoUntukDb = `/uploads/${req.file.filename}`;
    } else if (fotoProfilDiRequestBody === '' || fotoProfilDiRequestBody === null || typeof fotoProfilDiRequestBody === 'undefined') {
        urlFotoUntukDb = null; // Explicitly set to null if cleared and no new file
    }

    try {
        conn = await getConnection();
        await conn.begin(); // Start transaction

        let pathFotoProfilLamaDiFs = null;
        // Check if we need to delete an old photo
        if (req.file || (urlFotoUntukDb === null && fotoProfilDiRequestBody !== null && typeof fotoProfilDiRequestBody !== 'undefined' && fotoProfilDiRequestBody !== '')) {
            // Only query for old photo if new one is uploaded OR existing one is explicitly cleared
            const userLamaResult = await conn.execute( `SELECT FOTO_PROFIL FROM USERS WHERE USER_ID = :id`, { id: numericUserId });
            if (userLamaResult.rows.length > 0 && userLamaResult.rows[0].FOTO_PROFIL) {
                pathFotoProfilLamaDiFs = path.join(UPLOADS_DIR, path.basename(userLamaResult.rows[0].FOTO_PROFIL));
            }
        }

        const sql = `UPDATE USERS SET
                        USERNAME = :username, EMAIL = :email, KELAS = :kelas,
                        NAMA_LENGKAP = :nama_lengkap, TANGGAL_LAHIR = TO_DATE(:tanggal_lahir, 'YYYY-MM-DD'),
                        ALAMAT = :alamat, NO_TELEPON = :no_telepon, FOTO_PROFIL = :foto_profil
                     WHERE USER_ID = :p_userId`;

        const bindParams = {
            username: USERNAME, email: EMAIL, kelas: KELAS || null,
            nama_lengkap: NAMA_LENGKAP || null,
            tanggal_lahir: TANGGAL_LAHIR ? TANGGAL_LAHIR.split('T')[0] : null, // Ensure only date part
            alamat: ALAMAT || null, no_telepon: NO_TELEPON || null,
            foto_profil: urlFotoUntukDb,
            p_userId: numericUserId
        };

        const result = await conn.execute(sql, bindParams); // autoCommit is false

        if (result.rowsAffected === 0) {
            if (req.file) fs.unlink(req.file.path, (err) => { if(err) console.error("Error deleting uploaded file on DB update failure (user not found):", err); });
            await conn.rollback();
            return res.status(404).json({ success: false, message: "User tidak ditemukan atau tidak ada data yang berubah." });
        }

        // If update was successful, commit the transaction
        await conn.commit();

        // Now delete the old photo if necessary (after successful commit)
        if (pathFotoProfilLamaDiFs) {
             // Check if new file is different from old, or if old photo is being cleared
            const isNewFileDifferentFromOld = req.file ? pathFotoProfilLamaDiFs !== path.join(UPLOADS_DIR, req.file.filename) : true;
            if (isNewFileDifferentFromOld && fs.existsSync(pathFotoProfilLamaDiFs)) {
                fs.unlink(pathFotoProfilLamaDiFs, err => {
                    if (err) console.warn(`[API PUT /profile] Peringatan: Gagal menghapus foto profil lama ${pathFotoProfilLamaDiFs}:`, err);
                    else console.log(`[API PUT /profile] Berhasil menghapus foto profil lama: ${pathFotoProfilLamaDiFs}`);
                });
            }
        }

        // Fetch the updated user data to return to frontend
        const updatedUserResult = await conn.execute(
            `SELECT USER_ID, USERNAME, EMAIL, KELAS, NAMA_LENGKAP,
                    TO_CHAR(TANGGAL_LAHIR, 'YYYY-MM-DD') AS TANGGAL_LAHIR,
                    ALAMAT, NO_TELEPON, FOTO_PROFIL
             FROM USERS WHERE USER_ID = :pUserId`, { pUserId: numericUserId }
        );
        
        const feUser = updatedUserResult.rows.length > 0 ? {
            ID_USER: updatedUserResult.rows[0].USER_ID, USERNAME: updatedUserResult.rows[0].USERNAME,
            EMAIL: updatedUserResult.rows[0].EMAIL, KELAS: updatedUserResult.rows[0].KELAS,
            NAMA_LENGKAP: updatedUserResult.rows[0].NAMA_LENGKAP, TANGGAL_LAHIR: updatedUserResult.rows[0].TANGGAL_LAHIR,
            ALAMAT: updatedUserResult.rows[0].ALAMAT, NO_TELEPON: updatedUserResult.rows[0].NO_TELEPON,
            FOTO_PROFIL: updatedUserResult.rows[0].FOTO_PROFIL
        } : null;

        res.json({ success: true, message: "Profil berhasil diperbarui.", user: feUser });

    } catch (err) {
        if (conn) await conn.rollback(); // Rollback on any error during try block
        console.error(`[API PUT /profile] Error untuk user ${numericUserId}:`, err.message, err.stack);
        if (req.file && fs.existsSync(req.file.path)) { // Check if file exists before unlinking
             fs.unlink(req.file.path, (unlinkErr) => { if(unlinkErr) console.error("Error deleting uploaded file after general error:", unlinkErr); });
        }
        if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: `Kesalahan unggah file: ${err.message}` });
        // Check for specific error message if it's a custom error from fileFilter
        if (err.message && err.message.includes('Hanya file gambar yang diizinkan!')) {
             return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Gagal memperbarui profil karena kesalahan server.', error: err.message });
    } finally {
        if (conn) { try { await conn.close(); } catch (e) { console.error('[API PUT /profile] Error closing connection:', e.message); }}
    }
});


// Endpoint Materi Selesai
router.post('/:userId/materi/:materiId/complete', async (req, res) => {
  const { userId, materiId } = req.params;
  let conn = null;
  if (!userId || isNaN(parseInt(userId)) || !materiId || isNaN(parseInt(materiId))) {
    return res.status(400).json({ success: false, message: "User ID atau Materi ID tidak valid." });
  }
  const numericUserId = parseInt(userId);
  const numericMateriId = parseInt(materiId);
  try {
    conn = await getConnection();
    const progressColumnForMateri = 'MATERI_ID';
    const pkColumnProgress = 'COURSE_PROGRESS_ID';
    const mergeSql = `
      MERGE INTO USER_COURSE_PROGRESS ucp
      USING (SELECT :pUserId AS USER_ID, :pMateriId AS ${progressColumnForMateri} FROM dual) data_to_merge
      ON (ucp.USER_ID = data_to_merge.USER_ID AND ucp.${progressColumnForMateri} = data_to_merge.${progressColumnForMateri})
      WHEN MATCHED THEN
        UPDATE SET ucp.STATUS = 'completed', ucp.COMPLETED_AT = SYSTIMESTAMP
        WHERE ucp.STATUS != 'completed' OR ucp.STATUS IS NULL
      WHEN NOT MATCHED THEN
        INSERT (${pkColumnProgress}, USER_ID, ${progressColumnForMateri}, STATUS, LAST_ACCESSED_AT, COMPLETED_AT)
        VALUES (USER_COURSE_PROGRESS_SEQ.NEXTVAL, :pUserId, :pMateriId, 'completed', SYSTIMESTAMP, SYSTIMESTAMP)
    `;
    await conn.execute(mergeSql, { pUserId: numericUserId, pMateriId: numericMateriId }, { autoCommit: true });
    res.json({ success: true, message: 'Materi berhasil ditandai sebagai selesai.' });
  } catch (err) {
    console.error(`[API /complete] DB Error for user ${numericUserId}, materi ${numericMateriId}:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal menandai materi selesai.', error: err.message });
  } finally {
    if (conn) { try { await conn.close(); } catch (e) { console.error('[API /complete] Error closing connection:', e.message); }}
  }
});

// Endpoint Statistik Dashboard
router.get('/:userId/dashboard-stats', async (req, res) => {
  const { userId } = req.params;
  let conn = null;
  if (!userId || isNaN(parseInt(userId))) {
    return res.status(400).json({ success: false, message: "User ID tidak valid." });
  }
  const numericUserId = parseInt(userId);
  try {
    conn = await getConnection();
    let accessedMaterials = 0;
    let activityPoints = 0;
    let coursesCompleted = 0;

    try {
        const accessedRes = await conn.execute(
            `SELECT COUNT(DISTINCT MATERI_ID) AS C FROM USER_COURSE_PROGRESS WHERE USER_ID = :id`,
            {id: numericUserId}
        );
        if (accessedRes.rows.length > 0) accessedMaterials = Number(accessedRes.rows[0].C || 0);
    } catch (err) { console.warn(`[API /dashboard-stats] Peringatan (Accessed Materials) User ${numericUserId}: ${err.message}`); }

    // Untuk Poin Aktivitas, jika Anda tidak memiliki tabel khusus, bisa di-nol-kan atau di-placeholder
    activityPoints = 0; // Atau logika placeholder Anda
    console.log(`[API /dashboard-stats] User ${numericUserId} - Activity Points (placeholder/0): ${activityPoints}`);

    const courseProgressCol = 'MATERI_ID';
    try {
        const courseRes = await conn.execute(
            `SELECT COUNT(DISTINCT ${courseProgressCol}) AS C FROM USER_COURSE_PROGRESS WHERE USER_ID = :id AND STATUS = 'completed'`,
            {id: numericUserId}
        );
        if (courseRes.rows.length > 0) coursesCompleted = Number(courseRes.rows[0].C || 0);
    } catch (err) { console.warn(`[API /dashboard-stats] Peringatan (Courses Completed) User ${numericUserId}: ${err.message}`); }
    res.json({ success: true, stats: { accessedMaterials, activityPoints, coursesCompleted } });
  } catch (err) {
    console.error(`[API /dashboard-stats] Error for user ${numericUserId}:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard.', error: err.message });
  } finally {
    if (conn) { try { await conn.close(); } catch (e) { console.error('[API /dashboard-stats] Error closing connection:', e.message); }}
  }
});

// DELETE user (siswa)
router.delete('/:userId', async (req, res) => {
    const { userId } = req.params;
    let conn = null;
    const numericUserId = parseInt(userId);

    if (!userId || isNaN(numericUserId)) {
        return res.status(400).json({ success: false, message: "User ID tidak valid." });
    }
    try {
        conn = await getConnection();
        await conn.begin(); // Start transaction

        const userResult = await conn.execute(`SELECT FOTO_PROFIL FROM USERS WHERE USER_ID = :id`, { id: numericUserId });
        // Hapus dari tabel child dulu
        await conn.execute(`DELETE FROM USER_QUIZ_ATTEMPTS WHERE USER_ID = :id`, { id: numericUserId });
        await conn.execute(`DELETE FROM USER_COURSE_PROGRESS WHERE USER_ID = :id`, { id: numericUserId });
        // Kemudian hapus dari tabel parent
        const deleteResult = await conn.execute(`DELETE FROM USERS WHERE USER_ID = :id`, { id: numericUserId });

        if (deleteResult.rowsAffected === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        }
        await conn.commit(); // Commit transaction

        if (userResult.rows.length > 0 && userResult.rows[0].FOTO_PROFIL) {
            const fotoProfilPath = path.join(UPLOADS_DIR, path.basename(userResult.rows[0].FOTO_PROFIL));
            if (fs.existsSync(fotoProfilPath)) {
                fs.unlink(fotoProfilPath, (err) => {
                    if (err) console.error(`[API DELETE /:userId] Gagal menghapus file foto profil ${fotoProfilPath}:`, err);
                    else console.log(`[API DELETE /:userId] Foto profil ${fotoProfilPath} berhasil dihapus.`);
                });
            }
        }
        res.json({ success: true, message: 'User berhasil dihapus.' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(`[API DELETE /:userId] Error deleting user ${numericUserId}:`, err.message, err.stack);
        res.status(500).json({ success: false, message: 'Gagal menghapus user.', error: err.message });
    } finally {
        if (conn) { try { await conn.close(); } catch (e) { console.error('[API DELETE /:userId] Error closing connection:', e.message); }}
    }
});

// Endpoint BARU untuk mengambil progres materi seorang siswa
router.get('/:userId/material-progress', async (req, res) => {
  const { userId } = req.params;
  let conn = null;

  if (!userId || isNaN(parseInt(userId))) {
    return res.status(400).json({ success: false, message: "User ID tidak valid." });
  }
  const numericUserId = parseInt(userId);

  try {
    conn = await getConnection();
    console.log(`[API users.js/:userId/material-progress] Fetching material progress for user ID: ${numericUserId}`);

    const progressResult = await conn.execute(
      `SELECT
           ucp.MATERI_ID,
           m.NAMA_MATERI,
           m.KELAS AS MATERI_KELAS,
           m.TIPE_MATERI,
           ucp.STATUS,
           TO_CHAR(ucp.LAST_ACCESSED_AT, 'YYYY-MM-DD HH24:MI:SS') AS LAST_ACCESSED_AT,
           TO_CHAR(ucp.COMPLETED_AT, 'YYYY-MM-DD HH24:MI:SS') AS COMPLETED_AT
       FROM USER_COURSE_PROGRESS ucp
       JOIN MATERI m ON ucp.MATERI_ID = m.ID
       WHERE ucp.USER_ID = :pUserId
       ORDER BY ucp.LAST_ACCESSED_AT DESC`,
      { pUserId: numericUserId }
    );

    res.json({
      success: true,
      progress: progressResult.rows.map(row => ({
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
    console.error(`[API users.js/:userId/material-progress] Error for user ${numericUserId}:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal mengambil progres materi pengguna.', error: err.message });
  } finally {
    if (conn) {
      try { await conn.close(); }
      catch (e) { console.error('[API users.js/:userId/material-progress] Error closing connection:', e.message); }
    }
  }
});


module.exports = router;