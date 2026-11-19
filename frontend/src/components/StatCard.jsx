// frontend/src/components/StatCard.jsx
import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-500/20',
    violet: 'bg-violet-50 text-violet-600 ring-violet-500/20',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20',
    amber: 'bg-amber-50 text-amber-600 ring-amber-500/20',
    rose: 'bg-rose-50 text-rose-600 ring-rose-500/20',
    sky: 'bg-sky-50 text-sky-600 ring-sky-500/20'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ring-1 ${colorMap[color] || colorMap.indigo}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{value ?? '—'}</span>
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}

