const FocusSession = require('../models/FocusSession');
const Task = require('../models/Task');
const { createInAppAlert } = require('../services/reminderService');

exports.startSession = async (req, res) => {
  try {
    const { taskId, notes } = req.body;

    const session = await FocusSession.create({
      student: req.user._id,
      task: taskId || null,
      startTime: new Date(),
      status: 'active',
      notes: notes || ''
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to start focus session', error: err.message });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const { sessionId, durationMinutes, notes, status } = req.body;
    const session = await FocusSession.findOne({ _id: sessionId, student: req.user._id });
    if (!session) return res.status(404).json({ message: 'Focus session not found' });

    session.endTime = new Date();
    session.durationMinutes = Number(durationMinutes) || Math.max(1, Math.round((session.endTime - session.startTime) / 60000));
    session.status = status || 'completed';
    if (notes) session.notes = notes;

    await session.save();

    // If session was tied to a task, increment task's actualTimeSpent
    if (session.task) {
      await Task.findByIdAndUpdate(session.task, {
        $inc: { actualTimeSpent: session.durationMinutes }
      });
    }

    // Send in-app reward / alert
    await createInAppAlert(req.user._id, {
      title: 'Focus Session Completed',
      message: `Great focus! You completed a ${session.durationMinutes} minute deep work session.`,
      type: 'focus_completed',
      severity: 'success',
      relatedTaskId: session.task
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete focus session', error: err.message });
  }
};

exports.getFocusStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const sessions = await FocusSession.find({ student: studentId, status: 'completed' })
      .populate('task')
      .sort({ createdAt: -1 });

    const totalMinutesToday = sessions
      .filter(s => new Date(s.createdAt) >= startOfToday)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    const totalMinutesWeek = sessions
      .filter(s => new Date(s.createdAt) >= startOfWeek)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    const totalMinutesAllTime = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    res.json({
      totalMinutesToday,
      totalMinutesWeek,
      totalMinutesAllTime,
      totalCompletedSessions: sessions.length,
      recentSessions: sessions.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch focus stats', error: err.message });
  }
};
