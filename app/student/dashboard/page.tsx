'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { getCourseTypeConfig, getPeriodLabel, getUnitsForPeriod } from '@/lib/course-structure';

export default function StudentDashboard() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [examMarks, setExamMarks] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [unitsWithLecturers, setUnitsWithLecturers] = useState<any[]>([]);
  const [pdfMake, setPdfMake] = useState<any>(null);
  const [headerImage, setHeaderImage] = useState<string>('');
  const [stampImage, setStampImage] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    checkAuth();

    // Load pdfMake
    const loadPdfMake = async () => {
      try {
        const pdfMakeModule = await import('pdfmake/build/pdfmake');
        const vfsFonts = await import('pdfmake/build/vfs_fonts');
        pdfMakeModule.addVirtualFileSystem(vfsFonts.default || vfsFonts);
        setPdfMake(pdfMakeModule);
      } catch (error) {
        console.error('Error loading pdfmake:', error);
      }
    };
    loadPdfMake();

    // Load images
    const loadImages = async () => {
      try {
        const header = await fetchImageAsBase64('/header.png');
        const stamp = await fetchImageAsBase64('/stamp.png');
        setHeaderImage(header);
        setStampImage(stamp);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };
    loadImages();
  }, [supabase, router]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login/student');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userMetadata = user.user_metadata;
      if (userMetadata?.role !== 'student') {
        router.push('/login/student');
        return;
      }
      
      const admissionNumber = userMetadata.admission_number;
      if (admissionNumber) {
        loadStudentInfo(admissionNumber);
        loadExamMarks(admissionNumber);
        loadCourses();
      }
    }
  };

  // Load units with lecturers when student info is available
  useEffect(() => {
    if (studentInfo) {
      loadUnitsWithLecturers(studentInfo);
    }
  }, [studentInfo]);

  const loadStudentInfo = async (admissionNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('admission_number', admissionNumber)
        .single();

      if (error) {
        setError('Failed to load student information');
      } else {
        setStudentInfo(data);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadExamMarks = async (admissionNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('exam_marks')
        .select('*')
        .eq('admission_number', admissionNumber)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to load exam marks');
      } else {
        setExamMarks(data || []);
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

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
      `);
    
    if (data && !error) {
      setCourses(data);
    }
  };

  const loadUnitsWithLecturers = async (studentData: any) => {
    console.log('Loading units with lecturers for:', studentData);
    if (!studentData?.course) {
      console.log('Missing course:', studentData?.course);
      return;
    }

    try {
      // Get course data to find units
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
        .eq('name', studentData.course)
        .single();

      if (!courseData) {
        console.log('No course data found for:', studentData.course);
        return;
      }

      console.log('Course data loaded:', courseData);

      // Get the student's course type
      const studentCourseType = studentData.course_type || 'diploma';
      const typeData = courseData.course_types[studentCourseType];

      if (!typeData) {
        console.log('No course type data found for:', studentCourseType);
        return;
      }

      const normalized = getCourseTypeConfig(courseData.course_types, studentCourseType);
      if (!normalized) return;
      const currentPeriod = studentData.current_semester || 1;
      const unitsToShow = getUnitsForPeriod(normalized, currentPeriod);

      console.log('Units to show:', unitsToShow);

      if (unitsToShow.length === 0) {
        console.log('No units found for this course');
        return;
      }

      // Get lecturer assignments for these units
      const { data: assignments } = await supabase
        .from('lecturer_assignments')
        .select('*, lecturers(full_name, phone)')
        .eq('course', studentData.course)
        .eq('campus', studentData.campus);

      console.log('Lecturer assignments:', assignments);

      if (assignments) {
        const unitsWithInfo = unitsToShow.map(unit => {
          const assignment = assignments.find((a: any) => a.units.includes(unit));
          return {
            unit,
            lecturer_name: assignment?.lecturers?.full_name || 'Not assigned',
            lecturer_phone: assignment?.lecturers?.phone || 'Not available'
          };
        });
        console.log('Units with info:', unitsWithInfo);
        setUnitsWithLecturers(unitsWithInfo);
      }
    } catch (err) {
      console.error('Error loading units with lecturers:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error fetching image:', error);
      return '';
    }
  };

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

  // Generate PDF for student results
  const generatePDF = async () => {
    if (examMarks.length === 0) {
      setError('No exam results to generate PDF');
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
    
    // Student info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Result Slip', 105, 45, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${studentInfo?.full_name || 'N/A'}`, 20, 55);
    doc.text(`Admission No: ${studentInfo?.admission_number || 'N/A'}`, 20, 62);
    doc.text(`Course: ${studentInfo?.course || 'N/A'}`, 20, 69);
    doc.text(`Campus: ${studentInfo?.campus === 'main' ? 'Main Campus' : studentInfo?.campus === 'west' ? 'West Campus' : 'N/A'}`, 20, 76);

    // Date
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 85, { align: 'center' });
    
    // Line
    doc.setDrawColor(128, 128, 128);
    doc.line(20, 90, 190, 90);
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const headers = ['Unit', 'Semester', 'Exam Type', 'Marks', 'Grade'];
    const colWidths = [50, 25, 35, 25, 55];
    let xPos = 20;
    
    headers.forEach((header, index) => {
      doc.text(header, xPos, 100);
      xPos += colWidths[index];
    });
    
    // Line
    doc.line(20, 102, 190, 102);
    
    // Table data
    doc.setFont('helvetica', 'normal');
    let yPos = 112;
    
    examMarks.forEach((mark) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      xPos = 20;
      const gradeInfo = calculateGrade(mark.marks);
      const examTypeLabel = mark.exam_type === 'combined' ? 'CAT + End Term' : mark.exam_type === 'mock' ? 'Mock Exam' : mark.exam_type;
      
      doc.text(mark.unit, xPos, yPos);
      xPos += colWidths[0];
      
      doc.text(`Sem ${mark.semester}`, xPos, yPos);
      xPos += colWidths[1];
      
      doc.text(examTypeLabel, xPos, yPos);
      xPos += colWidths[2];
      
      doc.text(String(mark.marks), xPos, yPos);
      xPos += colWidths[3];
      
      doc.text(gradeInfo.grade, xPos, yPos);
      
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
    const fileName = `Results_${studentInfo?.admission_number}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const generatePeriodResultsPDF = async (periodNumber: number) => {
    const periodMarks = examMarks.filter((mark) => mark.semester === periodNumber);
    if (periodMarks.length === 0) {
      setError(`No exam results found for ${getPeriodLabel((getCourseTypeConfig(courses.find(c => c.name === studentInfo?.course)?.course_types, studentInfo?.course_type || 'diploma')?.studyMode) || 'semester')} ${periodNumber}.`);
      return;
    }

    const doc = new jsPDF();
    const headerImg = await fetch('/header.png').then(res => res.blob()).then(blob => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    });
    doc.addImage(headerImg, 'PNG', 20, 10, 170, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Period Result Slip`, 105, 45, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${studentInfo?.full_name || 'N/A'}`, 20, 55);
    doc.text(`Admission No: ${studentInfo?.admission_number || 'N/A'}`, 20, 62);
    doc.text(`Course: ${studentInfo?.course || 'N/A'}`, 20, 69);
    doc.text(`Period: ${periodNumber}`, 20, 76);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 85, { align: 'center' });

    doc.setDrawColor(128, 128, 128);
    doc.line(20, 90, 190, 90);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const headers = ['Unit', 'Exam Type', 'Marks', 'Grade'];
    const colWidths = [65, 45, 30, 50];
    let xPos = 20;
    headers.forEach((header, index) => {
      doc.text(header, xPos, 100);
      xPos += colWidths[index];
    });
    doc.line(20, 102, 190, 102);

    doc.setFont('helvetica', 'normal');
    let yPos = 112;
    periodMarks.forEach((mark) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      xPos = 20;
      const gradeInfo = calculateGrade(mark.marks);
      const examTypeLabel = mark.exam_type === 'combined' ? 'CAT + End Term' : mark.exam_type === 'mock' ? 'Mock' : mark.exam_type;

      doc.text(mark.unit, xPos, yPos);
      xPos += colWidths[0];
      doc.text(examTypeLabel, xPos, yPos);
      xPos += colWidths[1];
      doc.text(String(mark.marks), xPos, yPos);
      xPos += colWidths[2];
      doc.text(gradeInfo.grade, xPos, yPos);
      yPos += 10;
    });

    const fileName = `Results_${studentInfo?.admission_number}_period_${periodNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const generateFeeStructureContent = (courseData: any, courseType: string) => {
    if (!courseData || !courseData.course_types) {
      console.error('Missing course data or course_types');
      return [];
    }

    const courseTypeKey = courseType.toLowerCase();
    const typeData = courseData.course_types[courseTypeKey];
    const normalized = getCourseTypeConfig(courseData.course_types, courseTypeKey);

    console.log('Course data:', courseData);
    console.log('Course type:', courseType);
    console.log('Course type key:', courseTypeKey);
    console.log('Type data:', typeData);

    if (!typeData || !typeData.enabled || !normalized) {
      console.error('Type data not found or not enabled');
      return [];
    }

    let tableBody: any[] = [];
    let totalFee = 0;
    let durationText = '';
    let paymentNote = '';

    // Calculate dynamic font size based on number of rows
    let rowCount = 0;
    if (normalized.studyMode === 'short-course') {
      rowCount = 1;
    } else {
      rowCount = normalized.periods.length;
    }

    let baseFontSize = 11;
    let tableFontSize = 10;
    let tablePadding = 8;

    if (rowCount > 8) {
      baseFontSize = 9;
      tableFontSize = 8;
      tablePadding = 6;
    } else if (rowCount > 6) {
      baseFontSize = 10;
      tableFontSize = 9;
      tablePadding = 7;
    }

    // Handle different fee structure types
    if (normalized.studyMode !== 'short-course') {
      tableBody = [
        [
          { text: getPeriodLabel(normalized.studyMode), style: 'tableHeader', alignment: 'center', fontSize: tableFontSize },
          { text: 'Fee (KES)', style: 'tableHeader', alignment: 'center', fontSize: tableFontSize }
        ]
      ];

      normalized.periods.forEach((period, index) => {
        tableBody.push([
          { text: `${getPeriodLabel(normalized.studyMode)} ${index + 1}`, style: 'tableCell', alignment: 'center', fontSize: tableFontSize },
          { text: period.fee.toLocaleString(), style: 'tableCell', alignment: 'right', fontSize: tableFontSize }
        ]);
        totalFee += period.fee;
      });

      durationText = `${normalized.durationMonths} Months (${normalized.periods.length} ${getPeriodLabel(normalized.studyMode)}s)`;
      paymentNote = `NB: All fees are payable before the start of each ${getPeriodLabel(normalized.studyMode).toLowerCase()}.`;
    } else {
      if (!normalized.shortCourseFee) return [];

      tableBody = [
        [
          { text: 'Fee Type', style: 'tableHeader', alignment: 'center', fontSize: tableFontSize },
          { text: 'Fee (KES)', style: 'tableHeader', alignment: 'center', fontSize: tableFontSize }
        ],
        [
          { text: 'Course Fee', style: 'tableCell', alignment: 'center', fontSize: tableFontSize },
          { text: normalized.shortCourseFee.toLocaleString(), style: 'tableCell', alignment: 'right', fontSize: tableFontSize }
        ]
      ];

      totalFee = normalized.shortCourseFee;
      durationText = `${normalized.durationMonths} Months (Short Course)`;
      paymentNote = 'NB: Full payment is required before course commencement.';
    }

    tableBody.push([
      { text: 'TOTAL', style: 'tableHeader', alignment: 'center', fontSize: tableFontSize },
      { text: totalFee.toLocaleString(), style: 'tableHeader', alignment: 'right', fontSize: tableFontSize }
    ]);

    return [
      headerImage ? { image: headerImage, width: 500, alignment: 'center' } : '',
      { text: '\n' },
      { text: 'Accredited by Ministry of Education & TVETA | Reg No. MOHEST/PC/1409/011 | KNEC CENTRE NO.26578004', fontSize: 8, alignment: 'center', margin: [0, 0, 0, 8] },
      { text: '\n' },
      { text: 'FEE STRUCTURE', style: 'header', margin: [0, 0, 0, 8] },
      { text: `Course: ${courseData.name}`, fontSize: baseFontSize, margin: [0, 0, 0, 4] },
      { text: `Department: ${courseData.department}`, fontSize: baseFontSize, margin: [0, 0, 0, 2] },
      { text: `Course Type: ${courseType}`, fontSize: baseFontSize, margin: [0, 0, 0, 2] },
      { text: `Duration: ${durationText}`, fontSize: baseFontSize, margin: [0, 0, 0, 2] },
      { text: `Minimum KCSE Grade: ${normalized.minKcseGrade}`, fontSize: baseFontSize, margin: [0, 0, 0, 8] },
      {
        table: {
          headerRows: 1,
          widths: ['25%', '75%'],
          body: tableBody
        },
        layout: {
          hLineWidth: (i: number, node: any) => i === 0 || i === node.table.body.length ? 2 : 1,
          vLineWidth: (i: number, node: any) => i === 0 || i === node.table.widths.length - 1 ? 2 : 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000',
          paddingLeft: (i: number) => tablePadding,
          paddingRight: (i: number) => tablePadding,
          paddingTop: (i: number) => tablePadding,
          paddingBottom: (i: number) => tablePadding,
          fillColor: (i: number) => i === 0 ? '#E9D5FF' : null
        },
        margin: [0, 3, 0, 8]
      },
      { text: '\n' },
      {
        columns: [
          { text: paymentNote, fontSize: 8, italics: true, margin: [0, 0, 0, 4], width: '*' },
          stampImage ? { image: stampImage, width: 100, alignment: 'right' } : { text: '', width: 'auto' }
        ],
        margin: [0, 0, 0, 0]
      },
      { text: 'Late payment attracts a penalty of 5% of the outstanding amount.', fontSize: 8, italics: true, margin: [0, 0, 0, 2] },
      { text: '\n' },
      { text: 'Fee Payment Details', bold: true, fontSize: 9, margin: [0, 0, 0, 8] },
      { text: 'East Africa Vision Institute', fontSize: 9, margin: [0, 0, 0, 2] },
      { text: 'Equity Bank ACC NO.: 0470292838961', fontSize: 9, margin: [0, 0, 0, 2] },
      { text: 'KCB A/C NO. 1115207350', fontSize: 9, margin: [0, 0, 0, 2] },
      { text: `MPESA: PAYBILL NO. 257557, ACCOUNT NO. ${studentInfo?.full_name?.toUpperCase() || 'STUDENT NAME'}`, fontSize: 9, margin: [0, 0, 0, 2] },
      { text: '\n' },
      { text: 'NB: We don\'t accept Cash payment, All fees to be deposited in provided Bank Account Numbers.', fontSize: 8, italics: true, margin: [0, 0, 0, 6] },
      { text: '\n' },
      { text: 'For any inquiries, contact the finance office.', fontSize: 8, alignment: 'center', margin: [0, 0, 0, 4] }
    ];
  };

  const generateFeeStructurePDF = () => {
    if (!pdfMake) {
      alert('PDF generator not ready. Please try again.');
      return;
    }

    if (!studentInfo?.course || !studentInfo?.course_type) {
      alert('Course information not available.');
      return;
    }

    const courseData = courses.find(c => c.name === studentInfo.course);
    if (!courseData) {
      alert('Course data not found.');
      return;
    }

    const content = generateFeeStructureContent(courseData, studentInfo.course_type);

    if (content.length === 0) {
      alert('Unable to generate fee structure.');
      return;
    }

    const docDefinition: any = {
      content: content,
      styles: {
        header: { fontSize: 18, bold: true, alignment: 'center' },
        tableHeader: { fontSize: 10, bold: true, color: '#1E40AF' },
        tableCell: { fontSize: 9 }
      }
    };

    pdfMake.createPdf(docDefinition).open();
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
            <Link href="/" className="relative w-10 h-10 md:w-12 md:h-12">
              <Image
                src="/logo.webp"
                alt="EAVI Logo"
                fill
                className="object-contain"
              />
            </Link>
            <div>
              <h1 className="text-white font-bold text-base md:text-lg">Student Dashboard</h1>
              <p className="text-purple-200 text-xs md:text-sm">{studentInfo?.full_name || 'Loading...'}</p>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              Profile
            </button>
            <Link
              href="/student/calendar"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold"
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/30 backdrop-blur-md border-t border-white/10">
            <div className="px-4 py-4 flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Profile
              </button>
              <Link
                href="/student/calendar"
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Academic Calendar
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Student Info Card */}
        {showProfile && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-purple-200 text-sm mb-1">Full Name</p>
              <p className="text-white font-semibold">{studentInfo?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Admission Number</p>
              <p className="text-white font-semibold">{studentInfo?.admission_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Phone</p>
              <p className="text-white font-semibold">{studentInfo?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Email</p>
              <p className="text-white font-semibold">{studentInfo?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Course</p>
              <p className="text-white font-semibold">{studentInfo?.course || 'N/A'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Campus</p>
              <p className="text-white font-semibold">
                {studentInfo?.campus === 'main' ? 'Main Campus' : studentInfo?.campus === 'west' ? 'West Campus' : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">KCSE Grade</p>
              <p className="text-white font-semibold">{studentInfo?.kcse_grade || 'N/A'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Gender</p>
              <p className="text-white font-semibold">{studentInfo?.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Application Date</p>
              <p className="text-white font-semibold">
                {studentInfo?.application_date ? new Date(studentInfo.application_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Class</p>
              <p className="text-white font-semibold">{studentInfo?.class_name || 'N/A'}</p>
            </div>
          </div>
        </div>
        )}

        {/* Course Info Card */}
        {studentInfo?.course && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-8 border border-white/20 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Course Information</h2>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => generateFeeStructurePDF()}
                  className="w-full md:w-auto px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  Download Fee Structure
                </button>
                <a
                  href="/api/bursary"
                  download="bursary-form.pdf"
                  className="w-full md:w-auto px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-semibold text-center"
                >
                  Download Bursary Form
                </a>
              </div>
            </div>
            {(() => {
              const courseData = courses.find(c => c.name === studentInfo.course);
              if (!courseData) return <p className="text-purple-200">Course information not available</p>;
              const courseTypeConfig = getCourseTypeConfig(courseData.course_types, studentInfo.course_type || 'diploma');
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-purple-200 text-sm mb-1">Course Name</p>
                      <p className="text-white font-semibold">{courseData.name}</p>
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm mb-1">Department</p>
                      <p className="text-white font-semibold">{courseData.department}</p>
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm mb-1">Course Type</p>
                      <p className="text-white font-semibold capitalize">{studentInfo.course_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm mb-1">Current Semester</p>
                      <p className="text-white font-semibold">Semester {studentInfo.current_semester || 1}</p>
                    </div>
                  </div>

                  {courseTypeConfig && courseTypeConfig.studyMode !== 'short-course' && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-white font-semibold mb-3">Exam Plan & Period Results</h3>
                      <div className="space-y-2">
                        {courseTypeConfig.periods.map((period, index) => {
                          const periodNumber = index + 1;
                          const periodResults = examMarks.filter((mark) => mark.semester === periodNumber);
                          return (
                            <div key={periodNumber} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white/5 rounded px-3 py-2">
                              <p className="text-purple-200 text-sm">
                                {getPeriodLabel(courseTypeConfig.studyMode)} {periodNumber}: expected exams <span className="text-white font-semibold">{period.internalExams}</span>
                              </p>
                              <button
                                onClick={() => generatePeriodResultsPDF(periodNumber)}
                                disabled={periodResults.length === 0}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs font-semibold transition-colors"
                              >
                                {periodResults.length > 0 ? 'Download Results' : 'No Results Yet'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Units with Lecturers Card */}
        {unitsWithLecturers.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-8 border border-white/20 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
              Units - Semester {studentInfo?.current_semester || 1}
            </h2>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full text-white min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Unit</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Lecturer Name</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Lecturer Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {unitsWithLecturers.map((item, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-2 md:px-4 text-xs md:text-sm font-semibold">{item.unit}</td>
                      <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{item.lecturer_name}</td>
                      <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{item.lecturer_phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents Download Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-8 border border-white/20 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">Important Documents</h2>
            <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">NEW</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/api/bursary"
              download="bursary-form.pdf"
              className="w-full px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-semibold text-center flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-600/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              📄 Download Bursary Form
            </a>
          </div>
        </div>

        {/* Exam Results Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-8 border border-white/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">Exam Results</h2>
            <button
              onClick={() => generatePDF()}
              disabled={examMarks.length === 0}
              className="w-full md:w-auto px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download Results PDF
            </button>
          </div>

          {examMarks.length === 0 ? (
            <div className="text-center py-8 text-purple-200">
              No exam results available yet. Results will appear here once lecturers submit marks.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full text-white min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Unit</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Semester</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Exam Type</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Marks</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {examMarks.map((mark) => {
                    const gradeInfo = calculateGrade(mark.marks);
                    const examTypeLabel = mark.exam_type === 'combined' ? 'CAT + End Term' : mark.exam_type === 'mock' ? 'Mock Exam' : mark.exam_type;
                    return (
                      <tr key={mark.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{mark.unit}</td>
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm">Semester {mark.semester}</td>
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{examTypeLabel}</td>
                        <td className="py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">{mark.marks}</td>
                        <td className="py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">{gradeInfo.grade}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
