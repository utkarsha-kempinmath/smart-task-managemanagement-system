const Schedule = require('../models/Schedule');
const { generateSmartScheduleForStudent } = require('../services/schedulerService');

exports.generateSmartSchedule = async (req, res) => {
  try {
    const { date, startHour, endHour, blockDurationMinutes, breakDurationMinutes } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const schedule = await generateSmartScheduleForStudent(req.user._id, targetDate, {
      startHour,
      endHour,
      blockDurationMinutes,
      breakDurationMinutes
    });

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate schedule', error: err.message });
  }
};

exports.getScheduleByDate = async (req, res) => {
  try {
    const targetDate = req.params.date || new Date().toISOString().split('T')[0];
    let schedule = await Schedule.findOne({ student: req.user._id, date: targetDate }).populate('slots.task');

    if (!schedule) {
      // Auto generate initial schedule for today if none exists yet
      schedule = await generateSmartScheduleForStudent(req.user._id, targetDate);
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve schedule', error: err.message });
  }
};

exports.updateSlotStatus = async (req, res) => {
  try {
    const { date, slotId, status } = req.body;
    const schedule = await Schedule.findOne({ student: req.user._id, date });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    const slot = schedule.slots.find(s => s.slotId === slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    slot.status = status;
    await schedule.save();

    const populated = await Schedule.findById(schedule._id).populate('slots.task');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update slot', error: err.message });
  }
};
