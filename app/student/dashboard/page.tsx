'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { getCourseTypeConfig, getPeriodLabel, getUnitsForPeriod } from '@/lib/course-structure';
import PaymentReceipt from '@/components/PaymentReceipt';

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
  const [financialHold, setFinancialHold] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showResultPreview, setShowResultPreview] = useState(false);
  const [previewPeriod, setPreviewPeriod] = useState<number | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

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
        loadPayments(admissionNumber);
      }
    }
  };

  // Load units with lecturers when student info is available
  useEffect(() => {
    if (studentInfo) {
      loadUnitsWithLecturers(studentInfo);
    }
  }, [studentInfo]);

  // Auto-update financial hold status every 60 seconds
  useEffect(() => {
    if (!studentInfo) return;

    const interval = setInterval(async () => {
      const { checkFinancialHold } = await import('@/lib/fee-calculation');
      const result = await checkFinancialHold(studentInfo.id);
      setFinancialHold(result.hasHold);
      setBalance(result.balance);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
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
        return;
      }

      setStudentInfo(data);
      
      // Check financial hold status
      setFinancialHold(data.financial_hold || false);
      setBalance(data.total_balance || 0);
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
      setError('An error occurred loading exam marks');
    }
  };

  const loadPayments = async (admissionNumber: string) => {
    try {
      // First get the application_id from admission_number
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('admission_number', admissionNumber)
        .single();

      if (!application) return;

      const { data, error } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('application_id', application.id)
        .order('payment_date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading payments:', error);
      } else {
        setPayments(data || []);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
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
    // Check financial hold before allowing PDF download
    if (financialHold) {
      setError(`Your transcript is locked due to outstanding balance of KES ${balance.toLocaleString()}. Please clear your balance to access your results.`);
      return;
    }

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
      
      doc.text(mark.unit_code, xPos, yPos);
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
    // Check financial hold before allowing PDF download
    if (financialHold) {
      setError(`Your transcript is locked due to outstanding balance of KES ${balance.toLocaleString()}. Please clear your balance to access your results.`);
      return;
    }

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

      doc.text(mark.unit_code, xPos, yPos);
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
        {/* Financial Hold Banner */}
        {financialHold && (
          <div className="mb-6 bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-500/50">
            <div className="flex items-center gap-4">
              <div className="text-red-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-300 font-bold text-lg">Financial Hold Active - Results Locked</h3>
                <p className="text-white text-sm">
                  Your transcript and exam results are locked due to outstanding balance of KES {balance.toLocaleString()}.
                  Please clear your balance to access your academic records and download result slips.
                </p>
              </div>
              <Link
                href="/student/payments"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
              >
                Pay Now
              </Link>
            </div>
          </div>
        )}

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
                      <h3 className="text-white font-semibold mb-4">Exam Results by Semester & Module</h3>
                      <div className="space-y-4">
                        {courseTypeConfig.periods.map((period, index) => {
                          const periodNumber = index + 1;
                          const periodResults = examMarks.filter((mark) => mark.semester === periodNumber);
                          const hasResults = periodResults.length > 0;
                          
                          return (
                            <div key={periodNumber} className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                                <div>
                                  <h4 className="text-white font-semibold">
                                    {getPeriodLabel(courseTypeConfig.studyMode)} {periodNumber}
                                  </h4>
                                  <p className="text-purple-200 text-sm">
                                    Module {studentInfo?.current_module || 1} • {period.internalExams} Expected Exams
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {hasResults && !financialHold && (
                                    <button
                                      onClick={() => {
                                        setPreviewPeriod(periodNumber);
                                        setShowResultPreview(true);
                                      }}
                                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-colors"
                                    >
                                      View Results
                                    </button>
                                  )}
                                  <div className="relative group">
                                    <button
                                      onClick={() => generatePeriodResultsPDF(periodNumber)}
                                      disabled={!hasResults || financialHold}
                                      className={`px-3 py-2 text-white rounded text-xs font-semibold transition-colors flex items-center gap-2 ${
                                        financialHold 
                                          ? 'bg-gray-600 cursor-not-allowed' 
                                          : !hasResults 
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                      }`}
                                      title={financialHold ? 'Results locked due to outstanding balance' : ''}
                                    >
                                      {financialHold && (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      )}
                                      {financialHold ? 'Locked' : !hasResults ? 'No Results' : 'Download PDF'}
                                    </button>
                                    {financialHold && (
                                      <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                        <p className="font-semibold mb-1">Financial Hold Active</p>
                                        <p>Your results are locked due to outstanding balance of KES {balance.toLocaleString()}.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {hasResults && (
                                <div className="border-t border-white/10 pt-3">
                                  <p className="text-purple-200 text-xs mb-2">Recent Results:</p>
                                  <div className="space-y-1">
                                    {periodResults.slice(0, 3).map((mark, idx) => {
                                      const gradeInfo = calculateGrade(mark.marks);
                                      return (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                          <span className="text-white">{mark.unit_code || 'Unit'}</span>
                                          <span className="text-purple-200">{mark.marks}%</span>
                                          <span className={`px-2 py-0.5 rounded ${
                                            gradeInfo.points <= 2 ? 'bg-green-500/20 text-green-300' :
                                            gradeInfo.points <= 4 ? 'bg-blue-500/20 text-blue-300' :
                                            gradeInfo.points <= 6 ? 'bg-yellow-500/20 text-yellow-300' :
                                            'bg-red-500/20 text-red-300'
                                          }`}>
                                            {gradeInfo.grade}
                                          </span>
                                        </div>
                                      );
                                    })}
                                    {periodResults.length > 3 && (
                                      <p className="text-purple-300 text-xs italic">+ {periodResults.length - 3} more results</p>
                                    )}
                                  </div>
                                </div>
                              )}
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

        {/* Recent Payments Card */}
        {payments.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-8 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Recent Payments</h2>
              <Link
                href="/student/payments"
                className="text-purple-300 text-sm hover:text-white transition-colors"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                  <div>
                    <p className="text-white font-medium capitalize">{payment.payment_type}</p>
                    <p className="text-purple-200 text-sm">
                      {new Date(payment.payment_date).toLocaleDateString()} • {payment.receipt_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">KES {payment.amount.toLocaleString()}</p>
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowReceipt(true);
                      }}
                      className="text-purple-300 text-sm hover:text-white underline"
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exam Results Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-8 border border-white/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">All Exam Results</h2>
            <button
              onClick={() => generatePDF()}
              disabled={examMarks.length === 0 || financialHold}
              className="w-full md:w-auto px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {financialHold ? 'Results Locked' : 'Download Results PDF'}
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
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">Module</th>
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
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm">{mark.unit_code}</td>
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm">Semester {mark.semester}</td>
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm">Module {mark.module || studentInfo?.current_module || 1}</td>
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

      {/* Result Preview Modal */}
      {showResultPreview && previewPeriod && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {getPeriodLabel(getCourseTypeConfig(courses.find(c => c.name === studentInfo?.course)?.course_types, studentInfo?.course_type || 'diploma')?.studyMode || 'semester')} {previewPeriod} Results
              </h2>
              <button
                onClick={() => {
                  setShowResultPreview(false);
                  setPreviewPeriod(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Name</p>
                  <p className="text-gray-800 font-semibold">{studentInfo?.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Admission No</p>
                  <p className="text-gray-800 font-semibold">{studentInfo?.admission_number}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Course</p>
                  <p className="text-gray-800 font-semibold">{studentInfo?.course}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Module</p>
                  <p className="text-gray-800 font-semibold">Module {studentInfo?.current_module || 1}</p>
                </div>
              </div>
              
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Unit</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Exam Type</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Marks</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {examMarks.filter((mark) => mark.semester === previewPeriod).map((mark) => {
                    const gradeInfo = calculateGrade(mark.marks);
                    const examTypeLabel = mark.exam_type === 'combined' ? 'CAT + End Term' : mark.exam_type === 'mock' ? 'Mock Exam' : mark.exam_type;
                    return (
                      <tr key={mark.id} className="border-b border-gray-200">
                        <td className="py-2 px-4 text-gray-800">{mark.unit_code}</td>
                        <td className="py-2 px-4 text-gray-600">{examTypeLabel}</td>
                        <td className="py-2 px-4 text-gray-800 font-semibold">{mark.marks}%</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            gradeInfo.points <= 2 ? 'bg-green-100 text-green-800' :
                            gradeInfo.points <= 4 ? 'bg-blue-100 text-blue-800' :
                            gradeInfo.points <= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {gradeInfo.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResultPreview(false);
                  setPreviewPeriod(null);
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  generatePeriodResultsPDF(previewPeriod);
                  setShowResultPreview(false);
                  setPreviewPeriod(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedPayment && studentInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Payment Receipt</h2>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setSelectedPayment(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PaymentReceipt
              receiptNumber={selectedPayment.receipt_number}
              studentName={studentInfo.full_name}
              admissionNumber={studentInfo.admission_number}
              paymentDate={selectedPayment.payment_date}
              amount={selectedPayment.amount}
              paymentType={selectedPayment.payment_type}
              paymentMethod={selectedPayment.payment_method}
              semester={selectedPayment.semester}
              module={selectedPayment.module}
            />
          </div>
        </div>
      )}
    </div>
  );
}
