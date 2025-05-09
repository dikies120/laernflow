const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const bcrypt = require('bcrypt');

// Register Route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  let conn = null;

  // Validasi input
  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Username, email, and password are required' 
    });
  }

  try {
    // Mendapatkan koneksi database
    conn = await getConnection();

    // Cek apakah email sudah terdaftar
    const checkResult = await conn.execute(
      `SELECT * FROM users WHERE email = :email`,
      { email }
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Hash password untuk keamanan
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Ambil ID otomatis dari sequence
    const result = await conn.execute(
      `SELECT users_seq.NEXTVAL AS user_id FROM dual`
    );

    const userId = result.rows[0].USER_ID;

    // Masukkan pengguna baru ke tabel users
    await conn.execute(
      `INSERT INTO users (USER_ID, USERNAME, EMAIL, PASSWORD, CREATED_DATE)
      VALUES (:userId, :username, :email, :hashedPassword, SYSDATE)`,
      { userId, username, email, hashedPassword },
      { autoCommit: true }
    );

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully' 
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    // Tutup koneksi database
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let conn = null;

  // Validasi input
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email and password are required' 
    });
  }

  try {
    // Mendapatkan koneksi database
    conn = await getConnection();

    // Cari user berdasarkan email
    const result = await conn.execute(
      `SELECT * FROM users WHERE email = :email`,
      { email }
    );

    // Jika user tidak ditemukan
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];
    
    // Verifikasi password
    const passwordMatch = await bcrypt.compare(password, user.PASSWORD);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Hapus password dari objek user sebelum mengirim respons
    delete user.PASSWORD;

    // Login berhasil
    res.status(200).json({ 
      success: true,
      message: 'Login successful', 
      user 
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    // Tutup koneksi database
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