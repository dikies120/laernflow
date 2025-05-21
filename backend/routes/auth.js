const express = require('express');
const router = express.Router();
const { getConnection } = require('../db'); // Sesuaikan dengan path file koneksi DB Anda
const bcrypt = require('bcrypt');

// Register Route
router.post('/register', async (req, res) => {
  const { username, email, password, kelas } = req.body;
  let conn = null;

  if (!username || !email || !password || !kelas) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, password, and kelas are required'
    });
  }
  if (password.length < 6) {
      return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
      });
  }
   if (kelas === '') { // Validasi tambahan jika kelas masih bernilai string kosong dari dropdown
    return res.status(400).json({
      success: false,
      message: 'Kelas wajib dipilih'
    });
  }


  try {
    conn = await getConnection();
    const checkResult = await conn.execute(
      `SELECT EMAIL FROM users WHERE EMAIL = :email`, // Hanya pilih EMAIL untuk efisiensi
      { email }
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Ambil ID otomatis dari sequence (Pastikan sequence 'users_seq' ada di DB Oracle Anda)
    // CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1;
    const resultSeq = await conn.execute(
      `SELECT users_seq.NEXTVAL AS user_id FROM dual`
    );
    const userId = resultSeq.rows[0].USER_ID;

    await conn.execute(
      `INSERT INTO users (USER_ID, USERNAME, EMAIL, PASSWORD, KELAS, CREATED_DATE)
       VALUES (:userId, :username, :email, :hashedPassword, :kelas, SYSDATE)`,
      { userId, username, email, hashedPassword, kelas },
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
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
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

// Login Route
router.post('/login', async (req, res) => {
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
    // Ambil semua data user termasuk KELAS
    const result = await conn.execute(
      `SELECT USER_ID, USERNAME, EMAIL, PASSWORD, KELAS, CREATED_DATE FROM users WHERE EMAIL = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0]; // Oracle mengembalikan nama kolom uppercase by default

    console.log('Backend /login: User data from DB (before sending to frontend):', user);

    const passwordMatch = await bcrypt.compare(password, user.PASSWORD);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Buat objek user baru tanpa field PASSWORD untuk dikirim ke frontend
    const userToSend = {
        USER_ID: user.USER_ID,
        USERNAME: user.USERNAME,
        EMAIL: user.EMAIL,
        KELAS: user.KELAS, // Pastikan KELAS ada di sini
        CREATED_DATE: user.CREATED_DATE
    };


    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userToSend
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
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

// Endpoint untuk mengambil semua user (jika masih digunakan)
router.get('/siswa', async (req, res) => {
  let conn = null;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT USER_ID, USERNAME, EMAIL, KELAS, CREATED_DATE FROM users ORDER BY CREATED_DATE DESC`
    );
    const users = result.rows.map(row => ({
      id: row.USER_ID,
      nama: row.USERNAME,
      email: row.EMAIL,
      kelas: row.KELAS, // Pastikan ini KELAS (uppercase) jika kolom di DB juga uppercase
      tanggal: row.CREATED_DATE
    }));
    res.json({ success: true, users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  } finally {
    if (conn) {
      try { await conn.close(); } catch (err) {console.error('Error closing connection:', err);}
    }
  }
});

module.exports = router;