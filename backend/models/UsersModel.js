const { getConnection } = require('../config/db');

class UsersModel {
  static async getSiswaWithAverageScore() {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT
             u.USER_ID, u.USERNAME, u.EMAIL, u.KELAS, u.NAMA_LENGKAP, u.FOTO_PROFIL, u.CREATED_DATE,
             NVL(AVG(uqa.SCORE), 0) AS AVERAGE_SCORE
         FROM USERS u
         LEFT JOIN USER_QUIZ_ATTEMPTS uqa ON u.USER_ID = uqa.USER_ID
         GROUP BY u.USER_ID, u.USERNAME, u.EMAIL, u.KELAS, u.NAMA_LENGKAP, u.FOTO_PROFIL, u.CREATED_DATE
         ORDER BY u.CREATED_DATE DESC` 
      );
      return result.rows;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) {} }
    }
  }

  static async getUserProfile(userId) {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT USER_ID, USERNAME, EMAIL, KELAS, NAMA_LENGKAP,
                TO_CHAR(TANGGAL_LAHIR, 'YYYY-MM-DD') AS TANGGAL_LAHIR,
                ALAMAT, NO_TELEPON, FOTO_PROFIL
         FROM USERS
         WHERE USER_ID = :pUserId`,
        { pUserId: userId } 
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) {} }
    }
  }

  static async updateUserProfile(userId, data) {
    let conn;
    try {
      conn = await getConnection();
      await conn.begin();

      let pathFotoProfilLamaDiFs = null;
      if (data.checkOldPhoto) {
          const userLamaResult = await conn.execute( `SELECT FOTO_PROFIL FROM USERS WHERE USER_ID = :id`, { id: userId });
          if (userLamaResult.rows.length > 0 && userLamaResult.rows[0].FOTO_PROFIL) {
              pathFotoProfilLamaDiFs = userLamaResult.rows[0].FOTO_PROFIL; 
          }
      }

      const sql = `UPDATE USERS SET
                      USERNAME = :username, EMAIL = :email, KELAS = :kelas,
                      NAMA_LENGKAP = :nama_lengkap, TANGGAL_LAHIR = TO_DATE(:tanggal_lahir, 'YYYY-MM-DD'),
                      ALAMAT = :alamat, NO_TELEPON = :no_telepon, FOTO_PROFIL = :foto_profil
                   WHERE USER_ID = :p_userId`;

      const bindParams = {
          username: data.USERNAME, email: data.EMAIL, kelas: data.KELAS || null,
          nama_lengkap: data.NAMA_LENGKAP || null,
          tanggal_lahir: data.TANGGAL_LAHIR ? data.TANGGAL_LAHIR.split('T')[0] : null, 
          alamat: data.ALAMAT || null, no_telepon: data.NO_TELEPON || null,
          foto_profil: data.urlFotoUntukDb, 
          p_userId: userId
      };

      const result = await conn.execute(sql, bindParams); 

      if (result.rowsAffected === 0) {
          await conn.rollback(); 
          return { success: false };
      }

      await conn.commit();

      const updatedUserResult = await conn.execute(
        `SELECT USER_ID, USERNAME, EMAIL, KELAS, NAMA_LENGKAP,
                TO_CHAR(TANGGAL_LAHIR, 'YYYY-MM-DD') AS TANGGAL_LAHIR,
                ALAMAT, NO_TELEPON, FOTO_PROFIL
         FROM USERS WHERE USER_ID = :pUserId`, { pUserId: userId }
      );
      
      const feUser = updatedUserResult.rows.length > 0 ? updatedUserResult.rows[0] : null;

      return { success: true, feUser, pathFotoProfilLamaDiFs };
    } catch (err) {
      if (conn) await conn.rollback();
      throw err;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) {} }
    }
  }

  static async completeMaterial(userId, materiId) {
    let conn;
    try {
      conn = await getConnection();
      const mergeSql = `
        INSERT INTO USER_COURSE_PROGRESS (USER_ID, MATERI_ID, STATUS, LAST_ACCESSED_AT, COMPLETED_AT)
        VALUES (:pUserId, :pMateriId, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (USER_ID, MATERI_ID) 
        DO UPDATE SET 
          STATUS = 'completed', 
          COMPLETED_AT = CURRENT_TIMESTAMP
        WHERE USER_COURSE_PROGRESS.STATUS != 'completed' OR USER_COURSE_PROGRESS.STATUS IS NULL
      `;
      await conn.execute(mergeSql, { pUserId: userId, pMateriId: materiId }, { autoCommit: true });
      return true;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) {} }
    }
  }

  static async getDashboardStats(userId) {
    let conn;
    try {
      conn = await getConnection();
      let accessedMaterials = 0; 
      let activityPoints = 0;   
      let coursesCompleted = 0;  
  
      try {
          const accessedRes = await conn.execute(
              `SELECT COUNT(DISTINCT MATERI_ID) AS C FROM USER_COURSE_PROGRESS WHERE USER_ID = :id`,
              {id: userId}
          );
          if (accessedRes.rows.length > 0) accessedMaterials = Number(accessedRes.rows[0].C || 0);
      } catch (err) {}
  
      try {
          const courseRes = await conn.execute(
              `SELECT COUNT(DISTINCT MATERI_ID) AS C FROM USER_COURSE_PROGRESS WHERE USER_ID = :id AND STATUS = 'completed'`,
              {id: userId}
          );
          if (courseRes.rows.length > 0) coursesCompleted = Number(courseRes.rows[0].C || 0);
      } catch (err) {}
  
      return { accessedMaterials, activityPoints, coursesCompleted };
    } finally {
      if (conn) { try { await conn.close(); } catch(e) {} }
    }
  }

  static async deleteUser(userId) {
    let conn;
    try {
      conn = await getConnection();
      await conn.begin();

      const userResult = await conn.execute(`SELECT FOTO_PROFIL FROM USERS WHERE USER_ID = :id`, { id: userId });
      let fotoProfilDb = null;
      if (userResult.rows.length > 0 && userResult.rows[0].FOTO_PROFIL) {
          fotoProfilDb = userResult.rows[0].FOTO_PROFIL;
      }

      await conn.execute(`DELETE FROM USER_QUIZ_ATTEMPTS WHERE USER_ID = :id`, { id: userId });
      await conn.execute(`DELETE FROM USER_COURSE_PROGRESS WHERE USER_ID = :id`, { id: userId });
      
      const deleteResult = await conn.execute(`DELETE FROM USERS WHERE USER_ID = :id`, { id: userId });

      if (deleteResult.rowsAffected === 0) {
          await conn.rollback(); 
          return { success: false };
      }
      await conn.commit(); 

      return { success: true, fotoProfilDb };
    } catch (err) {
      if (conn) await conn.rollback(); 
      throw err;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) {} }
    }
  }

  static async getMaterialProgress(userId) {
    let conn;
    try {
      conn = await getConnection();
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
        { pUserId: userId }
      );
      return progressResult.rows;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) {} }
    }
  }
}

module.exports = UsersModel;
