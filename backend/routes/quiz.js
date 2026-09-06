const express = require('express');
const router = express.Router();
const { getConnection } = require('../db');
const oracledb = require('oracledb');

async function lobToString(lobInput, columnName = "Unknown") {
  return new Promise((resolve, reject) => {
    if (!lobInput) { return resolve(''); }
    if (typeof lobInput === 'string') { return resolve(lobInput); }
    if (lobInput instanceof oracledb.Lob && (lobInput.type === oracledb.DB_TYPE_CLOB || lobInput.type === oracledb.DB_TYPE_NCLOB)) {
      let data = ''; lobInput.setEncoding('utf8');
      lobInput.on('data', (chunk) => { data += chunk; });
      lobInput.on('error', (err) => {
        console.error(`[quiz.js] lobToString for ${columnName}: Error LOB stream:`, err);
        reject(new Error(`Gagal membaca LOB untuk ${columnName}: ` + err.message));
      });
      lobInput.on('end', () => { resolve(data); });
    } else {
      console.warn(`[quiz.js] lobToString for ${columnName}: Input bukan LOB. Konversi String().`);
      resolve(String(lobInput));
    }
  });
}

router.get('/materi/:materiId', async (req, res) => {
  let conn = null; const { materiId } = req.params;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id, soal, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban
       FROM quiz WHERE materi_id = :idbv ORDER BY id ASC`, { idbv: materiId }
    );
    if (!result.rows || !Array.isArray(result.rows)) { return res.json([]); }
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
    const quizzes = (await Promise.all(quizzesPromises)).filter(q => q !== null);
    res.json(quizzes);
  } catch (err) {
    console.error(`[quiz.js] API GET /materi/:materiId - Error:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal mengambil data quiz.', error: err.message });
  } finally {
    if (conn) { try { await conn.close(); } catch(e) { console.error("[quiz.js] Error close conn GET /materi/:materiId:", e.message); }}
  }
});

router.get('/user/:userId/materi/:materiId/last-attempt-status', async (req, res) => {
  const { userId, materiId } = req.params;
  let conn = null;

  if (!userId || isNaN(parseInt(userId)) || !materiId || isNaN(parseInt(materiId))) {
    return res.status(400).json({ success: false, message: "User ID atau Materi ID tidak valid." });
  }
  const numericUserId = parseInt(userId);
  const numericMateriId = parseInt(materiId);

  try {
    conn = await getConnection();
    console.log(`[API quiz.js] Fetching last quiz attempt status for user: ${numericUserId}, materi: ${numericMateriId}`);

    const result = await conn.execute(
      `SELECT * FROM (
         SELECT
             ATTEMPT_ID, MATERI_ID, SCORE, TOTAL_QUESTIONS,
             CORRECT_ANSWERS, PASSED,
             TO_CHAR(COMPLETED_AT, 'YYYY-MM-DD HH24:MI:SS') AS COMPLETED_AT
         FROM USER_QUIZ_ATTEMPTS
         WHERE USER_ID = :pUserId AND MATERI_ID = :pMateriId
         ORDER BY COMPLETED_AT DESC
       )
       WHERE ROWNUM = 1`,
      { pUserId: numericUserId, pMateriId: numericMateriId }
    );

    if (result.rows.length > 0) {
      const lastAttempt = result.rows[0];
      res.json({
        success: true,
        lastAttempt: {
          attemptId: lastAttempt.ATTEMPT_ID,
          materiId: lastAttempt.MATERI_ID,
          score: lastAttempt.SCORE, 
          totalQuestions: lastAttempt.TOTAL_QUESTIONS,
          correctAnswers: lastAttempt.CORRECT_ANSWERS,
          passed: lastAttempt.PASSED === 1,
          completedAt: lastAttempt.COMPLETED_AT
        }
      });
    } else {
      res.json({ success: true, lastAttempt: null });
    }

  } catch (err) {
    console.error(`[API quiz.js] Error fetching last quiz attempt for user ${numericUserId}, materi ${numericMateriId}:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal mengambil status kuis terakhir.', error: err.message });
  } finally {
    if (conn) {
      try { await conn.close(); }
      catch (e) { console.error('[API quiz.js] Error closing connection for last-attempt-status:', e.message); }
    }
  }
});

router.post('/submit-score', async (req, res) => {
  const { student_id, materi_id, score, total_questions } = req.body;

  if (student_id === undefined || materi_id === undefined || score === undefined || total_questions === undefined) {
    return res.status(400).json({ success: false, message: "Student ID, Materi ID, score (jumlah benar), dan total questions wajib diisi!" });
  }

  let conn = null;
  try {
    conn = await getConnection();
    console.log(`[quiz.js] API POST /submit-score - student: ${student_id}, materi: ${materi_id}, score: ${score}/${total_questions}`);

    let actualQuizIdToInsert;
    const quizMasterResult = await conn.execute(
      `SELECT QUIZ_PK_ID FROM QUIZZES WHERE MATERI_ID_FK = :materi_id_val`,
      { materi_id_val: parseInt(materi_id) }
    );

    if (!quizMasterResult.rows || quizMasterResult.rows.length === 0) {
      console.warn(`[quiz.js] Tidak ditemukan master quiz untuk materi ID: ${materi_id}. Menggunakan materi_id sebagai quiz_id (mungkin menyebabkan error FK).`);
      actualQuizIdToInsert = parseInt(materi_id); 
    } else {
       actualQuizIdToInsert = quizMasterResult.rows[0].QUIZ_PK_ID;
    }
    console.log(`[quiz.js] ID Kuis yang akan diinsert ke USER_QUIZ_ATTEMPTS.QUIZ_ID: ${actualQuizIdToInsert}`);


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
    console.log("[quiz.js] Bind variables untuk INSERT:", JSON.stringify(binds));

    await conn.execute(sql, binds, { autoCommit: true });
    console.log(`[quiz.js] Quiz attempt berhasil disimpan ATTEMPT_ID: ${newAttemptId}`);
    res.status(201).json({ success: true, message: "Skor quiz berhasil disimpan!", attemptId: newAttemptId, percentage, passed: passed === 1 });
  } catch (err) {
    console.error("[quiz.js] API POST /submit-score - Error:", err);
    res.status(500).json({ success: false, message: "Gagal menyimpan skor quiz. Periksa log server.", error: err.message });
  } finally {
    if (conn) { try { await conn.close(); } catch (e) { console.error("[quiz.js] Error close conn POST /submit-score:", e.message); }}
  }
});

router.get('/results/student/:studentId', async (req, res) => {
  let conn = null;
  const { studentId } = req.params;
  const { materi_id } = req.query;
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
    const results = result.rows.map(row => ({
      id: row.ATTEMPT_ID,
      materi_id: row.MATERI_ID,
      materi_title: row.MATERI_TITLE || 'Materi Tidak Diketahui',
      score: row.SCORE,
      total_questions: row.TOTAL_QUESTIONS,
      correct_answers: row.CORRECT_ANSWERS,
      passed: row.PASSED === 1,
      completed_at: row.COMPLETED_AT
    }));
    res.json(results);
  } catch (err) {
    console.error(`[quiz.js] API GET /results/student/:studentId - Error:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal mengambil hasil quiz untuk student.', error: err.message });
  } finally {
    if (conn) { try { await conn.close(); } catch(e) { console.error("[quiz.js] Error close conn GET /results/student/:studentId:", e.message); }}
  }
});

router.get('/results/admin', async (req, res) => {
  let conn = null;
  const { materi_id, student_id, limit = 50 } = req.query;
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
    const results = result.rows.map(row => ({
      id: row.ATTEMPT_ID, student_id: row.USER_ID, student_name: row.STUDENT_NAME || 'Unknown Student',
      student_email: row.STUDENT_EMAIL || '', materi_id: row.MATERI_ID, materi_title: row.MATERI_TITLE || 'Unknown Material',
      score: row.SCORE, total_questions: row.TOTAL_QUESTIONS, correct_answers: row.CORRECT_ANSWERS,
      passed: row.PASSED === 1, completed_at: row.COMPLETED_AT
    }));
    res.json(results);
  } catch (err) {
    console.error(`[quiz.js] API GET /results/admin - Error:`, err.message, err.stack);
    res.status(500).json({ success: false, message: 'Gagal mengambil hasil quiz admin.', error: err.message });
  } finally {
    if (conn) { try { await conn.close(); } catch(e) { console.error("[quiz.js] Error close conn GET /results/admin:", e.message); }}
  }
});

router.post('/add', async (req, res) => {
  const { materi_id, soal, a, b, c, d, jawaban } = req.body;
  if (!materi_id || !soal || !a || !b || !c || !d || !jawaban) {
    return res.status(400).json({ success: false, message: "Semua field wajib diisi!" });
  }
  if (!['A', 'B', 'C', 'D'].includes(jawaban.toUpperCase())) {
    return res.status(400).json({ success: false, message: "Jawaban harus A, B, C, atau D." });
  }
  let conn = null;
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
    res.status(201).json({ success: true, message: "Quiz berhasil ditambahkan!", quizId: newQuizId });
  } catch (err) {
    console.error("[quiz.js] API POST /add - Error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Gagal menambah quiz.", error: err.message });
  } finally {
    if (conn) { try { await conn.close(); } catch (e) { console.error("[quiz.js] Error close conn POST /add:", e.message); }}
  }
});

router.get('/by-materi/:materi_id_param', async (req, res) => {
  let conn = null; const { materi_id_param } = req.params;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id, soal, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawaban
       FROM quiz WHERE materi_id = :idbv ORDER BY id ASC`, { idbv: materi_id_param }
    );
    if (!result.rows || !Array.isArray(result.rows)) { return res.json([]); }
    const quizzesPromises = result.rows.map(async (row) => {
      if (typeof row !== 'object' || row === null) return null;
      const soalString = await lobToString(row.SOAL, `SOAL (by-materi, ID: ${row.ID})`).catch(e => "Error soal");
      const pilihanAString = await lobToString(row.PILIHAN_A, `PILIHAN_A (by-materi, ID: ${row.ID})`).catch(e => "Error A");
      const pilihanBString = await lobToString(row.PILIHAN_B, `PILIHAN_B (by-materi, ID: ${row.ID})`).catch(e => "Error B");
      const pilihanCString = await lobToString(row.PILIHAN_C, `PILIHAN_C (by-materi, ID: ${row.ID})`).catch(e => "Error C");
      const pilihanDString = await lobToString(row.PILIHAN_D, `PILIHAN_D (by-materi, ID: ${row.ID})`).catch(e => "Error D");
      const jawabanString = await lobToString(row.JAWABAN, `JAWABAN (by-materi, ID: ${row.ID})`).catch(e => "Error J");
      return { id: row.ID, soal: soalString, pilihan_a: pilihanAString, pilihan_b: pilihanBString, pilihan_c: pilihanCString, pilihan_d: pilihanDString, jawaban: jawabanString };
    });
    const quizzes = (await Promise.all(quizzesPromises)).filter(q => q !== null);
    res.json(quizzes);
  } catch (err) {
    console.error(`[quiz.js] API GET /by-materi/:materi_id_param - Error:`, err.message, err.stack);
    res.status(500).json({ success: false, message: "Gagal mengambil quiz by-materi.", error: err.message });
  } finally {
    if (conn) try { await conn.close(); } catch (e) { console.error("[quiz.js] Error close conn GET /by-materi:", e.message); }
  }
});

module.exports = router;