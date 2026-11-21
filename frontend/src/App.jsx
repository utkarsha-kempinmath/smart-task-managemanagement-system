import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import TasksView from './views/TasksView';
import ScheduleView from './views/ScheduleView';
import CalendarView from './views/CalendarView';
import FocusModeView from './views/FocusModeView';
import ProductivityView from './views/ProductivityView';
import AdminView from './views/AdminView';

export default function App() {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(() => (user?.role === 'admin' ? 'admin' : 'dashboard'));
  const [activeFocusTask, setActiveFocusTask] = useState(null);

  React.useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'dashboard') {
      setActiveTab('admin');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 animate-pulse flex items-center justify-center font-bold text-white font-mono text-xs">
            ST
          </div>
          <span className="text-xs font-mono text-zinc-400">Loading SmartTask System...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleStartFocusTask = (task) => {
    setActiveFocusTask(task);
    setActiveTab('focus');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0f0f11] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            onStartFocusTask={handleStartFocusTask}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            setActiveTab={setActiveTab}
            onStartFocusTask={handleStartFocusTask}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            setActiveTab={setActiveTab}
            onStartFocusTask={handleStartFocusTask}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'focus' && (
          <FocusModeView
            activeTask={activeFocusTask}
            onCompleteTask={() => setActiveFocusTask(null)}
          />
        )}

        {activeTab === 'productivity' && (
          <ProductivityView />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminView />
        )}
      </main>

      <Toast />

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-850 py-6 text-center text-xs text-zinc-400 font-mono">
        SmartTask System • MERN Stack • Heuristic Algorithmic Architecture
      </footer>
    </div>
  );
}
