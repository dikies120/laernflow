const AdminModel = require('../models/AdminModel');

class AdminController {
  static async registerAdmin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    try {
      const existingAdmin = await AdminModel.getAdminByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      await AdminModel.createAdmin(email, password);

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
    }
  }

  static async loginAdmin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    try {
      const admin = await AdminModel.getAdminByEmail(email);

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

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
      console.error('Admin login error:', err);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await AdminModel.getDashboardStats();
      res.json({ success: true, stats });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      res.status(500).json({ success: false, message: 'Failed to load stats' });
    }
  }
}

module.exports = AdminController;
