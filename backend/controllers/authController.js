const bcrypt = require('bcrypt');
const AuthModel = require('../models/AuthModel');

class AuthController {
  static async register(req, res) {
    const { username, email, password, kelas } = req.body;

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
    if (kelas === '') {
      return res.status(400).json({
        success: false,
        message: 'Kelas wajib dipilih'
      });
    }

    try {
      const existingUser = await AuthModel.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await AuthModel.createUser(username, email, hashedPassword, kelas);

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
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    try {
      const user = await AuthModel.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      console.log('Backend /login: User data from DB (before sending to frontend):', user);

      const passwordMatch = await bcrypt.compare(password, user.PASSWORD);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const userToSend = {
        USER_ID: user.USER_ID,
        USERNAME: user.USERNAME,
        EMAIL: user.EMAIL,
        KELAS: user.KELAS,
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
    }
  }

  static async getSiswa(req, res) {
    try {
      const result = await AuthModel.getAllSiswa();
      const users = result.map(row => ({
        id: row.USER_ID,
        nama: row.USERNAME,
        email: row.EMAIL,
        kelas: row.KELAS,
        tanggal: row.CREATED_DATE
      }));
      res.json({ success: true, users });
    } catch (err) {
      console.error('Fetch users error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }
}

module.exports = AuthController;
