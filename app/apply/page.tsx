'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import AdmissionLetter from '@/components/AdmissionLetter';
import { getCourseTypeConfig } from '@/lib/course-structure';

const KCSE_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
const GRADE_VALUE: Record<string, number> = {
  'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8, 'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
};

export default function ApplyPage() {
  const [supabase, setSupabase] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: '',
    kcseGrade: '',
    course: '',
    courseType: '',
    campus: '',
    applicationDate: '',
    admissionNumber: ''
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [availableCourseTypes, setAvailableCourseTypes] = useState<string[]>([]);
  const [suggestedCourses, setSuggestedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Initialize Supabase client only on client side
  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Generate admission number based on campus selection
  const generateAdmissionNumber = (campus: string) => {
    const currentYear = new Date().getFullYear();
    const campusCode = campus === 'main' ? 'M' : campus === 'west' ? 'W' : 'N';
    const sequenceNumber = Math.floor(Math.random() * 9000) + 1000; // Random 4-digit number
    return `${campusCode}${currentYear}${sequenceNumber}`;
  };

  // Update admission number when campus changes
  useEffect(() => {
    if (formData.campus) {
      setFormData(prev => ({
        ...prev,
        admissionNumber: generateAdmissionNumber(prev.campus)
      }));
    }
  }, [formData.campus]);

  // Load courses from Supabase
  useEffect(() => {
    if (!supabase) return;

    const loadCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            course_types (
              id,
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
        
        if (error) {
          console.error('Error loading courses:', error);
        } else {
          setCourses(data || []);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [supabase]);

  // Compare student grade with course minimum grade
  const compareGrades = (studentGrade: string, minRequiredGrade: string): boolean => {
    if (!studentGrade || !minRequiredGrade) return false;
    return GRADE_VALUE[studentGrade] >= GRADE_VALUE[minRequiredGrade];
  };

  // Get available course types for a course based on student's grade
  const getAvailableCourseTypes = (course: any, studentGrade: string): string[] => {
    if (!course || !studentGrade) return [];
    
    const availableTypes: string[] = [];
    const courseTypes = course.course_types || [];
    
    // Convert array from relational database to object keyed by level
    const courseTypesObj: any = {};
    if (Array.isArray(courseTypes)) {
      courseTypes.forEach((ct: any) => {
        courseTypesObj[ct.level] = ct;
      });
    } else {
      Object.assign(courseTypesObj, courseTypes);
    }
    
    Object.entries(courseTypesObj).forEach(([type, data]: [string, any]) => {
      const config = getCourseTypeConfig(courseTypesObj, type);
      if (config?.enabled && compareGrades(studentGrade, config.minKcseGrade)) {
        availableTypes.push(type);
      }
    });
    
    return availableTypes;
  };

  // Find suggested courses based on student's grade
  const findSuggestedCourses = (studentGrade: string): any[] => {
    if (!studentGrade || courses.length === 0) return [];
    
    return courses.filter(course => {
      const availableTypes = getAvailableCourseTypes(course, studentGrade);
      return availableTypes.length > 0;
    });
  };

  // Auto-select course type when course and grade are selected
  useEffect(() => {
    if (formData.course && formData.kcseGrade) {
      const selectedCourse = courses.find(c => c.id === formData.course || c.course_id === formData.course);
      if (selectedCourse) {
        const availableTypes = getAvailableCourseTypes(selectedCourse, formData.kcseGrade);
        setAvailableCourseTypes(availableTypes);
        
        // Auto-select the first available type
        if (availableTypes.length > 0) {
          setFormData(prev => ({ ...prev, courseType: availableTypes[0] }));
        } else {
          setFormData(prev => ({ ...prev, courseType: '' }));
          // Find suggested courses
          const suggestions = findSuggestedCourses(formData.kcseGrade);
          setSuggestedCourses(suggestions.filter(c => c.id !== formData.course && c.course_id !== formData.course));
        }
      }
    }
  }, [formData.course, formData.kcseGrade, courses]);

  // Update suggested courses when grade changes
  useEffect(() => {
    if (formData.kcseGrade) {
      const suggestions = findSuggestedCourses(formData.kcseGrade);
      setSuggestedCourses(suggestions);
    }
  }, [formData.kcseGrade, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert('System is not ready. Please refresh the page.');
      return;
    }

    setSubmitting(true);

    try {
      // Check if phone number already exists
      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('phone')
        .eq('phone', formData.phone)
        .single();

      if (existingApplication) {
        alert('An application with this phone number already exists. Please contact the college for any changes.');
        setSubmitting(false);
        return;
      }

      // Set current date on submission
      const currentDate = new Date().toISOString();
      const submissionData = {
        ...formData,
        applicationDate: currentDate,
        status: 'pending',
        current_semester: 1
      };

      // Get course and course_type_id from courses array
      const selectedCourse = courses.find(c => c.id === formData.course);
      const courseName = selectedCourse?.name || formData.course;
      
      // Get course_type_id from the selected course type
      const courseTypeData = selectedCourse?.course_types?.find((ct: any) => ct.level === formData.courseType);
      const courseTypeId = courseTypeData?.id;

      if (!courseTypeId) {
        alert('Invalid course type selection. Please try again.');
        setSubmitting(false);
        return;
      }

      // Submit to Supabase
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email || null,
          gender: formData.gender,
          kcse_grade: formData.kcseGrade,
          course_id: formData.course,
          course_type_id: courseTypeId,
          campus: formData.campus,
          admission_number: formData.admissionNumber,
          application_date: currentDate,
          status: 'pending',
          current_semester: 1
        }])
        .select()
        .single();

      if (error) {
        console.error('Error submitting application:', error);
        alert('Error submitting application. Please try again.');
      } else {
        const enrichedData = {
          ...data,
          course: courseName,
          course_type: formData.courseType
        };
        setSubmittedData(enrichedData);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      alert('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        {!submitted && (
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Image
                  src="/logo.webp"
                  alt="East Africa Vision Institute Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 128px, 160px"
                  loading="eager"
                />
              </div>
            </Link>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Apply to EAVI College</h1>
            <p className="text-purple-200 text-sm md:text-base">Fill out the form below to start your application</p>
          </div>
        )}

        {/* Confirmation Screen */}
        {submitted && submittedData && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="inline-block mb-4">
                <div className="relative w-24 h-24">
                  <Image
                    src="/logo.webp"
                    alt="East Africa Vision Institute Logo"
                    fill
                    className="object-contain"
                    sizes="96px"
                    loading="eager"
                  />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Application Submitted!</h1>
              <p className="text-purple-200 text-sm md:text-base">Your application has been successfully submitted.</p>
            </div>

            <div className="bg-white/5 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-300">Full Name:</span>
                  <span className="text-white font-medium">{submittedData.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-300">Admission Number:</span>
                  <span className="text-white font-medium">{submittedData.admission_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-300">Course:</span>
                  <span className="text-white font-medium">{submittedData.course}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-300">Campus:</span>
                  <span className="text-white font-medium capitalize">{submittedData.campus} Campus</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-300">Status:</span>
                  <span className="text-yellow-400 font-medium capitalize">{submittedData.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <AdmissionLetter studentData={submittedData} />

              <Link
                href="/"
                className="block w-full py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg transition-colors duration-300 text-base font-semibold text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* Application Form */}
        {!submitted && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hidden Fields */}
            <input
              type="hidden"
              name="applicationDate"
              value={formData.applicationDate}
            />
            <input
              type="hidden"
              name="admissionNumber"
              value={formData.admissionNumber}
            />

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-white font-medium mb-2 text-sm md:text-base">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-white font-medium mb-2 text-sm md:text-base">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              />
            </div>

            {/* Email Address (Optional) */}
            <div>
              <label htmlFor="email" className="block text-white font-medium mb-2 text-sm md:text-base">
                Email Address (Optional)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-white font-medium mb-2 text-sm md:text-base">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              >
                <option value="">Select Gender</option>
                <option value="male" className="text-gray-900">Male</option>
                <option value="female" className="text-gray-900">Female</option>
              </select>
            </div>

            {/* KCSE Grade */}
            <div>
              <label htmlFor="kcseGrade" className="block text-white font-medium mb-2 text-sm md:text-base">
                KCSE Grade *
              </label>
              <select
                id="kcseGrade"
                name="kcseGrade"
                value={formData.kcseGrade}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              >
                <option value="">Select Grade</option>
                {KCSE_GRADES.map(grade => (
                  <option key={grade} value={grade} className="text-gray-900">{grade}</option>
                ))}
              </select>
            </div>

            {/* Course Selection */}
            <div>
              <label htmlFor="course" className="block text-white font-medium mb-2 text-sm md:text-base">
                Course *
              </label>
              <select
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                disabled={loading || courses.length === 0}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{loading ? 'Loading courses...' : courses.length === 0 ? 'No courses available' : 'Select Course'}</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id} className="text-gray-900">{course.name}</option>
                ))}
              </select>
            </div>

            {/* Course Type (Auto-selected based on grade) */}
            {formData.course && formData.kcseGrade && (
              <div>
                <label htmlFor="courseType" className="block text-white font-medium mb-2 text-sm md:text-base">
                  Course Type *
                </label>
                <select
                  id="courseType"
                  name="courseType"
                  value={formData.courseType}
                  onChange={handleChange}
                  required
                  disabled={availableCourseTypes.length === 0}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {availableCourseTypes.length === 0 ? 'No types available for your grade' : 'Select Type'}
                  </option>
                  {availableCourseTypes.map(type => (
                    <option key={type} value={type} className="text-gray-900 capitalize">{type}</option>
                  ))}
                </select>
                {availableCourseTypes.length === 0 && (
                  <p className="mt-2 text-red-300 text-sm">Your grade doesn't meet the requirements for this course.</p>
                )}
              </div>
            )}

            {/* Suggested Courses */}
            {suggestedCourses.length > 0 && availableCourseTypes.length === 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-200 font-medium mb-2">Suggested courses for your grade:</p>
                <div className="space-y-2">
                  {suggestedCourses.slice(0, 5).map(course => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, course: course.id }))}
                      className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-purple-200 text-sm transition-colors"
                    >
                      {course.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campus Selection */}
            <div>
              <label htmlFor="campus" className="block text-white font-medium mb-2 text-sm md:text-base">
                Campus *
              </label>
              <select
                id="campus"
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-purple-900/50 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              >
                <option value="" className="text-gray-400">Select Campus</option>
                <option value="west" className="text-gray-900">West Campus</option>
                <option value="main" className="text-gray-900">Main Campus</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 text-white rounded-xl transition-all duration-300 text-sm md:text-base font-medium backdrop-blur-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
