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
  current_module: number;
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
  const [courseSearch, setCourseSearch] = useState('');
  
  // Selected class for marks entry
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSemesterAssignment, setSelectedSemesterAssignment] = useState<SemesterAssignment | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<string>('');
  
  // Marks entry state
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
      
      // Load announcements
      const { data: annData } = await supabase
        .from('announcements')
        .select('title, body, category, created_at, is_pinned')
        .or(`audience.cs.{"lecturer"},audience.is.null`)
        .or(`campus.eq.${lecturerData.campus || 'main'},campus.is.null`)
        .lte('publish_at', new Date().toISOString())
        .or(`expire_at.gt.${new Date().toISOString()},expire_at.is.null`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      setAnnouncements(annData || []);
      
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
        } else if (cls.course_name) {
          // Fallback: count students by course when no class exists yet
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'enrolled')
            .eq('course_id', cls.course_id);
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
      // Check if an assignment already exists for this course + campus
      const { data: dupCheck } = await supabase
        .from('lecturer_assignments')
        .select('id')
        .eq('lecturer_id', lecturerId)
        .eq('course_id', setupForm.course_id)
        .eq('campus', setupForm.campus || 'main')
        .maybeSingle();
      
      if (dupCheck) {
        setError('You already have an assignment for this course at ' + (setupForm.campus || 'main') + ' campus.');
        setCreatingAssignment(false);
        return;
      }
      
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
    await loadStudentsForClass(cls.class_id, cls.course_id, cls.campus);
    
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
  const loadStudentsForClass = async (classId: string, courseId?: string, campus?: string) => {
    let query = supabase
      .from('applications')
      .select('id, full_name, admission_number, current_module, current_semester, financial_hold, status')
      .eq('status', 'enrolled')
      .eq('financial_hold', false);

    if (classId) {
      query = query.eq('class_id', classId);
    } else if (courseId) {
      query = query.eq('course_id', courseId);
      if (campus) query = query.eq('campus', campus);
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
      current_module: s.current_module,
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
  const formatCampus = (campus: string) => campus === 'main' ? 'Main Campus' : 'West Campus';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PROFESSIONAL DASHBOARD LAYOUT
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* HEADER - Fixed */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo / Branding */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-slate-900">EAVI</h1>
                <p className="text-xs text-slate-500">Lecturer Portal</p>
              </div>
              <div className="md:hidden">
                <p className="text-sm font-semibold text-slate-900">EAVI Portal</p>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {lecturerInfo?.full_name || 'Lecturer'}
                </p>
                <p className="text-xs text-slate-500">Lecturer</p>
              </div>
              <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - Mobile Overlay + Desktop */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={() => setSidebarOpen(false)} />}
        
        <nav className={`
          fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}>
          <div className="flex-1 overflow-y-auto pt-6 px-4">
            <div className="space-y-2">
              {[
                { mode: 'dashboard', label: 'Dashboard', icon: '📊' },
                { mode: 'marks', label: 'Manage Marks', icon: '✏️' },
                { mode: 'setup', label: 'My Courses', icon: '📚' },
                { mode: 'submissions', label: 'Submissions', icon: '📤' }
              ].map((item) => (
                <button
                  key={item.mode}
                  onClick={() => {
                    setViewMode(item.mode as any);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200
                    flex items-center gap-3
                    ${viewMode === item.mode
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 p-4">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login/lecturer');
              }}
              className="w-full px-4 py-2 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-700 font-medium transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Alert Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <span className="text-red-600 text-lg">⚠️</span>
                <div>
                  <p className="font-semibold text-red-900">{error}</p>
                </div>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <span className="text-green-600 text-lg">✓</span>
                <div>
                  <p className="font-semibold text-green-900">{success}</p>
                </div>
              </div>
            )}

            {/* DASHBOARD VIEW */}
            {viewMode === 'dashboard' && (
              <div className="space-y-8">
                {/* Welcome Section */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    Welcome, {lecturerInfo?.full_name?.split(' ')[0]}
                  </h1>
                  <p className="text-slate-600">Here's an overview of your teaching assignments</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Classes', value: lecturerClasses.length, icon: '👥', color: 'blue' },
                    { label: 'Courses', value: courses.length, icon: '📚', color: 'green' },
                    { label: 'Pending Marks', value: submissionStatus.size, icon: '⏳', color: 'amber' },
                    { label: 'Units Teaching', value: courseUnits.length, icon: '✏️', color: 'purple' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                        <div className="text-3xl opacity-70">{stat.icon}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Your Classes */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-transparent">
                    <h2 className="text-lg font-bold text-slate-900">Your Classes</h2>
                    <p className="text-sm text-slate-600 mt-1">Classes you are assigned to teach</p>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {lecturerClasses.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-slate-500 mb-4">No classes assigned yet</p>
                        <button
                          onClick={() => setViewMode('setup')}
                          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Set Up Your Courses
                        </button>
                      </div>
                    ) : (
                      lecturerClasses.map((cls) => (
                        <div key={cls.assignment_id || cls.class_id} className="p-4 sm:p-6 hover:bg-blue-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900">{cls.class_name}</h3>
                              <p className="text-sm text-slate-500 mt-1">
                                {cls.course_name} • {formatCampus(cls.campus)} • Sem {cls.semester}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium whitespace-nowrap">
                                {cls.total_students || 0} students
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Announcements */}
                {announcements.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-transparent">
                      <h2 className="text-lg font-bold text-slate-900">Announcements</h2>
                    </div>
                    <div className="space-y-4 p-6">
                      {announcements.map((ann, i) => (
                        <div key={i} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-900">{ann.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MARKS VIEW */}
            {viewMode === 'marks' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Manage Marks</h1>
                  <p className="text-slate-600">Enter and manage student examination marks</p>
                </div>

                {!selectedClass ? (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                      <h2 className="font-bold text-slate-900">Select a Class</h2>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {lecturerClasses.map((cls) => (
                        <button
                          key={cls.assignment_id || cls.class_id}
                          onClick={() => setSelectedClass(cls)}
                          className="w-full text-left p-4 sm:p-6 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-slate-900">{cls.class_name}</h3>
                              <p className="text-sm text-slate-500 mt-1">{cls.course_name}</p>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <button
                      onClick={() => setSelectedClass(null)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Classes
                    </button>

                    {/* Unit & Exam Type Selection */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-900 mb-4">Entry Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Select Unit</label>
                          <select
                            value={selectedMarksUnit || ''}
                            onChange={(e) => setSelectedMarksUnit(e.target.value || null)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Choose a unit...</option>
                            {units.map((unit) => (
                              <option key={unit.unit_code} value={unit.unit_code}>
                                {unit.unit_code} - {unit.unit_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Exam Type</label>
                          <select
                            value={selectedExamType}
                            onChange={(e) => setSelectedExamType(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="cat">CAT (Continuous Assessment)</option>
                            <option value="end_term">End Term</option>
                            <option value="practical">Practical</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Marks Entry Table */}
                    {selectedMarksUnit && students.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-transparent">
                          <h3 className="font-bold text-slate-900">Student Marks - {selectedMarksUnit}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Admission No</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Student Name</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700">Mark</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700">Absent</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {students.map((student) => (
                                <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-slate-900">{student.admission_number}</td>
                                  <td className="px-4 py-3 text-slate-700">{student.full_name}</td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="0"
                                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <input type="checkbox" className="w-4 h-4" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                          <button className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
                            Save as Draft
                          </button>
                          <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                            Submit Marks
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SETUP VIEW */}

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

              {/* Campus Selection - Pill Buttons */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-3">Campus *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSetupForm({ ...setupForm, campus: 'main', course_id: '', selected_units: [], selected_class_ids: [] })}
                    className={`flex-1 px-5 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                      setupForm.campus === 'main'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="block text-lg mb-1">🏛️</span>
                    Main Campus
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupForm({ ...setupForm, campus: 'west', course_id: '', selected_units: [], selected_class_ids: [] })}
                    className={`flex-1 px-5 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                      setupForm.campus === 'west'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="block text-lg mb-1">🌍</span>
                    West Campus
                  </button>
                </div>
              </div>

              {/* Course Selection - Searchable */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Select Course *</label>
                {selectedExamBody && courses.length > 5 && (
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full px-4 py-2.5 mb-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                <select
                  value={setupForm.course_id}
                  onChange={(e) => {
                    const courseId = e.target.value;
                    setSetupForm({ ...setupForm, course_id: courseId, selected_units: [], selected_class_ids: [] });
                    setCourseSearch('');
                    setAvailableClasses([]);
                    loadUnitsForCourse(courseId);
                    loadClassesForCourse(courseId);
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={!selectedExamBody}
                >
                  <option value="">{selectedExamBody ? (courses.length > 0 ? 'Select a course' : 'No courses found') : 'Select an exam body first'}</option>
                  {courses
                    .filter((c) => !courseSearch || c.name.toLowerCase().includes(courseSearch.toLowerCase()))
                    .map((course) => (
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
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Submission Status</h1>
                  <p className="text-slate-600">Track the status of your mark submissions</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-transparent">
                    <h2 className="font-bold text-slate-900">Unit Submission Overview</h2>
                  </div>
                  {submissionStatus.size === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-slate-500">📊 No marks recorded yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {Array.from(submissionStatus.entries()).map(([unitCode, stats]) => (
                        <div key={unitCode} className="p-6 hover:bg-purple-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-slate-900">{unitCode}</h3>
                              <p className="text-sm text-slate-500 mt-1">
                                {stats.submitted} of {stats.total} students submitted
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${(stats.submitted / stats.total) * 100}%` }}
                                />
                              </div>
                              {stats.submitted === stats.total ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold whitespace-nowrap">
                                  ✓ Complete
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold whitespace-nowrap">
                                  ⏳ Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Submission Guidelines</h3>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-3">
                      <span className="text-blue-600 font-bold flex-shrink-0">1</span>
                      <span>Save marks as draft before final submission</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-blue-600 font-bold flex-shrink-0">2</span>
                      <span>Once submitted, marks cannot be edited</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-blue-600 font-bold flex-shrink-0">3</span>
                      <span>Results are automatically released for fee-cleared students</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-blue-600 font-bold flex-shrink-0">4</span>
                      <span>Students with fee holds will see results after reaching 95% clearance</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}