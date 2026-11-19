// frontend/src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileQuestion,
  ClipboardList,
  CheckCircle2,
  BarChart3,
  Database,
  Terminal,
  ShieldAlert,
  LogOut,
  Sparkles,
  Award,
  Layers
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-[#0B1120] border-r border-slate-800 flex flex-col shrink-0 select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">EXAMORA</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                MySQL 8
              </span>
            </div>
            <p className="text-[11px] text-slate-400">DBMS Assessment Suite</p>
          </div>
        </div>
      </div>

      {/* User Context Card */}
      <div className="mx-3 mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400 ring-2 ring-indigo-500/20">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                user?.role === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : user?.role === 'teacher'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {user?.role}
            </span>
            {user?.roll_number && (
              <span className="text-[10px] text-slate-400 font-mono">{user.roll_number}</span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Role Specific Group */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {user?.role === 'admin'
              ? 'Administration'
              : user?.role === 'teacher'
              ? 'Instructor Portal'
              : 'Student Portal'}
          </div>

          <div className="space-y-1">
            {user?.role === 'admin' && (
              <>
                <NavLink to="/admin" end className={navClass}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Overview</span>
                </NavLink>
                <NavLink to="/admin/students" className={navClass}>
                  <Users className="h-4 w-4" />
                  <span>Students</span>
                </NavLink>
                <NavLink to="/admin/teachers" className={navClass}>
                  <GraduationCap className="h-4 w-4" />
                  <span>Teachers</span>
                </NavLink>
                <NavLink to="/admin/academics" className={navClass}>
                  <Layers className="h-4 w-4" />
                  <span>Academics</span>
                </NavLink>
                <NavLink to="/admin/exams" className={navClass}>
                  <ClipboardList className="h-4 w-4" />
                  <span>All Examinations</span>
                </NavLink>
                <NavLink to="/admin/audit-logs" className={navClass}>
                  <ShieldAlert className="h-4 w-4" />
                  <span>Audit Logs</span>
                </NavLink>
              </>
            )}

            {user?.role === 'teacher' && (
              <>
                <NavLink to="/teacher" end className={navClass}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/teacher/questions" className={navClass}>
                  <FileQuestion className="h-4 w-4" />
                  <span>Question Bank</span>
                </NavLink>
                <NavLink to="/teacher/create-exam" className={navClass}>
                  <ClipboardList className="h-4 w-4" />
                  <span>Create Exam</span>
                </NavLink>
                <NavLink to="/teacher/submissions" className={navClass}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submissions & Grading</span>
                </NavLink>
              </>
            )}

            {user?.role === 'student' && (
              <>
                <NavLink to="/student" end className={navClass}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>My Dashboard</span>
                </NavLink>
                <NavLink to="/student/available-exams" className={navClass}>
                  <ClipboardList className="h-4 w-4" />
                  <span>Available Exams</span>
                </NavLink>
                <NavLink to="/student/results" className={navClass}>
                  <Award className="h-4 w-4" />
                  <span>My Results</span>
                </NavLink>
                <NavLink to="/student/analytics" className={navClass}>
                  <BarChart3 className="h-4 w-4" />
                  <span>Performance</span>
                </NavLink>
              </>
            )}
          </div>
        </div>

        {/* Universal DBMS Syllabus Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>DBMS Lab & Viva</span>
            <Sparkles className="h-3 w-3 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <NavLink to="/dbms-lab" className={navClass}>
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span>SQL Laboratory</span>
            </NavLink>
            <NavLink to="/dbms-viva" className={navClass}>
              <BookOpen className="h-4 w-4 text-violet-400" />
              <span>Viva Preparation (45 Q)</span>
            </NavLink>
            <NavLink to="/architecture" className={navClass}>
              <Database className="h-4 w-4 text-sky-400" />
              <span>ER Model & Schema</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

