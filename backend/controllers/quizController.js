const QuizModel = require('../models/QuizModel');

class QuizController {
  static async getQuizByMateriId(req, res) {
    const { materiId } = req.params;
    try {
      const quizzes = await QuizModel.getQuizByMateriId(materiId);
      res.json(quizzes);
    } catch (err) {
      console.error(`[quizController.js] API GET /materi/:materiId - Error:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil data quiz.', error: err.message });
    }
  }

  static async getLastAttemptStatus(req, res) {
    const { userId, materiId } = req.params;
    if (!userId || isNaN(parseInt(userId)) || !materiId || isNaN(parseInt(materiId))) {
      return res.status(400).json({ success: false, message: "User ID atau Materi ID tidak valid." });
    }

    try {
      const lastAttempt = await QuizModel.getLastAttemptStatus(parseInt(userId), parseInt(materiId));
      if (lastAttempt) {
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
      console.error(`[quizController.js] Error fetching last quiz attempt:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil status kuis terakhir.', error: err.message });
    }
  }

  static async submitScore(req, res) {
    const { student_id, materi_id, score, total_questions } = req.body;
    if (student_id === undefined || materi_id === undefined || score === undefined || total_questions === undefined) {
      return res.status(400).json({ success: false, message: "Student ID, Materi ID, score, dan total questions wajib diisi!" });
    }

    try {
      const result = await QuizModel.submitScore(student_id, materi_id, score, total_questions);
      res.status(201).json({ success: true, message: "Skor quiz berhasil disimpan!", attemptId: result.attemptId, percentage: result.percentage, passed: result.passed === 1 });
    } catch (err) {
      console.error("[quizController.js] API POST /submit-score - Error:", err);
      res.status(500).json({ success: false, message: "Gagal menyimpan skor quiz.", error: err.message });
    }
  }

  static async getResultsByStudent(req, res) {
    const { studentId } = req.params;
    const { materi_id } = req.query;
    try {
      const rows = await QuizModel.getResultsByStudent(studentId, materi_id);
      const results = rows.map(row => ({
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
      console.error(`[quizController.js] API GET /results/student/:studentId - Error:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil hasil quiz untuk student.', error: err.message });
    }
  }

  static async getResultsAdmin(req, res) {
    const { materi_id, student_id, limit = 50 } = req.query;
    try {
      const rows = await QuizModel.getResultsAdmin(materi_id, student_id, limit);
      const results = rows.map(row => ({
        id: row.ATTEMPT_ID, student_id: row.USER_ID, student_name: row.STUDENT_NAME || 'Unknown Student',
        student_email: row.STUDENT_EMAIL || '', materi_id: row.MATERI_ID, materi_title: row.MATERI_TITLE || 'Unknown Material',
        score: row.SCORE, total_questions: row.TOTAL_QUESTIONS, correct_answers: row.CORRECT_ANSWERS,
        passed: row.PASSED === 1, completed_at: row.COMPLETED_AT
      }));
      res.json(results);
    } catch (err) {
      console.error(`[quizController.js] API GET /results/admin - Error:`, err.message, err.stack);
      res.status(500).json({ success: false, message: 'Gagal mengambil hasil quiz admin.', error: err.message });
    }
  }

  static async addQuiz(req, res) {
    const { materi_id, soal, a, b, c, d, jawaban } = req.body;
    if (!materi_id || !soal || !a || !b || !c || !d || !jawaban) {
      return res.status(400).json({ success: false, message: "Semua field wajib diisi!" });
    }
    if (!['A', 'B', 'C', 'D'].includes(jawaban.toUpperCase())) {
      return res.status(400).json({ success: false, message: "Jawaban harus A, B, C, atau D." });
    }
    try {
      const quizId = await QuizModel.addQuiz(materi_id, soal, a, b, c, d, jawaban);
      res.status(201).json({ success: true, message: "Quiz berhasil ditambahkan!", quizId });
    } catch (err) {
      console.error("[quizController.js] API POST /add - Error:", err.message, err.stack);
      res.status(500).json({ success: false, message: "Gagal menambah quiz.", error: err.message });
    }
  }

  // by-materi is the same logic as getQuizByMateriId
  static async getQuizByMateriIdParam(req, res) {
    const { materi_id_param } = req.params;
    try {
      const quizzes = await QuizModel.getQuizByMateriId(materi_id_param);
      res.json(quizzes);
    } catch (err) {
      console.error(`[quizController.js] API GET /by-materi/:materi_id_param - Error:`, err.message, err.stack);
      res.status(500).json({ success: false, message: "Gagal mengambil quiz by-materi.", error: err.message });
    }
  }
}

module.exports = QuizController;
