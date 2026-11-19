// frontend/src/pages/dbms/DbmsLab.jsx
// Interactive University DBMS Syllabus Laboratory & Live SQL Query Execution Engine

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Terminal,
  Play,
  Clock,
  Database,
  Code2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DbmsLab() {
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('JOINS');
  const [selectedQueryId, setSelectedQueryId] = useState('');
  const [sqlInput, setSqlInput] = useState('');
  const [currentQueryObj, setCurrentQueryObj] = useState(null);

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [activeView, setActiveView] = useState('results'); // 'results' | 'explain'

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/dbms-lab/catalog');
        if (res.data.success) {
          setCatalog(res.data.queries);
          setCategories(res.data.categories);

          // Select first query in JOINS
          const defaultQ = res.data.queries.find(q => q.category === 'JOINS');
          if (defaultQ) {
            setSelectedQueryId(defaultQ.id);
            setCurrentQueryObj(defaultQ);
            setSqlInput(defaultQ.sql);
          }
        }
      } catch (err) {
        console.error('Failed to load SQL syllabus catalog:', err);
      }
    };
    fetchCatalog();
  }, []);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    const firstInCat = catalog.find(q => q.category === cat);
    if (firstInCat) {
      setSelectedQueryId(firstInCat.id);
      setCurrentQueryObj(firstInCat);
      setSqlInput(firstInCat.sql);
      setQueryResult(null);
      setQueryError(null);
    }
  };

  const handleQuerySelect = (qId) => {
    setSelectedQueryId(qId);
    const found = catalog.find(q => q.id === qId);
    if (found) {
      setCurrentQueryObj(found);
      setSqlInput(found.sql);
      setQueryResult(null);
      setQueryError(null);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await api.post('/dbms-lab/execute', { sql: sqlInput });
      if (res.data.success) {
        setQueryResult(res.data);
      }
    } catch (err) {
      setQueryError(err.response?.data?.error || err.message || 'Execution error');
    } finally {
      setExecuting(false);
    }
  };

  const queriesInCat = catalog.filter(q => q.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Interactive DBMS SQL Laboratory</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              Live MySQL 8.0 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrates university syllabus topics: DDL, DML, Joins, Subqueries, Sets, Views, Window Functions, CTEs, and EXPLAIN plans
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategorySelect(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Curated Query Navigator & Theory Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Available {selectedCategory} Demonstrations
            </h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {queriesInCat.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleQuerySelect(q.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold transition-all flex items-start gap-2 cursor-pointer ${
                    selectedQueryId === q.id
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Code2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight">{q.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Academic Concept Explanation Box */}
          {currentQueryObj && (
            <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-sm space-y-3 border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">DBMS Pedagogical Concept</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentQueryObj.description}
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <strong className="text-white">Relational Mechanics:</strong> {currentQueryObj.concept}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Span 2): SQL Code Editor & Live Execution Canvas */}
        <div className="lg:col-span-2 space-y-4">
          {/* SQL Editor Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-mono font-semibold">MySQL 8.0 Query Console</span>
              </div>
              <button
                type="button"
                disabled={executing || !sqlInput.trim()}
                onClick={handleExecute}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-white" />
                <span>{executing ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-50/50 focus:outline-hidden focus:bg-white resize-y"
              placeholder="Type any valid MySQL SELECT, JOIN, WINDOW FUNCTION, CTE or EXPLAIN query..."
            />
          </div>

          {/* Results / Error Area */}
          {queryError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong>MySQL Execution Error:</strong>
                <p className="mt-1">{queryError}</p>
              </div>
            </div>
          )}

          {queryResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Output Header */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="font-bold text-slate-800">
                    {queryResult.rowCount} {queryResult.rowCount === 1 ? 'row' : 'rows'} returned
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{queryResult.executionTimeMs} ms</span>
                  </span>
                </div>

                {queryResult.explainPlan && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveView('results')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        activeView === 'results' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Result Tuples
                    </button>
                    <button
                      onClick={() => setActiveView('explain')}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        activeView === 'explain' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      EXPLAIN Optimizer Plan
                    </button>
                  </div>
                )}
              </div>

              {/* View 1: Results Table */}
              {activeView === 'results' && (
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 font-mono border-b border-slate-200 sticky top-0">
                        {queryResult.columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {queryResult.columns.map((col) => (
                            <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-700">
                              {row[col] !== null && row[col] !== undefined
                                ? (typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col]))
                                : <span className="text-slate-400 italic">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View 2: EXPLAIN Plan Table */}
              {activeView === 'explain' && queryResult.explainPlan && (
                <div className="max-h-80 overflow-auto p-2">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 border-b border-slate-200">
                        <th className="py-2 px-3">id</th>
                        <th className="py-2 px-3">select_type</th>
                        <th className="py-2 px-3">table</th>
                        <th className="py-2 px-3">type</th>
                        <th className="py-2 px-3">possible_keys</th>
                        <th className="py-2 px-3">key</th>
                        <th className="py-2 px-3">rows</th>
                        <th className="py-2 px-3">Extra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queryResult.explainPlan.map((step, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50">
                          <td className="py-2 px-3">{step.id}</td>
                          <td className="py-2 px-3">{step.select_type}</td>
                          <td className="py-2 px-3 font-bold text-indigo-600">{step.table}</td>
                          <td className="py-2 px-3 text-emerald-600 font-semibold">{step.type}</td>
                          <td className="py-2 px-3 text-slate-500">{step.possible_keys || '—'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{step.key || '—'}</td>
                          <td className="py-2 px-3 font-bold">{step.rows}</td>
                          <td className="py-2 px-3 text-slate-500 text-[10px]">{step.Extra}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

