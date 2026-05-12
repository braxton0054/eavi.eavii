'use client';

import { useEffect, useState } from 'react';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { createClient } from '@/lib/client';

interface StudentData {
  full_name: string;
  admission_number: string;
  course: string;
  course_id?: string;
  course_type: string;
  campus: string;
  phone: string;
  email?: string;
  gender: string;
  application_date: string;
}

interface AdmissionLetterProps {
  studentData: StudentData;
}

// Helper function to format months as years with fractions
const formatDurationYears = (months: number): string => {
  if (!months || months <= 0) return '0 Years';

  const wholeYears = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${wholeYears} Year${wholeYears !== 1 ? 's' : ''}`;
  }

  // Convert remaining months to fraction
  const fractionMap: { [key: number]: string } = {
    1: '1/12',
    2: '1/6',
    3: '1/4',
    4: '1/3',
    6: '1/2',
    8: '2/3',
    9: '3/4',
    10: '5/6',
    11: '11/12'
  };

  const fraction = fractionMap[remainingMonths] || `${remainingMonths}/12`;

  if (wholeYears === 0) {
    return `${fraction} Year`;
  }

  return `${wholeYears} ${fraction} Years`;
};

export default function AdmissionLetter({ studentData }: AdmissionLetterProps) {
  const [pdfMake, setPdfMake] = useState<any>(null);
  const [reportingDate, setReportingDate] = useState<string>('');
  const [headerImage, setHeaderImage] = useState<string>('');
  const [stampImage, setStampImage] = useState<string>('');
  const [courseTypes, setCourseTypes] = useState<any>(null);
  const [courseName, setCourseName] = useState<string>(studentData.course || '');
  const supabase = createClient();

  useEffect(() => {
    // Dynamic import of pdfmake to avoid SSR issues
    const loadPdfMake = async () => {
      try {
        const pdfMakeModule = await import('pdfmake/build/pdfmake');
        const vfsFonts = await import('pdfmake/build/vfs_fonts');
        // Use addVirtualFileSystem for proper initialization
        pdfMakeModule.addVirtualFileSystem(vfsFonts.default || vfsFonts);
        setPdfMake(pdfMakeModule);
      } catch (error) {
        console.error('Error loading pdfmake:', error);
      }
    };
    loadPdfMake();

    // Load header and stamp images as base64
    const loadImages = async () => {
      try {
        const fetchImageAsBase64 = async (url: string) => {
          try {
            const response = await fetch(url);
            if (!response.ok) return '';
            const blob = await response.blob();
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve('');
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.error('Error fetching image:', url, e);
            return '';
          }
        };

        // Try loading from Supabase Storage first, fallback to local public folder
        const STORAGE_BASE = 'https://wgbaadgxtjyhpnntogzf.supabase.co/storage/v1/object/public/templates';
        const header = await fetchImageAsBase64(`${STORAGE_BASE}/header.png`).catch(() => fetchImageAsBase64('/header.png'));
        const stamp = await fetchImageAsBase64(`${STORAGE_BASE}/stamp.png`).catch(() => fetchImageAsBase64('/stamp.png'));
        setHeaderImage(header);
        setStampImage(stamp);
        console.log('Images loaded:', { header: !!header, stamp: !!stamp });
      } catch (error) {
        console.error('Error loading images:', error);
        setHeaderImage('');
        setStampImage('');
      }
    };
    loadImages();
  }, []);

  // Fetch reporting date and course data
  useEffect(() => {
    const fetchReportingDate = async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data, error } = await supabase
        .from('reporting_dates')
        .select('reporting_date')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (error) {
        console.error('Error fetching reporting date:', error);
        // Leave blank if no reporting date set
        setReportingDate('');
      } else if (data) {
        setReportingDate(new Date(data.reporting_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));
      }
    };
    fetchReportingDate();

    // Fetch course types data to generate fee structure
    const fetchCourseFee = async () => {
      console.log('Fetching course data for:', studentData.course_id || studentData.course);
      const { data, error } = await supabase
        .from('courses')
        .select(`
          name,
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
                semester_index,
                duration_months,
                fee,
                practical_fee,
                internal_exams
              )
            )
          )
        `)
        .eq('id', studentData.course_id || studentData.course)
        .limit(1)
        .maybeSingle();

      console.log('Course data fetch result:', { error, data });
      if (error) {
        console.error('Error fetching course types:', error);
      } else if (data) {
        console.log('Course types data:', data.course_types);
        setCourseTypes(data.course_types);
        // Set course name from database
        if (data.name) {
          setCourseName(data.name);
        }
      }
    };
    fetchCourseFee();
  }, [supabase, studentData.course_id, studentData.course]);

  const generateFeeStructureContent = (courseTypes: any) => {
    console.log('Generating fee structure for:', studentData.course_type, courseTypes);
    if (!courseTypes || !studentData.course_type) {
      console.log('Missing courseTypes or course_type');
      return [
        { text: 'FEE STRUCTURE', style: 'header', margin: [0, 0, 0, 10] },
        { text: 'Fee structure information is not available at this time. Please contact the finance office.', fontSize: 11, margin: [0, 0, 0, 10] }
      ];
    }

    // Handle array from relational database
    let courseData;
    if (Array.isArray(courseTypes)) {
      courseData = courseTypes.find((ct: any) => ct.level.toLowerCase() === studentData.course_type?.toLowerCase());
    } else {
      const courseTypeKey = studentData.course_type.toLowerCase();
      courseData = courseTypes[courseTypeKey];
    }

    if (!courseData || !courseData.enabled) {
      console.log('Course data not found or not enabled');
      return [
        { text: 'FEE STRUCTURE', style: 'header', margin: [0, 0, 0, 10] },
        { text: 'Fee structure information is not available at this time. Please contact the finance office.', fontSize: 11, margin: [0, 0, 0, 10] }
      ];
    }

    console.log('Course data:', courseData);

    const studyMode = courseData.study_mode || courseData.feeStructureType || 'semester';

    // Handle short courses with simple layout
    if (studyMode === 'short-course') {
      return generateShortCourseFeeStructure(courseData);
    }

    // Main layout: Modules as rows, Semesters as columns
    const modules = courseData.modules || courseData.moduleData || [];
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

    const durationMonths = courseData.duration_months || courseData.duration || 0;
    const durationText = formatDurationYears(durationMonths);

    return [
      { text: '', pageBreak: 'before' },
      headerImage ? { image: headerImage, width: 500, alignment: 'center' as const } : '',
      { text: '\n' },
      { text: 'Accredited by Ministry of Education & TVETA | Reg No. MOHEST/PC/1409/011 | KNEC CENTRE NO.26578004', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'FEE STRUCTURE', style: 'header', margin: [0, 0, 0, 15] },

      // Course Details Header Section
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: 'Course Name:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: courseName, fontSize: 14, bold: true, decoration: 'underline', color: '#1E40AF', border: [false, false, false, false] }
            ],
            [
              { text: 'Course Type:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: studentData.course_type, fontSize: 14, bold: true, decoration: 'underline', color: '#1E40AF', border: [false, false, false, false] }
            ],
            [
              { text: 'Duration:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: durationText, fontSize: 11, border: [false, false, false, false] }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
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
            if (i === 0) return 2; // Header bottom border
            if (i === node.table.body.length - 2) return 1.5; // Before subtotals
            if (i === node.table.body.length - 1) return 2; // Grand total row
            return 0.5;
          },
          vLineWidth: (i: number, node: any) => {
            if (i === 0) return 1; // Left border
            if (i === node.table.widths.length - 2) return 2; // Before Module Total
            if (i === node.table.widths.length) return 1; // Right border
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
      { text: 'MPESA: PAYBILL NO. 257557, ACCOUNT NO. ' + studentData.full_name.toUpperCase(), fontSize: 10, margin: [0, 0, 0, 3] },
      { text: '\n' },
      { text: 'NB: We don\'t accept Cash payment. All fees to be deposited in the provided Bank Account Numbers.', fontSize: 9, italics: true, margin: [0, 0, 0, 5] }
    ];
  };

  // Helper function for short courses
  const generateShortCourseFeeStructure = (courseData: any) => {
    const shortCourseConfig = courseData.short_course_config;
    let tableBody: any[] = [];
    let totalFee = 0;
    let durationText = '';
    let paymentNote = '';

    if (shortCourseConfig?.payment_type === 'monthly') {
      tableBody = [
        [
          { text: 'MONTH', fontSize: 11, bold: true, alignment: 'center', color: '#1E40AF' },
          { text: 'FEE (KES)', fontSize: 11, bold: true, alignment: 'center', color: '#1E40AF' }
        ]
      ];

      if (shortCourseConfig.monthly_fees && Array.isArray(shortCourseConfig.monthly_fees)) {
        shortCourseConfig.monthly_fees.forEach((fee: number, i: number) => {
          tableBody.push([
            { text: `Month ${i + 1}`, fontSize: 14, alignment: 'center' },
            { text: fee.toLocaleString(), fontSize: 14, alignment: 'right' }
          ]);
          totalFee += fee;
        });
      }

      const durationMonths = courseData.duration_months || 0;
      durationText = `${formatDurationYears(durationMonths)} (${shortCourseConfig.number_of_months} Monthly Payments)`;
      paymentNote = 'All fees payable before the start of each month.';
    } else {
      tableBody = [
        [
          { text: 'FEE TYPE', fontSize: 11, bold: true, alignment: 'center', color: '#1E40AF' },
          { text: 'AMOUNT (KES)', fontSize: 11, bold: true, alignment: 'center', color: '#1E40AF' }
        ],
        [
          { text: 'Course Fee', fontSize: 14, alignment: 'center' },
          { text: shortCourseConfig?.fee?.toLocaleString() || '0', fontSize: 14, alignment: 'right' }
        ]
      ];
      totalFee = shortCourseConfig?.fee || 0;
      const durationMonths = courseData.duration_months || 0;
      durationText = `${formatDurationYears(durationMonths)} (Short Course)`;
      paymentNote = 'Full payment required before course commencement.';
    }

    // Total row
    tableBody.push([
      { text: 'TOTAL', fontSize: 12, bold: true, alignment: 'center', fillColor: '#1E40AF', color: '#FFFFFF' },
      { text: totalFee.toLocaleString(), fontSize: 12, bold: true, alignment: 'right', fillColor: '#1E40AF', color: '#FFFFFF' }
    ]);

    return [
      { text: '', pageBreak: 'before' },
      headerImage ? { image: headerImage, width: 500, alignment: 'center' as const } : '',
      { text: '\n' },
      { text: 'Accredited by Ministry of Education & TVETA | Reg No. MOHEST/PC/1409/011 | KNEC CENTRE NO.26578004', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'FEE STRUCTURE', style: 'header', margin: [0, 0, 0, 15] },

      // Course Details Header
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: 'Course Name:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: courseName, fontSize: 14, bold: true, decoration: 'underline', color: '#1E40AF', border: [false, false, false, false] }
            ],
            [
              { text: 'Course Type:', fontSize: 11, bold: true, border: [false, false, false, false] },
              { text: studentData.course_type, fontSize: 14, bold: true, decoration: 'underline', color: '#1E40AF', border: [false, false, false, false] }
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
      { text: 'MPESA: PAYBILL NO. 257557, ACCOUNT NO. ' + studentData.full_name.toUpperCase(), fontSize: 10, margin: [0, 0, 0, 3] },
      { text: '\n' },
      { text: 'NB: We don\'t accept Cash payment. All fees to be deposited in the provided Bank Account Numbers.', fontSize: 9, italics: true, margin: [0, 0, 0, 5] }
    ];
  };

  const generatePDF = () => {
    if (!pdfMake) {
      console.error('pdfmake not loaded yet');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const feeContent = generateFeeStructureContent(courseTypes);
    console.log('Fee content length:', feeContent.length);

    const mainContent: any = [
      // Main card wrapper with elegant border
      {
        stack: [
          // Header image
          headerImage ? { image: headerImage, width: 500, alignment: 'center' as const, margin: [0, 0, 0, 6] } : '',

          // Elegant gold divider line after header
          {
            canvas: [{ type: 'line', x1: 100, y1: 0, x2: 400, y2: 0, lineWidth: 2, lineColor: '#D4A843' }],
            margin: [0, 0, 0, 6]
          },

          // Section 2: Reference block with subtle background
          {
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    table: {
                      widths: ['50%', '50%'],
                      body: [
                        [
                          {
                            table: {
                              widths: ['30%', '70%'],
                              body: [
                                [
                                  { text: 'Our Ref:', fontSize: 9, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                                  { text: 'EAVI/8833/...................', fontSize: 9, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                                ]
                              ]
                            },
                            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 4, paddingBottom: () => 4 },
                            border: [false, false, false, false]
                          },
                          {
                            table: {
                              widths: ['25%', '75%'],
                              body: [
                                [
                                  { text: 'Date:', fontSize: 9, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                                  { text: currentDate, fontSize: 9, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                                ]
                              ]
                            },
                            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 4, paddingBottom: () => 4 },
                            border: [false, false, false, false]
                          }
                        ]
                      ]
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
                    border: [false, false, false, false]
                  }
                ]
              ]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            margin: [0, 0, 0, 3]
          },
          {
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    table: {
                      widths: ['20%', '80%'],
                      body: [
                        [
                          { text: 'Your Ref:', fontSize: 9, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                          { text: '................................................................................', fontSize: 9, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                        ]
                      ]
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 3, paddingBottom: () => 3 },
                    border: [false, false, false, false]
                  }
                ]
              ]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            margin: [0, 0, 0, 6]
          },

          // Elegant separator line
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 500, y2: 0, lineWidth: 0.5, lineColor: '#D4A843' }],
            margin: [0, 0, 0, 6]
          },

          // Section 3: Salutation
          { text: 'Dear Sir/Madam', fontSize: 11, margin: [0, 0, 0, 3] },

          // Section 4: Subject line and student name box
          { text: 'RE: ADMISSION LETTER', bold: true, fontSize: 12, color: '#1E3A5F', decoration: 'underline', decorationColor: '#D4A843', margin: [0, 0, 0, 3] },
          {
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    table: {
                      widths: ['15%', '85%'],
                      body: [
                        [
                          { text: 'Name:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                          { text: studentData.full_name, fontSize: 10, bold: true, color: '#1E3A5F', border: [false, false, false, false] }
                        ]
                      ]
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 6, paddingBottom: () => 6 },
                    border: [false, false, false, false],
                    fillColor: '#F8F6F0'
                  }
                ]
              ]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            margin: [0, 0, 0, 1]
          },
          {
            table: {
              widths: ['100%'],
              body: [[{ text: '', border: [true, false, false, false], borderColor: ['#D4A843', '#000000', '#000000', '#000000'] }]]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            margin: [-40, 0, 0, 2]
          },

          // Section 5: Letter body
          { text: 'Congratulations! We are happy to inform you that by the approval of the board of directors, you have been admitted as a student in East Africa Vision Institute.', fontSize: 11, lineHeight: 1.4, margin: [0, 3, 0, 3] },
          {
            text: [
              { text: 'You have been admitted for a ', fontSize: 11, lineHeight: 1.4 },
              { text: studentData.course_type, fontSize: 11, bold: true, color: '#1E3A5F', lineHeight: 1.4 },
              { text: ' in ', fontSize: 11, lineHeight: 1.4 },
              { text: courseName, fontSize: 11, bold: true, color: '#1E3A5F', lineHeight: 1.4 },
              { text: ' with admission number ', fontSize: 11, lineHeight: 1.4 },
              { text: studentData.admission_number, fontSize: 11, bold: true, color: '#1E3A5F', lineHeight: 1.4 },
              { text: '.', fontSize: 11, lineHeight: 1.4 }
            ],
            margin: [0, 0, 0, 3]
          },
          
          // Reporting date fill-in line with gold border
          {
            table: {
              widths: ['35%', '65%'],
              body: [
                [
                  { text: 'Reporting Date:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: reportingDate || '................................................................................', fontSize: 10, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                ]
              ]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 3, paddingBottom: () => 3 },
            margin: [0, 3, 0, 5]
          },

          // Section 6: Fee payment details
          { text: 'FEE PAYMENT DETAILS', bold: true, fontSize: 10, color: '#1E3A5F', margin: [0, 0, 0, 3] },
          // Gold accent line under heading
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1.5, lineColor: '#D4A843' }],
            margin: [0, 0, 0, 4]
          },
          {
            table: {
              widths: ['40%', '60%'],
              body: [
                // Header row with navy background
                [
                  { text: 'BANK / METHOD', fontSize: 8, bold: true, color: '#FFFFFF', alignment: 'left', fillColor: '#1E3A5F', border: [false, false, false, false] },
                  { text: 'ACCOUNT DETAILS', fontSize: 8, bold: true, color: '#FFFFFF', alignment: 'left', fillColor: '#1E3A5F', border: [false, false, false, false] }
                ],
                // Row 1: Equity Bank
                [
                  { text: 'Equity Bank', fontSize: 10, fillColor: '#FAFAF8' },
                  { text: 'ACC NO.: 0470292838961', fontSize: 10, fillColor: '#FAFAF8' }
                ],
                // Row 2: KCB
                [
                  { text: 'KCB', fontSize: 10, fillColor: '#FFFFFF' },
                  { text: 'A/C NO. 1115207350', fontSize: 10, fillColor: '#FFFFFF' }
                ],
                // Row 3: M-Pesa
                [
                  { text: 'M-Pesa Paybill', fontSize: 10, fillColor: '#FAFAF8' },
                  { text: 'PAYBILL NO. 257557/4129827, ACCOUNT NO. ' + studentData.full_name.toUpperCase(), fontSize: 10, fillColor: '#FAFAF8' }
                ]
              ]
            },
            layout: {
              hLineWidth: (i: number) => i === 0 ? 1 : 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#D1D5DB',
              vLineColor: () => '#D1D5DB',
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 4,
              paddingBottom: () => 4
            },
            margin: [0, 0, 0, 4]
          },
          
          // NB note with gold left border
          {
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    table: {
                      widths: ['8%', '92%'],
                      body: [
                        [
                          { text: 'NB:', fontSize: 9, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                          { text: 'We don\'t accept Cash payment, All fees to be deposited in provided Bank Account Numbers.', fontSize: 9, italics: true, color: '#6B7280', border: [false, false, false, false] }
                        ]
                      ]
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 5, paddingBottom: () => 5 },
                    fillColor: '#FFF9E6',
                    border: [true, false, false, false],
                    borderColor: ['#D4A843', '#000000', '#000000', '#000000']
                  }
                ]
              ]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            margin: [0, 0, 0, 5]
          },

          // Section 7: Closing and signature
          { text: 'Yours faithfully', fontSize: 11, margin: [0, 0, 0, 20] },
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#1E3A5F' }],
            margin: [0, 0, 0, 5]
          },
          { text: 'TRIZAH JUMA', fontSize: 11, color: '#1E3A5F', bold: true, margin: [0, 0, 0, 6] },

          // Section 8: Directors block
          { text: 'FOR DIRECTORS', fontSize: 9, color: '#1E3A5F', bold: true, margin: [0, 0, 0, 3] },
          {
            table: {
              widths: ['40%', '60%'],
              body: [
                // Header with navy background
                [
                  { text: 'NAME', fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#1E3A5F', border: [false, false, false, false] },
                  { text: 'QUALIFICATIONS', fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#1E3A5F', border: [false, false, false, false] }
                ],
                [
                  { text: 'PHILEMON SAINA', fontSize: 10, color: '#1E3A5F', bold: true, fillColor: '#FAFAF8' },
                  { text: 'Bsc. Eng. MBA', fontSize: 9, color: '#6B7280', fillColor: '#FAFAF8' }
                ],
                [
                  { text: 'BETH MWANGI', fontSize: 10, color: '#1E3A5F', bold: true, fillColor: '#FFFFFF' },
                  { text: 'B.A, MBA, PhD Finance', fontSize: 9, color: '#6B7280', fillColor: '#FFFFFF' }
                ],
                [
                  { text: 'R.B PATEL', fontSize: 10, color: '#1E3A5F', bold: true, fillColor: '#FAFAF8' },
                  { text: 'Bsc.Eng.Msc.', fontSize: 9, color: '#6B7280', fillColor: '#FAFAF8' }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#D4A843',
              vLineColor: () => '#D4A843',
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 4,
              paddingBottom: () => 4
            },
            margin: [0, 0, 0, 6]
          },

          // Requirements Section - Page 2
          { text: '', pageBreak: 'before' },
          { text: 'REQUIREMENTS', style: 'header', margin: [0, 5, 0, 8], color: '#1E3A5F' },
          { text: 'Documents (All Students):', style: 'subheader' },
          { text: '• Admission Letter: copy', margin: [0, 1, 0, 0] },
          { text: '• KCSE Certificate or Results Slip: copy', margin: [0, 1, 0, 0] },
          { text: '• National ID or Birth Certificate: copy', margin: [0, 1, 0, 0] },
          { text: '• Passport-Sized Photographs: 2-4 recent photos', margin: [0, 1, 0, 0] },
          { text: '• Bank Payment Slip: Proof of tuition fee payment', margin: [0, 1, 0, 0] },
          { text: '• Accommodation Payment Receipt: If applicable', margin: [0, 1, 0, 0] },
          { text: '\n' },
          { text: 'Uniforms & Clothing (Medical Students Only):', style: 'subheader', margin: [0, 3, 0, 3] },
          { text: '• KMTC Uniform with EAVI Logo', margin: [0, 1, 0, 0] },
          { text: '• Ladies: Dress - 2 pairs', margin: [0, 1, 0, 0] },
          { text: '• Boys: Trousers + White Shirt - 2 pairs', margin: [0, 1, 0, 0] },
          { text: '• White Lab Coat with EAVI Logo: 2 coats', margin: [0, 1, 0, 0] },
          { text: '• Scrubs: 2 pairs', margin: [0, 1, 0, 0] },
          { text: '\n' },
          { text: 'Footwear (Medical Students Only):', style: 'subheader', margin: [0, 3, 0, 3] },
          { text: '• Crocs: 2 pairs', margin: [0, 1, 0, 0] },
          { text: '• Shoes: 2 pairs', margin: [0, 1, 0, 0] }
        ],
        border: [true, true, true, true],
        borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'],
        margin: [0, 0, 0, 0]
      },

      // Section 9: Footer
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'East Africa Vision Institute | Admission Letter', fontSize: 7, color: '#9CA3AF', border: [false, false, false, false] },
              { text: 'KNEC CENTRE NO.26578004', fontSize: 7, color: '#9CA3AF', alignment: 'right', border: [false, false, false, false] }
            ]
          ]
        },
        layout: {
          hLineWidth: (i: number) => i === 0 ? 1 : 0,
          vLineWidth: () => 0,
          hLineColor: () => '#D4A843',
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 5,
          paddingBottom: () => 5,
          fillColor: () => '#F8F6F0'
        },
        margin: [0, 10, 0, 0]
      },
      { text: '', pageBreak: 'after' },
      
      // Bursary Letter Page - Page 3
      
      // Main card wrapper with border
      {
        stack: [
          // Header image
          headerImage ? { image: headerImage, width: 500, alignment: 'center' as const, margin: [0, 0, 0, 5] } : '',
          
          // Section 1: Reference block with gold accents
          {
            table: {
              widths: ['25%', '75%'],
              body: [
                [
                  { text: 'Our Ref:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: 'EAVI/8833/...................', fontSize: 10, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                ],
                [
                  { text: 'Date:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: '......................................', fontSize: 10, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 2,
              paddingBottom: () => 2
            },
            margin: [0, 0, 0, 3]
          },
          {
            table: {
              widths: ['25%', '75%'],
              body: [
                [
                  { text: 'Your Ref:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: '................................................................................', fontSize: 10, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 3,
              paddingBottom: () => 3
            },
            margin: [0, 0, 0, 8]
          },

          // Section 2: Addressee
          { text: 'THE CHAIRPERSON', fontSize: 11, bold: true, margin: [0, 0, 0, 2] },
          { text: 'BURSARY COMMITTEE', fontSize: 11, bold: true, margin: [0, 0, 0, 8] },

          // Section 3: Salutation
          { text: 'Dear Sir/Madam', fontSize: 11, margin: [0, 0, 0, 6] },

          // Section 4: Subject line and student details box
          { text: 'RE: BURSARY SUPPORT FOR', bold: true, fontSize: 12, color: '#1E3A5F', decoration: 'underline', decorationColor: '#D4A843', margin: [0, 0, 0, 6] },
          {
            table: {
              widths: ['30%', '70%'],
              body: [
                [
                  { text: 'Name:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: studentData.full_name, fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] }
                ],
                [
                  { text: 'Admission Number:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: studentData.admission_number, fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] }
                ],
                [
                  { text: 'Course:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: courseName, fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              fillColor: (i: number) => i === 0 ? '#F8F6F0' : (i % 2 === 0 ? '#F8F6F0' : '#FFFFFF')
            },
            margin: [0, 0, 0, 3]
          },
          // Gold left border accent for the box
          {
            table: {
              widths: ['100%'],
              body: [[{ text: '', border: [true, false, false, false], borderColor: ['#D4A843', '#000000', '#000000', '#000000'] }]]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            margin: [-40, 0, 0, 0]
          },

          // Section 5: Letter body
          { text: 'The above named student has enrolled for a ' + studentData.course_type + ' course in ' + courseName + ' in our Institution.', fontSize: 11, margin: [0, 6, 0, 6] },
          { text: 'Due to financial difficulty the student is not able to continue/start the course immediately; therefore we request that you give the student school fees support.', fontSize: 11, margin: [0, 0, 0, 6] },
          
          // Fee balance and total fees lines
          {
            table: {
              widths: ['40%', '60%'],
              body: [
                [
                  { text: 'Fee Balance:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: '..............................................................', fontSize: 10, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                ]
              ]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 3, paddingBottom: () => 3 },
            margin: [0, 0, 0, 3]
          },
          {
            table: {
              widths: ['40%', '60%'],
              body: [
                [
                  { text: 'Total Fees Per Term:', fontSize: 10, color: '#1E3A5F', bold: true, border: [false, false, false, false] },
                  { text: '..............................................................', fontSize: 10, border: [false, false, false, true], borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'] }
                ]
              ]
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 3, paddingBottom: () => 3 },
            margin: [0, 0, 0, 8]
          },

          // Section 6: Payment details
          { text: 'FEE PAYMENT DETAILS', bold: true, fontSize: 10, color: '#1E3A5F', margin: [0, 0, 0, 5] },
          // Gold accent line
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1.5, lineColor: '#D4A843' }],
            margin: [0, 0, 0, 6]
          },
          {
            table: {
              widths: ['40%', '60%'],
              body: [
                // Header row with navy background
                [
                  { text: 'BANK / METHOD', fontSize: 8, bold: true, color: '#FFFFFF', alignment: 'left', fillColor: '#1E3A5F', border: [false, false, false, false] },
                  { text: 'ACCOUNT / DETAILS', fontSize: 8, bold: true, color: '#FFFFFF', alignment: 'left', fillColor: '#1E3A5F', border: [false, false, false, false] }
                ],
                // Row 1: Equity Bank
                [
                  { text: 'Equity Bank', fontSize: 10, fillColor: '#FFFFFF' },
                  { text: 'ACC NO.: 0470292838961', fontSize: 10, fillColor: '#FFFFFF' }
                ],
                // Row 2: KCB
                [
                  { text: 'KCB', fontSize: 10, fillColor: '#F9FAFB' },
                  { text: 'A/C NO. 1115207350', fontSize: 10, fillColor: '#F9FAFB' }
                ],
                // Row 3: M-Pesa
                [
                  { text: 'M-Pesa Paybill', fontSize: 10, fillColor: '#FFFFFF' },
                  { text: 'PAYBILL NO. 257557, ACCOUNT NO. ' + studentData.full_name.toUpperCase(), fontSize: 10, fillColor: '#FFFFFF' }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#D4A843',
              vLineColor: () => '#D4A843',
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 5,
              paddingBottom: () => 5
            },
            margin: [0, 0, 0, 8]
          },

          // Section 7: Closing
          { text: 'I believe you will consider his/her request. Thank you in advance.', fontSize: 11, margin: [0, 0, 0, 8] },
          { text: 'Yours faithfully', fontSize: 11, margin: [0, 0, 0, 4] },
          { text: 'For College Principal', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 25] },
          
          // Signature line
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#1E3A5F' }],
            margin: [0, 0, 0, 5]
          },
          { text: studentData.full_name.toUpperCase(), fontSize: 11, color: '#1E3A5F', bold: true, margin: [0, 0, 0, 2] },
          { text: 'College Principal', fontSize: 9, color: '#6B7280', margin: [0, 0, 0, 5] }
        ],
        border: [true, true, true, true],
        borderColor: ['#D4A843', '#D4A843', '#D4A843', '#D4A843'],
        margin: [20, 20, 20, 20]
      },
      
      // Footer for Bursary Letter
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'East Africa Vision Institute | Bursary Letter', fontSize: 7, color: '#9CA3AF', border: [false, false, false, false] },
              { text: 'Ref: EAVI/8833', fontSize: 7, color: '#9CA3AF', alignment: 'right', border: [false, false, false, false] }
            ]
          ]
        },
        layout: {
          hLineWidth: (i: number) => i === 0 ? 1 : 0,
          vLineWidth: () => 0,
          hLineColor: () => '#D4A843',
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 5,
          paddingBottom: () => 5,
          fillColor: () => '#F8F6F0'
        },
        margin: [0, 10, 0, 0]
      },
    ];

    const docDefinition: any = {
      content: [...mainContent, ...feeContent],
      styles: {
        header: { fontSize: 18, bold: true, alignment: 'center' },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        tableHeader: { fontSize: 11, bold: true, color: '#1E40AF' },
        tableCell: { fontSize: 10 }
      }
    };

    // Downloads the PDF automatically
    pdfMake.createPdf(docDefinition).download('admission-letter.pdf');
  };

  return (
    <button
      onClick={generatePDF}
      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl"
    >
      Download Admission Letter
    </button>
  );
}
