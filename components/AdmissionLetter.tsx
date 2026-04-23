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

        const header = await fetchImageAsBase64('/header.png');
        const stamp = await fetchImageAsBase64('/stamp.png');
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
      // Handle object from old structure
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

    let tableBody: any[] = [];
    let totalFee = 0;
    let durationText = '';
    let paymentNote = '';

    // Use study_mode from relational database
    const studyMode = courseData.study_mode || courseData.feeStructureType || 'semester';

    // Handle different fee structure types
    if (studyMode === 'module') {
      if (!courseData.modules) return [];

      tableBody = [
        [
          { text: 'Semester', style: 'tableHeader', alignment: 'center' },
          { text: 'Fee (KES)', style: 'tableHeader', alignment: 'center' }
        ]
      ];

      let semesterCount = 0;
      courseData.modules.forEach((module: any, modIndex: number) => {
        if (module.semesters) {
          module.semesters.forEach((semester: any, semIndex: number) => {
            semesterCount++;
            tableBody.push([
              { text: `Sem ${semesterCount} (Mod ${modIndex + 1})`, style: 'tableCell', alignment: 'center' },
              { text: semester.fee.toLocaleString(), style: 'tableCell', alignment: 'right' }
            ]);
            totalFee += semester.fee;
          });
        }
      });

      durationText = `${courseData.duration_months} Months (${courseData.modules.length} Modules, ${semesterCount} Semesters)`;
      paymentNote = 'NB: All fees are payable before the start of each semester.';
    } else if (studyMode === 'short-course') {
      const shortCourseConfig = courseData.short_course_config;
      if (!shortCourseConfig) return [];

      if (shortCourseConfig.payment_type === 'monthly') {
        tableBody = [
          [
            { text: 'Month', style: 'tableHeader', alignment: 'center' },
            { text: 'Fee (KES)', style: 'tableHeader', alignment: 'center' }
          ]
        ];

        if (shortCourseConfig.monthly_fees && Array.isArray(shortCourseConfig.monthly_fees)) {
          shortCourseConfig.monthly_fees.forEach((fee: number, i: number) => {
            tableBody.push([
              { text: `Month ${i + 1}`, style: 'tableCell', alignment: 'center' },
              { text: fee.toLocaleString(), style: 'tableCell', alignment: 'right' }
            ]);
            totalFee += fee;
          });
        }

        durationText = `${courseData.duration_months} Months (${shortCourseConfig.number_of_months} Monthly Payments)`;
        paymentNote = 'NB: All fees are payable before the start of each month.';
      } else {
        tableBody = [
          [
            { text: 'Fee Type', style: 'tableHeader', alignment: 'center' },
            { text: 'Fee (KES)', style: 'tableHeader', alignment: 'center' }
          ],
          [
            { text: 'Course Fee', style: 'tableCell', alignment: 'center' },
            { text: shortCourseConfig.fee.toLocaleString(), style: 'tableCell', alignment: 'right' }
          ]
        ];

        totalFee = shortCourseConfig.fee;
        durationText = `${courseData.duration_months} Months (Short Course)`;
        paymentNote = 'NB: Full payment is required before course commencement.';
      }
    } else {
      // Default semester-based (legacy)
      if (!courseData.moduleData) return [];

      tableBody = [
        [
          { text: 'Semester', style: 'tableHeader', alignment: 'center' },
          { text: 'Fee (KES)', style: 'tableHeader', alignment: 'center' }
        ]
      ];

      let semesterCount = 0;
      courseData.moduleData.forEach((module: any, modIndex: number) => {
        if (module.semesters) {
          module.semesters.forEach((semester: any, semIndex: number) => {
            semesterCount++;
            tableBody.push([
              { text: `Sem ${semesterCount} (Mod ${modIndex + 1})`, style: 'tableCell', alignment: 'center' },
              { text: semester.fee.toLocaleString(), style: 'tableCell', alignment: 'right' }
            ]);
            totalFee += semester.fee;
          });
        }
      });

      durationText = `${courseData.duration} Months (${courseData.modules} Modules, ${semesterCount} Semesters)`;
      paymentNote = 'NB: All fees are payable before the start of each semester.';
    }

    tableBody.push([
      { text: 'TOTAL', style: 'tableHeader', alignment: 'center' },
      { text: totalFee.toLocaleString(), style: 'tableHeader', alignment: 'right' }
    ]);

    return [
      headerImage ? { image: headerImage, width: 500, alignment: 'center' as const } : '',
      { text: '\n' },
      { text: 'Accredited by Ministry of Education & TVETA | Reg No. MOHEST/PC/1409/011 | KNEC CENTRE NO.26578004', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'FEE STRUCTURE', style: 'header', margin: [0, 0, 0, 10] },
      { text: [
        { text: 'Course: ', fontSize: 11 },
        { text: courseName, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' }
      ], margin: [0, 0, 0, 5] },
      { text: [
        { text: 'Course Type: ', fontSize: 11 },
        { text: studentData.course_type, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' }
      ], margin: [0, 0, 0, 3] },
      { text: `Duration: ${durationText}`, fontSize: 11, margin: [0, 0, 0, 3] },
      { text: `Minimum KCSE Grade: ${courseData.minKcseGrade}`, fontSize: 11, margin: [0, 0, 0, 10] },
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
          paddingLeft: (i: number) => 10,
          paddingRight: (i: number) => 10,
          paddingTop: (i: number) => 8,
          paddingBottom: (i: number) => 8,
          fillColor: (i: number) => i === 0 ? '#E9D5FF' : null
        },
        margin: [0, 5, 0, 10]
      },
      { text: '\n' },
      {
        columns: [
          { text: paymentNote, fontSize: 9, italics: true, margin: [0, 0, 0, 5], width: '*' },
          stampImage ? { image: stampImage, width: 120, alignment: 'center' } : { text: '', width: 'auto' }
        ],
        margin: [0, 0, 0, 0]
      },
      { text: 'Late payment attracts a penalty of 5% of the outstanding amount.', fontSize: 9, italics: true, margin: [0, 0, 0, 2] },
      { text: '\n' },
      { text: 'Fee Payment Details', bold: true, fontSize: 10, margin: [0, 0, 0, 8] },
      { text: 'East Africa Vision Institute', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'Equity Bank ACC NO.: 0470292838961', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'KCB A/C NO. 1115207350', fontSize: 10, margin: [0, 0, 0, 3] },
      { text: 'MPESA: PAYBILL NO. 257557, ACCOUNT NO. ' + studentData.full_name.toUpperCase(), fontSize: 10, margin: [0, 0, 0, 3] },
      { text: '\n' },
      { text: 'NB: We don\'t accept Cash payment, All fees to be deposited in provided Bank Account Numbers.', fontSize: 9, italics: true, margin: [0, 0, 0, 8] },
      { text: '\n' },
      { text: 'For any inquiries, contact the finance office.', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 5] }
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
      headerImage ? { image: headerImage, width: 500, alignment: 'center' as const } : '',
      { text: '\n' },
      { text: 'Accredited by Ministry of Education & TVETA | Reg No. MOHEST/PC/1409/011 | KNEC CENTRE NO.26578004', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: '\n' },
      { text: 'Our Ref: EAVI/8833/...................', fontSize: 10, margin: [0, 0, 0, 5] },
      { text: 'Date: ' + currentDate, fontSize: 10, margin: [0, 0, 0, 5], alignment: 'right' },
      { text: 'Your Ref: ................................................................................', fontSize: 10, margin: [0, 0, 0, 5] },
      { text: '\n' },
      { text: 'Dear Sir/Madam', fontSize: 11, margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'RE: Admission Letter', bold: true, fontSize: 11, margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: [
        { text: 'Name: ', fontSize: 11 },
        { text: studentData.full_name, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' }
      ], margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'Congratulations! We are happy to inform you that by the approval of the board of directors, you have been admitted as a student in East Africa Vision Institute.', fontSize: 11, margin: [0, 0, 0, 10] },
      { text: [
        { text: 'You have been admitted for a ', fontSize: 11 },
        { text: studentData.course_type, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' },
        { text: ' in ', fontSize: 11 },
        { text: courseName, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' },
        { text: ' with admission number ', fontSize: 11 },
        { text: studentData.admission_number, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' },
        { text: '.', fontSize: 11 }
      ], margin: [0, 0, 0, 10] },
      { text: 'You are supposed to report to the institute on ' + (reportingDate || '................................................'), fontSize: 11, margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'Fee Payment Details', bold: true, fontSize: 11, margin: [0, 0, 0, 15] },
      { text: 'East Africa Vision Institute', fontSize: 11, margin: [0, 0, 0, 5] },
      { text: 'Equity Bank ACC NO.: 0470292838961', fontSize: 11, margin: [0, 0, 0, 5] },
      { text: 'KCB A/C NO. 1115207350', fontSize: 11, margin: [0, 0, 0, 5] },
      { text: 'MPESA: PAYBILL NO. 257557/4129827, ACCOUNT NO. ' + studentData.full_name.toUpperCase(), fontSize: 11, margin: [0, 0, 0, 5] },
      { text: '\n' },
      { text: 'NB: We don\'t accept Cash payment, All fees to be deposited in provided Bank Account Numbers.', fontSize: 10, italics: true, margin: [0, 0, 0, 15] },
      { text: '\n\n' },
      { text: 'Yours faithfully', fontSize: 11, margin: [0, 0, 0, 10] },
      {
        columns: [
          { text: 'TRIZAH JUMA', fontSize: 11, bold: true, margin: [0, 0, 0, 5] },
          stampImage ? { image: stampImage, width: 140, alignment: 'center' } : { text: '' }
        ]
      },
      { text: 'FOR DIRECTORS:', fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
      { text: 'PHILEMON SAINA (Bsc. Eng. MBA)', fontSize: 10, margin: [0, 0, 0, 5] },
      { text: 'BETH MWANGI, (B.A, MBA, PhD Finance)', fontSize: 10, margin: [0, 0, 0, 5] },
      { text: 'R.B PATEL (Bsc.Eng.Msc.)', fontSize: 10, margin: [0, 0, 0, 5] },
      { text: '\n\n\n' },
      { text: 'REQUIREMENTS', style: 'header', margin: [0, 0, 0, 20] },
      { text: 'Documents (All Students):', style: 'subheader' },
      { text: '• Admission Letter: copy' },
      { text: '• KCSE Certificate or Results Slip: copy' },
      { text: '• National ID or Birth Certificate: copy' },
      { text: '• Passport-Sized Photographs: 2-4 recent photos' },
      { text: '• Bank Payment Slip: Proof of tuition fee payment' },
      { text: '• Accommodation Payment Receipt: If applicable' },
      { text: '\n' },
      { text: 'Uniforms & Clothing (Medical Students Only):', style: 'subheader' },
      { text: '• KMTC Uniform with EAVI Logo' },
      { text: '• Ladies: Dress - 2 pairs' },
      { text: '• Boys: Trousers + White Shirt - 2 pairs' },
      { text: '• White Lab Coat with EAVI Logo: 2 coats' },
      { text: '• Scrubs: 2 pairs' },
      { text: '\n' },
      { text: 'Footwear (Medical Students Only):', style: 'subheader' },
      { text: '• Crocs: 2 pairs' },
      { text: '• Shoes: 2 pairs' },
      { text: '', pageBreak: 'after' },
      // Bursary Letter Page
      headerImage ? { image: headerImage, width: 500, alignment: 'center' as const } : '',
      { text: '\n' },
      { text: 'Accredited by Ministry of Education & TVETA | Reg No. MOHEST/PC/1409/011 | KNEC CENTRE NO.26578004', fontSize: 9, alignment: 'center', margin: [0, 0, 0, 20] },
      { text: '\n' },
      { text: 'Our Ref: EAVI/8833/...................', fontSize: 10, margin: [0, 0, 0, 5] },
      { text: 'Date: ......................................', fontSize: 10, margin: [0, 0, 0, 5], alignment: 'right' },
      { text: 'Your Ref: ......................................', fontSize: 10, margin: [0, 0, 0, 5] },
      { text: '\n' },
      { text: 'THE CHAIRPERSON', fontSize: 11, bold: true, margin: [0, 0, 0, 5] },
      { text: 'BURSARY COMMITTEE', fontSize: 11, bold: true, margin: [0, 0, 0, 15] },
      { text: 'Dear Sir/Madam', fontSize: 11, margin: [0, 0, 0, 10] },
      { text: 'RE: BURSARY SUPPORT FOR,', bold: true, fontSize: 11, margin: [0, 0, 0, 10] },
      { text: [
        { text: 'Name: ', fontSize: 11 },
        { text: studentData.full_name, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' }
      ], margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: [
        { text: 'The above named student Adm. No ', fontSize: 11 },
        { text: studentData.admission_number, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' },
        { text: ' has enrolled for a ', fontSize: 11 },
        { text: studentData.course_type, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' },
        { text: ' course in ', fontSize: 11 },
        { text: courseName, fontSize: 11, bold: true, decoration: 'underline', color: '#1E40AF' },
        { text: ' in our Institution.', fontSize: 11 }
      ], margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'Due to financial difficulty the student is not able to continue / start the course immediately; therefore we request that you give the student school fees support. The student has a fee balance of .............................................................. . The total fees per term is .............................................................. .', fontSize: 11, margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'Fee Payment Details', bold: true, fontSize: 11, margin: [0, 0, 0, 15] },
      { text: 'East Africa Vision Institute', fontSize: 11, margin: [0, 0, 0, 5] },
      { text: 'Equity Bank ACC NO.: 0470292838961', fontSize: 11, margin: [0, 0, 0, 5] },
      { text: 'KCB A/C NO. 1115207350', fontSize: 11, margin: [0, 0, 0, 5] },
      {
        columns: [
          { text: 'MPESA: PAYBILL NO. 257557, ACCOUNT NO. ' + studentData.full_name.toUpperCase(), fontSize: 11, margin: [0, 0, 0, 5] },
          stampImage ? { image: stampImage, width: 80, alignment: 'right' } : { text: '' }
        ]
      },
      { text: '\n' },
      { text: 'I believe you will consider her/his request.', fontSize: 11, margin: [0, 0, 0, 10] },
      { text: 'Thank you in advance,', fontSize: 11, margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'Yours faithfully', fontSize: 11, margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'For College Principal', fontSize: 10, bold: true, margin: [0, 0, 0, 5] },
      { text: 'TRIZAH JUMA', fontSize: 11, bold: true, margin: [0, 0, 0, 5], pageBreak: 'after' }
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
