const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { uploadProfilePic } = require('../middlewares/uploadMiddleware');

router.get('/siswa', usersController.getSiswa);
router.get('/:userId/profile', usersController.getProfile);
router.put('/:userId/profile', uploadProfilePic, usersController.updateProfile);
router.post('/:userId/materi/:materiId/complete', usersController.completeMaterial);
router.get('/:userId/dashboard-stats', usersController.getDashboardStats);
router.delete('/:userId', usersController.deleteUser);
router.get('/:userId/material-progress', usersController.getMaterialProgress);

module.exports = router;