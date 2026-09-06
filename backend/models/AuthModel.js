const { getConnection } = require('../config/db');

class AuthModel {
  static async getUserByEmail(email) {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT USER_ID, USERNAME, EMAIL, PASSWORD, KELAS, CREATED_DATE FROM users WHERE EMAIL = :email`,
        { email }
      );
      return result.rows[0];
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }

  static async createUser(username, email, hashedPassword, kelas) {
    let conn;
    try {
      conn = await getConnection();
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
      return userId;
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }

  static async getAllSiswa() {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT USER_ID, USERNAME, EMAIL, KELAS, CREATED_DATE FROM users ORDER BY CREATED_DATE DESC`
      );
      return result.rows;
    } finally {
      if (conn) {
        try { await conn.close(); } catch (err) {}
      }
    }
  }
}

module.exports = AuthModel;
