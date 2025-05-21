const express = require('express');
const router = express.Router();
const { getConnection } = require('../db'); // Sesuaikan dengan path file koneksi DB Anda

// GET all users
router.get('/siswa', async (req, res) => {
  let conn = null;

  try {
    conn = await getConnection();
    // Pastikan mengambil kolom KELAS
    const result = await conn.execute(
      `SELECT USER_ID, USERNAME, EMAIL, KELAS, CREATED_DATE FROM users ORDER BY CREATED_DATE DESC`
    );

    res.json({
      success: true,
      users: result.rows.map(row => ({
        id: row.USER_ID,
        nama: row.USERNAME,
        email: row.EMAIL,
        kelas: row.KELAS,   // Pastikan ini KELAS (uppercase) jika kolom di DB juga uppercase
        tanggal: row.CREATED_DATE
      }))
    });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

module.exports = router;