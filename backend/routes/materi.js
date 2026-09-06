const express = require('express');
const router = express.Router();
const materiController = require('../controllers/materiController');
const { uploadMateri } = require('../middlewares/uploadMiddleware');

router.get('/crud-materi', materiController.getAllMateri);
router.post('/crud-materi', uploadMateri, materiController.createMateri);
router.delete('/crud-materi/:id', materiController.deleteMateri);

module.exports = router;