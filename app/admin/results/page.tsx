'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import jsPDF from 'jspdf';

const DEPARTMENTS = ['ICT', 'Business', 'Engineering', 'Hospitality'];

export default function ResultsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminCampus, setAdminCampus] = useState('');
  const [examMarks, setExamMarks] = useState<any[]>([]);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterExamType, setFilterExamType] = useState('');
  const [filterAcademicPeriod, setFilterAcademicPeriod] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [academicCalendars, setAcademicCalendars] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    checkAuth();
  }, [supabase, router]);

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

    setAdminCampus(session.user?.user_metadata?.campus);
    loadCourses();
    loadAcademicCalendars(session.user?.user_metadata?.campus);
    loadExamMarks(session.user?.user_metadata?.campus);
  };

  const loadCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*');
    
    if (data && !error) {
      setCourses(data);
    }
  };

  const loadAcademicCalendars = async (campus: string) => {
    const { data, error } = await supabase
      .from('academic_calendar')
      .select('*')
      .eq('campus', campus)
      .order('academic_year', { ascending: false })
      .order('term', { ascending: true });

    if (data && !error) {
      setAcademicCalendars(data);
    }
  };

  const loadExamMarks = async (campus: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_marks')
        .select('*')
        .eq('campus', campus)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to load exam marks');
      } else {
        setExamMarks(data || []);
      }
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

  // Get courses for selected department
  const departmentCourses = courses.filter(c => c.department === filterDepartment);

  // Filter marks by department, course, semester, exam type, and academic period
  const filteredMarks = examMarks.filter(mark => {
    if (filterDepartment) {
      const courseData = courses.find(c => c.name === mark.course);
      if (!courseData || courseData.department !== filterDepartment) return false;
    }
    if (filterCourse && mark.course !== filterCourse) return false;
    if (filterSemester && mark.semester !== parseInt(filterSemester)) return false;
    if (filterExamType && mark.exam_type !== filterExamType) return false;
    if (filterAcademicPeriod && mark.academic_calendar_id !== filterAcademicPeriod) return false;
    return true;
  });

  // Get unique students from filtered marks
  const uniqueStudents = [...new Set(filteredMarks.map(m => m.admission_number))];
  
  // Get unique units from filtered marks
  const uniqueUnits = [...new Set(filteredMarks.map(m => m.unit))].sort();

  // Get student names from applications
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStudentNames = async () => {
      const admissionNumbers = [...new Set(filteredMarks.map(m => m.admission_number))];
      const names: Record<string, string> = {};
      
      for (const admissionNumber of admissionNumbers) {
        const { data } = await supabase
          .from('applications')
          .select('full_name')
          .eq('admission_number', admissionNumber)
          .single();
        
        if (data) {
          names[admissionNumber] = data.full_name;
        }
      }
      
      setStudentNames(names);
    };

    if (filteredMarks.length > 0) {
      fetchStudentNames();
    }
  }, [filteredMarks]);

  // Grading logic
  const calculateGrade = (percentage: number) => {
    if (percentage >= 80) return { grade: 'Distinction 1', points: 1 };
    if (percentage >= 75) return { grade: 'Distinction 2', points: 2 };
    if (percentage >= 70) return { grade: 'Credit 3', points: 3 };
    if (percentage >= 60) return { grade: 'Credit 4', points: 4 };
    if (percentage >= 55) return { grade: 'Pass 5', points: 5 };
    if (percentage >= 50) return { grade: 'Pass 6', points: 6 };
    if (percentage >= 40) return { grade: 'Refer', points: 7 };
    return { grade: 'Fail', points: 8 };
  };

  // Generate PDF
  const generatePDF = async () => {
    if (uniqueStudents.length === 0) {
      setError('No results to generate PDF');
      return;
    }

    if (filteredMarks.length === 0) {
      setError('No exam marks have been submitted for this course/semester. Please ask the lecturer to submit marks before generating results.');
      return;
    }

    const doc = new jsPDF();
    
    // Add header image
    const headerImg = await fetch('/header.png').then(res => res.blob()).then(blob => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    });
    doc.addImage(headerImg, 'PNG', 20, 10, 170, 30);
    
    // Campus info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${adminCampus.charAt(0).toUpperCase() + adminCampus.slice(1)} Campus`, 105, 45, { align: 'center' });
    
    // Filter info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let filterInfo = '';
    if (filterAcademicPeriod) {
      const selectedCalendar = academicCalendars.find((cal: any) => cal.id === filterAcademicPeriod);
      if (selectedCalendar) {
        filterInfo += `Academic Year: ${selectedCalendar.academic_year} - ${selectedCalendar.term_name} | `;
      }
    }
    if (filterDepartment) filterInfo += `Department: ${filterDepartment} | `;
    if (filterCourse) filterInfo += `Course: ${filterCourse} | `;
    if (filterSemester) filterInfo += `Semester: ${filterSemester}`;
    if (filterInfo) {
      doc.text(filterInfo, 105, 52, { align: 'center' });
    }

    // Date
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 58, { align: 'center' });
    
    // Line
    doc.setDrawColor(128, 128, 128);
    doc.line(20, 62, 190, 62);
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const headers = ['Adm No.', 'Student Name', ...uniqueUnits, 'Avg %', 'Grade'];
    const colWidths = [25, 40, ...uniqueUnits.map(() => 25), 20, 25];
    let xPos = 20;
    
    headers.forEach((header, index) => {
      doc.text(header, xPos, 70);
      xPos += colWidths[index];
    });
    
    // Line
    doc.line(20, 72, 190, 72);
    
    // Table data
    doc.setFont('helvetica', 'normal');
    let yPos = 80;
    
    uniqueStudents.forEach(admissionNumber => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const studentMarks = filteredMarks.filter(m => m.admission_number === admissionNumber);
      xPos = 20;
      
      // Admission number
      doc.text(admissionNumber, xPos, yPos);
      xPos += colWidths[0];
      
      // Student name
      const name = studentNames[admissionNumber] || 'Unknown';
      const truncatedName = name.length > 20 ? name.substring(0, 20) + '...' : name;
      doc.text(truncatedName, xPos, yPos);
      xPos += colWidths[1];
      
      // Unit marks
      let totalMarks = 0;
      let unitCount = 0;
      
      uniqueUnits.forEach(unit => {
        const mark = studentMarks.find(m => m.unit === unit);
        const total = mark ? mark.marks : '-';
        doc.text(String(total), xPos, yPos, { align: 'center' });
        xPos += colWidths[2];
        
        if (mark) {
          totalMarks += mark.marks;
          unitCount++;
        }
      });
      
      // Average percentage
      const avgPercentage = unitCount > 0 ? (totalMarks / unitCount) : 0;
      doc.text(avgPercentage.toFixed(1) + '%', xPos, yPos, { align: 'center' });
      xPos += colWidths[colWidths.length - 2];
      
      // Grade
      const gradeInfo = calculateGrade(avgPercentage);
      doc.text(gradeInfo.grade, xPos, yPos, { align: 'center' });
      
      yPos += 10;
    });
    
    // Grading scale legend
    yPos += 10;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Grading Scale:', 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const scale = [
      'Distinction 1: 80-100%',
      'Distinction 2: 75-79%',
      'Credit 3: 70-74%',
      'Credit 4: 60-69%',
      'Pass 5: 55-59%',
      'Pass 6: 50-54%',
      'Refer: 40-49%',
      'Fail: 0-39%'
    ];
    
    scale.forEach((item, index) => {
      doc.text(item, 25, yPos);
      yPos += 7;
    });
    
    // Add stamp image at bottom
    const stampImg = await fetch('/stamp.png').then(res => res.blob()).then(blob => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    });
    
    // Signature section
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signature:', 20, yPos);
    
    doc.addImage(stampImg, 'PNG', 140, yPos - 10, 40, 40);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Principal / Registrar', 145, yPos + 35);
    
    // Save PDF
    const fileName = `${filterCourse || 'Results'}_${filterSemester || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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
            <Link href="/admin/dashboard" className="relative w-12 h-12">
              <Image
                src="/logo.webp"
                alt="EAVI Logo"
                fill
                className="object-contain"
              />
            </Link>
            <div>
              <h1 className="text-white font-bold text-lg">Exam Results</h1>
              <p className="text-purple-200 text-sm capitalize">{adminCampus} Campus</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Manage Exam Results</h2>
            <div className="flex gap-3">
              <button
                onClick={() => generatePDF()}
                disabled={uniqueStudents.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Results PDF
              </button>
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label htmlFor="filterAcademicPeriod" className="block text-purple-200 text-sm mb-2">
                Academic Period *
              </label>
              <select
                id="filterAcademicPeriod"
                value={filterAcademicPeriod}
                onChange={(e) => setFilterAcademicPeriod(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Academic Period</option>
                {academicCalendars.map((cal: any) => (
                  <option key={cal.id} value={cal.id} className="text-gray-900">
                    {cal.academic_year} - {cal.term_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filterDepartment" className="block text-purple-200 text-sm mb-2">
                Filter by Department
              </label>
              <select
                id="filterDepartment"
                value={filterDepartment}
                onChange={(e) => {
                  setFilterDepartment(e.target.value);
                  setFilterCourse('');
                }}
                disabled={!filterAcademicPeriod}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept} className="text-gray-900">{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filterCourse" className="block text-purple-200 text-sm mb-2">
                Filter by Course
              </label>
              <select
                id="filterCourse"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                disabled={!filterDepartment}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <option value="">All Courses</option>
                {departmentCourses.map((course: any) => (
                  <option key={course.id} value={course.name} className="text-gray-900">{course.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filterSemester" className="block text-purple-200 text-sm mb-2">
                Filter by Semester
              </label>
              <select
                id="filterSemester"
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                disabled={!filterAcademicPeriod}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <option value="">All Semesters</option>
                <option value="1" className="text-gray-900">Semester 1</option>
                <option value="2" className="text-gray-900">Semester 2</option>
                <option value="3" className="text-gray-900">Semester 3</option>
                <option value="4" className="text-gray-900">Semester 4</option>
              </select>
            </div>

            <div>
              <label htmlFor="filterExamType" className="block text-purple-200 text-sm mb-2">
                Filter by Exam Type
              </label>
              <select
                id="filterExamType"
                value={filterExamType}
                onChange={(e) => setFilterExamType(e.target.value)}
                disabled={!filterAcademicPeriod}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <option value="">All Exam Types</option>
                <option value="cat" className="text-gray-900">CAT</option>
                <option value="end_term" className="text-gray-900">End Term</option>
                <option value="mock" className="text-gray-900">Mock Exam</option>
              </select>
            </div>
          </div>

          {/* Selected Academic Period Info */}
          {filterAcademicPeriod && (
            <div className="mb-6 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <p className="text-purple-200 text-sm">
                <span className="font-semibold">Grading Period:</span> {
                  academicCalendars.find((cal: any) => cal.id === filterAcademicPeriod)?.academic_year
                } - {
                  academicCalendars.find((cal: any) => cal.id === filterAcademicPeriod)?.term_name
                }
              </p>
            </div>
          )}

          {/* Matrix Results Table */}
          <div className="overflow-x-auto">
            {uniqueStudents.length === 0 ? (
              <div className="text-center py-8 text-purple-200">
                {!filterAcademicPeriod ? 
                  "Please select an academic period to view results." : 
                  "No exam results found for the selected filters."}
              </div>
            ) : (
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 font-semibold min-w-[120px]">Admission No.</th>
                    <th className="text-left py-3 px-4 font-semibold min-w-[200px]">Student Name</th>
                    {uniqueUnits.map(unit => (
                      <th key={unit} className="text-center py-3 px-4 font-semibold min-w-[100px]">{unit}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uniqueStudents.map(admissionNumber => {
                    const studentMarks = filteredMarks.filter(m => m.admission_number === admissionNumber);
                    return (
                      <tr key={admissionNumber} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4">{admissionNumber}</td>
                        <td className="py-3 px-4">{studentNames[admissionNumber] || 'Unknown'}</td>
                        {uniqueUnits.map(unit => {
                          const mark = studentMarks.find(m => m.unit === unit);
                          const total = mark ? mark.marks : '-';
                          return (
                            <td key={unit} className="py-3 px-4 text-center font-semibold">
                              {total}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {uniqueStudents.length > 0 && (
            <p className="mt-4 text-purple-200 text-sm">
              Showing {uniqueStudents.length} students with {uniqueUnits.length} units
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
