// frontend/src/pages/admin/AdminOverview.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/analytics/overview')
        ]);
        if (statsRes.data.success) setData(statsRes.data);
        if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <span className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mr-2"></span>
        Loading university assessment analytics...
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">University Academic Overview</h2>
        <p className="text-xs text-slate-500 mt-0.5">Real-time examination statistics aggregated from MySQL 8.0</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.total_students}
          subtext="Enrolled across 3 departments"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Faculty Instructors"
          value={stats.total_teachers}
          subtext="Across CSE, IT, and ECE"
          icon={GraduationCap}
          color="violet"
        />
        <StatCard
          title="Examinations"
          value={stats.total_exams}
          subtext="Scheduled and published"
          icon={ClipboardList}
          color="sky"
        />
        <StatCard
          title="Completed Attempts"
          value={stats.total_submissions}
          subtext={`Pass Rate: ${stats.overall_pass_rate || 0}%`}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department-wise Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Department Performance & Pass Rates</h3>
              <p className="text-xs text-slate-500">Average score (%) and pass percentage across academic departments</p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Live Aggregate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.departmentPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dept_code" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avg_percentage" name="Avg Score (%)" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pass_percentage" name="Pass Rate (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Grade Distribution</h3>
            <p className="text-xs text-slate-500">Proportion of student letter grades</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.gradeDistribution || []}
                  dataKey="count"
                  nameKey="grade"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {(analytics?.gradeDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Overall University Average: <span className="font-bold text-slate-800">{stats.overall_avg_percentage || 0}%</span>
          </div>
        </div>
      </div>

      {/* Recent Examinations Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Recent Examinations</h3>
          <span className="text-xs text-slate-500">Latest active test sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(data?.recentExams || []).map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{exam.title}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-600">{exam.course_code}</td>
                  <td className="py-3 px-4 text-slate-600">{exam.instructor_name}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(exam.start_time).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{exam.attempt_count}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        exam.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : exam.status === 'ongoing'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {exam.status}
                    </span>
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

