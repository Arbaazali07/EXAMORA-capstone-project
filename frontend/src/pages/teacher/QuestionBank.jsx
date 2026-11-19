// frontend/src/pages/teacher/QuestionBank.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileQuestion, Plus, Trash2, Search, X, CheckSquare, Radio, HelpCircle } from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    course_id: '',
    question_text: '',
    question_type: 'single_choice',
    marks: 2.0,
    negative_marks: 0.5,
    difficulty: 'medium',
    topic: 'General',
    explanation: '',
    options: [
      { key: 'A', text: '', is_correct: true },
      { key: 'B', text: '', is_correct: false },
      { key: 'C', text: '', is_correct: false },
      { key: 'D', text: '', is_correct: false }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teacher/questions', {
        params: {
          course_id: selectedCourse || undefined,
          question_type: selectedType || undefined,
          difficulty: selectedDifficulty || undefined,
          search: search || undefined
        }
      });
      if (res.data.success) {
        setQuestions(res.data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedCourse, selectedType, selectedDifficulty]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/teacher/courses');
        if (res.data.courses) {
          setCourses(res.data.courses);
          if (res.data.courses.length > 0 && !formData.course_id) {
            setFormData(prev => ({ ...prev, course_id: String(res.data.courses[0].id) }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  const handleTypeChange = (type) => {
    let opts = [];
    if (type === 'single_choice' || type === 'multiple_choice') {
      opts = [
        { key: 'A', text: '', is_correct: true },
        { key: 'B', text: '', is_correct: false },
        { key: 'C', text: '', is_correct: false },
        { key: 'D', text: '', is_correct: false }
      ];
    } else if (type === 'true_false') {
      opts = [
        { key: 'A', text: 'True', is_correct: true },
        { key: 'B', text: 'False', is_correct: false }
      ];
    } else {
      opts = [];
    }

    setFormData({
      ...formData,
      question_type: type,
      options: opts
    });
  };

  const handleOptionTextChange = (index, text) => {
    const updated = [...formData.options];
    updated[index].text = text;
    setFormData({ ...formData, options: updated });
  };

  const handleOptionCorrectToggle = (index) => {
    const updated = [...formData.options];
    if (formData.question_type === 'single_choice' || formData.question_type === 'true_false') {
      // Radio behavior
      updated.forEach((o, i) => (o.is_correct = i === index));
    } else if (formData.question_type === 'multiple_choice') {
      // Checkbox behavior
      updated[index].is_correct = !updated[index].is_correct;
    }
    setFormData({ ...formData, options: updated });
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/teacher/questions', formData);
      if (res.data.success) {
        setShowModal(false);
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/teacher/questions/${qId}`);
      fetchQuestions();
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Question Bank Repository</h2>
          <p className="text-xs text-slate-500 mt-0.5">Categorize objective and descriptive questions with scoring rules</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); fetchQuestions(); }} className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by text or topic..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
          />
        </form>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
        >
          <option value="">All Types</option>
          <option value="single_choice">Single Choice MCQ</option>
          <option value="multiple_choice">Multiple Choice MCQ</option>
          <option value="true_false">True / False</option>
          <option value="descriptive">Descriptive</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading question bank...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">
            No questions found matching criteria.
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {q.course_code}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {q.question_type.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        q.difficulty === 'easy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : q.difficulty === 'hard'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Topic: {q.topic}</span>
                    <span className="text-xs font-bold text-slate-700 ml-auto">
                      +{q.marks} {q.negative_marks > 0 ? `(-${q.negative_marks})` : ''} marks
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    <span className="font-bold text-slate-400 mr-2">Q{index + 1}.</span>
                    {q.question_text}
                  </p>

                  {/* Options render */}
                  {q.options && q.options.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                            opt.is_correct
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-slate-50/50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              opt.is_correct ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.option_key}
                          </span>
                          <span>{opt.option_text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-2.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span><strong className="text-slate-700">Explanation:</strong> {q.explanation}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Question to Bank</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Question Type</label>
                  <select
                    value={formData.question_type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="single_choice">Single Choice (1 Correct)</option>
                    <option value="multiple_choice">Multiple Choice (Multiple Correct)</option>
                    <option value="true_false">True / False</option>
                    <option value="descriptive">Descriptive (Teacher Evaluated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Statement</label>
                <textarea
                  required
                  rows={3}
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter the full question text or problem statement..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marks (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Negative Marking (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.negative_marks}
                    onChange={(e) => setFormData({ ...formData, negative_marks: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Tag</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Normalization, B-Trees, 2PL"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Dynamic Options for Objective questions */}
              {formData.question_type !== 'descriptive' && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Options & Correct Answer Specification</span>
                    <span className="text-[11px] text-slate-500">Toggle green badge for correct answer(s)</span>
                  </div>

                  <div className="space-y-2">
                    {formData.options.map((opt, idx) => (
                      <div key={opt.key} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOptionCorrectToggle(idx)}
                          className={`h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            opt.is_correct
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt.key}
                        </button>
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          placeholder={`Option ${opt.key} text...`}
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Explanation (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Displayed to students once examination results are published..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs">
                  {submitting ? 'Saving Question...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

