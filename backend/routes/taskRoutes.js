const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(taskController.getTasks)
  .post(taskController.createTask);

router.route('/:id')
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

router.patch('/:id/toggle', taskController.toggleTaskStatus);
router.post('/recalculate', taskController.recalculateSmartScores);

module.exports = router;
