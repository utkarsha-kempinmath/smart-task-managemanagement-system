const Task = require('../models/Task');
const Category = require('../models/Category');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { analyzeTask } = require('../services/taskAnalyzer');
const { createInAppAlert, syncInAppRemindersForStudent } = require('../services/reminderService');

exports.createTask = async (req, res) => {
  try {
    const { title, description, category, deadline, priority, estimatedTime, student, assignTo } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ message: 'Title and deadline are required' });
    }

    let targetCategory = category;
    if (!targetCategory) {
      let catDoc = await Category.findOne({ isSystemDefault: true });
      if (!catDoc) {
        catDoc = await Category.create({
          name: 'Academics & Coursework',
          color: '#2563eb',
          isSystemDefault: true
        });
      }
      targetCategory = catDoc._id;
    }

    // If Admin/Teacher is creating the task
    if (req.user.role === 'admin') {
      const isAssignAll = !student || student === 'all' || assignTo === 'all';

      if (isAssignAll) {
        // Assign to all students
        const students = await User.find({ role: 'student' });
        
        if (students.length === 0) {
          // Fallback if no student registered yet
          const taskData = {
            title,
            description: description || '',
            student: req.user._id,
            category: targetCategory,
            deadline: new Date(deadline),
            priority: priority || 'medium',
            estimatedTime: Number(estimatedTime) || 1
          };
          const analysis = analyzeTask(taskData);
          taskData.smartPriorityScore = analysis.smartPriorityScore;
          taskData.smartQuadrant = analysis.smartQuadrant;
          taskData.smartRecommendation = analysis.smartRecommendation;
          const task = await Task.create(taskData);
          const populated = await Task.findById(task._id).populate('category').populate('student', 'name email');
          return res.status(201).json(populated);
        }

        const createdTasks = [];
        for (const s of students) {
          const taskData = {
            title,
            description: description || '',
            student: s._id,
            category: targetCategory,
            deadline: new Date(deadline),
            priority: priority || 'medium',
            estimatedTime: Number(estimatedTime) || 1
          };
          const analysis = analyzeTask(taskData);
          taskData.smartPriorityScore = analysis.smartPriorityScore;
          taskData.smartQuadrant = analysis.smartQuadrant;
          taskData.smartRecommendation = analysis.smartRecommendation;
          const task = await Task.create(taskData);

          // Notify student
          await Notification.create({
            recipient: s._id,
            title: 'New Class Assignment',
            message: `Teacher assigned: "${title}" (Due: ${new Date(deadline).toLocaleDateString()})`,
            type: 'deadline_warning',
            severity: priority === 'urgent' ? 'critical' : 'info'
          });

          await syncInAppRemindersForStudent(s._id);
          createdTasks.push(task);
        }

        const populated = await Task.findById(createdTasks[0]._id).populate('category').populate('student', 'name email');
        return res.status(201).json(populated);
      } else {
        // Assign to a specific student
        const taskData = {
          title,
          description: description || '',
          student: student,
          category: targetCategory,
          deadline: new Date(deadline),
          priority: priority || 'medium',
          estimatedTime: Number(estimatedTime) || 1
        };
        const analysis = analyzeTask(taskData);
        taskData.smartPriorityScore = analysis.smartPriorityScore;
        taskData.smartQuadrant = analysis.smartQuadrant;
        taskData.smartRecommendation = analysis.smartRecommendation;
        const task = await Task.create(taskData);

        await Notification.create({
          recipient: student,
          title: 'New Assignment Assigned to You',
          message: `Teacher assigned: "${title}" (Due: ${new Date(deadline).toLocaleDateString()})`,
          type: 'deadline_warning',
          severity: priority === 'urgent' ? 'critical' : 'info'
        });

        await syncInAppRemindersForStudent(student);
        const populated = await Task.findById(task._id).populate('category').populate('student', 'name email');
        return res.status(201).json(populated);
      }
    }

    // Normal student self-assigned task
    const taskData = {
      title,
      description: description || '',
      student: req.user._id,
      category: targetCategory,
      deadline: new Date(deadline),
      priority: priority || 'medium',
      estimatedTime: Number(estimatedTime) || 1
    };

    const smartAnalysis = analyzeTask(taskData);
    taskData.smartPriorityScore = smartAnalysis.smartPriorityScore;
    taskData.smartQuadrant = smartAnalysis.smartQuadrant;
    taskData.smartRecommendation = smartAnalysis.smartRecommendation;

    const task = await Task.create(taskData);
    const populated = await Task.findById(task._id).populate('category');

    await syncInAppRemindersForStudent(req.user._id);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { status, category, priority, quadrant, sort, student } = req.query;
    
    // Filter by student: Admin can view all tasks or filter by student. Student only views own tasks.
    const filter = {};
    if (req.user.role === 'admin') {
      if (student && student !== 'all') {
        filter.student = student;
      }
    } else {
      filter.student = req.user._id;
    }

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;
    if (quadrant && quadrant !== 'all') filter.smartQuadrant = quadrant;

    let sortOptions = { smartPriorityScore: -1, deadline: 1 };
    if (sort === 'deadline_asc') sortOptions = { deadline: 1 };
    if (sort === 'deadline_desc') sortOptions = { deadline: -1 };
    if (sort === 'estimated_asc') sortOptions = { estimatedTime: 1 };
    if (sort === 'estimated_desc') sortOptions = { estimatedTime: -1 };

    // Refresh dynamic priority scores for active tasks
    const tasks = await Task.find(filter)
      .populate('category')
      .populate('student', 'name email course')
      .sort(sortOptions);

    const updatedTasks = await Promise.all(tasks.map(async (task) => {
      if (task.status !== 'completed') {
        const analysis = analyzeTask(task);
        if (analysis.smartPriorityScore !== task.smartPriorityScore) {
          task.smartPriorityScore = analysis.smartPriorityScore;
          task.smartQuadrant = analysis.smartQuadrant;
          task.smartRecommendation = analysis.smartRecommendation;
          await task.save();
        }
      }
      return task;
    }));

    res.json(updatedTasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('category')
      .populate('student', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && String(task.student._id || task.student) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task', error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && String(task.student) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { title, description, category, deadline, priority, estimatedTime, status, actualTimeSpent } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (category) task.category = category;
    if (deadline) task.deadline = new Date(deadline);
    if (priority) task.priority = priority;
    if (estimatedTime) task.estimatedTime = Number(estimatedTime);
    if (status) {
      task.status = status;
      if (status === 'completed' && !task.completedAt) {
        task.completedAt = new Date();
      }
    }
    if (actualTimeSpent !== undefined) task.actualTimeSpent = Number(actualTimeSpent);

    const analysis = analyzeTask(task);
    task.smartPriorityScore = analysis.smartPriorityScore;
    task.smartQuadrant = analysis.smartQuadrant;
    task.smartRecommendation = analysis.smartRecommendation;

    await task.save();
    const populated = await Task.findById(task._id).populate('category').populate('student', 'name email');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && String(task.student) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deliverable deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
};

exports.toggleTaskCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && String(task.student) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to modify this task' });
    }

    if (task.status === 'completed') {
      task.status = 'pending';
      task.completedAt = null;
    } else {
      task.status = 'completed';
      task.completedAt = new Date();
    }

    await task.save();
    const populated = await Task.findById(task._id).populate('category');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle task completion', error: err.message });
  }
};

exports.toggleTaskStatus = exports.toggleTaskCompletion;

exports.recalculateSmartScores = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { student: req.user._id };
    filter.status = { $ne: 'completed' };
    const tasks = await Task.find(filter);
    for (const task of tasks) {
      const analysis = analyzeTask(task);
      task.smartPriorityScore = analysis.smartPriorityScore;
      task.smartQuadrant = analysis.smartQuadrant;
      task.smartRecommendation = analysis.smartRecommendation;
      await task.save();
    }
    res.json({ message: 'Smart scores recalculated successfully', count: tasks.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to recalculate smart scores', error: err.message });
  }
};

