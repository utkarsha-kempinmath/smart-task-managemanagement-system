const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  // Student specific fields
  course: {
    type: String,
    default: 'General Computer Science'
  },
  semester: {
    type: Number,
    default: 1
  },
  studyPreferences: {
    workStartHour: { type: Number, default: 9 }, // 9 AM
    workEndHour: { type: Number, default: 18 }, // 6 PM
    defaultBlockDurationMinutes: { type: Number, default: 60 },
    breakDurationMinutes: { type: Number, default: 15 },
    dailyTargetHours: { type: Number, default: 5 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
