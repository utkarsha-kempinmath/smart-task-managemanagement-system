import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Lock, Mail, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

export default function AuthView() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    course: 'Software Engineering',
    semester: 4
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (role) => {
    if (role === 'admin') {
      setFormData(prev => ({
        ...prev,
        email: 'admin@smarttask.com',
        password: 'admin123'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        email: 'student@smarttask.com',
        password: 'student123'
      }));
    }
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f0f11] text-zinc-100 selection:bg-zinc-800">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 items-center justify-center font-bold font-mono text-base shadow-sm">
            ST
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SmartTask System
          </h1>
          <p className="text-xs text-zinc-400">
            Intelligent academic task planning, algorithmic priority scheduling, and focus cadence.
          </p>
        </div>

        {/* Auth Card */}
        <div className="p-8 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-2xl space-y-6">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                !isRegister ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                isRegister ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="student@smarttask.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                />
              </div>
            </div>

            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Account Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    >
                      <option value="student">Student</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Major / Course</label>
                  <input
                    type="text"
                    placeholder="B.S. Software Engineering"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 text-xs"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Pre-Seeded Logins */}
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <span className="text-[11px] font-mono text-zinc-500 block text-center uppercase tracking-wider">
              Quick Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleFillDemo('student')}
                className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Demo Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-600 font-mono">
          SmartTask MERN • Pure Algorithmic Architecture
        </p>
      </div>
    </div>
  );
}
