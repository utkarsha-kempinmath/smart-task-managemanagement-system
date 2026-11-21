const express = require('express');
const router = express.Router();
const focusController = require('../controllers/focusController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', focusController.startSession);
router.post('/complete', focusController.completeSession);
router.get('/stats', focusController.getFocusStats);

module.exports = router;
