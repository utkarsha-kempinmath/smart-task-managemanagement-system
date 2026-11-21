import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Calendar,
  Layers
} from 'lucide-react';

export default function DashboardView({ setActiveTab, onStartFocusTask }) {
  const { user } = useAuth();
  const { triggerToast } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];

      const [taskRes, schedRes, focusRes] = await Promise.all([
        api.get('/tasks'),
        api.get(`/schedule/${todayStr}`),
        api.get('/focus/stats')
      ]);

      setTasks(taskRes.data);
      setSchedule(schedRes.data);
      setStats(focusRes.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await api.post('/tasks/recalculate');
      triggerToast('Smart priorities and urgency ratings re-evaluated against real-time clock.', 'Smart Engine Synced', 'info');
      await loadDashboardData();
    } catch (err) {
      triggerToast('Could not recalculate priorities', 'Error', 'critical');
    } finally {
      setRecalculating(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/toggle`);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const urgentCount = pendingTasks.filter(t => t.priority === 'urgent' || t.smartPriorityScore >= 85).length;
  const topPriorities = [...pendingTasks].sort((a, b) => b.smartPriorityScore - a.smartPriorityScore).slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & Algorithmic Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Smart Engine Active • Heuristic Mode
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {urgentCount > 0
              ? `You have ${urgentCount} urgent deliverable(s) prioritized for today's study blocks.`
              : `Your study schedule is balanced with ${pendingTasks.length} active deliverables.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
            title="Recalculate priority scores based on current time remaining"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            <span>Sync Priorities</span>
          </button>

          <button
            onClick={() => setActiveTab('focus')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Focus Session</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Tasks</span>
            <Layers className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {pendingTasks.length}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {completedTasks.length} completed this cycle
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Urgent Deliverables</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {urgentCount}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Deadlines within 48h
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Focus Time</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {stats?.totalMinutesToday || 0}m
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {stats?.totalCompletedSessions || 0} completed session(s)
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Completion Velocity</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Across registered assignments
          </p>
        </div>
      </div>

      {/* Main Grid: Priority Queue + Today's Time-Blocking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Smart Prioritized Tasks (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Algorithmic Priority Queue
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sorted by dynamic urgency, estimated hours, and deadline proximity
              </p>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topPriorities.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] text-zinc-500 text-xs">
                All tasks completed! Click "Tasks" to create new assignments.
              </div>
            ) : (
              topPriorities.map((task) => (
                <div
                  key={task._id}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task._id)}
                      className="mt-1 text-zinc-400 hover:text-emerald-500 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {task.category?.name || 'General'}
                        </span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Score: {task.smartPriorityScore}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                        {task.smartRecommendation || task.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est: {task.estimatedTime}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onStartFocusTask) onStartFocusTask(task);
                      setActiveTab('focus');
                    }}
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Focus on this task now"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Today's Time-Blocked Schedule (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Today's Time Blocks
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Generated study intervals
              </p>
            </div>
            <button
              onClick={() => setActiveTab('schedule')}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
            >
              <span>Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] space-y-3">
            {schedule?.slots && schedule.slots.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80 text-xs">
                  <span className="text-zinc-500 font-medium">Daily Window</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {schedule.slots[0].startTime} - {schedule.slots[schedule.slots.length - 1].endTime}
                  </span>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {schedule.slots.map((slot) => {
                    const isBreak = slot.slotType === 'break';
                    return (
                      <div
                        key={slot.slotId}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                          isBreak
                            ? 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-400'
                            : slot.status === 'completed'
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-zinc-100/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                            {slot.startTime}
                          </span>
                          <span className="truncate font-medium">
                            {slot.taskTitle}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                          {slot.durationMinutes}m
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>Feasibility: <strong className="capitalize text-zinc-800 dark:text-zinc-200">{schedule.feasibilityRating}</strong></span>
                  <span className="font-mono">{schedule.totalStudyMinutes}m study</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-zinc-400">
                No active schedule generated for today yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
