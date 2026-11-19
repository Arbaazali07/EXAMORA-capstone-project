// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/DashboardLayout';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import AcademicManagement from './pages/admin/AcademicManagement';
import ExamManagement from './pages/admin/ExamManagement';
import AuditLogs from './pages/admin/AuditLogs';

// Teacher Pages
import TeacherOverview from './pages/teacher/TeacherOverview';
import QuestionBank from './pages/teacher/QuestionBank';
import ExamCreator from './pages/teacher/ExamCreator';
import TeacherSubmissions from './pages/teacher/TeacherSubmissions';

// Student Pages
import StudentOverview from './pages/student/StudentOverview';
import AvailableExams from './pages/student/AvailableExams';
import ExamEngine from './pages/student/ExamEngine';
import StudentResults from './pages/student/StudentResults';
import ResultDetail from './pages/student/ResultDetail';
import StudentAnalytics from './pages/student/StudentAnalytics';

// Universal DBMS Laboratory & Viva
import DbmsLab from './pages/dbms/DbmsLab';
import DbmsViva from './pages/dbms/DbmsViva';
import ArchitectureDocs from './pages/dbms/ArchitectureDocs';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to user's native home
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
}

// Root Dispatcher
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dedicated Fullscreen Live Exam Engine */}
          <Route
            path="/exam/:attemptId"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <ExamEngine />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Admin Portal */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentManagement /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><TeacherManagement /></ProtectedRoute>} />
            <Route path="/admin/academics" element={<ProtectedRoute allowedRoles={['admin']}><AcademicManagement /></ProtectedRoute>} />
            <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={['admin']}><ExamManagement /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />

            {/* Teacher Portal */}
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherOverview /></ProtectedRoute>} />
            <Route path="/teacher/questions" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><QuestionBank /></ProtectedRoute>} />
            <Route path="/teacher/create-exam" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ExamCreator /></ProtectedRoute>} />
            <Route path="/teacher/submissions" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherSubmissions /></ProtectedRoute>} />

            {/* Student Portal */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentOverview /></ProtectedRoute>} />
            <Route path="/student/available-exams" element={<ProtectedRoute allowedRoles={['student', 'admin']}><AvailableExams /></ProtectedRoute>} />
            <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentResults /></ProtectedRoute>} />
            <Route path="/student/results/:resultId" element={<ProtectedRoute allowedRoles={['student', 'admin']}><ResultDetail /></ProtectedRoute>} />
            <Route path="/student/analytics" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentAnalytics /></ProtectedRoute>} />

            {/* Universal DBMS Syllabus Features */}
            <Route path="/dbms-lab" element={<DbmsLab />} />
            <Route path="/dbms-viva" element={<DbmsViva />} />
            <Route path="/architecture" element={<ArchitectureDocs />} />
          </Route>

          {/* Root & Catch-all */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

