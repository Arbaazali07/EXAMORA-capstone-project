// frontend/src/pages/student/ResultDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Award, Clock } from 'lucide-react';

export default function ResultDetail() {
  const { resultId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/student/results/${resultId}`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to load result scorecard');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [resultId]);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading comprehensive scorecard...</div>;
  }

  const result = data?.result;
  const questions = data?.questions || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/student/results"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Examination Scorecard</h2>
          <p className="text-xs text-slate-500 mt-0.5">{result?.exam_title}</p>
        </div>
      </div>

      {/* Summary Score Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
            {result?.course_code} - {result?.course_name}
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">{result?.exam_title}</h3>
          <p className="text-xs text-slate-500">
            Completed on {new Date(result?.attempt_submit_time).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Score</span>
            <span className="text-2xl font-black text-slate-900">{result?.obtained_marks} / {result?.total_marks}</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade</span>
            <span className="text-2xl font-black text-indigo-600">{result?.grade}</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Rank</span>
            <span className="text-2xl font-black text-emerald-600">{result?.rank_in_exam ? `#${result.rank_in_exam}` : '—'}</span>
          </div>
        </div>
      </div>

      {/* Question Breakdown List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Question-by-Question Review</h3>

        {questions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
            Detailed answer sheets will be released after instructor finalizes all evaluations.
          </div>
        ) : (
          questions.map((q, idx) => {
            let parsedChosen = [];
            if (q.selected_options) {
              try {
                parsedChosen = typeof q.selected_options === 'string' ? JSON.parse(q.selected_options) : q.selected_options;
              } catch {
                parsedChosen = [q.selected_options];
              }
            }

            return (
              <div key={q.question_id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-indigo-600">Question {idx + 1}</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {q.question_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Topic: {q.topic}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Marks: <strong className="text-indigo-600">{q.marks_obtained}</strong> / {q.max_marks}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900">{q.question_text}</p>

                {/* Objective choices */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => {
                      const isChosen = parsedChosen.includes(opt.option_key);
                      const isCorrect = Boolean(opt.is_correct);

                      let borderClass = 'border-slate-200 bg-slate-50/50 text-slate-700';
                      if (isCorrect) borderClass = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold';
                      else if (isChosen && !isCorrect) borderClass = 'border-rose-300 bg-rose-50 text-rose-800';

                      return (
                        <div key={opt.option_key} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${borderClass}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{opt.option_key}.</span>
                            <span>{opt.option_text}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] uppercase font-bold">
                            {isChosen && <span className="bg-slate-200 text-slate-700 px-1 rounded">Your Pick</span>}
                            {isCorrect && <span className="text-emerald-700">Correct</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Descriptive response */}
                {q.question_type === 'descriptive' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
                      <strong>Your Answer:</strong>
                      <p className="mt-1 whitespace-pre-wrap text-slate-700">{q.descriptive_answer || '(No answer provided)'}</p>
                    </div>
                    {q.teacher_feedback && (
                      <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-900">
                        <strong>Instructor Feedback:</strong> {q.teacher_feedback}
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span><strong>Explanation:</strong> {q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

