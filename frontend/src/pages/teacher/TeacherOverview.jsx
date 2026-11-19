// frontend/src/pages/teacher/TeacherOverview.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { BookOpen, FileQuestion, ClipboardList, CheckCircle2, Plus, ArrowRight } from 'lucide-react';

export default function TeacherOverview() {
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, eRes] = await Promise.all([
          api.get('/teacher/courses'),
          api.get('/teacher/exams')
        ]);
        if (cRes.data.courses) setCourses(cRes.data.courses);
        if (eRes.data.exams) setExams(eRes.data.exams);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalExams = exams.length;
  const totalSubmissions = exams.reduce((acc, e) => acc + (parseInt(e.total_attempts) || 0), 0);
  const pendingGrading = exams.reduce((acc, e) => acc + (parseInt(e.pending_evaluations) || 0), 0);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading instructor dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Instructor Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage course syllabus, question banks, assessments, and student evaluations</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/teacher/questions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </Link>
          <Link
            to="/teacher/create-exam"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Exam</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={courses.length}
          subtext="Active academic term"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Examinations"
          value={totalExams}
          subtext="Created & managed"
          icon={ClipboardList}
          color="violet"
        />
        <StatCard
          title="Submissions"
          value={totalSubmissions}
          subtext="Recorded student attempts"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Grading"
          value={pendingGrading}
          subtext={pendingGrading > 0 ? "Requires manual grading" : "All graded"}
          icon={FileQuestion}
          color={pendingGrading > 0 ? "amber" : "slate"}
        />
      </div>

      {/* Assigned Courses Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4">My Assigned Academic Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {course.course_code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">{course.credits} Credits</span>
              </div>
              <h4 className="mt-2 text-sm font-bold text-slate-900">{course.course_name}</h4>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{course.description || 'Core departmental subject.'}</p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <span>{course.my_exams_count} Exams Created</span>
                <span className="font-semibold text-slate-800">{course.course_questions_count} Questions</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Exams & Submissions */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">My Examinations</h3>
          <Link to="/teacher/submissions" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>View All Submissions</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Submissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {exams.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{e.title}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{e.course_code}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {new Date(e.start_time).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{e.total_questions_assigned}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{e.total_attempts}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {e.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/teacher/submissions?examId=${e.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Grade ({e.pending_evaluations || 0})</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

