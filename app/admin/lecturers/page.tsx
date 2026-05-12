'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────
type View = 'list' | 'add' | 'migrate' | 'workload' | 'submissions';

interface Lecturer {
  id: string;
  lecturer_number: string;
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  campus: string[];
  created_at: string;
}

interface UnitAssignment {
  id: string;
  lecturer_id: string;
  course_id: string;
  unit_code: string;
  campus: string;
  class_id: string;
  is_active: boolean;
  module_index: number;
  semester: number;
  intake: string;
  courses?: { name: string };
  classes?: { class_name: string };
  units?: { name: string };
}

interface SubmissionRow {
  lecturer_name: string;
  course_name: string;
  class_name: string;
  intake: string;
  module_index: number;
  semester: number;
  unit_code: string;
  name: string;
  total_records: number;
  submitted: number;
  pending: number;
  last_submitted_at: string | null;
  status: string;
}

interface FormData {
  fullName: string;
  phone: string;
  gender: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const campusLabel = (c: string | string[]) => {
  if (Array.isArray(c)) return c.map(x => x === 'main' ? 'Main' : x === 'west' ? 'West' : x).join(', ');
  return c === 'main' ? 'Main' : c === 'west' ? 'West' : c;
};

const genderIcon = (g: string) => g === 'female' ? '♀' : g === 'male' ? '♂' : '—';

const statusColor = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'submitted': case 'complete': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending':   return 'bg-amber-50 text-amber-700 border-amber-200';
    default:          return 'bg-gray-50 text-gray-500 border-gray-200';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function LecturersPage() {
  const router = useRouter();
  const [sb, setSb]           = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus]   = useState('');
  const [view, setView]       = useState<View>('list');
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [lecturers,    setLecturers]    = useState<Lecturer[]>([]);
  const [assignments,  setAssignments]  = useState<UnitAssignment[]>([]);
  const [submissions,  setSubmissions]  = useState<SubmissionRow[]>([]);
  const [dataLoading,  setDataLoading]  = useState(false);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [search,       setSearch]       = useState('');

  // Form
  const [form, setForm] = useState<FormData>({
    fullName: '', phone: '', gender: '',
  });

  // Migrate
  const [migrateFrom, setMigrateFrom] = useState('');
  const [migrateTo,   setMigrateTo]   = useState('');

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const client = createClient();
    setSb(client);
    (async () => {
      const { data: { session } } = await client.auth.getSession();
      if (!session) { router.push('/login/admin'); return; }
      const role = session.user?.user_metadata?.role;
      if (role !== 'admin') { router.push('/login/admin'); return; }
      setCampus(session.user?.user_metadata?.campus ?? '');
      setLoading(false);
    })();
  }, [router]);

  // ── Load lecturers ────────────────────────────────────────────────────────
  const loadLecturers = useCallback(async () => {
    if (!sb) return;
    setDataLoading(true);
    const { data } = await sb.from('lecturers').select('*').order('full_name');
    setLecturers(data ?? []);
    setDataLoading(false);
  }, [sb]);

  // ── Load workload (unit assignments joined) ───────────────────────────────
  const loadWorkload = useCallback(async () => {
    if (!sb) return;
    setDataLoading(true);
    const { data } = await sb
      .from('lecturer_unit_assignments')
      .select(`
        id, lecturer_id, course_id, unit_code, campus, class_id,
        is_active, module_index, semester, intake,
        courses(name),
        classes(class_name)
      `)
      .order('module_index');
    setAssignments(data ?? []);
    setDataLoading(false);
  }, [sb]);

  // ── Load submissions from v_lecturer_submission_status ───────────────────
  const loadSubmissions = useCallback(async () => {
    if (!sb) return;
    setDataLoading(true);
    // Get active unit assignments as submission proxy
    const { data: assignments } = await sb
      .from('lecturer_unit_assignments')
      .select('id, lecturer_id, unit_code, course_id, campus, is_active, class_id')
      .eq('is_active', true);

    // Get exam marks to check submission status
    const { data: marks } = await sb
      .from('exam_marks')
      .select('unit_code, count', { count: 'exact' });

    // Map to match expected submission status shape
    const submissionStatus = (assignments || []).map((a: any) => ({
      unit_code: a.unit_code,
      course_name: a.course_id,
      lecturer_id: a.lecturer_id,
      campus: a.campus,
      total_records: 1,
      pending: a.is_active ? 1 : 0,
      submitted: 0,
    }));
    setSubmissions(submissionStatus);
    setDataLoading(false);
  }, [sb]);

  useEffect(() => {
    if (!sb) return;
    if (view === 'list')        loadLecturers();
    if (view === 'workload')    { loadLecturers(); loadWorkload(); }
    if (view === 'submissions') loadSubmissions();
    if (view === 'migrate')     loadLecturers();
  }, [view, sb, loadLecturers, loadWorkload, loadSubmissions]);

  // ── Save lecturer ─────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { showToast('Full name is required', false); return; }
    if (!form.phone.trim())    { showToast('Phone number is required', false); return; }

    setSubmitting(true);
    const payload = {
      full_name: form.fullName,
      phone:     form.phone,
      gender:    form.gender,
      campus:    ['main', 'west'],
    };

    // Set email based on input or auto-generate
    (payload as any).email = `${form.fullName.toLowerCase().replace(/\s+/g, '.')}@eavicollege.ac.ke`;

    const { error } = editId
      ? await sb.from('lecturers').update(payload).eq('id', editId)
      : await sb.from('lecturers').insert([payload]).select().single();

    if (error) {
      showToast(error.message, false);
    } else {
      showToast(editId ? 'Lecturer updated!' : 'Lecturer added!');
      setForm({ fullName: '', phone: '', gender: '' });
      setEditId(null);
      setView('list');
    }
    setSubmitting(false);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (l: Lecturer) => {
    setEditId(l.id);
    setForm({ fullName: l.full_name, phone: l.phone, gender: l.gender ?? '' });
    setView('add');
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const { error } = await sb.from('lecturers').delete().eq('id', id);
    error ? showToast('Delete failed: ' + error.message, false) : showToast('Lecturer deleted.');
    loadLecturers();
  };

  // ── Migrate ───────────────────────────────────────────────────────────────
  const handleMigrate = async () => {
    if (!migrateFrom || !migrateTo || migrateFrom === migrateTo) {
      showToast('Select two different lecturers', false); return;
    }
    if (!confirm('Migrate all unit assignments? This cannot be undone.')) return;
    setSubmitting(true);
    const { error } = await sb
      .from('lecturer_unit_assignments')
      .update({ lecturer_id: migrateTo })
      .eq('lecturer_id', migrateFrom);
    error ? showToast('Migration failed: ' + error.message, false) : showToast('Assignments migrated!');
    setMigrateFrom(''); setMigrateTo('');
    setSubmitting(false);
  };

  // ── Filtered lecturers ────────────────────────────────────────────────────
  const filtered = lecturers.filter(l =>
    !search || l.full_name.toLowerCase().includes(search.toLowerCase()) ||
    l.lecturer_number.toLowerCase().includes(search.toLowerCase())
  );

  // ── Workload: group assignments by lecturer ───────────────────────────────
  const workloadByLecturer = lecturers.map(l => ({
    ...l,
    units: assignments.filter(a => a.lecturer_id === l.id),
  })).filter(l => l.units.length > 0);

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#888] tracking-widest uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  // ─── TABS ─────────────────────────────────────────────────────────────────
  const tabs: { id: View; label: string }[] = [
    { id: 'list',        label: 'All Lecturers' },
    { id: 'add',         label: editId ? 'Edit' : 'Add New' },
    { id: 'workload',    label: 'Workload' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'migrate',     label: 'Migrate' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f4f0]" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border
          ${toast.ok
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gray-50 border-b border-[#e8e7e3] h-14">
        <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard"
              className="p-1.5 rounded-lg hover:bg-[#f5f4f0] transition-colors text-[#666]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-[#1a1a1a] leading-none">Lecturer Management</h1>
              <p className="text-[10px] text-[#999] mt-0.5 uppercase tracking-widest">
                {campus === 'main' ? 'Main Campus' : campus === 'west' ? 'West Campus' : 'All Campuses'} · {lecturers.length} lecturers
              </p>
            </div>
          </div>
          <button
            onClick={() => { setEditId(null); setForm({ fullName: '', phone: '', gender: '' }); setView('add'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#333] text-white text-xs font-medium rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Lecturer</span>
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">

        {/* ── TABS ──────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 bg-gray-50 border border-[#e8e7e3] rounded-xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id}
              onClick={() => setView(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                ${view === t.id
                  ? 'bg-green-600 text-white'
                  : 'text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f4f0]'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LIST VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {view === 'list' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" placeholder="Search by name or number…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-[#e8e7e3] rounded-xl text-sm text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
              />
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border border-[#e8e7e3] py-16 text-center">
                <p className="text-sm text-[#aaa]">No lecturers found.</p>
                <button onClick={() => setView('add')} className="mt-3 text-xs text-[#1a1a1a] underline underline-offset-2">Add the first one</button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-gray-50 rounded-xl border border-[#e8e7e3] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#faf9f6]">
                      <tr>
                        {['Lecturer', 'Number', 'Phone', 'Gender', 'Campus', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#888] uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f4f0]">
                      {filtered.map(l => (
                        <tr key={l.id} className="hover:bg-[#faf9f6] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {l.full_name[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-[#1a1a1a]">{l.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-[#666] bg-[#f5f4f0] px-2 py-1 rounded-md">{l.lecturer_number}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#666]">{l.phone}</td>
                          <td className="px-4 py-3 text-sm text-[#666] capitalize">
                            <span className="text-base">{genderIcon(l.gender)}</span> {l.gender || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#888]">{campusLabel(l.campus)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={() => { if (navigator.clipboard) { navigator.clipboard.writeText(l.lecturer_number).then(() => showToast('Copied!')); } else { showToast('Copy not supported'); } }}
                                className="text-[10px] text-[#888] hover:text-[#1a1a1a] px-2 py-1 rounded-md hover:bg-[#f5f4f0] transition-colors">
                                Copy #
                              </button>
                              <button onClick={() => startEdit(l)}
                                className="text-[10px] text-[#1a1a1a] px-2 py-1 rounded-md border border-[#e8e7e3] hover:bg-[#f5f4f0] transition-colors">
                                Edit
                              </button>
                              <button onClick={() => handleDelete(l.id, l.full_name)}
                                className="text-[10px] text-red-600 px-2 py-1 rounded-md border border-red-100 hover:bg-red-50 transition-colors">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {filtered.map(l => (
                    <div key={l.id} className="bg-gray-50 rounded-xl border border-[#e8e7e3] p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                            {l.full_name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1a1a1a] truncate">{l.full_name}</p>
                            <p className="text-[10px] font-mono text-[#888] mt-0.5">{l.lecturer_number}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => startEdit(l)}
                            className="text-[10px] px-2 py-1 border border-[#e8e7e3] rounded-lg text-[#444] hover:bg-[#f5f4f0]">Edit</button>
                          <button onClick={() => handleDelete(l.id, l.full_name)}
                            className="text-[10px] px-2 py-1 border border-red-100 rounded-lg text-red-600 hover:bg-red-50">Del</button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-[#888]">
                        <span>{l.phone}</span>
                        <span className="capitalize">{genderIcon(l.gender)} {l.gender || '—'}</span>
                        <span>{campusLabel(l.campus)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            ADD / EDIT VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {view === 'add' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gray-50 rounded-xl border border-[#e8e7e3] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f5f4f0]">
                <h2 className="text-sm font-semibold text-[#1a1a1a]">{editId ? 'Edit Lecturer' : 'Add New Lecturer'}</h2>
                {editId && (
                  <button onClick={() => { setEditId(null); setForm({ fullName: '', phone: '', gender: '' }); }}
                    className="text-[10px] text-[#888] hover:text-[#1a1a1a] mt-0.5">
                    Cancel edit →
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* Lecturer Number — auto-generated by DB */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-1.5">
                    Lecturer Number
                  </label>
                  <div className="px-3 py-2.5 bg-[#f5f4f0] border border-[#e8e7e3] rounded-lg text-xs text-[#666]">
                    Auto-generated (LECXXXXXX)
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.fullName} required placeholder="e.g. Jane Wanjiku Mwangi"
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-[#e8e7e3] rounded-lg text-sm text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-1.5">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input type="tel" value={form.phone} required placeholder="e.g. 0712 345 678"
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-[#e8e7e3] rounded-lg text-sm text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-1.5">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-3">
                    {['male', 'female'].map(g => (
                      <button key={g} type="button"
                        onClick={() => setForm(f => ({ ...f, gender: g }))}
                        className={`flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors
                          ${form.gender === g
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-gray-50 text-[#555] border-[#e8e7e3] hover:border-[#aaa]'
                          }`}>
                        {genderIcon(g)} {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campus info */}
                <div className="bg-[#f5f4f0] rounded-lg px-4 py-3">
                  <p className="text-[10px] text-[#888] uppercase tracking-widest font-semibold mb-1">Campus Access</p>
                  <p className="text-xs text-[#555]">All lecturers are registered across <strong>Main</strong> and <strong>West</strong> campuses by default.</p>
                </div>

                {/* Submit */}
                <button type="submit" disabled={submitting}
                  className="w-full py-3 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (editId ? 'Saving…' : 'Adding…') : (editId ? 'Save Changes' : 'Add Lecturer')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            WORKLOAD VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {view === 'workload' && (
          <div className="space-y-3">
            {dataLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : workloadByLecturer.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border border-[#e8e7e3] py-16 text-center">
                <p className="text-sm text-[#aaa]">No unit assignments found.</p>
              </div>
            ) : workloadByLecturer.map(l => (
              <div key={l.id} className="bg-gray-50 rounded-xl border border-[#e8e7e3] overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                  className="w-full px-4 py-4 flex items-center justify-between gap-3 hover:bg-[#faf9f6] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {l.full_name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{l.full_name}</p>
                      <p className="text-[10px] text-[#888] font-mono">{l.lecturer_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[#888]">
                      <span className="font-semibold text-[#1a1a1a]">{l.units.length}</span> unit{l.units.length !== 1 ? 's' : ''}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border
                      ${l.units.filter((u: UnitAssignment) => u.is_active).length > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                      {l.units.filter((u: UnitAssignment) => u.is_active).length} active
                    </span>
                    <svg className={`w-4 h-4 text-[#aaa] transition-transform ${expandedId === l.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedId === l.id && (
                  <div className="border-t border-[#f5f4f0] divide-y divide-[#f5f4f0]">
                    {l.units.map((u: UnitAssignment) => (
                      <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1a1a1a]">
                            {u.units?.name ?? u.unit_code}
                          </p>
                          <p className="text-[10px] text-[#888] mt-0.5">
                            {u.courses?.name ?? u.course_id} · {u.classes?.class_name ?? u.class_id} · Mod {u.module_index} Sem {u.semester}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[#888] capitalize">{u.campus}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SUBMISSIONS VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {view === 'submissions' && (
          <div className="space-y-3">
            {dataLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border border-[#e8e7e3] py-16 text-center">
                <p className="text-sm text-[#aaa]">No submission data found.</p>
              </div>
            ) : (
              <>
                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Units', value: submissions.length },
                    { label: 'Submitted', value: submissions.filter(s => s.pending === 0 && s.total_records > 0).length },
                    { label: 'Pending', value: submissions.filter(s => s.pending > 0).length },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl border border-[#e8e7e3] px-4 py-3 text-center">
                      <p className="text-xl font-semibold text-[#1a1a1a]">{s.value}</p>
                      <p className="text-[10px] text-[#888] uppercase tracking-widest mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-gray-50 rounded-xl border border-[#e8e7e3] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#faf9f6]">
                      <tr>
                        {['Lecturer', 'Unit', 'Class', 'Mod / Sem', 'Records', 'Submitted', 'Pending', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#888] uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f4f0]">
                      {submissions.map((s, i) => (
                        <tr key={i} className="hover:bg-[#faf9f6] transition-colors">
                          <td className="px-4 py-3 text-xs font-medium text-[#1a1a1a] whitespace-nowrap">{s.lecturer_name}</td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-[#1a1a1a] font-medium">{s.name ?? s.unit_code}</p>
                            <p className="text-[10px] text-[#888] font-mono">{s.unit_code}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#666] whitespace-nowrap">{s.class_name}</td>
                          <td className="px-4 py-3 text-xs text-[#666]">M{s.module_index} S{s.semester}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-[#1a1a1a] text-center">{s.total_records}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-emerald-600 text-center">{s.submitted}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-center">
                            <span className={s.pending > 0 ? 'text-amber-600' : 'text-[#aaa]'}>{s.pending}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor(s.status)}`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {submissions.map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl border border-[#e8e7e3] p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1a1a1a]">{s.lecturer_name}</p>
                          <p className="text-[10px] text-[#888] mt-0.5">{s.name ?? s.unit_code} · {s.class_name}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor(s.status)}`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[#888]">M{s.module_index} S{s.semester}</span>
                        <span className="text-emerald-600 font-medium">{s.submitted} submitted</span>
                        {s.pending > 0 && <span className="text-amber-600 font-medium">{s.pending} pending</span>}
                      </div>
                      {s.total_records > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-[#f5f4f0] rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full"
                              style={{ width: `${Math.round((s.submitted / s.total_records) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            MIGRATE VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {view === 'migrate' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gray-50 rounded-xl border border-[#e8e7e3] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f5f4f0]">
                <h2 className="text-sm font-semibold text-[#1a1a1a]">Migrate Unit Assignments</h2>
                <p className="text-xs text-[#888] mt-1">Transfer all unit assignments from one lecturer to another. This cannot be undone.</p>
              </div>

              <div className="p-6 space-y-5">
                {/* From */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-1.5">
                    From (Current Lecturer)
                  </label>
                  <select value={migrateFrom} onChange={e => setMigrateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-[#e8e7e3] rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]">
                    <option value="">Select lecturer…</option>
                    {lecturers.map(l => (
                      <option key={l.id} value={l.id}>{l.full_name} ({l.lecturer_number})</option>
                    ))}
                  </select>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full border border-[#e8e7e3] flex items-center justify-center text-[#aaa]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>

                {/* To */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-1.5">
                    To (New Lecturer)
                  </label>
                  <select value={migrateTo} onChange={e => setMigrateTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-[#e8e7e3] rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]">
                    <option value="">Select lecturer…</option>
                    {lecturers.filter(l => l.id !== migrateFrom).map(l => (
                      <option key={l.id} value={l.id}>{l.full_name} ({l.lecturer_number})</option>
                    ))}
                  </select>
                </div>

                {/* Warning */}
                {migrateFrom && migrateTo && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
                    ⚠️ All unit assignments from <strong>{lecturers.find(l => l.id === migrateFrom)?.full_name}</strong> will move to <strong>{lecturers.find(l => l.id === migrateTo)?.full_name}</strong>.
                  </div>
                )}

                <button
                  onClick={handleMigrate}
                  disabled={submitting || !migrateFrom || !migrateTo}
                  className="w-full py-3 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Migrating…' : 'Migrate Assignments'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}