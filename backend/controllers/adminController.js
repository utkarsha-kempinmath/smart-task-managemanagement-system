const User = require('../models/User');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const Notification = require('../models/Notification');

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });

    // Enhance students with stats
    const enhanced = await Promise.all(students.map(async (student) => {
      const taskCount = await Task.countDocuments({ student: student._id });
      const completedCount = await Task.countDocuments({ student: student._id, status: 'completed' });
      const focusSessions = await FocusSession.find({ student: student._id, status: 'completed' });
      const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      return {
        ...student.toObject(),
        taskCount,
        completedCount,
        completionRate: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
        totalFocusMinutes,
        totalFocusHours: (totalFocusMinutes / 60).toFixed(1)
      };
    }));

    res.json(enhanced);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students', error: err.message });
  }
};

exports.toggleStudentStatus = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.isActive = !student.isActive;
    await student.save();

    res.json({ message: `Student account ${student.isActive ? 'activated' : 'deactivated'}`, student });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update student status', error: err.message });
  }
};

exports.getSystemReports = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });

    const focusSessions = await FocusSession.find({ status: 'completed' });
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    // Tasks by priority
    const priorityBreakdown = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Tasks by Eisenhower quadrant
    const quadrantBreakdown = await Task.aggregate([
      { $group: { _id: '$smartQuadrant', count: { $sum: 1 } } }
    ]);

    res.json({
      metrics: {
        totalStudents,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overallCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
        totalFocusSessions: focusSessions.length
      },
      priorityBreakdown,
      quadrantBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate system reports', error: err.message });
  }
};

exports.broadcastAlert = async (req, res) => {
  try {
    const { title, message, severity } = req.body;
    if (!title || !message) return res.status(400).json({ message: 'Title and message are required' });

    const students = await User.find({ role: 'student' }).select('_id');
    const alerts = students.map(s => ({
      recipient: s._id,
      title,
      message,
      type: 'system',
      severity: severity || 'info'
    }));

    await Notification.insertMany(alerts);
    res.json({ message: `Alert broadcasted to ${students.length} students` });
  } catch (err) {
    res.status(500).json({ message: 'Broadcast failed', error: err.message });
  }
};
