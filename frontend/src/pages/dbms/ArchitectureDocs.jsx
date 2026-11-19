// frontend/src/pages/dbms/ArchitectureDocs.jsx
import React, { useState } from 'react';
import { Database, Layers, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ArchitectureDocs() {
  const [activeTab, setActiveTab] = useState('erd');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Database Architecture & Relational Design</h2>
        <p className="text-xs text-slate-500 mt-0.5">Conceptual ER diagram, normalization stages, and InnoDB physical schema</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('erd')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'erd' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ER Model & Cardinalities
        </button>
        <button
          onClick={() => setActiveTab('norm')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'norm' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Normalization (1NF to BCNF)
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'tables' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          16 Normalized Tables
        </button>
      </div>

      {/* TAB 1: ER Model */}
      {activeTab === 'erd' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Entity-Relationship Conceptual Design</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Structural relationships, specialization hierarchies, and associative entities in EXAMORA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-indigo-600 uppercase font-mono">1:1 Specialization</span>
              <h4 className="text-sm font-bold text-slate-900">Users to Students & Teachers</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized authentication in <code className="font-mono text-indigo-600 font-bold">users</code>, specialized 1:1 with unique foreign keys into <code className="font-mono text-indigo-600">students</code> and <code className="font-mono text-indigo-600">teachers</code> without NULL-value column bloat.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-emerald-600 uppercase font-mono">1:N Hierarchies</span>
              <h4 className="text-sm font-bold text-slate-900">Departments to Courses & Faculty</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                One department offers many courses and employs multiple faculty members. Protected with <code className="font-mono text-emerald-600 font-bold">ON DELETE RESTRICT</code> on students to preserve student records.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-violet-600 uppercase font-mono">M:N Associative Tables</span>
              <h4 className="text-sm font-bold text-slate-900">Exams, Questions & Attempts</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Many-to-many relationships are cleanly decomposed into associative tables: <code className="font-mono text-violet-600">teacher_courses</code>, <code className="font-mono text-violet-600">exam_questions</code>, and <code className="font-mono text-violet-600">student_answers</code>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-indigo-400 font-bold mb-2">// Relational Schema Mapping Overview</div>
            <div>USERS(id [PK], username [UK], email [UK], password_hash, role, full_name)</div>
            <div>STUDENTS(id [PK], user_id [FK &rarr; USERS, UK], roll_number [UK], department_id [FK], semester_id [FK])</div>
            <div>TEACHERS(id [PK], user_id [FK &rarr; USERS, UK], employee_id [UK], department_id [FK], designation)</div>
            <div>DEPARTMENTS(id [PK], dept_code [UK], dept_name)</div>
            <div>COURSES(id [PK], course_code [UK], course_name, department_id [FK], credits)</div>
            <div>SEMESTERS(id [PK], semester_code [UK], semester_name, academic_year)</div>
            <div>TEACHER_COURSES(id [PK], teacher_id [FK], course_id [FK], semester_id [FK], [UK: teacher+course+sem])</div>
            <div>EXAMS(id [PK], title, course_id [FK], semester_id [FK], teacher_id [FK], start_time, end_time, duration, marks)</div>
            <div>QUESTIONS(id [PK], course_id [FK], teacher_id [FK], question_text, type, marks, negative_marks)</div>
            <div>QUESTION_OPTIONS(id [PK], question_id [FK], option_key, option_text, is_correct)</div>
            <div>EXAM_QUESTIONS(id [PK], exam_id [FK], question_id [FK], question_order, [UK: exam+question])</div>
            <div>REGISTRATIONS(id [PK], exam_id [FK], student_id [FK], status, [UK: exam+student])</div>
            <div>ATTEMPTS(id [PK], exam_id [FK], student_id [FK], start_time, submit_time, status, total_score, is_passed)</div>
            <div>STUDENT_ANSWERS(id [PK], attempt_id [FK], question_id [FK], selected_options [JSON], descriptive_answer, marks)</div>
            <div>RESULTS(id [PK], attempt_id [FK, UK], exam_id [FK], student_id [FK], marks, percentage, grade, rank_in_exam)</div>
            <div>AUDIT_LOGS(id [PK], user_id [FK], action, entity_type, entity_id, details [JSON], created_at)</div>
          </div>
        </div>
      )}

      {/* TAB 2: Normalization */}
      {activeTab === 'norm' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Decomposition Stages (0NF to BCNF)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Formal mathematical elimination of redundancy and dependencies</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold text-indigo-600 font-mono">1NF (First Normal Form)</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                Eliminated repeating groups and multivalued attributes. Option keys and texts were decoupled into atomic tuples in <code className="font-mono text-indigo-600 font-bold">question_options</code>. All column domains are atomic.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold text-indigo-600 font-mono">2NF (Second Normal Form)</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                Eliminated partial dependencies. In composite candidate keys like <code className="font-mono">{'{student_roll, exam_id, question_id}'}</code>, non-prime attributes like student name and exam title were separated into <code className="font-mono text-indigo-600 font-bold">students</code>, <code className="font-mono text-indigo-600 font-bold">exams</code>, and <code className="font-mono text-indigo-600 font-bold">questions</code> so every non-prime attribute depends on the full key.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold text-indigo-600 font-mono">3NF (Third Normal Form)</span>
              <p className="text-xs text-slate-700 leading-relaxed">
                Eliminated transitive dependencies (<code className="font-mono">student_roll -&gt; dept_code -&gt; dept_name</code>). Department and Semester metadata were isolated into independent entity tables referenced exclusively through foreign keys.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <span className="text-xs font-bold text-emerald-700 font-mono">BCNF (Boyce-Codd Normal Form)</span>
              <p className="text-xs text-emerald-950 leading-relaxed">
                In every single functional dependency X -&gt; Y in the EXAMORA relational model, X is guaranteed to be a superkey. There are zero non-superkeys determining prime attributes. Lossless join decomposition and dependency preservation are mathematically verified.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Tables list */}
      {activeTab === 'tables' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Table Name</th>
                <th className="py-3 px-4">Engine</th>
                <th className="py-3 px-4">Primary Key</th>
                <th className="py-3 px-4">Foreign Keys</th>
                <th className="py-3 px-4">Key Constraints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {[
                { n: 1, name: 'users', pk: 'id', fk: 'None', c: 'UK(username), UK(email)' },
                { n: 2, name: 'departments', pk: 'id', fk: 'None', c: 'UK(dept_code)' },
                { n: 3, name: 'semesters', pk: 'id', fk: 'None', c: 'UK(semester_code)' },
                { n: 4, name: 'courses', pk: 'id', fk: 'department_id', c: 'UK(course_code), CHECK(credits)' },
                { n: 5, name: 'teachers', pk: 'id', fk: 'user_id, department_id', c: 'UK(user_id), UK(employee_id)' },
                { n: 6, name: 'students', pk: 'id', fk: 'user_id, dept_id, sem_id', c: 'UK(user_id), UK(roll_number)' },
                { n: 7, name: 'teacher_courses', pk: 'id', fk: 'teacher_id, course_id, sem_id', c: 'UK(teacher+course+sem)' },
                { n: 8, name: 'exams', pk: 'id', fk: 'course_id, sem_id, teacher_id', c: 'CHECK(duration>0, marks>0)' },
                { n: 9, name: 'questions', pk: 'id', fk: 'course_id, teacher_id', c: 'CHECK(marks>0)' },
                { n: 10, name: 'question_options', pk: 'id', fk: 'question_id', c: 'CASCADE on delete' },
                { n: 11, name: 'exam_questions', pk: 'id', fk: 'exam_id, question_id', c: 'UK(exam+question)' },
                { n: 12, name: 'registrations', pk: 'id', fk: 'exam_id, student_id', c: 'UK(exam+student)' },
                { n: 13, name: 'attempts', pk: 'id', fk: 'exam_id, student_id', c: 'status ENUM, concurrency locks' },
                { n: 14, name: 'student_answers', pk: 'id', fk: 'attempt_id, question_id', c: 'UK(attempt+question), JSON options' },
                { n: 15, name: 'results', pk: 'id', fk: 'attempt_id, exam_id, student_id', c: 'UK(attempt_id), DENSE_RANK' },
                { n: 16, name: 'audit_logs', pk: 'id', fk: 'user_id (ON DELETE SET NULL)', c: 'JSON details, immutable log' }
              ].map((t) => (
                <tr key={t.name} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-400">{t.n}</td>
                  <td className="py-2.5 px-4 font-bold text-indigo-600">{t.name}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-sans">InnoDB</td>
                  <td className="py-2.5 px-4 text-slate-800 font-bold">{t.pk}</td>
                  <td className="py-2.5 px-4 text-slate-600">{t.fk}</td>
                  <td className="py-2.5 px-4 text-emerald-700 text-[11px]">{t.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
