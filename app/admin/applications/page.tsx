'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import { getCourseTypeConfig, getUnitsForPeriod } from '@/lib/course-structure';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

interface Application {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  kcse_grade: string;
  course: string;
  course_type?: string;
  course_type_id?: string;
  campus: string;
  application_date: string;
  admission_number: string;
  status: 'pending' | 'enrolled' | 'rejected';
  current_module?: number;
  current_semester?: number;
  class_id?: string;
  classes?: { class_name: string };
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [importErrors, setImportErrors] = useState<string[]>([]);

  useEffect(() => {
    setSupabase(createClient());
  }, []);
  const [newAdmissionNumber, setNewAdmissionNumber] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  
  // Class selection for enrollment
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  // Manual student entry form data
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    phone: '',
    email: '',
    kcse_grade: '',
    course: '',
    course_type: '',
    campus: campus,
    gender: '',
    admission_number: '',
    application_date: '',
    current_module: 1,
    current_semester: 1
  });
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [availableCourseTypes, setAvailableCourseTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login/admin');
        return;
      }

      // Verify user has admin role
      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'admin') {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'lecturer') {
          router.push('/lecturer/dashboard');
        } else if (userRole === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/login/admin');
        }
        return;
      }

      // Get user metadata to determine campus
      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);

      // Load applications (placeholder data - will be replaced with Supabase query)
      loadApplications(userCampus);
    };

    checkAuth();
  }, [supabase, router]);

  // Fetch courses when add student modal opens
  useEffect(() => {
    const fetchCourses = async () => {
      if (!supabase || !showAddStudentModal) return;
      
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, course_types (level, enabled)')
        .order('name');
      
      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        setAllCourses(data || []);
      }
    };
    
    fetchCourses();
  }, [supabase, showAddStudentModal]);

  // Update available course types when course is selected
  useEffect(() => {
    if (!newStudent.course) {
      setAvailableCourseTypes([]);
      return;
    }

    const selectedCourse = allCourses.find(c => c.id === newStudent.course);
    if (selectedCourse?.course_types) {
      const enabledTypes = selectedCourse.course_types
        .filter((ct: any) => ct.enabled)
        .map((ct: any) => ct.level);
      setAvailableCourseTypes(enabledTypes);
    }
  }, [newStudent.course, allCourses]);

  // Sync campus with admin's campus when it changes
  useEffect(() => {
    if (campus) {
      setNewStudent(prev => ({ ...prev, campus }));
    }
  }, [campus]);

  const loadApplications = async (campusCode: string) => {
    try {
      let query = supabase
        .from('applications')
        .select('*, courses(name), course_types(level), classes(class_name)')
        .order('application_date', { ascending: false });

      // Filter by campus to show only this campus's applications
      // Handle both 'main'/'west' and 'Main Campus'/'West Campus' formats
      if (campusCode && campusCode !== 'all') {
        const campusVariants = [
          campusCode,
          campusCode === 'main' ? 'Main Campus' : campusCode === 'west' ? 'West Campus' : campusCode,
          campusCode === 'Main Campus' ? 'main' : campusCode === 'West Campus' ? 'west' : campusCode
        ];
        query = query.in('campus', campusVariants);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading applications:', error);
        setError('Failed to load applications: ' + error.message);
        setApplications([]);
      } else {
        console.log('Loaded applications:', data);
        // Flatten the data for the UI
        const enrichedData = (data || []).map((app: any) => ({
          ...app,
          course: app.courses?.name,
          course_type: app.course_types?.level
        }));
        setApplications(enrichedData);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollClick = async (application: Application) => {
    setSelectedApplication(application);
    setNewAdmissionNumber('');
    setSelectedClassId('');
    setError('');
    
    // Load available classes for this course and campus
    if (supabase && application.course && application.campus) {
      const normalizedCampus = application.campus.toLowerCase().includes('west') ? 'west' : 'main';
      
      // Try to load classes - if table doesn't exist or no classes, show message
      try {
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id, class_name, semester, module_index, intake_month, is_active')
          .eq('course_id', application.course)
          .eq('campus', normalizedCampus)
          .eq('is_active', true)
          .order('class_name');
        
        if (classesError) {
          console.log('Classes table error:', classesError);
          setAvailableClasses([]);
        } else {
          setAvailableClasses(classesData || []);
        }
      } catch (err) {
        console.log('Classes table may not exist yet');
        setAvailableClasses([]);
      }
    }
    
    setShowEnrollModal(true);
  };

  const generateClassName = (applicationDate: string): string => {
    const date = new Date(applicationDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const handleAddStudent = async () => {
    if (!newStudent.full_name || !newStudent.phone || !newStudent.kcse_grade || 
        !newStudent.course || !newStudent.course_type || !newStudent.campus || !newStudent.gender || 
        !newStudent.admission_number || !newStudent.application_date) {
      setError('Please fill in all required fields');
      return;
    }

    setEnrolling(true);
    setError('');

    try {
      // Generate class name based on original admission date
      const className = generateClassName(newStudent.application_date);

      // Get course_id and course_type_id from database
      const selectedCourse = allCourses.find(c => c.id === newStudent.course);
      const courseTypeData = selectedCourse?.course_types?.find((ct: any) => ct.level === newStudent.course_type);
      const courseTypeId = courseTypeData?.id;

      if (!courseTypeId) {
        setError('Invalid course type selection. Please try again.');
        setEnrolling(false);
        return;
      }

      // Insert student directly as enrolled
      const { error: insertError } = await supabase
        .from('applications')
        .insert([{
          full_name: newStudent.full_name,
          phone: newStudent.phone,
          email: newStudent.email || null,
          kcse_grade: newStudent.kcse_grade,
          course_id: newStudent.course,
          course_type_id: courseTypeId,
          campus: newStudent.campus,
          gender: newStudent.gender,
          admission_number: newStudent.admission_number,
          application_date: newStudent.application_date,
          status: 'enrolled',
          current_semester: newStudent.current_semester,
          class_name: className
        }]);

      if (insertError) {
        setError('Failed to add student: ' + insertError.message);
        return;
      }

      // Reload applications
      loadApplications(campus);

      // Reset form
      setNewStudent({
        full_name: '',
        phone: '',
        email: '',
        kcse_grade: '',
        course: '',
        course_type: '',
        campus: '',
        gender: '',
        admission_number: '',
        application_date: '',
        current_module: 1,
        current_semester: 1
      });

      setShowAddStudentModal(false);
      setError('Student added successfully!');
    } catch (err) {
      setError('Failed to add student. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnroll = async () => {
    if (!newAdmissionNumber.trim()) {
      setError('Please enter an admission number');
      return;
    }

    setEnrolling(true);
    setError('');

    try {
      // Auto-generate class name based on enrollment date, course name, and course type
      const enrollmentDate = selectedApplication?.application_date || new Date().toISOString().split('T')[0];
      const date = new Date(enrollmentDate);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      // Fetch course details from database
      const courseId = selectedApplication?.course;
      let courseName = 'Unknown';
      let courseLevel = 'General';
      let validCourseId = courseId;
      
      if (courseId) {
        // Check if course exists in courses table
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, name')
          .eq('id', courseId)
          .single();
        
        if (courseError || !courseData) {
          // If course_id doesn't exist, try to find course by name
          const { data: courseByName } = await supabase
            .from('courses')
            .select('id, name')
            .ilike('name', `%${courseId}%`)
            .limit(1)
            .single();
          
          if (courseByName) {
            validCourseId = courseByName.id;
            courseName = courseByName.name;
          } else {
            setError(`Course not found in database: ${courseId}`);
            setEnrolling(false);
            return;
          }
        } else {
          courseName = courseData.name;
        }
        
        // Get course type/level
        const { data: courseTypeData } = await supabase
          .from('course_types')
          .select('level')
          .eq('course_id', validCourseId)
          .single();
        
        if (courseTypeData) {
          courseLevel = courseTypeData.level;
        }
      }
      
      // Simple abbreviation logic
      const abbreviateLevel = (level: string): string => {
        const l = level.toLowerCase();
        if (l.includes('diploma')) return 'D';
        if (l.includes('certificate')) return 'C';
        if (l.includes('artisan')) return 'A';
        if (l.includes('craft')) return 'CR';
        if (l.includes('level6')) return 'L6';
        if (l.includes('level5')) return 'L5';
        if (l.includes('level4')) return 'L4';
        return 'G';
      };
      
      // Simple course name abbreviation - take first 3-4 letters, uppercase
      const abbreviateCourse = (name: string): string => {
        // Remove common words and spaces
        const cleaned = name.replace(/information|communication|technology|engineering|management|studies|science|arts/gi, '').trim();
        // Take first 3-4 characters, uppercase
        return cleaned.substring(0, 4).toUpperCase();
      };
      
      const levelAbbr = abbreviateLevel(courseLevel);
      const courseAbbr = abbreviateCourse(courseName);
      
      // Generate abbreviated class name: "D-ICT-Apr2026"
      const className = `${levelAbbr}-${courseAbbr}-${month}${year}`;
      
      // Check if class already exists
      const normalizedCampus = selectedApplication?.campus?.toLowerCase().includes('west') ? 'west' : 'main';
      let classId = selectedClassId;
      
      const { data: existingClass } = await supabase
        .from('classes')
        .select('id, semester, module_index')
        .eq('class_name', className)
        .eq('campus', normalizedCampus)
        .single();
      
      if (existingClass) {
        classId = existingClass.id;
      } else {
        // Create new class (academic_calendar_id is now nullable)
        const { data: newClass, error: classError } = await supabase
          .from('classes')
          .insert([{
            class_name: className,
            course_id: validCourseId,
            campus: normalizedCampus,
            semester: 1,
            module_index: 1,
            intake: month,
            intake_month: month,
            is_active: true
          }])
          .select()
          .single();
        
        if (classError) {
          setError('Failed to create class: ' + classError.message);
          return;
        }
        classId = newClass.id;
      }

      // Update application status and admission number in Supabase
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'enrolled',
          admission_number: newAdmissionNumber,
          current_module: 1,
          current_semester: 1,
          class_id: classId
        })
        .eq('id', selectedApplication?.id);

      if (updateError) {
        setError('Failed to enroll student: ' + updateError.message);
        return;
      }

      // Reload applications
      loadApplications(campus);

      setShowEnrollModal(false);
      setSelectedApplication(null);
      setNewAdmissionNumber('');
      setError('Student enrolled successfully!');
    } catch (err) {
      setError('Failed to enroll student. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      // Update application status to rejected in Supabase
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (updateError) {
        setError('Failed to reject application: ' + updateError.message);
        return;
      }

      // Reload applications
      loadApplications(campus);
    } catch (err) {
      setError('Failed to reject application. Please try again.');
    }
  };

  const handleUpgradeSemester = async (application: Application) => {
    if (!application.admission_number) {
      setError('Student must have an admission number to upgrade semester');
      return;
    }

    if (!application.current_semester || !application.current_module) {
      setError('Student current module or semester not set');
      return;
    }

    try {
      // Check if student has completed all exams in current semester
      const { data: examMarks, error: marksError } = await supabase
        .from('exam_marks')
        .select('*')
        .eq('admission_number', application.admission_number)
        .eq('semester', application.current_semester);

      if (marksError) {
        setError('Failed to check exam marks: ' + marksError.message);
        return;
      }

      if (!examMarks || examMarks.length === 0) {
        setError('Student has not completed any exams in current semester');
        return;
      }

      // Get course to determine required units
      const { data: courseData } = await supabase
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
        .eq('name', application.course)
        .single();

      if (!courseData) {
        setError('Course not found');
        return;
      }

      // Get required units based on course type and fee structure
      const courseType = application.course_type || 'diploma';
      const normalized = getCourseTypeConfig(courseData.course_types, courseType);
      if (!normalized) {
        setError('Course type data not found for this student');
        return;
      }

      if (normalized.studyMode === 'short-course') {
        setError('Short course students do not have semester upgrades');
        return;
      }

      // Calculate next module/semester (3 semesters per module)
      let nextModule = application.current_module;
      let nextSemester = application.current_semester + 1;

      if (nextSemester > 3) {
        nextSemester = 1;
        nextModule += 1;
      }

      // Check if student has completed all modules
      // TODO: Update after normalization function is updated for new module structure
      // if (nextModule > (normalized.modules?.length || normalized.periods?.length || 0)) {
      //   setError('Student has completed all modules and semesters');
      //   return;
      // }

      const completedUnits = examMarks.map((m: any) => m.unit);

      // Check if student has completed all units for current semester
      // Note: This needs to be updated to work with the new units table structure
      // For now, we'll allow the upgrade if there are exam marks

      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          current_module: nextModule,
          current_semester: nextSemester
        })
        .eq('id', application.id);

      if (updateError) {
        setError('Failed to upgrade semester: ' + updateError.message);
        return;
      }

      loadApplications(campus);
      setError(`Student upgraded to Module ${nextModule}, Semester ${nextSemester}`);
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError('Failed to upgrade semester. Please try again.');
    }
  };

  const getCampusName = (campusCode: string) => {
    const lowerCode = campusCode?.toLowerCase() || '';
    if (lowerCode.includes('main')) return 'Main Campus';
    if (lowerCode.includes('west')) return 'West Campus';
    return campusCode || 'Unknown Campus';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400';
      case 'enrolled':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'enrolled':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      default:
        return 'bg-white/10 border-white/30 text-white';
    }
  };

  // Bulk Import Functions
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImportErrors([]);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validData = results.data.filter((row: any) => 
          row.full_name && row.phone && row.admission_number
        );
        setCsvData(validData);
        setImportProgress({ current: 0, total: validData.length, success: 0, failed: 0 });
      },
      error: (error) => {
        setImportErrors(['Failed to parse CSV: ' + error.message]);
      }
    });
  };

  const generateClassNameFromDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const handleBulkImport = async () => {
    if (csvData.length === 0) {
      setImportErrors(['No valid data to import']);
      return;
    }

    setEnrolling(true);
    setImportErrors([]);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      setImportProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        // Validate required fields
        if (!row.full_name || !row.phone || !row.kcse_grade || 
            !row.course || !row.course_type || !row.campus || !row.gender || 
            !row.admission_number || !row.application_date) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          failedCount++;
          continue;
        }

        // Find course_id
        const course = allCourses.find(c => 
          c.name.toLowerCase() === row.course.toLowerCase() ||
          c.id === row.course
        );
        
        if (!course) {
          errors.push(`Row ${i + 1}: Course "${row.course}" not found`);
          failedCount++;
          continue;
        }

        // Find course_type_id
        const courseTypeData = course.course_types?.find((ct: any) => 
          ct.level.toLowerCase() === row.course_type.toLowerCase()
        );
        
        if (!courseTypeData) {
          errors.push(`Row ${i + 1}: Course type "${row.course_type}" not found for ${row.course}`);
          failedCount++;
          continue;
        }

        // Generate class name
        const className = generateClassNameFromDate(row.application_date);

        // Insert student
        const { error: insertError } = await supabase
          .from('applications')
          .insert([{
            full_name: row.full_name,
            phone: row.phone,
            email: row.email || null,
            kcse_grade: row.kcse_grade,
            course_id: course.id,
            course_type_id: courseTypeData.id,
            campus: row.campus.toLowerCase(),
            gender: row.gender.toLowerCase(),
            admission_number: row.admission_number,
            application_date: row.application_date,
            status: 'enrolled',
            current_semester: parseInt(row.current_semester) || 1,
            class_name: className
          }]);

        if (insertError) {
          errors.push(`Row ${i + 1}: ${insertError.message}`);
          failedCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        errors.push(`Row ${i + 1}: Failed to import`);
        failedCount++;
      }
    }

    setImportProgress(prev => ({ ...prev, success: successCount, failed: failedCount }));
    setImportErrors(errors);
    
    if (successCount > 0) {
      loadApplications(campus);
    }
    
    setEnrolling(false);
  };

  const downloadTemplate = () => {
    const template = `full_name,phone,email,kcse_grade,course,course_type,campus,gender,admission_number,application_date,current_semester
John Doe,0712345678,john@example.com,B+,Diploma in ICT,Diploma,main,male,EAVI/2024/001,2024-01-15,1
Jane Smith,0723456789,jane@example.com,A-,Certificate in Business,Certificate,west,female,EAVI/2024/002,2024-01-15,1`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/admin/dashboard" className="relative w-10 h-10 md:w-12 md:h-12">
                  <Image
                    src="/logo.webp"
                    alt="EAVI Logo"
                    fill
                    className="object-contain"
                  />
                </Link>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white">Student Applications</h1>
                  <p className="text-purple-200 text-xs md:text-sm">Manage student applications and enrollments</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs md:text-sm font-semibold"
                >
                  Add Existing Student
                </button>
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs md:text-sm font-semibold"
                >
                  Bulk Import (CSV)
                </button>
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-xs md:text-sm font-semibold text-center"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Student Applications</h2>

            {applications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-purple-200">No applications to display.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-semibold text-sm">{application.full_name}</h3>
                          <p className="text-purple-300 text-xs">{application.phone}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-purple-300">Email:</span>
                          <span className="text-white">{application.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">KCSE Grade:</span>
                          <span className="text-white">{application.kcse_grade}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Course:</span>
                          <span className="text-white">{application.course}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Type:</span>
                          <span className="text-white capitalize">{application.course_type || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Admission No:</span>
                          <span className="text-white font-mono">{application.admission_number || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Module/Sem:</span>
                          <span className="text-white">
                            {application.current_module && application.current_semester 
                              ? `M${application.current_module}/S${application.current_semester}`
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Class:</span>
                          <span className="text-white">{application.classes?.class_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Applied:</span>
                          <span className="text-white">{new Date(application.application_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {application.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEnrollClick(application)}
                              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-semibold"
                            >
                              Enroll
                            </button>
                            <button
                              onClick={() => handleReject(application.id)}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {application.status === 'enrolled' && (
                          <button
                            onClick={() => handleUpgradeSemester(application)}
                            disabled={!application.current_semester || !application.current_module}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs font-semibold"
                          >
                            Upgrade
                          </button>
                        )}
                        {application.status === 'rejected' && (
                          <span className="text-red-400 text-xs">Rejected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Name</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Phone</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Email</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">KCSE Grade</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Course</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Type</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Application Date</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Status</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Admission No.</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Module/Sem</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Class</th>
                        <th className="text-left py-3 px-4 text-white font-semibold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((application) => (
                        <tr key={application.id} className="border-b border-white/10 hover:bg-white/5">
                          <td className="py-4 px-4 text-white text-sm">{application.full_name}</td>
                          <td className="py-4 px-4 text-white text-sm">{application.phone}</td>
                          <td className="py-4 px-4 text-white text-sm">{application.email || '-'}</td>
                          <td className="py-4 px-4 text-white text-sm">{application.kcse_grade}</td>
                          <td className="py-4 px-4 text-white text-sm">{application.course}</td>
                          <td className="py-4 px-4 text-white text-sm capitalize">{application.course_type || '-'}</td>
                          <td className="py-4 px-4 text-white text-sm">
                            {new Date(application.application_date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(application.status)}`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-white text-sm font-mono">
                            {application.admission_number || '-'}
                          </td>
                          <td className="py-4 px-4 text-white text-sm">
                            {application.current_module && application.current_semester 
                              ? `M${application.current_module}/S${application.current_semester}`
                              : '-'}
                          </td>
                          <td className="py-4 px-4 text-white text-sm">
                            {application.classes?.class_name || '-'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              {application.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleEnrollClick(application)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
                                  >
                                    Enroll
                                  </button>
                                  <button
                                    onClick={() => handleReject(application.id)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {application.status === 'enrolled' && (
                                <>
                                  <button
                                    onClick={() => handleUpgradeSemester(application)}
                                    disabled={!application.current_semester || !application.current_module}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
                                  >
                                    Upgrade
                                  </button>
                                </>
                              )}
                              {application.status === 'rejected' && (
                                <span className="text-red-400 text-xs">Rejected</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Enroll Student</h3>
            <div className="mb-4">
              <p className="text-purple-200 text-sm mb-2">
                Enrolling: {selectedApplication?.full_name}
              </p>
              <p className="text-purple-200 text-sm mb-2">
                <span className="font-semibold">Course:</span> {selectedApplication?.course}
              </p>
              <p className="text-purple-200 text-sm mb-4">
                <span className="font-semibold">Campus:</span> {getCampusName(selectedApplication?.campus)}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="admissionNumber" className="block text-white font-medium mb-2 text-sm">
                Admission Number *
              </label>
              <input
                type="text"
                id="admissionNumber"
                value={newAdmissionNumber}
                onChange={(e) => setNewAdmissionNumber(e.target.value)}
                placeholder="e.g., EAVI/2024/001"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            <div className="mb-4 p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <p className="text-purple-200 text-sm">
                <span className="font-semibold">Auto-generated Class:</span> {selectedApplication?.course} - {selectedApplication?.course_type} - {new Date(selectedApplication?.application_date || new Date()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrolling ? 'Enrolling...' : 'Enroll'}
              </button>
              <button
                onClick={() => setShowEnrollModal(false)}
                disabled={enrolling}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg transition-colors duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Existing Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Add Existing Student</h3>
            <p className="text-purple-200 text-sm mb-6">
              Add a student who was manually admitted before the system was implemented.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-white font-medium mb-2 text-sm">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={newStudent.full_name}
                    onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-white font-medium mb-2 text-sm">
                    Phone *
                  </label>
                  <input
                    type="text"
                    id="phone"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-white font-medium mb-2 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="Enter email (optional)"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="kcseGrade" className="block text-white font-medium mb-2 text-sm">
                    KCSE Grade *
                  </label>
                  <input
                    type="text"
                    id="kcseGrade"
                    value={newStudent.kcse_grade}
                    onChange={(e) => setNewStudent({ ...newStudent, kcse_grade: e.target.value })}
                    placeholder="Enter KCSE grade"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="course" className="block text-white font-medium mb-2 text-sm">
                    Course *
                  </label>
                  <select
                    id="course"
                    value={newStudent.course}
                    onChange={(e) => {
                      setNewStudent({ ...newStudent, course: e.target.value, course_type: '' });
                    }}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="">Select course</option>
                    {allCourses.map(course => (
                      <option key={course.id} value={course.id} className="text-gray-900">{course.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="courseType" className="block text-white font-medium mb-2 text-sm">
                    Course Type *
                  </label>
                  <select
                    id="courseType"
                    value={newStudent.course_type}
                    onChange={(e) => setNewStudent({ ...newStudent, course_type: e.target.value })}
                    required
                    disabled={!newStudent.course || availableCourseTypes.length === 0}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!newStudent.course ? 'Select course first' : availableCourseTypes.length === 0 ? 'No types available' : 'Select type'}
                    </option>
                    {availableCourseTypes.map(type => (
                      <option key={type} value={type} className="text-gray-900 capitalize">{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="campus" className="block text-white font-medium mb-2 text-sm">
                    Campus *
                  </label>
                  <select
                    id="campus"
                    value={newStudent.campus}
                    onChange={(e) => setNewStudent({ ...newStudent, campus: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="">Select campus</option>
                    <option value="west" className="text-gray-900">West Campus</option>
                    <option value="main" className="text-gray-900">Main Campus</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gender" className="block text-white font-medium mb-2 text-sm">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male" className="text-gray-900">Male</option>
                    <option value="female" className="text-gray-900">Female</option>
                    <option value="other" className="text-gray-900">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admissionNumber" className="block text-white font-medium mb-2 text-sm">
                    Admission Number *
                  </label>
                  <input
                    type="text"
                    id="admissionNumber"
                    value={newStudent.admission_number}
                    onChange={(e) => setNewStudent({ ...newStudent, admission_number: e.target.value })}
                    placeholder="Enter admission number"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="currentSemester" className="block text-white font-medium mb-2 text-sm">
                    Current Semester *
                  </label>
                  <select
                    id="currentSemester"
                    value={newStudent.current_semester}
                    onChange={(e) => setNewStudent({ ...newStudent, current_semester: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="applicationDate" className="block text-white font-medium mb-2 text-sm">
                  Original Admission Date *
                </label>
                <input
                  type="date"
                  id="applicationDate"
                  value={newStudent.application_date}
                  onChange={(e) => setNewStudent({ ...newStudent, application_date: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <p className="text-purple-300 text-xs mt-1">This will be used to calculate the class name (e.g., January 2026)</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddStudent}
                disabled={enrolling}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrolling ? 'Adding...' : 'Add Student'}
              </button>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setNewStudent({
                    full_name: '',
                    phone: '',
                    email: '',
                    kcse_grade: '',
                    course: '',
                    course_type: '',
                    campus: '',
                    gender: '',
                    admission_number: '',
                    application_date: '',
                    current_module: 1,
                    current_semester: 1
                  });
                  setError('');
                }}
                disabled={enrolling}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg transition-colors duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Bulk Import Students (CSV)</h3>
            <p className="text-purple-200 text-sm mb-6">
              Import multiple existing students from a CSV file.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold mb-4"
              >
                Download CSV Template
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-white font-medium mb-2 text-sm">
                Upload CSV File *
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              />
              {csvFile && (
                <p className="text-green-400 text-sm mt-2">
                  Selected: {csvFile.name} ({csvData.length} students)
                </p>
              )}
            </div>

            {csvData.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Preview (First 5 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2 px-2 text-purple-200">Name</th>
                        <th className="text-left py-2 px-2 text-purple-200">Phone</th>
                        <th className="text-left py-2 px-2 text-purple-200">Course</th>
                        <th className="text-left py-2 px-2 text-purple-200">Type</th>
                        <th className="text-left py-2 px-2 text-purple-200">Campus</th>
                        <th className="text-left py-2 px-2 text-purple-200">Admission No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-2 px-2 text-white">{row.full_name}</td>
                          <td className="py-2 px-2 text-white">{row.phone}</td>
                          <td className="py-2 px-2 text-white">{row.course}</td>
                          <td className="py-2 px-2 text-white">{row.course_type}</td>
                          <td className="py-2 px-2 text-white">{row.campus}</td>
                          <td className="py-2 px-2 text-white font-mono">{row.admission_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importProgress.total > 0 && (
              <div className="mb-6 p-4 bg-white/5 rounded-lg">
                <p className="text-white text-sm mb-2">
                  Progress: {importProgress.current} / {importProgress.total}
                </p>
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-green-400 text-sm">Success: {importProgress.success}</p>
                <p className="text-red-400 text-sm">Failed: {importProgress.failed}</p>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-500/20 rounded-lg max-h-40 overflow-y-auto">
                <h4 className="text-red-300 font-semibold mb-2">Errors ({importErrors.length})</h4>
                {importErrors.map((err, idx) => (
                  <p key={idx} className="text-red-200 text-xs mb-1">{err}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBulkImport}
                disabled={enrolling || csvData.length === 0}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
              >
                {enrolling ? 'Importing...' : `Import ${csvData.length} Students`}
              </button>
              <button
                onClick={() => {
                  setShowBulkImportModal(false);
                  setCsvData([]);
                  setCsvFile(null);
                  setImportErrors([]);
                  setImportProgress({ current: 0, total: 0, success: 0, failed: 0 });
                }}
                disabled={enrolling}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg transition-colors duration-300 text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
