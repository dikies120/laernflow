const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

router.get('/materi/:materiId', quizController.getQuizByMateriId);
router.get('/user/:userId/materi/:materiId/last-attempt-status', quizController.getLastAttemptStatus);
router.post('/submit-score', quizController.submitScore);
router.get('/results/student/:studentId', quizController.getResultsByStudent);
router.get('/results/admin', quizController.getResultsAdmin);
router.post('/add', quizController.addQuiz);
router.get('/by-materi/:materi_id_param', quizController.getQuizByMateriIdParam);

module.exports = router;