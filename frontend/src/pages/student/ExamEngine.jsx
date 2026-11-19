// frontend/src/pages/student/ExamEngine.jsx
// Professional Full-Screen Examination Engine with Server-Validated Timer & Palette

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  RotateCcw,
  Send,
  AlertTriangle,
  HelpCircle,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function ExamEngine() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // State of all answers: { [questionId]: { selectedOptions: [...], descriptiveAnswer: '', isMarkedForReview: bool, isVisited: bool } }
  const [userAnswers, setUserAnswers] = useState({});

  // Countdown seconds
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Modals & submission state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Timer reference
  const timerRef = useRef(null);

  // 1. Fetch live exam state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await api.get(`/exam/${attemptId}/state`);
        if (res.data.success) {
          const { attempt, questions: qList, savedAnswers } = res.data;

          if (attempt.status !== 'in_progress') {
            alert(`This examination attempt has already been finalized (Status: ${attempt.status}).`);
            navigate('/student/results');
            return;
          }

          setExamData(attempt);
          setQuestions(qList);
          setSecondsLeft(attempt.remainingSeconds);

          // Build answers state map
          const initialMap = {};
          qList.forEach((q, idx) => {
            const saved = savedAnswers[q.id];
            initialMap[q.id] = {
              selectedOptions: saved ? saved.selectedOptions || [] : [],
              descriptiveAnswer: saved ? saved.descriptiveAnswer || '' : '',
              isMarkedForReview: saved ? Boolean(saved.isMarkedForReview) : false,
              isVisited: idx === 0 // Mark first question visited
            };
          });
          setUserAnswers(initialMap);
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to load examination state');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };

    fetchState();
  }, [attemptId, navigate]);

  // 2. Client-side countdown synced with backend timestamp
  useEffect(() => {
    if (loading || !examData) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, examData]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Helper to persist answer to MySQL
  const persistAnswer = async (qId, answerObj) => {
    try {
      await api.post(`/exam/${attemptId}/save-answer`, {
        questionId: qId,
        selectedOptions: answerObj.selectedOptions,
        descriptiveAnswer: answerObj.descriptiveAnswer,
        isMarkedForReview: answerObj.isMarkedForReview
      });
    } catch (err) {
      console.error('Answer autosave failed:', err);
    }
  };

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? (userAnswers[currentQ.id] || { selectedOptions: [], descriptiveAnswer: '', isMarkedForReview: false }) : null;

  // Handle Option Click (Single choice or True/False)
  const handleSingleSelect = (key) => {
    const updated = {
      ...currentAnswer,
      selectedOptions: [key],
      isVisited: true
    };
    setUserAnswers({ ...userAnswers, [currentQ.id]: updated });
    persistAnswer(currentQ.id, updated);
  };

  // Handle Multi-choice selection toggle
  const handleMultiSelect = (key) => {
    let sel = [...currentAnswer.selectedOptions];
    if (sel.includes(key)) {
      sel = sel.filter((k) => k !== key);
    } else {
      sel.push(key);
    }
    const updated = {
      ...currentAnswer,
      selectedOptions: sel,
      isVisited: true
    };
    setUserAnswers({ ...userAnswers, [currentQ.id]: updated });
    persistAnswer(currentQ.id, updated);
  };

  // Handle Descriptive Text Input
  const handleDescriptiveChange = (text) => {
    const updated = {
      ...currentAnswer,
      descriptiveAnswer: text,
      isVisited: true
    };
    setUserAnswers({ ...userAnswers, [currentQ.id]: updated });
    persistAnswer(currentQ.id, updated);
  };

  // Clear Response
  const handleClearResponse = () => {
    const updated = {
      ...currentAnswer,
      selectedOptions: [],
      descriptiveAnswer: '',
      isVisited: true
    };
    setUserAnswers({ ...userAnswers, [currentQ.id]: updated });
    persistAnswer(currentQ.id, updated);
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    const updated = {
      ...currentAnswer,
      isMarkedForReview: !currentAnswer.isMarkedForReview,
      isVisited: true
    };
    setUserAnswers({ ...userAnswers, [currentQ.id]: updated });
    persistAnswer(currentQ.id, updated);
  };

  // Navigate to Question
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      const targetQ = questions[index];
      // Mark target visited
      setUserAnswers(prev => ({
        ...prev,
        [targetQ.id]: {
          ...(prev[targetQ.id] || { selectedOptions: [], descriptiveAnswer: '', isMarkedForReview: false }),
          isVisited: true
        }
      }));
      setCurrentIndex(index);
    }
  };

  // Calculate palette status for a question
  const getPaletteStatus = (q) => {
    const ans = userAnswers[q.id];
    if (!ans || !ans.isVisited) return 'not_visited';
    const isAnswered =
      (ans.selectedOptions && ans.selectedOptions.length > 0) ||
      (ans.descriptiveAnswer && ans.descriptiveAnswer.trim().length > 0);

    if (ans.isMarkedForReview) {
      return isAnswered ? 'answered_marked' : 'marked';
    }
    return isAnswered ? 'answered' : 'unanswered';
  };

  // Submission
  const submitExam = async (isAuto = false) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/exam/${attemptId}/submit`, { isAutoSubmit: isAuto });
      if (res.data.success) {
        clearInterval(timerRef.current);
        setSubmissionResult(res.data.result);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    submitExam(true);
  };

  // Palette summary counters
  const totalQuestions = questions.length;
  let answeredCount = 0;
  let markedCount = 0;
  let unansweredCount = 0;

  questions.forEach((q) => {
    const status = getPaletteStatus(q);
    if (status === 'answered' || status === 'answered_marked') answeredCount++;
    if (status === 'marked' || status === 'answered_marked') markedCount++;
    if (status === 'unanswered' || status === 'not_visited') unansweredCount++;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <span className="inline-block animate-spin h-6 w-6 border-2 border-indigo-400 border-t-transparent rounded-full"></span>
          <span className="font-semibold text-sm">Initializing secure examination session...</span>
        </div>
      </div>
    );
  }

  // If submitted successfully, show confirmation screen
  if (submissionResult) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-800 rounded-3xl border border-slate-700 p-8 shadow-2xl text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Examination Submitted!</h2>
            <p className="text-xs text-slate-400 mt-1">Your answers have been securely recorded in MySQL 8.0</p>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 grid grid-cols-2 gap-3 text-left text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Total Questions</span>
              <span className="text-white font-bold">{submissionResult.totalQuestions}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Attempted</span>
              <span className="text-indigo-400 font-bold">{submissionResult.attemptedCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Objective Score</span>
              <span className="text-emerald-400 font-bold">{submissionResult.obtainedMarks} / {submissionResult.totalMarks}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Percentage</span>
              <span className="text-emerald-400 font-bold">{submissionResult.percentage}%</span>
            </div>
          </div>

          {submissionResult.hasDescriptiveQuestions && (
            <p className="text-xs text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              Note: This test contains descriptive answers which are pending teacher evaluation. Final grades will update once graded.
            </p>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/student/results')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              View My Results & Performance
            </button>
            <button
              onClick={() => navigate('/student')}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col select-none">
      {/* Top Bar - Distraction Free Header */}
      <header className="h-16 bg-slate-950/80 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight truncate max-w-sm sm:max-w-md">
              {examData?.examTitle}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono font-medium">{examData?.courseCode} - {examData?.courseName}</p>
          </div>
        </div>

        {/* Server-Synchronized Countdown Timer */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black border transition-all ${
              secondsLeft < 60
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : secondsLeft < 300
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTime(secondsLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Finish Test</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Split View) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Question Canvas */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-8 overflow-y-auto">
          {currentQ ? (
            <div className="max-w-3xl w-full mx-auto space-y-6">
              {/* Question Header Meta */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white bg-indigo-600 px-2.5 py-1 rounded-lg">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
                    {currentQ.question_type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{currentQ.difficulty}</span>
                </div>
                <div className="text-xs font-bold text-slate-300 font-mono">
                  Score: <span className="text-emerald-400">+{currentQ.marks}</span> {currentQ.negative_marks > 0 ? <span className="text-rose-400">(-{currentQ.negative_marks})</span> : ''}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base font-semibold text-white leading-relaxed">
                {currentQ.question_text}
              </div>

              {/* Option Choices */}
              <div className="space-y-3 pt-2">
                {currentQ.question_type === 'single_choice' || currentQ.question_type === 'true_false' ? (
                  currentQ.options.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptions?.includes(opt.option_key);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSingleSelect(opt.option_key)}
                        className={`p-3.5 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/50 shadow-xs'
                            : 'bg-slate-800/40 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                            isSelected ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-500 text-slate-400'
                          }`}
                        >
                          {opt.option_key}
                        </div>
                        <span className="flex-1">{opt.option_text}</span>
                      </div>
                    );
                  })
                ) : currentQ.question_type === 'multiple_choice' ? (
                  currentQ.options.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptions?.includes(opt.option_key);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleMultiSelect(opt.option_key)}
                        className={`p-3.5 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/50 shadow-xs'
                            : 'bg-slate-800/40 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs font-bold transition-all ${
                            isSelected ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-500 text-slate-400'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                        <span className="font-bold text-xs text-indigo-400 font-mono">[{opt.option_key}]</span>
                        <span className="flex-1">{opt.option_text}</span>
                      </div>
                    );
                  })
                ) : (
                  /* Descriptive Text Area */
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Write your detailed answer below:
                    </label>
                    <textarea
                      rows={8}
                      value={currentAnswer?.descriptiveAnswer || ''}
                      onChange={(e) => handleDescriptiveChange(e.target.value)}
                      placeholder="Type your response thoroughly. Formulas, algorithms, and logical explanations will be reviewed by instructor..."
                      className="w-full p-4 bg-slate-950/70 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Bottom Action Control Bar */}
          <div className="max-w-3xl w-full mx-auto pt-6 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearResponse}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear Response</span>
              </button>

              <button
                type="button"
                onClick={handleToggleReview}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  currentAnswer?.isMarkedForReview
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-700'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>{currentAnswer?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => goToQuestion(currentIndex - 1)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={currentIndex === questions.length - 1}
                onClick={() => goToQuestion(currentIndex + 1)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-30 cursor-pointer"
              >
                <span>Save & Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Question Palette & Legend */}
        <aside className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col justify-between shrink-0 hidden lg:flex">
          <div className="p-5 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Question Palette
            </h3>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] mb-5 font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-emerald-600"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-amber-500"></span>
                <span>Marked Review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-slate-800 border border-slate-700"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-slate-900 border border-slate-800"></span>
                <span>Not Visited</span>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const status = getPaletteStatus(q);
                const isCurrent = idx === currentIndex;

                let colorClasses = 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700';
                if (status === 'answered') {
                  colorClasses = 'bg-emerald-600 border-emerald-500 text-white';
                } else if (status === 'marked') {
                  colorClasses = 'bg-amber-500 border-amber-400 text-white';
                } else if (status === 'answered_marked') {
                  colorClasses = 'bg-emerald-600 border-amber-400 text-white ring-2 ring-amber-400';
                } else if (status === 'unanswered') {
                  colorClasses = 'bg-rose-900/40 border-rose-800 text-rose-300';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`h-9 rounded-lg border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${colorClasses} ${
                      isCurrent ? 'ring-2 ring-white shadow-md shadow-white/10 scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button in Sidebar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/50">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Submit Examination</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Final Submission</h3>
                <p className="text-xs text-slate-400">Are you sure you want to finalize your exam?</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Questions:</span>
                <span className="font-bold text-white">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Questions Answered:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Questions Unanswered:</span>
                <span className="font-bold text-rose-400">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Marked for Review:</span>
                <span className="font-bold text-amber-400">{markedCount}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Once confirmed, your answers will be committed to MySQL and you will not be able to re-enter this session.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Back to Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitExam(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

