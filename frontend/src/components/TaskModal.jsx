import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, Flag, AlertCircle, Plus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function TaskModal({ isOpen, onClose, onSave, task = null, categories = [], onCategoryCreated }) {
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: '',
    priority: 'medium',
    estimatedTime: 1.5,
    student: 'all'
  });

  const [students, setStudents] = useState([]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Load students if admin opens modal
  useEffect(() => {
    if (isAdmin && isOpen) {
      api.get('/admin/students')
        .then(res => setStudents(res.data))
        .catch(err => console.error('Failed to load students:', err));
    }
  }, [isAdmin, isOpen]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        category: task.category?._id || task.category || (categories[0]?._id || ''),
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
        priority: task.priority || 'medium',
        estimatedTime: task.estimatedTime || 1,
        student: task.student?._id || task.student || 'all'
      });
    } else {
      // Default deadline tomorrow 18:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);

      setFormData(prev => ({
        title: '',
        description: '',
        category: prev.category || (categories[0]?._id || ''),
        deadline: tomorrow.toISOString().slice(0, 16),
        priority: 'medium',
        estimatedTime: 2,
        student: 'all'
      }));
    }
  }, [task, categories, isOpen]);

  // Ensure category is selected if categories load asynchronously
  useEffect(() => {
    if (!formData.category && categories.length > 0) {
      setFormData(prev => ({ ...prev, category: categories[0]._id }));
    }
  }, [categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setIsCreatingCat(true);
      const res = await api.post('/categories', { name: newCatName.trim() });
      if (onCategoryCreated) {
        onCategoryCreated(res.data);
      }
      setFormData(prev => ({ ...prev, category: res.data._id }));
      setNewCatName('');
      setShowAddCat(false);
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setIsCreatingCat(false);
    }
  };

  // Heuristic priority score quick simulation
  const calcSimulatedScore = () => {
    const base = { low: 15, medium: 35, high: 60, urgent: 85 }[formData.priority] || 35;
    const effort = Math.min(20, Math.round(Number(formData.estimatedTime || 1) * 3));
    let urgency = 20;
    if (formData.deadline) {
      const diffHours = (new Date(formData.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHours <= 24) urgency = 40;
      else if (diffHours <= 48) urgency = 28;
      else if (diffHours <= 120) urgency = 15;
    }
    return Math.min(160, base + effort + urgency);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {isAdmin
                ? (task ? 'Edit Class Assignment' : 'Assign Academic Task to Students')
                : (task ? 'Edit Task Deliverable' : 'Create Academic Task')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isAdmin
                ? 'Tasks assigned here will appear on students\' dashboards, schedules, and calendars.'
                : 'Configured with algorithmic smart prioritization heuristics.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Admin Assign To Dropdown */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Assign To *
              </label>
              <select
                value={formData.student || 'all'}
                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg bg-blue-50/60 dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                <option value="all">📢 All Enrolled Students (Class Assignment)</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    👤 {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Complete homework problem set"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Key objectives, rubric constraints, reference links..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {showAddCat ? 'Cancel' : '+ New Category'}
                </button>
              </div>

              {showAddCat ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCat || !newCatName.trim()}
                    className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCreatingCat ? '...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                  >
                    {categories.length === 0 ? (
                      <option value="">Loading categories...</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Deadline *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Priority Tier
              </label>
              <div className="relative">
                <Flag className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="low">Low (Flexible)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="high">High (Important)</option>
                  <option value="urgent">Urgent (Critical)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Estimated Effort (Hours)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="number"
                  min="0.5"
                  max="40"
                  step="0.5"
                  required
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Smart System Heuristic Preview */}
          <div className="p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                Computed Urgency Rating:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                Score ~{calcSimulatedScore()} / 160
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              {task ? 'Update Task' : (isAdmin ? 'Assign Task' : 'Save Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
