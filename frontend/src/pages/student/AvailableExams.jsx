// frontend/src/pages/student/AvailableExams.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ClipboardList, Clock, CheckCircle2, Play, AlertCircle, Calendar } from 'lucide-react';

export default function AvailableExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/exams/available');
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

  const handleRegister = async (examId) => {
    setActionLoading(examId);
    try {
      const res = await api.post(`/student/exams/${examId}/register`);
      if (res.data.success) {
        alert(res.data.message);
        fetchExams();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartExam = async (examId) => {
    if (!window.confirm('Are you ready to begin this examination? The timer will start immediately and cannot be paused.')) {
      return;
    }

    setActionLoading(examId);
    try {
      const res = await api.post(`/exam/${examId}/start`);
      if (res.data.success) {
        navigate(`/exam/${res.data.attemptId}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start examination');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Available Examinations</h2>
        <p className="text-xs text-slate-500 mt-0.5">Enrolled semester assessment schedule and online testing portal</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading examinations...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No examinations scheduled at this time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map((exam) => {
            const isRegistered = exam.registration_status === 'approved' || exam.registration_status === 'registered';
            const hasAttempt = Boolean(exam.attempt_id);
            const isAttemptCompleted = exam.attempt_status && exam.attempt_status !== 'in_progress';
            const isAttemptInProgress = exam.attempt_status === 'in_progress';

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {exam.course_code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                      {exam.semester_name}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{exam.description || 'Comprehensive evaluation.'}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Duration</span>
                      <span className="font-bold text-slate-800">{exam.duration_minutes} Minutes</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Marks & Pass</span>
                      <span className="font-bold text-slate-800">{exam.total_marks} (Pass: {exam.passing_marks})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Questions</span>
                      <span className="font-bold text-slate-800">{exam.total_questions || 0} Questions</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Negative Marking</span>
                      <span className="font-bold text-slate-800">
                        {exam.negative_marking_per_question > 0 ? `-${exam.negative_marking_per_question}` : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Window: {new Date(exam.start_time).toLocaleDateString()} ({new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {isAttemptCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Submitted & Completed</span>
                      </span>
                    ) : isAttemptInProgress ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Attempt In Progress</span>
                      </span>
                    ) : isRegistered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Registered</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Registration Required</span>
                    )}
                  </div>

                  <div>
                    {isAttemptCompleted ? (
                      <button
                        onClick={() => navigate('/student/results')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        View Results
                      </button>
                    ) : isAttemptInProgress ? (
                      <button
                        onClick={() => navigate(`/exam/${exam.attempt_id}`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Resume Test</span>
                        <Play className="h-3.5 w-3.5 fill-white" />
                      </button>
                    ) : isRegistered ? (
                      <button
                        disabled={actionLoading === exam.id}
                        onClick={() => handleStartExam(exam.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Start Examination</span>
                      </button>
                    ) : (
                      <button
                        disabled={actionLoading === exam.id}
                        onClick={() => handleRegister(exam.id)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                      >
                        {actionLoading === exam.id ? 'Registering...' : 'Register for Exam'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

