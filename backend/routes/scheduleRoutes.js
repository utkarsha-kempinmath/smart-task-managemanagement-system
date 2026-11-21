const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/generate', scheduleController.generateSmartSchedule);
router.get('/:date', scheduleController.getScheduleByDate);
router.patch('/slot', scheduleController.updateSlotStatus);

module.exports = router;
