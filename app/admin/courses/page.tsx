'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

type LevelKey = 'diploma' | 'certificate' | 'artisan' | 'level6' | 'level5' | 'level4';
type StudyMode = 'module' | 'short-course';

interface SemesterConfig {
  durationMonths: number;
  fee: number;
  practicalFee: number;
  internalExams: number;
  units: string[];
}

type ExamBody = 'JP' | 'CDACC' | 'KNEC' | 'internal';

interface ModuleConfig {
  semesters: SemesterConfig[];
}

interface CourseTypeConfig {
  enabled: boolean;
  examBody: ExamBody;
  minKcseGrade: string;
  studyMode: StudyMode;
  durationMonths: number;
  modules: ModuleConfig[];
  semestersPerModule: number;
  moduleDurationMonths: number;
  shortCourseFee: number;
  shortCoursePaymentType: 'monthly' | 'one-time';
  shortCourseNumberOfMonths: number;
  shortCourseMonthlyFees: number[];
  shortCoursePracticalFee: number;
  shortCourseHasExams: boolean;
}

const emptyModule = (examBody: ExamBody = 'internal'): ModuleConfig => {
  const semesterDuration = examBody === 'CDACC' ? 6 : 3;
  const defaultSemesters = examBody === 'CDACC' ? 1 : 2;
  return {
    semesters: Array.from({ length: defaultSemesters }, () => ({
      durationMonths: semesterDuration,
      fee: 0,
      practicalFee: 0,
      internalExams: 2,
      units: []
    }))
  };
};

const emptyCourseType = (): CourseTypeConfig => ({
  enabled: false,
  examBody: 'internal',
  minKcseGrade: '',
  studyMode: 'module',
  durationMonths: 0,
  modules: [],
  semestersPerModule: 2,
  moduleDurationMonths: 6,
  shortCourseFee: 0,
  shortCoursePaymentType: 'one-time',
  shortCourseNumberOfMonths: 0,
  shortCourseMonthlyFees: [],
  shortCoursePracticalFee: 0,
  shortCourseHasExams: true
});

const LEVEL_MODULE_INDEX_MAP: Record<LevelKey, number> = {
  diploma: -1,
  certificate: -2,
  artisan: -3,
  level6: -4,
  level5: -5,
  level4: -6
};

const generateCourseId = () => {
  const prefix = 'CRS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

const getInitialFormData = () => ({
  courseId: '', // Allow manual entry of course ID (e.g., KNEC-2801, CDACC-001, JP-101)
  department: '',
  courseName: '',
  courseStudyMode: 'module' as StudyMode,
  courseTypes: {
    diploma: emptyCourseType(),
    certificate: emptyCourseType(),
    artisan: emptyCourseType(),
    level6: emptyCourseType(),
    level5: emptyCourseType(),
    level4: emptyCourseType()
  } as Record<LevelKey, CourseTypeConfig>
});

export default function CoursesPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'add' | 'list'>('add');
  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [formData, setFormData] = useState(getInitialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedCourseType, setSelectedCourseType] = useState<'KNEC' | 'CDACC' | 'JP' | 'INSTALL' | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [qualificationLevels, setQualificationLevels] = useState<any[]>([]);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  
  // New form data for wizard
  const [courseFormData, setCourseFormData] = useState({
    department_id: '',
    qualification_level_id: '',
    knec_code: '',
    course_name: '',
    min_kcse_grade: '',
    is_modular: true,
    total_duration_months: 24, // 2 modules × 12 months
    cdacc_payment_mode: 'per_semester' as 'per_semester' | 'once_per_stage', // CDACC only
    unit_assignment_mode: 'per_semester' as 'per_semester' | 'module_level', // For JP and CDACC: units per semester or module/stage level
    jp_exam_fee: 0, // JP exam fee at end of complete course
    has_units: false, // Short courses: has units
    // Fee fields for short courses
    first_installment: 0,
    subsequent_installment: 0,
    practical_fee: 0,
    payment_mode: 'Once' as 'Once' | 'Monthly' | 'Per Semester',
  });
  
  const [modulesData, setModulesData] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<number>(0);
  const [selectedSemester, setSelectedSemester] = useState<number>(0);
  const [unitsData, setUnitsData] = useState<Record<string, any[]>>({});
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // Track saved IDs for proper hierarchy
  const [savedCourseTypeId, setSavedCourseTypeId] = useState<string | null>(null);
  const [savedModuleIds, setSavedModuleIds] = useState<string[]>([]);
  
  // Department management
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showDeleteDepartment, setShowDeleteDepartment] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState({ name: '', code: '' });

  // Bulk paste mode for units
  const [bulkPasteMode, setBulkPasteMode] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');

  // Exam body filter for course list view
  const [examBodyFilter, setExamBodyFilter] = useState<'all' | 'KNEC' | 'CDACC' | 'JP' | 'INSTALL'>('all');

  // Filter departments based on selected course type
  const filteredDepartments = useMemo(() => {
    if (!selectedCourseType || selectedCourseType === 'INSTALL') return departments;
    // Only show departments tagged with this exam body, or untagged (for backward compatibility during transition)
    return departments.filter(d => d.exam_body === selectedCourseType || !d.exam_body);
  }, [departments, selectedCourseType]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.departments?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Exam body filter - check both ID prefix and database exam_body field
    if (examBodyFilter !== 'all') {
      const courseIdPrefix = course.id.split('-')[0];
      const dbExamBody = course.exam_body || course.course_types?.[0]?.exam_body;

      // For INSTALL (short courses)
      if (examBodyFilter === 'INSTALL') {
        const isInstall = course.id.startsWith('INT-') || course.id.startsWith('INSTALL-') || dbExamBody === 'internal' || dbExamBody === 'INSTALL';
        if (!isInstall) return false;
      }
      // For KNEC/CDACC/JP - check ID prefix OR database field
      else if (examBodyFilter === 'KNEC') {
        const isKNEC = courseIdPrefix === 'KNEC' || dbExamBody === 'KNEC';
        if (!isKNEC) return false;
      }
      else if (examBodyFilter === 'CDACC') {
        const isCDACC = courseIdPrefix === 'CDACC' || dbExamBody === 'CDACC';
        if (!isCDACC) return false;
      }
      else if (examBodyFilter === 'JP') {
        const isJP = courseIdPrefix === 'JP' || dbExamBody === 'JP';
        if (!isJP) return false;
      }
    }

    if (levelFilter === 'all') return true;

    const hasLevel = course.course_types?.some((ct: any) =>
      ct.enabled && ct.level === levelFilter
    );
    return hasLevel;
  });

  // Calculate stats
  const stats = {
    total: filteredCourses.length,
    diploma: filteredCourses.filter((c: any) => c.course_types?.some((ct: any) => ct.enabled && ct.level === 'diploma')).length,
    certificate: filteredCourses.filter((c: any) => c.course_types?.some((ct: any) => ct.enabled && ct.level === 'certificate')).length,
    artisan: filteredCourses.filter((c: any) => c.course_types?.some((ct: any) => ct.enabled && ct.level === 'artisan')).length,
    level6: filteredCourses.filter((c: any) => c.course_types?.some((ct: any) => ct.enabled && ct.level === 'level6')).length,
    level5: filteredCourses.filter((c: any) => c.course_types?.some((ct: any) => ct.enabled && ct.level === 'level5')).length,
    level4: filteredCourses.filter((c: any) => c.course_types?.some((ct: any) => ct.enabled && ct.level === 'level4')).length,
    shortCourse: filteredCourses.filter((c: any) => c.course_types?.some((ct: any) => ct.enabled && ct.study_mode === 'short-course')).length,
    // Exam body counts - check both ID prefix and exam_body field
    knec: courses.filter((c: any) => c.id.startsWith('KNEC-') || c.exam_body === 'KNEC').length,
    cdacc: courses.filter((c: any) => c.id.startsWith('CDACC-') || c.exam_body === 'CDACC').length,
    jp: courses.filter((c: any) => c.id.startsWith('JP-') || c.exam_body === 'JP').length,
    install: courses.filter((c: any) => c.id.startsWith('INT-') || c.id.startsWith('INSTALL-') || c.exam_body === 'internal').length,
  };

  const getLevelBadgeColor = (level: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      diploma: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
      certificate: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
      artisan: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
      level6: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
      level5: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
      level4: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
      'short-course': { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' },
    };
    return colors[level] || colors.diploma;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      diploma: 'Diploma',
      certificate: 'Certificate',
      artisan: 'Artisan',
      level6: 'Higher Diploma',
      level5: 'Diploma',
      level4: 'Certificate',
    };
    return labels[level] || level;
  };

  const toggleUnits = (courseId: string) => {
    setExpandedUnits(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Load departments and qualification levels when entering add mode
  useEffect(() => {
    if (viewMode === 'add' && supabase) {
      loadDepartments();
      loadQualificationLevels();
      loadSubjects();
    }
  }, [viewMode, supabase]);

  const loadDepartments = async () => {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (!error && data) setDepartments(data);
  };

  const loadQualificationLevels = async () => {
    const { data, error } = await supabase.from('qualification_levels').select('*').order('name');
    if (!error && data) setQualificationLevels(data);
  };

  const loadSubjects = async () => {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (!error && data) setSubjects(data);
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.code.trim()) return;

    setSubmitting(true);
    try {
      // Determine exam body from selected course type
      const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType;

      const { data, error } = await supabase.from('departments').insert([{
        name: newDepartment.name.trim(),
        code: newDepartment.code.trim().toUpperCase(),
        is_active: true,
        exam_body: examBody, // Tag with exam body for filtering
      }]).select().single();

      if (error) {
        if (error.code === '23505') {
          setError('A department with this name or code already exists.');
        } else {
          throw error;
        }
        return;
      }

      // Add to departments list and select it
      setDepartments([...departments, data]);
      setCourseFormData({ ...courseFormData, department_id: data.id });

      // Reset form and hide it
      setNewDepartment({ name: '', code: '' });
      setShowAddDepartment(false);
      setError('');
    } catch (err: any) {
      setError(`Failed to add department: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    const dept = departments.find(d => d.id === departmentToDelete);
    if (!dept) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${dept.name}" (${dept.code})? This action cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    try {
      // Check if department is used by any courses
      const { data: coursesUsingDept, error: checkError } = await supabase
        .from('courses')
        .select('id, name')
        .eq('department_id', departmentToDelete)
        .limit(1);

      if (checkError) throw checkError;

      if (coursesUsingDept && coursesUsingDept.length > 0) {
        setError(`Cannot delete "${dept.name}" because it is being used by courses. Please reassign those courses first.`);
        return;
      }

      // Delete the department
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentToDelete);

      if (error) throw error;

      // Remove from local state
      setDepartments(departments.filter(d => d.id !== departmentToDelete));
      
      // If the deleted department was selected, clear the selection
      if (courseFormData.department_id === departmentToDelete) {
        setCourseFormData({ ...courseFormData, department_id: '' });
      }

      // Reset and hide
      setDepartmentToDelete('');
      setShowDeleteDepartment(false);
      setError('');
    } catch (err: any) {
      setError(`Failed to delete department: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCourseTypeSelect = (type: 'KNEC' | 'CDACC' | 'JP' | 'INSTALL') => {
    // If we were not already in the wizard (fresh start), reset everything
    if (!selectedCourseType) {
      resetWizard();
      setFormData(getInitialFormData());
    }
    setSelectedCourseType(type);
    setWizardStep(1);
  };

  // Validation-only function for Step 1 (just validates, doesn't save)
  const validateStep1 = (): boolean => {
    setError('');

    if (!courseFormData.department_id || courseFormData.department_id.trim() === '') {
      setError('Please select a department before continuing.');
      return false;
    }

    if (!courseFormData.qualification_level_id || courseFormData.qualification_level_id.trim() === '') {
      setError('Please select a qualification level before continuing.');
      return false;
    }

    if (!courseFormData.knec_code || courseFormData.knec_code.trim() === '') {
      setError('Please enter a course code before continuing.');
      return false;
    }

    if (!courseFormData.course_name || courseFormData.course_name.trim() === '') {
      setError('Please enter a course name before continuing.');
      return false;
    }

    return true;
  };

  // Navigation functions that just move between steps
  const goToStep2 = () => {
    if (!validateStep1()) return;
    setWizardStep(2);
  };

  const goToStep3 = () => {
    // Validate modules have required data
    if (modulesData.length === 0) {
      setError('Please add at least one module.');
      return;
    }

    // Check that all modules have fees set
    for (let i = 0; i < modulesData.length; i++) {
      const mod = modulesData[i];
      if (!mod.semesters || mod.semesters.length === 0) {
        setError(`Module ${i + 1} has no semesters configured.`);
        return;
      }
      for (let j = 0; j < mod.semesters.length; j++) {
        const sem = mod.semesters[j];
        if (!sem.fee || sem.fee <= 0) {
          setError(`Please set a fee for Module ${i + 1}, Semester ${j + 1}.`);
          return;
        }
      }
    }

    setError('');
    setWizardStep(3);
  };

  const handleSaveCourse = async () => {
    // Save course and move to step 2
    setSubmitting(true);
    setError('');

    try {
      // Map selected course type to exam_body
      const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType;

      if (!courseFormData.department_id || courseFormData.department_id.trim() === '') {
        console.error('Missing department_id in courseFormData:', courseFormData);
        setError('Please select a department before saving.');
        setSubmitting(false);
        return;
      }

      if (!courseFormData.qualification_level_id || courseFormData.qualification_level_id.trim() === '') {
        console.error('Missing qualification_level_id in courseFormData:', courseFormData);
        setError('Please select a qualification level before saving.');
        setSubmitting(false);
        return;
      }

      if (!courseFormData.knec_code || courseFormData.knec_code.trim() === '') {
        console.error('Missing knec_code in courseFormData:', courseFormData);
        setError('Please enter a course code before saving.');
        setSubmitting(false);
        return;
      }

      if (!courseFormData.course_name || courseFormData.course_name.trim() === '') {
        console.error('Missing course_name in courseFormData:', courseFormData);
        setError('Please enter a course name before saving.');
        setSubmitting(false);
        return;
      }

      // Build proper course ID with prefix based on course type
      const rawCode = courseFormData.knec_code.trim();
      let courseId: string;

      if (editingCourse) {
        // Update existing course
        const { error: updateError } = await supabase.from('courses').update({
          name: courseFormData.course_name,
          department_id: courseFormData.department_id,
          qualification_level_id: courseFormData.qualification_level_id,
          min_kcse_grade: courseFormData.min_kcse_grade,
          exam_body: examBody,
        }).eq('id', editingCourse);

        if (updateError) throw updateError;
        courseId = editingCourse;
        setSavedCourseId(courseId);
        console.log('Updated existing course:', courseId);
      } else {
        // Build course ID with proper prefix for new courses
        const prefix = selectedCourseType === 'INSTALL' ? 'INT' : selectedCourseType;
        courseId = rawCode.startsWith(prefix + '-') ? rawCode : `${prefix}-${rawCode}`;

        // Insert new course
        const { data, error } = await supabase.from('courses').insert([{
          id: courseId,
          name: courseFormData.course_name,
          department_id: courseFormData.department_id,
          qualification_level_id: courseFormData.qualification_level_id,
          min_kcse_grade: courseFormData.min_kcse_grade,
          exam_body: examBody,
          fee_per_semester: 0,
        }]).select().single();

        if (error) throw error;
        courseId = data.id;
        setSavedCourseId(courseId);
        console.log('Created new course:', courseId);
      }
      
      // For short courses (INSTALL), save to short_courses table and skip modules
      if (selectedCourseType === 'INSTALL') {
        if (!courseId || courseId.trim() === '') {
          console.error('Missing courseId after save (INSTALL branch):', { courseId, editingCourse });
          setError('Course ID is missing. Please try again.');
          setSubmitting(false);
          return;
        }

        if (editingCourse) {
          // Update existing short course
          const { error: shortCourseError } = await supabase.from('short_courses').update({
            department_id: courseFormData.department_id,
            qualification_level_id: courseFormData.qualification_level_id,
            name: courseFormData.course_name,
            short_code: courseFormData.knec_code,
            payment_mode: courseFormData.payment_mode,
            first_installment: courseFormData.first_installment,
            subsequent_installment: courseFormData.subsequent_installment,
            practical_fee: courseFormData.practical_fee,
          }).eq('course_id', courseId);

          if (shortCourseError) throw shortCourseError;
        } else {
          // Insert new short course
          const { data: shortCourseData, error: shortCourseError } = await supabase.from('short_courses').insert([{
            course_id: courseId,
            department_id: courseFormData.department_id,
            qualification_level_id: courseFormData.qualification_level_id,
            name: courseFormData.course_name,
            short_code: courseFormData.knec_code,
            duration_months: 1,
            payment_mode: courseFormData.payment_mode,
            first_installment: courseFormData.first_installment,
            subsequent_installment: courseFormData.subsequent_installment,
            has_exams: true,
            practical_fee: courseFormData.practical_fee,
            is_active: true,
          }]).select().single();

          if (shortCourseError) throw shortCourseError;
        }

        // Skip modules and go directly to adding units for short courses
        setWizardStep(3);
      } else {
        // Create course_type entry for modular courses (KNEC, CDACC, JP)
        // Get the qualification level name from the selected ID and map to allowed values
        const selectedLevel = qualificationLevels.find(l => l.id === courseFormData.qualification_level_id);
        const levelName = selectedLevel?.name?.toLowerCase() || 'diploma';
        
        // Map qualification level names to course_types.level allowed values
        const levelMap: Record<string, string> = {
          'diploma': 'diploma',
          'certificate': 'certificate',
          'artisan': 'artisan',
          'artisan certificate': 'artisan',
          'level 6': 'level6',
          'level 5': 'level5',
          'level 4': 'level4',
          'level 3': 'level3',
          'higher diploma': 'level6',
        };
        
        const mappedLevel = levelMap[levelName] || 'diploma';
        
        const studyMode = courseFormData.is_modular ? 'module' : 'short-course';
        const durationMonths = courseFormData.is_modular ? 18 : 12;
        
        if (editingCourse) {
          // Update existing course_type
          // First find the existing course_type id
          const { data: existingCourseType } = await supabase
            .from('course_types')
            .select('id')
            .eq('course_id', courseId)
            .single();

          if (existingCourseType) {
            const { error: courseTypeError } = await supabase.from('course_types').update({
              level: mappedLevel,
              study_mode: studyMode,
              duration_months: courseFormData.total_duration_months || durationMonths,
              exam_fee: selectedCourseType === 'JP' ? (courseFormData.jp_exam_fee || 0) : 0,
            }).eq('id', existingCourseType.id);

            if (courseTypeError) throw courseTypeError;
            setSavedCourseTypeId(existingCourseType.id);
            console.log('Updated existing course_type:', existingCourseType.id);
          }
        } else {
          // Insert new course_type
          const { data: courseTypeData, error: courseTypeError } = await supabase.from('course_types').insert([{
            course_id: courseId,
            level: mappedLevel,
            enabled: true,
            study_mode: studyMode,
            duration_months: courseFormData.total_duration_months || durationMonths,
            exam_fee: selectedCourseType === 'JP' ? (courseFormData.jp_exam_fee || 0) : 0,
          }]).select().single();

          if (courseTypeError) throw courseTypeError;
          setSavedCourseTypeId(courseTypeData.id);
          console.log('Created new course_type:', courseTypeData.id);
        }

        setWizardStep(2);
      }
      
      // Initialize modules based on total duration
      // IMPORTANT: When editing, do not overwrite existing Step 2 data that was loaded from DB.
      if (!editingCourse || modulesData.length === 0) {
        // KNEC: 1 module = 12 months calendar (includes 3 months holiday)
        // Each module has 3 instructional semesters × 3 months
        const totalDuration = courseFormData.total_duration_months || 24;
        const monthsPerModule = 12; // 12 months calendar per module (includes holidays)
        const moduleCount = courseFormData.is_modular ? Math.ceil(totalDuration / monthsPerModule) : 1;
        const moduleDuration = courseFormData.is_modular ? Math.ceil(totalDuration / moduleCount) : totalDuration;
        
        const initialModules = Array.from({ length: moduleCount }, (_, i) => {
          const duration = i === moduleCount - 1 
            ? totalDuration - (moduleDuration * (moduleCount - 1)) // last module gets remainder
            : moduleDuration;
          // CDACC once_per_stage: no semesters, just stage fee
          const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
          const semesterCount = isCdaccOncePerStage ? 0 : 3; // 3 instructional semesters per module (holidays counted in calendar)
          // CDACC Per Semester: last stage is Industrial Attachment (no units)
          // CDACC Once per Stage: all stages have units (including last which is Industrial Attachment)
          const isAttachmentStage = selectedCourseType === 'CDACC' && !isCdaccOncePerStage && i === moduleCount - 1;
          // Attachment: after module 2 for 2-module courses, after semester 2 in module 3 for 3+ module courses
          const hasAttachment = moduleCount >= 3 ? (i === 2) : (i === 1);
          return {
            duration_months: duration,
            label: courseFormData.is_modular ? `${selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} ${['I', 'II', 'III', 'IV', 'V', 'VI'][i] || `${selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} ${i+1}`}` : 'Single Module',
            exam_fee: 0,
            fee: isCdaccOncePerStage ? 0 : undefined, // stage-level fee for CDACC once_per_stage
            is_attachment_stage: isAttachmentStage,
            has_attachment: hasAttachment,
            attachment_after_semester: hasAttachment ? (moduleCount >= 3 ? 2 : 3) : undefined,
            attachment_duration_months: 3,
            semesters: isCdaccOncePerStage ? [] : Array.from({ length: semesterCount }, (_, j) => ({
              semester_index: j + 1,
              fee: 0,
              internal_exams: 2,
              additional_fees: [] as { fee_name: string; amount: number }[],
            })),
          };
        });
        setModulesData(initialModules);
      }
    } catch (err: any) {
      console.error('handleSaveCourse failed with payload:', {
        editingCourse,
        selectedCourseType,
        courseFormData,
        savedCourseId,
        savedCourseTypeId,
      });
      setError(`Failed to save course: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddModule = () => {
    const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
    const newModule = {
      duration_months: 12,
      label: `${selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} ${['I', 'II', 'III', 'IV', 'V', 'VI'][modulesData.length] || `${selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} ${modulesData.length + 1}`}`,
      exam_fee: 0,
      fee: isCdaccOncePerStage ? 0 : undefined,
      is_attachment_stage: false,
      has_attachment: false,
      attachment_after_semester: undefined as number | undefined,
      attachment_duration_months: 3,
      semesters: isCdaccOncePerStage ? [] : Array.from({ length: 3 }, (_, i) => ({
        semester_index: i + 1,
        fee: 0,
        internal_exams: 2,
        additional_fees: [] as { fee_name: string; amount: number }[],
      })),
    };
    setModulesData([...modulesData, newModule]);
  };

  const handleModuleDurationChange = (index: number, duration: number) => {
    const updated = [...modulesData];
    updated[index].duration_months = duration;
    setModulesData(updated);
  };

  // Comprehensive save function that saves everything at the end (Finish button)
  const handleFinishAndSave = async () => {
    setSubmitting(true);
    setError('');

    try {
      const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType;

      // ===== STEP 1: Save Course =====
      if (!courseFormData.department_id || !courseFormData.qualification_level_id ||
          !courseFormData.knec_code || !courseFormData.course_name) {
        setError('Please fill in all required course details.');
        setSubmitting(false);
        return;
      }

      const rawCode = courseFormData.knec_code.trim();
      const prefix = selectedCourseType === 'INSTALL' ? 'INT' : selectedCourseType;
      const courseId = editingCourse || (rawCode.startsWith(prefix + '-') ? rawCode : `${prefix}-${rawCode}`);

      if (editingCourse) {
        // Update existing course
        const { error: updateError } = await supabase.from('courses').update({
          name: courseFormData.course_name,
          department_id: courseFormData.department_id,
          qualification_level_id: courseFormData.qualification_level_id,
          min_kcse_grade: courseFormData.min_kcse_grade,
          exam_body: examBody,
        }).eq('id', editingCourse);
        if (updateError) throw updateError;
      } else {
        // Insert new course
        const { error: insertError } = await supabase.from('courses').insert([{
          id: courseId,
          name: courseFormData.course_name,
          department_id: courseFormData.department_id,
          qualification_level_id: courseFormData.qualification_level_id,
          min_kcse_grade: courseFormData.min_kcse_grade,
          exam_body: examBody,
          fee_per_semester: 0,
        }]);
        if (insertError) throw insertError;
      }

      // ===== STEP 2: Save Course Type =====
      const level = courseFormData.qualification_level_id === '3998928f-5571-46f3-8116-1bdde4c46995' ? 'diploma' :
                   courseFormData.qualification_level_id === 'certificate' ? 'certificate' :
                   courseFormData.qualification_level_id === 'artisan' ? 'artisan' : 'diploma';

      const { data: courseTypeData, error: courseTypeError } = await supabase.from('course_types').upsert([{
        course_id: courseId,
        level: level,
        duration_months: courseFormData.total_duration_months,
        study_mode: selectedCourseType === 'INSTALL' ? 'short-course' : 'module',
        enabled: true,
        min_kcse_grade: courseFormData.min_kcse_grade,
      }], { onConflict: 'course_id,level' }).select().single();

      if (courseTypeError) throw courseTypeError;
      const courseTypeId = courseTypeData.id;

      // ===== STEP 3: Save Modules & Semesters =====
      // Delete existing modules for this course type
      const { data: existingMods } = await supabase.from('modules').select('id').eq('course_type_id', courseTypeId);
      if (existingMods && existingMods.length > 0) {
        const modIds = existingMods.map((m: any) => m.id);
        await supabase.from('semesters').delete().in('module_id', modIds);
        await supabase.from('modules').delete().eq('course_type_id', courseTypeId);
      }

      const savedModuleIds: string[] = [];

      for (let i = 0; i < modulesData.length; i++) {
        const module = modulesData[i];
        const semesterCount = courseFormData.is_modular ? 3 : Math.ceil(module.duration_months / 3);

        const { data: moduleData, error: moduleError } = await supabase.from('modules').insert([{
          course_type_id: courseTypeId,
          module_index: i + 1,
          label: module.label || `${selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} ${i + 1}`,
          duration_months: module.duration_months,
          exam_body: examBody,
          exam_fee: module.exam_fee || 0,
          fee: module.fee || 0,
          is_attachment_stage: module.is_attachment_stage || false,
          has_attachment: module.has_attachment || false,
          attachment_after_semester: module.has_attachment ? module.attachment_after_semester : null,
          attachment_duration_months: module.has_attachment ? module.attachment_duration_months || 3 : null,
        }]).select().single();

        if (moduleError) throw moduleError;
        savedModuleIds.push(moduleData.id);

        // Create semesters
        for (let j = 0; j < semesterCount; j++) {
          const semesterData = module.semesters?.[j] || { fee: 0, internal_exams: 2, additional_fees: [] };

          const { data: savedSemester, error: semesterError } = await supabase.from('semesters').insert([{
            module_id: moduleData.id,
            semester_index: j + 1,
            duration_months: 3,
            fee: semesterData.fee || 0,
            practical_fee: !courseFormData.is_modular || selectedCourseType !== 'KNEC' ? (semesterData.practical_fee || 0) : 0,
            internal_exams: semesterData.internal_exams || 2,
          }]).select().single();

          if (semesterError) throw semesterError;

          // Save additional fees
          if (semesterData.additional_fees && semesterData.additional_fees.length > 0) {
            const additionalFeesRows = semesterData.additional_fees
              .filter((af: { fee_name: string; amount: number }) => af.fee_name && af.amount > 0)
              .map((af: { fee_name: string; amount: number }) => ({
                semester_id: savedSemester.id,
                fee_name: af.fee_name,
                amount: af.amount,
              }));
            if (additionalFeesRows.length > 0) {
              await supabase.from('semester_additional_fees').insert(additionalFeesRows);
            }
          }
        }
      }

      // ===== STEP 4: Save Units =====
      // Get all existing units for this course and delete them
      await supabase.from('units').delete().eq('course_id', courseId);

      // Insert all units from unitsData
      for (const [key, units] of Object.entries(unitsData)) {
        if (!units || units.length === 0) continue;

        const [moduleIdxStr, semesterIdxStr] = key.split('_');
        const moduleIndex = parseInt(moduleIdxStr) + 1;
        const semesterIndex = semesterIdxStr === 'stage' ? 0 : parseInt(semesterIdxStr) + 1;

        for (const unit of units) {
          await supabase.from('units').insert([{
            course_id: courseId,
            unit_code: unit.paper_code,
            name: unit.subject_name,
            module_index: moduleIndex,
            semester_index: semesterIndex,
            unit_type: unit.unit_type || 'Core',
          }]);
        }
      }

      // Success - reset and go to list
      resetWizard();
      setViewMode('list');
      loadCourses();

    } catch (err: any) {
      console.error('Error saving course:', err);
      setError(`Failed to save course: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveModules = async () => {
    // Save modules and move to step 3
    setSubmitting(true);
    setError('');

    try {
      const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType;

      // Validate savedCourseTypeId
      if (!savedCourseTypeId || savedCourseTypeId === '') {
        console.error('savedCourseTypeId is empty:', savedCourseTypeId);
        setError('Course type ID is missing. Please save the course first.');
        setSubmitting(false);
        return;
      }

      // First, check if modules already exist for this course_type_id
      const { data: existingModules, error: checkError } = await supabase
        .from('modules')
        .select('id, module_index')
        .eq('course_type_id', savedCourseTypeId);

      if (checkError) throw checkError;

      // If modules exist, delete them first to prevent duplicates
      if (existingModules && existingModules.length > 0) {
        // Delete semesters first (due to foreign key constraint)
        const moduleIds = existingModules.map((m: any) => m.id);
        const { error: deleteSemestersError } = await supabase
          .from('semesters')
          .delete()
          .in('module_id', moduleIds);
        if (deleteSemestersError) throw deleteSemestersError;

        // Delete modules
        const { error: deleteModulesError } = await supabase
          .from('modules')
          .delete()
          .eq('course_type_id', savedCourseTypeId);
        if (deleteModulesError) throw deleteModulesError;

        // Clear saved module IDs
        setSavedModuleIds([]);
      }
      
      for (let i = 0; i < modulesData.length; i++) {
        const module = modulesData[i];
        // KNEC: 3 instructional semesters per module (holidays part of calendar)
        const semesterCount = courseFormData.is_modular ? 3 : Math.ceil(module.duration_months / 3);
        
        // Save to modules table linked to course_type
        const { data: moduleData, error: moduleError } = await supabase.from('modules').insert([{
          course_type_id: savedCourseTypeId,
          module_index: i + 1,
          label: module.label || `${selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} ${i + 1}`,
          duration_months: module.duration_months,
          exam_body: examBody,
          exam_fee: module.exam_fee || 0,
          fee: module.fee || 0, // stage-level fee for CDACC once_per_stage
          is_attachment_stage: module.is_attachment_stage || false,
          has_attachment: module.has_attachment || false,
          attachment_after_semester: module.has_attachment ? module.attachment_after_semester : null,
          attachment_duration_months: module.has_attachment ? module.attachment_duration_months || 3 : null,
        }]).select().single();

        if (moduleError) throw moduleError;
        
        // Store module ID for unit assignment
        setSavedModuleIds(prev => [...prev, moduleData.id]);

        // Skip semester creation for CDACC once_per_stage
        if (semesterCount === 0) continue;

        // Create semesters with fee data
        for (let j = 0; j < semesterCount; j++) {
          const semesterData = module.semesters?.[j] || {
            fee: 0,
            internal_exams: 2,
            additional_fees: [],
          };
          
          const { data: savedSemester, error: semesterError } = await supabase.from('semesters').insert([{
            module_id: moduleData.id,
            semester_index: j + 1,
            duration_months: 3,
            fee: semesterData.fee || 0,
            practical_fee: !courseFormData.is_modular || selectedCourseType !== 'KNEC' ? (semesterData.practical_fee || 0) : 0,
            internal_exams: semesterData.internal_exams || 2,
          }]).select().single();

          if (semesterError) throw semesterError;

          // Save additional fees for this semester
          if (semesterData.additional_fees && semesterData.additional_fees.length > 0) {
            const additionalFeesRows = semesterData.additional_fees
              .filter((af: { fee_name: string; amount: number }) => af.fee_name && af.amount > 0)
              .map((af: { fee_name: string; amount: number }) => ({
                semester_id: savedSemester.id,
                fee_name: af.fee_name,
                amount: af.amount,
              }));

            if (additionalFeesRows.length > 0) {
              const { error: addFeesError } = await supabase.from('semester_additional_fees').insert(additionalFeesRows);
              if (addFeesError) throw addFeesError;
            }
          }

          // Save units for this semester
          if (semesterData.units && semesterData.units.length > 0) {
            // Validate savedCourseId before saving units
            if (!savedCourseId || savedCourseId === '') {
              console.error('savedCourseId is empty when trying to save units:', savedCourseId);
              setError('Course ID is missing when saving units. Please try again.');
              setSubmitting(false);
              return;
            }
            for (const unitName of semesterData.units) {
              const unitCode = unitName.split('-')[0].trim();
              const { error: unitError } = await supabase.from('units').upsert([{
                course_id: savedCourseId,
                unit_code: unitCode,
                name: unitName,
                module_index: i + 1,
                semester_index: j + 1
              }], { onConflict: 'course_id,unit_code' });
              if (unitError) throw unitError;
            }
          }
        }
      }
      
      setWizardStep(3);
    } catch (err: any) {
      setError(`Failed to save modules: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUnit = async (moduleId: number, semesterIndex: number, unit: any) => {
    // CDACC once_per_stage: units at stage level (semester_index = 0)
    const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
    const key = isCdaccOncePerStage ? `${moduleId}_stage` : `${moduleId}_${semesterIndex}`;
    const existingUnits = unitsData[key] || [];

    // Check if subject exists in subjects table (if using master_subjects)
    let subject = subjects.find(s => s.name.toLowerCase() === unit.subject_name.toLowerCase());

    if (!subject) {
      // Create new subject in subjects table
      const { data: newSubject, error: subjectError } = await supabase.from('subjects').insert([{
        name: unit.subject_name,
      }]).select().single();

      if (subjectError) {
        // If subjects table doesn't exist, continue without creating
        console.log('Could not create subject:', subjectError);
      } else {
        subject = newSubject;
        setSubjects([...subjects, subject]);
      }
    }

    // Add unit to units table
    // Note: units table has course_id, unit_code, name, module_index, semester_index, unit_type
    // Validate savedCourseId
    if (!savedCourseId || savedCourseId === '') {
      console.error('savedCourseId is empty in handleAddUnit:', savedCourseId);
      setError('Course ID is missing. Please save the course first.');
      return;
    }
    const { error: unitError } = await supabase.from('units').upsert([{
      course_id: savedCourseId,
      unit_code: unit.paper_code,
      name: unit.subject_name,
      module_index: moduleId + 1,
      semester_index: isCdaccOncePerStage ? 0 : semesterIndex + 1, // 0 for stage-level units
      unit_type: unit.unit_type || 'Core', // Default to Core if not specified
    }], { onConflict: 'course_id,unit_code' });

    if (unitError) {
      throw new Error(`Failed to save unit: ${unitError.message}`);
    }
    
    setUnitsData({
      ...unitsData,
      [key]: [...existingUnits, unit]
    });
  };

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedCourseType(null);
    setSavedCourseId(null);
    setSavedCourseTypeId(null);
    setSavedModuleIds([]);
    setCourseFormData({
      department_id: '',
      qualification_level_id: '',
      knec_code: '',
      course_name: '',
      min_kcse_grade: '',
      is_modular: true,
      total_duration_months: 24,
      cdacc_payment_mode: 'per_semester',
      unit_assignment_mode: 'per_semester',
      jp_exam_fee: 0,
      has_units: false,
      first_installment: 0,
      subsequent_installment: 0,
      practical_fee: 0,
      payment_mode: 'Once',
    });
    setModulesData([]);
    setUnitsData({});
    setSelectedModule(0);
    setSelectedSemester(0);
    setShowAddDepartment(false);
    setShowDeleteDepartment(false);
    setDepartmentToDelete('');
    setNewDepartment({ name: '', code: '' });
    setBulkPasteMode(false);
    setBulkPasteText('');
  };

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login/admin');
        return;
      }

      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'admin') {
        if (userRole === 'lecturer') {
          router.push('/lecturer/dashboard');
        } else if (userRole === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/login/admin');
        }
        return;
      }

      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  useEffect(() => {
    if (viewMode === 'list') {
      loadCourses();
    }
  }, [viewMode]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          departments (name),
          course_types (
            level,
            enabled,
            min_kcse_grade,
            study_mode,
            duration_months,
            modules (
              module_index,
              semesters (
                semester_index,
                duration_months,
                fee,
                practical_fee,
                internal_exams
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading courses:', error);
      } else {
        // Fetch all units separately to avoid PostgREST relationship errors
        let coursesWithUnits = data || [];
        try {
          const { data: unitsData, error: unitsError } = await supabase.from('v_units_by_module_semester').select('*');
          if (!unitsError && unitsData) {
            coursesWithUnits = coursesWithUnits.map((course: any) => {
              const courseUnits = unitsData.filter((u: any) => u.course_id === course.id);
              // Deduplicate units by unit_code to avoid showing duplicates from the view
              const uniqueUnits = Array.from(new Map(courseUnits.map((u: any) => [u.unit_code || u.name, u])).values());
              return {
                ...course,
                units: uniqueUnits,
                // Store raw units with module info for KNEC display
                rawUnits: courseUnits
              };
            });
          }
        } catch (_err) {
          // Ignore unit load errors
        }
        setCourses(coursesWithUnits);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const handleEditCourse = async (course: any) => {
    try {
      setEditingCourse(course.id);
      setError('');
      console.log('Starting edit for course:', course.id, course.name);

      // Ensure wizard IDs are populated for Step 2/3 operations
      setSavedCourseId(course.id);
      setSelectedModule(0);
      setSelectedSemester(0);

      // Load course types for this course
      const { data: courseTypesData, error: courseTypesError } = await supabase
        .from('course_types')
        .select('*')
        .eq('course_id', course.id);

      if (courseTypesError) {
        console.error('Error loading course types:', courseTypesError);
        setError(`Failed to load course data: ${courseTypesError.message}`);
        return;
      }

      console.log('Loaded course types:', courseTypesData);

      // Load modules for each course type
      const courseTypesWithModules = await Promise.all(
        (courseTypesData || []).map(async (ct: any) => {
          const { data: modulesData } = await supabase
            .from('modules')
            .select('*')
            .eq('course_type_id', ct.id)
            .order('module_index');

          console.log('Loaded modules for course type', ct.level, ':', modulesData);

          // Load semesters for each module
          const modulesWithSemesters = await Promise.all(
            (modulesData || []).map(async (m: any) => {
              const { data: semestersData } = await supabase
                .from('semesters')
                .select('*')
                .eq('module_id', m.id)
                .order('semester_index');

              return {
                ...m,
                semesters: semestersData || []
              };
            })
          );

          return {
            ...ct,
            modules: modulesWithSemesters
          };
        })
      );

      console.log('Course types with modules:', courseTypesWithModules);

    // Load units for this course with IDs
    const { data: rawUnitsData, error: unitsLoadError } = await supabase
      .from('v_units_by_module_semester')
      .select('*')
      .eq('course_id', course.id)
      .order('module_index, semester_index');

    if (unitsLoadError) {
      console.error('Error loading units for course:', unitsLoadError);
    }

    // Deduplicate units by unit_code to handle KNEC view expansion
    const unitsData = Array.from(new Map((rawUnitsData || []).map((u: any) => [u.unit_code || u.name, u])).values());

    console.log('Loaded units for course:', unitsData?.length, 'unique from', rawUnitsData?.length, 'raw');

    // Store existing IDs for updates
    const existingIds: any = {
      courseId: course.id,
      courseTypes: {},
      modules: {},
      semesters: {},
      units: {}
    };

    // Store unit codes for updates (using unit_code instead of id)
    const unitCodes: any = {};
    for (const u of (unitsData || []) as any[]) {
      const level = courseTypesWithModules?.find((ct: any) => ct.id === u.course_id)?.level;
      if (level) {
        if (!unitCodes[level]) unitCodes[level] = {};
        unitCodes[level][`${u.module_index}_${u.semester_index}_${u.name}`] = u.unit_code;
      }
    }
    existingIds.units = unitCodes;

    // Build courseTypes object from relational data with IDs
    const courseTypes: Record<LevelKey, CourseTypeConfig> = {
      diploma: emptyCourseType(),
      certificate: emptyCourseType(),
      artisan: emptyCourseType(),
      level6: emptyCourseType(),
      level5: emptyCourseType(),
      level4: emptyCourseType()
    };

    // Determine global study mode from first enabled course type
    let globalStudyMode: StudyMode = 'module';

    for (const ct of courseTypesWithModules || []) {
      if (ct.enabled) {
        globalStudyMode = ct.study_mode as StudyMode;
        break;
      }
    }

    for (const ct of courseTypesWithModules || []) {
      const level = ct.level as LevelKey;
      existingIds.courseTypes[level] = ct.id;
      console.log('Loading course type:', level, 'with', ct.modules?.length, 'modules');

      // Store module IDs
      const moduleIds: any = {};
      const semesterIds: any = {};

      for (const m of ct.modules || []) {
        console.log('Module from DB:', m.module_index, 'with', m.semesters?.length, 'semesters');
        moduleIds[m.module_index] = m.id;
        for (const s of m.semesters || []) {
          console.log('Semester from DB:', s.semester_index, 'fee:', s.fee);
          semesterIds[`${m.module_index}_${s.semester_index}`] = s.id;
        }
      }

      existingIds.modules[level] = moduleIds;
      existingIds.semesters[level] = semesterIds;


      // Get exam body from first module (all modules should have same exam body now)
      const courseExamBody = (ct.modules && ct.modules[0] && ct.modules[0].exam_body) || 'internal';

      courseTypes[level] = {
        enabled: ct.enabled,
        examBody: courseExamBody,
        minKcseGrade: ct.min_kcse_grade,
        studyMode: ct.study_mode as StudyMode,
        durationMonths: ct.duration_months,
        modules: (ct.modules || []).sort((a: any, b: any) => a.module_index - b.module_index).map((m: any) => ({
          semesters: (m.semesters || []).sort((a: any, b: any) => a.semester_index - b.semester_index).map((s: any) => {
            // Load units for this semester using course_id, module_index, and semester_index
            const semesterUnits = (unitsData || [])
              .filter((u: any) => u.course_id === course.id && u.module_index === m.module_index && u.semester_index === s.semester_index)
              .map((u: any) => u.name);

            return {
              durationMonths: s.duration_months,
              fee: s.fee,
              practicalFee: s.practical_fee,
              internalExams: s.internal_exams,
              units: semesterUnits
            };
          })
        })),
        semestersPerModule: (ct.modules && ct.modules[0] && ct.modules[0].semesters) ? ct.modules[0].semesters.length : 2,
        moduleDurationMonths: (ct.modules && ct.modules[0] && ct.modules[0].semesters) ? ct.modules[0].semesters.length * 3 : 6,
        shortCourseFee: 0,
        shortCoursePaymentType: 'one-time',
        shortCourseNumberOfMonths: 0,
        shortCourseMonthlyFees: [],
        shortCoursePracticalFee: 0,
        shortCourseHasExams: true
      };
    }

    // Load department name from departments table
    let departmentName = '';
    try {
      const { data: departmentData } = await supabase
        .from('departments')
        .select('name')
        .eq('id', course.department_id)
        .single();
      departmentName = departmentData?.name || '';
    } catch (err) {
      console.error('Error loading department:', err);
      departmentName = '';
    }

    setFormData({
      courseId: course.id,
      department: departmentName,
      courseName: course.name,
      courseStudyMode: globalStudyMode,
      courseTypes
    });

    // Also populate courseFormData for the wizard form
    const enabledCourseType = courseTypesWithModules.find((ct: any) => ct.enabled);

    setCourseFormData({
      department_id: course.department_id || '',
      qualification_level_id: course.qualification_level_id || '',
      knec_code: course.id,
      course_name: course.name,
      min_kcse_grade: enabledCourseType?.min_kcse_grade || 'C-',
      is_modular: globalStudyMode === 'module',
      total_duration_months: enabledCourseType?.duration_months || 24,
      cdacc_payment_mode: 'per_semester',
      unit_assignment_mode: 'per_semester',
      jp_exam_fee: 0,
      has_units: false,
      first_installment: 0,
      subsequent_installment: 0,
      practical_fee: 0,
      payment_mode: 'Once',
    });

    if (enabledCourseType?.id) {
      setSavedCourseTypeId(enabledCourseType.id);
    }

    // Set the selected course type based on the first enabled course type's exam body
    if (enabledCourseType) {
      const examBody = enabledCourseType.modules?.[0]?.exam_body || 'KNEC';
      if (examBody === 'internal') {
        setSelectedCourseType('INSTALL');
      } else if (examBody === 'JP' || examBody === 'CDACC' || examBody === 'KNEC') {
        setSelectedCourseType(examBody);
      }
    }

    // Set modules data for editing
    if (enabledCourseType?.modules) {
      setModulesData(enabledCourseType.modules.map((m: any) => ({
        label: m.label || `Module ${m.module_index}`,
        duration_months: m.duration_months,
        exam_fee: m.exam_fee || 0,
        fee: m.fee || 0,
        is_attachment_stage: m.is_attachment_stage || false,
        has_attachment: m.has_attachment || false,
        attachment_after_semester: m.attachment_after_semester,
        attachment_duration_months: m.attachment_duration_months,
        semesters: m.semesters?.map((s: any) => ({
          fee: s.fee || 0,
          practical_fee: s.practical_fee || 0,
          internal_exams: s.internal_exams || 2,
          duration_months: s.duration_months || 3,
          additional_fees: []
        })) || []
      })));

      // Keep saved module IDs aligned with loaded modules for Step 3
      setSavedModuleIds((enabledCourseType.modules || []).map((m: any) => m.id).filter(Boolean));
    }

    // Populate Step 3 unitsData (UI state) from DB units
    try {
      const moduleSemesterCount: Record<number, number> = {};
      if (enabledCourseType?.modules) {
        for (const m of enabledCourseType.modules) {
          moduleSemesterCount[m.module_index] = (m.semesters?.length ?? 0) || Math.ceil((m.duration_months || 6) / 3) || 2;
        }
      }

      const nextUnitsData: Record<string, any[]> = {};
      for (const u of (unitsData || []) as any[]) {
        const moduleIdx0 = Math.max(0, (u.module_index || 1) - 1);
        const semesterIdx0 = Math.max(0, (u.semester_index || 1) - 1);
        const baseUnit = {
          paper_code: u.unit_code,
          subject_name: u.name,
          unit_type: u.unit_type || 'Core'
        };

        // semester_index = 0 means module-wide / stage-level.
        // Keep the _stage key for CDACC once_per_stage, and also fan out into all semesters
        // so Step 3 can show the same units in each semester tab when needed.
        if (u.semester_index === 0) {
          const stageKey = `${moduleIdx0}_stage`;
          if (!nextUnitsData[stageKey]) nextUnitsData[stageKey] = [];
          nextUnitsData[stageKey].push(baseUnit);

          const semCount = moduleSemesterCount[u.module_index] || 0;
          for (let s0 = 0; s0 < semCount; s0++) {
            const k = `${moduleIdx0}_${s0}`;
            if (!nextUnitsData[k]) nextUnitsData[k] = [];
            nextUnitsData[k].push(baseUnit);
          }
          continue;
        }

        const key = `${moduleIdx0}_${semesterIdx0}`;
        if (!nextUnitsData[key]) nextUnitsData[key] = [];
        nextUnitsData[key].push(baseUnit);
      }
      setUnitsData(nextUnitsData);
      console.log('Preloaded unitsData keys:', Object.keys(nextUnitsData));
    } catch (err) {
      console.error('Error populating unitsData state:', err);
    }

    console.log('Setting form data:', {
      courseId: course.id,
      department: departmentName,
      courseName: course.name,
      courseStudyMode: globalStudyMode,
      courseTypes
    });

    // Store existing IDs in a separate state for use during save
    // Validate that all IDs are proper UUIDs before storing
    const validatedIds: any = {
      courseId: course.id,
      courseTypes: {},
      modules: {},
      semesters: {},
      units: existingIds.units || {}
    };

    for (const [level, ctId] of Object.entries(existingIds.courseTypes || {})) {
      if (ctId && ctId !== '') {
        validatedIds.courseTypes[level] = ctId;
        if (existingIds.modules?.[level]) {
          validatedIds.modules[level] = existingIds.modules[level];
        }
        if (existingIds.semesters?.[level]) {
          validatedIds.semesters[level] = existingIds.semesters[level];
        }
      }
    }

    (window as any).existingCourseIds = validatedIds;
    console.log('Stored validated existing IDs:', validatedIds);

    console.log('Switching to add/edit mode');
    // Always set view mode to add/edit form
    setViewMode('add');
    // Start at step 1 for editing (course details), while Step 2/3 data is preloaded above
    setWizardStep(1);
    } catch (err: any) {
      console.error('Error loading course for edit:', err);
      setError(`Failed to load course: ${err.message}`);
      // Still switch to add mode even if there's an error
      setViewMode('add');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will affect both campuses.')) {
      return;
    }
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) {
        setError(`Failed to delete course: ${error.message}`);
      } else {
        await loadCourses();
        setError('Course deleted successfully!');
      }
    } catch (err) {
      setError('Failed to delete course. Please try again.');
    }
  };

  const handleCourseTypeToggle = (type: LevelKey) => {
    setFormData((prev) => ({
      ...prev,
      courseTypes: {
        ...prev.courseTypes,
        [type]: {
          ...prev.courseTypes[type],
          enabled: !prev.courseTypes[type].enabled,
          studyMode: prev.courseStudyMode
        }
      }
    }));
  };

  const handleCourseStudyModeChange = (studyMode: StudyMode) => {
    setFormData((prev) => ({
      ...prev,
      courseStudyMode: studyMode,
      courseTypes: Object.keys(prev.courseTypes).reduce((acc, level) => {
        acc[level as LevelKey] = {
          ...prev.courseTypes[level as LevelKey],
          studyMode
        };
        return acc;
      }, {} as Record<LevelKey, CourseTypeConfig>)
    }));
  };

  const updateCourseType = (type: LevelKey, updater: (current: CourseTypeConfig) => CourseTypeConfig) => {
    setFormData((prev) => ({
      ...prev,
      courseTypes: {
        ...prev.courseTypes,
        [type]: updater(prev.courseTypes[type])
      }
    }));
  };

  const handleStudyModeChange = (type: LevelKey, studyMode: StudyMode) => {
    updateCourseType(type, (current) => ({
      ...current,
      studyMode,
      modules: studyMode === 'short-course' ? [] : current.modules,
      shortCourseFee: studyMode === 'short-course' ? current.shortCourseFee : 0,
      shortCourseHasExams: studyMode === 'short-course' ? current.shortCourseHasExams : true
    }));
  };

  const handleCourseExamBodyChange = (type: LevelKey, examBody: ExamBody) => {
    updateCourseType(type, (current) => {
      const semesterDuration = examBody === 'CDACC' ? 6 : 3;
      // Update all existing modules' semester durations
      const updatedModules = current.modules.map((module) => ({
        ...module,
        semesters: module.semesters.map((sem) => ({
          ...sem,
          durationMonths: semesterDuration
        }))
      }));
      return { ...current, examBody, modules: updatedModules };
    });
  };

  const handleModuleCountChange = (type: LevelKey, count: number) => {
    updateCourseType(type, (current) => {
      const currentModules = [...current.modules];
      const examBody = current.examBody;
      console.log('handleModuleCountChange:', type, 'current:', currentModules.length, 'target:', count, 'examBody:', examBody);

      if (count > currentModules.length) {
        for (let i = currentModules.length; i < count; i += 1) {
          console.log('Adding module', i + 1);
          currentModules.push(emptyModule(examBody));
        }
      } else if (count < currentModules.length) {
        console.log('Removing modules from', count);
        currentModules.splice(count);
      }

      return { ...current, modules: currentModules };
    });
  };

  const handleModuleSemesterCountChange = (type: LevelKey, moduleIndex: number, count: number) => {
    updateCourseType(type, (current) => {
      const modules = [...current.modules];
      const module = modules[moduleIndex];
      const currentSemesters = [...module.semesters];

      if (count > currentSemesters.length) {
        for (let i = currentSemesters.length; i < count; i += 1) {
          currentSemesters.push({ durationMonths: 3, fee: 0, practicalFee: 0, internalExams: 2, units: [] });
        }
      } else if (count < currentSemesters.length) {
        currentSemesters.splice(count);
      }

      modules[moduleIndex] = { ...module, semesters: currentSemesters };
      return { ...current, modules };
    });
  };



  const handleBulkMigrate = () => {
    const migrations: { from: LevelKey; to: LevelKey }[] = [
      { from: 'diploma', to: 'level6' },
      { from: 'certificate', to: 'level5' },
      { from: 'artisan', to: 'level4' }
    ];

    let migratedCount = 0;

    migrations.forEach(({ from, to }) => {
      const sourceConfig = formData.courseTypes[from];
      if (sourceConfig.enabled && sourceConfig.modules.length > 0) {
        // Copy structure to target level
        updateCourseType(to, (current) => ({
          ...current,
          enabled: true,
          minKcseGrade: sourceConfig.minKcseGrade,
          studyMode: sourceConfig.studyMode,
          modules: JSON.parse(JSON.stringify(sourceConfig.modules)),
          durationMonths: sourceConfig.durationMonths,
          shortCourseFee: sourceConfig.shortCourseFee,
          shortCoursePaymentType: sourceConfig.shortCoursePaymentType,
          shortCourseNumberOfMonths: sourceConfig.shortCourseNumberOfMonths,
          shortCourseMonthlyFees: [...sourceConfig.shortCourseMonthlyFees],
          shortCoursePracticalFee: sourceConfig.shortCoursePracticalFee,
          shortCourseHasExams: sourceConfig.shortCourseHasExams
        }));

        // Disable source level
        updateCourseType(from, (current) => ({
          ...current,
          enabled: false
        }));

        migratedCount++;
      }
    });

    if (migratedCount > 0) {
      setError(`Successfully migrated ${migratedCount} level(s) to Level 6/5/4 format. Source levels have been disabled.`);
    } else {
      setError('No enabled levels found to migrate. Enable diploma, certificate, or artisan first.');
    }
  };

  const handleSemesterFeeChange = (type: LevelKey, moduleIndex: number, semesterIndex: number, fee: number) => {
    updateCourseType(type, (current) => {
      const shouldAutofill = !(moduleIndex === 0 && semesterIndex === 0);

      return {
        ...current,
        modules: current.modules.map((module, modIdx) => {
          if (modIdx < moduleIndex) return module;

          if (modIdx === moduleIndex) {
            return {
              ...module,
              semesters: module.semesters.map((sem, semIdx) => {
                if (semIdx < semesterIndex) return sem;
                if (semIdx === semesterIndex) return { ...sem, fee };
                return shouldAutofill ? { ...sem, fee } : sem;
              })
            };
          }

          return {
            ...module,
            semesters: module.semesters.map((sem) => 
              shouldAutofill ? { ...sem, fee } : sem
            )
          };
        })
      };
    });
  };

  const handleSemesterPracticalFeeChange = (type: LevelKey, moduleIndex: number, semesterIndex: number, practicalFee: number) => {
    updateCourseType(type, (current) => ({
      ...current,
      modules: current.modules.map((module, modIdx) =>
        modIdx === moduleIndex
          ? {
            ...module,
            semesters: module.semesters.map((sem, semIdx) => (semIdx === semesterIndex ? { ...sem, practicalFee } : sem))
          }
          : module
      )
    }));
  };

  const handleSemesterInternalExamCountChange = (type: LevelKey, moduleIndex: number, semesterIndex: number, internalExams: number) => {
    updateCourseType(type, (current) => ({
      ...current,
      modules: current.modules.map((module, modIdx) =>
        modIdx === moduleIndex
          ? {
            ...module,
            semesters: module.semesters.map((sem, semIdx) => (semIdx === semesterIndex ? { ...sem, internalExams } : sem))
          }
          : module
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.courseName.trim()) {
      setError('Course name is required.');
      setSubmitting(false);
      return;
    }

    // Validate courseId for new courses
    if (!editingCourse && !formData.courseId.trim()) {
      setError('Course ID is required. Use format like KNEC-2801, CDACC-001, or JP-101');
      setSubmitting(false);
      return;
    }

    if (!formData.department.trim()) {
      setError('Department is required.');
      setSubmitting(false);
      return;
    }

    const enabledLevels = Object.entries(formData.courseTypes).filter(([_, config]) => config.enabled);
    if (enabledLevels.length === 0) {
      setError('Select at least one course type (Diploma, Certificate, or Artisan).');
      setSubmitting(false);
      return;
    }

    for (const [level, config] of enabledLevels) {
      if (!config.minKcseGrade.trim()) {
        setError(`${level}: Minimum KCSE grade is required.`);
        setSubmitting(false);
        return;
      }

      if (config.studyMode === 'short-course') {
        if (config.shortCoursePaymentType === 'one-time') {
          if (config.shortCourseFee <= 0) {
            setError(`${level}: Short course fee must be greater than 0.`);
            setSubmitting(false);
            return;
          }
        }
        if (config.shortCoursePaymentType === 'monthly') {
          if (config.shortCourseNumberOfMonths <= 0) {
            setError(`${level}: Number of months must be at least 1.`);
            setSubmitting(false);
            return;
          }
          if (!config.shortCourseMonthlyFees || config.shortCourseMonthlyFees.length !== config.shortCourseNumberOfMonths) {
            setError(`${level}: Please enter fee for each month.`);
            setSubmitting(false);
            return;
          }
          if (config.shortCourseMonthlyFees.some((fee) => fee <= 0)) {
            setError(`${level}: All monthly fees must be greater than 0.`);
            setSubmitting(false);
            return;
          }
        }
        continue;
      }

      if (config.modules.length === 0) {
        setError(`${level}: Add at least one module.`);
        setSubmitting(false);
        return;
      }

      for (let moduleIndex = 0; moduleIndex < config.modules.length; moduleIndex++) {
        const module = config.modules[moduleIndex];
        for (let semesterIndex = 0; semesterIndex < module.semesters.length; semesterIndex++) {
          const semester = module.semesters[semesterIndex];
          if (semester.fee <= 0) {
            setError(`${level}: Module ${moduleIndex + 1}, Semester ${semesterIndex + 1} fee must be greater than 0.`);
            setSubmitting(false);
            return;
          }
        }
      }
    }

    try {
      // Find or create department
      let departmentId;
      const { data: existingDept, error: deptLookupError } = await supabase
        .from('departments')
        .select('id')
        .ilike('name', formData.department.trim())
        .single();

      if (deptLookupError && deptLookupError.code !== 'PGRST116') {
        console.error('Department lookup error:', deptLookupError);
        setError(`Failed to lookup department: ${deptLookupError.message}`);
        setSubmitting(false);
        return;
      }

      if (existingDept) {
        departmentId = existingDept.id;
        console.log('Found existing department:', formData.department, 'with ID:', departmentId);
      } else {
        console.log('Creating new department:', formData.department);
        const { data: newDept, error: deptError } = await supabase
          .from('departments')
          .insert([{ name: formData.department.trim() }])
          .select()
          .single();

        if (deptError) {
          console.error('Department creation error:', deptError);
          setError(`Failed to save department: ${deptError.message}`);
          setSubmitting(false);
          return;
        }
        departmentId = newDept.id;
        console.log('Created department with ID:', departmentId);
      }

      if (!departmentId) {
        setError('Failed to get valid department ID');
        setSubmitting(false);
        return;
      }

      // Save to relational tables
      let courseId;
      if (editingCourse) {
        console.log('Updating existing course:', editingCourse);
        // Update existing course
        const { error: updateError, data: courseData } = await supabase.from('courses').update([
          {
            name: formData.courseName,
            department_id: departmentId
          }
        ]).eq('id', editingCourse).select().single();

        if (updateError) {
          console.error('Course update error:', updateError);
          setError(`Failed to update course: ${updateError.message}`);
          setSubmitting(false);
          return;
        }
        courseId = courseData.id;
        console.log('Updated course with ID:', courseId);
      } else {
        console.log('Creating new course:', formData.courseName, 'with ID:', formData.courseId);
        // Insert new course with manual course ID
        const { error: insertError, data: courseData } = await supabase.from('courses').insert([
          {
            id: formData.courseId,
            name: formData.courseName,
            department_id: departmentId
          }
        ]).select().single();

        if (insertError) {
          console.error('Course insert error:', insertError);
          setError(`Failed to save course: ${insertError.message}`);
          setSubmitting(false);
          return;
        }
        courseId = courseData.id;
        console.log('Created course with ID:', courseId);
      }

      if (!courseId || courseId === '') {
        console.error('courseId is empty after save:', courseId);
        setError('Course ID is empty after save. Please try again.');
        setSubmitting(false);
        return;
      }

      // Get existing IDs if editing
      const existingIds = (window as any).existingCourseIds || {};
      console.log('existingIds from window:', JSON.stringify(existingIds, null, 2));
      console.log('editingCourse:', editingCourse);
      console.log('courseId after save:', courseId);
      console.log('formData.courseTypes:', formData.courseTypes);

      // If editing but no existing IDs found, load them
      if (editingCourse && (!existingIds.courseId || Object.keys(existingIds.courseTypes || {}).length === 0)) {
        console.log('No existing IDs found, loading them now...');
        const { data: courseTypesData } = await supabase
          .from('course_types')
          .select('*')
          .eq('course_id', courseId);

        existingIds.courseTypes = {};
        existingIds.modules = {};
        existingIds.semesters = {};
        existingIds.units = {};

        for (const ct of courseTypesData || []) {
          if (!ct.id || ct.id === '') {
            console.error('Invalid course type ID from database:', ct);
            continue;
          }
          existingIds.courseTypes[ct.level] = ct.id;
          console.log('Loaded course type:', ct.level, 'with ID:', ct.id);
          const { data: modulesData } = await supabase
            .from('modules')
            .select('*')
            .eq('course_type_id', ct.id);
          const moduleIds: any = {};
          const semesterIds: any = {};
          for (const m of modulesData || []) {
            if (!m.id || m.id === '') {
              console.error('Invalid module ID from database:', m);
              continue;
            }
            moduleIds[m.module_index] = m.id;
            console.log('Loaded module:', m.module_index, 'with ID:', m.id);
            const { data: semestersData } = await supabase
              .from('semesters')
              .select('*')
              .eq('module_id', m.id);
            for (const s of semestersData || []) {
              if (!s.id || s.id === '') {
                console.error('Invalid semester ID from database:', s);
                continue;
              }
              semesterIds[`${m.module_index}_${s.semester_index}`] = s.id;
            }
          }
          existingIds.modules[ct.level] = moduleIds;
          existingIds.semesters[ct.level] = semesterIds;
        }
        existingIds.courseId = courseId;
        console.log('Loaded existing IDs:', existingIds);
      }

      // Delete disabled course types when editing
      if (editingCourse) {
        console.log('Processing disabled course types for deletion...');
        for (const [level, config] of Object.entries(formData.courseTypes)) {
          console.log('Checking level:', level, 'enabled:', config.enabled, 'has existing ID:', !!existingIds.courseTypes?.[level]);
          if (!config.enabled && existingIds.courseTypes?.[level]) {
            const courseTypeIdToDelete = existingIds.courseTypes[level];
            console.log('Deleting disabled course type:', level, 'ID:', courseTypeIdToDelete);

            if (!courseTypeIdToDelete || courseTypeIdToDelete === '') {
              console.error('Invalid course type ID for deletion:', courseTypeIdToDelete);
              continue;
            }

            // Delete related data manually to handle foreign key constraints
            // Delete short_course_config
            console.log('Deleting short_course_config for course_type_id:', courseTypeIdToDelete);
            await supabase
              .from('short_course_config')
              .delete()
              .eq('course_type_id', courseTypeIdToDelete);

            // Delete units for this course type
            const { data: modules } = await supabase
              .from('modules')
              .select('id')
              .eq('course_type_id', courseTypeIdToDelete);
            
            if (modules && modules.length > 0) {
              const moduleIds = modules.map((m: any) => m.id);
              // Delete semesters
              await supabase
                .from('semesters')
                .delete()
                .in('module_id', moduleIds);
              
              // Delete modules
              await supabase
                .from('modules')
                .delete()
                .eq('course_type_id', existingIds.courseTypes[level]);
            }
            
            // Delete course_type
            const { error: deleteError } = await supabase
              .from('course_types')
              .delete()
              .eq('id', existingIds.courseTypes[level]);
            
            if (deleteError) {
              console.error('Error deleting course type:', deleteError);
              setError(`Warning: Could not delete ${level} due to existing references: ${deleteError.message}`);
            } else {
              console.log('Successfully deleted course type:', level);
            }
          }
        }
      }

      // Save course types, modules, semesters to relational tables
      for (const [level, config] of Object.entries(formData.courseTypes)) {
        if (!config.enabled) continue;

        const durationMonths = config.studyMode === 'module' && config.modules.length > 0
          ? config.modules.length * 9
          : config.studyMode === 'short-course' ? config.shortCourseNumberOfMonths : 0;

        let courseTypeId;
        console.log('Saving course type:', level, 'for course:', courseId);

        // Check if course type already exists
        const { data: existingCourseType, error: checkError } = await supabase
          .from('course_types')
          .select('id')
          .eq('course_id', courseId)
          .eq('level', level)
          .maybeSingle();

        console.log('Course type check result:', { level, existingCourseType, checkError });

        let courseTypeData, courseTypeError;
        if (existingCourseType) {
          // Update existing
          const result = await supabase.from('course_types').update({
            enabled: true,
            min_kcse_grade: config.minKcseGrade,
            study_mode: config.studyMode,
            duration_months: durationMonths
          }).eq('id', existingCourseType.id).select().single();
          courseTypeData = result.data;
          courseTypeError = result.error;
        } else {
          // Insert new
          const result = await supabase.from('course_types').insert([{
            course_id: courseId,
            level,
            enabled: true,
            min_kcse_grade: config.minKcseGrade,
            study_mode: config.studyMode,
            duration_months: durationMonths
          }]).select().single();
          courseTypeData = result.data;
          courseTypeError = result.error;
        }

        if (courseTypeError) {
          console.error('Course type save error:', courseTypeError);
          setError(`Failed to save course type: ${courseTypeError.message}`);
          setSubmitting(false);
          return;
        }
        courseTypeId = courseTypeData.id;
        console.log('Saved course type with ID:', courseTypeId);

        if (!courseTypeId) {
          setError('Failed to get valid course type ID');
          setSubmitting(false);
          return;
        }

        if (config.studyMode === 'module') {
          // Handle modules and semesters
          console.log('Saving modules for course type:', courseTypeId, 'total modules:', config.modules.length);
          for (let moduleIndex = 0; moduleIndex < config.modules.length; moduleIndex++) {
            const module = config.modules[moduleIndex];
            let moduleId;

            const examBody = config.examBody || 'internal';
            console.log('Saving module with exam_body:', examBody, 'courseTypeId:', courseTypeId);

            if (!courseTypeId || courseTypeId === '') {
              console.error('courseTypeId is empty when trying to save module');
              setError('Course type ID is missing. Please try again.');
              setSubmitting(false);
              return;
            }

            // Check if module already exists
            const { data: existingModule } = await supabase
              .from('modules')
              .select('id')
              .eq('course_type_id', courseTypeId)
              .eq('module_index', moduleIndex + 1)
              .maybeSingle();

            let moduleData, moduleError;
            if (existingModule) {
              // Update existing
              const result = await supabase.from('modules').update({
                exam_body: examBody
              }).eq('id', existingModule.id).select().single();
              moduleData = result.data;
              moduleError = result.error;
            } else {
              // Insert new
              const result = await supabase.from('modules').insert([{
                course_type_id: courseTypeId,
                module_index: moduleIndex + 1,
                exam_body: examBody
              }]).select().single();
              moduleData = result.data;
              moduleError = result.error;
            }

            if (moduleError) {
              console.error('Module save error:', moduleError);
              console.error('Module save details:', { courseTypeId, moduleIndex: moduleIndex + 1, examBody });
              setError(`Failed to save module: ${moduleError.message}`);
              setSubmitting(false);
              return;
            }
            moduleId = moduleData.id;
            console.log('Saved module', moduleIndex + 1, 'with ID:', moduleId, 'semesters in module:', module.semesters.length);

            if (!moduleId) {
              setError('Failed to get valid module ID');
              setSubmitting(false);
              return;
            }

            for (let semesterIndex = 0; semesterIndex < module.semesters.length; semesterIndex++) {
              const semester = module.semesters[semesterIndex];
              let semesterId;

              console.log('Saving semester with module_id:', moduleId, 'semester_index:', semesterIndex + 1);

              // Check if semester already exists
              const { data: existingSemester } = await supabase
                .from('semesters')
                .select('id')
                .eq('module_id', moduleId)
                .eq('semester_index', semesterIndex + 1)
                .maybeSingle();

              let semesterData, semesterError;
              if (existingSemester) {
                // Update existing
                const result = await supabase.from('semesters').update({
                  duration_months: semester.durationMonths,
                  fee: semester.fee,
                  practical_fee: semester.practicalFee,
                  internal_exams: semester.internalExams
                }).eq('id', existingSemester.id).select().single();
                semesterData = result.data;
                semesterError = result.error;
              } else {
                // Insert new
                const result = await supabase.from('semesters').insert([{
                  module_id: moduleId,
                  semester_index: semesterIndex + 1,
                  duration_months: semester.durationMonths,
                  fee: semester.fee,
                  practical_fee: semester.practicalFee,
                  internal_exams: semester.internalExams
                }]).select().single();
                semesterData = result.data;
                semesterError = result.error;
              }

              if (semesterError) {
                console.error('Semester save error:', semesterError);
                setError(`Failed to save semester: ${semesterError.message}`);
                setSubmitting(false);
                return;
              }
              semesterId = semesterData.id;
              console.log('Saved semester', semesterIndex + 1, 'with ID:', semesterId, 'fee:', semester.fee);

              if (!semesterId) {
                setError('Failed to get valid semester ID');
                setSubmitting(false);
                return;
              }

              // Save units
              if (semester.units && semester.units.length > 0) {
                console.log('Saving', semester.units.length, 'units for semester:', semesterId, 'courseId:', courseId);
                if (!courseId || courseId === '') {
                  console.error('courseId is empty when trying to save units');
                  setError('Course ID is missing when saving units. Please try again.');
                  setSubmitting(false);
                  return;
                }
                for (const unitName of semester.units) {
                  // Generate unit code from paper code (e.g., "201" from "201- TYPEWRITING")
                  const unitCode = unitName.split('-')[0].trim();
                  const existingUnitCode = existingIds.units?.[level]?.[`${moduleIndex}_${semesterIndex}_${unitName}`];

                  if (editingCourse && existingUnitCode) {
                    // Update existing unit
                    const { error: unitError } = await supabase.from('units').update([{
                      name: unitName,
                      module_index: moduleIndex,
                      semester_index: semesterIndex
                    }]).eq('course_id', courseId).eq('unit_code', existingUnitCode);

                    if (unitError) {
                      console.error('Unit update error:', unitError);
                      setError(`Failed to update unit: ${unitError.message}`);
                      setSubmitting(false);
                      return;
                    }
                    console.log('Updated unit:', unitName);
                  } else {
                    // Insert new unit with unit_code
                    const { error: unitError } = await supabase.from('units').insert([{
                      course_id: courseId,
                      unit_code: unitCode,
                      name: unitName,
                      module_index: moduleIndex,
                      semester_index: semesterIndex
                    }]);
                    if (unitError) {
                      console.error('Unit insert error:', unitError);
                      setError(`Failed to save unit: ${unitError.message}`);
                      setSubmitting(false);
                      return;
                    }
                    console.log('Inserted unit:', unitName);
                  }
                }
              }
            }
          }
        } else if (config.studyMode === 'short-course') {
          // Calculate total fee from monthly fees if monthly payment type
          const totalFee = config.shortCoursePaymentType === 'monthly'
            ? (config.shortCourseMonthlyFees?.reduce((sum, fee) => sum + fee, 0) || 0)
            : config.shortCourseFee;

          console.log('Saving short course for course:', courseId, 'courseTypeId:', courseTypeId, 'with total fee:', totalFee);

          if (!courseTypeId || courseTypeId === '') {
            console.error('courseTypeId is empty when trying to save short course');
            setError('Course type ID is missing for short course. Please try again.');
            setSubmitting(false);
            return;
          }

          // Check if short_course_config exists
          const { data: existingConfig } = await supabase
            .from('short_course_config')
            .select('id')
            .eq('course_type_id', courseTypeId)
            .maybeSingle();

          if (existingConfig) {
            console.log('Updating existing short course config:', existingConfig.id);
            // Update existing short course config
            const { error: shortCourseError } = await supabase.from('short_course_config').update({
              fee: totalFee,
              payment_type: config.shortCoursePaymentType,
              number_of_months: config.shortCoursePaymentType === 'monthly' ? config.shortCourseNumberOfMonths : 0,
              monthly_fees: config.shortCoursePaymentType === 'monthly' ? config.shortCourseMonthlyFees : null,
              practical_fee: config.shortCoursePracticalFee,
              has_exams: config.shortCourseHasExams
            }).eq('id', existingConfig.id);

            if (shortCourseError) {
              console.error('Short course update error:', shortCourseError);
              setError(`Failed to update short course: ${shortCourseError.message}`);
              setSubmitting(false);
              return;
            }
            console.log('Updated short course successfully');
          } else {
            console.log('Creating new short course config');
            // Insert new short course config
            const { error: shortCourseError } = await supabase.from('short_course_config').insert([{
              course_type_id: courseTypeId,
              fee: totalFee,
              payment_type: config.shortCoursePaymentType,
              number_of_months: config.shortCoursePaymentType === 'monthly' ? config.shortCourseNumberOfMonths : 0,
              monthly_fees: config.shortCoursePaymentType === 'monthly' ? config.shortCourseMonthlyFees : null,
              practical_fee: config.shortCoursePracticalFee,
              has_exams: config.shortCourseHasExams
            }]);

            if (shortCourseError) {
              console.error('Short course config insert error:', shortCourseError);
              setError(`Failed to save short course config: ${shortCourseError.message}`);
              setSubmitting(false);
              return;
            }
            console.log('Created short course config successfully');
          }

        }
      }

      await loadCourses();
      setFormData(getInitialFormData());
      console.log('Course saved successfully:', courseId);
      setError('Course added successfully!');
    } catch (err) {
      console.error('Course save error:', err);
      setError('Failed to add course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPeriodLabel = (studyMode: StudyMode): string => {
    switch (studyMode) {
      case 'module':
        return 'Modules';
      case 'short-course':
        return 'Month';
      default:
        return 'Period';
    }
  };

  const getCampusName = (campusCode: string) => {
    switch (campusCode) {
      case 'main':
        return 'Main Campus';
      case 'west':
        return 'West Campus';
      default:
        return 'Unknown Campus';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full">
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="relative w-12 h-12">
                <Image src="/logo.webp" alt="EAVI Logo" fill className="object-contain" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Course Management</h1>
                <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
              </div>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
              <div className="flex border-b border-white/20 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!editingCourse) {
                      // Starting fresh - reset all wizard and form state
                      resetWizard();
                      setFormData(getInitialFormData());
                    }
                    setViewMode('add');
                    setEditingCourse(null);
                  }}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${viewMode === 'add' ? 'border-purple-500 text-white' : 'border-transparent text-purple-300 hover:text-white'}`}
                >
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${viewMode === 'list' ? 'border-purple-500 text-white' : 'border-transparent text-purple-300 hover:text-white'}`}
                >
                  View All Courses
                </button>
              </div>

            {error && (
              <div
                className={`mb-6 p-4 rounded-lg ${error.includes('successfully') ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
                  }`}
              >
                <p className={`text-sm ${error.includes('successfully') ? 'text-green-200' : 'text-red-200'}`}>{error}</p>
              </div>
            )}

            {viewMode === 'list' ? (
              <div className="space-y-6">
                {/* Stats Bar */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-purple-200 text-sm">
                      <span className="font-bold text-white">{stats.total}</span> courses matched
                    </div>
                    <div className="h-4 w-px bg-white/20"></div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="text-blue-300">Diploma: {stats.diploma}</span>
                      <span className="text-green-300">Certificate: {stats.certificate}</span>
                      <span className="text-amber-300">Artisan: {stats.artisan}</span>
                      <span className="text-purple-300">Higher Diploma: {stats.level6}</span>
                      <span className="text-pink-300">Short Course: {stats.shortCourse}</span>
                    </div>
                    <div className="h-4 w-px bg-white/20"></div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="text-blue-400 font-medium">KNEC: {stats.knec}</span>
                      <span className="text-green-400 font-medium">CDACC: {stats.cdacc}</span>
                      <span className="text-purple-400 font-medium">JP: {stats.jp}</span>
                      <span className="text-pink-400 font-medium">Short: {stats.install}</span>
                    </div>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Search by course name, ID, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'diploma', label: 'Diploma' },
                        { value: 'certificate', label: 'Certificate' },
                        { value: 'artisan', label: 'Artisan' },
                        { value: 'level6', label: 'Higher Diploma' },
                        { value: 'short-course', label: 'Short Course' },
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setLevelFilter(filter.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            levelFilter === filter.value
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                              : 'bg-white/10 text-purple-200 hover:bg-white/20 hover:text-white border border-white/20'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exam Body Filter */}
                  <div className="flex items-center gap-3">
                    <span className="text-purple-300 text-sm">Exam Body:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: 'All Courses', color: 'gray' },
                        { value: 'KNEC', label: 'KNEC', color: 'blue' },
                        { value: 'CDACC', label: 'CDACC', color: 'green' },
                        { value: 'JP', label: 'JP', color: 'purple' },
                        { value: 'INSTALL', label: 'Short/Install', color: 'pink' },
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setExamBodyFilter(filter.value as any)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            examBodyFilter === filter.value
                              ? filter.value === 'all'
                                ? 'bg-gray-600 text-white shadow-lg'
                                : filter.value === 'KNEC'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : filter.value === 'CDACC'
                                ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                                : filter.value === 'JP'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                              : 'bg-white/10 text-purple-200 hover:bg-white/20 hover:text-white border border-white/20'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-purple-200">No courses found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => {
                      const isExpanded = expandedUnits[course.id];
                      const isKNEC = course.id.startsWith('KNEC-');
                      const courseUnits = course.units || [];
                      const displayUnits = isExpanded ? courseUnits : courseUnits.slice(0, 3);
                      const colors = getLevelBadgeColor(course.course_types?.[0]?.level || 'diploma');

                      // Group units by module for KNEC courses
                      const unitsByModule = isKNEC
                        ? courseUnits.reduce((acc: any, u: any) => {
                            const modIdx = u.module_index || 1;
                            if (!acc[modIdx]) acc[modIdx] = [];
                            acc[modIdx].push(u);
                            return acc;
                          }, {})
                        : {};

                      return (
                        <div key={course.id} className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-colors">
                          {/* Course Header */}
                          <div className="mb-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-mono text-xs text-purple-300 bg-white/5 px-2 py-1 rounded">{course.id}</span>
                              <div className="flex gap-1 flex-wrap">
                                {/* Show only the first enabled level (primary) instead of all levels */}
                                {(() => {
                                  const enabledTypes = course.course_types?.filter((ct: any) => ct?.enabled) || [];
                                  const primaryType = enabledTypes[0];
                                  if (!primaryType) return null;
                                  return (
                                    <span
                                      key={primaryType.id || primaryType.level}
                                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${getLevelBadgeColor(primaryType.level).bg} ${getLevelBadgeColor(primaryType.level).text} ${getLevelBadgeColor(primaryType.level).border}`}
                                    >
                                      {getLevelLabel(primaryType.level)}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                            <h3 className="font-bold text-lg text-white mb-1">{course.name}</h3>
                            <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">{course.departments?.name || 'Unknown'}</span>
                          </div>

                          {/* Units */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-purple-200 font-medium">
                                Units ({courseUnits.length}){isKNEC && ' - Module Based'}
                              </span>
                              {courseUnits.length > 3 && (
                                <button
                                  onClick={() => toggleUnits(course.id)}
                                  className="text-xs text-purple-300 hover:text-white transition-colors"
                                >
                                  {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </div>
                            {courseUnits.length > 0 ? (
                              isKNEC && isExpanded ? (
                                // KNEC expanded view: show grouped by module
                                <div className="space-y-2">
                                  {Object.entries(unitsByModule).sort((a, b) => Number(a[0]) - Number(b[0])).map(([modIdx, units]: [string, any]) => (
                                    <div key={modIdx} className="bg-white/5 rounded p-2">
                                      <span className="text-xs font-semibold text-purple-300 block mb-1">Module {modIdx}</span>
                                      <div className="flex flex-wrap gap-1">
                                        {(units as any[]).map((u: any, i: number) => (
                                          <span
                                            key={i}
                                            className="inline-block bg-white/10 border border-white/20 text-purple-100 text-xs px-2 py-1 rounded-sm"
                                          >
                                            {u.unit_code ? `${u.unit_code} - ` : ''}{u.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                // Standard view: flat list
                                <div className="flex flex-wrap gap-1.5">
                                  {displayUnits.map((u: any, i: number) => (
                                    <span
                                      key={i}
                                      className="inline-block bg-white/10 border border-white/20 text-purple-100 text-xs px-2 py-1 rounded-sm"
                                    >
                                      {u.unit_code ? `${u.unit_code} - ` : ''}{u.name}
                                    </span>
                                  ))}
                                  {!isExpanded && courseUnits.length > 3 && (
                                    <span className="inline-block bg-white/5 border border-white/10 text-purple-300 text-xs px-2 py-1 rounded-sm">
                                      +{courseUnits.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-white/40 italic">No units</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-3 border-t border-white/10">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Course Type Selection */}
                {!selectedCourseType && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-6">Select Course Type</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { type: 'KNEC', label: 'KNEC', color: 'from-blue-600 to-blue-700' },
                        { type: 'CDACC', label: 'CDACC', color: 'from-green-600 to-green-700' },
                        { type: 'JP', label: 'JP', color: 'from-purple-600 to-purple-700' },
                        { type: 'INSTALL', label: 'Install/Short', color: 'from-pink-600 to-pink-700' },
                      ].map((option) => (
                        <button
                          key={option.type}
                          onClick={() => handleCourseTypeSelect(option.type as any)}
                          className={`bg-gradient-to-r ${option.color} hover:opacity-90 text-white rounded-xl p-6 transition-all shadow-lg hover:shadow-xl`}
                        >
                          <div className="text-2xl font-bold mb-2">{option.label}</div>
                          <div className="text-sm opacity-80">Click to add</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screen 1: Add Course */}
                {selectedCourseType && wizardStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">Add Course - {selectedCourseType}</h2>
                      <button
                        onClick={() => setSelectedCourseType(null)}
                        className="text-purple-300 hover:text-white text-sm"
                      >
                        ← Back to selection
                      </button>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 space-y-4">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Department *
                          {selectedCourseType && selectedCourseType !== 'INSTALL' && (
                            <span className="ml-2 text-xs text-purple-300 font-normal">({selectedCourseType} only)</span>
                          )}
                        </label>
                        <select
                          value={courseFormData.department_id}
                          onChange={(e) => setCourseFormData({ ...courseFormData, department_id: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="">Select Department</option>
                          {filteredDepartments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="text-gray-900">{dept.name}</option>
                          ))}
                        </select>
                        {filteredDepartments.length === 0 && (
                          <p className="text-yellow-300 text-xs mt-2">
                            No departments found for {selectedCourseType}. Please add a department first.
                          </p>
                        )}
                        
                        {/* Add New Department Toggle */}
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setShowAddDepartment(!showAddDepartment)}
                            className="text-sm text-purple-300 hover:text-white flex items-center gap-2"
                          >
                            <span>{showAddDepartment ? '−' : '+'}</span>
                            {showAddDepartment ? 'Cancel' : `Add New ${selectedCourseType === 'INSTALL' ? '' : selectedCourseType + ' '}Department`}
                          </button>
                          
                          {showAddDepartment && (
                            <div className="mt-3 space-y-3 bg-black/20 rounded-lg p-4">
                              <div>
                                <label className="text-purple-200 text-xs mb-1 block">Department Name</label>
                                <input
                                  type="text"
                                  value={newDepartment.name}
                                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                                  placeholder="e.g., Electrical Engineering"
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="text-purple-200 text-xs mb-1 block">Department Code</label>
                                <input
                                  type="text"
                                  value={newDepartment.code}
                                  onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value.toUpperCase() })}
                                  placeholder="e.g., EE"
                                  maxLength={5}
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleAddDepartment}
                                disabled={!newDepartment.name.trim() || !newDepartment.code.trim() || submitting}
                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors"
                              >
                                {submitting ? 'Saving...' : 'Save Department'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Department Toggle */}
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteDepartment(!showDeleteDepartment);
                              setShowAddDepartment(false); // Close add form if open
                            }}
                            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
                          >
                            <span>{showDeleteDepartment ? '−' : '×'}</span>
                            {showDeleteDepartment ? 'Cancel' : 'Delete Department'}
                          </button>

                          {showDeleteDepartment && (
                            <div className="mt-3 space-y-3 bg-black/20 rounded-lg p-4 border border-red-500/30">
                              <div>
                                <label className="text-red-200 text-xs mb-1 block">Select Department to Delete</label>
                                <select
                                  value={departmentToDelete}
                                  onChange={(e) => setDepartmentToDelete(e.target.value)}
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                  <option value="">Select a department...</option>
                                  {filteredDepartments.map((dept) => (
                                    <option key={dept.id} value={dept.id} className="text-gray-900">{dept.name} ({dept.code})</option>
                                  ))}
                                </select>
                                {filteredDepartments.length === 0 && (
                                  <p className="text-yellow-300 text-xs mt-2">No departments available to delete.</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={handleDeleteDepartment}
                                disabled={!departmentToDelete || submitting}
                                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors"
                              >
                                {submitting ? 'Deleting...' : 'Delete Department'}
                              </button>
                              <p className="text-red-300/60 text-xs">
                                Note: Cannot delete departments that are currently used by courses.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">Qualification Level *</label>
                        <select
                          value={courseFormData.qualification_level_id}
                          onChange={(e) => {
                            const newFormData = { ...courseFormData, qualification_level_id: e.target.value };
                            // Auto-set duration for CDACC based on level
                            if (selectedCourseType === 'CDACC' && e.target.value) {
                              const selectedLevel = qualificationLevels.find(l => l.id === e.target.value);
                              const levelName = selectedLevel?.name?.toLowerCase() || '';
                              const levelDurationMap: Record<string, number> = {
                                'level 3': 6,
                                'level 4': 12,
                                'level 5': 24,
                                'level 6': 36,
                              };
                              if (levelDurationMap[levelName]) {
                                newFormData.total_duration_months = levelDurationMap[levelName];
                              }
                            }
                            setCourseFormData(newFormData);
                          }}
                          className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="">Select Qualification Level</option>
                          {qualificationLevels
                            .filter((level) => {
                              // STRICT filtering: If level has exam_body set, ONLY show matching course type
                              if (level.exam_body && level.exam_body !== '') {
                                return level.exam_body === selectedCourseType;
                              }
                              // If no exam_body is set, don't show for CDACC or JP (must be tagged)
                              // Only use name-based fallback for KNEC and INSTALL
                              const name = level.name?.toLowerCase() || '';
                              if (selectedCourseType === 'CDACC' || selectedCourseType === 'JP') {
                                // CDACC and JP levels MUST have exam_body set - don't show untagged levels
                                return false;
                              } else if (selectedCourseType === 'INSTALL') {
                                return name.includes('certificate');
                              } else if (selectedCourseType === 'KNEC') {
                                return !name.includes('level');
                              }
                              return true;
                            })
                            .map((level) => (
                            <option key={level.id} value={level.id} className="text-gray-900">{level.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          {selectedCourseType === 'KNEC' ? 'KNEC Code' : 
                           selectedCourseType === 'CDACC' ? 'CDACC Code' :
                           selectedCourseType === 'JP' ? 'JP Code' : 'Course Code'} *
                        </label>
                        <input
                          type="text"
                          value={courseFormData.knec_code}
                          onChange={(e) => setCourseFormData({ ...courseFormData, knec_code: e.target.value })}
                          placeholder={
                            selectedCourseType === 'KNEC' ? 'e.g., 2801, 1920' : 
                            selectedCourseType === 'CDACC' ? 'e.g., CD-001, CD-002' :
                            selectedCourseType === 'JP' ? 'e.g., JP-101, JP-102' : 
                            'e.g., SHORT-001'
                          }
                          className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">Course Name *</label>
                        <input
                          type="text"
                          value={courseFormData.course_name}
                          onChange={(e) => setCourseFormData({ ...courseFormData, course_name: e.target.value })}
                          placeholder="e.g., Computer Science"
                          className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">Minimum KCSE Grade *</label>
                        <select
                          value={courseFormData.min_kcse_grade}
                          onChange={(e) => setCourseFormData({ ...courseFormData, min_kcse_grade: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="">Select Grade</option>
                          {['ID/Birth Certificate', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'].map((grade) => (
                            <option key={grade} value={grade} className="text-gray-900">{grade}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-white font-medium">Is Modular?</label>
                        <button
                          type="button"
                          onClick={() => setCourseFormData({ ...courseFormData, is_modular: !courseFormData.is_modular })}
                          className={`w-16 h-8 rounded-full transition-colors ${courseFormData.is_modular ? 'bg-purple-600' : 'bg-gray-600'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full transition-transform ${courseFormData.is_modular ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-purple-300 text-sm">{courseFormData.is_modular ? 'YES - Multiple modules' : 'NO - Single module'}</span>
                      </div>

                      {/* CDACC Payment Mode */}
                      {selectedCourseType === 'CDACC' && courseFormData.is_modular && (
                        <div>
                          <label className="block text-white font-medium mb-2">Payment Mode *</label>
                          <select
                            value={courseFormData.cdacc_payment_mode}
                            onChange={(e) => setCourseFormData({ ...courseFormData, cdacc_payment_mode: e.target.value as 'per_semester' | 'once_per_stage' })}
                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="per_semester">Per Semester (with semester fees)</option>
                            <option value="once_per_stage">Once per Stage (no semesters)</option>
                          </select>
                        </div>
                      )}

                      {/* JP Exam Fee */}
                      {selectedCourseType === 'JP' && (
                        <div>
                          <label className="block text-white font-medium mb-2">JP Exam Fee (KES) *</label>
                          <input
                            type="number"
                            value={courseFormData.jp_exam_fee}
                            onChange={(e) => setCourseFormData({ ...courseFormData, jp_exam_fee: parseInt(e.target.value) || 0 })}
                            placeholder="e.g., 5000"
                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="0"
                          />
                        </div>
                      )}

                      {/* Total course duration */}
                      {selectedCourseType !== 'INSTALL' && (
                        <div>
                          <label className="block text-white font-medium mb-2">Total Course Duration (months) *</label>
                          <input
                            type="number"
                            value={courseFormData.total_duration_months}
                            onChange={(e) => setCourseFormData({ ...courseFormData, total_duration_months: parseInt(e.target.value) || 0 })}
                            placeholder="e.g., 18"
                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="3"
                            step="3"
                            required
                          />
                          <p className="text-purple-300 text-xs mt-2">
                            Total duration for the entire course (sum of all modules)
                          </p>
                        </div>
                      )}

                      {/* Fee fields only for INSTALL/Short courses */}
                      {selectedCourseType === 'INSTALL' && (
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5 space-y-4 mt-4">
                          <h5 className="text-white font-semibold">Fee Structure</h5>
                          
                          <div>
                            <label className="text-purple-200 text-sm mb-1 block">Payment Mode</label>
                            <select
                              value={courseFormData.payment_mode}
                              onChange={(e) => setCourseFormData({ ...courseFormData, payment_mode: e.target.value as 'Once' | 'Monthly' | 'Per Semester' })}
                              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="Once">Once (Full Payment)</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Per Semester">Per Semester</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-purple-200 text-sm mb-1 block">First Installment (KES)</label>
                              <input
                                type="number"
                                value={courseFormData.first_installment || ''}
                                onChange={(e) => setCourseFormData({ ...courseFormData, first_installment: parseInt(e.target.value) || 0 })}
                                placeholder="e.g., 5000"
                                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label className="text-purple-200 text-sm mb-1 block">Subsequent Installment (KES)</label>
                              <input
                                type="number"
                                value={courseFormData.subsequent_installment || ''}
                                onChange={(e) => setCourseFormData({ ...courseFormData, subsequent_installment: parseInt(e.target.value) || 0 })}
                                placeholder="e.g., 3000"
                                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-purple-200 text-sm mb-1 block">Practical Fee (KES)</label>
                            <input
                              type="number"
                              value={courseFormData.practical_fee || ''}
                              onChange={(e) => setCourseFormData({ ...courseFormData, practical_fee: parseInt(e.target.value) || 0 })}
                              placeholder="e.g., 2000"
                              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            <label className="text-white text-sm font-medium">Has Units</label>
                            <button
                              type="button"
                              onClick={() => setCourseFormData({ ...courseFormData, has_units: !courseFormData.has_units })}
                              className={`w-12 h-6 rounded-full transition-colors ${courseFormData.has_units ? 'bg-purple-600' : 'bg-gray-600'}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${courseFormData.has_units ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-purple-300 text-xs">{courseFormData.has_units ? 'YES' : 'NO'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          resetWizard();
                          setSelectedCourseType(null);
                        }}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={selectedCourseType === 'INSTALL' ? handleSaveCourse : goToStep2}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {selectedCourseType === 'INSTALL' ? 'Save Short Course' : 'Continue →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Screen 2: Add Modules */}
                {selectedCourseType && wizardStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Add {selectedCourseType === 'CDACC' ? 'Stages' : 'Modules'}</h2>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 space-y-4">
                      {modulesData.map((module, moduleIndex) => {
                        const isKNEC = selectedCourseType === 'KNEC';
                        const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                        const semesterCount = isCdaccOncePerStage ? 0 : (courseFormData.is_modular ? 3 : Math.ceil(module.duration_months / 3));
                        const additionalFeeOptions = ['Practical Fee', 'Admission Fee', 'Lab Fee', 'Library Fee', 'Registration Fee'];
                        return (
                          <div key={moduleIndex} className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-white font-semibold text-lg">
                                {module.label || (courseFormData.is_modular ? `${selectedCourseType === 'CDACC' ? 'Stage' : 'Module'} ${moduleIndex + 1}` : 'Single Module')}
                              </h5>
                              <span className="text-purple-300 text-xs bg-purple-900/50 px-2 py-1 rounded">
                                {module.duration_months} months · {semesterCount > 0 ? `${semesterCount} semesters` : 'no semesters'}
                              </span>
                            </div>
                            <div className={isKNEC || isCdaccOncePerStage ? 'grid grid-cols-2 gap-3 mb-4' : 'mb-4'}>
                              <div>
                                <label className="text-purple-200 text-sm mb-1 block">Duration (months)</label>
                                <input
                                  type="number"
                                  value={module.duration_months}
                                  onChange={(e) => handleModuleDurationChange(moduleIndex, parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  min="3"
                                  step="3"
                                  required
                                />
                              </div>
                              {isKNEC && (
                                <div>
                                  <label className="text-purple-200 text-sm mb-1 block">Exam Fee (KES)</label>
                                  <input
                                    type="number"
                                    value={module.exam_fee || ''}
                                    onChange={(e) => {
                                      const updated = [...modulesData];
                                      updated[moduleIndex].exam_fee = parseInt(e.target.value) || 0;
                                      setModulesData(updated);
                                    }}
                                    placeholder="e.g., 5000"
                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                              )}
                              {isCdaccOncePerStage && (
                                <div>
                                  <label className="text-purple-200 text-sm mb-1 block">Stage Fee (KES)</label>
                                  <input
                                    type="number"
                                    value={module.fee || ''}
                                    onChange={(e) => {
                                      const updated = [...modulesData];
                                      updated[moduleIndex].fee = parseInt(e.target.value) || 0;
                                      setModulesData(updated);
                                    }}
                                    placeholder="e.g., 45000"
                                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Industrial Attachment Stage - CDACC only */}
                            {selectedCourseType === 'CDACC' && (
                              <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-500/20 mb-4">
                                <div className="flex items-center gap-3">
                                  <label className="text-white text-sm font-medium">Industrial Attachment Stage (no units)</label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...modulesData];
                                      updated[moduleIndex].is_attachment_stage = !updated[moduleIndex].is_attachment_stage;
                                      setModulesData(updated);
                                    }}
                                    className={`w-12 h-6 rounded-full transition-colors ${module.is_attachment_stage ? 'bg-orange-600' : 'bg-gray-600'}`}
                                  >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${module.is_attachment_stage ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                                  <span className="text-orange-300 text-xs">{module.is_attachment_stage ? 'YES - No units' : 'NO - Has units'}</span>
                                </div>
                              </div>
                            )}

                            {/* Attachment break - KNEC only */}
                            {isKNEC && (
                              <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20 mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <label className="text-white text-sm font-medium">Industrial Attachment</label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...modulesData];
                                      updated[moduleIndex].has_attachment = !updated[moduleIndex].has_attachment;
                                      if (updated[moduleIndex].has_attachment && !updated[moduleIndex].attachment_after_semester) {
                                        updated[moduleIndex].attachment_after_semester = semesterCount;
                                      }
                                      setModulesData(updated);
                                    }}
                                    className={`w-12 h-6 rounded-full transition-colors ${module.has_attachment ? 'bg-blue-600' : 'bg-gray-600'}`}
                                  >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${module.has_attachment ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                                  <span className="text-blue-300 text-xs">{module.has_attachment ? 'Yes' : 'No'}</span>
                                </div>
                                {module.has_attachment && (
                                  <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div>
                                      <label className="text-blue-200 text-xs mb-1 block">After Semester</label>
                                      <select
                                        value={module.attachment_after_semester || semesterCount}
                                        onChange={(e) => {
                                          const updated = [...modulesData];
                                          updated[moduleIndex].attachment_after_semester = parseInt(e.target.value);
                                          setModulesData(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-white/10 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        {Array.from({ length: semesterCount }, (_, i) => (
                                          <option key={i} value={i + 1}>Semester {i + 1}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-blue-200 text-xs mb-1 block">Duration (months)</label>
                                      <input
                                        type="number"
                                        value={module.attachment_duration_months || 3}
                                        onChange={(e) => {
                                          const updated = [...modulesData];
                                          updated[moduleIndex].attachment_duration_months = parseInt(e.target.value) || 3;
                                          setModulesData(updated);
                                        }}
                                        min="1"
                                        max="12"
                                        className="w-full px-3 py-2 bg-white/10 border border-blue-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Semester Fees & Details */}
                            {!isCdaccOncePerStage && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                  <h6 className="text-white font-medium text-sm">Semester Fees & Details</h6>
                                  {isKNEC && (
                                    <span className="text-xs text-purple-300 bg-purple-600/20 px-2 py-1 rounded">
                                      Tip: M1-S1 is separate. Enter fee in any other semester to auto-fill the rest.
                                    </span>
                                  )}
                                </div>
                                {Array.from({ length: semesterCount }, (_, semIndex) => {
                                const semesterData = module.semesters?.[semIndex];
                                const additionalFees = semesterData?.additional_fees || [];
                                // For KNEC: check if this is Module 1, Semester 1 (special) or other (auto-fill applies)
                                const isFirstSemester = moduleIndex === 0 && semIndex === 0;
                                const isKNECAutoFill = isKNEC && !isFirstSemester;
                                return (
                                  <div key={semIndex} className="bg-black/30 rounded-lg p-4 space-y-3 border border-white/5">
                                    <div className="flex items-center justify-between">
                                      <p className="text-white font-medium text-sm">Semester {semIndex + 1}</p>
                                      {isKNEC && isFirstSemester && (
                                        <span className="text-xs text-blue-300 bg-blue-600/20 px-2 py-0.5 rounded">Admission Fee + Tuition</span>
                                      )}
                                      {isKNECAutoFill && semesterData?.fee > 0 && (
                                        <span className="text-xs text-green-300 bg-green-600/20 px-2 py-0.5 rounded">Auto-fills others</span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-purple-200 text-xs uppercase mb-1 block">
                                          Tuition Fee (KES)
                                          {isKNECAutoFill && <span className="text-purple-300/60 ml-1">(edits all)</span>}
                                        </label>
                                        <input
                                          type="number"
                                          value={semesterData?.fee || ''}
                                          onChange={(e) => {
                                            const newFee = parseInt(e.target.value) || 0;
                                            const updated = [...modulesData];

                                            // Ensure all modules have semesters array initialized
                                            updated.forEach((mod, idx) => {
                                              if (!mod.semesters || mod.semesters.length !== semesterCount) {
                                                mod.semesters = Array.from({ length: semesterCount }, (_, i) => ({
                                                  semester_index: i + 1,
                                                  fee: 0,
                                                  internal_exams: 2,
                                                  additional_fees: isKNEC ? [] : undefined,
                                                  practical_fee: !isKNEC ? 0 : undefined,
                                                }));
                                              }
                                            });

                                            // Set fee for current semester
                                            updated[moduleIndex].semesters[semIndex] = {
                                              ...updated[moduleIndex].semesters[semIndex],
                                              semester_index: semIndex + 1,
                                              fee: newFee,
                                            };

                                            // KNEC: Auto-fill fee to all subsequent semesters in ALL modules
                                            if (isKNEC && !isFirstSemester) {
                                              // Fill remaining semesters in current module
                                              for (let s = semIndex + 1; s < semesterCount; s++) {
                                                updated[moduleIndex].semesters[s] = {
                                                  ...updated[moduleIndex].semesters[s],
                                                  semester_index: s + 1,
                                                  fee: newFee,
                                                };
                                              }
                                              // Fill all semesters in subsequent modules
                                              for (let m = moduleIndex + 1; m < updated.length; m++) {
                                                for (let s = 0; s < semesterCount; s++) {
                                                  updated[m].semesters[s] = {
                                                    ...updated[m].semesters[s],
                                                    semester_index: s + 1,
                                                    fee: newFee,
                                                  };
                                                }
                                              }
                                            }

                                            setModulesData(updated);
                                          }}
                                          placeholder={isFirstSemester && isKNEC ? "e.g., 18000 (with admission)" : "e.g., 15000"}
                                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                      </div>
                                      {!isKNEC ? (
                                        <div>
                                          <label className="text-purple-200 text-xs uppercase mb-1 block">Practical Fee (KES)</label>
                                          <input
                                            type="number"
                                            value={semesterData?.practical_fee || ''}
                                            onChange={(e) => {
                                              const updated = [...modulesData];
                                              if (!updated[moduleIndex].semesters || updated[moduleIndex].semesters.length !== semesterCount) {
                                                updated[moduleIndex].semesters = Array.from({ length: semesterCount }, (_, i) => ({
                                                  semester_index: i + 1,
                                                  fee: 0,
                                                  practical_fee: 0,
                                                  internal_exams: 2,
                                                }));
                                              }
                                              updated[moduleIndex].semesters[semIndex] = {
                                                ...updated[moduleIndex].semesters[semIndex],
                                                semester_index: semIndex + 1,
                                                practical_fee: parseInt(e.target.value) || 0,
                                              };
                                              setModulesData(updated);
                                            }}
                                            placeholder="e.g., 5000"
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          />
                                        </div>
                                      ) : (
                                        <div>
                                          <label className="text-purple-200 text-xs uppercase mb-1 block">Internal Exams</label>
                                          <input
                                            type="number"
                                            value={semesterData?.internal_exams || 2}
                                            onChange={(e) => {
                                              const updated = [...modulesData];
                                              if (!updated[moduleIndex].semesters || updated[moduleIndex].semesters.length !== semesterCount) {
                                                updated[moduleIndex].semesters = Array.from({ length: semesterCount }, (_, i) => ({
                                                  semester_index: i + 1,
                                                  fee: 0,
                                                  internal_exams: 2,
                                                  additional_fees: [],
                                                }));
                                              }
                                              updated[moduleIndex].semesters[semIndex] = {
                                                ...updated[moduleIndex].semesters[semIndex],
                                                semester_index: semIndex + 1,
                                                internal_exams: parseInt(e.target.value) || 2,
                                              };
                                              setModulesData(updated);
                                            }}
                                            min="1"
                                            max="5"
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {/* Additional Fees - KNEC only */}
                                    {isKNEC && (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <p className="text-purple-200 text-xs uppercase font-medium">Additional Fees</p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...modulesData];
                                              if (!updated[moduleIndex].semesters[semIndex].additional_fees) {
                                                updated[moduleIndex].semesters[semIndex].additional_fees = [];
                                              }
                                              updated[moduleIndex].semesters[semIndex].additional_fees.push({
                                                fee_name: '',
                                                amount: 0,
                                              });
                                              setModulesData(updated);
                                            }}
                                            className="text-purple-400 hover:text-white text-xs"
                                          >
                                            + Add Fee
                                          </button>
                                        </div>
                                        {additionalFees.map((af: { fee_name: string; amount: number }, afIndex: number) => (
                                          <div key={afIndex} className="flex gap-2 items-center">
                                            <select
                                              value={additionalFeeOptions.includes(af.fee_name) ? af.fee_name : '__custom__'}
                                              onChange={(e) => {
                                                const updated = [...modulesData];
                                                if (e.target.value === '__custom__') {
                                                  updated[moduleIndex].semesters[semIndex].additional_fees[afIndex] = {
                                                    ...updated[moduleIndex].semesters[semIndex].additional_fees[afIndex],
                                                    fee_name: '',
                                                  };
                                                } else {
                                                  updated[moduleIndex].semesters[semIndex].additional_fees[afIndex] = {
                                                    ...updated[moduleIndex].semesters[semIndex].additional_fees[afIndex],
                                                    fee_name: e.target.value,
                                                  };
                                                }
                                                setModulesData(updated);
                                              }}
                                              className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                              <option value="">Select fee type</option>
                                              {additionalFeeOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                              <option value="__custom__">Custom...</option>
                                            </select>
                                            {!additionalFeeOptions.includes(af.fee_name) && (
                                              <input
                                                type="text"
                                                value={af.fee_name}
                                                onChange={(e) => {
                                                  const updated = [...modulesData];
                                                  updated[moduleIndex].semesters[semIndex].additional_fees[afIndex] = {
                                                    ...updated[moduleIndex].semesters[semIndex].additional_fees[afIndex],
                                                    fee_name: e.target.value,
                                                  };
                                                  setModulesData(updated);
                                                }}
                                                placeholder="Fee name"
                                                className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                              />
                                            )}
                                            <input
                                              type="number"
                                              value={af.amount || ''}
                                              onChange={(e) => {
                                                const updated = [...modulesData];
                                                updated[moduleIndex].semesters[semIndex].additional_fees[afIndex] = {
                                                  ...updated[moduleIndex].semesters[semIndex].additional_fees[afIndex],
                                                  amount: parseInt(e.target.value) || 0,
                                                };
                                                setModulesData(updated);
                                              }}
                                              placeholder="Amount"
                                              className="w-28 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = [...modulesData];
                                                updated[moduleIndex].semesters[semIndex].additional_fees.splice(afIndex, 1);
                                                setModulesData(updated);
                                              }}
                                              className="text-red-400 hover:text-red-300 text-sm px-1"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            )}
                          </div>
                        );
                      })}

                      {courseFormData.is_modular && (
                        <button
                          type="button"
                          onClick={handleAddModule}
                          className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white transition-colors"
                        >
                          + Add {selectedCourseType === 'CDACC' ? 'Stage' : 'Module'}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setWizardStep(1)}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={goToStep3}
                        className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}

                {/* Screen 3: Assign Units */}
                {selectedCourseType && wizardStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Assign Units</h2>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                      {/* Unit Assignment Mode Toggle - for JP and CDACC per_semester */}
                      {(selectedCourseType === 'JP' || (selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'per_semester')) && (
                        <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">
                              Unit Assignment Mode:
                            </span>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs ${courseFormData.unit_assignment_mode === 'per_semester' ? 'text-purple-300' : 'text-gray-400'}`}>
                                Per Semester
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newMode = courseFormData.unit_assignment_mode === 'module_level' ? 'per_semester' : 'module_level';
                                  setCourseFormData({ ...courseFormData, unit_assignment_mode: newMode });
                                  // Reset selected semester when switching to module level
                                  if (newMode === 'module_level') {
                                    setSelectedSemester(0);
                                  }
                                }}
                                className={`w-12 h-6 rounded-full transition-colors relative ${
                                  courseFormData.unit_assignment_mode === 'module_level' ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                                  courseFormData.unit_assignment_mode === 'module_level' ? 'left-7' : 'left-1'
                                }`} />
                              </button>
                              <span className={`text-xs ${courseFormData.unit_assignment_mode === 'module_level' ? 'text-purple-300' : 'text-gray-400'}`}>
                                {selectedCourseType === 'CDACC' ? 'Stage Level' : 'Module Level'}
                              </span>
                            </div>
                          </div>
                          <p className="text-purple-300/60 text-xs mt-2">
                            {courseFormData.unit_assignment_mode === 'module_level'
                              ? `Units will be shared across all semesters in this ${selectedCourseType === 'CDACC' ? 'stage' : 'module'}`
                              : 'Different units can be assigned to each semester'}
                          </p>
                        </div>
                      )}

                      {/* Module/Stage Tabs */}
                      <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                        {modulesData.map((module, index) => {
                          // Skip Industrial Attachment stages for CDACC
                          if (module.is_attachment_stage) return null;
                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedModule(index)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedModule === index
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white/10 text-purple-300 hover:bg-white/20'
                              }`}
                            >
                              {selectedCourseType === 'CDACC' ? `Stage ${index + 1}` : `Module ${index + 1}`}
                            </button>
                          );
                        })}
                      </div>

                      {/* Semester Tabs - show based on assignment mode */}
                      {/* Always show for: CDACC once_per_stage (no tabs), KNEC (module level) */}
                      {/* Conditionally show for: JP and CDACC per_semester based on unit_assignment_mode */}
                      {(() => {
                        const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                        const isModuleLevel = courseFormData.unit_assignment_mode === 'module_level';
                        const showSemesterTabs = !isCdaccOncePerStage && !isModuleLevel;
                        return showSemesterTabs ? (
                          <div className="flex gap-2 mb-4">
                            {Array.from({ length: modulesData[selectedModule]?.semesters?.length || Math.ceil(modulesData[selectedModule]?.duration_months / 3) || 2 }).map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedSemester(index)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  selectedSemester === index
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-purple-300 hover:bg-white/20'
                                }`}
                              >
                                Sem {index + 1}
                              </button>
                            ))}
                          </div>
                        ) : null;
                      })()
                      }

                      {/* Info badge for module-level unit assignment */}
                      {(selectedCourseType === 'KNEC' || courseFormData.unit_assignment_mode === 'module_level') && (
                        <div className="mb-4">
                          <span className="text-xs text-purple-300 bg-purple-600/20 px-3 py-1.5 rounded">
                            {selectedCourseType === 'KNEC'
                              ? 'KNEC: Units added here will appear in all semesters of this module'
                              : `Units added here will be shared across all semesters in this ${selectedCourseType === 'CDACC' ? 'stage' : 'module'}`
                            }
                          </span>
                        </div>
                      )}

                      {/* Units List */}
                      <div className="space-y-2 mb-4">
                        {(() => {
                          const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                          const isKNEC = selectedCourseType === 'KNEC';
                          const isModuleLevel = courseFormData.unit_assignment_mode === 'module_level';
                          // For module-level: use first semester index (0) as the canonical storage
                          const effectiveSemester = isModuleLevel ? 0 : selectedSemester;
                          const key = isCdaccOncePerStage ? `${selectedModule}_stage` : `${selectedModule}_${effectiveSemester}`;
                          const semesterUnits = unitsData[key] || [];
                          // For KNEC or module-level mode, show ALL units from the module regardless of which semester they were added to
                          const allModuleUnits = (isKNEC || isModuleLevel)
                            ? Array.from(new Set([
                                ...semesterUnits,
                                ...(unitsData[`${selectedModule}_0`] || []),
                                ...(unitsData[`${selectedModule}_1`] || []),
                                ...(unitsData[`${selectedModule}_2`] || []),
                                ...(unitsData[`${selectedModule}_3`] || [])
                              ].map(u => JSON.stringify(u)))).map(u => JSON.parse(u))
                            : semesterUnits;
                          return allModuleUnits.map((unit: any, index: number) => (
                            <div key={index} className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                              <div>
                                <div className="text-white font-medium">{unit.paper_code} - {unit.subject_name}</div>
                                <div className="text-purple-300 text-xs capitalize">{unit.unit_type}</div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Add Unit Form */}
                      <div className="bg-black/20 rounded-lg p-4 border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-white font-semibold">Add Unit</h5>
                          <button
                            type="button"
                            onClick={() => setBulkPasteMode(!bulkPasteMode)}
                            className="text-xs text-purple-300 hover:text-white underline"
                          >
                            {bulkPasteMode ? 'Switch to Single Entry' : 'Switch to Bulk Paste'}
                          </button>
                        </div>

                        {bulkPasteMode ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-purple-200 text-xs mb-1 block">
                                Paste Units (one per line, format: CODE - NAME)
                              </label>
                              <textarea
                                value={bulkPasteText}
                                onChange={(e) => setBulkPasteText(e.target.value)}
                                placeholder={`201 - TYPEWRITING
202 - BUSINESS ORGANISATION
203 - BOOK-KEEPING
204 - CLERICAL DUTIES`}
                                rows={6}
                                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                              />
                              <p className="text-purple-300/60 text-xs mt-1">
                                Each line: Paper Code - Subject Name (e.g., &quot;201 - TYPEWRITING&quot;)
                              </p>
                            </div>
                            <div>
                              <label className="text-purple-200 text-xs mb-1 block">Default Unit Type</label>
                              <select
                                id="bulkUnitType"
                                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="Core">Core</option>
                                <option value="Common">Common</option>
                                <option value="Basic">Basic</option>
                                <option value="Elective">Elective</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const unitType = (document.getElementById('bulkUnitType') as HTMLSelectElement)?.value || 'Core';
                                const lines = bulkPasteText.trim().split('\n').filter(line => line.trim());
                                const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                                const isModuleLevel = courseFormData.unit_assignment_mode === 'module_level';
                                // For module-level or once_per_stage: use semester 0 (shared)
                                // For per-semester: use selected semester
                                const semesterIndex = (isCdaccOncePerStage || isModuleLevel) ? 0 : selectedSemester;

                                lines.forEach(line => {
                                  // Parse format: "201 - TYPEWRITING" or "201 -TYPEWRITING" or "201 TYPEWRITING"
                                  const match = line.match(/^\s*(\S+)\s*[-\s]\s*(.+)$/);
                                  if (match) {
                                    const [, paperCode, subjectName] = match;
                                    handleAddUnit(selectedModule, semesterIndex, {
                                      paper_code: paperCode.trim(),
                                      subject_name: subjectName.trim(),
                                      unit_type: unitType
                                    });
                                  }
                                });
                                setBulkPasteText('');
                              }}
                              disabled={!bulkPasteText.trim()}
                              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              Add All Units
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-purple-200 text-xs mb-1 block">Paper Code</label>
                                <input
                                  type="text"
                                  id="paperCode"
                                  placeholder="e.g., 201"
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="text-purple-200 text-xs mb-1 block">Subject Name</label>
                                <input
                                  type="text"
                                  id="subjectName"
                                  placeholder="e.g., Typewriting"
                                  list="subjects"
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <datalist id="subjects">
                                  {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.name}>
                                      {subject.paper_code} - {subject.name}
                                    </option>
                                  ))}
                                </datalist>
                              </div>
                              <div>
                                <label className="text-purple-200 text-xs mb-1 block">Unit Type</label>
                                <select
                                  id="unitType"
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="Core">Core</option>
                                  <option value="Common">Common</option>
                                  <option value="Basic">Basic</option>
                                  <option value="Elective">Elective</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const paperCode = (document.getElementById('paperCode') as HTMLInputElement)?.value;
                                const subjectName = (document.getElementById('subjectName') as HTMLInputElement)?.value;
                                const unitType = (document.getElementById('unitType') as HTMLSelectElement)?.value;
                                if (paperCode && subjectName) {
                                  const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                                  const isModuleLevel = courseFormData.unit_assignment_mode === 'module_level';
                                  // For module-level or once_per_stage: use semester 0 (shared)
                                  // For per-semester: use selected semester
                                  const semesterIndex = (isCdaccOncePerStage || isModuleLevel) ? 0 : selectedSemester;
                                  handleAddUnit(selectedModule, semesterIndex, { paper_code: paperCode, subject_name: subjectName, unit_type: unitType });
                                  (document.getElementById('paperCode') as HTMLInputElement).value = '';
                                  (document.getElementById('subjectName') as HTMLInputElement).value = '';
                                }
                              }}
                              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              Add Unit
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setWizardStep(2)}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleFinishAndSave}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
                      >
                        {submitting ? 'Saving...' : 'Save & Finish'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
