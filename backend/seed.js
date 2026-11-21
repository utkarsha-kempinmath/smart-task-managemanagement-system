require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Task = require('./models/Task');
const Schedule = require('./models/Schedule');
const FocusSession = require('./models/FocusSession');
const Notification = require('./models/Notification');
const { analyzeTask } = require('./services/taskAnalyzer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttask_db';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Task.deleteMany({});
    await Schedule.deleteMany({});
    await FocusSession.deleteMany({});
    await Notification.deleteMany({});

    console.log('Cleared existing collections.');

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@smarttask.com',
      password: 'admin123',
      role: 'admin'
    });

    // 2. Create Student
    const student = await User.create({
      name: 'Alex Rivera',
      email: 'student@smarttask.com',
      password: 'student123',
      role: 'student',
      course: 'B.S. Software Engineering',
      semester: 4,
      studyPreferences: {
        workStartHour: 9,
        workEndHour: 18,
        defaultBlockDurationMinutes: 60,
        breakDurationMinutes: 15,
        dailyTargetHours: 5
      }
    });

    // Another student for admin multi-student view
    const student2 = await User.create({
      name: 'Elena Rostova',
      email: 'elena@smarttask.com',
      password: 'student123',
      role: 'student',
      course: 'M.S. Data Informatics',
      semester: 2,
      studyPreferences: {
        workStartHour: 10,
        workEndHour: 19,
        defaultBlockDurationMinutes: 50,
        breakDurationMinutes: 10,
        dailyTargetHours: 6
      }
    });

    // 3. Create Categories
    const categories = await Category.insertMany([
      {
        name: 'Distributed Systems & Cloud',
        description: 'Microservices, APIs, deployment and cloud architecture',
        color: '#52525b', // slate/zinc
        isSystemDefault: true,
        createdBy: admin._id
      },
      {
        name: 'Database Engineering',
        description: 'NoSQL schema design, aggregation pipelines, performance',
        color: '#78716c', // warm stone
        isSystemDefault: true,
        createdBy: admin._id
      },
      {
        name: 'Algorithms & Discrete Math',
        description: 'Complexity analysis, graph traversals, dynamic programming',
        color: '#44403c', // warm charcoal
        isSystemDefault: true,
        createdBy: admin._id
      },
      {
        name: 'UI/UX & Product Design',
        description: 'Design systems, accessibility, usability testing',
        color: '#059669', // tasteful emerald accent (clean, zero purple/blue)
        isSystemDefault: true,
        createdBy: admin._id
      }
    ]);

    // 4. Create Sample Tasks for Student 1
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const taskBlueprints = [
      {
        title: 'Complete Distributed Systems Milestone 2',
        description: 'Implement distributed consensus prototype and write benchmark comparison report.',
        category: categories[0]._id,
        student: student._id,
        deadline: today,
        priority: 'urgent',
        estimatedTime: 3.5,
        status: 'in-progress',
        actualTimeSpent: 90
      },
      {
        title: 'Review MongoDB Aggregation Pipeline Queries',
        description: 'Optimize multi-stage index queries for platform reporting dashboard.',
        category: categories[1]._id,
        student: student._id,
        deadline: tomorrow,
        priority: 'high',
        estimatedTime: 2.0,
        status: 'pending',
        actualTimeSpent: 0
      },
      {
        title: 'Graph Traversal Dynamic Programming Problem Set',
        description: 'Solve problem set 4 covering Dijkstra variations and memoization.',
        category: categories[2]._id,
        student: student._id,
        deadline: threeDaysOut,
        priority: 'medium',
        estimatedTime: 2.5,
        status: 'pending',
        actualTimeSpent: 0
      },
      {
        title: 'Product Heuristics & Design System Audit',
        description: 'Evaluate color contrast ratios and navigation hierarchy against WCAG AAA standards.',
        category: categories[3]._id,
        student: student._id,
        deadline: nextWeek,
        priority: 'low',
        estimatedTime: 1.5,
        status: 'pending',
        actualTimeSpent: 0
      },
      {
        title: 'Read System Architecture Research Paper',
        description: 'Review foundational paper on high throughput transactional databases.',
        category: categories[0]._id,
        student: student._id,
        deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday (completed)
        priority: 'medium',
        estimatedTime: 1.0,
        status: 'completed',
        completedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        actualTimeSpent: 60
      }
    ];

    for (const raw of taskBlueprints) {
      const analysis = analyzeTask(raw);
      await Task.create({
        ...raw,
        smartPriorityScore: analysis.smartPriorityScore,
        smartQuadrant: analysis.smartQuadrant,
        smartRecommendation: analysis.smartRecommendation
      });
    }

    // 5. Create Sample Focus Session
    await FocusSession.create({
      student: student._id,
      task: (await Task.findOne({ student: student._id }))?._id,
      startTime: new Date(now.getTime() - 120 * 60 * 1000),
      endTime: new Date(now.getTime() - 60 * 60 * 1000),
      durationMinutes: 60,
      status: 'completed',
      notes: 'Deep focus on consensus protocol unit tests. High retention.'
    });

    // 6. Create in-app Notifications for Student
    await Notification.create([
      {
        recipient: student._id,
        title: 'Priority Deadline Approaching',
        message: 'Milestone 2 is due tonight at 20:00. 3.5 hours of estimated effort allocated.',
        type: 'deadline_warning',
        severity: 'critical'
      },
      {
        recipient: student._id,
        title: 'Smart Schedule Available',
        message: 'Your algorithmic daily study schedule has been computed based on current deadlines.',
        type: 'schedule_ready',
        severity: 'info'
      }
    ]);

    console.log('Seeding completed successfully!');
    console.log('Admin Account: admin@smarttask.com / admin123');
    console.log('Student Account: student@smarttask.com / student123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
