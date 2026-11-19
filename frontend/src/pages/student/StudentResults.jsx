// frontend/src/pages/student/StudentResults.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Award, ArrowRight, CheckCircle2, Clock, Calendar } from 'lucide-react';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get('/student/results');
        if (res.data.success) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Examination Results & Scorecards</h2>
        <p className="text-xs text-slate-500 mt-0.5">Published score reports, letter grades, and percentile ranks</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading student results...</div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          No examination results have been released yet by instructors.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {results.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {res.course_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      res.is_passed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {res.is_passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{res.exam_title}</h3>
                <p className="text-xs text-slate-500 mt-1">{res.course_name}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center font-mono">
                  <div>
                    <span className="text-[10px] uppercase font-sans text-slate-400 block font-semibold">Marks</span>
                    <span className="text-sm font-bold text-slate-900">{res.obtained_marks} / {res.total_marks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans text-slate-400 block font-semibold">Score</span>
                    <span className="text-sm font-bold text-emerald-600">{res.percentage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans text-slate-400 block font-semibold">Grade</span>
                    <span className="text-sm font-bold text-indigo-600">{res.grade}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Class Rank: <strong className="text-slate-800">{res.rank_in_exam ? `#${res.rank_in_exam}` : '—'}</strong></span>
                  <span>Time Spent: {res.duration_spent_minutes || 0} mins</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <Link
                  to={`/student/results/${res.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Detailed Scorecard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

