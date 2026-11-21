import React, { useState, useEffect } from 'react';
import api from '../api';
import confetti from 'canvas-confetti';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  Play,
  Grid,
  List,
  RefreshCw,
  AlertCircle,
  Users
} from 'lucide-react';

export default function TasksView({ onStartFocusTask, setActiveTab }) {
  const { triggerToast } = useNotifications();
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'matrix'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasksAndCategories = async () => {
    try {
      setLoading(true);
      const params = {};
      if (isAdmin && selectedStudent !== 'all') {
        params.student = selectedStudent;
      }
      const [tRes, cRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/categories')
      ]);
      setTasks(tRes.data);
      setCategories(cRes.data);

      if (isAdmin && students.length === 0) {
        api.get('/admin/students').then(res => setStudents(res.data)).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndCategories();
  }, [selectedStudent]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingTask) {
        const res = await api.put(`/tasks/${editingTask._id}`, formData);
        setTasks(prev => prev.map(t => (t._id === res.data._id ? res.data : t)));
        triggerToast('Task deliverable updated successfully', 'Task Updated', 'info');
      } else {
        const res = await api.post('/tasks', formData);
        fetchTasksAndCategories();
        triggerToast(isAdmin ? 'Assignment created & assigned to students' : 'Task Created', 'Success', 'success');
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Action failed', 'Error', 'critical');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      triggerToast('Task deliverable removed', 'Deleted', 'info');
    } catch (err) {
      triggerToast('Failed to delete task', 'Error', 'critical');
    }
  };

  const handleToggle = async (task) => {
    try {
      const res = await api.patch(`/tasks/${task._id}/toggle`);
      setTasks(prev => prev.map(t => (t._id === res.data._id ? res.data : t)));

      if (res.data.status === 'completed') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#059669', '#d97706', '#71717a']
        });
        triggerToast(`Finished: "${task.title}"`, 'Task Completed', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
                          t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (t.category?._id === selectedCategory || t.category === selectedCategory);
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Task Management & Urgency Matrix
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Algorithmic priority computation based on deadline proximity and estimated effort.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Eisenhower Matrix View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matrix</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className={isAdmin ? "sm:col-span-4 relative" : "sm:col-span-6 relative"}>
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search deliverables by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {isAdmin && (
          <div className="sm:col-span-3">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-blue-50/60 dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="all">👥 All Students</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>👤 {s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className={isAdmin ? "sm:col-span-3" : "sm:col-span-3"}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-3"}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Content based on viewMode */}
      {viewMode === 'list' ? (
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl">
              No tasks match your current filters.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isOverdue = !isCompleted && new Date(task.deadline) < new Date();

              return (
                <div
                  key={task._id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-zinc-800/40 opacity-70'
                      : isOverdue
                      ? 'bg-rose-500/5 dark:bg-rose-950/10 border-rose-500/30'
                      : 'bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggle(task)}
                      className={`mt-1 transition-colors ${
                        isCompleted ? 'text-emerald-500' : 'text-zinc-400 hover:text-emerald-500'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {isAdmin && task.student && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
                            👤 {task.student.name || 'Student'}
                          </span>
                        )}

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {task.category?.name || 'General'}
                        </span>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                          task.priority === 'urgent'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : task.priority === 'high'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          {task.priority} Priority
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          Smart Score: {task.smartPriorityScore}
                        </span>

                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                          [{task.smartQuadrant}]
                        </span>
                      </div>

                      <h3 className={`text-sm font-semibold ${isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {task.title}
                      </h3>

                      {task.smartRecommendation && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          ↳ {task.smartRecommendation}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est: {task.estimatedTime}h {task.actualTimeSpent > 0 ? `(${task.actualTimeSpent}m logged)` : ''}
                        </span>
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-semibold' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          if (onStartFocusTask) onStartFocusTask(task);
                          setActiveTab('focus');
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Start Focus Mode for this task"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Eisenhower Matrix View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Urgent & Important (Do First)',
              desc: 'High priority or tight deadline',
              quadrantKey: 'Urgent & Important',
              border: 'border-amber-500/30'
            },
            {
              title: 'Important & Strategic (Schedule)',
              desc: 'High impact with comfortable runway',
              quadrantKey: 'Important / Strategic',
              border: 'border-emerald-500/30'
            },
            {
              title: 'Urgent & Low Effort (Quick Wins)',
              desc: 'Immediate deadline but short duration (<1h)',
              quadrantKey: 'Urgent / Low Effort',
              border: 'border-zinc-500/30'
            },
            {
              title: 'Backlog / Flexible (Defer)',
              desc: 'Low priority, ample time',
              quadrantKey: 'Backlog / Flexible',
              border: 'border-zinc-700/30'
            }
          ].map((quad) => {
            const quadTasks = filteredTasks.filter(t => t.smartQuadrant === quad.quadrantKey && t.status !== 'completed');

            return (
              <div
                key={quad.quadrantKey}
                className={`p-4 rounded-xl bg-white dark:bg-[#18181b] border ${quad.border} space-y-3 min-h-[220px]`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {quad.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400">{quad.desc}</p>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {quadTasks.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {quadTasks.length === 0 ? (
                    <p className="text-[11px] text-zinc-400 py-6 text-center">No tasks in this quadrant.</p>
                  ) : (
                    quadTasks.map(t => (
                      <div
                        key={t._id}
                        onClick={() => {
                          setEditingTask(t);
                          setIsModalOpen(true);
                        }}
                        className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs hover:border-zinc-400 cursor-pointer"
                      >
                        <div className="flex items-center justify-between font-medium text-zinc-900 dark:text-zinc-100">
                          <span className="truncate">{t.title}</span>
                          <span className="font-mono text-[10px] text-zinc-400 shrink-0 ml-2">
                            {t.estimatedTime}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400 font-mono">
                          <span>Score: {t.smartPriorityScore}</span>
                          <span>Due {new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                        {isAdmin && t.student && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5 font-semibold">
                            👤 {t.student.name || 'Student'}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleCreateOrUpdate}
        task={editingTask}
        categories={categories}
        onCategoryCreated={(newCat) => setCategories(prev => [...prev, newCat])}
      />
    </div>
  );
}
