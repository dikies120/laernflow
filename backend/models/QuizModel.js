const { getConnection } = require('../config/db');

// Helper wrapper just in case we need it, though Oracle specific lobToString is not needed in pg
async function lobToString(lobInput, columnName = "Unknown") {
  return new Promise((resolve) => {
    if (!lobInput) { return resolve(''); }
    resolve(String(lobInput));
  });
}

class QuizModel {
  static async getQuizByMateriId(materiId) {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT id, soal, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban
         FROM quiz WHERE materi_id = :idbv ORDER BY id ASC`, { idbv: materiId }
      );
      if (!result.rows || !Array.isArray(result.rows)) { return []; }
      
      const quizzesPromises = result.rows.map(async (row) => {
        if (typeof row !== 'object' || row === null) return null;
        const soalString = await lobToString(row.SOAL, `SOAL (ID: ${row.ID})`).catch(e => "Error soal");
        const pilihanAString = await lobToString(row.PILIHAN_A, `PILIHAN_A (ID: ${row.ID})`).catch(e => "Error A");
        const pilihanBString = await lobToString(row.PILIHAN_B, `PILIHAN_B (ID: ${row.ID})`).catch(e => "Error B");
        const pilihanCString = await lobToString(row.PILIHAN_C, `PILIHAN_C (ID: ${row.ID})`).catch(e => "Error C");
        const pilihanDString = await lobToString(row.PILIHAN_D, `PILIHAN_D (ID: ${row.ID})`).catch(e => "Error D");
        const jawabanString = await lobToString(row.JAWABAN, `JAWABAN (ID: ${row.ID})`).catch(e => "Error J");
        return { id: row.ID, soal: soalString, pilihan_a: pilihanAString, pilihan_b: pilihanBString, pilihan_c: pilihanCString, pilihan_d: pilihanDString, jawaban: jawabanString };
      });
      return (await Promise.all(quizzesPromises)).filter(q => q !== null);
    } finally {
      if (conn) { try { await conn.close(); } catch(e) { } }
    }
  }

  static async getLastAttemptStatus(userId, materiId) {
    let conn;
    try {
      conn = await getConnection();
      const result = await conn.execute(
        `SELECT
             ATTEMPT_ID, MATERI_ID, SCORE, TOTAL_QUESTIONS,
             CORRECT_ANSWERS, PASSED,
             TO_CHAR(COMPLETED_AT, 'YYYY-MM-DD HH24:MI:SS') AS COMPLETED_AT
         FROM USER_QUIZ_ATTEMPTS
         WHERE USER_ID = :pUserId AND MATERI_ID = :pMateriId
         ORDER BY COMPLETED_AT DESC
         LIMIT 1`,
        { pUserId: userId, pMateriId: materiId }
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) { } }
    }
  }

  static async submitScore(student_id, materi_id, score, total_questions) {
    let conn;
    try {
      conn = await getConnection();
      let actualQuizIdToInsert;
      const quizMasterResult = await conn.execute(
        `SELECT QUIZ_PK_ID FROM QUIZZES WHERE MATERI_ID_FK = :materi_id_val`,
        { materi_id_val: parseInt(materi_id) }
      );
  
      if (!quizMasterResult.rows || quizMasterResult.rows.length === 0) {
        actualQuizIdToInsert = parseInt(materi_id); 
      } else {
         actualQuizIdToInsert = quizMasterResult.rows[0].QUIZ_PK_ID;
      }
  
      const idResult = await conn.execute(`SELECT user_quiz_attempts_seq.NEXTVAL AS NEW_ID FROM dual`);
      if (!idResult.rows || idResult.rows.length === 0 || !idResult.rows[0].hasOwnProperty('NEW_ID') || idResult.rows[0].NEW_ID === null) {
          throw new Error("Gagal mendapatkan ID baru dari sequence user_quiz_attempts_seq.");
      }
      const newAttemptId = idResult.rows[0].NEW_ID;
  
      const correct_answers = parseInt(score);
      const total_q = parseInt(total_questions);
      const percentage = total_q > 0 ? Math.round((correct_answers / total_q) * 100) : 0;
      const passed = percentage >= 70 ? 1 : 0;
  
      const sql = `INSERT INTO USER_QUIZ_ATTEMPTS
                   (ATTEMPT_ID, USER_ID, QUIZ_ID, MATERI_ID, SCORE, TOTAL_QUESTIONS, CORRECT_ANSWERS, PASSED, COMPLETED_AT)
                   VALUES (:attempt_id, :user_id, :quiz_id_val, :materi_id_val, :score_percent, :total_questions_val, :correct_answers_val, :passed_val, SYSDATE)`;
      const binds = {
          attempt_id: newAttemptId, user_id: parseInt(student_id),
          quiz_id_val: actualQuizIdToInsert, 
          materi_id_val: parseInt(materi_id),
          score_percent: percentage, total_questions_val: total_q,
          correct_answers_val: correct_answers, passed_val: passed
      };
  
      await conn.execute(sql, binds, { autoCommit: true });
      return { attemptId: newAttemptId, percentage, passed };
    } finally {
      if (conn) { try { await conn.close(); } catch(e) { } }
    }
  }

  static async getResultsByStudent(studentId, materi_id) {
    let conn;
    try {
      conn = await getConnection();
      let sql = `SELECT
                  uqa.ATTEMPT_ID, uqa.MATERI_ID, m.NAMA_MATERI as MATERI_TITLE,
                  uqa.SCORE, uqa.TOTAL_QUESTIONS, uqa.CORRECT_ANSWERS, uqa.PASSED,
                  TO_CHAR(uqa.COMPLETED_AT, 'YYYY-MM-DD HH24:MI:SS') AS COMPLETED_AT
                 FROM USER_QUIZ_ATTEMPTS uqa
                 LEFT JOIN MATERI m ON uqa.MATERI_ID = m.ID
                 WHERE uqa.USER_ID = :student_id_bv`;
      const binds = { student_id_bv: parseInt(studentId) };
  
      if (materi_id) {
        sql += ` AND uqa.MATERI_ID = :materi_id_bv`;
        binds.materi_id_bv = parseInt(materi_id);
      }
      sql += ` ORDER BY uqa.COMPLETED_AT ASC`; 
  
      const result = await conn.execute(sql, binds);
      return result.rows;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) { } }
    }
  }

  static async getResultsAdmin(materi_id, student_id, limit) {
    let conn;
    try {
      conn = await getConnection();
      let sql = `SELECT
                  uqa.ATTEMPT_ID, uqa.USER_ID, u.USERNAME as STUDENT_NAME, u.EMAIL as STUDENT_EMAIL,
                  uqa.MATERI_ID, m.NAMA_MATERI as MATERI_TITLE, uqa.SCORE, uqa.TOTAL_QUESTIONS,
                  uqa.CORRECT_ANSWERS, uqa.PASSED, TO_CHAR(uqa.COMPLETED_AT, 'YYYY-MM-DD HH24:MI:SS') AS COMPLETED_AT
                 FROM USER_QUIZ_ATTEMPTS uqa
                 LEFT JOIN USERS u ON uqa.USER_ID = u.USER_ID
                 LEFT JOIN MATERI m ON uqa.MATERI_ID = m.ID
                 WHERE 1=1`;
      const binds = {};
      if (materi_id) { sql += ` AND uqa.MATERI_ID = :materi_id_bv`; binds.materi_id_bv = parseInt(materi_id); }
      if (student_id) { sql += ` AND uqa.USER_ID = :student_id_bv`; binds.student_id_bv = parseInt(student_id); }
      sql += ` ORDER BY uqa.COMPLETED_AT DESC`;
      if (limit) { sql += ` FETCH FIRST :limit_bv ROWS ONLY`; binds.limit_bv = parseInt(limit); }
  
      const result = await conn.execute(sql, binds);
      return result.rows;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) { } }
    }
  }

  static async addQuiz(materi_id, soal, a, b, c, d, jawaban) {
    let conn;
    try {
      conn = await getConnection();
      const idResult = await conn.execute(`SELECT quiz_seq.NEXTVAL AS NEW_ID FROM dual`);
      if (!idResult.rows || idResult.rows.length === 0 || !idResult.rows[0].hasOwnProperty('NEW_ID') || idResult.rows[0].NEW_ID === null) {
          throw new Error("Gagal mendapatkan ID baru dari sequence quiz_seq.");
      }
      const newQuizId = idResult.rows[0].NEW_ID;
      const sql = `INSERT INTO quiz (id, materi_id, soal, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban)
                   VALUES (:id_bv, :materi_id_bv, :soal_bv, :a_bv, :b_bv, :c_bv, :d_bv, :jawaban_bv)`;
      const binds = {
          id_bv: newQuizId, materi_id_bv: parseInt(materi_id), soal_bv: soal,
          a_bv: a, b_bv: b, c_bv: c, d_bv: d, jawaban_bv: jawaban.toUpperCase()
        };
      await conn.execute(sql, binds, { autoCommit: true });
      return newQuizId;
    } finally {
      if (conn) { try { await conn.close(); } catch(e) { } }
    }
  }
}

module.exports = QuizModel;
