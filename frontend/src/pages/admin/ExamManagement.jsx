// frontend/src/pages/admin/ExamManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ClipboardList, CheckCircle2, Clock, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/exams');
      if (res.data.success) {
        setExams(res.data.exams);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleStatusChange = async (examId, newStatus) => {
    try {
      await api.put(`/admin/exams/${examId}/status`, { status: newStatus });
      fetchExams();
    } catch (err) {
      alert('Failed to update exam status');
    }
  };

  const handleTogglePublishResults = async (examId, currentVal) => {
    try {
      await api.put(`/admin/exams/${examId}/status`, { is_published_results: !currentVal });
      fetchExams();
    } catch (err) {
      alert('Failed to update result publication status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">University Examinations Master Schedule</h2>
        <p className="text-xs text-slate-500 mt-0.5">Control live examination statuses, student access, and result releases</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Title & Description</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Duration & Marks</th>
                <th className="py-3 px-4">Schedule Window</th>
                <th className="py-3 px-4">Status Control</th>
                <th className="py-3 px-4">Results Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading examinations...</td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No examinations found.</td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-slate-900">{exam.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{exam.description || 'No description'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{exam.course_code}</td>
                    <td className="py-3 px-4 text-slate-600">{exam.instructor_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{exam.duration_minutes} mins</span>
                      <span className="text-slate-400 text-[11px] block">Max: {exam.total_marks} | Pass: {exam.passing_marks}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      <div>{new Date(exam.start_time).toLocaleDateString()}</div>
                      <div>{new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={exam.status}
                        onChange={(e) => handleStatusChange(exam.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-hidden ${
                          exam.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : exam.status === 'ongoing'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                            : exam.status === 'scheduled'
                            ? 'bg-sky-50 text-sky-700 border-sky-300'
                            : exam.status === 'closed'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="published">Published</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublishResults(exam.id, exam.is_published_results)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          exam.is_published_results
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {exam.is_published_results ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Released</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5" />
                            <span>Unpublished</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

