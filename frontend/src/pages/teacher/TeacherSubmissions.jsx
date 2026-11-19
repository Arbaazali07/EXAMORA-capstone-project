// frontend/src/pages/teacher/TeacherSubmissions.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle2, Award, Clock, ArrowRight, X, AlertCircle, Sparkles } from 'lucide-react';

export default function TeacherSubmissions() {
  const [searchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(searchParams.get('examId') || '');
  const [submissionsData, setSubmissionsData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Evaluation Modal
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptAnswers, setAttemptAnswers] = useState([]);
  const [gradeInputs, setGradeInputs] = useState({});
  const [evalLoading, setEvalLoading] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/teacher/exams');
        if (res.data.exams) {
          setExams(res.data.exams);
          if (!selectedExamId && res.data.exams.length > 0) {
            setSelectedExamId(String(res.data.exams[0].id));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchExams();
  }, []);

  const fetchSubmissions = async (examId) => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await api.get(`/teacher/exams/${examId}/submissions`);
      if (res.data.success) {
        setSubmissionsData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchSubmissions(selectedExamId);
    }
  }, [selectedExamId]);

  const handleOpenEvaluation = async (attemptId) => {
    setEvalLoading(true);
    setEvalModalOpen(true);
    try {
      const res = await api.get(`/teacher/submissions/${attemptId}`);
      if (res.data.success) {
        setSelectedAttempt(res.data.attempt);
        setAttemptAnswers(res.data.answers);

        // Pre-fill existing grades
        const inputs = {};
        res.data.answers.forEach((ans) => {
          inputs[ans.question_id] = {
            marks: ans.marks_obtained,
            feedback: ans.teacher_feedback || ''
          };
        });
        setGradeInputs(inputs);
      }
    } catch (err) {
      alert('Failed to load attempt details');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleSaveEvaluation = async (questionId) => {
    const item = gradeInputs[questionId];
    if (!item) return;

    try {
      const res = await api.post(`/teacher/submissions/${selectedAttempt.id}/evaluate`, {
        question_id: questionId,
        marks_obtained: parseFloat(item.marks) || 0,
        teacher_feedback: item.feedback
      });

      if (res.data.success) {
        alert('Grading saved! Total score and percentage updated in MySQL.');
        // Refresh modal and list
        fetchSubmissions(selectedExamId);
      }
    } catch (err) {
      alert('Failed to save evaluation');
    }
  };

  const handlePublishResults = async () => {
    if (!window.confirm('Are you sure you want to finalize and publish examination results? All student ranks will be computed using DENSE_RANK() in MySQL.')) return;

    try {
      const res = await api.post(`/teacher/exams/${selectedExamId}/publish-results`);
      if (res.data.success) {
        alert('Results published successfully! Students can now view their scores and answer sheets.');
        fetchSubmissions(selectedExamId);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish results');
    }
  };

  const currentExam = submissionsData?.exam;
  const submissions = submissionsData?.submissions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Submissions & Grading</h2>
          <p className="text-xs text-slate-500 mt-0.5">Evaluate subjective answers, assign feedback, and release exam scorecards</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs outline-hidden"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.course_code}: {e.title}
              </option>
            ))}
          </select>

          {currentExam && (
            <button
              onClick={handlePublishResults}
              disabled={currentExam.is_published_results}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                currentExam.is_published_results
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{currentExam.is_published_results ? 'Results Released' : 'Publish Examination Results'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Student Submissions ({submissions.length})
          </h3>
          <span className="text-xs text-slate-500">
            Exam Max Marks: <strong className="text-slate-800">{currentExam?.total_marks || 0}</strong> | Pass: <strong className="text-slate-800">{currentExam?.passing_marks || 0}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Descriptive Grading</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading student submissions...</td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No submissions recorded for this exam yet.</td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.attempt_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-700">
                      {sub.rank_in_exam ? `#${sub.rank_in_exam}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{sub.student_name}</p>
                      <p className="text-[11px] text-slate-400">{sub.student_email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{sub.roll_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{sub.total_score}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-600">{sub.percentage}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {sub.grade || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sub.pending_descriptive_count > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {sub.pending_descriptive_count} Pending Grading
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Complete
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEvaluation(sub.attempt_id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        <span>Review & Grade</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Grading Modal */}
      {evalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Grading Assessment: {selectedAttempt?.student_name} ({selectedAttempt?.roll_number})
                </h3>
                <p className="text-xs text-slate-500">Exam: {selectedAttempt?.exam_title}</p>
              </div>
              <button onClick={() => setEvalModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {evalLoading ? (
              <div className="py-12 text-center text-slate-400">Loading student answers...</div>
            ) : (
              <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                {attemptAnswers.map((ans, idx) => (
                  <div key={ans.question_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-600">
                        Q{idx + 1}. ({ans.question_type.replace('_', ' ')}) - Max Marks: {ans.max_question_marks}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        Marks Awarded: <strong className="text-slate-900">{ans.marks_obtained}</strong>
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900">{ans.question_text}</p>

                    {/* If descriptive question */}
                    {ans.question_type === 'descriptive' ? (
                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800">
                          <strong>Student Written Response:</strong>
                          <p className="mt-1 whitespace-pre-wrap">{ans.descriptive_answer || '(Student left this question blank)'}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Award Marks</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={ans.max_question_marks}
                              value={gradeInputs[ans.question_id]?.marks ?? ans.marks_obtained}
                              onChange={(e) =>
                                setGradeInputs({
                                  ...gradeInputs,
                                  [ans.question_id]: {
                                    ...gradeInputs[ans.question_id],
                                    marks: e.target.value
                                  }
                                })
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Teacher Feedback</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Constructive feedback..."
                                value={gradeInputs[ans.question_id]?.feedback ?? ''}
                                onChange={(e) =>
                                  setGradeInputs({
                                    ...gradeInputs,
                                    [ans.question_id]: {
                                      ...gradeInputs[ans.question_id],
                                      feedback: e.target.value
                                    }
                                  })
                                }
                                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEvaluation(ans.question_id)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Objective answer display */
                      <div className="text-xs text-slate-600 font-mono">
                        Selected: {ans.selected_options ? JSON.stringify(ans.selected_options) : 'None'} (Auto-graded)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEvalModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Grading View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

