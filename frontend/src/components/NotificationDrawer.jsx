import React, { useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, Trash2, AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type, severity) => {
    if (severity === 'critical') return <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />;
    if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />;
    if (severity === 'success') return <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />;
    return <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />;
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden text-zinc-900 dark:text-zinc-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-zinc-500" />
          <span className="font-semibold text-sm">In-App Alerts</span>
          {unreadCount > 0 && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-100 dark:bg-zinc-700 dark:text-zinc-200">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Mark all as read"
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Read all</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-xs">
            No alerts. You are completely up to date!
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id}
              onClick={() => !item.isRead && markAsRead(item._id)}
              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                item.isRead
                  ? 'opacity-70 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  : 'bg-zinc-100/50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {getIcon(item.type, item.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold truncate leading-none">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(item._id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-500 text-zinc-400 p-1"
                title="Dismiss"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-[11px] text-zinc-400 flex items-center justify-between">
        <span>Automatic smart deadline reminders</span>
        <span className="font-mono">{notifications.length} stored</span>
      </div>
    </div>
  );
}
