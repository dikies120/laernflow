const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const bcrypt = require('bcrypt');

// Admin Register Route
router.post('/register-admin', async (req, res) => {
  const { email, password } = req.body;
  let conn = null;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    conn = await getConnection();

    // Cek apakah email sudah terdaftar
    const checkResult = await conn.execute(
      `SELECT * FROM admin WHERE email = :email`,
      { email }
    );
    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Untuk produksi, hash password:
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Ambil ID otomatis (misal dari sequence admin_seq)
    const idResult = await conn.execute(
      `SELECT admin_seq.NEXTVAL AS id FROM dual`
    );
    const id = idResult.rows[0].ID;

    // Simpan admin baru
    await conn.execute(
      `INSERT INTO admin (id, email, password) VALUES (:id, :email, :password)`,
      { id, email, password }, // Ganti password dengan hashedPassword jika pakai hash
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error registering admin',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    if (conn) {
      try { await conn.close(); } catch (err) {}
    }
  }
});

// Admin Login Route
router.post('/login-admin', async (req, res) => {
  const { email, password } = req.body;
  let conn = null;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM admin WHERE email = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const admin = result.rows[0];

    // Jika password di-hash:
    // const passwordMatch = await bcrypt.compare(password, admin.PASSWORD);
    // if (!passwordMatch) { ... }

    if (admin.PASSWORD !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    delete admin.PASSWORD;

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      admin,
      token: "admin-token"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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