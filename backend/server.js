const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const focusRoutes = require('./routes/focusRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttask_db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'SmartTask Backend API',
    message: 'SmartTask Backend API is running successfully on Render!',
    health: '/api/health',
    timestamp: new Date()
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'SmartTask MERN System',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB database successfully.');
    app.listen(PORT, () => {
      console.log(`SmartTask Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
