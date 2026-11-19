// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, Database, Award } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.success) {
        if (res.user.role === 'admin') navigate('/admin');
        else if (res.user.role === 'teacher') navigate('/teacher');
        else navigate('/student');
      } else {
        setError(res.error || 'Invalid login credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Server connection error. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role) => {
    if (role === 'admin') {
      setIdentifier('admin@examora.edu');
      setPassword('password123');
    } else if (role === 'teacher') {
      setIdentifier('arun.sharma@examora.edu');
      setPassword('password123');
    } else if (role === 'student') {
      setIdentifier('student_001@student.examora.edu');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Pane - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 xl:px-28">
        <div className="max-w-md w-full mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-2xl text-slate-900 tracking-tight">EXAMORA</span>
              <p className="text-xs text-slate-500 font-medium">Smart Online Examination & Assessment</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to access your examination portal</p>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <p className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-indigo-600" />
              University Capstone Evaluation Quick-Fill:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 shadow-2xs transition-colors"
              >
                Admin (Dean)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('teacher')}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 shadow-2xs transition-colors"
              >
                Faculty (Prof)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('student')}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-2xs transition-colors"
              >
                Student (Aarav)
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin@examora.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Register as Student
            </Link>
          </p>
        </div>
      </div>

      {/* Right Pane - Feature Showcase (Dark Navy) */}
      <div className="hidden lg:flex flex-1 bg-[#0B1120] text-white p-12 flex-col justify-between border-l border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="h-3.5 w-3.5" />
            <span>MySQL 8.0 Engine Powered</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight">
            Academic Assessment with Rigorous DBMS Architecture.
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-md">
            EXAMORA demonstrates enterprise-grade relational database design, BCNF normalization, transactional concurrency control, and analytical window functions.
          </p>

          <div className="mt-10 space-y-4 max-w-md">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex gap-3.5">
              <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">ACID Atomic Exam Submissions</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-step transactional evaluation with row-level locks and automatic scorecards.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex gap-3.5">
              <Database className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Interactive SQL Playground</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execute live queries covering Joins, Window Functions, Views, CTEs, and EXPLAIN plans.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex gap-3.5">
              <Award className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">45 Comprehensive Viva Answers</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Integrated university viva guide covering relational modeling, B-Trees, and recovery protocols.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>EXAMORA University DBMS Capstone</span>
          <span>Designed for Academic Excellence</span>
        </div>
      </div>
    </div>
  );
}

