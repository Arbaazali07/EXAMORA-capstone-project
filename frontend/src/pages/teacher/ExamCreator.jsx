// frontend/src/pages/teacher/ExamCreator.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ClipboardList, CheckSquare, Square, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ExamCreator() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQIds, setSelectedQIds] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    semester_id: '1',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    total_marks: 50.00,
    passing_marks: 20.00,
    negative_marking_per_question: 0.25,
    instructions: '1. Ensure stable internet connection.\n2. Attempt all objective and descriptive questions.\n3. The system will auto-submit when the countdown expires.'
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/teacher/courses'),
          api.get('/admin/semesters')
        ]);
        if (cRes.data.courses) {
          setCourses(cRes.data.courses);
          if (cRes.data.courses.length > 0) {
            setFormData(prev => ({ ...prev, course_id: String(cRes.data.courses[0].id) }));
          }
        }
        if (sRes.data.semesters) setSemesters(sRes.data.semesters);

        // Set default start/end times
        const now = new Date();
        const start = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        const end = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
        setFormData(prev => ({
          ...prev,
          start_time: start.toISOString().slice(0, 16),
          end_time: end.toISOString().slice(0, 16)
        }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  // When course changes or moving to step 2, load question bank for this course
  useEffect(() => {
    if (formData.course_id && step === 2) {
      const loadCourseQuestions = async () => {
        try {
          const res = await api.get('/teacher/questions', { params: { course_id: formData.course_id } });
          if (res.data.questions) {
            setAvailableQuestions(res.data.questions);
            // Default select all questions if none selected yet
            if (selectedQIds.length === 0) {
              setSelectedQIds(res.data.questions.map(q => q.id));
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      loadCourseQuestions();
    }
  }, [formData.course_id, step]);

  const toggleQuestionSelection = (qId) => {
    if (selectedQIds.includes(qId)) {
      setSelectedQIds(selectedQIds.filter(id => id !== qId));
    } else {
      setSelectedQIds([...selectedQIds, qId]);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (selectedQIds.length === 0) {
      alert('Please select at least one question for this examination.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        start_time: formData.start_time.replace('T', ' ') + ':00',
        end_time: formData.end_time.replace('T', ' ') + ':00',
        question_ids: selectedQIds
      };

      const res = await api.post('/teacher/exams', payload);
      if (res.data.success) {
        navigate('/teacher');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create examination');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create & Schedule Examination</h2>
        <p className="text-xs text-slate-500 mt-0.5">Define exam duration, timing, grading policies, and select question papers</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-indigo-600' : 'text-slate-500'}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>1</span>
          <span>Exam Configuration</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-200"></div>
        <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-indigo-600' : 'text-slate-500'}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>2</span>
          <span>Question Selection ({selectedQIds.length})</span>
        </div>
      </div>

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. CS301 Midterm Examination: Database Systems & Relational Design"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Syllabus Scope</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of covered chapters (e.g. Normalization, ACID, Joins, B-Trees)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Semester</label>
              <select
                value={formData.semester_id}
                onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.semester_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                step="1"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: parseFloat(e.target.value) || 50 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Marks</label>
              <input
                type="number"
                step="1"
                value={formData.passing_marks}
                onChange={(e) => setFormData({ ...formData, passing_marks: parseFloat(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Negative Marks</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formData.negative_marking_per_question}
                onChange={(e) => setFormData({ ...formData, negative_marking_per_question: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Instructions</label>
            <textarea
              rows={3}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!formData.title || !formData.start_time || !formData.end_time) {
                  alert('Please fill in exam title and start/end times.');
                  return;
                }
                setStep(2);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <span>Next: Select Questions</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Question Selector */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Questions from Question Bank</h3>
              <p className="text-xs text-slate-500">Pick questions to attach to this exam paper</p>
            </div>
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
              Selected: {selectedQIds.length} / {availableQuestions.length} Questions
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {availableQuestions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No questions found in question bank for this course. Please add questions first.
              </div>
            ) : (
              availableQuestions.map((q) => {
                const isSelected = selectedQIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestionSelection(q.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5 text-indigo-600">
                      {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {q.question_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 font-mono">
                          +{q.marks} marks
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{q.difficulty}</span>
                      </div>
                      <p className="font-semibold text-slate-800 line-clamp-2">{q.question_text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 flex justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Settings</span>
            </button>
            <button
              type="button"
              disabled={loading || selectedQIds.length === 0}
              onClick={handleCreateExam}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating Examination...' : `Finalize & Create Exam (${selectedQIds.length} Qs)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

