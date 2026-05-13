'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

// Types based on new schema
interface Class {
  id: string;
  class_name: string;
  course_id: string;
  campus: 'main' | 'west';
  semester: number;
  module_index: number;
  intake_month: string;
  course_name?: string;
  total_students?: number;
}

interface LecturerAssignment {
  id: string;
  class_id: string;
  course_id: string;
  campus: 'main' | 'west';
  classes?: Class;
}

interface SemesterAssignment {
  id: string;
  assignment_id: string;
  academic_calendar_id?: string;
  semester: number;
  module_index: number;
  exam_type_allowed: string[];
  is_active: boolean;
  term_name?: string;
  cat_opening_date?: string;
  cat_closing_date?: string;
  end_term_exam_date?: string;
}

interface Student {
  id: string;
  application_id: string;
  full_name: string;
  admission_number: string;
  current_semester: number;
  financial_hold: boolean;
  status: string;
}

interface Unit {
  unit_code: string;
  unit_name: string;
  unit_type: string;
  semester_index: number;
  module_index: number;
}

interface ExamMark {
  id?: string;
  application_id: string;
  unit_code: string;
  exam_type: string;
  cat_marks: number | null;
  end_term_marks: number | null;
  practical_marks: number | null;
  marks: number;
  grade?: string;
  points?: number;
  is_submitted: boolean;
  is_absent: boolean;
  lecturer_id?: string;
  intake?: string;
  semester?: number;
  module_index?: number;
}

export default function LecturerDashboard() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lecturerInfo, setLecturerInfo] = useState<any>(null);
  const [lecturerId, setLecturerId] = useState<string | null>(null);
  
  // View mode: 'dashboard' | 'marks' | 'setup' | 'submissions'
  const [viewMode, setViewMode] = useState<'dashboard' | 'marks' | 'setup' | 'submissions'>('dashboard');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Classes data - lecturer's workload
  const [lecturerClasses, setLecturerClasses] = useState<any[]>([]);
  const [lecturerAssignments, setLecturerAssignments] = useState<any[]>([]);
  
  // Setup form state for lecturer self-assignment
  const [courses, setCourses] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [courseUnits, setCourseUnits] = useState<any[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<any[]>([]);
  const [setupForm, setSetupForm] = useState({
    course_id: '',
    campus: '',
    selected_units: [] as string[]
  });
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  
  // Selected class for marks entry
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSemesterAssignment, setSelectedSemesterAssignment] = useState<SemesterAssignment | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<string>('');
  
  // Marks entry state - Updated for Part 3
  const [students, setStudents] = useState<Student[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [existingMarks, setExistingMarks] = useState<Map<string, ExamMark>>(new Map());
  const [selectedExamType, setSelectedExamType] = useState<string>('cat');
  const [marksData, setMarksData] = useState<Map<string, { 
    cat_marks: number | null; 
    end_term_marks: number | null;
    practical_marks: number | null;
    is_absent: boolean;
    is_submitted: boolean;
  }>>(new Map());
  
  // Submission tracking
  const [submissionStatus, setSubmissionStatus] = useState<Map<string, { submitted: number; total: number }>>(new Map());
  const [isSubmittingMarks, setIsSubmittingMarks] = useState(false);
  
  // Window status
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowMessage, setWindowMessage] = useState('');

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Check auth and load lecturer classes
  useEffect(() => {
    if (!supabase) return;
    checkAuthAndLoadClasses();
  }, [supabase]);

  const checkAuthAndLoadClasses = async () => {
    try {
      setLoading(true);
      
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login/lecturer');
        return;
      }

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.user_metadata?.role !== 'lecturer') {
        router.push('/login/lecturer');
        return;
      }

      setLecturerInfo(user.user_metadata);

      // Get lecturer UUID
      const { data: lecturerData } = await supabase
        .from('lecturers')
        .select('id')
        .eq('lecturer_number', user.user_metadata.lecturer_number || user.user_metadata.id)
        .single();

      if (!lecturerData) {
        setError('Lecturer profile not found');
        setLoading(false);
        return;
      }

      setLecturerId(lecturerData.id);

      // Auto-create ai_user_registry if missing (fixes RLS for dashboard)
      const { data: existingReg } = await supabase
        .from('ai_user_registry')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!existingReg) {
        await supabase.from('ai_user_registry').insert([{
          auth_user_id: user.id,
          email: user.email || lecturerData.email,
          user_role: 'lecturer',
          full_name: lecturerData.full_name || user.user_metadata?.full_name,
        }]);
      }
      
      // Load classes for this lecturer
      await loadLecturerClasses(lecturerData.id);
      
    } catch (err) {
      console.error('Auth error:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Load lecturer classes with full details
  const loadLecturerClasses = async (lecId: string) => {
    try {
      const { data, error } = await supabase
        .from('v_lecturer_assignments_full')
        .select('*')
        .eq('lecturer_id', lecId);

      if (error) {
        console.error('Error loading classes:', error);
        setLecturerClasses([]);
        return;
      }

      const transformed = await Promise.all((data || []).map(async (a: any) => {
        let classId = a.class_id;
        let className = a.class_name;

        if (!classId && a.course_id) {
          const { data: found } = await supabase
            .from('classes')
            .select('id,class_name,semester,module_index,intake_month,intake')
            .eq('course_id', a.course_id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          if (found?.length) {
            classId = found[0].id;
            className = found[0].class_name;
          }
        }

        return {
          assignment_id: a.assignment_id,
          class_id: classId || '',
          class_name: className || a.course_name,
          course_name: a.course_name,
          campus: a.campus,
          semester: a.semester || 1,
          module_index: a.module_index || 1,
          intake_month: a.intake || '',
          intake: a.intake || '',
          exam_type_allowed: ['cat', 'end_term', 'mock'],
          total_students: 0
        };
      }));

      for (const cls of transformed) {
        if (cls.class_id) {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'enrolled')
            .eq('class_id', cls.class_id);
          cls.total_students = count || 0;
        }
      }

      setLecturerClasses(transformed);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  // Setup functions for lecturer self-assignment
  const loadCoursesForSetup = async () => {
    const { data, error } = await supabase.from('courses').select('id, name, code').order('name');
    if (error) {
      console.error('Courses load error:', error);
      setError('Failed to load courses: ' + error.message);
      return;
    }
    setCourses(data || []);
  };

  const loadClassesForCourse = async (courseId: string) => {
    if (!courseId) {
      setAvailableClasses([]);
      return;
    }
    const { data } = await supabase
      .from('classes')
      .select('id, class_name, course_id, campus, semester, module_index, intake_month, is_active')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('class_name');
    setAvailableClasses(data || []);
  };

  const loadUnitsForCourse = async (courseId: string) => {
    if (!courseId) {
      setCourseUnits([]);
      return;
    }
    const { data } = await supabase
      .from('units')
      .select('unit_code, name, unit_type, semester_index, module_index')
      .eq('course_id', courseId)
      .order('module_index')
      .order('semester_index');
    setCourseUnits(data || []);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lecturerId || setupForm.selected_units.length === 0) {
      setError('Please select a course and at least one unit');
      return;
    }

    setCreatingAssignment(true);
    setError('');

    try {
      // Check if assignment already exists for this course
      const { data: existing } = await supabase
        .from('lecturer_assignments')
        .select('id')
        .eq('lecturer_id', lecturerId)
        .eq('course_id', setupForm.course_id)
        .maybeSingle();

      if (existing) {
        setError('You are already assigned to this course');
        setCreatingAssignment(false);
        return;
      }

      // Create lecturer assignment (without class_id — auto-matched)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('lecturer_assignments')
        .insert([{
          lecturer_id: lecturerId,
          course_id: setupForm.course_id,
          campus: setupForm.campus || 'main',
        }])
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Create unit assignments
      const unitAssignments = setupForm.selected_units.map(unitCode => ({
        assignment_id: assignmentData.id,
        course_id: setupForm.course_id,
        unit_code: unitCode
      }));

      const { error: unitsError } = await supabase
        .from('lecturer_assignment_units')
        .insert(unitAssignments);

      if (unitsError) throw unitsError;

      setSuccess('Assignment created successfully!');
      setSetupForm({ course_id: "", campus: "", selected_units: [] });
      setViewMode('dashboard');
      await loadLecturerClasses(lecturerId);
    } catch (err: any) {
      setError(`Failed to create assignment: ${err.message}`);
    } finally {
      setCreatingAssignment(false);
    }
  };

  const openSetup = async () => {
    await loadCoursesForSetup();
    setViewMode('setup');
    setSetupForm({ course_id: "", campus: "", selected_units: [] });
    setCourseUnits([]);
  };

  // Check exam window status
  const checkWindowStatus = (cls: any, examType: string) => {
    const today = new Date();
    
    if (examType === 'cat') {
      if (!cls.cat_opening_date || !cls.cat_closing_date) {
        return { open: false, message: 'CAT dates not configured' };
      }
      const openDate = new Date(cls.cat_opening_date);
      const closeDate = new Date(cls.cat_closing_date);
      
      if (today < openDate) {
        return { open: false, message: `CAT window opens ${openDate.toLocaleDateString()}` };
      }
      if (today > closeDate) {
        return { open: false, message: `CAT window closed on ${closeDate.toLocaleDateString()}` };
      }
      return { open: true, message: 'CAT window is OPEN' };
    }
    
    if (examType === 'end_term') {
      if (!cls.end_term_exam_date) {
        return { open: false, message: 'End term date not configured' };
      }
      const examDate = new Date(cls.end_term_exam_date);
      
      if (today < examDate) {
        return { open: false, message: `End term exam on ${examDate.toLocaleDateString()}` };
      }
      return { open: true, message: 'End term window is OPEN' };
    }
    
    return { open: true, message: '' };
  };

  // Navigate to marks entry
  const enterMarks = async (cls: any) => {
    setSelectedClass(cls);
    setSelectedIntake(cls.intake_month || '');
    
    // Find semester assignment
    const { data: semData } = await supabase
      .from('lecturer_assignment_semesters')
      .select('*')
      .eq('assignment_id', cls.assignment_id)
      .single();
    
    if (semData) {
      setSelectedSemesterAssignment(semData);
    }
    
    // Load students (by class_id or course_id fallback)
    await loadStudentsForClass(cls.class_id, cls.course_id);
    
    // Load units
    await loadUnitsForAssignment(cls.assignment_id);
    
    // Check window
    const status = checkWindowStatus(cls, selectedExamType);
    setIsWindowOpen(status.open);
    setWindowMessage(status.message);
    
    setViewMode('marks');
  };

  // Load students for class
  const loadStudentsForClass = async (classId: string, courseId?: string) => {
    let query = supabase
      .from('applications')
      .select('id, full_name, admission_number, current_semester, financial_hold, status')
      .eq('status', 'enrolled')
      .eq('financial_hold', false);

    if (classId) {
      query = query.eq('class_id', classId);
    } else if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query.order('full_name');

    if (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students');
      return;
    }

    const mappedStudents = data?.map((s: any) => ({
      id: s.id,
      application_id: s.id,
      full_name: s.full_name,
      admission_number: s.admission_number,
      current_semester: s.current_semester,
      financial_hold: s.financial_hold,
      status: s.status
    })) || [];

    setStudents(mappedStudents);
  };

  // Load units for assignment
  const loadUnitsForAssignment = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from('lecturer_assignment_units')
      .select(`
        unit_code,
        units (name, unit_type, semester_index, module_index)
      `)
      .eq('assignment_id', assignmentId);

    if (error) {
      console.error('Error loading units:', error);
      return;
    }

    const mappedUnits = data?.map((u: any) => ({
      unit_code: u.unit_code,
      unit_name: u.units?.name || u.unit_code,
      unit_type: u.units?.unit_type || 'Core',
      semester_index: u.units?.semester_index || 1,
      module_index: u.units?.module_index || 1
    })) || [];

    setUnits(mappedUnits);
    
    // Load existing marks
    await loadExistingMarks(selectedClass?.class_id, mappedUnits);
  };

  // Load existing marks
  const loadExistingMarks = async (classId: string, unitsList: Unit[]) => {
    if (!classId || !unitsList.length) return;
    
    const unitCodes = unitsList.map(u => u.unit_code);
    
    const { data } = await supabase
      .from('exam_marks')
      .select(`
        application_id, 
        unit_code, 
        exam_type, 
        cat_marks, 
        end_term_marks, 
        practical_marks,
        marks, 
        grade,
        is_submitted,
        is_absent,
        lecturer_id,
        intake
      `)
      .eq('class_id', classId)
      .in('unit_code', unitCodes)
      .eq('exam_type', selectedExamType);

    const marksMap = new Map();
    data?.forEach((m: any) => {
      const key = `${m.application_id}-${m.unit_code}`;
      marksMap.set(key, m);
    });
    
    setExistingMarks(marksMap);
    
    // Also load submission status
    await loadSubmissionStatus();
  };

  // Handle exam type change
  const handleExamTypeChange = (type: string) => {
    setSelectedExamType(type);
    if (selectedClass) {
      const status = checkWindowStatus(selectedClass, type);
      setIsWindowOpen(status.open);
      setWindowMessage(status.message);
    }
    // Reload marks for new exam type
    loadExistingMarks(selectedClass?.class_id, units);
  };

  // Handle mark input
  const handleMarkChange = (studentId: string, unitCode: string, field: 'cat_marks' | 'end_term_marks' | 'practical_marks', value: number) => {
    const key = `${studentId}-${unitCode}`;
    const current = marksData.get(key) || { 
      cat_marks: null, 
      end_term_marks: null, 
      practical_marks: null,
      is_absent: false,
      is_submitted: false
    };
    
    // Validate ranges
    if (field === 'cat_marks' && (value < 0 || value > 30)) return;
    if (field === 'end_term_marks' && (value < 0 || value > 70)) return;
    if (field === 'practical_marks' && (value < 0 || value > 30)) return;
    
    const updated = {
      ...current,
      [field]: value
    };
    
    setMarksData(new Map(marksData.set(key, updated)));
  };

  // Calculate total marks - Updated for Part 3 (includes practical for CDACC)
  const calculateTotal = (cat: number | null, endTerm: number | null, practical: number | null, isAbsent: boolean) => {
    if (isAbsent) return 0;
    const catVal = cat || 0;
    const endVal = endTerm || 0;
    const practicalVal = practical || 0;
    return catVal + endVal + practicalVal;
  };

  // Calculate grade based on total marks
  const calculateGrade = (total: number) => {
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 40) return 'D';
    return 'E';
  };

  // Determine pass/fail
  const isPass = (total: number) => total >= 40;

  // Save marks
  const saveMarks = async () => {
    if (!selectedClass || !selectedSemesterAssignment) return;
    
    setLoading(true);
    setError('');
    
    try {
      const marksToSave = [];
      
      for (const student of students) {
        for (const unit of units) {
          const key = `${student.application_id}-${unit.unit_code}`;
          const data = marksData.get(key);
          const existing = existingMarks.get(key);
          
          // Skip if no data and no existing mark
          if (!data && !existing) continue;
          
          // Skip if already submitted (can't edit submitted marks)
          if (existing?.is_submitted || data?.is_submitted) continue;
          
          const catMarks = data?.cat_marks ?? existing?.cat_marks ?? null;
          const endTermMarks = data?.end_term_marks ?? existing?.end_term_marks ?? null;
          const practicalMarks = data?.practical_marks ?? existing?.practical_marks ?? null;
          const isAbsent = data?.is_absent ?? existing?.is_absent ?? false;
          
          if (!isAbsent && catMarks === null && endTermMarks === null && selectedExamType === 'cat') continue;
          
          const totalMarks = calculateTotal(catMarks, endTermMarks, practicalMarks, isAbsent);
          const grade = isAbsent ? 'ABS' : calculateGrade(totalMarks);
          
          marksToSave.push({
            application_id: student.application_id,
            campus: selectedClass.campus,
            course_id: selectedClass.course_id,
            class_id: selectedClass.class_id,
            unit_code: unit.unit_code,
            semester: selectedClass.semester,
            exam_type: selectedExamType,
            cat_marks: catMarks,
            end_term_marks: endTermMarks,
            practical_marks: practicalMarks,
            marks: totalMarks,
            grade: grade,
            is_absent: isAbsent,
            is_submitted: false, // Not submitted yet, just saved as draft
            lecturer_id: lecturerId,
            intake: selectedIntake,
            semester_assignment_id: selectedSemesterAssignment.id
          });
        }
      }
      
      if (marksToSave.length === 0) {
        setError('No marks to save');
        setLoading(false);
        return;
      }
      
      // Upsert marks
      const { error: saveError } = await supabase
        .from('exam_marks')
        .upsert(marksToSave, {
          onConflict: 'application_id,unit_code,semester,exam_type',
          ignoreDuplicates: false
        });
      
      if (saveError) {
        throw saveError;
      }
      
      setSuccess('Marks saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reload existing marks
      await loadExistingMarks(selectedClass.class_id, units);
      
    } catch (err: any) {
      console.error('Save error:', err);
      setError(`Failed to save marks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit marks - locks them for editing and triggers result release
  const submitMarks = async () => {
    if (!selectedClass || !selectedSemesterAssignment || !lecturerId) return;
    
    setIsSubmittingMarks(true);
    setError('');
    
    try {
      // Update all marks for this class/semester to is_submitted = true
      const { error: submitError } = await supabase
        .from('exam_marks')
        .update({ is_submitted: true })
        .eq('lecturer_id', lecturerId)
        .eq('class_id', selectedClass.class_id)
        .eq('semester', selectedClass.semester)
        .eq('intake', selectedIntake)
        .eq('is_submitted', false); // Only submit unsaved marks
      
      if (submitError) {
        throw submitError;
      }
      
      setSuccess('Marks submitted successfully! Results will be released for fee-cleared students.');
      setTimeout(() => setSuccess(''), 5000);
      
      // Reload existing marks to show submitted status
      await loadExistingMarks(selectedClass.class_id, units);
      
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(`Failed to submit marks: ${err.message}`);
    } finally {
      setIsSubmittingMarks(false);
    }
  };

  // Handle absent toggle
  const handleAbsentToggle = (studentId: string, unitCode: string, isAbsent: boolean) => {
    const key = `${studentId}-${unitCode}`;
    const current = marksData.get(key) || { 
      cat_marks: null, 
      end_term_marks: null, 
      practical_marks: null,
      is_absent: false,
      is_submitted: false
    };
    
    const updated = {
      ...current,
      is_absent: isAbsent,
      // Clear marks if marked absent
      cat_marks: isAbsent ? null : current.cat_marks,
      end_term_marks: isAbsent ? null : current.end_term_marks,
      practical_marks: isAbsent ? null : current.practical_marks
    };
    
    setMarksData(new Map(marksData.set(key, updated)));
  };

  // Handle practical marks input (for CDACC courses)
  const handlePracticalMarkChange = (studentId: string, unitCode: string, value: number) => {
    const key = `${studentId}-${unitCode}`;
    const current = marksData.get(key) || { 
      cat_marks: null, 
      end_term_marks: null, 
      practical_marks: null,
      is_absent: false,
      is_submitted: false
    };
    
    // Validate range (0-30)
    if (value < 0 || value > 30) return;
    
    const updated = {
      ...current,
      practical_marks: value
    };
    
    setMarksData(new Map(marksData.set(key, updated)));
  };

  // Load submission status for all units
  const loadSubmissionStatus = async () => {
    if (!selectedClass || !lecturerId) return;
    
    try {
      const { data, error } = await supabase
        .from('exam_marks')
        .select('unit_code, is_submitted')
        .eq('lecturer_id', lecturerId)
        .eq('class_id', selectedClass.class_id)
        .eq('semester', selectedClass.semester)
        .eq('intake', selectedIntake);
      
      if (error) throw error;
      
      // Calculate submission stats per unit
      const stats = new Map<string, { submitted: number; total: number }>();
      
      for (const mark of (data || [])) {
        const current = stats.get(mark.unit_code) || { submitted: 0, total: 0 };
        current.total++;
        if (mark.is_submitted) current.submitted++;
        stats.set(mark.unit_code, current);
      }
      
      setSubmissionStatus(stats);
    } catch (err) {
      console.error('Error loading submission status:', err);
    }
  };

  // Format campus for display
  const formatCampus = (campus: string) => {
    return campus === 'west' ? 'West Campus' : 'Main Campus';
  };

  // Format exam type for display
  const formatExamType = (type: string) => {
    switch (type) {
      case 'cat': return 'CAT';
      case 'end_term': return 'END TERM';
      case 'mock': return 'MOCK';
      default: return type.toUpperCase();
    }
  };

  if (loading && viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Header */}
      <div className="relative z-10 w-full glass-neu-inset border-b border-white/10 rounded-none">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="relative w-12 h-12">
              <Image src="/logo.webp" alt="EAVI Logo" fill className="object-contain" />
            </Link>
            <div>
              <h1 className="text-white font-bold text-lg">Lecturer Portal</h1>
              <p className="text-purple-200 text-sm">{lecturerInfo?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {viewMode === 'marks' && (
              <button
                onClick={() => {
                  setViewMode('dashboard');
                  setSelectedClass(null);
                  setSelectedSemesterAssignment(null);
                  setMarksData(new Map());
                }}
                className="px-4 py-2 glass-neu-btn text-white text-sm font-semibold"
              >
                ← Back to Classes
              </button>
            )}
            {viewMode === 'dashboard' && (
              <button
                onClick={() => {
                  loadSubmissionStatus();
                  setViewMode('submissions');
                }}
                className="px-4 py-2 glass-neu-btn text-white text-sm font-semibold"
              >
                Submission Status
              </button>
            )}
            {(viewMode === 'submissions' || viewMode === 'setup') && (
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 glass-neu-btn text-white text-sm font-semibold"
              >
                ← Back to Dashboard
              </button>
            )}
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Classes</h2>
              <div className="flex items-center gap-4">
                <span className="text-purple-300">{lecturerClasses.length} classes assigned</span>
                <button
                  onClick={openSetup}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold"
                >
                  + Setup Classes
                </button>
              </div>
            </div>

            {lecturerClasses.length === 0 ? (
              <div className="glass-neu p-8 text-center">
                <p className="text-purple-200 mb-4">No classes assigned yet.</p>
                <button
                  onClick={openSetup}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  Setup Your Classes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lecturerClasses.map((cls) => {
                  const catStatus = checkWindowStatus(cls, 'cat');
                  const endTermStatus = checkWindowStatus(cls, 'end_term');
                  
                  return (
                    <div key={cls.class_id} className="glass-neu p-6 space-y-4">
                      {/* Course Name */}
                      <h3 className="text-lg font-semibold text-white">{cls.course_name}</h3>
                      
                      {/* Class Info */}
                      <div className="space-y-1">
                        <p className="text-purple-200 text-sm">{cls.class_name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 bg-purple-600/30 rounded text-xs text-purple-200">
                            {cls.intake_month}
                          </span>
                          <span className="px-2 py-1 bg-blue-600/30 rounded text-xs text-blue-200">
                            {formatCampus(cls.campus)}
                          </span>
                          <span className="px-2 py-1 bg-green-600/30 rounded text-xs text-green-200">
                            Sem {cls.semester}
                          </span>
                        </div>
                      </div>

                      {/* Student Count */}
                      <div className="flex items-center gap-2 text-purple-300 text-sm">
                        <span className="font-semibold">{cls.total_students}</span> students enrolled
                      </div>

                      {/* Term Info */}
                      {cls.term_name && (
                        <p className="text-purple-300 text-xs">{cls.term_name}</p>
                      )}

                      {/* Window Status */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        {/* CAT Status */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-300">CAT:</span>
                          <span className={`px-2 py-0.5 rounded ${
                            catStatus.open ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                          }`}>
                            {catStatus.open ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                        
                        {/* End Term Status */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-300">End Term:</span>
                          <span className={`px-2 py-0.5 rounded ${
                            endTermStatus.open ? 'bg-green-500/30 text-green-300' : 
                            endTermStatus.message.includes('UPCOMING') ? 'bg-yellow-500/30 text-yellow-300' :
                            'bg-red-500/30 text-red-300'
                          }`}>
                            {endTermStatus.open ? 'DUE' : endTermStatus.message.includes('opens') ? 'UPCOMING' : 'CLOSED'}
                          </span>
                        </div>
                      </div>

                      {/* Enter Marks Button */}
                      <button
                        onClick={() => enterMarks(cls)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Enter Marks
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MARKS ENTRY VIEW */}
        {viewMode === 'marks' && selectedClass && (
          <div className="space-y-6">
            {/* Class Header */}
            <div className="glass-neu p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedClass.course_name}</h2>
                  <p className="text-purple-200">{selectedClass.class_name}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-purple-600/30 rounded text-xs text-purple-200">
                      {selectedClass.intake_month}
                    </span>
                    <span className="px-2 py-1 bg-blue-600/30 rounded text-xs text-blue-200">
                      {formatCampus(selectedClass.campus)}
                    </span>
                    <span className="px-2 py-1 bg-green-600/30 rounded text-xs text-green-200">
                      Sem {selectedClass.semester} • Mod {selectedClass.module_index}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-purple-300 text-sm">{students.length} students</p>
                </div>
              </div>
            </div>

            {/* Exam Type Tabs */}
            <div className="flex gap-2">
              {['cat', 'end_term', 'mock'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleExamTypeChange(type)}
                  disabled={!selectedClass.exam_type_allowed?.includes(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    selectedExamType === type
                      ? 'bg-purple-600 text-white'
                      : 'glass-neu-btn text-white disabled:opacity-30'
                  }`}
                >
                  {formatExamType(type)}
                </button>
              ))}
            </div>

            {/* Window Status Banner */}
            {!isWindowOpen && (
              <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-200 font-semibold">Window Closed</p>
                <p className="text-red-300 text-sm">{windowMessage}</p>
              </div>
            )}
            
            {isWindowOpen && windowMessage && (
              <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg">
                <p className="text-green-200 font-semibold">{windowMessage}</p>
              </div>
            )}

            {/* Marks Table */}
            <div className="glass-neu p-6 overflow-x-auto">
              {students.length === 0 ? (
                <p className="text-purple-200 text-center">No enrolled students found.</p>
              ) : units.length === 0 ? (
                <p className="text-purple-200 text-center">No units assigned.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-3 text-purple-200 text-sm">Student</th>
                      <th className="text-left p-3 text-purple-200 text-sm">Admission #</th>
                      {units.map((unit) => (
                        <th key={unit.unit_code} className="p-3 text-center text-purple-200 text-sm">
                          <div>{unit.unit_name}</div>
                          <div className="text-xs text-purple-400">{unit.unit_code}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-white/10">
                        <td className="p-3 text-white">{student.full_name}</td>
                        <td className="p-3 text-purple-300 text-sm">{student.admission_number}</td>
                        {units.map((unit) => {
                          const key = `${student.application_id}-${unit.unit_code}`;
                          const existing = existingMarks.get(key);
                          const current = marksData.get(key);
                          
                          const catMarks = current?.cat_marks ?? existing?.cat_marks ?? null;
                          const endTermMarks = current?.end_term_marks ?? existing?.end_term_marks ?? null;
                          const practicalMarks = current?.practical_marks ?? existing?.practical_marks ?? null;
                          const isAbsent = current?.is_absent ?? existing?.is_absent ?? false;
                          const isSubmitted = existing?.is_submitted ?? false;
                          const total = calculateTotal(catMarks, endTermMarks, practicalMarks, isAbsent);
                          const grade = isAbsent ? 'ABS' : calculateGrade(total);
                          
                          return (
                            <td key={unit.unit_code} className="p-3">
                              {/* Submitted Badge */}
                              {isSubmitted && (
                                <div className="mb-1 text-xs text-green-400 font-semibold">✓ SUBMITTED</div>
                              )}
                              
                              {/* Absent Toggle */}
                              <label className="flex items-center gap-1 mb-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isAbsent}
                                  onChange={(e) => handleAbsentToggle(student.application_id, unit.unit_code, e.target.checked)}
                                  disabled={!isWindowOpen || isSubmitted}
                                  className="w-3 h-3 rounded border-white/30"
                                />
                                <span className="text-xs text-purple-300">Absent</span>
                              </label>
                              
                              {!isAbsent && (
                                <>
                                  {selectedExamType === 'cat' && (
                                    <input
                                      type="number"
                                      min="0"
                                      max="30"
                                      step="0.5"
                                      value={catMarks ?? ''}
                                      onChange={(e) => handleMarkChange(student.application_id, unit.unit_code, 'cat_marks', parseFloat(e.target.value) || 0)}
                                      disabled={!isWindowOpen || isSubmitted}
                                      className="w-20 px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-center disabled:opacity-30"
                                    />
                                  )}
                                  
                                  {selectedExamType === 'end_term' && (
                                    <>
                                      <input
                                        type="number"
                                        min="0"
                                        max="70"
                                        step="0.5"
                                        value={endTermMarks ?? ''}
                                        onChange={(e) => handleMarkChange(student.application_id, unit.unit_code, 'end_term_marks', parseFloat(e.target.value) || 0)}
                                        disabled={!isWindowOpen || isSubmitted}
                                        className="w-20 px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-center disabled:opacity-30 mb-1"
                                      />
                                      {/* Practical marks for CDACC courses */}
                                      {selectedClass?.exam_type_allowed?.includes('practical') && (
                                        <input
                                          type="number"
                                          min="0"
                                          max="30"
                                          step="0.5"
                                          placeholder="Prac"
                                          value={practicalMarks ?? ''}
                                          onChange={(e) => handlePracticalMarkChange(student.application_id, unit.unit_code, parseFloat(e.target.value) || 0)}
                                          disabled={!isWindowOpen || isSubmitted}
                                          className="w-20 px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-center disabled:opacity-30 text-xs"
                                        />
                                      )}
                                    </>
                                  )}
                                  
                                  {selectedExamType === 'mock' && (
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.5"
                                      value={total || ''}
                                      disabled={!isWindowOpen || isSubmitted}
                                      className="w-20 px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-center disabled:opacity-30"
                                    />
                                  )}
                                </>
                              )}
                              
                              {/* Total, Grade and Pass/Fail */}
                              {(catMarks !== null || endTermMarks !== null || isAbsent) && (
                                <div className="mt-1 text-xs">
                                  <span className="text-white font-semibold">{total}</span>
                                  <span className="text-purple-300 ml-1">({grade})</span>
                                  {!isAbsent && (
                                    <span className={`ml-2 ${isPass(total) ? 'text-green-400' : 'text-red-400'}`}>
                                      {isPass(total) ? 'PASS' : 'FAIL'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Action Buttons */}
            {isWindowOpen && (
              <div className="flex justify-end gap-3">
                <button
                  onClick={saveMarks}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={submitMarks}
                  disabled={isSubmittingMarks || loading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isSubmittingMarks ? 'Submitting...' : 'Submit Marks'}
                </button>
              </div>
            )}
            
            {/* Fee Clearance Warning */}
            {students.some(s => s.financial_hold) && (
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Some students have fee holds. Their results will be blocked until they reach 95% fee clearance.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SETUP VIEW - Lecturer Self-Assignment */}
        {viewMode === 'setup' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Setup Your Teaching Assignment</h2>
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="glass-neu p-6 space-y-6 max-w-3xl">
              {/* Campus Selection */}
              <div>
                <label className="block text-purple-200 text-sm mb-2">Campus *</label>
                <select value={setupForm.campus} onChange={(e) => setSetupForm({ ...setupForm, campus: e.target.value, course_id: '', selected_units: [] })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white" required>
                  <option value="">Select Campus</option>
                  <option value="main">Main Campus</option>
                  <option value="west">West Campus</option>
                </select>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-purple-200 text-sm mb-2">Select Course *</label>
                <select
                  value={setupForm.course_id}
                  onChange={(e) => {
                    const courseId = e.target.value;
                    setSetupForm({ ...setupForm, course_id: courseId, selected_units: [] });
                    loadUnitsForCourse(courseId);
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>

              {/* Units Selection */}
              <div>
                <label className="block text-purple-200 text-sm mb-2">Select Units You Teach *</label>
                <p className="text-purple-300 text-xs mb-3">Check all units/subjects you teach in this course.</p>
                {setupForm.course_id && courseUnits.length === 0 ? (
                  <p className="text-orange-300 text-sm">No units found for this course.</p>
                ) : !setupForm.course_id ? (
                  <p className="text-purple-300 text-sm">Select a course first.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {courseUnits.map((unit) => (
                      <label key={unit.unit_code} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setupForm.selected_units.includes(unit.unit_code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSetupForm({
                                ...setupForm,
                                selected_units: [...setupForm.selected_units, unit.unit_code]
                              });
                            } else {
                              setSetupForm({
                                ...setupForm,
                                selected_units: setupForm.selected_units.filter(u => u !== unit.unit_code)
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="text-white text-sm">{unit.name}</span>
                          <span className="text-purple-300 text-xs ml-2">({unit.unit_code})</span>
                          <span className="text-purple-400 text-xs ml-2">Mod {unit.module_index}, Sem {unit.semester_index}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-purple-300 text-xs mt-2">
                  Selected: {setupForm.selected_units.length} of {filteredUnits.length || courseUnits.length} units
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setViewMode('dashboard')}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAssignment || setupForm.selected_units.length === 0}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingAssignment ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUBMISSIONS VIEW */}
        {viewMode === 'submissions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Mark Submission Status</h2>
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Submission Status Table */}
            <div className="glass-neu p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Unit Submission Overview</h3>
              
              {submissionStatus.size === 0 ? (
                <p className="text-purple-300">No marks recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {Array.from(submissionStatus.entries()).map(([unitCode, stats]) => (
                    <div key={unitCode} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{unitCode}</span>
                        <span className="text-purple-300 text-sm ml-2">
                          {stats.submitted} / {stats.total} submitted
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {stats.submitted === stats.total ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            ✓ Complete
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                            ⏳ {stats.total - stats.submitted} remaining
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="glass-neu p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Submission Rules</h3>
              <ul className="space-y-2 text-purple-300 text-sm">
                <li>• Save marks as draft before submitting</li>
                <li>• Once submitted, marks cannot be edited</li>
                <li>• Results are automatically released for fee-cleared students</li>
                <li>• Students with fee holds will see their results after reaching 95% clearance</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
