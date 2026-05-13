'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  
  // Part 6: Report tabs
  const [activeTab, setActiveTab] = useState<'enrollment' | 'fees' | 'exams' | 'lecturers' | 'graduation'>('enrollment');
  
  // Enrollment data
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [monthlyEnrollments, setMonthlyEnrollments] = useState<any[]>([]);
  const [genderBreakdown, setGenderBreakdown] = useState<any[]>([]);
  
  // Fee data
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [revenueByCourse, setRevenueByCourse] = useState<any[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<any[]>([]);
  const [feeStructure, setFeeStructure] = useState<any[]>([]);
  const [studentFeeBalance, setStudentFeeBalance] = useState<any[]>([]);
  const [studentsWithGuardians, setStudentsWithGuardians] = useState<any[]>([]);
  // New report views
  const [feeCollectionByMethod, setFeeCollectionByMethod] = useState<any[]>([]);
  const [overdueInstallments, setOverdueInstallments] = useState<any[]>([]);
  const [dailyFeeCollection, setDailyFeeCollection] = useState<any[]>([]);
  const [feeCollectionRate, setFeeCollectionRate] = useState<any[]>([]);
  const [studentsOnHold, setStudentsOnHold] = useState<any[]>([]);
  const [creditBalances, setCreditBalances] = useState<any[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<any[]>([]);
  const [studentStatusBreakdown, setStudentStatusBreakdown] = useState<any[]>([]);
  const [studentsByModule, setStudentsByModule] = useState<any[]>([]);
  const [incompleteProfiles, setIncompleteProfiles] = useState<any[]>([]);
  const [studentsWithoutGuardians, setStudentsWithoutGuardians] = useState<any[]>([]);
  const [passFailSummary, setPassFailSummary] = useState<any[]>([]);
  const [applicationsPipeline, setApplicationsPipeline] = useState<any[]>([]);
  const [enrollmentGrowth, setEnrollmentGrowth] = useState<any[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<any[]>([]);
  const [courseCapacity, setCourseCapacity] = useState<any[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<any[]>([]);
  const [graduationPipeline, setGraduationPipeline] = useState<any[]>([]);
  const [creditExemptions, setCreditExemptions] = useState<any[]>([]);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  
  // Exam data
  const [classResults, setClassResults] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [absentStudents, setAbsentStudents] = useState<any[]>([]);
  
  // Lecturer data
  const [lecturerWorkload, setLecturerWorkload] = useState<any[]>([]);
  const [lecturerSubmissions, setLecturerSubmissions] = useState<any[]>([]);
  
  // Graduation data
  const [completedStudents, setCompletedStudents] = useState<any[]>([]);
  const [upgradeEligible, setUpgradeEligible] = useState<any[]>([]);
  const [reenrolled, setReenrolled] = useState<any[]>([]);
  
  // Filter options
  const [filterIntake, setFilterIntake] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterGender, setFilterGender] = useState('');
  
  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
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

      // Load all report data
      await loadEnrollmentData(userCampus);
      await loadFeeData(userCampus);
      await loadExamData(userCampus);
      await loadLecturerData(userCampus);
      await loadGraduationData(userCampus);
      
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  // Part 6: Load enrollment reports data
  const loadEnrollmentData = async (campusCode: string) => {
    try {
      // Load students
      let query = supabase
        .from('applications')
        .select('*, courses!inner(id, name, departments!inner(name))')
        .order('application_date', { ascending: false });

      if (campusCode && campusCode !== 'all') {
        query = query.eq('campus', campusCode);
      }

      const { data: studentsData } = await query;
      setStudents(studentsData || []);

      // Load courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, name, departments!inner(name)')
        .order('name');
      setCourses(coursesData || []);

      // Load departments
      if (coursesData) {
        const uniqueDepts = [...new Set(coursesData.map((c: any) => c.departments?.name || 'Unknown'))] as string[];
        setDepartments(uniqueDepts);
      }

      // Calculate monthly enrollments
      const monthlyData = (studentsData || []).reduce((acc: any, student: any) => {
        const month = student.application_date?.substring(0, 7) || 'Unknown'; // YYYY-MM
        if (!acc[month]) {
          acc[month] = { month, new: 0, upgrade: 0, transfer: 0, total: 0 };
        }
        acc[month].total++;
        const type = student.enrollment_type || 'new';
        if (type === 'upgrade') acc[month].upgrade++;
        else if (type === 'transfer') acc[month].transfer++;
        else acc[month].new++;
        return acc;
      }, {});
      setMonthlyEnrollments(Object.values(monthlyData).sort((a: any, b: any) => b.month.localeCompare(a.month)));

      // Calculate gender breakdown per course
      const genderData = (studentsData || []).reduce((acc: any, student: any) => {
        const courseName = student.courses?.name || 'Unknown';
        const courseLevel = student.course_types?.level || 'Unknown';
        const key = `${courseName}|${courseLevel}`;
        if (!acc[key]) {
          acc[key] = { course_name: courseName, course_level: courseLevel, male: 0, female: 0, other: 0, total: 0 };
        }
        acc[key].total++;
        const sv = student.student_profiles?.gender || 'other';
        if (sv === 'male') acc[key].male++;
        else if (sv === 'female') acc[key].female++;
        else acc[key].other++;
        return acc;
      }, {});
      setGenderBreakdown(Object.values(genderData).sort((a: any, b: any) => b.total - a.total));

    } catch (err) {
      console.error('Error loading enrollment data:', err);
    }
  };

  // Part 6: Load fee and revenue reports
  const loadFeeData = async (campusCode: string) => {
    try {
      // Get payments
      let paymentsQuery = supabase
        .from('fee_payments')
        .select('amount, payment_date, status, applications!inner(course_id, course_type_id, campus)')
        .eq('status', 'completed')
        .order('payment_date', { ascending: false });
      
      if (campusCode && campusCode !== 'all') {
        paymentsQuery = paymentsQuery.eq('applications.campus', campusCode);
      }
      
      const { data: paymentsData } = await paymentsQuery;

      // Monthly revenue
      const monthlyData = (paymentsData || []).reduce((acc: any, payment: any) => {
        const month = payment.payment_date?.substring(0, 7) || 'Unknown';
        if (!acc[month]) {
          acc[month] = { month, collected: 0, students_paid: new Set() };
        }
        acc[month].collected += payment.amount || 0;
        // Get unique students per month would need application_id
        return acc;
      }, {});
      setMonthlyRevenue(Object.values(monthlyData).sort((a: any, b: any) => b.month.localeCompare(a.month)));

      // Revenue by course
      const courseRevenue = (paymentsData || []).reduce((acc: any, payment: any) => {
        const courseId = payment.applications?.course_id;
        const courseType = payment.applications?.course_type_id || 'Unknown';
        const courseName = courses.find((c: any) => c.id === courseId)?.name || 'Unknown';
        const key = `${courseName}|${courseType}`;
        if (!acc[key]) {
          acc[key] = { course_name: courseName, course_level: courseType, total_collected: 0 };
        }
        acc[key].total_collected += payment.amount || 0;
        return acc;
      }, {});
      setRevenueByCourse(Object.values(courseRevenue).sort((a: any, b: any) => b.total_collected - a.total_collected));

      // Outstanding balances per campus
      let balanceQuery = supabase
        .from('applications')
        .select('campus, total_balance, financial_hold')
        .eq('status', 'enrolled');
      
      if (campusCode && campusCode !== 'all') {
        balanceQuery = balanceQuery.eq('campus', campusCode);
      }
      
      const { data: balanceData } = await balanceQuery;
      
      const campusBalances = (balanceData || []).reduce((acc: any, student: any) => {
        const campusName = student.campus || 'Unknown';
        if (!acc[campusName]) {
          acc[campusName] = { campus: campusName, total_outstanding: 0, total_collected: 0, on_hold: 0 };
        }
        const outstanding = student.total_balance || 0;
        acc[campusName].total_outstanding += outstanding;
        if (student.financial_hold) acc[campusName].on_hold++;
        return acc;
      }, {});
      setOutstandingBalances(Object.values(campusBalances));

      // Load from new vw_ views
      const { data: feeStruct } = await supabase.from('vw_course_fee_structure').select('*').limit(100);
      if (feeStruct) setFeeStructure(feeStruct);

      const { data: feeBalance } = await supabase.from('vw_student_fee_balance').select('*').limit(100);
      if (feeBalance) setStudentFeeBalance(feeBalance);

      const { data: students } = await supabase.from('vw_students_with_guardians').select('*').limit(100);
      if (students) setStudentsWithGuardians(students);

      // Load all new report views
      const reportViews: [string, (d: any[]) => void][] = [
        ['vw_fee_collection_by_method', setFeeCollectionByMethod],
        ['vw_overdue_installments', setOverdueInstallments],
        ['vw_daily_fee_collection', setDailyFeeCollection],
        ['vw_fee_collection_rate', setFeeCollectionRate],
        ['vw_students_on_hold', setStudentsOnHold],
        ['vw_credit_balances', setCreditBalances],
        ['vw_enrollment_stats', setEnrollmentStats],
        ['vw_student_status_breakdown', setStudentStatusBreakdown],
        ['vw_students_by_module', setStudentsByModule],
        ['vw_incomplete_profiles', setIncompleteProfiles],
        ['vw_students_without_guardians', setStudentsWithoutGuardians],
        ['vw_pass_fail_summary', setPassFailSummary],
        ['vw_applications_pipeline', setApplicationsPipeline],
        ['vw_enrollment_growth', setEnrollmentGrowth],
        ['vw_missing_documents', setMissingDocuments],
        ['vw_course_capacity', setCourseCapacity],
        ['vw_pending_promotion', setPendingPromotion],
        ['vw_graduation_pipeline', setGraduationPipeline],
        ['vw_credit_exemptions', setCreditExemptions],
      ];
      for (const [view, setter] of reportViews) {
        const { data } = await supabase.from(view).select('*').limit(200);
        if (data) setter(data);
      }

    } catch (err) {
      console.error('Error loading fee data:', err);
    }
  };

  // Part 6: Load exam performance reports
  const loadExamData = async (campusCode: string) => {
    try {
      // Get exam marks with class info
      let marksQuery = supabase
        .from('exam_marks')
        .select(`
          *,
          applications!inner(course_id, campus),
          classes(class_name, intake_month)
        `)
        .eq('is_submitted', true);
      
      if (campusCode && campusCode !== 'all') {
        marksQuery = marksQuery.eq('applications.campus', campusCode);
      }
      
      const { data: marksData } = await marksQuery;

      // Class results summary (simplified - calculating pass rates per unit)
      const unitResults = (marksData || []).reduce((acc: any, mark: any) => {
        const unitCode = mark.unit_code || 'Unknown';
        const unitName = mark.unit_code || 'Unknown';
        const className = mark.classes?.class_name || 'Unknown';
        const intake = mark.classes?.intake_month || 'Unknown';
        const key = `${unitCode}|${className}|${intake}`;
        
        if (!acc[key]) {
          acc[key] = { unit_code: unitCode, unit_name: unitName, class_name: className, intake, total: 0, passed: 0, failed: 0 };
        }
        acc[key].total++;
        if ((mark.marks || 0) >= 40) acc[key].passed++;
        else acc[key].failed++;
        return acc;
      }, {});
      
      const classResultsData = Object.values(unitResults).map((r: any) => ({
        ...r,
        pass_rate_pct: r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0
      })).sort((a: any, b: any) => a.pass_rate_pct - b.pass_rate_pct);
      setClassResults(classResultsData);

      // Grade distribution
      const gradeData = (marksData || []).reduce((acc: any, mark: any) => {
        const grade = calculateGrade(mark.marks).grade;
        if (!acc[grade]) acc[grade] = { grade, count: 0 };
        acc[grade].count++;
        return acc;
      }, {});
      const totalGrades = Object.values(gradeData).reduce((sum: number, g: any) => sum + g.count, 0);
      setGradeDistribution(Object.values(gradeData).map((g: any) => ({ ...g, pct: totalGrades > 0 ? ((g.count / totalGrades) * 100).toFixed(1) : 0 })));

      // Absent students
      let absentQuery = supabase
        .from('exam_marks')
        .select(`
          *,
          applications!inner(course_id, campus),
          classes(class_name, intake_month)
        `)
        .eq('is_absent', true);
      
      if (campusCode && campusCode !== 'all') {
        absentQuery = absentQuery.eq('applications.campus', campusCode);
      }
      
      const { data: absentData } = await absentQuery;
      setAbsentStudents(absentData || []);

    } catch (err) {
      console.error('Error loading exam data:', err);
    }
  };

  // Part 6: Load lecturer productivity reports
  const loadLecturerData = async (campusCode: string) => {
    try {
      // Lecturer workload
      const { data: workloadData } = await supabase
        .from('lecturer_assignments')
        .select(`
          lecturer_id,
          course_id,
          class_id,
          campus,
          is_active,
          lecturers!inner(full_name),
          courses!inner(name),
          classes!inner(class_name, intake_month)
        `);

      const workload = (workloadData || []).reduce((acc: any, assignment: any) => {
        const lecturerName = assignment.lecturers?.full_name || 'Unknown';
        if (!acc[lecturerName]) {
          acc[lecturerName] = { 
            lecturer_name: lecturerName, 
            courses: new Set(), 
            classes: new Set(), 
            units: new Set(), 
            intakes: new Set(),
            active_count: 0 
          };
        }
        acc[lecturerName].courses.add(assignment.courses?.name);
        acc[lecturerName].classes.add(assignment.classes?.class_name);
        acc[lecturerName].intakes.add(assignment.classes?.intake_month);
        if (assignment.is_active) acc[lecturerName].active_count++;
        return acc;
      }, {});
      
      setLecturerWorkload(Object.values(workload).map((w: any) => ({
        ...w,
        courses: w.courses.size,
        classes: w.classes.size,
        units: w.units.size,
        intakes: w.intakes.size
      })).sort((a: any, b: any) => b.units - a.units));

      // Lecturer submission status
      const { data: marksData } = await supabase
        .from('exam_marks')
        .select('lecturer_id, is_submitted, lecturers!inner(full_name)');

      const submissionData = (marksData || []).reduce((acc: any, mark: any) => {
        const lecturerName = mark.lecturers?.full_name || 'Unknown';
        if (!acc[lecturerName]) {
          acc[lecturerName] = { lecturer_name: lecturerName, total: 0, submitted: 0, pending: 0 };
        }
        acc[lecturerName].total++;
        if (mark.is_submitted) acc[lecturerName].submitted++;
        else acc[lecturerName].pending++;
        return acc;
      }, {});
      
      setLecturerSubmissions(Object.values(submissionData).map((s: any) => ({
        ...s,
        status: s.pending === 0 ? 'Complete' : s.submitted === 0 ? 'Not Started' : 'Pending'
      })).sort((a: any, b: any) => b.pending - a.pending));

    } catch (err) {
      console.error('Error loading lecturer data:', err);
    }
  };

  // Part 6: Load graduation reports
  const loadGraduationData = async (campusCode: string) => {
    try {
      // Completed students
      let completedQuery = supabase
        .from('applications')
        .select('*, courses!inner(name)')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });
      
      if (campusCode && campusCode !== 'all') {
        completedQuery = completedQuery.eq('campus', campusCode);
      }
      
      const { data: completedData } = await completedQuery;
      setCompletedStudents(completedData || []);

      // Calculate completions per month
      const monthlyCompletions = (completedData || []).reduce((acc: any, student: any) => {
        const month = student.updated_at?.substring(0, 7) || 'Unknown';
        const courseName = student.courses?.name || 'Unknown';
        const courseLevel = student.course_types?.level || 'Unknown';
        const key = `${month}|${courseName}|${courseLevel}`;
        if (!acc[key]) {
          acc[key] = { month, course_name: courseName, course_level: courseLevel, graduated: 0 };
        }
        acc[key].graduated++;
        return acc;
      }, {});

      // Upgrade eligible (simplified - all completed are eligible)
      setUpgradeEligible((completedData || []).slice(0, 50)); // Top 50

      // Re-enrolled students
      let reenrolledQuery = supabase
        .from('applications')
        .select('*')
        .not('previous_application_id', 'is', null);
      
      if (campusCode && campusCode !== 'all') {
        reenrolledQuery = reenrolledQuery.eq('campus', campusCode);
      }
      
      const { data: reenrolledData } = await reenrolledQuery;
      setReenrolled(reenrolledData || []);

    } catch (err) {
      console.error('Error loading graduation data:', err);
    }
  };

  // Helper: Calculate grade from marks
  const calculateGrade = (marks: number) => {
    if (marks >= 80) return { grade: 'Distinction 1', points: 1 };
    if (marks >= 75) return { grade: 'Distinction 2', points: 2 };
    if (marks >= 70) return { grade: 'Credit 3', points: 3 };
    if (marks >= 60) return { grade: 'Credit 4', points: 4 };
    if (marks >= 55) return { grade: 'Pass 5', points: 5 };
    if (marks >= 50) return { grade: 'Pass 6', points: 6 };
    if (marks >= 40) return { grade: 'Refer', points: 7 };
    return { grade: 'Fail', points: 8 };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminCampus');
    router.push('/login/admin');
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      if (filterIntake && student.application_date !== filterIntake) return false;
      if (filterCourse && student.course_id !== filterCourse) return false;
      if (filterDepartment && student.courses?.departments?.name !== filterDepartment) return false;
      if (filterGender && student.student_profiles?.gender !== filterGender) return false;
      return true;
    });
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-white text-xl">Loading Reports...</div>
      </div>
    );
  }

  const filteredStudents = getFilteredStudents();

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="bg-gray-50/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
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
                <h1 className="text-xl md:text-3xl font-bold text-white">Reports & Analytics</h1>
                <p className="text-purple-200 text-xs md:text-sm">Comprehensive college analytics and reports</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={printReport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
              >
                Print Report
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Part 6: Report Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { key: 'enrollment', label: 'Enrollment', icon: '👥' },
              { key: 'fees', label: 'Fees & Revenue', icon: '💰' },
              { key: 'exams', label: 'Exam Performance', icon: '📊' },
              { key: 'lecturers', label: 'Lecturers', icon: '👨‍🏫' },
              { key: 'graduation', label: 'Graduation', icon: '🎓' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50/10 text-white hover:bg-gray-50/20'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ENROLLMENT TAB */}
          {activeTab === 'enrollment' && (
            <div className="space-y-6">
              {/* Enrollment Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-white">{students.length}</p>
                </div>
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Enrolled</p>
                  <p className="text-2xl font-bold text-green-400">
                    {students.filter(s => s.status === 'enrolled').length}
                  </p>
                </div>
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {students.filter(s => s.status === 'pending').length}
                  </p>
                </div>
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Courses</p>
                  <p className="text-2xl font-bold text-white">{courses.length}</p>
                </div>
              </div>

              {/* Monthly Enrollments */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Monthly Enrollments</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Month</th>
                        <th className="text-center py-3 px-4 text-purple-300">New</th>
                        <th className="text-center py-3 px-4 text-purple-300">Upgrades</th>
                        <th className="text-center py-3 px-4 text-purple-300">Transfers</th>
                        <th className="text-center py-3 px-4 text-purple-300">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyEnrollments.slice(0, 12).map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{row.month}</td>
                          <td className="py-3 px-4 text-center text-green-400">{row.new}</td>
                          <td className="py-3 px-4 text-center text-blue-400">{row.upgrade}</td>
                          <td className="py-3 px-4 text-center text-purple-400">{row.transfer}</td>
                          <td className="py-3 px-4 text-center text-white font-bold">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gender Breakdown */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Gender Breakdown by Course</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Course</th>
                        <th className="text-left py-3 px-4 text-purple-300">Level</th>
                        <th className="text-center py-3 px-4 text-purple-300">Male</th>
                        <th className="text-center py-3 px-4 text-purple-300">Female</th>
                        <th className="text-center py-3 px-4 text-purple-300">Other</th>
                        <th className="text-center py-3 px-4 text-purple-300">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {genderBreakdown.map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{row.course_name}</td>
                          <td className="py-3 px-4 text-purple-300 capitalize">{row.course_level}</td>
                          <td className="py-3 px-4 text-center text-blue-400">{row.male}</td>
                          <td className="py-3 px-4 text-center text-pink-400">{row.female}</td>
                          <td className="py-3 px-4 text-center text-gray-400">{row.other}</td>
                          <td className="py-3 px-4 text-center text-white font-bold">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student List with Filters */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Student List</h2>
                  <p className="text-purple-300 text-sm">{filteredStudents.length} students</p>
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <select
                    value={filterIntake}
                    onChange={(e) => setFilterIntake(e.target.value)}
                    className="px-3 py-2 bg-gray-50/20 border border-white/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All Intakes</option>
                    {[...new Set(students.map(s => s.application_date))].sort().map(date => (
                      <option key={date} value={date} className="text-gray-900">{date}</option>
                    ))}
                  </select>
                  <select
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    className="px-3 py-2 bg-gray-50/20 border border-white/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id} className="text-gray-900">{course.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-3 py-2 bg-gray-50/20 border border-white/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept} className="text-gray-900">{dept}</option>
                    ))}
                  </select>
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="px-3 py-2 bg-gray-50/20 border border-white/30 rounded-lg text-white text-sm"
                  >
                    <option value="">All Genders</option>
                    <option value="male" className="text-gray-900">Male</option>
                    <option value="female" className="text-gray-900">Female</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Admission No</th>
                        <th className="text-left py-3 px-4 text-purple-300">Name</th>
                        <th className="text-left py-3 px-4 text-purple-300">Course</th>
                        <th className="text-left py-3 px-4 text-purple-300">Status</th>
                        <th className="text-left py-3 px-4 text-purple-300">Intake</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.slice(0, 50).map((student) => (
                        <tr key={student.id} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{student.admission_number}</td>
                          <td className="py-3 px-4 text-white">{student.full_name}</td>
                          <td className="py-3 px-4 text-purple-300">{student.courses?.name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              student.status === 'enrolled' ? 'bg-green-500/20 text-green-400' :
                              student.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-purple-300">{student.application_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FEES TAB */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              {/* Revenue Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Total Collected</p>
                  <p className="text-2xl font-bold text-green-400">
                    KES {monthlyRevenue.reduce((sum: number, r: any) => sum + (r.collected || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Outstanding</p>
                  <p className="text-2xl font-bold text-red-400">
                    KES {outstandingBalances.reduce((sum: number, b: any) => sum + (b.total_outstanding || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">On Financial Hold</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {outstandingBalances.reduce((sum: number, b: any) => sum + (b.on_hold || 0), 0)}
                  </p>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Monthly Revenue</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Month</th>
                        <th className="text-right py-3 px-4 text-purple-300">Amount Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRevenue.slice(0, 12).map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{row.month}</td>
                          <td className="py-3 px-4 text-right text-green-400">
                            KES {row.collected?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Revenue by Course */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Revenue by Course</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Course</th>
                        <th className="text-left py-3 px-4 text-purple-300">Level</th>
                        <th className="text-right py-3 px-4 text-purple-300">Total Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByCourse.map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{row.course_name}</td>
                          <td className="py-3 px-4 text-purple-300 capitalize">{row.course_level}</td>
                          <td className="py-3 px-4 text-right text-green-400">
                            KES {row.total_collected?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outstanding by Campus */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Outstanding Balances by Campus</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Campus</th>
                        <th className="text-right py-3 px-4 text-purple-300">Total Outstanding</th>
                        <th className="text-right py-3 px-4 text-purple-300">Total Collected</th>
                        <th className="text-center py-3 px-4 text-purple-300">On Hold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingBalances.map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white capitalize">{row.campus}</td>
                          <td className="py-3 px-4 text-right text-red-400">
                            KES {row.total_outstanding?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-green-400">
                            KES {row.total_collected?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center text-yellow-400">{row.on_hold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Course Fee Structure - vw_course_fee_structure */}
              {feeStructure.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4">Course Fee Structure</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-2 px-3 text-purple-300">Course</th>
                          <th className="text-left py-2 px-3 text-purple-300">Level</th>
                          <th className="text-left py-2 px-3 text-purple-300">Exam Body</th>
                          <th className="text-center py-2 px-3 text-purple-300">Module</th>
                          <th className="text-center py-2 px-3 text-purple-300">Sem</th>
                          <th className="text-right py-2 px-3 text-purple-300">Sem Fee</th>
                          <th className="text-right py-2 px-3 text-purple-300">Practical</th>
                          <th className="text-right py-2 px-3 text-purple-300">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeStructure.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-white/10 text-white">
                            <td className="py-2 px-3">{row.course_name}</td>
                            <td className="py-2 px-3">{row.course_level}</td>
                            <td className="py-2 px-3">{row.exam_body}</td>
                            <td className="py-2 px-3 text-center">{row.module_index}</td>
                            <td className="py-2 px-3 text-center">{row.semester_index}</td>
                            <td className="py-2 px-3 text-right">KES {Number(row.semester_fee || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">KES {Number(row.practical_fee || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-semibold text-green-400">KES {Number(row.total_per_semester || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Student Fee Balance - vw_student_fee_balance */}
              {studentFeeBalance.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4">Fee Balance by Course</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-2 px-3 text-purple-300">Course</th>
                          <th className="text-left py-2 px-3 text-purple-300">Level</th>
                          <th className="text-right py-2 px-3 text-purple-300">Students</th>
                          <th className="text-right py-2 px-3 text-purple-300">Total Balance</th>
                          <th className="text-right py-2 px-3 text-purple-300">Credit</th>
                          <th className="text-right py-2 px-3 text-purple-300">Net Outstanding</th>
                          <th className="text-right py-2 px-3 text-purple-300">On Hold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentFeeBalance.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-white/10 text-white">
                            <td className="py-2 px-3">{row.course_name}</td>
                            <td className="py-2 px-3">{row.course_level}</td>
                            <td className="py-2 px-3 text-right">{row.total_students}</td>
                            <td className="py-2 px-3 text-right">KES {Number(row.total_fee_balance || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">KES {Number(row.total_credit_balance || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-semibold text-yellow-400">KES {Number(row.net_outstanding_balance || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-red-400">{row.students_on_hold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Students with Guardians - vw_students_with_guardians */}
              {studentsWithGuardians.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4">Students with Guardian Info</h2>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-900">
                        <tr className="border-b border-white/20">
                          <th className="text-left py-2 px-3 text-purple-300">Adm No</th>
                          <th className="text-left py-2 px-3 text-purple-300">Student</th>
                          <th className="text-left py-2 px-3 text-purple-300">Phone</th>
                          <th className="text-left py-2 px-3 text-purple-300">Course</th>
                          <th className="text-left py-2 px-3 text-purple-300">Guardian</th>
                          <th className="text-left py-2 px-3 text-purple-300">Guardian Phone</th>
                          <th className="text-left py-2 px-3 text-purple-300">Relationship</th>
                          <th className="text-left py-2 px-3 text-purple-300">Emergency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsWithGuardians.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-white/10 text-white">
                            <td className="py-2 px-3 font-mono text-xs">{row.admission_number}</td>
                            <td className="py-2 px-3">{row.student_full_name}</td>
                            <td className="py-2 px-3">{row.student_phone}</td>
                            <td className="py-2 px-3 text-xs">{row.course_name}</td>
                            <td className="py-2 px-3">{row.guardian_full_name || '—'}</td>
                            <td className="py-2 px-3">{row.guardian_phone || '—'}</td>
                            <td className="py-2 px-3">{row.guardian_relationship || '—'}</td>
                            <td className="py-2 px-3">{row.is_emergency_contact ? '✅' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}


              {/* Fee Collection by Payment Method */}
              {feeCollectionByMethod.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["fee_collection_by_method"]: !p["fee_collection_by_method"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Fee Collection by Payment Method</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["fee_collection_by_method"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["fee_collection_by_method"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Campus</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Dept</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Method</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Txns</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Students</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feeCollectionByMethod.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.campus}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.department}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.payment_method}</td>
                              <td className="text-right py-1.5 px-2">{row.transaction_count}</td>
                              <td className="text-right py-1.5 px-2">{row.students_count}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.total_collected || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Overdue Installments */}
              {overdueInstallments.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["overdue_installments"]: !p["overdue_installments"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Overdue Installments</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["overdue_installments"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["overdue_installments"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Campus</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Amount</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Days</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overdueInstallments.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.campus}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.student_name}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.total_due || 0).toLocaleString()}</td>
                              <td className="text-right py-1.5 px-2">{row.days_overdue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Daily Fee Collection */}
              {dailyFeeCollection.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["daily_fee"]: !p["daily_fee"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Daily Fee Collection</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["daily_fee"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["daily_fee"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Date</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Campus</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Txns</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Students</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Collected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyFeeCollection.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.payment_date}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.campus}</td>
                              <td className="text-right py-1.5 px-2">{row.transaction_count}</td>
                              <td className="text-right py-1.5 px-2">{row.students_paid}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.total_collected || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Fee Collection Rate */}
              {feeCollectionRate.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["fee_collection_rate"]: !p["fee_collection_rate"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Fee Collection Rate</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["fee_collection_rate"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["fee_collection_rate"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Dept</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Level</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Students</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Expected</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Paid</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Rate %</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">O/S</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feeCollectionRate.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.department}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_level}</td>
                              <td className="text-right py-1.5 px-2">{row.enrolled_students}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.total_expected || 0).toLocaleString()}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.total_paid || 0).toLocaleString()}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.collection_rate_pct}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.outstanding_balance || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Students on Financial Hold */}
              {studentsOnHold.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["students_on_hold"]: !p["students_on_hold"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Students on Financial Hold</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["students_on_hold"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["students_on_hold"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Phone</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Balance</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Mod</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Sem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsOnHold.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.full_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.phone}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.total_balance || 0).toLocaleString()}</td>
                              <td className="text-right py-1.5 px-2">{row.current_module}</td>
                              <td className="text-right py-1.5 px-2">{row.current_semester}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Credit Balances */}
              {creditBalances.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["credit_balances"]: !p["credit_balances"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Credit Balances</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["credit_balances"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["credit_balances"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Credit</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditBalances.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.full_name}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.credit_balance || 0).toLocaleString()}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.total_balance || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Enrollment Stats */}
              {enrollmentStats.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["enrollment_stats"]: !p["enrollment_stats"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Enrollment Stats</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["enrollment_stats"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["enrollment_stats"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Campus</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Type</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollmentStats.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.campus}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.enrollment_type}</td>
                              <td className="text-right py-1.5 px-2">{row.student_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Status Breakdown */}
              {studentStatusBreakdown.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["status_breakdown"]: !p["status_breakdown"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Status Breakdown</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["status_breakdown"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["status_breakdown"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Dept</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Status</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentStatusBreakdown.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.department}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.student_status}</td>
                              <td className="text-right py-1.5 px-2">{row.student_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Students by Module */}
              {studentsByModule.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["students_by_module"]: !p["students_by_module"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Students by Module</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["students_by_module"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["students_by_module"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Level</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Mod</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Sem</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsByModule.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_level}</td>
                              <td className="text-right py-1.5 px-2">{row.current_module}</td>
                              <td className="text-right py-1.5 px-2">{row.current_semester}</td>
                              <td className="text-right py-1.5 px-2">{row.student_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Incomplete Profiles */}
              {incompleteProfiles.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["incomplete_profiles"]: !p["incomplete_profiles"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Incomplete Profiles</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["incomplete_profiles"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["incomplete_profiles"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Phone</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incompleteProfiles.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.full_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.phone}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.profile_status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* No Guardians */}
              {studentsWithoutGuardians.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["no_guardians"]: !p["no_guardians"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">No Guardians</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["no_guardians"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["no_guardians"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Phone</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsWithoutGuardians.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.full_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.phone}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Pass/Fail Summary */}
              {passFailSummary.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["pass_fail"]: !p["pass_fail"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Pass/Fail Summary</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["pass_fail"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["pass_fail"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Mod</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Sem</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Total</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Pass</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Fail</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Avg %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {passFailSummary.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-right py-1.5 px-2">{row.module_index}</td>
                              <td className="text-right py-1.5 px-2">{row.semester}</td>
                              <td className="text-right py-1.5 px-2">{row.total_students}</td>
                              <td className="text-right py-1.5 px-2">{row.passed}</td>
                              <td className="text-right py-1.5 px-2">{row.failed}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.average_mark}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Applications Pipeline */}
              {applicationsPipeline.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["app_pipeline"]: !p["app_pipeline"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Applications Pipeline</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["app_pipeline"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["app_pipeline"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Campus</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Intake</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Status</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applicationsPipeline.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.campus}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.intake}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.status}</td>
                              <td className="text-right py-1.5 px-2">{row.application_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Enrollment Growth */}
              {enrollmentGrowth.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["enrollment_growth"]: !p["enrollment_growth"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Enrollment Growth</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["enrollment_growth"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["enrollment_growth"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Intake</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Month</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Total</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">New</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollmentGrowth.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.intake}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.enrollment_month}</td>
                              <td className="text-right py-1.5 px-2">{row.enrolled_count}</td>
                              <td className="text-right py-1.5 px-2">{row.new_students}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Documents */}
              {missingDocuments.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["missing_docs"]: !p["missing_docs"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Missing Documents</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["missing_docs"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["missing_docs"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Phone</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                          </tr>
                        </thead>
                        <tbody>
                          {missingDocuments.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.full_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.phone}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Course Capacity */}
              {courseCapacity.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["course_capacity"]: !p["course_capacity"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Course Capacity</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["course_capacity"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["course_capacity"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Campus</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Dept</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Level</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Body</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Students</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseCapacity.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.campus}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.department}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_level}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.exam_body}</td>
                              <td className="text-right py-1.5 px-2">{row.current_enrollment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Pending Promotion */}
              {pendingPromotion.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["pending_promotion"]: !p["pending_promotion"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Pending Promotion</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["pending_promotion"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["pending_promotion"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Mod</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Sem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingPromotion.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.full_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-right py-1.5 px-2">{row.current_module}</td>
                              <td className="text-right py-1.5 px-2">{row.current_semester}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Graduation Pipeline */}
              {graduationPipeline.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["graduation"]: !p["graduation"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Graduation Pipeline</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["graduation"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["graduation"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Level</th>
                            <th className="text-right py-1.5 px-2 text-purple-300 whitespace-nowrap">Balance</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Transcript</th>
                          </tr>
                        </thead>
                        <tbody>
                          {graduationPipeline.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.full_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_level}</td>
                              <td className="text-right py-1.5 px-2 whitespace-nowrap">KES {Number(row.total_balance || 0).toLocaleString()}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.transcript_unlocked}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Credit Exemptions */}
              {creditExemptions.length > 0 && (
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                  <button onClick={() => setExpandedReports(p => ({...p, ["credit_exemptions"]: !p["credit_exemptions"]}))}
                    className="flex items-center justify-between w-full text-left">
                    <h3 className="text-md font-bold text-white">Credit Exemptions</h3>
                    <span className="text-purple-300 text-xs">{expandedReports["credit_exemptions"] ? "▲" : "▼"}</span>
                  </button>
                  {expandedReports["credit_exemptions"] && (
                    <div className="overflow-x-auto mt-2 max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-900">
                          <tr className="border-b border-white/20">
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Adm No</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Student</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Course</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Type</th>
                            <th className="text-left py-1.5 px-2 text-purple-300 whitespace-nowrap">Prev School</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditExemptions.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-white/10 text-white">
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.admission_number}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.full_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.course_name}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.enrollment_type}</td>
                              <td className="text-left py-1.5 px-2 truncate max-w-40">{row.previous_school}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
          {/* EXAMS TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              {/* Grade Distribution */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Grade Distribution</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {gradeDistribution.map((grade: any, idx) => (
                    <div key={idx} className="bg-gray-50/5 rounded-lg p-4 text-center">
                      <p className="text-purple-300 text-sm">{grade.grade}</p>
                      <p className="text-2xl font-bold text-white">{grade.count}</p>
                      <p className="text-purple-400 text-xs">{grade.pct}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Class Results Summary */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Class Performance (Worst First)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Unit</th>
                        <th className="text-left py-3 px-4 text-purple-300">Class</th>
                        <th className="text-left py-3 px-4 text-purple-300">Intake</th>
                        <th className="text-center py-3 px-4 text-purple-300">Total</th>
                        <th className="text-center py-3 px-4 text-purple-300">Passed</th>
                        <th className="text-center py-3 px-4 text-purple-300">Failed</th>
                        <th className="text-center py-3 px-4 text-purple-300">Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classResults.slice(0, 50).map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{row.unit_code}</td>
                          <td className="py-3 px-4 text-purple-300">{row.class_name}</td>
                          <td className="py-3 px-4 text-purple-300">{row.intake}</td>
                          <td className="py-3 px-4 text-center text-white">{row.total}</td>
                          <td className="py-3 px-4 text-center text-green-400">{row.passed}</td>
                          <td className="py-3 px-4 text-center text-red-400">{row.failed}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              row.pass_rate_pct >= 80 ? 'bg-green-500/20 text-green-400' :
                              row.pass_rate_pct >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {row.pass_rate_pct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Absent Students */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Absent Students Report</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Admission No</th>
                        <th className="text-left py-3 px-4 text-purple-300">Class</th>
                        <th className="text-left py-3 px-4 text-purple-300">Unit</th>
                        <th className="text-left py-3 px-4 text-purple-300">Exam Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentStudents.slice(0, 30).map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{row.admission_number}</td>
                          <td className="py-3 px-4 text-purple-300">{row.classes?.class_name}</td>
                          <td className="py-3 px-4 text-purple-300">{row.unit_code}</td>
                          <td className="py-3 px-4 text-purple-300">
                            {row.exam_date ? new Date(row.exam_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LECTURERS TAB */}
          {activeTab === 'lecturers' && (
            <div className="space-y-6">
              {/* Lecturer Workload */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Lecturer Workload</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Lecturer</th>
                        <th className="text-center py-3 px-4 text-purple-300">Courses</th>
                        <th className="text-center py-3 px-4 text-purple-300">Classes</th>
                        <th className="text-center py-3 px-4 text-purple-300">Intakes</th>
                        <th className="text-center py-3 px-4 text-purple-300">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lecturerWorkload.map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{row.lecturer_name}</td>
                          <td className="py-3 px-4 text-center text-blue-400">{row.courses}</td>
                          <td className="py-3 px-4 text-center text-green-400">{row.classes}</td>
                          <td className="py-3 px-4 text-center text-purple-400">{row.intakes}</td>
                          <td className="py-3 px-4 text-center text-yellow-400">{row.active_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submission Status */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Marks Submission Status</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Lecturer</th>
                        <th className="text-center py-3 px-4 text-purple-300">Total</th>
                        <th className="text-center py-3 px-4 text-purple-300">Submitted</th>
                        <th className="text-center py-3 px-4 text-purple-300">Pending</th>
                        <th className="text-center py-3 px-4 text-purple-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lecturerSubmissions.map((row: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{row.lecturer_name}</td>
                          <td className="py-3 px-4 text-center text-white">{row.total}</td>
                          <td className="py-3 px-4 text-center text-green-400">{row.submitted}</td>
                          <td className="py-3 px-4 text-center text-red-400">{row.pending}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              row.status === 'Complete' ? 'bg-green-500/20 text-green-400' :
                              row.status === 'Not Started' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* GRADUATION TAB */}
          {activeTab === 'graduation' && (
            <div className="space-y-6">
              {/* Graduation Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{completedStudents.length}</p>
                </div>
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Eligible for Upgrade</p>
                  <p className="text-2xl font-bold text-blue-400">{upgradeEligible.length}</p>
                </div>
                <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-purple-200 text-sm">Re-enrolled</p>
                  <p className="text-2xl font-bold text-purple-400">{reenrolled.length}</p>
                </div>
              </div>

              {/* Completed Students */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Recently Completed Students</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Admission No</th>
                        <th className="text-left py-3 px-4 text-purple-300">Name</th>
                        <th className="text-left py-3 px-4 text-purple-300">Course</th>
                        <th className="text-left py-3 px-4 text-purple-300">Completed Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedStudents.slice(0, 30).map((student: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{student.admission_number}</td>
                          <td className="py-3 px-4 text-white">{student.full_name}</td>
                          <td className="py-3 px-4 text-purple-300">{student.courses?.name}</td>
                          <td className="py-3 px-4 text-green-400">
                            {student.updated_at ? new Date(student.updated_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Re-enrollment Stats */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Re-enrollment Summary</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-purple-300">Admission No</th>
                        <th className="text-left py-3 px-4 text-purple-300">Name</th>
                        <th className="text-left py-3 px-4 text-purple-300">Type</th>
                        <th className="text-left py-3 px-4 text-purple-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reenrolled.slice(0, 20).map((student: any, idx) => (
                        <tr key={idx} className="border-b border-white/10">
                          <td className="py-3 px-4 text-white">{student.admission_number}</td>
                          <td className="py-3 px-4 text-white">{student.full_name}</td>
                          <td className="py-3 px-4 text-purple-300 capitalize">{student.enrollment_type || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              student.status === 'enrolled' ? 'bg-green-500/20 text-green-400' :
                              student.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Close the main content div */}
        </div>
      </div>
    </div>
  );
}
