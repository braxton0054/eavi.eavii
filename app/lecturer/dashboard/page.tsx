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
  const [selectedExamBody, setSelectedExamBody] = useState<string | null>(null);
  const [setupForm, setSetupForm] = useState({
    course_id: '',
    campus: '',
    selected_units: [] as string[],
    selected_class_ids: [] as string[]
  });
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  
  // Selected class for marks entry
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSemesterAssignment, setSelectedSemesterAssignment] = useState<SemesterAssignment | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<string>('');
  
  // Marks entry state - Updated for Part 3
  const [students, setStudents] = useState<Student[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedMarksUnit, setSelectedMarksUnit] = useState<string | null>(null);
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

      // Debug: log what metadata we have
      console.log('User metadata:', JSON.stringify(user.user_metadata));
      
      // Get lecturer UUID by lecturer_number from JWT metadata
      const lecNumber = user.user_metadata?.lecturer_number;
      if (!lecNumber) {
        setError('Lecturer number missing from your account. Metadata: ' + JSON.stringify(user.user_metadata));
        setLoading(false);
        return;
      }

      const { data: lecturerData, error: lecError } = await supabase
        .from('lecturers')
        .select('id, full_name, email')
        .eq('lecturer_number', lecNumber)
        .maybeSingle();

      if (lecError || !lecturerData) {
        console.error('Lecturer lookup error:', lecError);
        setError('Lecturer profile not found for number ' + lecNumber + '. Contact admin.');
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
          total_students: 0,
          exam_body: a.exam_body,
          term_name: a.term_name,
          cat_opening_date: a.cat_opening_date,
          cat_closing_date: a.cat_closing_date,
          end_term_exam_date: a.end_term_exam_date,
          is_attachment_stage: a.is_attachment_stage,
          units: a.units || []
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
  const loadCoursesForSetup = async (examBody: string) => {
    if (examBody === 'Short Course') {
      const { data, error } = await supabase
        .from('short_courses')
        .select('id, name, course_id')
        .eq('is_active', true)
        .order('name');
      if (error) {
        console.error('Short courses load error:', error);
        setError('Failed to load short courses: ' + error.message);
        return;
      }
      setCourses((data || []).map((sc: any) => ({
        id: sc.course_id || sc.id,
        name: sc.name,
        _short_course_id: sc.id,
        _is_short_course: true
      })));
    } else {
      const { data, error } = await supabase.from('courses').select('id, name').eq('exam_body', examBody).order('name');
      if (error) {
        console.error('Courses load error:', error);
        setError('Failed to load courses: ' + error.message);
        return;
      }
      setCourses(data || []);
    }
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
    if (selectedExamBody === 'Short Course') {
      const selected = courses.find((c: any) => (c.id === courseId || c._short_course_id === courseId));
      const shortCourseId = selected?._short_course_id || courseId;
      const { data } = await supabase
        .from('short_course_units')
        .select('id, unit_name')
        .eq('short_course_id', shortCourseId)
        .order('id');
      setCourseUnits((data || []).map((u: any, i: number) => ({
        unit_code: u.id,
        name: u.unit_name,
        unit_type: 'Short Course',
        semester_index: 1,
        module_index: 0
      })));
    } else {
      const { data } = await supabase
        .from('units')
        .select('unit_code, name, unit_type, semester_index, module_index')
        .eq('course_id', courseId)
        .order('module_index')
        .order('semester_index');
      setCourseUnits(data || []);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lecturerId || !selectedExamBody || setupForm.selected_units.length === 0) {
      setError('Please select an exam body, course, and at least one unit');
      return;
    }
    // Class selection is optional - class is auto-created when students enroll
    if (selectedExamBody === 'Short Course') {
      setError('Short course lecturer assignment is coming soon. Select KNEC, CDACC, or JP for now.');
      return;
    }

    setCreatingAssignment(true);
    setError('');

    try {
      // Check for unit conflicts: are any selected units already assigned to another lecturer for the chosen class(es)?
      if (setupForm.selected_class_ids.length > 0) {
        const { data: conflicts } = await supabase
          .from('lecturer_assignment_units')
          .select(`
            unit_code,
            class_id,
            lecturer_assignments!inner(
              lecturer_id,
              lecturers!inner(full_name)
            )
          `)
          .eq('course_id', setupForm.course_id)
          .in('unit_code', setupForm.selected_units)
          .in('class_id', setupForm.selected_class_ids)
          .neq('lecturer_assignments.lecturer_id', lecturerId);

        if (conflicts && conflicts.length > 0) {
          const conflictNames = conflicts.map((c: any) => 
            `Unit ${c.unit_code} → ${c.lecturer_assignments?.lecturers?.full_name || 'another lecturer'}`
          );
          setError(`Conflict: These units are already assigned to another lecturer in the selected class(es):\n${conflictNames.join('\n')}`);
          setCreatingAssignment(false);
          return;
        }
      }

      // Create lecturer assignment (without class_id - auto-matched)
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

      // Create unit assignments - one row per unit × per class
      const unitAssignments: any[] = [];
      setupForm.selected_units.forEach(unitCode => {
        (setupForm.selected_class_ids.length > 0 ? setupForm.selected_class_ids : [null]).forEach(classId => {
          unitAssignments.push({
            assignment_id: assignmentData.id,
            course_id: setupForm.course_id,
            unit_code: unitCode,
            class_id: classId || null
          });
        });
      });

      const { error: unitsError } = await supabase
        .from('lecturer_assignment_units')
        .insert(unitAssignments);

      if (unitsError) throw unitsError;

      setSuccess('Assignment created successfully!');
      setSetupForm({ course_id: "", campus: "", selected_units: [], selected_class_ids: [] });
      setSelectedExamBody(null);
      setViewMode('dashboard');
      await loadLecturerClasses(lecturerId);
    } catch (err: any) {
      setError(`Failed to create assignment: ${err.message}`);
    } finally {
      setCreatingAssignment(false);
    }
  };

  const openSetup = async () => {
    setViewMode('setup');
    setSelectedExamBody(null);
    setCourses([]);
    setSetupForm({ course_id: "", campus: "", selected_units: [], selected_class_ids: [] });
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
    
    // Check window — combined CAT + End Term
    const catStatus = checkWindowStatus(cls, 'cat');
    const etStatus = checkWindowStatus(cls, 'end_term');
    const anyOpen = catStatus.open || etStatus.open;
    setIsWindowOpen(anyOpen);
    let winMsg = '';
    if (catStatus.open && etStatus.open) winMsg = 'CAT and End Term windows are OPEN';
    else if (catStatus.open) winMsg = 'CAT window is OPEN — End Term: ' + etStatus.message;
    else if (etStatus.open) winMsg = 'End Term window is OPEN — CAT: ' + catStatus.message;
    else winMsg = 'CAT: ' + catStatus.message + ' | End Term: ' + etStatus.message;
    setWindowMessage(winMsg);
    
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
    setSelectedMarksUnit(mappedUnits[0]?.unit_code || null);
    
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
      .in('exam_type', ['cat', 'end_term']);

    // Merge CAT and End Term rows into one entry per student+unit
    const marksMap = new Map();
    data?.forEach((m: any) => {
      const key = `${m.application_id}-${m.unit_code}`;
      const existing = marksMap.get(key) || {};
      marksMap.set(key, {
        ...existing,
        ...m,
        cat_marks: m.exam_type === 'cat' ? m.cat_marks : (existing.cat_marks ?? null),
        end_term_marks: m.exam_type === 'end_term' ? m.end_term_marks : (existing.end_term_marks ?? null),
        is_submitted: existing.is_submitted && m.is_submitted
      });
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
          
          // Skip if already submitted (can't edit submitted marks)
          if (existing?.is_submitted || data?.is_submitted) continue;
          
          // Default to 0 for ungraded students (ensures all students have marks)
          const catMarks = data?.cat_marks ?? existing?.cat_marks ?? 0;
          const endTermMarks = data?.end_term_marks ?? existing?.end_term_marks ?? 0;
          const practicalMarks = data?.practical_marks ?? existing?.practical_marks ?? 0;
          const isAbsent = data?.is_absent ?? existing?.is_absent ?? false;
          
          const totalMarks = calculateTotal(catMarks, endTermMarks, practicalMarks, isAbsent);
          const grade = isAbsent ? 'ABS' : calculateGrade(totalMarks);
          
          // Save CAT row
          marksToSave.push({
            application_id: student.application_id,
            campus: selectedClass.campus,
            course_id: selectedClass.course_id,
            class_id: selectedClass.class_id,
            unit_code: unit.unit_code,
            semester: selectedClass.semester,
            exam_type: 'cat',
            cat_marks: catMarks,
            end_term_marks: null,
            practical_marks: null,
            marks: catMarks || 0,
            grade: isAbsent ? 'ABS' : calculateGrade(catMarks || 0),
            is_absent: isAbsent,
            is_submitted: false,
            lecturer_id: lecturerId,
            intake: selectedIntake,
            semester_assignment_id: selectedSemesterAssignment.id
          });
          // Save End Term row
          marksToSave.push({
            application_id: student.application_id,
            campus: selectedClass.campus,
            course_id: selectedClass.course_id,
            class_id: selectedClass.class_id,
            unit_code: unit.unit_code,
            semester: selectedClass.semester,
            exam_type: 'end_term',
            cat_marks: null,
            end_term_marks: endTermMarks,
            practical_marks: practicalMarks,
            marks: (endTermMarks || 0) + (practicalMarks || 0),
            grade: isAbsent ? 'ABS' : calculateGrade((endTermMarks || 0) + (practicalMarks || 0)),
            is_absent: isAbsent,
            is_submitted: false,
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
      // VALIDATION: Check ALL enrolled students have BOTH CAT and End Term marks entered
      const totalStudents = students.length;
      
      // Count CAT marks rows
      const { count: catCount, error: catError } = await supabase
        .from('exam_marks')
        .select('*', { count: 'exact', head: true })
        .eq('lecturer_id', lecturerId)
        .eq('class_id', selectedClass.class_id)
        .eq('semester', selectedClass.semester)
        .eq('intake', selectedIntake)
        .eq('exam_type', 'cat');
      
      if (catError) throw catError;
      
      // Count End Term marks rows  
      const { count: etCount, error: etError } = await supabase
        .from('exam_marks')
        .select('*', { count: 'exact', head: true })
        .eq('lecturer_id', lecturerId)
        .eq('class_id', selectedClass.class_id)
        .eq('semester', selectedClass.semester)
        .eq('intake', selectedIntake)
        .eq('exam_type', 'end_term');
      
      if (etError) throw etError;
      
      if ((catCount || 0) < totalStudents || (etCount || 0) < totalStudents) {
        const catMissing = totalStudents - (catCount || 0);
        const etMissing = totalStudents - (etCount || 0);
        let msg = 'Cannot submit: ';
        if (catMissing > 0) msg += `${catMissing} student${catMissing > 1 ? 's' : ''} missing CAT marks. `;
        if (etMissing > 0) msg += `${etMissing} student${etMissing > 1 ? 's' : ''} missing End Term marks. `;
        msg += 'Please save marks (enter 0 for absent/no-show) for all students first.';
        setError(msg);
        setIsSubmittingMarks(false);
        return;
      }
      
      // Update all marks for this class/semester to is_submitted = true for BOTH exam types
      const { error: submitError } = await supabase
        .from('exam_marks')
        .update({ is_submitted: true })
        .eq('lecturer_id', lecturerId)
        .eq('class_id', selectedClass.class_id)
        .eq('semester', selectedClass.semester)
        .eq('intake', selectedIntake)
        .eq('is_submitted', false);
      
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="relative z-10 w-full bg-white border-b border-gray-200 shadow-sm rounded-none">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="relative w-12 h-12">
              <Image src="/logo.webp" alt="EAVI Logo" fill className="object-contain" />
            </Link>
            <div>
              <h1 className="text-gray-900 font-bold text-lg">Lecturer Portal</h1>
              <p className="text-gray-500 text-sm">{lecturerInfo?.full_name}</p>
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Submission Status
              </button>
            )}
            {(viewMode === 'submissions' || viewMode === 'setup') && (
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Classes</h2>
              <div className="flex items-center gap-4">
                <span className="text-gray-400">{lecturerClasses.length} classes assigned</span>
                <button
                  onClick={openSetup}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold"
                >
                  + Setup Classes
                </button>
              </div>
            </div>

             {lecturerClasses.length === 0 ? (
               <div className="flex items-center justify-center py-12">
                 <div className="text-center">
                   <div className="flex items-center justify-center mb-4">
                     <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                       <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                       </svg>
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-2">No classes assigned</h3>
                     <p className="text-gray-500 mb-4">Click "Setup Your Classes" to get started</p>
                     <button
                       onClick={openSetup}
                       className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                     >
                       Setup Your Classes
                     </button>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {lecturerClasses.map((cls) => {
                   const catStatus = checkWindowStatus(cls, 'cat');
                   const endTermStatus = checkWindowStatus(cls, 'end_term');
                   
                   // Determine border color based on exam body
                   const borderColor = cls.exam_body === 'CDACC' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500';
                   
                   return (
                     <div key={cls.assignment_id || cls.class_id} className={`bg-white rounded-xl border border-gray-200 p-6 space-y-4 hover:shadow-md transition-shadow ${borderColor}`}>
                       {/* Header with exam body badge */}
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex-1">
                           <h3 className="text-lg font-semibold text-gray-900">{cls.course_name}</h3>
                           <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs font-medium">{cls.class_name}</span>
                             <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                               {cls.exam_body}
                             </span>
                           </div>
                         </div>
                       </div>
                       
                       {/* Info Section */}
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 mb-1">
                           <div className="w-5 h-5 bg-indigo-50 flex items-center justify-center rounded">
                             <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z"></path>
                             </svg>
                           </div>
                           <span className="text-sm text-gray-500">{cls.intake_month} • {formatCampus(cls.campus)}</span>
                         </div>
                         
                         <div className="flex items-center gap-2 mb-1">
                           <div className="w-5 h-5 bg-green-50 flex items-center justify-center rounded">
                             <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s1 2 2 2 2-.9 2-2-1-2-2-2zm0 12c-4 0-6-2-6-4 0-1.2.4-2.2 1-3"/>
                             </svg>
                           </div>
                           <span className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                             <span>{cls.total_students}</span>
                             <span>students</span>
                           </span>
                         </div>

                         {/* Your Units */}
                         {cls.units && cls.units.length > 0 && (
                           <div className="mb-3">
                             <p className="text-xs text-gray-400 font-medium mb-1.5">📋 Your Units</p>
                             <div className="flex flex-wrap gap-1.5">
                               {(cls.units || []).map((u: any, i: number) => (
                                 <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 font-medium flex items-center gap-1">
                                   {u.module_index && (
                                     <span className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs font-semibold">
                                       {cls.exam_body === 'CDACC' ? 'S' : 'M'}{u.module_index}
                                     </span>
                                   )}
                                   <span>{u.unit_code} — {u.unit_name}</span>
                                 </span>
                               ))}
                             </div>
                           </div>
                         )}
                         
                         {/* Term and Status Badges */}
                         <div className="flex flex-wrap gap-2 mb-3">
                           {cls.is_attachment_stage && (
                             <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                               🔧 Industrial Attachment
                             </span>
                           )}
                           {cls.term_name && !cls.is_attachment_stage && (
                             <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                               {cls.term_name}
                             </span>
                           )}
                           {!cls.is_attachment_stage && (
                           <>
                           <span className={`px-2 py-0.5 rounded ${
                             catStatus.open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                           } text-xs font-medium`}>
                             {catStatus.open ? 'CAT: OPEN' : 'CAT: CLOSED'}
                           </span>
                           <span className={`px-2 py-0.5 rounded ${
                             endTermStatus.open ? 'bg-green-100 text-green-700' : 
                             endTermStatus.message.includes('UPCOMING') ? 'bg-yellow-100 text-yellow-700' :
                             'bg-red-100 text-red-700'
                           } text-xs font-medium`}>
                             {endTermStatus.open ? 'END TERM: DUE' : endTermStatus.message.includes('opens') ? 'END TERM: UPCOMING' : 'END TERM: CLOSED'}
                           </span>
                           </>
                           )}
                         </div>
                       </div>
 
                       {/* Enter Marks Button - disabled during attachment */}
                       {cls.is_attachment_stage ? (
                         <div className="w-full py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-semibold text-center mt-4 cursor-not-allowed">
                           Attachment - No marks entry
                         </div>
                       ) : (
                         <button
                           onClick={() => enterMarks(cls)}
                           className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors mt-4"
                         >
                           Enter Marks
                         </button>
                       )}
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedClass.course_name}</h2>
                  <p className="text-gray-500">{selectedClass.class_name}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {selectedClass.intake_month}
                    </span>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                      {formatCampus(selectedClass.campus)}
                    </span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                      Sem {selectedClass.semester} • {selectedClass.exam_body === 'CDACC' ? 'Stage' : 'Mod'} {selectedClass.module_index}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">{students.length} students</p>
                </div>
              </div>
            </div>

            {/* Window Status Banner */}
            {!isWindowOpen && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">Exam Windows Closed</p>
                <p className="text-red-500 text-sm">{windowMessage}</p>
              </div>
            )}
            
            {isWindowOpen && windowMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold">{windowMessage}</p>
              </div>
            )}

            {/* Unit Selector */}
            {units.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-500 font-medium">Unit:</label>
                <select
                  value={selectedMarksUnit || ''}
                  onChange={(e) => {
                    setSelectedMarksUnit(e.target.value);
                    loadExistingMarks(selectedClass?.class_id, units);
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {units.map((u) => (
                    <option key={u.unit_code} value={u.unit_code}>
                      {u.unit_code} — {u.unit_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Marks Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
              {students.length === 0 ? (
                <div className="text-center py-12"><p className="text-gray-400 text-lg">👥 No enrolled students</p><p className="text-gray-400 text-sm mt-1">This class has no enrolled students yet</p></div>
              ) : units.length === 0 ? (
                <div className="text-center py-12"><p className="text-gray-400 text-lg">📝 No units assigned</p><p className="text-gray-400 text-sm mt-1">You haven't been assigned units for this class</p></div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left p-3 text-gray-600 text-sm font-semibold">Student</th>
                      <th className="text-left p-3 text-gray-600 text-sm font-semibold">Admission #</th>
                      {units.filter(u => u.unit_code === selectedMarksUnit).map((unit) => (
                        <th key={unit.unit_code} className="p-3 text-center text-gray-600 text-sm font-semibold" colSpan={selectedClass?.exam_type_allowed?.includes('practical') ? 4 : 3}>
                          <div>{unit.unit_name}</div>
                          <div className="text-xs text-gray-400 font-normal">{unit.unit_code}</div>
                          {/* Sub-headers */}
                          <div className="flex gap-1 mt-1.5 justify-center">
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">CAT</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">End Term</span>
                            {selectedClass?.exam_type_allowed?.includes('practical') && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-medium">Prac</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">Total</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr key={student.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30`}>
                        <td className="p-3 text-gray-900 font-medium">{student.full_name}</td>
                        <td className="p-3 text-gray-400 text-sm">{student.admission_number}</td>
                        {units.filter(u => u.unit_code === selectedMarksUnit).map((unit) => {
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
                            <td key={unit.unit_code} className="p-3 align-top">
                              {/* Submitted Badge */}
                              {isSubmitted && (
                                <div className="mb-1 inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">✓ SUBMITTED</div>
                              )}
                              
                              {/* Absent Toggle */}
                              <label className="flex items-center gap-1 mb-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isAbsent}
                                  onChange={(e) => handleAbsentToggle(student.application_id, unit.unit_code, e.target.checked)}
                                  disabled={!isWindowOpen || isSubmitted}
                                  className="w-3 h-3 rounded border-gray-300"
                                />
                                <span className="text-xs text-gray-400">Absent</span>
                              </label>
                              
                              {!isAbsent && (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex gap-1 items-start">
                                    {/* CAT Input */}
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] text-blue-600 font-medium mb-0.5">CAT</span>
                                      <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        step="0.5"
                                        value={catMarks ?? ''}
                                        onChange={(e) => handleMarkChange(student.application_id, unit.unit_code, 'cat_marks', parseFloat(e.target.value) || 0)}
                                        disabled={!isWindowOpen || isSubmitted}
                                        className="w-16 px-1 py-1 bg-white border border-gray-300 rounded text-gray-900 text-center text-sm disabled:opacity-30 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                      />
                                    </div>
                                    {/* End Term Input */}
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] text-indigo-600 font-medium mb-0.5">Term</span>
                                      <input
                                        type="number"
                                        min="0"
                                        max="70"
                                        step="0.5"
                                        value={endTermMarks ?? ''}
                                        onChange={(e) => handleMarkChange(student.application_id, unit.unit_code, 'end_term_marks', parseFloat(e.target.value) || 0)}
                                        disabled={!isWindowOpen || isSubmitted}
                                        className="w-16 px-1 py-1 bg-white border border-gray-300 rounded text-gray-900 text-center text-sm disabled:opacity-30 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                      />
                                    </div>
                                    {/* Practical marks for CDACC courses */}
                                    {selectedClass?.exam_type_allowed?.includes('practical') && (
                                      <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-purple-600 font-medium mb-0.5">Prac</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max="30"
                                          step="0.5"
                                          value={practicalMarks ?? ''}
                                          onChange={(e) => handlePracticalMarkChange(student.application_id, unit.unit_code, parseFloat(e.target.value) || 0)}
                                          disabled={!isWindowOpen || isSubmitted}
                                          className="w-16 px-1 py-1 bg-white border border-gray-300 rounded text-gray-900 text-center text-sm disabled:opacity-30 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Total, Grade and Pass/Fail */}
                              {(catMarks !== null || endTermMarks !== null || isAbsent) && (
                                <div className="mt-1 text-xs">
                                  <span className="text-gray-900 font-semibold">{total}</span>
                                  <span className="text-gray-400 ml-1">({grade})</span>
                                  {!isAbsent && (
                                    <span className={`ml-2 inline-block px-2 py-0.5 rounded text-xs font-semibold ${isPass(total) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-sm">
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
              <h2 className="text-2xl font-bold text-gray-900">Setup Your Teaching Assignment</h2>
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 max-w-3xl">
              {/* Exam Body Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-3">Choose Exam Body</label>
                <div className="flex flex-wrap gap-3">
                  {['KNEC', 'CDACC', 'JP', 'Short Course'].map((body) => (
                    <button
                      key={body}
                      type="button"
                      onClick={() => {
                        setSelectedExamBody(body);
                        setSetupForm({ ...setupForm, course_id: '', selected_units: [] });
                        setCourseUnits([]);
                        loadCoursesForSetup(body);
                      }}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                        selectedExamBody === body
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {body}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campus Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Campus *</label>
                <select
                  value={setupForm.campus}
                  onChange={(e) => setSetupForm({ ...setupForm, campus: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select Campus</option>
                  <option value="main">Main Campus</option>
                  <option value="west">West Campus</option>
                </select>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Select Course *</label>
                  <select
                    value={setupForm.course_id}
                    onChange={(e) => {
                      const courseId = e.target.value;
                      setSetupForm({ ...setupForm, course_id: courseId, selected_units: [], selected_class_ids: [] });
                      setAvailableClasses([]);
                      loadUnitsForCourse(courseId);
                      loadClassesForCourse(courseId);
                    }}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={!selectedExamBody}
                  >
                    <option value="">{selectedExamBody ? 'Select a course' : 'Select an exam body first'}</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
              </div>

              {/* Units Selection - Grouped by Module */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-3">Select Units You Teach *</label>
                {!setupForm.course_id ? (
                  <p className="text-gray-400 text-sm py-4 text-center">Select a course first.</p>
                ) : courseUnits.length === 0 ? (
                  <p className="text-amber-600 text-sm py-4 text-center">No units found for this course.</p>
                ) : (
                  <>
                    {Object.entries(
                      courseUnits.reduce((groups: any, unit: any) => {
                        const mod = unit.module_index || 0;
                        if (!groups[mod]) groups[mod] = [];
                        groups[mod].push(unit);
                        return groups;
                      }, {} as any)
                    ).sort(([a]: any, [b]: any) => Number(a) - Number(b)).map(([moduleIdx, moduleUnits]: any) => (
                      <div key={moduleIdx} className="border border-gray-200 rounded-xl overflow-hidden mb-4 last:mb-0">
                        {/* Module Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {moduleIdx}
                            </span>
                            <span className="font-semibold text-gray-900 text-sm">
                              {Number(moduleIdx) === 0 ? 'Units' : selectedExamBody === 'CDACC' ? `Stage ${moduleIdx}` : `Module ${moduleIdx}`}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {(moduleUnits as any[]).length} unit{(moduleUnits as any[]).length > 1 ? 's' : ''}
                          </span>
                        </div>
                        {/* Module Units */}
                        <div className="divide-y divide-gray-100">
                          {(moduleUnits as any[]).map((unit: any) => (
                            <label key={unit.unit_code} className="flex items-center gap-3 px-4 py-3 hover:bg-green-50/50 cursor-pointer transition-colors">
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
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-900 text-sm font-medium block truncate">{unit.name}</span>
                                <span className="text-gray-400 text-xs">
                                  {unit.unit_code}
                                  {unit.semester_index ? ` · Sem ${unit.semester_index}` : ''}
                                  {unit.unit_type ? ` · ${unit.unit_type}` : ''}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Selected count */}
                    <div className="flex items-center justify-between pt-3">
                      <p className="text-xs text-gray-400">
                        {setupForm.selected_units.length} of {courseUnits.length} units selected
                      </p>
                      {setupForm.selected_units.length < courseUnits.length && courseUnits.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSetupForm({
                            ...setupForm,
                            selected_units: courseUnits.map((u: any) => u.unit_code)
                          })}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Select All
                        </button>
                      )}
                      {setupForm.selected_units.length === courseUnits.length && courseUnits.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSetupForm({
                            ...setupForm,
                            selected_units: []
                          })}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Clear All
                      </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* Class Selection - Optional */}
              {setupForm.course_id && (
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-3">
                    Assign to Class(es) <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-gray-400 text-xs mb-3">
                    Select which class(es) you teach these {setupForm.selected_units.length} unit{setupForm.selected_units.length !== 1 ? 's' : ''} to. If no class exists yet, one will be auto-created when the first student enrolls.
                  </p>
                  {availableClasses.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                      <p className="text-blue-800 font-medium">ℹ️ No classes yet</p>
                      <p className="text-blue-600 text-xs mt-1">
                        A class will be created automatically when the first student enrolls. You can submit the assignment now.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableClasses.map((cls) => (
                        <label
                          key={cls.id}
                          className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-colors ${
                            setupForm.selected_class_ids.includes(cls.id)
                              ? 'border-green-300 bg-green-50/50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={setupForm.selected_class_ids.includes(cls.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSetupForm({
                                  ...setupForm,
                                  selected_class_ids: [...setupForm.selected_class_ids, cls.id]
                                });
                              } else {
                                setSetupForm({
                                  ...setupForm,
                                  selected_class_ids: setupForm.selected_class_ids.filter((id) => id !== cls.id)
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-900 text-sm font-medium block">{cls.class_name}</span>
                            <span className="text-gray-400 text-xs">
                              {formatCampus(cls.campus)} · Sem {cls.semester} · {cls.intake_month}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {setupForm.selected_class_ids.length > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-2">
                      ✓ {setupForm.selected_class_ids.length} class{setupForm.selected_class_ids.length > 1 ? 'es' : ''} selected
                    </p>
                  )}
                </div>
              )}

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
              <h2 className="text-2xl font-bold text-gray-900">Mark Submission Status</h2>
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Submission Status Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Submission Overview</h3>
              
              {submissionStatus.size === 0 ? (
                <div className="text-center py-8"><p className="text-gray-400">📊 No marks recorded yet</p></div>
              ) : (
                <div className="space-y-3">
                  {Array.from(submissionStatus.entries()).map(([unitCode, stats]) => (
                    <div key={unitCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-gray-900 font-medium">{unitCode}</span>
                        <span className="text-gray-400 text-sm ml-2">
                          {stats.submitted} / {stats.total} submitted
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {stats.submitted === stats.total ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            ✓ Complete
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Rules</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
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
