const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Algorithmic smart priority score (0 - 150) calculated by TaskAnalyzer
  smartPriorityScore: {
    type: Number,
    default: 50
  },
  smartQuadrant: {
    type: String,
    enum: ['Urgent & Important', 'Important / Strategic', 'Urgent / Low Effort', 'Backlog / Flexible'],
    default: 'Important / Strategic'
  },
  smartRecommendation: {
    type: String,
    default: ''
  },
  estimatedTime: {
    type: Number, // in hours
    required: true,
    default: 1
  },
  actualTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
