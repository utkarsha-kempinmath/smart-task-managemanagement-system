import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import confetti from 'canvas-confetti';
import { useNotifications } from '../context/NotificationContext';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  BookOpen,
  Coffee
} from 'lucide-react';

export default function FocusModeView({ activeTask, onCompleteTask }) {
  const { triggerToast, fetchNotifications } = useNotifications();

  // Mode durations in minutes
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' (25) | 'deep' (50) | 'short_break' (5) | 'long_break' (15)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(activeTask?._id || '');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState(null);

  const initialDurationRef = useRef(25 * 60);

  // Play soothing acoustic chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Audio chime unsupported:', e);
    }
  };

  useEffect(() => {
    // Load pending tasks for dropdown
    api.get('/tasks?status=pending').then(res => {
      setTasks(res.data);
      if (!selectedTaskId && res.data.length > 0) {
        setSelectedTaskId(res.data[0]._id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTask) {
      setSelectedTaskId(activeTask._id);
    }
  }, [activeTask]);

  // Handle mode switches
  const switchMode = (newMode, minutes) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(minutes * 60);
    initialDurationRef.current = minutes * 60;
  };

  // Timer tick
  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleStart = async () => {
    setIsRunning(true);
    // Log start of session to backend if not already started
    if (!sessionId) {
      try {
        const res = await api.post('/focus/start', {
          taskId: selectedTaskId || null,
          notes
        });
        setSessionId(res.data._id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialDurationRef.current);
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    playChime();

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#059669', '#d97706', '#71717a']
    });

    const durationMinutes = Math.round((initialDurationRef.current - timeLeft) / 60) || Math.round(initialDurationRef.current / 60);

    try {
      if (sessionId) {
        await api.post('/focus/complete', {
          sessionId,
          durationMinutes,
          notes,
          status: 'completed'
        });
      }
      triggerToast(`Focused work logged: ${durationMinutes} minutes.`, 'Focus Session Complete', 'success');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }

    setSessionId(null);
    setTimeLeft(initialDurationRef.current);
  };

  // Format mm:ss
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentTaskObj = tasks.find(t => t._id === selectedTaskId);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Top Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Focus Session & Deep Work
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Minimalist cadence timer with automatic study log synchronization.
        </p>
      </div>

      {/* Main Focus Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-8">
        {/* Mode Selector Tabs */}
        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium">
          <button
            onClick={() => switchMode('pomodoro', 25)}
            className={`px-4 py-2 rounded-lg transition-all ${
              mode === 'pomodoro'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Pomodoro (25m)
          </button>
          <button
            onClick={() => switchMode('deep', 50)}
            className={`px-4 py-2 rounded-lg transition-all ${
              mode === 'deep'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Deep Work (50m)
          </button>
          <button
            onClick={() => switchMode('short_break', 5)}
            className={`px-4 py-2 rounded-lg transition-all ${
              mode === 'short_break'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Reset (5m)
          </button>
        </div>

        {/* Big Minimal Timer Display */}
        <div className="py-4">
          <div className="text-7xl sm:text-8xl font-bold font-mono tracking-tighter text-zinc-900 dark:text-zinc-100 tabular-nums select-none">
            {formatTimer(timeLeft)}
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-3 uppercase tracking-wider">
            {isRunning ? 'Session Active • Deep Focus' : 'Ready to Begin'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isRunning ? (
            <button
              onClick={handlePause}
              className="px-8 py-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 font-semibold text-sm transition-transform active:scale-95 shadow-md flex items-center gap-2"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Focus</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-8 py-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 font-semibold text-sm transition-transform active:scale-95 shadow-md flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Working</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Linked Task Selector */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80 text-left space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span>Assign to Deliverable</span>
            </label>
            <span className="text-[11px] text-zinc-400 font-mono">
              Auto-logs duration to task
            </span>
          </div>

          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="">General Academic Study (No specific task)</option>
            {tasks.map(t => (
              <option key={t._id} value={t._id}>
                {t.title} ({t.estimatedTime}h estimated)
              </option>
            ))}
          </select>

          {currentTaskObj && (
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between">
              <div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{currentTaskObj.title}</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">{currentTaskObj.smartRecommendation}</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                Score: {currentTaskObj.smartPriorityScore}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
