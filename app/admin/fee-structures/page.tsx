'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCourseTypeConfig, getPeriodLabel } from '@/lib/course-structure';

export const dynamic = 'force-dynamic';

// Helper function to format months as years with fractions
const formatDurationYears = (months: number): string => {
  if (!months || months <= 0) return '0 Years';

  const wholeYears = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${wholeYears} Year${wholeYears !== 1 ? 's' : ''}`;
  }

  const fractionMap: { [key: number]: string } = {
    1: '1/12', 2: '1/6', 3: '1/4', 4: '1/3', 6: '1/2',
    8: '2/3', 9: '3/4', 10: '5/6', 11: '11/12'
  };

  const fraction = fractionMap[remainingMonths] || `${remainingMonths}/12`;

  if (wholeYears === 0) {
    return `${fraction} Year`;
  }

  return `${wholeYears} ${fraction} Years`;
};

export default function FeeStructuresPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [pdfMake, setPdfMake] = useState<any>(null);
  const [headerImage, setHeaderImage] = useState<string>('');
  const [stampImage, setStampImage] = useState<string>('');

  useEffect(() => {
    setSupabase(createClient());
  }, []);
  
  // Filter options
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCourseType, setSelectedCourseType] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses, setCourses] = useState<any[]>([]);
  const [generateAll, setGenerateAll] = useState<boolean>(false);

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
        router.push('/login/admin');
        return;
      }

      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);
      setAdminEmail(session.user?.email || '');

      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  useEffect(() => {
    if (!supabase) return;

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

    // Dynamic import of pdfmake
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

    // Load departments
    const loadDepartments = async () => {
      const { data } = await supabase
        .from('departments')
        .select('name')
        .order('name');
      
      if (data) {
        const uniqueDepts = data.map((d: any) => d.name) as string[];
        setDepartments(uniqueDepts);
      }
    };
    loadDepartments();

    // Load all courses with department info
    const loadCourses = async () => {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, department_id');
      
      if (coursesError) {
        console.error('Error loading courses:', coursesError);
        setCourses([]);
        return;
      }

      // If courses loaded, get department names
      if (coursesData && coursesData.length > 0) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('id, name');

        const deptMap = new Map();
        if (deptData) {
          deptData.forEach((d: any) => deptMap.set(d.id, d.name));
        }

        // Add department name to each course
        const coursesWithDept = coursesData.map((c: any) => ({
          ...c,
          department: deptMap.get(c.department_id) || 'Unknown'
        }));

        setCourses(coursesWithDept);
      } else {
        setCourses([]);
      }
    };
    loadCourses();
  }, [supabase]);

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

  const generateFeeStructureContent = (courseData: any, courseType: string) => {
    if (!courseData || !courseData.course_types) return [];

    // Handle array from relational database
    let typeData;
    if (Array.isArray(courseData.course_types)) {
      typeData = courseData.course_types.find((ct: any) => ct.level.toLowerCase() === courseType.toLowerCase());
    } else {
      const courseTypeKey = courseType.toLowerCase();
      typeData = courseData.course_types[courseTypeKey];
    }

    if (!typeData || !typeData.enabled) return [];

    const normalized = getCourseTypeConfig(courseData.course_types, courseType.toLowerCase());
    if (!normalized) return [];

    // Handle short courses with simple layout
    if (normalized.studyMode === 'short-course') {
      return generateShortCourseFeeContent(courseData, courseType, normalized);
    }

    // Main layout: Modules as rows, Semesters as columns
    const modules = typeData.modules || [];
    if (!modules.length) return [];

    const numSemesters = modules[0]?.semesters?.length || 3;
    const numModules = modules.length;

    // Calculate totals
    const semesterTotals: number[] = new Array(numSemesters).fill(0);
    const moduleTotals: number[] = [];
    let grandTotal = 0;

    modules.forEach((module: any, modIndex: number) => {
      let moduleTotal = 0;
      if (module.semesters) {
        module.semesters.forEach((semester: any, semIndex: number) => {
          const fee = semester.fee || 0;
          semesterTotals[semIndex] += fee;
          moduleTotal += fee;
        });
      }
      moduleTotals.push(moduleTotal);
      grandTotal += moduleTotal;
    });

    // Build table widths: Module name + each semester + Module Total
    const colWidthModule = '20%';
    const colWidthSemester = `${55 / numSemesters}%`;
    const colWidthTotal = '25%';
    const widths = [colWidthModule, ...Array(numSemesters).fill(colWidthSemester), colWidthTotal];

    // Build table body
    const tableBody: any[] = [];

    // Header row with column labels
    const headerRow = [
      { text: 'MODULE', fontSize: 11, bold: true, alignment: 'center', color: '#1E40AF' },
      ...Array.from({ length: numSemesters }, (_, i) => ({
        text: `SEMESTER ${i + 1}`,
        fontSize: 11,
        bold: true,
        alignment: 'center',
        color: '#1E40AF'
      })),
      { text: 'MODULE TOTAL', fontSize: 11, bold: true, alignment: 'center', color: '#1E40AF', fillColor: '#F3E8FF' }
    ];
    tableBody.push(headerRow);

    // Module rows with alternating shading
    modules.forEach((module: any, modIndex: number) => {
      const isEven = modIndex % 2 === 0;
      const fillColor = isEven ? '#FFFFFF' : '#F9FAFB';
      const semesterFees = module.semesters || [];

      const row = [
        {
          text: `Module ${modIndex + 1}`,
          fontSize: 14,
          bold: true,
          alignment: 'left',
          fillColor: fillColor
        },
        ...Array.from({ length: numSemesters }, (_, semIndex) => ({
          text: semesterFees[semIndex]?.fee?.toLocaleString() || '0',
          fontSize: 14,
          alignment: 'right',
          fillColor: fillColor
        })),
        {
          text: moduleTotals[modIndex]?.toLocaleString() || '0',
          fontSize: 14,
          bold: true,
          alignment: 'right',
          fillColor: '#F3E8FF',
          border: [true, false, false, false]
        }
      ];
      tableBody.push(row);
    });

    // Semester Subtotals row
    const subtotalsRow = [
      {
        text: 'SEMESTER SUBTOTALS',
        fontSize: 11,
        bold: true,
        alignment: 'left',
        fillColor: '#E5E7EB',
        colSpan: 1
      },
      ...semesterTotals.map(total => ({
        text: total.toLocaleString(),
        fontSize: 11,
        bold: true,
        alignment: 'right',
        fillColor: '#E5E7EB'
      })),
      {
        text: '',
        fillColor: '#E5E7EB'
      }
    ];
    tableBody.push(subtotalsRow);

    // Grand Total row
    const grandTotalRow = [
      {
        text: 'GRAND TOTAL',
        fontSize: 12,
        bold: true,
        alignment: 'left',
        fillColor: '#1E40AF',
        color: '#FFFFFF',
        colSpan: 1
      },
      ...Array(numSemesters).fill({
        text: '',
        fillColor: '#1E40AF'
      }),
      {
        text: grandTotal.toLocaleString(),
        fontSize: 12,
        bold: true,
        alignment: 'right',
        fillColor: '#1E40AF',
        color: '#FFFFFF'
      }
    ];
    tableBody.push(grandTotalRow);

    const durationText = formatDurationYears(normalized.durationMonths);

    return [
      headerImage ? { image: headerImage, width: 500, alignment: 'center' } : '',
      { text: '\n' },
      { text: 'Accredited by Ministry of Education & TVETA | Reg No. MOHEST/PC/1409/011 | KNEC CENTRE NO.26578004', fontSize: 8, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'FEE STRUCTURE', style: 'header', margin: [0, 0, 0, 15] },

      // Course Details Header Section
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: 'Course Name:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: courseData.name, fontSize: 14, bold: true, decoration: 'underline', color: '#1E40AF', border: [false, false, false, false] }
            ],
            [
              { text: 'Department:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: courseData.department, fontSize: 11, border: [false, false, false, false] }
            ],
            [
              { text: 'Course Type:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: courseType, fontSize: 14, bold: true, decoration: 'underline', color: '#1E40AF', border: [false, false, false, false] }
            ],
            [
              { text: 'Duration:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: durationText, fontSize: 11, border: [false, false, false, false] }
            ]
          ]
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 3, paddingBottom: () => 3 },
        margin: [0, 0, 0, 15]
      },

      // Main Fee Table
      {
        table: {
          headerRows: 1,
          widths: widths,
          body: tableBody
        },
        layout: {
          hLineWidth: (i: number, node: any) => {
            if (i === 0) return 2;
            if (i === node.table.body.length - 2) return 1.5;
            if (i === node.table.body.length - 1) return 2;
            return 0.5;
          },
          vLineWidth: (i: number, node: any) => {
            if (i === 0) return 1;
            if (i === node.table.widths.length - 2) return 2;
            if (i === node.table.widths.length) return 1;
            return 0.5;
          },
          hLineColor: (i: number) => {
            if (i === 0) return '#1E40AF';
            return '#E5E7EB';
          },
          vLineColor: (i: number, node: any) => {
            if (i === node.table.widths.length - 2) return '#1E40AF';
            return '#E5E7EB';
          },
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6
        },
        margin: [0, 5, 0, 15]
      },

      // Footer Notes
      {
        text: [
          { text: 'Currency: ', fontSize: 10, bold: true },
          { text: 'Kenyan Shillings (KES) | ', fontSize: 10 },
          { text: 'Payment Terms: ', fontSize: 10, bold: true },
          { text: 'All fees payable before start of each semester', fontSize: 10 }
        ],
        margin: [0, 0, 0, 8]
      },
      {
        text: 'Late payment attracts a penalty of 5% of the outstanding amount.',
        fontSize: 9,
        italics: true,
        margin: [0, 0, 0, 15]
      },

      // Payment Details
      { text: 'Fee Payment Details', bold: true, fontSize: 10, margin: [0, 0, 0, 8] },
      { text: 'East Africa Vision Institute', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'Equity Bank ACC NO.: 0470292838961', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'KCB A/C NO. 1115207350', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'MPESA: PAYBILL NO. 257557, ACCOUNT NO. STUDENT NAME', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: '\n' },
      { text: 'NB: We don\'t accept Cash payment. All fees to be deposited in the provided Bank Account Numbers.', fontSize: 9, italics: true, margin: [0, 0, 0, 5] }
    ];
  };

  const generateShortCourseFeeContent = (courseData: any, courseType: string, normalized: any) => {
    let tableBody: any[] = [];
    let totalFee = 0;
    let durationText = '';
    let paymentNote = '';

    if (normalized.shortCourseFee) {
      tableBody = [
        [
          { text: 'FEE TYPE', fontSize: 11, bold: true, alignment: 'center', color: '#1E40AF' },
          { text: 'AMOUNT (KES)', fontSize: 11, bold: true, alignment: 'center', color: '#1E40AF' }
        ],
        [
          { text: 'Course Fee', fontSize: 14, alignment: 'center' },
          { text: normalized.shortCourseFee.toLocaleString(), fontSize: 14, alignment: 'right' }
        ]
      ];
      totalFee = normalized.shortCourseFee;
      durationText = `${formatDurationYears(normalized.durationMonths)} (Short Course)`;
      paymentNote = 'Full payment required before course commencement.';
    }

    tableBody.push([
      { text: 'TOTAL', fontSize: 12, bold: true, alignment: 'center', fillColor: '#1E40AF', color: '#FFFFFF' },
      { text: totalFee.toLocaleString(), fontSize: 12, bold: true, alignment: 'right', fillColor: '#1E40AF', color: '#FFFFFF' }
    ]);

    return [
      headerImage ? { image: headerImage, width: 500, alignment: 'center' } : '',
      { text: '\n' },
      { text: 'Accredited by Ministry of Education & TVETA | Reg No. MOHEST/PC/1409/011 | KNEC CENTRE NO.26578004', fontSize: 8, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'FEE STRUCTURE', style: 'header', margin: [0, 0, 0, 15] },

      // Course Details Header
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: 'Course Name:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: courseData.name, fontSize: 14, bold: true, decoration: 'underline', color: '#1E40AF', border: [false, false, false, false] }
            ],
            [
              { text: 'Course Type:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: courseType, fontSize: 14, bold: true, decoration: 'underline', color: '#1E40AF', border: [false, false, false, false] }
            ],
            [
              { text: 'Duration:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: durationText, fontSize: 11, border: [false, false, false, false] }
            ]
          ]
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 3, paddingBottom: () => 3 },
        margin: [0, 0, 0, 15]
      },

      // Fee Table
      {
        table: {
          headerRows: 1,
          widths: ['50%', '50%'],
          body: tableBody
        },
        layout: {
          hLineWidth: (i: number, node: any) => i === 0 || i === node.table.body.length - 1 ? 2 : 0.5,
          vLineWidth: (i: number, node: any) => i === 0 || i === node.table.widths.length ? 1 : 0,
          hLineColor: (i: number) => i === 0 ? '#1E40AF' : '#E5E7EB',
          vLineColor: () => '#E5E7EB',
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 8,
          paddingBottom: () => 8
        },
        margin: [0, 5, 0, 15]
      },

      // Footer
      {
        text: [
          { text: 'Currency: ', fontSize: 10, bold: true },
          { text: 'Kenyan Shillings (KES) | ', fontSize: 10 },
          { text: 'Payment Terms: ', fontSize: 10, bold: true },
          { text: paymentNote, fontSize: 10 }
        ],
        margin: [0, 0, 0, 15]
      },

      { text: 'Fee Payment Details', bold: true, fontSize: 10, margin: [0, 0, 0, 8] },
      { text: 'East Africa Vision Institute', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'Equity Bank ACC NO.: 0470292838961', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'KCB A/C NO. 1115207350', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'MPESA: PAYBILL NO. 257557, ACCOUNT NO. STUDENT NAME', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: '\n' },
      { text: 'NB: We don\'t accept Cash payment. All fees to be deposited in the provided Bank Account Numbers.', fontSize: 9, italics: true, margin: [0, 0, 0, 5] }
    ];
  };

  const generatePDF = async () => {
    if (!pdfMake) {
      console.error('pdfmake not loaded yet');
      return;
    }

    // Fetch course_types for courses that need it
    const coursesWithTypes = await Promise.all(
      courses.map(async (course: any) => {
        if (course.course_types && course.course_types.length > 0) {
          return course;
        }
        // Fetch course_types for this course
        const { data: typesData } = await supabase
          .from('course_types')
          .select('*')
          .eq('course_id', course.id);
        
        return { ...course, course_types: typesData || [] };
      })
    );

    let content: any[] = [];

    if (generateAll) {
      let filteredCourses = coursesWithTypes;
      if (selectedDepartment) {
        filteredCourses = filteredCourses.filter((c: any) => c.department === selectedDepartment);
      }
      if (selectedCourseType) {
        filteredCourses = filteredCourses.filter((c: any) => {
          const typeData = Array.isArray(c.course_types)
            ? c.course_types.find((ct: any) => ct.level.toLowerCase() === selectedCourseType.toLowerCase())
            : c.course_types[selectedCourseType.toLowerCase()];
          return typeData && typeData.enabled;
        });
      }
      if (selectedCourse) {
        filteredCourses = filteredCourses.filter((c: any) => c.id === selectedCourse);
      }

      filteredCourses.forEach((course: any, index: number) => {
        const courseTypes = Array.isArray(course.course_types)
          ? course.course_types.filter((ct: any) => ct.enabled).map((ct: any) => ct.level)
          : Object.keys(course.course_types).filter((type: string) => course.course_types[type].enabled);
        
        courseTypes.forEach((type: string, typeIndex: number) => {
          const feeContent = generateFeeStructureContent(course, type);
          if (index === filteredCourses.length - 1 && typeIndex === courseTypes.length - 1) {
            feeContent.pop();
          }
          content = content.concat(feeContent);
        });
      });
    } else {
      const course = coursesWithTypes.find((c: any) => c.id === selectedCourse);
      if (course && selectedCourseType) {
        content = generateFeeStructureContent(course, selectedCourseType);
      }
    }

    if (content.length === 0) {
      alert('No fee structure data found. Please check that courses have fee configuration set up.');
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminCampus');
    router.push('/login/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const filteredCourses = courses.filter((c: any) => {
    if (selectedDepartment && c.department !== selectedDepartment) return false;
    return true;
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
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
                <h1 className="text-xl md:text-2xl font-bold text-white">Fee Structure Generator</h1>
                <p className="text-purple-200 text-sm">Generate fee structures for courses</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Generate Fee Structure</h2>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-purple-200 text-sm mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="text-gray-900">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="text-gray-900">{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">Course Type</label>
                <select
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="text-gray-900">All Types</option>
                  <option value="diploma" className="text-gray-900">KNEC Diploma</option>
                  <option value="certificate" className="text-gray-900">KNEC Certificate</option>
                  <option value="artisan" className="text-gray-900">KNEC Artisan</option>
                  <option value="level6" className="text-gray-900">CDACC Level 6 (Higher Diploma)</option>
                  <option value="level5" className="text-gray-900">CDACC Level 5 (Diploma)</option>
                  <option value="level4" className="text-gray-900">CDACC Level 4 (Certificate)</option>
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">Specific Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={generateAll}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <option value="" className="text-gray-900">All Courses</option>
                  {filteredCourses.map((course) => (
                    <option key={course.id} value={course.id} className="text-gray-900">{course.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">Generate Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGenerateAll(false)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-300 ${!generateAll ? 'bg-green-600 text-white' : 'bg-white/20 text-white'}`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setGenerateAll(true)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-300 ${generateAll ? 'bg-green-600 text-white' : 'bg-white/20 text-white'}`}
                  >
                    All
                  </button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-purple-200 text-sm">
                {generateAll 
                  ? 'Will generate fee structures for all courses matching the selected filters. Each course type (Diploma, Certificate, Artisan) will be generated separately.'
                  : 'Will generate fee structure for the selected course and course type.'
                }
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePDF}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl"
            >
              Generate Fee Structure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
