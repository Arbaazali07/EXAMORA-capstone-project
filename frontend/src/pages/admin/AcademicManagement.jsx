// frontend/src/pages/admin/AcademicManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Layers, BookOpen, Calendar, Plus, X } from 'lucide-react';

export default function AcademicManagement() {
  const [activeTab, setActiveTab] = useState('courses');
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    course_code: '',
    course_name: '',
    department_id: '1',
    credits: 4,
    description: ''
  });
  const [deptForm, setDeptForm] = useState({
    dept_code: '',
    dept_name: '',
    description: ''
  });
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, cRes, sRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/courses'),
        api.get('/admin/semesters')
      ]);
      if (dRes.data.departments) setDepartments(dRes.data.departments);
      if (cRes.data.courses) setCourses(cRes.data.courses);
      if (sRes.data.semesters) setSemesters(sRes.data.semesters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const res = await api.post('/admin/courses', courseForm);
      if (res.data.success) {
        setShowCourseModal(false);
        setCourseForm({ course_code: '', course_name: '', department_id: '1', credits: 4, description: '' });
        loadData();
      }
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to create course');
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const res = await api.post('/admin/departments', deptForm);
      if (res.data.success) {
        setShowDeptModal(false);
        setDeptForm({ dept_code: '', dept_name: '', description: '' });
        loadData();
      }
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to create department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Academic Curriculum</h2>
          <p className="text-xs text-slate-500 mt-0.5">Departments, course catalog, credits, and semesters</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeptModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Department</span>
          </button>
          <button
            onClick={() => setShowCourseModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Courses ({courses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'departments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Departments ({departments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('semesters')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'semesters'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Semesters ({semesters.length})</span>
        </button>
      </div>

      {/* Tab 1: Courses */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Course Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Examinations</th>
                <th className="py-3 px-4">Question Bank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{c.course_code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.course_name}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {c.dept_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{c.credits}</td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">{c.exam_count}</td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">{c.question_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Departments */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{d.dept_code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{d.dept_name}</td>
                  <td className="py-3 px-4 text-slate-500">{d.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Semesters */}
      {activeTab === 'semesters' && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Semester Name</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {semesters.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.semester_code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.semester_name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.academic_year}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Academic Course</h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modalError && <div className="mt-4 p-2 bg-rose-50 text-rose-700 text-xs rounded">{modalError}</div>}
            <form onSubmit={handleCreateCourse} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="CS405"
                  value={courseForm.course_code}
                  onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="Distributed Systems"
                  value={courseForm.course_name}
                  onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={courseForm.department_id}
                    onChange={(e) => setCourseForm({ ...courseForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.dept_code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowCourseModal(false)} className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs">Add Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modalError && <div className="mt-4 p-2 bg-rose-50 text-rose-700 text-xs rounded">{modalError}</div>}
            <form onSubmit={handleCreateDept} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="ME"
                  value={deptForm.dept_code}
                  onChange={(e) => setDeptForm({ ...deptForm, dept_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="Mechanical Engineering"
                  value={deptForm.dept_name}
                  onChange={(e) => setDeptForm({ ...deptForm, dept_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs">Create Dept</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

