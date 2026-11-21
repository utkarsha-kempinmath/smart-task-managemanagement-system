import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotifications } from '../context/NotificationContext';
import {
  Users,
  FolderPlus,
  BarChart2,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function AdminView() {
  const { triggerToast } = useNotifications();
  const [activeSubTab, setActiveSubTab] = useState('students'); // 'students' | 'categories' | 'reports' | 'broadcast'
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Category State
  const [newCat, setNewCat] = useState({ name: '', description: '', color: '#71717a' });

  // Broadcast Alert State
  const [broadcast, setBroadcast] = useState({ title: '', message: '', severity: 'info' });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes, rRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/categories'),
        api.get('/admin/reports')
      ]);
      setStudents(sRes.data);
      setCategories(cRes.data);
      setReports(rRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStudent = async (studentId) => {
    try {
      const res = await api.patch(`/admin/students/${studentId}/toggle`);
      setStudents(prev => prev.map(s => (s._id === studentId ? { ...s, isActive: !s.isActive } : s)));
      triggerToast(res.data.message, 'Status Updated', 'info');
    } catch (err) {
      triggerToast('Failed to update student', 'Error', 'critical');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      const res = await api.post('/categories', { ...newCat, isSystemDefault: true });
      setCategories(prev => [...prev, res.data]);
      setNewCat({ name: '', description: '', color: '#71717a' });
      triggerToast('System default category created', 'Success', 'success');
    } catch (err) {
      triggerToast('Failed to create category', 'Error', 'critical');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this system category?')) return;
    try {
      await api.delete(`/categories/${catId}`);
      setCategories(prev => prev.filter(c => c._id !== catId));
      triggerToast('Category deleted', 'Success', 'info');
    } catch (err) {
      triggerToast('Failed to delete category', 'Error', 'critical');
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title.trim() || !broadcast.message.trim()) return;
    try {
      setSendingBroadcast(true);
      const res = await api.post('/admin/broadcast', broadcast);
      triggerToast(res.data.message, 'Broadcast Dispatched', 'success');
      setBroadcast({ title: '', message: '', severity: 'info' });
    } catch (err) {
      triggerToast('Failed to send broadcast', 'Error', 'critical');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrative Governance
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            System Administration Panel
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage student rosters, define system categories, and monitor platform velocity.
          </p>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
          {[
            { id: 'students', label: 'Students', icon: Users },
            { id: 'categories', label: 'Categories', icon: FolderPlus },
            { id: 'reports', label: 'Reports', icon: BarChart2 },
            { id: 'broadcast', label: 'In-App Broadcast', icon: Send },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab 1: Students */}
      {activeSubTab === 'students' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Registered Student Directory
              </h2>
              <p className="text-xs text-zinc-400">Manage account privileges and monitor engagement</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {students.length} Students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Course & Sem</th>
                  <th className="pb-3 font-medium">Tasks (Done/Total)</th>
                  <th className="pb-3 font-medium">Focus Logged</th>
                  <th className="pb-3 font-medium">Account Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {students.map((student) => (
                  <tr key={student._id} className="text-zinc-700 dark:text-zinc-300">
                    <td className="py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                      <div>{student.name}</div>
                      <div className="text-[11px] font-mono text-zinc-400">{student.email}</div>
                    </td>
                    <td className="py-3.5 font-mono">
                      {student.course} • Sem {student.semester}
                    </td>
                    <td className="py-3.5 font-mono">
                      {student.completedCount} / {student.taskCount} ({student.completionRate}%)
                    </td>
                    <td className="py-3.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {student.totalFocusHours}h
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full ${
                        student.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {student.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStudent(student._id)}
                        className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${
                          student.isActive
                            ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                            : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                      >
                        {student.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Categories */}
      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Category Form */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Create System Academic Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Subject / Domain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Computing"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Domain syllabus and deliverable tags"
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
              >
                Add System Category
              </button>
            </form>
          </div>

          {/* Existing Categories Table */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              System & Academic Domains ({categories.length})
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {categories.map((c) => (
                <div key={c._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</span>
                      {c.isSystemDefault && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                          System Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{c.description || 'No description provided'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(c._id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: System Reports */}
      {activeSubTab === 'reports' && reports && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-400 uppercase">Enrolled Students</span>
              <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
                {reports.metrics.totalStudents}
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-400 uppercase">Total Tasks Created</span>
              <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
                {reports.metrics.totalTasks}
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-400 uppercase">System Completion Rate</span>
              <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
                {reports.metrics.overallCompletionRate}%
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-400 uppercase">Total Focus Hours</span>
              <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
                {reports.metrics.totalFocusHours}h
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Tasks by Priority Distribution
              </h3>
              <div className="space-y-2">
                {reports.priorityBreakdown.map(p => (
                  <div key={p._id} className="flex items-center justify-between text-xs font-mono">
                    <span className="capitalize text-zinc-400">{p._id}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{p.count} tasks</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Eisenhower Quadrant Distribution
              </h3>
              <div className="space-y-2">
                {reports.quadrantBreakdown.map(q => (
                  <div key={q._id} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">{q._id}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{q.count} tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: In-App Broadcast */}
      {activeSubTab === 'broadcast' && (
        <div className="max-w-xl p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Broadcast In-App Alert to All Students
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instantly delivers an alert badge and notification drawer message to all active student accounts.
            </p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Alert Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled Maintenance / Final Submission Window"
                value={broadcast.title}
                onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Notification Message *</label>
              <textarea
                rows={3}
                required
                placeholder="Details of the announcement..."
                value={broadcast.message}
                onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Severity</label>
              <select
                value={broadcast.severity}
                onChange={(e) => setBroadcast({ ...broadcast, severity: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              >
                <option value="info">Info (Neutral)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="critical">Critical (Red alert)</option>
                <option value="success">Success (Emerald)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sendingBroadcast}
              className="w-full py-2.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendingBroadcast ? 'Dispatching...' : 'Dispatch In-App Notification'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
