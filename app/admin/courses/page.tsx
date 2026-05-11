'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────
type LevelKey = 'diploma' | 'certificate' | 'artisan' | 'craft' | 'level6' | 'level5' | 'level4';
type StudyMode = 'module' | 'short-course';
type ExamBody = 'JP' | 'CDACC' | 'KNEC' | 'internal';
type WizardStep = 1 | 2 | 3;
type CourseTypeFilter = 'all' | 'KNEC' | 'CDACC' | 'JP' | 'INSTALL';

interface SemesterConfig {
  durationMonths: number;
  fee: number;
  practicalFee: number;
  internalExams: number;
  units: string[];
  additional_fees?: { fee_name: string; amount: number }[];
}
interface ModuleConfig { semesters: SemesterConfig[] }
interface CourseTypeConfig {
  enabled: boolean; examBody: ExamBody; minKcseGrade: string; studyMode: StudyMode;
  durationMonths: number; modules: ModuleConfig[]; semestersPerModule: number;
  moduleDurationMonths: number; shortCourseFee: number;
  shortCoursePaymentType: 'monthly' | 'one-time'; shortCourseNumberOfMonths: number;
  shortCourseMonthlyFees: number[]; shortCoursePracticalFee: number; shortCourseHasExams: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EXAM_BODY_META: Record<string, { label: string; accent: string; bg: string; text: string }> = {
  KNEC:    { label: 'KNEC',    accent: '#2563eb', bg: 'bg-blue-50 dark:bg-blue-950/40',   text: 'text-blue-700 dark:text-blue-300' },
  CDACC:   { label: 'CDACC',   accent: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
  JP:      { label: 'JP',      accent: '#7c3aed', bg: 'bg-violet-50 dark:bg-violet-950/40',   text: 'text-violet-700 dark:text-violet-300' },
  internal:{ label: 'SHORT',   accent: '#db2777', bg: 'bg-pink-50 dark:bg-pink-950/40',   text: 'text-pink-700 dark:text-pink-300' },
};
const LEVEL_META: Record<string, { short: string; color: string }> = {
  diploma:     { short: 'DIP',  color: '#2563eb' },
  certificate: { short: 'CERT', color: '#0891b2' },
  artisan:     { short: 'ART',  color: '#d97706' },
  craft:       { short: 'CRF',  color: '#0d9488' },
  level6:      { short: 'L6',   color: '#7c3aed' },
  level5:      { short: 'L5',   color: '#2563eb' },
  level4:      { short: 'L4',   color: '#059669' },
};
const LEVEL_LABELS: Record<string, string> = {
  diploma: 'Diploma', certificate: 'Certificate', artisan: 'Artisan', craft: 'Craft',
  level6: 'Higher Diploma (L6)', level5: 'Diploma (L5)', level4: 'Certificate (L4)',
};
const GRADES = ['ID/Birth Certificate','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','E'];
const WIZARD_STEPS = ['Course Details', 'Modules & Fees', 'Units'];
const ADDITIONAL_FEE_OPTIONS = ['Practical Fee','Admission Fee','Lab Fee','Library Fee','Registration Fee'];

const emptyModule = (examBody: ExamBody = 'internal'): ModuleConfig => ({
  semesters: Array.from({ length: examBody === 'CDACC' ? 1 : 2 }, () => ({
    durationMonths: examBody === 'CDACC' ? 6 : 3, fee: 0, practicalFee: 0, internalExams: 2, units: [], additional_fees: []
  }))
});
const emptyCourseType = (): CourseTypeConfig => ({
  enabled: false, examBody: 'internal', minKcseGrade: '', studyMode: 'module', durationMonths: 0,
  modules: [], semestersPerModule: 2, moduleDurationMonths: 6, shortCourseFee: 0,
  shortCoursePaymentType: 'one-time', shortCourseNumberOfMonths: 0, shortCourseMonthlyFees: [],
  shortCoursePracticalFee: 0, shortCourseHasExams: true
});
const getInitialFormData = () => ({
  courseId: '', department: '', courseName: '', minKcseGrade: 'C-',
  courseStudyMode: 'module' as StudyMode,
  courseTypes: {
    diploma: emptyCourseType(), certificate: emptyCourseType(), artisan: emptyCourseType(),
    craft: emptyCourseType(), level6: emptyCourseType(), level5: emptyCourseType(), level4: emptyCourseType()
  } as Record<LevelKey, CourseTypeConfig>
});
const getInitialWizardForm = () => ({
  department_id: '', qualification_level_id: '', knec_code: '', course_name: '', min_kcse_grade: '',
  is_modular: true, total_duration_months: 24, cdacc_payment_mode: 'per_semester' as 'per_semester' | 'once_per_stage',
  unit_assignment_mode: 'per_semester' as 'per_semester' | 'module_level', jp_exam_fee: 0, has_units: false,
  first_installment: 0, subsequent_installment: 0, practical_fee: 0, payment_mode: 'Once' as 'Once' | 'Monthly' | 'Per Semester',
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [dark, setDark] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);

  // List filters
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [examBodyFilter, setExamBodyFilter] = useState<CourseTypeFilter>('all');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Wizard
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [selectedCourseType, setSelectedCourseType] = useState<'KNEC' | 'CDACC' | 'JP' | 'INSTALL' | null>(null);
  const [courseFormData, setCourseFormData] = useState(getInitialWizardForm);
  const [formData, setFormData] = useState(getInitialFormData);
  const [modulesData, setModulesData] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState(0);
  const [unitsData, setUnitsData] = useState<Record<string, any[]>>({});
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Reference data
  const [departments, setDepartments] = useState<any[]>([]);
  const [qualificationLevels, setQualificationLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const [savedCourseTypeId, setSavedCourseTypeId] = useState<string | null>(null);
  const [savedModuleIds, setSavedModuleIds] = useState<string[]>([]);

  // Department management
  const [showAddDept, setShowAddDept] = useState(false);
  const [showDelDept, setShowDelDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [deptToDelete, setDeptToDelete] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => { setSupabase(createClient()); }, []);

  useEffect(() => {
    if (!supabase) return;
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login/admin'); return; }
      const role = session.user?.user_metadata?.role;
      if (role !== 'admin') {
        router.push(role === 'lecturer' ? '/lecturer/dashboard' : role === 'student' ? '/student/dashboard' : '/login/admin');
        return;
      }
      setCampus(session.user?.user_metadata?.campus || localStorage.getItem('adminCampus') || '');
      setLoading(false);
    };
    checkAuth();
  }, [supabase, router]);

  useEffect(() => { if (supabase && viewMode === 'list') loadCourses(); }, [viewMode, supabase]);
  useEffect(() => {
    if (supabase && viewMode === 'add') { loadDepts(); loadQualLevels(); loadSubjects(); }
  }, [viewMode, supabase]);

  const loadDepts = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data);
  };
  const loadQualLevels = async () => {
    const { data } = await supabase.from('qualification_levels').select('*').order('name');
    if (data) setQualificationLevels(data);
  };
  const loadSubjects = async () => {
    const { data } = await supabase.from('units').select('name').order('name');
    if (data) {
      // Deduplicate by name since multiple courses may have same unit names
      const seen = new Set();
      const unique = data.filter((u: { name: string }) => { const d = seen.has(u.name); seen.add(u.name); return !d; });
      setSubjects(unique);
    }
  };

  const loadCourses = async () => {
    const { data, error } = await supabase.from('courses').select(`
      *, departments(name),
      course_types(level,enabled,study_mode,duration_months,
        modules(module_index,semesters(semester_index,duration_months,fee,practical_fee,internal_exams)))
    `).order('created_at', { ascending: false });
    if (error) { showToast('Failed to load courses', 'error'); return; }
    let rows = data || [];
    try {
      const { data: rawUnits } = await supabase.from('units').select('*,courses!inner(exam_body)');
      if (rawUnits) {
        rows = rows.map((c: any) => ({
          ...c,
          units: rawUnits.filter((u: any) => u.course_id === c.id),
        }));
      }
    } catch (_) {}
    setCourses(rows);
  };

  // ── Filters / stats ───────────────────────────────────────────────────────
  const filteredCourses = useMemo(() => courses.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.id?.toLowerCase().includes(search.toLowerCase()) ||
      c.departments?.name?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (examBodyFilter !== 'all') {
      const eb = c.exam_body || c.course_types?.[0]?.exam_body;
      if (examBodyFilter === 'INSTALL') { if (eb !== 'internal') return false; }
      else if (c.id.split('-')[0] !== examBodyFilter && eb !== examBodyFilter) return false;
    }
    if (levelFilter !== 'all') {
      return c.course_types?.some((ct: any) => ct.enabled && (levelFilter === 'craft'
        ? (ct.level === 'craft' || ct.level === 'certificate')
        : ct.level === levelFilter));
    }
    return true;
  }), [courses, search, examBodyFilter, levelFilter]);

  const stats = useMemo(() => ({
    total: filteredCourses.length,
    knec: courses.filter(c => c.id.startsWith('KNEC-') || c.exam_body === 'KNEC').length,
    cdacc: courses.filter(c => c.id.startsWith('CDACC-') || c.exam_body === 'CDACC').length,
    jp: courses.filter(c => c.id.startsWith('JP-') || c.exam_body === 'JP').length,
    install: courses.filter(c => c.exam_body === 'internal').length,
  }), [courses, filteredCourses]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredDepts = useMemo(() =>
    departments.filter(d => !selectedCourseType || selectedCourseType === 'INSTALL' || !d.exam_body || d.exam_body === selectedCourseType),
    [departments, selectedCourseType]);

  const filteredQualLevels = useMemo(() =>
    qualificationLevels.filter(l => {
      if (l.exam_body) return l.exam_body === selectedCourseType;
      if (selectedCourseType === 'CDACC' || selectedCourseType === 'JP') return false;
      const n = l.name?.toLowerCase() || '';
      if (selectedCourseType === 'INSTALL') return n.includes('certificate');
      if (selectedCourseType === 'KNEC') return !n.includes('level');
      return true;
    }), [qualificationLevels, selectedCourseType]);

  // ── Wizard helpers ─────────────────────────────────────────────────────────
  const resetWizard = () => {
    setWizardStep(1); setSelectedCourseType(null);
    setSavedCourseId(null); setSavedCourseTypeId(null); setSavedModuleIds([]);
    setCourseFormData(getInitialWizardForm()); setModulesData([]); setUnitsData({});
    setSelectedModule(0); setSelectedSemester(0);
    setShowAddDept(false); setShowDelDept(false); setNewDept({ name: '', code: '' }); setDeptToDelete('');
    setBulkMode(false); setBulkText(''); setEditingCourse(null);
  };

  const initModules = (ct: typeof courseFormData, type: typeof selectedCourseType) => {
    const total = ct.total_duration_months || 24;
    const mPerMod = 12;
    const count = ct.is_modular ? Math.ceil(total / mPerMod) : 1;
    const dur = Math.ceil(total / count);
    const isCdaccOnce = type === 'CDACC' && ct.cdacc_payment_mode === 'once_per_stage';
    const semCount = isCdaccOnce ? 0 : 3;
    return Array.from({ length: count }, (_, i) => ({
      duration_months: i === count - 1 ? total - dur * (count - 1) : dur,
      label: `${type === 'CDACC' ? 'Stage' : 'Module'} ${['I','II','III','IV','V','VI'][i] || i+1}`,
      exam_fee: 0, fee: 0, is_attachment_stage: type === 'CDACC' && !isCdaccOnce && i === count - 1,
      has_attachment: count >= 3 ? i === 2 : i === 1,
      attachment_after_semester: undefined as number | undefined,
      attachment_duration_months: 3,
      semesters: Array.from({ length: semCount }, (_, j) => ({ semester_index: j+1, fee: 0, internal_exams: 2, additional_fees: [] })),
    }));
  };

  const handleSelectCourseType = (type: 'KNEC' | 'CDACC' | 'JP' | 'INSTALL') => {
    resetWizard();
    setSelectedCourseType(type);
    setViewMode('add');
  };

  const validateStep1 = () => {
    const f = courseFormData;
    if (!f.department_id) { showToast('Select a department', 'error'); return false; }
    if (!f.qualification_level_id) { showToast('Select a qualification level', 'error'); return false; }
    if (!f.knec_code) { showToast('Enter a course code', 'error'); return false; }
    if (!f.course_name) { showToast('Enter a course name', 'error'); return false; }
    return true;
  };

  const handleStep1Next = () => {
    if (!validateStep1()) return;
    if (!modulesData.length) setModulesData(initModules(courseFormData, selectedCourseType));
    setWizardStep(2);
  };

  const handleStep2Next = async () => {
    if (!modulesData.length) { showToast('Add at least one module', 'error'); return; }
    setSubmitting(true);
    try {
      const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType!;
      const rawCode = courseFormData.knec_code.trim();
      const prefix = selectedCourseType === 'INSTALL' ? 'INT' : selectedCourseType!;
      const courseId = editingCourse || (rawCode.startsWith(prefix+'-') ? rawCode : `${prefix}-${rawCode}`);
      const selectedLevel = qualificationLevels.find(l => l.id === courseFormData.qualification_level_id);
      const ln = selectedLevel?.name?.toLowerCase() || '';
      const lvMap: Record<string,LevelKey> = { diploma:'diploma', certificate:'certificate', artisan:'artisan', craft:'craft', 'higher diploma':'level6' };
      const level: LevelKey = Object.entries(lvMap).find(([k]) => ln.includes(k))?.[1] as LevelKey || 'diploma';

      if (!editingCourse) {
        const { error } = await supabase.from('courses').insert([{
          id: courseId, name: courseFormData.course_name, department_id: courseFormData.department_id,
          qualification_level_id: courseFormData.qualification_level_id,
          min_kcse_grade: courseFormData.min_kcse_grade, exam_body: examBody,
        }]);
        if (error) throw error;
      } else {
        await supabase.from('courses').update({
          name: courseFormData.course_name, department_id: courseFormData.department_id,
          qualification_level_id: courseFormData.qualification_level_id,
          min_kcse_grade: courseFormData.min_kcse_grade, exam_body: examBody,
        }).eq('id', courseId);
      }
      setSavedCourseId(courseId);

      const { data: ctData, error: ctError } = await supabase.from('course_types').upsert([{
        course_id: courseId, level, duration_months: courseFormData.total_duration_months,
        study_mode: selectedCourseType === 'INSTALL' ? 'short-course' : 'module', enabled: true,
        min_kcse_grade: courseFormData.min_kcse_grade,
      }], { onConflict: 'course_id,level' }).select().single();
      if (ctError) throw ctError;
      setSavedCourseTypeId(ctData.id);
      setWizardStep(3);
    } catch (e: any) {
      showToast(e.message || 'Save failed', 'error');
    } finally { setSubmitting(false); }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const courseId = savedCourseId!;
      const courseTypeId = savedCourseTypeId!;
      const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType!;

      // Delete existing modules
      const { data: exMods } = await supabase.from('modules').select('id').eq('course_type_id', courseTypeId);
      if (exMods?.length) {
        await supabase.from('semesters').delete().in('module_id', exMods.map((m: any) => m.id));
        await supabase.from('modules').delete().eq('course_type_id', courseTypeId);
      }

      for (let i = 0; i < modulesData.length; i++) {
        const mod = modulesData[i];
        const { data: mData, error: mErr } = await supabase.from('modules').insert([{
          course_type_id: courseTypeId, module_index: i+1,
          label: mod.label, duration_months: mod.duration_months, exam_body: examBody,
          exam_fee: mod.exam_fee || 0, fee: mod.fee || 0,
          is_attachment_stage: mod.is_attachment_stage || false,
          has_attachment: mod.has_attachment || false,
          attachment_after_semester: mod.has_attachment ? mod.attachment_after_semester : null,
          attachment_duration_months: mod.has_attachment ? mod.attachment_duration_months || 3 : null,
        }]).select().single();
        if (mErr) throw mErr;

        for (let j = 0; j < (mod.semesters || []).length; j++) {
          const sem = mod.semesters[j] || { fee: 0, internal_exams: 2, additional_fees: [] };
          const { data: sData, error: sErr } = await supabase.from('semesters').insert([{
            module_id: mData.id, semester_index: j+1, duration_months: 3,
            fee: sem.fee || 0, practical_fee: sem.practical_fee || 0, internal_exams: sem.internal_exams || 2,
          }]).select().single();
          if (sErr) throw sErr;
          const afRows = (sem.additional_fees || [])
            .filter((af: any) => af.fee_name && af.amount > 0)
            .map((af: any) => ({ semester_id: sData.id, fee_name: af.fee_name, amount: af.amount }));
          if (afRows.length) await supabase.from('semester_additional_fees').insert(afRows);
        }
      }

      // Units
      await supabase.from('units').delete().eq('course_id', courseId);
      for (const [key, units] of Object.entries(unitsData)) {
        if (!units?.length) continue;
        const [mIdxStr, sIdxStr] = key.split('_');
        const mIdx = parseInt(mIdxStr) + 1;
        const sIdx = sIdxStr === 'stage' ? 0 : parseInt(sIdxStr) + 1;
        for (const u of units) {
          await supabase.from('units').insert([{
            course_id: courseId, unit_code: u.paper_code, name: u.subject_name,
            module_index: mIdx, semester_index: sIdx, unit_type: u.unit_type || 'Core',
          }]);
        }
      }

      showToast('Course saved successfully');
      resetWizard();
      setViewMode('list');
    } catch (e: any) {
      showToast(e.message || 'Save failed', 'error');
    } finally { setSubmitting(false); }
  };

  const handleAddUnit = async (modIdx: number, semIdx: number, unit: any) => {
    const isCdaccOnce = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
    const isModLevel = courseFormData.unit_assignment_mode === 'module_level';
    const key = isCdaccOnce ? `${modIdx}_stage` : `${modIdx}_${isModLevel ? 0 : semIdx}`;
    setUnitsData(prev => ({ ...prev, [key]: [...(prev[key] || []), unit] }));
    if (savedCourseId) {
      await supabase.from('units').upsert([{
        course_id: savedCourseId, unit_code: unit.paper_code, name: unit.subject_name,
        module_index: modIdx+1, semester_index: isCdaccOnce || isModLevel ? 0 : semIdx+1,
        unit_type: unit.unit_type || 'Core',
      }], { onConflict: 'course_id,unit_code' });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete this course and all related data? This cannot be undone.')) return;
    const { data: cts } = await supabase.from('course_types').select('id').eq('course_id', id);
    for (const ct of cts || []) {
      const { data: mods } = await supabase.from('modules').select('id').eq('course_type_id', ct.id);
      if (mods?.length) {
        await supabase.from('semesters').delete().in('module_id', mods.map((m: any) => m.id));
        await supabase.from('modules').delete().eq('course_type_id', ct.id);
      }
    }
    await supabase.from('course_types').delete().eq('course_id', id);
    await supabase.from('units').delete().eq('course_id', id);
    await supabase.from('courses').delete().eq('id', id);
    showToast('Course deleted');
    loadCourses();
  };

  const handleAddDept = async () => {
    if (!newDept.name || !newDept.code) return;
    setSubmitting(true);
    const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType;
    const { data, error } = await supabase.from('departments').insert([{
      name: newDept.name.trim(), code: newDept.code.trim().toUpperCase(), is_active: true, exam_body: examBody,
    }]).select().single();
    setSubmitting(false);
    if (error) { showToast(error.message, 'error'); return; }
    setDepartments(prev => [...prev, data]);
    setCourseFormData(prev => ({ ...prev, department_id: data.id }));
    setNewDept({ name: '', code: '' });
    setShowAddDept(false);
    showToast('Department added');
  };

  const handleDeleteDept = async () => {
    if (!deptToDelete) return;
    const dept = departments.find(d => d.id === deptToDelete);
    if (!confirm(`Delete "${dept?.name}"? Cannot undo.`)) return;
    const { data: used } = await supabase.from('courses').select('id').eq('department_id', deptToDelete).limit(1);
    if (used?.length) { showToast('Department is in use by courses', 'error'); return; }
    await supabase.from('departments').delete().eq('id', deptToDelete);
    setDepartments(prev => prev.filter(d => d.id !== deptToDelete));
    if (courseFormData.department_id === deptToDelete) setCourseFormData(prev => ({ ...prev, department_id: '' }));
    setDeptToDelete(''); setShowDelDept(false);
    showToast('Department deleted');
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        <span className="text-sm text-zinc-400 font-mono">Loading courses…</span>
      </div>
    </div>
  );

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;0,900;1,300;1,600&family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        :root {
          --bg: #ffffff;
          --bg2: #f9fafb;
          --bg3: #f3f4f6;
          --border: #e5e7eb;
          --border2: #d1d5db;
          --text: #111827;
          --text2: #4b5563;
          --text3: #9ca3af;
          --accent: #111827;
        }
        .dark {
          --bg: #09090b;
          --bg2: #111113;
          --bg3: #18181b;
          --border: #27272a;
          --border2: #3f3f46;
          --text: #fafafa;
          --text2: #a1a1aa;
          --text3: #52525b;
          --accent: #fafafa;
        }

        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .serif { font-family: 'Fraunces', Georgia, serif; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg2); }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        /* ── Input base ── */
        .inp {
          width: 100%; padding: 9px 12px; font-size: 13px;
          background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
          color: var(--text); outline: none; transition: border-color 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .inp:focus { border-color: var(--accent); }
        .inp::placeholder { color: var(--text3); }
        select.inp option { background: var(--bg); color: var(--text); }

        /* ── Course card left bar ── */
        .course-card { border-left: 3px solid transparent; transition: border-color 0.2s, box-shadow 0.2s; }
        .course-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.07); }

        /* ── Wizard step indicator ── */
        .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; flex-shrink: 0; transition: all 0.2s; }

        /* ── Stat card ── */
        .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }

        /* ── Button base ── */
        .btn { padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary { background: var(--text); color: var(--bg); }
        .btn-primary:hover { opacity: 0.85; }
        .btn-ghost { background: var(--bg); color: var(--text2); border: 1px solid var(--border); }
        .btn-ghost:hover { background: var(--bg2); color: var(--text); }
        .btn-danger { background: #fee2e2; color: #991b1b; }
        .btn-danger:hover { background: #fecaca; }
        .btn-success { background: #d1fae5; color: #065f46; }
        .btn-success:hover { background: #a7f3d0; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Toast ── */
        .toast { position: fixed; bottom: 24px; right: 24px; z-index: 9999; padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap-8px; animation: toastIn 0.3s ease; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
        @keyframes toastIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

        /* ── Filter pill ── */
        .pill { padding: 5px 12px; border-radius: 99px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--bg); color: var(--text2); transition: all 0.15s; white-space: nowrap; }
        .pill.active { background: var(--text); color: var(--bg); border-color: var(--text); }

        /* ── Divider ── */
        .div-h { height: 1px; background: var(--border); }
        .div-v { width: 1px; background: var(--border); }

        /* ── Toggle ── */
        .toggle { width: 40px; height: 22px; border-radius: 99px; transition: background 0.2s; position: relative; flex-shrink: 0; cursor: pointer; border: none; }
        .toggle-thumb { width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 3px; transition: left 0.2s; }

        /* ── Fade in ── */
        .fadein { animation: fadein 0.3s ease; }
        @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className={dark ? 'dark' : ''} style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── Toast ── */}
        {toast && (
          <div className="toast" style={{ background: toast.type === 'success' ? '#d1fae5' : '#fee2e2', color: toast.type === 'success' ? '#065f46' : '#991b1b' }}>
            {toast.type === 'success' ? '✓' : '✕'}&nbsp;{toast.msg}
          </div>
        )}

        {/* ── Topbar ── */}
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/admin/dashboard" style={{ position: 'relative', width: 32, height: 32, display: 'block', flexShrink: 0 }}>
                <Image src="/logo.webp" alt="EAVI" fill className="object-contain" />
              </Link>
              <div className="div-v" style={{ height: 20 }} />
              <span className="serif" style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>Course Management</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>{campus}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => { setViewMode('list'); resetWizard(); }} style={{ fontSize: 12 }}>
                ← All courses
              </button>
              <button className="btn btn-primary" onClick={() => { resetWizard(); setViewMode('add'); }}>
                + New course
              </button>
              <button className="btn btn-ghost" onClick={() => setDark(d => !d)} style={{ padding: '9px 12px', fontSize: 14 }}>
                {dark ? '☀' : '☾'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* LIST VIEW                                                          */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'list' && (
            <div className="fadein">

              {/* Stat row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
                {[
                  { label: 'Total', value: stats.total, accent: '#111827' },
                  { label: 'KNEC', value: stats.knec, accent: '#2563eb' },
                  { label: 'CDACC', value: stats.cdacc, accent: '#059669' },
                  { label: 'JP', value: stats.jp, accent: '#7c3aed' },
                  { label: 'Short', value: stats.install, accent: '#db2777' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                    <div className="serif" style={{ fontSize: 32, fontWeight: 900, color: s.accent, lineHeight: 1 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Search + filters */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <input
                    className="inp"
                    style={{ maxWidth: 340 }}
                    placeholder="Search courses, departments, IDs…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 6 }}>Exam body</span>
                  {(['all','KNEC','CDACC','JP','INSTALL'] as const).map(f => (
                    <button key={f} className={`pill${examBodyFilter === f ? ' active' : ''}`} onClick={() => setExamBodyFilter(f)}>
                      {f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 6 }}>Level</span>
                  {[
                    { v: 'all', l: 'All' }, { v: 'diploma', l: 'Diploma' }, { v: 'certificate', l: 'Certificate' },
                    { v: 'artisan', l: 'Artisan' }, { v: 'level6', l: 'L6' }, { v: 'level5', l: 'L5' }, { v: 'level4', l: 'L4' },
                  ].map(f => (
                    <button key={f.v} className={`pill${levelFilter === f.v ? ' active' : ''}`} onClick={() => setLevelFilter(f.v)}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
                <span className="mono">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''} matched
              </div>

              {/* Course grid */}
              {filteredCourses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⊘</div>
                  <div style={{ fontSize: 14 }}>No courses match your filters</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                  {filteredCourses.map((course) => {
                    const eb = course.exam_body || course.id.split('-')[0];
                    const meta = EXAM_BODY_META[eb] || EXAM_BODY_META.KNEC;
                    const enabledLevels = course.course_types?.filter((ct: any) => ct.enabled) || [];
                    const units = course.units || [];
                    const isExpanded = expandedCards[course.id];
                    return (
                      <div
                        key={course.id}
                        className="course-card"
                        style={{
                          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12,
                          overflow: 'hidden', borderLeftColor: meta.accent,
                        }}
                      >
                        {/* Card header */}
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                            <span className="mono" style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>
                              {course.id}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em' }}
                              className={meta.bg + ' ' + meta.text}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="serif" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4 }}>
                            {course.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{course.departments?.name || '—'}</div>
                        </div>

                        {/* Level chips */}
                        <div style={{ padding: '10px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
                          {enabledLevels.map((ct: any) => {
                            const lm = LEVEL_META[ct.level] || LEVEL_META.diploma;
                            return (
                              <span key={ct.id || ct.level} className="mono"
                                style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 4, border: `1px solid ${lm.color}22`, color: lm.color, background: lm.color + '11' }}>
                                {lm.short} · {ct.duration_months}mo
                              </span>
                            );
                          })}
                          {!enabledLevels.length && <span style={{ fontSize: 11, color: 'var(--text3)' }}>No active levels</span>}
                        </div>

                        {/* Units preview */}
                        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', minHeight: 52 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{units.length} unit{units.length !== 1 ? 's' : ''}</span>
                            {units.length > 3 && (
                              <button onClick={() => setExpandedCards(p => ({ ...p, [course.id]: !p[course.id] }))}
                                style={{ fontSize: 11, color: meta.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                                {isExpanded ? '↑ less' : `+${units.length - 3} more`}
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(isExpanded ? units : units.slice(0, 3)).map((u: any, i: number) => (
                              <span key={i} className="mono"
                                style={{ fontSize: 10, background: 'var(--bg3)', color: 'var(--text2)', padding: '2px 7px', borderRadius: 4 }}>
                                {u.unit_code ? `${u.unit_code} ` : ''}{u.name}
                              </span>
                            ))}
                            {!units.length && <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>No units</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                            onClick={() => { /* edit handler */ showToast('Edit mode coming soon'); }}>
                            Edit
                          </button>
                          <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                            onClick={() => handleDeleteCourse(course.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ADD / WIZARD                                                       */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'add' && (
            <div className="fadein">

              {/* Course type selector (if nothing chosen yet) */}
              {!selectedCourseType && (
                <div>
                  <div className="serif" style={{ fontSize: 28, fontWeight: 900, marginBottom: 6, color: 'var(--text)' }}>
                    New course
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 32 }}>Choose exam body to begin</div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, maxWidth: 720 }}>
                    {([
                      { type: 'KNEC' as const, desc: 'National examinations', accent: '#2563eb' },
                      { type: 'CDACC' as const, desc: 'Competency-based assessment', accent: '#059669' },
                      { type: 'JP' as const, desc: 'Joint professional', accent: '#7c3aed' },
                      { type: 'INSTALL' as const, desc: 'Short / installation course', accent: '#db2777' },
                    ]).map(({ type, desc, accent }) => (
                      <button key={type} onClick={() => handleSelectCourseType(type)}
                        style={{
                          border: `1.5px solid ${accent}33`, borderRadius: 14, padding: '28px 20px',
                          background: accent + '08', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent; (e.currentTarget as HTMLElement).style.background = accent + '14'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = accent + '33'; (e.currentTarget as HTMLElement).style.background = accent + '08'; }}>
                        <div className="serif" style={{ fontSize: 24, fontWeight: 900, color: accent, marginBottom: 8 }}>{type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wizard layout */}
              {selectedCourseType && (
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, alignItems: 'start' }}>

                  {/* ── Left rail: step indicator ── */}
                  <div style={{ position: 'sticky', top: 72 }}>
                    <div style={{ marginBottom: 20 }}>
                      <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                        {selectedCourseType === 'INSTALL' ? 'Short Course' : selectedCourseType}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {editingCourse ? `Editing ${editingCourse}` : 'New course'}
                      </div>
                    </div>

                    {WIZARD_STEPS.map((label, i) => {
                      const stepNum = (i + 1) as WizardStep;
                      const isDone = wizardStep > stepNum;
                      const isActive = wizardStep === stepNum;
                      return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, padding: '8px 12px', borderRadius: 8, background: isActive ? 'var(--bg3)' : 'transparent' }}>
                          <div className="step-dot mono"
                            style={{
                              background: isDone ? '#111827' : isActive ? 'var(--text)' : 'var(--bg3)',
                              color: isDone || isActive ? 'var(--bg)' : 'var(--text3)',
                              border: `1.5px solid ${isActive ? 'var(--text)' : isDone ? '#111827' : 'var(--border2)'}`,
                            }}>
                            {isDone ? '✓' : stepNum}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--text)' : 'var(--text3)' }}>{label}</div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="div-h" style={{ margin: '16px 0' }} />
                    <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                      onClick={() => { resetWizard(); setViewMode('list'); }}>
                      ← Cancel
                    </button>
                  </div>

                  {/* ── Right panel ── */}
                  <div>

                    {/* ── STEP 1: Course Details ── */}
                    {wizardStep === 1 && (
                      <div className="fadein">
                        <div className="serif" style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Course details</div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                          {/* Department */}
                          <div style={{ gridColumn: '1/-1' }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Department *</label>
                            <select className="inp" value={courseFormData.department_id}
                              onChange={e => setCourseFormData(p => ({ ...p, department_id: e.target.value }))}>
                              <option value="">Select department</option>
                              {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                            </select>

                            {/* Department actions */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => { setShowAddDept(p => !p); setShowDelDept(false); }}>
                                {showAddDept ? '↑ Cancel' : '+ Add dept'}
                              </button>
                              <button className="btn btn-danger" style={{ fontSize: 11 }} onClick={() => { setShowDelDept(p => !p); setShowAddDept(false); }}>
                                Delete dept
                              </button>
                            </div>

                            {showAddDept && (
                              <div style={{ marginTop: 10, padding: 14, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
                                  <input className="inp" placeholder="Department name" value={newDept.name}
                                    onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} />
                                  <input className="inp" placeholder="Code" maxLength={5} value={newDept.code}
                                    onChange={e => setNewDept(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                                </div>
                                <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleAddDept} disabled={submitting}>
                                  Save department
                                </button>
                              </div>
                            )}
                            {showDelDept && (
                              <div style={{ marginTop: 10, padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                                <select className="inp" style={{ marginBottom: 8 }} value={deptToDelete} onChange={e => setDeptToDelete(e.target.value)}>
                                  <option value="">Select to delete…</option>
                                  {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <button className="btn btn-danger" style={{ fontSize: 12 }} onClick={handleDeleteDept} disabled={!deptToDelete}>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Qualification level */}
                          <div style={{ gridColumn: '1/-1' }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Qualification level *</label>
                            <select className="inp" value={courseFormData.qualification_level_id}
                              onChange={e => setCourseFormData(p => ({ ...p, qualification_level_id: e.target.value }))}>
                              <option value="">Select level</option>
                              {filteredQualLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                          </div>

                          {/* Course code */}
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Course code *</label>
                            <input className="inp mono" placeholder={selectedCourseType === 'KNEC' ? '2801' : 'CD-001'}
                              value={courseFormData.knec_code}
                              onChange={e => setCourseFormData(p => ({ ...p, knec_code: e.target.value }))} />
                          </div>

                          {/* Min grade */}
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Min. KCSE grade *</label>
                            <select className="inp" value={courseFormData.min_kcse_grade}
                              onChange={e => setCourseFormData(p => ({ ...p, min_kcse_grade: e.target.value }))}>
                              <option value="">Select grade</option>
                              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>

                          {/* Course name */}
                          <div style={{ gridColumn: '1/-1' }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Course name *</label>
                            <input className="inp" placeholder="e.g. Health Records and Information Technology"
                              value={courseFormData.course_name}
                              onChange={e => setCourseFormData(p => ({ ...p, course_name: e.target.value }))} />
                          </div>

                          {/* Duration */}
                          {selectedCourseType !== 'INSTALL' && (
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Duration (months) *</label>
                              <input className="inp mono" type="number" min={3} step={3}
                                value={courseFormData.total_duration_months}
                                onChange={e => setCourseFormData(p => ({ ...p, total_duration_months: parseInt(e.target.value) || 0 }))} />
                            </div>
                          )}

                          {/* Modular toggle */}
                          {selectedCourseType !== 'INSTALL' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <button className="toggle"
                                style={{ background: courseFormData.is_modular ? '#111827' : 'var(--border2)' }}
                                onClick={() => setCourseFormData(p => ({ ...p, is_modular: !p.is_modular }))}>
                                <div className="toggle-thumb" style={{ left: courseFormData.is_modular ? 21 : 3 }} />
                              </button>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Modular</div>
                                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Multiple modules / stages</div>
                              </div>
                            </div>
                          )}

                          {/* CDACC payment mode */}
                          {selectedCourseType === 'CDACC' && (
                            <div style={{ gridColumn: '1/-1' }}>
                              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Payment mode</label>
                              <select className="inp" value={courseFormData.cdacc_payment_mode}
                                onChange={e => setCourseFormData(p => ({ ...p, cdacc_payment_mode: e.target.value as any }))}>
                                <option value="per_semester">Per semester</option>
                                <option value="once_per_stage">Once per stage</option>
                              </select>
                            </div>
                          )}

                          {/* JP exam fee */}
                          {selectedCourseType === 'JP' && (
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Exam fee (KES)</label>
                              <input className="inp mono" type="number" min={0}
                                value={courseFormData.jp_exam_fee}
                                onChange={e => setCourseFormData(p => ({ ...p, jp_exam_fee: parseInt(e.target.value) || 0 }))} />
                            </div>
                          )}

                          {/* Short course fees */}
                          {selectedCourseType === 'INSTALL' && (
                            <>
                              <div style={{ gridColumn: '1/-1' }}>
                                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Payment mode</label>
                                <select className="inp" value={courseFormData.payment_mode}
                                  onChange={e => setCourseFormData(p => ({ ...p, payment_mode: e.target.value as any }))}>
                                  <option value="Once">Once (full)</option>
                                  <option value="Monthly">Monthly</option>
                                  <option value="Per Semester">Per semester</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>First installment (KES)</label>
                                <input className="inp mono" type="number" value={courseFormData.first_installment}
                                  onChange={e => setCourseFormData(p => ({ ...p, first_installment: parseInt(e.target.value) || 0 }))} />
                              </div>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Subsequent (KES)</label>
                                <input className="inp mono" type="number" value={courseFormData.subsequent_installment}
                                  onChange={e => setCourseFormData(p => ({ ...p, subsequent_installment: parseInt(e.target.value) || 0 }))} />
                              </div>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Practical fee (KES)</label>
                                <input className="inp mono" type="number" value={courseFormData.practical_fee}
                                  onChange={e => setCourseFormData(p => ({ ...p, practical_fee: parseInt(e.target.value) || 0 }))} />
                              </div>
                            </>
                          )}
                        </div>

                        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" onClick={handleStep1Next}>
                            Continue → Modules
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: Modules & Fees ── */}
                    {wizardStep === 2 && (
                      <div className="fadein">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                          <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                            {selectedCourseType === 'CDACC' ? 'Stages & fees' : 'Modules & fees'}
                          </div>
                          {courseFormData.is_modular && (
                            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => {
                              const isCdaccOnce = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                              setModulesData(prev => [...prev, {
                                duration_months: 12,
                                label: `${selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} ${['I','II','III','IV','V','VI'][prev.length] || prev.length+1}`,
                                exam_fee: 0, fee: 0, is_attachment_stage: false, has_attachment: false,
                                attachment_after_semester: undefined, attachment_duration_months: 3,
                                semesters: isCdaccOnce ? [] : Array.from({length:3},(_,j)=>({ semester_index:j+1, fee:0, internal_exams:2, additional_fees:[] })),
                              }]);
                            }}>
                              + Add {selectedCourseType === 'CDACC' ? 'stage' : 'module'}
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {modulesData.map((mod, mi) => {
                            const isCdaccOnce = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                            const semCount = isCdaccOnce ? 0 : (mod.semesters?.length || 3);
                            return (
                              <div key={mi} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                                {/* Module header */}
                                <div style={{ padding: '12px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span className="mono" style={{ fontSize: 11, background: 'var(--bg3)', color: 'var(--text3)', padding: '2px 8px', borderRadius: 4 }}>
                                    {selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} {mi+1}
                                  </span>
                                  <input className="inp" style={{ flex: 1, maxWidth: 200 }} value={mod.label}
                                    onChange={e => { const u=[...modulesData]; u[mi]={...u[mi],label:e.target.value}; setModulesData(u); }} />
                                  <input className="inp mono" type="number" min={3} step={3} style={{ width: 100 }}
                                    value={mod.duration_months}
                                    onChange={e => { const u=[...modulesData]; u[mi]={...u[mi],duration_months:parseInt(e.target.value)||0}; setModulesData(u); }} />
                                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>months</span>
                                </div>

                                {/* CDACC attachment toggle */}
                                {selectedCourseType === 'CDACC' && (
                                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button className="toggle" style={{ background: mod.is_attachment_stage ? '#f59e0b' : 'var(--border2)' }}
                                      onClick={() => { const u=[...modulesData]; u[mi]={...u[mi],is_attachment_stage:!u[mi].is_attachment_stage}; setModulesData(u); }}>
                                      <div className="toggle-thumb" style={{ left: mod.is_attachment_stage ? 21 : 3 }} />
                                    </button>
                                    <span style={{ fontSize: 12, color: mod.is_attachment_stage ? '#d97706' : 'var(--text3)' }}>Industrial Attachment stage</span>
                                  </div>
                                )}

                                {/* Semesters */}
                                {!isCdaccOnce && (
                                  <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {Array.from({ length: semCount }, (_, si) => {
                                      const semData = mod.semesters?.[si] || { fee:0, internal_exams:2, additional_fees:[], practical_fee:0 };
                                      return (
                                        <div key={si} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                                          <div className="mono" style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>SEM {si+1}</div>
                                          <div style={{ marginBottom: 8 }}>
                                            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Fee (KES)</label>
                                            <input className="inp mono" type="number" min={0} value={semData.fee || ''}
                                              placeholder="0"
                                              onChange={e => {
                                                const newFee = parseInt(e.target.value) || 0;
                                                const u = [...modulesData];
                                                if (!u[mi].semesters) u[mi].semesters = Array.from({length:semCount},(_,i)=>({semester_index:i+1,fee:0,internal_exams:2,additional_fees:[]}));
                                                u[mi].semesters[si] = { ...u[mi].semesters[si], fee: newFee };
                                                // KNEC auto-fill
                                                if (selectedCourseType === 'KNEC' && !(mi === 0 && si === 0)) {
                                                  for (let s = si+1; s < semCount; s++) u[mi].semesters[s] = { ...u[mi].semesters[s], fee: newFee };
                                                  for (let m = mi+1; m < u.length; m++) for (let s = 0; s < semCount; s++) u[m].semesters[s] = { ...u[m].semesters[s], fee: newFee };
                                                }
                                                setModulesData(u);
                                              }} />
                                          </div>
                                          {selectedCourseType !== 'KNEC' && (
                                            <div>
                                              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Practical (KES)</label>
                                              <input className="inp mono" type="number" min={0} value={semData.practical_fee || ''}
                                                placeholder="0"
                                                onChange={e => {
                                                  const u=[...modulesData];
                                                  u[mi].semesters[si]={...u[mi].semesters[si],practical_fee:parseInt(e.target.value)||0};
                                                  setModulesData(u);
                                                }} />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Once-per-stage fee */}
                                {isCdaccOnce && (
                                  <div style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                      <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Stage fee (KES)</label>
                                      <input className="inp mono" type="number" value={mod.fee || ''}
                                        onChange={e => { const u=[...modulesData]; u[mi]={...u[mi],fee:parseInt(e.target.value)||0}; setModulesData(u); }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between' }}>
                          <button className="btn btn-ghost" onClick={() => setWizardStep(1)}>← Back</button>
                          <button className="btn btn-primary" onClick={handleStep2Next} disabled={submitting}>
                            {submitting ? 'Saving…' : 'Continue → Units'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 3: Units ── */}
                    {wizardStep === 3 && (
                      <div className="fadein">
                        <div className="serif" style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Assign units</div>

                        {/* Assignment mode (JP / CDACC per_semester) */}
                        {(selectedCourseType === 'JP' || (selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'per_semester')) && (
                          <div style={{ padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Assignment mode</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12, color: courseFormData.unit_assignment_mode === 'per_semester' ? 'var(--text)' : 'var(--text3)' }}>Per semester</span>
                              <button className="toggle"
                                style={{ background: courseFormData.unit_assignment_mode === 'module_level' ? '#111827' : 'var(--border2)' }}
                                onClick={() => setCourseFormData(p => ({ ...p, unit_assignment_mode: p.unit_assignment_mode === 'module_level' ? 'per_semester' : 'module_level' }))}>
                                <div className="toggle-thumb" style={{ left: courseFormData.unit_assignment_mode === 'module_level' ? 21 : 3 }} />
                              </button>
                              <span style={{ fontSize: 12, color: courseFormData.unit_assignment_mode === 'module_level' ? 'var(--text)' : 'var(--text3)' }}>
                                {selectedCourseType === 'CDACC' ? 'Stage level' : 'Module level'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Module tabs */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                          {modulesData.filter(m => !m.is_attachment_stage).map((mod, i) => (
                            <button key={i} className={`pill${selectedModule === i ? ' active' : ''}`} onClick={() => setSelectedModule(i)}>
                              {selectedCourseType === 'CDACC' ? `Stage ${i+1}` : `Mod ${i+1}`}
                            </button>
                          ))}
                        </div>

                        {/* Semester tabs */}
                        {courseFormData.unit_assignment_mode === 'per_semester' && selectedCourseType !== 'KNEC' && (() => {
                          const isCdaccOnce = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                          if (isCdaccOnce) return null;
                          const semCount = modulesData[selectedModule]?.semesters?.length || 3;
                          return (
                            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                              {Array.from({length: semCount}, (_,i) => (
                                <button key={i} className={`pill${selectedSemester === i ? ' active' : ''}`} onClick={() => setSelectedSemester(i)}>
                                  Sem {i+1}
                                </button>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Units list */}
                        {(() => {
                          const isCdaccOnce = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                          const isModLevel = courseFormData.unit_assignment_mode === 'module_level' || selectedCourseType === 'KNEC';
                          const key = isCdaccOnce ? `${selectedModule}_stage` : `${selectedModule}_${isModLevel ? 0 : selectedSemester}`;
                          const units = unitsData[key] || [];
                          return units.length > 0 ? (
                            <div style={{ marginBottom: 14, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                              {units.map((u: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < units.length-1 ? '1px solid var(--border)' : 'none', background: 'var(--bg)' }}>
                                  <span className="mono" style={{ fontSize: 11, color: 'var(--text3)', minWidth: 48 }}>{u.paper_code}</span>
                                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{u.subject_name}</span>
                                  <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4 }}>{u.unit_type}</span>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        {/* Add unit form */}
                        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ padding: '10px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Add unit</span>
                            <button style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setBulkMode(p => !p)}>
                              {bulkMode ? 'Single entry' : 'Bulk paste'}
                            </button>
                          </div>

                          <div style={{ padding: 14 }}>
                            {bulkMode ? (
                              <div>
                                <textarea className="inp mono" rows={8} value={bulkText} onChange={e => setBulkText(e.target.value)}
                                  placeholder={"201 - TYPEWRITING\n202 - BUSINESS ORGANISATION\n203 - BOOK-KEEPING"}
                                  style={{ resize: 'vertical', marginBottom: 10 }} />
                                <select className="inp" id="bulkType" style={{ marginBottom: 10 }}>
                                  <option value="Core">Core</option>
                                  <option value="Common">Common</option>
                                  <option value="Basic">Basic</option>
                                  <option value="Elective">Elective</option>
                                </select>
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!bulkText.trim()}
                                  onClick={() => {
                                    const ut = (document.getElementById('bulkType') as HTMLSelectElement)?.value || 'Core';
                                    const isCdaccOnce = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                                    const isModLevel = courseFormData.unit_assignment_mode === 'module_level' || selectedCourseType === 'KNEC';
                                    const si = (isCdaccOnce || isModLevel) ? 0 : selectedSemester;
                                    bulkText.trim().split('\n').filter(Boolean).forEach(line => {
                                      const m = line.match(/^\s*(\S+)\s*[-\s]\s*(.+)$/);
                                      if (m) handleAddUnit(selectedModule, si, { paper_code: m[1].trim(), subject_name: m[2].trim(), unit_type: ut });
                                    });
                                    setBulkText('');
                                  }}>
                                  Add all units
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: 8, marginBottom: 10 }}>
                                  <input className="inp mono" id="scode" placeholder="Code" />
                                  <input className="inp" id="sname" placeholder="Subject name" list="subjlist" />
                                  <select className="inp" id="stype">
                                    <option value="Core">Core</option>
                                    <option value="Common">Common</option>
                                    <option value="Basic">Basic</option>
                                    <option value="Elective">Elective</option>
                                  </select>
                                  <datalist id="subjlist">{subjects.map((s, i) => <option key={i} value={s.name} />)}</datalist>
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                                  onClick={() => {
                                    const code = (document.getElementById('scode') as HTMLInputElement)?.value;
                                    const name = (document.getElementById('sname') as HTMLInputElement)?.value;
                                    const type = (document.getElementById('stype') as HTMLSelectElement)?.value;
                                    if (!code || !name) return;
                                    const isCdaccOnce = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                                    const isModLevel = courseFormData.unit_assignment_mode === 'module_level' || selectedCourseType === 'KNEC';
                                    handleAddUnit(selectedModule, (isCdaccOnce || isModLevel) ? 0 : selectedSemester, { paper_code: code, subject_name: name, unit_type: type });
                                    (document.getElementById('scode') as HTMLInputElement).value = '';
                                    (document.getElementById('sname') as HTMLInputElement).value = '';
                                  }}>
                                  Add unit
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between' }}>
                          <button className="btn btn-ghost" onClick={() => setWizardStep(2)}>← Back</button>
                          <button className="btn btn-success" style={{ fontSize: 14 }} onClick={handleFinish} disabled={submitting}>
                            {submitting ? 'Saving…' : '✓ Save & finish'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}