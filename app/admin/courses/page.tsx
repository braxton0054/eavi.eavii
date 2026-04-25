'use client';

import { useEffect, useState } from 'react';
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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.departments?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
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
            ),
            short_course_config (
              fee,
              payment_type,
              number_of_months,
              monthly_fees,
              practical_fee,
              has_exams
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
          const { data: unitsData, error: unitsError } = await supabase.from('units').select('*');
          if (!unitsError && unitsData) {
            coursesWithUnits = coursesWithUnits.map((course: any) => ({
              ...course,
              units: unitsData.filter((u: any) => u.course_id === course.id)
            }));
          }
        } catch (_err) {
          // Fallback if units fail
        }
        setCourses(coursesWithUnits);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const handleEditCourse = async (course: any) => {
    setEditingCourse(course.id);

    // Load course data from relational tables with IDs
    const { data: courseTypesData } = await supabase
      .from('course_types')
      .select(`
        id,
        course_id,
        level,
        enabled,
        min_kcse_grade,
        study_mode,
        duration_months,
        modules (
          id,
          module_index,
          semesters (
            id,
            semester_index,
            duration_months,
            fee,
            practical_fee,
            internal_exams
          )
        ),
        short_course_config (
          id,
          fee,
          payment_type,
          number_of_months,
          monthly_fees,
          practical_fee,
          has_exams
        )
      `)
      .eq('course_id', course.id);

    // Load units for this course with IDs
    const { data: unitsData } = await supabase
      .from('units')
      .select('*')
      .eq('course_id', course.id)
      .order('module_index, semester_index');

    // Store existing IDs for updates
    const existingIds: any = {
      courseTypes: {},
      modules: {},
      semesters: {},
      units: {}
    };

    // Store unit codes for updates (using unit_code instead of id)
    const unitCodes: any = {};
    for (const u of unitsData || []) {
      const level = courseTypesData?.find((ct: any) => ct.id === u.course_id)?.level;
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

    for (const ct of courseTypesData || []) {
      if (ct.enabled) {
        globalStudyMode = ct.study_mode as StudyMode;
        break;
      }
    }

    for (const ct of courseTypesData || []) {
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
        shortCourseFee: ct.short_course_config?.fee || 0,
        shortCoursePaymentType: ct.short_course_config?.payment_type || 'one-time',
        shortCourseNumberOfMonths: ct.short_course_config?.number_of_months || 0,
        shortCourseMonthlyFees: ct.short_course_config?.monthly_fees || [],
        shortCoursePracticalFee: ct.short_course_config?.practical_fee || 0,
        shortCourseHasExams: ct.short_course_config?.has_exams ?? true
      };
    }

    // Load department name from departments table
    const { data: departmentData } = await supabase
      .from('departments')
      .select('name')
      .eq('id', course.department_id)
      .single();

    setFormData({
      courseId: course.id,
      department: departmentData?.name || '',
      courseName: course.name,
      courseStudyMode: globalStudyMode,
      courseTypes
    });
    
    // Store existing IDs in a separate state for use during save
    (window as any).existingCourseIds = existingIds;
    
    setViewMode('add');
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

      // Get existing IDs if editing
      const existingIds = (window as any).existingCourseIds || {};
      console.log('existingIds:', existingIds);
      console.log('editingCourse:', editingCourse);
      console.log('formData.courseTypes:', formData.courseTypes);

      // Delete disabled course types when editing
      if (editingCourse) {
        for (const [level, config] of Object.entries(formData.courseTypes)) {
          console.log('Checking level:', level, 'enabled:', config.enabled, 'has existing ID:', !!existingIds.courseTypes[level]);
          if (!config.enabled && existingIds.courseTypes[level]) {
            console.log('Deleting disabled course type:', level, 'ID:', existingIds.courseTypes[level]);
            
            // Delete related data manually to handle foreign key constraints
            // Delete short_course_config
            await supabase
              .from('short_course_config')
              .delete()
              .eq('course_type_id', existingIds.courseTypes[level]);
            
            // Delete units (by semester_id)
            const { data: modules } = await supabase
              .from('modules')
              .select('id')
              .eq('course_type_id', existingIds.courseTypes[level]);
            
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

        const { data: courseTypeData, error: courseTypeError } = await supabase.from('course_types').upsert([{
          course_id: courseId,
          level,
          enabled: true,
          min_kcse_grade: config.minKcseGrade,
          study_mode: config.studyMode,
          duration_months: durationMonths
        }], { onConflict: 'course_id,level' }).select().single();

        if (courseTypeError) {
          console.error('Course type save error:', courseTypeError);
          setError(`Failed to save course type: ${courseTypeError.message}`);
          setSubmitting(false);
          return;
        }
        courseTypeId = courseTypeData.id;
        console.log('Saved course type with ID:', courseTypeId);

        if (config.studyMode === 'module') {
          // Handle modules and semesters
          console.log('Saving modules for course type:', courseTypeId, 'total modules:', config.modules.length);
          for (let moduleIndex = 0; moduleIndex < config.modules.length; moduleIndex++) {
            const module = config.modules[moduleIndex];
            let moduleId;

            const { data: moduleData, error: moduleError } = await supabase.from('modules').upsert([{
              course_type_id: courseTypeId,
              module_index: moduleIndex + 1,
              exam_body: config.examBody
            }], { onConflict: 'course_type_id,module_index' }).select().single();

            if (moduleError) {
              console.error('Module save error:', moduleError);
              setError(`Failed to save module: ${moduleError.message}`);
              setSubmitting(false);
              return;
            }
            moduleId = moduleData.id;
            console.log('Saved module', moduleIndex + 1, 'with ID:', moduleId, 'semesters in module:', module.semesters.length);

            for (let semesterIndex = 0; semesterIndex < module.semesters.length; semesterIndex++) {
              const semester = module.semesters[semesterIndex];
              let semesterId;

              const { data: semesterData, error: semesterError } = await supabase.from('semesters').upsert([{
                module_id: moduleId,
                semester_index: semesterIndex + 1,
                duration_months: semester.durationMonths,
                fee: semester.fee,
                practical_fee: semester.practicalFee,
                internal_exams: semester.internalExams
              }], { onConflict: 'module_id,semester_index' }).select().single();

              if (semesterError) {
                console.error('Semester save error:', semesterError);
                setError(`Failed to save semester: ${semesterError.message}`);
                setSubmitting(false);
                return;
              }
              semesterId = semesterData.id;
              console.log('Saved semester', semesterIndex + 1, 'with ID:', semesterId, 'fee:', semester.fee);

              // Save units
              if (semester.units && semester.units.length > 0) {
                console.log('Saving', semester.units.length, 'units for semester:', semesterId);
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

          console.log('Saving short course config for course type:', courseTypeId, 'with total fee:', totalFee);

          // Check if short_course_config exists
          const { data: existingConfig } = await supabase
            .from('short_course_config')
            .select('id')
            .eq('course_type_id', courseTypeId)
            .single();

          if (existingConfig) {
            console.log('Updating existing short course config:', existingConfig.id);
            // Update existing short course config
            const { error: shortCourseError } = await supabase.from('short_course_config').update([{
              fee: totalFee,
              payment_type: config.shortCoursePaymentType,
              number_of_months: config.shortCoursePaymentType === 'monthly' ? config.shortCourseNumberOfMonths : 0,
              monthly_fees: config.shortCoursePaymentType === 'monthly' ? config.shortCourseMonthlyFees : null,
              practical_fee: config.shortCoursePracticalFee,
              has_exams: config.shortCourseHasExams
            }]).eq('id', existingConfig.id);

            if (shortCourseError) {
              console.error('Short course config update error:', shortCourseError);
              setError(`Failed to update short course config: ${shortCourseError.message}`);
              setSubmitting(false);
              return;
            }
            console.log('Updated short course config successfully');
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
                  onClick={() => { setViewMode('add'); setEditingCourse(null); }}
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
                  </div>
                </div>

                {/* Search & Filter */}
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

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-purple-200">No courses found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => {
                      const isExpanded = expandedUnits[course.id];
                      const courseUnits = course.units || [];
                      const displayUnits = isExpanded ? courseUnits : courseUnits.slice(0, 3);
                      const colors = getLevelBadgeColor(course.course_types?.[0]?.level || 'diploma');
                      
                      return (
                        <div key={course.id} className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-colors">
                          {/* Course Header */}
                          <div className="mb-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-mono text-xs text-purple-300 bg-white/5 px-2 py-1 rounded">{course.id}</span>
                              <div className="flex gap-1 flex-wrap">
                                {course.course_types?.filter((ct: any) => ct?.enabled).map((ct: any) => (
                                  <span
                                    key={ct.id || ct.level}
                                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${getLevelBadgeColor(ct.level).bg} ${getLevelBadgeColor(ct.level).text} ${getLevelBadgeColor(ct.level).border}`}
                                  >
                                    {getLevelLabel(ct.level)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <h3 className="font-bold text-lg text-white mb-1">{course.name}</h3>
                            <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">{course.departments?.name || 'Unknown'}</span>
                          </div>

                          {/* Units */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-purple-200 font-medium">Units ({courseUnits.length})</span>
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
                              <div className="flex flex-wrap gap-1.5">
                                {displayUnits.map((u: any, i: number) => (
                                  <span
                                    key={i}
                                    className="inline-block bg-white/10 border border-white/20 text-purple-100 text-xs px-2 py-1 rounded-sm"
                                  >
                                    {u.name}
                                  </span>
                                ))}
                                {!isExpanded && courseUnits.length > 3 && (
                                  <span className="inline-block bg-white/5 border border-white/10 text-purple-300 text-xs px-2 py-1 rounded-sm">
                                    +{courseUnits.length - 3} more
                                  </span>
                                )}
                              </div>
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="courseId" className="block text-white font-medium mb-2 text-sm md:text-base">
                    Course ID {editingCourse ? '(Read-only)' : '*'} 
                    <span className="text-purple-300 text-xs ml-1">(e.g., KNEC-2801, CDACC-001, JP-101)</span>
                  </label>
                  <input
                    type="text"
                    id="courseId"
                    value={formData.courseId}
                    onChange={(e) => !editingCourse && setFormData((prev) => ({ ...prev, courseId: e.target.value }))}
                    readOnly={!!editingCourse}
                    placeholder="Enter course code (e.g., KNEC-2801)"
                    required
                    className={`w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base ${
                      editingCourse ? 'bg-white/5 text-white/70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-white font-medium mb-2 text-sm md:text-base">
                    Department *
                  </label>
                  <input
                    type="text"
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Computer Science, Business, Engineering"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                <div>
                  <label htmlFor="courseName" className="block text-white font-medium mb-2 text-sm md:text-base">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    value={formData.courseName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, courseName: e.target.value }))}
                    placeholder="e.g., Computer Science, Business Management"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-3 text-sm md:text-base">Course Type *</label>
                  <div className="flex bg-white/10 rounded-lg p-1 border border-white/20 w-fit">
                    {(['module', 'short-course'] as StudyMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleCourseStudyModeChange(mode)}
                        className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                          formData.courseStudyMode === mode 
                          ? 'bg-purple-600 text-white shadow-lg' 
                          : 'text-purple-300 hover:text-white'
                        }`}
                      >
                        {mode === 'module' ? 'Modular' : 'Short Course'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3 text-sm md:text-base">Course Levels *</label>
                  
                  <div className="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
                    <button
                      type="button"
                      onClick={handleBulkMigrate}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors"
                    >
                      Migrate All to Level 6/5/4 Format
                    </button>
                    <p className="text-purple-200 text-xs mt-2 text-center">
                      Migrates: Diploma → Level 6, Certificate → Level 5, Artisan → Level 4
                      <br />
                      Source levels will be automatically disabled after migration
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {(['diploma', 'certificate', 'artisan', 'level6', 'level5', 'level4'] as LevelKey[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleCourseTypeToggle(type)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                          formData.courseTypes[type].enabled
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-white/5 border-white/20 text-purple-300 hover:border-purple-500/50'
                        }`}
                      >
                        {type === 'level6' ? 'Level 6' : type === 'level5' ? 'Level 5' : type === 'level4' ? 'Level 4' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {(['diploma', 'certificate', 'artisan', 'level6', 'level5', 'level4'] as LevelKey[]).map((type) => {
                      const config = formData.courseTypes[type];
                      if (!config.enabled) return null;

                      return (
                        <div key={type} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                          <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <span className="font-semibold text-white uppercase tracking-wider text-sm">{type} Configuration</span>
                            <span className="text-[10px] bg-purple-600/30 text-purple-200 px-2 py-0.5 rounded-full uppercase">Enabled</span>
                          </div>
                          
                          <div className="p-4 space-y-4">
                              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                                <label className="block text-purple-200 text-sm mb-1 font-semibold">Exam Body *</label>
                                <select
                                  value={config.examBody}
                                  onChange={(e) => handleCourseExamBodyChange(type, e.target.value as ExamBody)}
                                  required
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                                >
                                  <option value="internal" className="text-gray-900">Internal</option>
                                  <option value="JP" className="text-gray-900">JP International Examinations</option>
                                  <option value="CDACC" className="text-gray-900">CDACC Examination Body</option>
                                  <option value="KNEC" className="text-gray-900">KNEC</option>
                                </select>
                                <p className="text-purple-300 text-xs mt-2 italic">
                                  {config.examBody === 'CDACC' 
                                    ? 'CDACC uses 6-month semesters.' 
                                    : 'JP, KNEC, and Internal use 3-month semesters.'}
                                </p>
                              </div>

                              <div>
                                <label className="block text-purple-200 text-sm mb-1">Minimum KCSE Grade *</label>
                                <select
                                  value={config.minKcseGrade}
                                  onChange={(e) => updateCourseType(type, (current) => ({ ...current, minKcseGrade: e.target.value }))}
                                  required
                                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                                >
                                  <option value="" className="text-gray-900">Select Grade</option>
                                  {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E', 'ID/Birth Cert', 'Open'].map((grade) => (
                                    <option key={grade} value={grade} className="text-gray-900 font-bold">{grade}</option>
                                  ))}
                                </select>
                              </div>

                              {config.studyMode !== 'short-course' ? (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-purple-200 text-sm mb-1">Number of Modules (Years) *</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="24"
                                      value={config.modules.length || ''}
                                      onChange={(e) => handleModuleCountChange(type, Number.parseInt(e.target.value, 10) || 0)}
                                      required
                                      className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                  </div>

                                  {config.modules.map((module, moduleIndex) => (
                                    <div key={moduleIndex} className="bg-black/20 rounded-lg p-4 border border-white/5">
                                      <h5 className="text-white font-semibold text-sm mb-3">Module {moduleIndex + 1}</h5>
                                      <div className="space-y-3">
                                        {module.semesters.map((semester, semesterIndex) => (
                                          <div key={semesterIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                              <label className="text-purple-200 text-[10px] uppercase">Sem {semesterIndex + 1} Fee</label>
                                              <input
                                                type="number"
                                                value={semester.fee || ''}
                                                onChange={(e) => handleSemesterFeeChange(type, moduleIndex, semesterIndex, Number.parseInt(e.target.value, 10) || 0)}
                                                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-purple-200 text-[10px] uppercase">Practical Fee</label>
                                              <input
                                                type="number"
                                                value={semester.practicalFee || ''}
                                                onChange={(e) => handleSemesterPracticalFeeChange(type, moduleIndex, semesterIndex, Number.parseInt(e.target.value, 10) || 0)}
                                                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-purple-200 text-[10px] uppercase">Internal Exams</label>
                                              <input
                                                type="number"
                                                value={semester.internalExams || 2}
                                                onChange={(e) => handleSemesterInternalExamCountChange(type, moduleIndex, semesterIndex, Number.parseInt(e.target.value, 10) || 0)}
                                                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                // ... short course config remains ...
                                <div><p className="text-white">Short course config interface...</p></div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingCourse ? 'Updating Course...' : 'Adding Course...') : editingCourse ? 'Update Course' : 'Add Course'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
