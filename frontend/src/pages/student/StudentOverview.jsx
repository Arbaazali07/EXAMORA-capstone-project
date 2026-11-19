// frontend/src/pages/student/StudentOverview.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { ClipboardList, Award, CheckCircle2, TrendingUp, ArrowRight, Play } from 'lucide-react';

export default function StudentOverview() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/student/dashboard');
        if (res.data.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading student dashboard...</div>;
  }

  const stats = dashboardData?.stats || {};
  const upcomingExams = dashboardData?.upcomingExams || [];
  const recentResults = dashboardData?.recentResults || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Student Academic Portal</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track upcoming tests, active sessions, and published performance scorecards</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Exams"
          value={stats.registered_exams_count}
          subtext="Current semester enrollments"
          icon={ClipboardList}
          color="indigo"
        />
        <StatCard
          title="Completed Exams"
          value={stats.completed_exams_count}
          subtext="Submitted & evaluated"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={stats.overall_avg_percentage ? `${stats.overall_avg_percentage}%` : '—'}
          subtext="Cumulative performance"
          icon={TrendingUp}
          color="violet"
        />
        <StatCard
          title="Passed Exams"
          value={stats.exams_passed_count}
          subtext={`Out of ${stats.completed_exams_count || 0} completed`}
          icon={Award}
          color="sky"
        />
      </div>

      {/* Active & Upcoming Examinations */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Upcoming & Available Examinations</h3>
          <Link to="/student/available-exams" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>View All Exams</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingExams.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs">
              No upcoming exams scheduled for your enrolled semester right now.
            </div>
          ) : (
            upcomingExams.map((exam) => (
              <div key={exam.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {exam.course_code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {exam.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{exam.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">Instructor: {exam.instructor_name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    Duration: {exam.duration_minutes}m | Max: {exam.total_marks} marks
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(exam.start_time).toLocaleDateString()}
                  </span>
                  <Link
                    to="/student/available-exams"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                  >
                    <span>Go to Test</span>
                    <Play className="h-3 w-3 fill-white" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Published Results */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Recent Examination Results</h3>
          <Link to="/student/results" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>View All Scorecards</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Examination</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Marks</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No examination results released yet.
                  </td>
                </tr>
              ) : (
                recentResults.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{res.exam_title}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{res.course_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {res.obtained_marks} / {res.total_marks}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{res.percentage}%</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {res.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600">
                      {res.rank_in_exam ? `#${res.rank_in_exam}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          res.is_passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {res.is_passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/student/results/${res.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>Scorecard</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
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

