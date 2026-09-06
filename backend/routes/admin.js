const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const bcrypt = require('bcrypt');

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

    const idResult = await conn.execute(
      `SELECT admin_seq.NEXTVAL AS id FROM dual`
    );
    const id = idResult.rows[0].ID;

    await conn.execute(
      `INSERT INTO admin (id, email, password) VALUES (:id, :email, :password)`,
      { id, email, password }, 
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