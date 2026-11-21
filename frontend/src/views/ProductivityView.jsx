import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart2,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Calendar,
  Layers
} from 'lucide-react';

export default function ProductivityView() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks'),
      api.get('/focus/stats'),
      api.get('/categories')
    ]).then(([tRes, fRes, cRes]) => {
      setTasks(tRes.data);
      setStats(fRes.data);
      setCategories(cRes.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  const completed = tasks.filter(t => t.status === 'completed');
  const completionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedTime || 1), 0);
  const totalActualMinutes = tasks.reduce((sum, t) => sum + (t.actualTimeSpent || 0), 0);

  // Group by category
  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => (t.category?._id === cat._id || t.category === cat._id));
    const catCompleted = catTasks.filter(t => t.status === 'completed').length;
    return {
      name: cat.name,
      total: catTasks.length,
      completed: catCompleted,
      rate: catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
    };
  }).filter(c => c.total > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Productivity Tracking & Study Velocity
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Quantified study metrics, focus endurance, and deliverable completion ratios.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {completionRate}%
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">
            {completed.length} of {tasks.length} tasks
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Logged Focus Time</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {(totalActualMinutes / 60).toFixed(1)}h
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">
            vs {totalEstimatedHours.toFixed(1)}h planned
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Week Focus Cadence</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {stats?.totalMinutesWeek || 0}m
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">
            Past 7 rolling days
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Sessions</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {stats?.totalCompletedSessions || 0}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">
            Deep focus intervals
          </p>
        </div>
      </div>

      {/* Category Progress Breakdown */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
          Academic Deliverable Velocity by Subject
        </h3>

        <div className="space-y-4">
          {categoryStats.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No category assignments found.</p>
          ) : (
            categoryStats.map(cat => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                  <span className="font-mono text-zinc-400">{cat.completed} / {cat.total} done ({cat.rate}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200 transition-all duration-500"
                    style={{ width: `${cat.rate}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Deep Work Session Logs */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
          Recent Focus Session Audit Trail
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="pb-3 font-medium">Session Date</th>
                <th className="pb-3 font-medium">Linked Deliverable</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Focus Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
              {!stats?.recentSessions || stats.recentSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-400 font-sans">
                    No focus sessions recorded yet. Launch a timer in the Focus tab!
                  </td>
                </tr>
              ) : (
                stats.recentSessions.map(s => (
                  <tr key={s._id} className="text-zinc-700 dark:text-zinc-300">
                    <td className="py-3">
                      {new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                      {s.task?.title || 'General Study'}
                    </td>
                    <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {s.durationMinutes} min
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] uppercase text-zinc-500">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 font-sans text-zinc-500 truncate max-w-xs">
                      {s.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
