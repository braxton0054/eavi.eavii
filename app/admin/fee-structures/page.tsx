'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCourseTypeConfig, getPeriodLabel } from '@/lib/course-structure';

export const dynamic = 'force-dynamic';

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
      // Handle object from old structure
      const courseTypeKey = courseType.toLowerCase();
      typeData = courseData.course_types[courseTypeKey];
    }

    if (!typeData || !typeData.enabled) return [];

    let tableBody: any[] = [];
    let totalFee = 0;
    let durationText = '';
    let paymentNote = '';

    // Calculate dynamic font size based on number of rows
    const courseTypeKey = courseType.toLowerCase();
    const normalized = getCourseTypeConfig(courseData.course_types, courseTypeKey);
    if (!normalized) return [];

    let rowCount = normalized.studyMode === 'short-course' ? 1 : normalized.periods.length;

    let baseFontSize = 11;
    let tableFontSize = 10;
    let tablePadding = 8;
    let headerFontSize = 18;

    if (rowCount > 8) {
      baseFontSize = 9;
      tableFontSize = 8;
      tablePadding = 6;
      headerFontSize = 16;
    } else if (rowCount > 6) {
      baseFontSize = 10;
      tableFontSize = 9;
      tablePadding = 7;
      headerFontSize = 17;
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
      { text: 'MPESA: PAYBILL NO. 257557, ACCOUNT NO. STUDENT NAME', fontSize: 9, margin: [0, 0, 0, 2] },
      { text: '\n' },
      { text: 'NB: We don\'t accept Cash payment, All fees to be deposited in provided Bank Account Numbers.', fontSize: 8, italics: true, margin: [0, 0, 0, 6] },
      { text: '\n' },
      { text: 'For any inquiries, contact the finance office.', fontSize: 8, alignment: 'center', margin: [0, 0, 0, 4] },
      { text: '', pageBreak: 'after' }
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
                  <option value="diploma" className="text-gray-900">Diploma</option>
                  <option value="certificate" className="text-gray-900">Certificate</option>
                  <option value="artisan" className="text-gray-900">Artisan</option>
                  <option value="level6" className="text-gray-900">Level 6</option>
                  <option value="level5" className="text-gray-900">Level 5</option>
                  <option value="level4" className="text-gray-900">Level 4</option>
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
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-300 ${!generateAll ? 'bg-purple-600 text-white' : 'bg-white/20 text-white'}`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setGenerateAll(true)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-300 ${generateAll ? 'bg-purple-600 text-white' : 'bg-white/20 text-white'}`}
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
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl"
            >
              Generate Fee Structure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
