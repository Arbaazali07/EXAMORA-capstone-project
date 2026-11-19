// frontend/src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Database, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar() {
  const { user, login } = useAuth();
  const [dbStatus, setDbStatus] = useState({ connected: false, version: 'Checking...' });

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await api.get('/health');
        if (res.data.database) {
          setDbStatus(res.data.database);
        }
      } catch (err) {
        setDbStatus({ connected: false, version: 'Disconnected' });
      }
    };
    checkDb();
    const interval = setInterval(checkDb, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDemoSwitch = async (role) => {
    if (role === 'admin') {
      await login('admin@examora.edu', 'password123');
    } else if (role === 'teacher') {
      await login('arun.sharma@examora.edu', 'password123');
    } else if (role === 'student') {
      await login('student_001@student.examora.edu', 'password123');
    }
    window.location.reload();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-bold text-slate-800 tracking-tight">
          University Assessment Management
        </h1>
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600">
          <Database className="h-3.5 w-3.5 text-indigo-500" />
          <span>MySQL 8.0</span>
          {dbStatus.connected ? (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px] ml-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 font-semibold text-[11px] ml-1">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Connecting...
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Role Switcher for Viva & Evaluation */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2">Demo Role:</span>
          <button
            onClick={() => handleDemoSwitch('admin')}
            className={`px-2 py-1 text-xs font-semibold rounded ${
              user?.role === 'admin'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleDemoSwitch('teacher')}
            className={`px-2 py-1 text-xs font-semibold rounded ${
              user?.role === 'teacher'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            Teacher
          </button>
          <button
            onClick={() => handleDemoSwitch('student')}
            className={`px-2 py-1 text-xs font-semibold rounded ${
              user?.role === 'student'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            Student
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{user?.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{user?.email}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

