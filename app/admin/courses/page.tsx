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
  const [newDepartment, setNewDepartment] = useState({ name: '', code: '' });

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
      const { data, error } = await supabase.from('departments').insert([{
        name: newDepartment.name.trim(),
        code: newDepartment.code.trim().toUpperCase(),
        is_active: true,
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

  const handleCourseTypeSelect = (type: 'KNEC' | 'CDACC' | 'JP' | 'INSTALL') => {
    setSelectedCourseType(type);
    setWizardStep(1);
  };

  const handleSaveCourse = async () => {
    // Save course and move to step 2
    setSubmitting(true);
    setError('');
    
    try {
      // Map selected course type to exam_body
      const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType;
      
      const { data, error } = await supabase.from('courses').insert([{
        id: courseFormData.knec_code,
        name: courseFormData.course_name,
        department_id: courseFormData.department_id,
        qualification_level_id: courseFormData.qualification_level_id,
        min_kcse_grade: courseFormData.min_kcse_grade,
        exam_body: examBody,
        fee_per_semester: 0, // Will be set per semester in modules
      }]).select().single();

      if (error) throw error;
      setSavedCourseId(data.id);
      
      // For short courses (INSTALL), save to short_courses table and skip modules
      if (selectedCourseType === 'INSTALL') {
        const { data: shortCourseData, error: shortCourseError } = await supabase.from('short_courses').insert([{
          course_id: data.id,
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
        
        const { data: courseTypeData, error: courseTypeError } = await supabase.from('course_types').insert([{
          course_id: data.id,
          level: mappedLevel,
          enabled: true,
          study_mode: studyMode,
          duration_months: courseFormData.total_duration_months || durationMonths,
          exam_fee: selectedCourseType === 'JP' ? (courseFormData.jp_exam_fee || 0) : 0,
        }]).select().single();
        
        if (courseTypeError) throw courseTypeError;
        setSavedCourseTypeId(courseTypeData.id);
        
        setWizardStep(2);
      }
      
      // Initialize modules based on total duration
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
    } catch (err: any) {
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

  const handleSaveModules = async () => {
    // Save modules and move to step 3
    setSubmitting(true);
    setError('');
    
    try {
      const examBody = selectedCourseType === 'INSTALL' ? 'internal' : selectedCourseType;

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
    const { error: unitError } = await supabase.from('units').insert([{
      course_id: savedCourseId,
      unit_code: unit.paper_code,
      name: unit.subject_name,
      module_index: moduleId + 1,
      semester_index: isCdaccOncePerStage ? 0 : semesterIndex + 1, // 0 for stage-level units
      unit_type: unit.unit_type || 'Core', // Default to Core if not specified
    }]);

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
    setNewDepartment({ name: '', code: '' });
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
    try {
      setEditingCourse(course.id);
      setError('');

      // Load course data from relational tables with IDs
      const { data: courseTypesData, error: courseTypesError } = await supabase
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
        `)
        .eq('course_id', course.id);

      if (courseTypesError) {
        console.error('Error loading course types:', courseTypesError);
        setError(`Failed to load course data: ${courseTypesError.message}`);
        return;
      }

    // Load units for this course with IDs
    const { data: unitsData } = await supabase
      .from('units')
      .select('*')
      .eq('course_id', course.id)
      .order('module_index, semester_index');

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
        shortCourseFee: ct.short_courses?.first_installment || 0,
        shortCoursePaymentType: ct.short_courses?.payment_mode || 'one-time',
        shortCourseNumberOfMonths: ct.short_courses?.duration_months || 0,
        shortCourseMonthlyFees: [],
        shortCoursePracticalFee: ct.short_courses?.practical_fee || 0,
        shortCourseHasExams: ct.short_courses?.has_exams ?? true
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
    } catch (err: any) {
      console.error('Error loading course for edit:', err);
      setError(`Failed to load course: ${err.message}`);
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
            // Delete short_courses
            await supabase
              .from('short_courses')
              .delete()
              .eq('course_id', existingIds.courseId);
            
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

          console.log('Saving short course for course:', existingIds.courseId, 'with total fee:', totalFee);

          // Check if short_courses exists
          const { data: existingConfig } = await supabase
            .from('short_courses')
            .select('id')
            .eq('course_id', existingIds.courseId)
            .single();

          if (existingConfig) {
            console.log('Updating existing short course:', existingConfig.id);
            // Update existing short course
            const { error: shortCourseError } = await supabase.from('short_courses').update([{
              first_installment: totalFee,
              payment_mode: config.shortCoursePaymentType,
              duration_months: config.shortCoursePaymentType === 'monthly' ? config.shortCourseNumberOfMonths : 0,
              practical_fee: config.shortCoursePracticalFee,
              has_exams: config.shortCourseHasExams
            }]).eq('id', existingConfig.id);

            if (shortCourseError) {
              console.error('Short course update error:', shortCourseError);
              setError(`Failed to update short course: ${shortCourseError.message}`);
              setSubmitting(false);
              return;
            }
            console.log('Updated short course successfully');
          } else {
            console.log('Creating new short course');
            // Insert new short course
            const { error: shortCourseError } = await supabase.from('short_courses').insert([{
              course_id: existingIds.courseId,
              first_installment: totalFee,
              payment_mode: config.shortCoursePaymentType,
              duration_months: config.shortCoursePaymentType === 'monthly' ? config.shortCourseNumberOfMonths : 0,
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
                        <label className="block text-white font-medium mb-2">Department *</label>
                        <select
                          value={courseFormData.department_id}
                          onChange={(e) => setCourseFormData({ ...courseFormData, department_id: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="text-gray-900">{dept.name}</option>
                          ))}
                        </select>
                        
                        {/* Add New Department Toggle */}
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setShowAddDepartment(!showAddDepartment)}
                            className="text-sm text-purple-300 hover:text-white flex items-center gap-2"
                          >
                            <span>{showAddDepartment ? '−' : '+'}</span>
                            {showAddDepartment ? 'Cancel' : 'Add New Department'}
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
                              const name = level.name?.toLowerCase() || '';
                              if (selectedCourseType === 'CDACC' || selectedCourseType === 'JP') {
                                return name.includes('level');
                              } else if (selectedCourseType === 'INSTALL') {
                                return name.includes('certificate');
                              } else {
                                return !name.includes('level');
                              }
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

                    <button
                      onClick={handleSaveCourse}
                      disabled={submitting}
                      className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : selectedCourseType === 'INSTALL' ? 'Save Short Course' : 'Save & Continue to Modules'}
                    </button>
                  </div>
                )}

                {/* Screen 2: Add Modules */}
                {selectedCourseType && wizardStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">Add {selectedCourseType === 'CDACC' ? 'Stages' : 'Modules'}</h2>
                      <button
                        onClick={() => setWizardStep(1)}
                        className="text-purple-300 hover:text-white text-sm"
                      >
                        ← Back to course details
                      </button>
                    </div>

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
                                <h6 className="text-white font-medium text-sm border-b border-white/10 pb-2">Semester Fees & Details</h6>
                                {Array.from({ length: semesterCount }, (_, semIndex) => {
                                const semesterData = module.semesters?.[semIndex];
                                const additionalFees = semesterData?.additional_fees || [];
                                return (
                                  <div key={semIndex} className="bg-black/30 rounded-lg p-4 space-y-3 border border-white/5">
                                    <p className="text-white font-medium text-sm">Semester {semIndex + 1}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-purple-200 text-xs uppercase mb-1 block">Tuition Fee (KES)</label>
                                        <input
                                          type="number"
                                          value={semesterData?.fee || ''}
                                          onChange={(e) => {
                                            const updated = [...modulesData];
                                            if (!updated[moduleIndex].semesters || updated[moduleIndex].semesters.length !== semesterCount) {
                                              updated[moduleIndex].semesters = Array.from({ length: semesterCount }, (_, i) => ({
                                                semester_index: i + 1,
                                                fee: 0,
                                                internal_exams: 2,
                                                additional_fees: isKNEC ? [] : undefined,
                                                practical_fee: !isKNEC ? 0 : undefined,
                                              }));
                                            }
                                            updated[moduleIndex].semesters[semIndex] = {
                                              ...updated[moduleIndex].semesters[semIndex],
                                              semester_index: semIndex + 1,
                                              fee: parseInt(e.target.value) || 0,
                                            };
                                            setModulesData(updated);
                                          }}
                                          placeholder="e.g., 15000"
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

                    <button
                      onClick={handleSaveModules}
                      disabled={submitting}
                      className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save & Continue to Units'}
                    </button>
                  </div>
                )}

                {/* Screen 3: Assign Units */}
                {selectedCourseType && wizardStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">Assign Units</h2>
                      <button
                        onClick={() => setWizardStep(2)}
                        className="text-purple-300 hover:text-white text-sm"
                      >
                        ← Back to modules
                      </button>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
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

                      {/* Semester Tabs - only show if not CDACC once_per_stage */}
                      {!(selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage') && (
                        <div className="flex gap-2 mb-4">
                          {Array.from({ length: Math.ceil(modulesData[selectedModule]?.duration_months / 3) || 2 }).map((_, index) => (
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
                      )}

                      {/* Units List */}
                      <div className="space-y-2 mb-4">
                        {(() => {
                          const isCdaccOncePerStage = selectedCourseType === 'CDACC' && courseFormData.cdacc_payment_mode === 'once_per_stage';
                          const key = isCdaccOncePerStage ? `${selectedModule}_stage` : `${selectedModule}_${selectedSemester}`;
                          return (unitsData[key] || []).map((unit: any, index: number) => (
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
                        <h5 className="text-white font-semibold">Add Unit</h5>
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
                              const semesterIndex = isCdaccOncePerStage ? 0 : selectedSemester;
                              handleAddUnit(selectedModule, semesterIndex, { paper_code: paperCode, subject_name: subjectName, unit_type: unitType });
                              (document.getElementById('paperCode') as HTMLInputElement).value = '';
                              (document.getElementById('subjectName') as HTMLInputElement).value = '';
                            }
                          }}
                          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          Add Unit
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        resetWizard();
                        setViewMode('list');
                        loadCourses();
                      }}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Finish & View Courses
                    </button>
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
