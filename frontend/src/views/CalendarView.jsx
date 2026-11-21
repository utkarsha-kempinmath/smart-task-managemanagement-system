import React, { useState, useEffect } from 'react';
import api from '../api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';

export default function CalendarView({ setActiveTab }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks').then(res => {
      setTasks(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Map dates to tasks
  const getTasksForDate = (dateStr) => {
    return tasks.filter(t => {
      const taskDate = new Date(t.deadline).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const selectedTasks = getTasksForDate(selectedDate);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Academic Calendar & Deadline Schedule
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Cross-reference project milestones, assignment deadlines, and exam schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={prevMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => {
              setCurrentMonthDate(new Date());
              setSelectedDate(todayStr);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            Today
          </button>
        </div>
      </div>

      {/* Grid: 7 Cols Calendar + Right Side Selected Day Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-3 text-center text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty offset slots */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[70px] rounded-lg bg-zinc-50/40 dark:bg-zinc-900/20" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayTasks = getTasksForDate(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[70px] p-2 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-zinc-900 dark:border-zinc-200 ring-1 ring-zinc-900 dark:ring-zinc-200 bg-zinc-50 dark:bg-zinc-800/80'
                      : isToday
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#18181b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-semibold ${
                      isToday ? 'text-emerald-500' : 'text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </div>

                  {dayTasks.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {dayTasks.slice(0, 2).map(t => (
                        <p key={t._id} className="text-[10px] truncate text-zinc-500 dark:text-zinc-400 font-medium leading-none">
                          • {t.title}
                        </p>
                      ))}
                      {dayTasks.length > 2 && (
                        <p className="text-[9px] text-zinc-400 font-mono">+{dayTasks.length - 2} more</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Selected Date
              </h3>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">
                {new Date(selectedDate).toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {selectedTasks.length} Due
            </span>
          </div>

          <div className="space-y-3">
            {selectedTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No assignment deadlines on this date.
              </div>
            ) : (
              selectedTasks.map((t) => (
                <div
                  key={t._id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">{t.category?.name || 'Task'}</span>
                    <span className="text-amber-500 font-semibold">{t.priority}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
                    <span>Est: {t.estimatedTime}h</span>
                    <span>Score: {t.smartPriorityScore}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
