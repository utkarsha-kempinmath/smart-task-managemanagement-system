import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotifications } from '../context/NotificationContext';
import {
  Calendar,
  Clock,
  Settings,
  Sparkles,
  CheckCircle,
  Play,
  Coffee,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function ScheduleView({ onStartFocusTask, setActiveTab }) {
  const { triggerToast } = useNotifications();
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [config, setConfig] = useState({
    startHour: 9,
    endHour: 18,
    blockDurationMinutes: 60,
    breakDurationMinutes: 15
  });

  const fetchSchedule = async (date) => {
    try {
      setLoading(true);
      const res = await api.get(`/schedule/${date}`);
      setSchedule(res.data);
    } catch (err) {
      console.error('Failed to get schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(currentDate);
  }, [currentDate]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/schedule/generate', {
        date: currentDate,
        ...config
      });
      setSchedule(res.data);
      setShowConfig(false);
      triggerToast('Algorithmic time-blocking updated for selected date.', 'Smart Schedule Generated', 'success');
    } catch (err) {
      triggerToast('Failed to generate schedule', 'Error', 'critical');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateSlotStatus = async (slotId, newStatus) => {
    try {
      const res = await api.patch('/schedule/slot', {
        date: currentDate,
        slotId,
        status: newStatus
      });
      setSchedule(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const changeDateBy = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Smart Time-Blocking Schedule
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Algorithmic study intervals calculated to prevent cognitive overload.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker Bar */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => changeDateBy(-1)}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200">
              {new Date(currentDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={() => changeDateBy(1)}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preferences</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>Generate Schedule</span>
          </button>
        </div>
      </div>

      {/* Study Window Configuration Drawer */}
      {showConfig && (
        <div className="p-4 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4 animate-scale-up">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Study Window & Time-Block Parameters
            </h3>
            <span className="text-[11px] text-zinc-400">Customizes daily capacity</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Start Hour (24h)</label>
              <input
                type="number"
                min="5"
                max="12"
                value={config.startHour}
                onChange={(e) => setConfig({ ...config, startHour: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">End Hour (24h)</label>
              <input
                type="number"
                min="13"
                max="23"
                value={config.endHour}
                onChange={(e) => setConfig({ ...config, endHour: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Focus Block (Min)</label>
              <input
                type="number"
                min="30"
                max="120"
                step="15"
                value={config.blockDurationMinutes}
                onChange={(e) => setConfig({ ...config, blockDurationMinutes: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Break Interval (Min)</label>
              <input
                type="number"
                min="5"
                max="30"
                step="5"
                value={config.breakDurationMinutes}
                onChange={(e) => setConfig({ ...config, breakDurationMinutes: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setShowConfig(false)}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Close
            </button>
            <button
              onClick={handleGenerate}
              className="px-3 py-1.5 text-xs font-medium rounded bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
            >
              Apply & Re-block
            </button>
          </div>
        </div>
      )}

      {/* Feasibility & Heuristic Analysis Banner */}
      {schedule && (
        <div className="p-4 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              schedule.feasibilityRating === 'optimal'
                ? 'bg-emerald-500/10 text-emerald-500'
                : schedule.feasibilityRating === 'heavy'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-rose-500/10 text-rose-500'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Feasibility: {schedule.feasibilityRating}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {schedule.tasksScheduledCount} tasks mapped
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {schedule.heuristicNotes}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:border-l sm:border-zinc-200 sm:dark:border-zinc-800 sm:pl-6 text-xs font-mono">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase">Focus Time</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{schedule.totalStudyMinutes} min</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase">Reset Time</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{schedule.totalBreakMinutes} min</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Slots */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading schedule...</div>
        ) : !schedule || schedule.slots.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl">
            No schedule planned for this date. Click "Generate Schedule" to compute optimal time blocks.
          </div>
        ) : (
          schedule.slots.map((slot) => {
            const isBreak = slot.slotType === 'break';
            const isCompleted = slot.status === 'completed';

            return (
              <div
                key={slot.slotId}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isBreak
                    ? 'bg-zinc-50/70 dark:bg-zinc-900/30 border-dashed border-zinc-300 dark:border-zinc-800/80 text-zinc-500'
                    : isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  {/* Time Badge */}
                  <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                    {slot.startTime} – {slot.endTime}
                  </div>

                  {/* Icon */}
                  <div className="mt-1 sm:mt-0">
                    {isBreak ? (
                      <Coffee className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${isBreak ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {slot.taskTitle}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {slot.durationMinutes} minutes duration • {isBreak ? 'Cognitive Reset' : 'Deep Study Block'}
                    </p>
                  </div>
                </div>

                {/* Slot Actions */}
                {!isBreak && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleUpdateSlotStatus(slot.slotId, isCompleted ? 'planned' : 'completed')}
                      className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 border transition-colors ${
                        isCompleted
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Finished' : 'Mark Done'}</span>
                    </button>

                    {slot.task && !isCompleted && (
                      <button
                        onClick={() => {
                          if (onStartFocusTask) onStartFocusTask(slot.task);
                          setActiveTab('focus');
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Enter Focus Mode"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
