const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

router.get('/students', adminController.getStudents);
router.patch('/students/:id/toggle', adminController.toggleStudentStatus);
router.get('/reports', adminController.getSystemReports);
router.post('/broadcast', adminController.broadcastAlert);

module.exports = router;
