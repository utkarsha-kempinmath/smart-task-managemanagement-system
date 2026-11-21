import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationDrawer from './NotificationDrawer';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Clock,
  BarChart2,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  LogOut,
  Calendar
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, isAdmin, logout, theme, toggleTheme } = useAuth();
  const { unreadCount } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const studentTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks & Matrix', icon: CheckSquare },
    { id: 'schedule', label: 'Smart Schedule', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'focus', label: 'Focus Mode', icon: Clock },
    { id: 'productivity', label: 'Productivity', icon: BarChart2 },
  ];

  const adminTabs = [
    { id: 'admin', label: 'Admin Console', icon: ShieldCheck },
    { id: 'tasks', label: 'Class Tasks & Assignments', icon: CheckSquare },
    { id: 'productivity', label: 'Analytics', icon: BarChart2 },
  ];

  const tabs = isAdmin ? adminTabs : studentTabs;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#0f0f11]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <div
              onClick={() => setActiveTab(isAdmin ? 'admin' : 'dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold font-mono text-sm shadow-sm transition-transform group-hover:scale-105">
                ST
              </div>
              <div>
                <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                  SmartTask
                </span>
                <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  MERN
                </span>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(prev => !prev)}
                className="relative p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="In-app alerts & reminders"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#0f0f11]" />
                )}
              </button>

              <NotificationDrawer
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
              />
            </div>

            {/* User Profile Pill */}
            <div className="hidden sm:flex items-center pl-3 border-l border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="text-right mr-3">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {user?.name}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {isAdmin ? 'System Admin' : `${user?.course || 'Student'} • Sem ${user?.semester || 1}`}
                </p>
              </div>

              <button
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
