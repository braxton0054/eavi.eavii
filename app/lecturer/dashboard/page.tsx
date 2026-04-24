'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import { getAllUnits, getCourseTypeConfig } from '@/lib/course-structure';

export default function LecturerDashboard() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lecturerInfo, setLecturerInfo] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [viewMode, setViewMode] = useState<'setup' | 'dashboard' | 'marks'>('setup');
  const [error, setError] = useState('');

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Setup form data
  const [setupData, setSetupData] = useState({
    campus: '',
    department: '',
    course: '',
    units: [] as string[]
  });

  // Courses data from Supabase
  const [courses, setCourses] = useState<any[]>([]);

  // Marks input form data
  const [marksData, setMarksData] = useState({
    selectedAssignmentId: '',
    selectedCourse: '',
    selectedClass: '',
    selectedUnit: '',
    semester: '',
    examType: '',
    marks: [] as any[]
  });

  // Track if semester should be locked (when unit clicked from dashboard)
  const [lockSemester, setLockSemester] = useState(false);

  // Track if unit should be locked (when unit clicked from dashboard)
  const [lockUnit, setLockUnit] = useState(false);

  // Load students when course, unit, semester, and exam type are selected
  useEffect(() => {
    if (!supabase) return;

    const loadStudents = async () => {
      if (marksData.selectedCourse && marksData.selectedUnit && marksData.semester && marksData.examType) {
        const selectedAssignment = assignments.find(a => a.id === marksData.selectedAssignmentId);
        const campus = selectedAssignment?.campus || '';
        const className = marksData.selectedClass || selectedAssignment?.class_name || '';

        // Fetch enrolled students for this course, campus, and class
        let query = supabase
          .from('applications')
          .select('full_name, admission_number')
          .eq('course', marksData.selectedCourse)
          .eq('campus', campus)
          .eq('status', 'enrolled');

        // Filter by class_name if it's set
        if (className) {
          query = query.eq('class_name', className);
        }

        const { data: studentsData } = await query;

        if (studentsData) {
          // Fetch existing marks for these students
          const { data: existingMarks } = await supabase
            .from('exam_marks')
            .select('admission_number, marks, cat_marks, end_term_marks')
            .eq('course', marksData.selectedCourse)
            .eq('unit', marksData.selectedUnit)
            .eq('semester', parseInt(marksData.semester))
            .eq('exam_type', marksData.examType);

          // Create a map of existing marks by admission number
          const marksMap = new Map();
          if (existingMarks) {
            existingMarks.forEach((mark: any) => {
              marksMap.set(mark.admission_number, mark);
            });
          }

          // Merge student data with existing marks
          setMarksData({
            ...marksData,
            marks: studentsData.map((student: any) => {
              const existingMark = marksMap.get(student.admission_number);
              return {
                name: student.full_name,
                admission_number: student.admission_number,
                marks: existingMark?.marks || 0,
                cat_marks: existingMark?.cat_marks || null,
                end_term_marks: existingMark?.end_term_marks || null
              };
            })
          });
        }
      }
    };

    loadStudents();
  }, [marksData.selectedAssignmentId, marksData.selectedCourse, marksData.selectedClass, marksData.selectedUnit, marksData.semester, marksData.examType, assignments, supabase]);

  // Load courses from Supabase
  useEffect(() => {
    if (!supabase) return;

    const loadCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_types (
            level,
            enabled,
            min_kcse_grade,
            study_mode,
            duration_months,
            modules (
              module_index,
              exam_body,
              semesters (
                id,
                semester_index,
                duration_months,
                fee,
                practical_fee,
                internal_exams,
                units (
                  name
                )
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
        `);
      if (data && !error) {
        setCourses(data);
      }
    };

    loadCourses();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    checkAuth();
  }, [supabase, router]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login/lecturer');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userMetadata = user.user_metadata;
      if (userMetadata?.role !== 'lecturer') {
        router.push('/login/lecturer');
        return;
      }
      setLecturerInfo(userMetadata);
      
      // Check if lecturer has any assignments
      const { data: assignmentsData } = await supabase
        .from('lecturer_assignments')
        .select('*')
        .eq('lecturer_number', userMetadata.lecturer_number);
      
      if (assignmentsData && assignmentsData.length > 0) {
        setAssignments(assignmentsData);
        setViewMode('dashboard');
      } else {
        setShowSetup(true);
        setViewMode('setup');
      }
    }
    setLoading(false);
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Save lecturer assignment
      const { error } = await supabase.from('lecturer_assignments').insert([{
        lecturer_number: lecturerInfo.lecturer_number,
        campus: setupData.campus,
        department: setupData.department,
        course: setupData.course,
        units: setupData.units
      }]);

      if (error) {
        setError('Failed to save assignment. Please try again.');
        setLoading(false);
        return;
      }

      // Reload assignments
      const { data: assignmentsData } = await supabase
        .from('lecturer_assignments')
        .select('*')
        .eq('lecturer_number', lecturerInfo.lecturer_number);
      
      if (assignmentsData) {
        setAssignments(assignmentsData);
      }

      // Reset form
      setSetupData({
        campus: '',
        department: '',
        course: '',
        units: []
      });

      setShowSetup(false);
      setViewMode('dashboard');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleMarksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!marksData.selectedUnit || !marksData.semester || !marksData.examType) {
        setError('Please select a unit, semester, and exam type');
        setLoading(false);
        return;
      }

      if (marksData.marks.length === 0) {
        setError('No student marks to save');
        setLoading(false);
        return;
      }

      // Enforce exam-sitting limits:
      // "combined" (CAT + End Term) counts as one exam,
      // and "mock" counts as one exam.
      const admissionNumbers = marksData.marks.map((mark) => mark.admission_number);
      const { data: studentRows, error: studentRowsError } = await supabase
        .from('applications')
        .select('admission_number, course_type')
        .in('admission_number', admissionNumbers);

      if (studentRowsError) {
        setError(`Failed to validate exam limits: ${studentRowsError.message}`);
        setLoading(false);
        return;
      }

      const { data: courseRow, error: courseRowError } = await supabase
        .from('courses')
        .select(`
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
        .eq('name', marksData.selectedCourse)
        .single();

      if (courseRowError || !courseRow?.course_types) {
        setError(`Failed to load course setup for exam limits: ${courseRowError?.message || 'Course not found'}`);
        setLoading(false);
        return;
      }

      const { data: existingExamRows, error: existingExamRowsError } = await supabase
        .from('exam_marks')
        .select('admission_number, exam_type')
        .eq('course', marksData.selectedCourse)
        .eq('unit', marksData.selectedUnit)
        .eq('semester', parseInt(marksData.semester))
        .in('admission_number', admissionNumbers);

      if (existingExamRowsError) {
        setError(`Failed to validate existing exam records: ${existingExamRowsError.message}`);
        setLoading(false);
        return;
      }

      const studentTypeMap = new Map<string, string>(
        (studentRows || []).map((row: any) => [row.admission_number, row.course_type || 'diploma'])
      );

      const existingExamTypeMap = new Map<string, Set<string>>();
      (existingExamRows || []).forEach((row: any) => {
        if (!existingExamTypeMap.has(row.admission_number)) {
          existingExamTypeMap.set(row.admission_number, new Set<string>());
        }
        existingExamTypeMap.get(row.admission_number)!.add(row.exam_type);
      });

      for (const mark of marksData.marks) {
        const courseType = studentTypeMap.get(mark.admission_number) || 'diploma';
        const typeConfig = getCourseTypeConfig(courseRow.course_types, courseType);

        if (!typeConfig) continue;
        if (typeConfig.studyMode === 'short-course' && !typeConfig.shortCourseHasExams) {
          setError(`${mark.name} (${mark.admission_number}) is in a short course without exams.`);
          setLoading(false);
          return;
        }
        if (typeConfig.studyMode === 'short-course') continue;

        const periodConfig = typeConfig.periods[Math.max(parseInt(marksData.semester) - 1, 0)];
        if (!periodConfig) {
          setError(`${mark.name} (${mark.admission_number}) has no configured period ${marksData.semester} for this course type.`);
          setLoading(false);
          return;
        }
        const allowedExamSittings = Math.max(periodConfig?.internalExams ?? 1, 1);
        const existingTypes = existingExamTypeMap.get(mark.admission_number) || new Set<string>();
        const willAddNewType = !existingTypes.has(marksData.examType);
        const resultingSittings = existingTypes.size + (willAddNewType ? 1 : 0);

        if (resultingSittings > allowedExamSittings) {
          setError(
            `${mark.name} (${mark.admission_number}) exceeds allowed exams for this period. Allowed: ${allowedExamSittings}, existing: ${existingTypes.size}.`
          );
          setLoading(false);
          return;
        }
      }

      // Get campus from the selected assignment
      const selectedAssignment = assignments.find(a => a.id === marksData.selectedAssignmentId);
      const campus = selectedAssignment?.campus || '';

      // Save marks per student: update existing record first, insert if missing
      for (const mark of marksData.marks) {
        const payload = {
          campus: campus,
          course: marksData.selectedCourse,
          unit: marksData.selectedUnit,
          semester: parseInt(marksData.semester),
          admission_number: mark.admission_number,
          exam_type: marksData.examType,
          marks: mark.marks,
          cat_marks: marksData.examType === 'combined' ? (mark.cat_marks || 0) : null,
          end_term_marks: marksData.examType === 'combined' ? (mark.end_term_marks || 0) : null
        };

        const { data: existingRow, error: existingRowError } = await supabase
          .from('exam_marks')
          .select('id')
          .eq('admission_number', mark.admission_number)
          .eq('course', marksData.selectedCourse)
          .eq('unit', marksData.selectedUnit)
          .eq('semester', parseInt(marksData.semester))
          .eq('exam_type', marksData.examType)
          .maybeSingle();

        if (existingRowError) {
          setError(`Failed to check existing marks: ${existingRowError.message}`);
          setLoading(false);
          return;
        }

        if (existingRow?.id) {
          const { error: updateError } = await supabase.from('exam_marks').update(payload).eq('id', existingRow.id);
          if (updateError) {
            setError(`Failed to update marks: ${updateError.message}`);
            setLoading(false);
            return;
          }
        } else {
          const { error: insertError } = await supabase.from('exam_marks').insert([{ ...payload, created_at: new Date().toISOString() }]);
          if (insertError) {
            setError(`Failed to save marks: ${insertError.message}`);
            setLoading(false);
            return;
          }
        }
      }

      setError('Marks saved successfully!');
      setTimeout(() => {
        setError('');
        setMarksData({
          selectedAssignmentId: '',
          selectedCourse: '',
          selectedClass: '',
          selectedUnit: '',
          semester: '',
          examType: '',
          marks: []
        });
        setViewMode('dashboard');
      }, 2000);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Header */}
      <div className="relative z-10 w-full bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="relative w-12 h-12">
              <Image
                src="/logo.webp"
                alt="EAVI Logo"
                fill
                className="object-contain"
              />
            </Link>
            <div>
              <h1 className="text-white font-bold text-lg">Lecturer Dashboard</h1>
              <p className="text-purple-200 text-sm">{lecturerInfo?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/lecturer/calendar"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              Academic Calendar
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
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

        {/* Setup Mode */}
        {viewMode === 'setup' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Setup Your Teaching Assignments</h2>
            <p className="text-purple-200 mb-6">
              Configure which campus, department, courses, and units you teach. You can add more campuses later.
            </p>

            <form onSubmit={handleSetupSubmit} className="space-y-6">
              {/* Campus Selection */}
              <div>
                <label htmlFor="campus" className="block text-purple-200 text-sm mb-2">
                  Campus *
                </label>
                <select
                  id="campus"
                  name="campus"
                  value={setupData.campus}
                  onChange={(e) => setSetupData({ ...setupData, campus: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Campus</option>
                  <option value="west" className="text-gray-900">West Campus</option>
                  <option value="main" className="text-gray-900">Main Campus</option>
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <label htmlFor="department" className="block text-purple-200 text-sm mb-2">
                  Department *
                </label>
                <select
                  id="department"
                  name="department"
                  value={setupData.department}
                  onChange={(e) => {
                    setSetupData({ ...setupData, department: e.target.value, course: '', units: [] });
                  }}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Department</option>
                  {[...new Set(courses.map(c => c.department))].map(dept => (
                    <option key={dept} value={dept} className="text-gray-900">{dept}</option>
                  ))}
                </select>
              </div>

              {/* Course Selection */}
              <div>
                <label htmlFor="course" className="block text-purple-200 text-sm mb-2">
                  Course *
                </label>
                <select
                  id="course"
                  name="course"
                  value={setupData.course}
                  onChange={(e) => {
                    setSetupData({ ...setupData, course: e.target.value, units: [] });
                  }}
                  required
                  disabled={!setupData.department}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <option value="">Select Course</option>
                  {courses.filter(c => c.department === setupData.department).map(course => {
                    // Get exam body from course types (raw data)
                    let examBody = 'internal';
                    if (course.course_types) {
                      Object.keys(course.course_types).forEach((type) => {
                        const rawType = course.course_types[type];
                        if (rawType && typeof rawType === 'object' && Array.isArray(rawType.modules) && rawType.modules.length > 0) {
                          examBody = rawType.modules[0].exam_body || 'internal';
                        }
                      });
                    }
                    return (
                      <option key={course.id} value={course.name} className="text-gray-900">
                        {course.name} ({examBody.toUpperCase()})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Units Selection */}
              <div>
                <label className="block text-purple-200 text-sm mb-2">
                  Units You Teach *
                </label>
                {setupData.course ? (
                  <div className="space-y-4">
                    {(() => {
                      const selectedCourse = courses.find(c => c.name === setupData.course);
                      if (!selectedCourse) return null;

                      const allUnits: { semester: number; module: number; unit: string }[] = [];

                      Object.keys(selectedCourse.course_types || {}).forEach((type) => {
                        const normalized = getCourseTypeConfig(selectedCourse.course_types, type);
                        if (!normalized) return;

                        if (normalized.studyMode === 'short-course') {
                          normalized.shortCourseUnits.forEach((unit) => {
                            allUnits.push({ semester: 0, module: 0, unit });
                          });
                          return;
                        }

                        normalized.periods.forEach((period, periodIndex) => {
                          period.units.forEach((unit) => {
                            allUnits.push({ semester: periodIndex + 1, module: periodIndex + 1, unit });
                          });
                        });
                      });

                      return allUnits.length > 0 ? (
                        allUnits.map(({ semester, module, unit }: { semester: number; module: number; unit: string }, index: number) => {
                          // Get exam body for this unit from raw data
                          let unitExamBody = 'internal';
                          if (selectedCourse?.course_types) {
                            Object.keys(selectedCourse.course_types).forEach((type) => {
                              const rawType = selectedCourse.course_types[type];
                              if (rawType && typeof rawType === 'object' && Array.isArray(rawType.modules) && rawType.modules[module - 1]) {
                                unitExamBody = rawType.modules[module - 1].exam_body || 'internal';
                              }
                            });
                          }
                          
                          return (
                            <div key={`${semester}-${module}-${unit}-${index}`} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                              <input
                                type="checkbox"
                                id={`unit-${semester}-${module}-${unit}`}
                                checked={setupData.units.includes(unit)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSetupData({ ...setupData, units: [...setupData.units, unit] });
                                  } else {
                                    setSetupData({ ...setupData, units: setupData.units.filter(u => u !== unit) });
                                  }
                                }}
                                className="w-5 h-5 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                              />
                              <label
                                htmlFor={`unit-${semester}-${module}-${unit}`}
                                className="flex-1 text-white flex items-center gap-2"
                              >
                                <span className="font-semibold">{semester > 0 ? `Sem ${semester} Mod ${module}:` : ''}</span> 
                                <span>{unit}</span>
                                {semester > 0 && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                                    unitExamBody === 'internal' ? 'bg-blue-500/30 text-blue-300' :
                                    unitExamBody === 'JP' ? 'bg-purple-500/30 text-purple-300' :
                                    unitExamBody === 'CDACC' ? 'bg-green-500/30 text-green-300' :
                                    'bg-orange-500/30 text-orange-300'
                                  }`}>
                                    {unitExamBody}
                                  </span>
                                )}
                              </label>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-purple-200 text-sm">No units defined for this course yet.</p>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-purple-200 text-sm">Select a course to view available units.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || setupData.units.length === 0}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Assignment'}
              </button>
            </form>

            {/* Add Another Campus Button */}
            {assignments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <button
                  onClick={() => setShowSetup(true)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold"
                >
                  Add Assignment for Another Campus
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Mode */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Your Teaching Assignments</h2>

            {/* Course Selection Dropdown */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <label htmlFor="courseSelect" className="block text-purple-200 text-sm mb-2 font-semibold">
                Select Course to Input Marks *
              </label>
              <select
                id="courseSelect"
                value={marksData.selectedAssignmentId}
                onChange={(e) => {
                  const assignmentId = e.target.value;
                  const assignment = assignments.find((a) => a.id === assignmentId);
                  const course = assignment?.course || '';
                  // Auto-select current semester (1 for now)
                  const currentMonth = new Date().getMonth() + 1;
                  const currentSemester = currentMonth <= 6 ? 1 : 2;
                  setMarksData({
                    selectedAssignmentId: assignmentId,
                    selectedCourse: course,
                    selectedClass: '',
                    selectedUnit: '',
                    semester: currentSemester.toString(),
                    examType: '',
                    marks: []
                  });
                  setLockSemester(false);
                  setLockUnit(false);
                  setViewMode('marks');
                }}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Course</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id} className="text-gray-900">
                    {assignment.course} - {assignment.campus} Campus
                  </option>
                ))}
              </select>
            </div>

            {/* Show All Assignments with Units */}
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const selectedCourse = courses.find(c => c.name === assignment.course);
                
                // Get exam body and intake info from course types
                let examBody = 'internal';
                let intake = 'September';
                let courseType = 'diploma';
                
                if (selectedCourse?.course_types) {
                  Object.keys(selectedCourse.course_types).forEach((type) => {
                    const rawType = selectedCourse.course_types[type];
                    if (rawType && typeof rawType === 'object') {
                      courseType = type;
                      // Get exam body from first module in raw data
                      if (Array.isArray(rawType.modules) && rawType.modules.length > 0) {
                        examBody = rawType.modules[0].exam_body || 'internal';
                      }
                    }
                  });
                }

                return (
                  <div key={assignment.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="mb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{assignment.course}</h3>
                          <p className="text-purple-200 text-sm capitalize">{assignment.campus} Campus</p>
                          <p className="text-purple-200 text-sm capitalize">{assignment.department} Department</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            examBody === 'internal' ? 'bg-blue-500/20 text-blue-300' :
                            examBody === 'JP' ? 'bg-purple-500/20 text-purple-300' :
                            examBody === 'CDACC' ? 'bg-green-500/20 text-green-300' :
                            'bg-orange-500/20 text-orange-300'
                          }`}>
                            {examBody.toUpperCase()}
                          </span>
                          <p className="text-purple-200 text-xs mt-1 capitalize">{courseType}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-purple-300 text-sm">Intake: {intake}</span>
                        <span className="text-white/30">•</span>
                        <span className="text-purple-300 text-sm">{assignment.units.length} Units</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-purple-200 text-sm font-semibold mb-2">Units You Teach (Click to Input Marks):</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const unitsWithSemester = assignment.units.map((unit: string) => {
                            let unitSemester = '1';
                            let unitModule = '1';
                            let unitExamBody = examBody;
                            
                            if (selectedCourse?.course_types) {
                              Object.keys(selectedCourse.course_types).forEach((type) => {
                                const normalized = getCourseTypeConfig(selectedCourse.course_types, type);
                                if (!normalized || normalized.studyMode === 'short-course') return;
                                normalized.periods.forEach((period, periodIndex) => {
                                  if (period.units.includes(unit)) {
                                    unitSemester = String(periodIndex + 1);
                                    unitModule = String(periodIndex + 1);
                                  }
                                });
                              });
                            }
                            return { unit, semester: unitSemester, module: unitModule, examBody: unitExamBody };
                          });

                          return unitsWithSemester.map(({ unit, semester, module, examBody: unitExamBody }: { unit: string; semester: string; module: string; examBody: string }, index: number) => (
                            <button
                              key={`${assignment.id}-${semester}-${unit}-${index}`}
                              onClick={() => {
                                setMarksData({
                                  selectedAssignmentId: assignment.id,
                                  selectedCourse: assignment.course,
                                  selectedClass: '',
                                  selectedUnit: unit,
                                  semester,
                                  examType: '',
                                  marks: []
                                });
                                setLockSemester(true);
                                setLockUnit(true);
                                setViewMode('marks');
                              }}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs cursor-pointer transition-colors flex items-center gap-2"
                            >
                              <span className="font-semibold">Sem {semester}</span>
                              <span className="text-green-200">Mod {module}</span>
                              <span className="text-green-200">•</span>
                              <span>{unit}</span>
                              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                                unitExamBody === 'internal' ? 'bg-blue-500/30' :
                                unitExamBody === 'JP' ? 'bg-purple-500/30' :
                                unitExamBody === 'CDACC' ? 'bg-green-500/30' :
                                'bg-orange-500/30'
                              }`}>
                                {unitExamBody}
                              </span>
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setViewMode('setup')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold"
            >
              Add Another Course
            </button>
          </div>
        )}

        {/* Marks Input Mode */}
        {viewMode === 'marks' && (
          <form onSubmit={handleMarksSubmit} className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            <button
              type="button"
              onClick={() => {
                setViewMode('dashboard');
                setLockSemester(false);
                setLockUnit(false);
              }}
              className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              ← Back to Dashboard
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">Input Exam Marks</h2>

            {/* Show summary when locked (clicked from dashboard) */}
            {lockUnit && lockSemester && (
              <div className="mb-6 space-y-3 bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-purple-200 text-sm">Course:</span>
                  <span className="text-white font-semibold">{marksData.selectedCourse}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-200 text-sm">Unit:</span>
                  <span className="text-white font-semibold">{marksData.selectedUnit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-200 text-sm">Semester:</span>
                  <span className="text-white font-semibold">Semester {marksData.semester}</span>
                </div>
              </div>
            )}

            {/* Class Selection - hide when locked */}
            {!lockUnit && !lockSemester && (
              <div className="mb-6">
                <label htmlFor="class" className="block text-purple-200 text-sm mb-2">
                  Class (Intake Month/Year)
                </label>
                <select
                  id="class"
                  name="class"
                  value={marksData.selectedClass}
                  onChange={(e) => setMarksData({ ...marksData, selectedClass: e.target.value, marks: [] })}
                  disabled={marksData.semester !== ''}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Classes</option>
                  <option value="January 2026" className="text-gray-900">January 2026</option>
                  <option value="February 2026" className="text-gray-900">February 2026</option>
                  <option value="March 2026" className="text-gray-900">March 2026</option>
                  <option value="April 2026" className="text-gray-900">April 2026</option>
                  <option value="May 2026" className="text-gray-900">May 2026</option>
                  <option value="June 2026" className="text-gray-900">June 2026</option>
                  <option value="July 2026" className="text-gray-900">July 2026</option>
                  <option value="August 2026" className="text-gray-900">August 2026</option>
                  <option value="September 2026" className="text-gray-900">September 2026</option>
                  <option value="October 2026" className="text-gray-900">October 2026</option>
                  <option value="November 2026" className="text-gray-900">November 2026</option>
                  <option value="December 2026" className="text-gray-900">December 2026</option>
                </select>
                {marksData.semester !== '' && (
                  <p className="text-purple-300 text-xs mt-1">Class locked after semester selection</p>
                )}
              </div>
            )}

            {/* Unit Selection - hide when locked */}
            {!lockUnit && (
              <div className="mb-6">
                <label htmlFor="unit" className="block text-purple-200 text-sm mb-2">
                  Select Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={marksData.selectedUnit}
                  onChange={(e) => setMarksData({ ...marksData, selectedUnit: e.target.value })}
                  disabled={lockUnit}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                <option value="">Select Unit</option>
                {(() => {
                  const selectedCourse = courses.find(c => c.name === marksData.selectedCourse);
                  const selectedAssignment = assignments.find(a => a.course === marksData.selectedCourse);

                  let allUnits: string[] = [];

                  if (selectedCourse && selectedCourse.course_types) {
                    Object.keys(selectedCourse.course_types || {}).forEach((type) => {
                      const normalized = getCourseTypeConfig(selectedCourse.course_types, type);
                      if (!normalized) return;
                      const units = getAllUnits(normalized);
                      units.forEach((unit) => {
                        if (!allUnits.includes(unit)) allUnits.push(unit);
                      });
                    });
                  }

                  // Fallback: use lecturer's assigned units if course data has no units
                  if (allUnits.length === 0 && selectedAssignment?.units) {
                    allUnits = selectedAssignment.units;
                  }

                  return allUnits.sort().map((unit, index) => (
                    <option key={index} value={unit} className="text-gray-900">{unit}</option>
                  ));
                })()}
              </select>
            </div>
            )}

            {/* Semester Selection */}
            <div className="mb-6">
              <label htmlFor="semester" className="block text-purple-200 text-sm mb-2">
                Semester *
              </label>
              <select
                id="semester"
                name="semester"
                value={marksData.semester}
                onChange={(e) => setMarksData({ ...marksData, semester: e.target.value })}
                disabled={marksData.selectedClass !== '' || lockSemester}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Semester</option>
                {(() => {
                  const selectedCourse = courses.find((c) => c.name === marksData.selectedCourse);
                  if (!selectedCourse?.course_types) return null;
                  let maxPeriods = 0;
                  Object.keys(selectedCourse.course_types).forEach((type) => {
                    const normalized = getCourseTypeConfig(selectedCourse.course_types, type);
                    if (normalized && normalized.studyMode !== 'short-course') {
                      maxPeriods = Math.max(maxPeriods, normalized.periods.length);
                    }
                  });
                  return Array.from({ length: maxPeriods }, (_, index) => (
                    <option key={index + 1} value={String(index + 1)} className="text-gray-900">
                      Semester {index + 1}
                    </option>
                  ));
                })()}
              </select>
              {lockSemester && (
                <p className="text-purple-300 text-xs mt-1">Semester locked (unit selected from dashboard)</p>
              )}
              {marksData.selectedClass !== '' && (
                <p className="text-purple-300 text-xs mt-1">Semester locked after class selection</p>
              )}
            </div>

            {/* Exam Type Selection - always shown */}
            <div className="mb-6">
              <label htmlFor="examType" className="block text-purple-200 text-sm mb-2">
                Exam Type *
              </label>
              <select
                id="examType"
                name="examType"
                value={marksData.examType}
                onChange={(e) => setMarksData({ ...marksData, examType: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Exam Type</option>
                <option value="combined" className="text-gray-900">CAT + End Term (100 marks)</option>
                <option value="mock" className="text-gray-900">Mock Exam (100 marks)</option>
              </select>
            </div>

            {/* Students List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Students</h3>
              {marksData.selectedCourse && marksData.selectedUnit && marksData.semester ? (
                <div className="bg-white/5 rounded-lg overflow-hidden">
                  {marksData.marks.length === 0 ? (
                    <p className="text-purple-200 text-sm p-4">Loading students...</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/10 border-b border-white/20">
                          <th className="text-center text-purple-200 text-sm font-semibold p-3">Absent</th>
                          <th className="text-left text-purple-200 text-sm font-semibold p-3">Student Name</th>
                          <th className="text-left text-purple-200 text-sm font-semibold p-3">Admission Number</th>
                          {marksData.examType === 'combined' ? (
                            <>
                              <th className="text-center text-purple-200 text-sm font-semibold p-3">CAT (30)</th>
                              <th className="text-center text-purple-200 text-sm font-semibold p-3">End Term (70)</th>
                              <th className="text-center text-purple-200 text-sm font-semibold p-3">Total (100)</th>
                            </>
                          ) : (
                            <th className="text-center text-purple-200 text-sm font-semibold p-3">Marks (100)</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {marksData.marks.map((mark, index) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={mark.absent || false}
                                onChange={(e) => {
                                  const newMarks = [...marksData.marks];
                                  newMarks[index].absent = e.target.checked;
                                  if (e.target.checked) {
                                    newMarks[index].marks = 0;
                                    newMarks[index].cat_marks = 0;
                                    newMarks[index].end_term_marks = 0;
                                  }
                                  setMarksData({ ...marksData, marks: newMarks });
                                }}
                                className="w-5 h-5 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                              />
                            </td>
                            <td className="p-3 text-white text-sm">{mark.name}</td>
                            <td className="p-3 text-purple-300 text-sm">{mark.admission_number}</td>
                            {marksData.examType === 'combined' ? (
                              <>
                                <td className="p-3 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={mark.cat_marks || ''}
                                    onChange={(e) => {
                                      const newMarks = [...marksData.marks];
                                      newMarks[index].cat_marks = e.target.value ? parseInt(e.target.value) : 0;
                                      newMarks[index].marks = (newMarks[index].cat_marks || 0) + (newMarks[index].end_term_marks || 0);
                                      setMarksData({ ...marksData, marks: newMarks });
                                    }}
                                    disabled={mark.absent}
                                    className="w-20 px-3 py-2 bg-white/10 border border-white/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center disabled:opacity-50 disabled:cursor-not-allowed [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="70"
                                    value={mark.end_term_marks || ''}
                                    onChange={(e) => {
                                      const newMarks = [...marksData.marks];
                                      newMarks[index].end_term_marks = e.target.value ? parseInt(e.target.value) : 0;
                                      newMarks[index].marks = (newMarks[index].cat_marks || 0) + (newMarks[index].end_term_marks || 0);
                                      setMarksData({ ...marksData, marks: newMarks });
                                    }}
                                    disabled={mark.absent}
                                    className="w-20 px-3 py-2 bg-white/10 border border-white/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center disabled:opacity-50 disabled:cursor-not-allowed [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                </td>
                                <td className="p-3 text-center text-white font-semibold">
                                  {((mark.cat_marks || 0) + (mark.end_term_marks || 0))}
                                </td>
                              </>
                            ) : (
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={mark.marks || ''}
                                  onChange={(e) => {
                                    const newMarks = [...marksData.marks];
                                    newMarks[index].marks = e.target.value ? parseInt(e.target.value) : 0;
                                    setMarksData({ ...marksData, marks: newMarks });
                                  }}
                                  disabled={mark.absent}
                                  className="w-24 px-3 py-2 bg-white/10 border border-white/30 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-center disabled:opacity-50 disabled:cursor-not-allowed [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                                />
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">
                    Select a course, unit, semester, and exam type to load students.
                  </p>
                </div>
              )}
            </div>

            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newMarks = marksData.marks.map(mark => ({
                    ...mark,
                    absent: true,
                    marks: 0,
                    cat_marks: 0,
                    end_term_marks: 0
                  }));
                  setMarksData({ ...marksData, marks: newMarks });
                }}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={() => {
                  const newMarks = marksData.marks.map(mark => ({
                    ...mark,
                    absent: false
                  }));
                  setMarksData({ ...marksData, marks: newMarks });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Clear All Absent
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Marks'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
