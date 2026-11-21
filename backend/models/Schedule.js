const mongoose = require('mongoose');

const scheduleSlotSchema = new mongoose.Schema({
  slotId: {
    type: String,
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  taskTitle: {
    type: String,
    default: ''
  },
  startTime: {
    type: String, // e.g. "09:00"
    required: true
  },
  endTime: {
    type: String, // e.g. "10:00"
    required: true
  },
  slotType: {
    type: String,
    enum: ['study', 'break', 'review'],
    default: 'study'
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['planned', 'completed', 'skipped'],
    default: 'planned'
  }
});

const scheduleSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  slots: [scheduleSlotSchema],
  totalStudyMinutes: {
    type: Number,
    default: 0
  },
  totalBreakMinutes: {
    type: Number,
    default: 0
  },
  tasksScheduledCount: {
    type: Number,
    default: 0
  },
  feasibilityRating: {
    type: String,
    enum: ['optimal', 'heavy', 'overloaded'],
    default: 'optimal'
  },
  heuristicNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

scheduleSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
