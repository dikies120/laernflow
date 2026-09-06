const { getConnection } = require('../config/db');

class AdminModel {
  static async getAdminByEmail(email) {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT * FROM admin WHERE email = :email`,
        { email }
      );
      return result.rows[0];
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }

  static async createAdmin(email, password) {
    let conn;
    try {
      conn = await getConnection();
      const idResult = await conn.execute(
        `SELECT admin_seq.NEXTVAL AS id FROM dual`
      );
      const id = idResult.rows[0].ID;

      await conn.execute(
        `INSERT INTO admin (id, email, password) VALUES (:id, :email, :password)`,
        { id, email, password }, 
        { autoCommit: true }
      );
      return id;
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }

  static async getDashboardStats() {
    let conn;
    try {
      conn = await getConnection();
      const usersResult = await conn.execute(`SELECT COUNT(*) AS total FROM users`);
      const materiResult = await conn.execute(`SELECT COUNT(*) AS total FROM materi`);
      const quizResult = await conn.execute(`SELECT COUNT(*) AS total FROM quiz_questions`);
      
      return {
        totalUsers: parseInt(usersResult.rows[0].TOTAL, 10),
        totalMateri: parseInt(materiResult.rows[0].TOTAL, 10),
        totalQuiz: parseInt(quizResult.rows[0].TOTAL, 10)
      };
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }
}

module.exports = AdminModel;
