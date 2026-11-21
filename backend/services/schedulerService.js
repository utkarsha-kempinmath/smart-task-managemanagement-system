const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const User = require('../models/User');

function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hStr}:${mStr}`;
}

async function generateSmartScheduleForStudent(studentId, dateString, options = {}) {
  const student = await User.findById(studentId);
  if (!student) throw new Error('Student not found');

  const prefs = student.studyPreferences || {};
  const startHour = options.startHour !== undefined ? Number(options.startHour) : (prefs.workStartHour || 9);
  const endHour = options.endHour !== undefined ? Number(options.endHour) : (prefs.workEndHour || 18);
  const blockMinutes = options.blockDurationMinutes || prefs.defaultBlockDurationMinutes || 60;
  const breakMinutes = options.breakDurationMinutes || prefs.breakDurationMinutes || 15;

  // Fetch pending or in-progress tasks for this student, sorted by highest smartPriorityScore
  const pendingTasks = await Task.find({
    student: studentId,
    status: { $ne: 'completed' }
  }).sort({ smartPriorityScore: -1 });

  const totalAvailableDayMinutes = (endHour - startHour) * 60;
  let currentMinute = startHour * 60;
  const endMinute = endHour * 60;

  const slots = [];
  let taskIndex = 0;
  let taskRemainingMinutes = 0;
  let currentTask = null;

  if (pendingTasks.length > 0) {
    currentTask = pendingTasks[0];
    taskRemainingMinutes = Math.max(30, Math.round((currentTask.estimatedTime || 1) * 60));
  }

  let totalStudyMinutes = 0;
  let totalBreakMinutes = 0;
  let slotCounter = 1;
  const scheduledTaskIds = new Set();

  while (currentMinute + 30 <= endMinute) {
    const remainingDayTime = endMinute - currentMinute;

    // Determine study block length (don't exceed blockMinutes or remaining time in day)
    const thisBlockDuration = Math.min(blockMinutes, remainingDayTime);
    if (thisBlockDuration < 25) break;

    const slotStartTime = formatTime(currentMinute);
    const slotEndTime = formatTime(currentMinute + thisBlockDuration);

    let assignedTask = null;
    let title = 'Independent Study & Catch-up';

    if (currentTask) {
      assignedTask = currentTask;
      title = `${currentTask.title}`;
      scheduledTaskIds.add(currentTask._id.toString());

      taskRemainingMinutes -= thisBlockDuration;

      // If this task has been fully allotted, advance to next pending task
      if (taskRemainingMinutes <= 15) {
        taskIndex++;
        if (taskIndex < pendingTasks.length) {
          currentTask = pendingTasks[taskIndex];
          taskRemainingMinutes = Math.max(30, Math.round((currentTask.estimatedTime || 1) * 60));
        } else {
          currentTask = null;
          taskRemainingMinutes = 0;
        }
      }
    }

    slots.push({
      slotId: `slot-${slotCounter++}`,
      task: assignedTask ? assignedTask._id : null,
      taskTitle: title,
      startTime: slotStartTime,
      endTime: slotEndTime,
      slotType: 'study',
      durationMinutes: thisBlockDuration,
      status: 'planned'
    });

    currentMinute += thisBlockDuration;
    totalStudyMinutes += thisBlockDuration;

    // Add rest interval if time remains before day ends
    if (currentMinute + breakMinutes + 30 <= endMinute) {
      const breakStart = formatTime(currentMinute);
      const breakEnd = formatTime(currentMinute + breakMinutes);

      slots.push({
        slotId: `slot-${slotCounter++}`,
        task: null,
        taskTitle: 'Cognitive Reset & Hydration Break',
        startTime: breakStart,
        endTime: breakEnd,
        slotType: 'break',
        durationMinutes: breakMinutes,
        status: 'planned'
      });

      currentMinute += breakMinutes;
      totalBreakMinutes += breakMinutes;
    }
  }

  // Workload and Feasibility Heuristic Analysis
  const totalPendingWorkHours = pendingTasks.reduce((acc, t) => acc + (t.estimatedTime || 1), 0);
  const plannedStudyHours = (totalStudyMinutes / 60).toFixed(1);

  let feasibilityRating = 'optimal';
  let heuristicNotes = `Smart time-blocking generated ${slots.filter(s => s.slotType === 'study').length} focus blocks with periodic breaks.`;

  if (totalPendingWorkHours > (totalStudyMinutes / 60) * 1.5) {
    feasibilityRating = 'overloaded';
    heuristicNotes = `Backlog alert: Total required workload (${totalPendingWorkHours}h) exceeds today's focus window (${plannedStudyHours}h). Highest impact items have been prioritized first.`;
  } else if (totalPendingWorkHours > (totalStudyMinutes / 60)) {
    feasibilityRating = 'heavy';
    heuristicNotes = `Full day load: ${plannedStudyHours}h allocated to address critical deadlines. Ensure short breaks are observed.`;
  } else {
    feasibilityRating = 'optimal';
    heuristicNotes = `Balanced schedule: All priority deliverables have reserved focus slots without overload.`;
  }

  // Upsert schedule document for student and date
  const schedule = await Schedule.findOneAndUpdate(
    { student: studentId, date: dateString },
    {
      student: studentId,
      date: dateString,
      slots,
      totalStudyMinutes,
      totalBreakMinutes,
      tasksScheduledCount: scheduledTaskIds.size,
      feasibilityRating,
      heuristicNotes
    },
    { new: true, upsert: true }
  ).populate('slots.task');

  return schedule;
}

module.exports = {
  generateSmartScheduleForStudent
};
