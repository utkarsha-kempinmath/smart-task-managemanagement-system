const Notification = require('../models/Notification');
const Task = require('../models/Task');

async function syncInAppRemindersForStudent(studentId) {
  const now = new Date();
  const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Check for tasks due within 24 hours
  const upcomingTasks = await Task.find({
    student: studentId,
    status: { $ne: 'completed' },
    deadline: { $gte: now, $lte: dayFromNow }
  });

  for (const task of upcomingTasks) {
    const hoursLeft = Math.max(1, Math.round((new Date(task.deadline).getTime() - now.getTime()) / (1000 * 60 * 60)));
    
    // Check if notification already exists within 12 hours
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const existing = await Notification.findOne({
      recipient: studentId,
      relatedTaskId: task._id,
      type: 'deadline_warning',
      createdAt: { $gte: twelveHoursAgo }
    });

    if (!existing) {
      await Notification.create({
        recipient: studentId,
        title: `Upcoming Deadline: ${task.title}`,
        message: `Task is due in ${hoursLeft} hour(s). Estimated effort: ${task.estimatedTime}h.`,
        type: 'deadline_warning',
        severity: hoursLeft <= 6 ? 'critical' : 'warning',
        relatedTaskId: task._id
      });
    }
  }

  // 2. Check for overdue tasks
  const overdueTasks = await Task.find({
    student: studentId,
    status: { $ne: 'completed' },
    deadline: { $lt: now }
  });

  for (const task of overdueTasks) {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const existing = await Notification.findOne({
      recipient: studentId,
      relatedTaskId: task._id,
      type: 'overdue',
      createdAt: { $gte: oneDayAgo }
    });

    if (!existing) {
      await Notification.create({
        recipient: studentId,
        title: `Overdue Task: ${task.title}`,
        message: `This task passed its deadline on ${new Date(task.deadline).toLocaleDateString()}. Please reschedule or complete it.`,
        type: 'overdue',
        severity: 'critical',
        relatedTaskId: task._id
      });
    }
  }
}

async function createInAppAlert(recipientId, { title, message, type = 'system', severity = 'info', relatedTaskId = null }) {
  return await Notification.create({
    recipient: recipientId,
    title,
    message,
    type,
    severity,
    relatedTaskId
  });
}

module.exports = {
  syncInAppRemindersForStudent,
  createInAppAlert
};
