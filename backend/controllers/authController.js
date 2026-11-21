const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_task_planner_super_secret_jwt_key_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, course, semester, studyPreferences } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'student',
      course: course || 'Computer Science',
      semester: semester || 1,
      studyPreferences: studyPreferences || {
        workStartHour: 9,
        workEndHour: 18,
        defaultBlockDurationMinutes: 60,
        breakDurationMinutes: 15,
        dailyTargetHours: 5
      }
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        course: user.course,
        semester: user.semester,
        studyPreferences: user.studyPreferences
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        course: user.course,
        semester: user.semester,
        studyPreferences: user.studyPreferences
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      course: req.user.course,
      semester: req.user.semester,
      studyPreferences: req.user.studyPreferences
    }
  });
};

exports.updatePreferences = async (req, res) => {
  try {
    const { course, semester, studyPreferences, name } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (course) user.course = course;
    if (semester !== undefined) user.semester = semester;
    if (studyPreferences) {
      user.studyPreferences = {
        ...user.studyPreferences.toObject(),
        ...studyPreferences
      };
    }

    await user.save();

    res.json({
      message: 'Profile and preferences updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        course: user.course,
        semester: user.semester,
        studyPreferences: user.studyPreferences
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not update preferences', error: err.message });
  }
};
