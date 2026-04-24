'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

type LevelKey = 'diploma' | 'certificate' | 'artisan' | 'level6' | 'level5' | 'level4';
type StudyMode = 'module' | 'short-course';

const LEVEL_MODULE_INDEX_MAP: Record<LevelKey, number> = {
  diploma: -1,
  certificate: -2,
  artisan: -3,
  level6: -4,
  level5: -5,
  level4: -6
};

export default function CourseEnrollmentPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  
  // Data state
  const [courses, setCourses] = useState<any[]>([]);
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [courseExamBodies, setCourseExamBodies] = useState<Record<string, string>>({});
  
  // Selection state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | ''>('');
  const [selectedExamBody, setSelectedExamBody] = useState<'KNEC' | 'CDACC' | 'JP' | 'internal' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'assign' | 'view'>('assign');
  
  // Form state
  const [unitInputs, setUnitInputs] = useState<Record<string, string>>({});
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        router.push('/');
        return;
      }

      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);
      
      await loadCourses();
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          department_id,
          departments(name)
        `)
        .order('name');
        
      if (error) throw error;
      
      console.log('Loaded courses:', data);
      
      // Determine exam body from course ID prefix
      const examBodyMap: Record<string, string> = {};
      (data || []).forEach((course: any) => {
        if (course.id.startsWith('KNEC-')) examBodyMap[course.id] = 'KNEC';
        else if (course.id.startsWith('CDACC-')) examBodyMap[course.id] = 'CDACC';
        else if (course.id.startsWith('JP-')) examBodyMap[course.id] = 'JP';
        else examBodyMap[course.id] = 'internal';
      });
      
      console.log('Exam body map:', examBodyMap);
      
      setCourseExamBodies(examBodyMap);
      setCourses(data || []);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses.');
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseTypes(selectedCourseId);
      setSelectedLevel('');
    } else {
      setCourseTypes([]);
      setModules([]);
      setSemesters([]);
      setUnits([]);
      setSelectedLevel('');
    }
  }, [selectedCourseId]);

  useEffect(() => {
    // Reset selections when exam body changes
    setSelectedCourseId('');
    setSelectedLevel('');
  }, [selectedExamBody]);

  const loadCourseTypes = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_types')
        .select('*')
        .eq('course_id', courseId)
        .eq('enabled', true);
        
      if (error) throw error;
      setCourseTypes(data || []);
    } catch (err) {
      console.error('Error loading course types:', err);
    }
  };

  useEffect(() => {
    if (selectedCourseId && selectedLevel) {
      loadCourseStructure(selectedCourseId, selectedLevel);
    } else {
      setModules([]);
      setSemesters([]);
      setUnits([]);
    }
  }, [selectedLevel]);

  const loadCourseStructure = async (courseId: string, level: string) => {
    try {
      setError('');
      setSuccess('');
      const courseType = courseTypes.find(ct => ct.level === level);
      if (!courseType) return;

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_type_id', courseType.id)
        .order('module_index');
        
      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      if (modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map((m: any) => m.id);
        const { data: semestersData, error: semestersError } = await supabase
          .from('semesters')
          .select('*')
          .in('module_id', moduleIds)
          .order('semester_index');
          
        if (semestersError) throw semestersError;
        setSemesters(semestersData || []);
      }

      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', courseId);
        
      if (unitsError) throw unitsError;
      setUnits(unitsData || []);
      
    } catch (err: any) {
      console.error('Error loading structure:', err);
      setError('Failed to load course details.');
    }
  };

  const currentCourseType = courseTypes.find(ct => ct.level === selectedLevel);
  const isShortCourse = currentCourseType?.study_mode === 'short-course';

  const getExamBodyFromCourseId = (courseId: string): 'KNEC' | 'CDACC' | 'JP' | 'internal' => {
    // Use exam body from database if available
    if (courseExamBodies[courseId]) {
      return courseExamBodies[courseId] as 'KNEC' | 'CDACC' | 'JP' | 'internal';
    }
    // Fallback to prefix detection
    if (courseId.startsWith('KNEC-')) return 'KNEC';
    if (courseId.startsWith('CDACC-')) return 'CDACC';
    if (courseId.startsWith('JP-')) return 'JP';
    return 'internal';
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.departments?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const courseExamBody = getExamBodyFromCourseId(course.id);
    const matchesExamBody = !selectedExamBody || courseExamBody === selectedExamBody;
    
    console.log(`Course: ${course.id}, ExamBody: ${courseExamBody}, Selected: ${selectedExamBody}, Matches: ${matchesExamBody}`);
    
    return matchesSearch && matchesExamBody;
  });

  const [allCoursesData, setAllCoursesData] = useState<any[]>([]);
  const [loadingAllCourses, setLoadingAllCourses] = useState(false);

  const loadAllCoursesWithStructure = async () => {
    setLoadingAllCourses(true);
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          department_id,
          departments(name),
          course_types(
            id,
            level,
            enabled,
            min_kcse_grade,
            study_mode,
            duration_months,
            modules(
              id,
              module_index,
              semesters(
                id,
                semester_index,
                duration_months,
                fee,
                practical_fee,
                internal_exams
              )
            )
          )
        `)
        .order('name');

      if (coursesError) throw coursesError;

      // Load units separately for each course
      const coursesWithUnits = await Promise.all(
        (coursesData || []).map(async (course: any) => {
          const { data: unitsData } = await supabase
            .from('units')
            .select('*')
            .eq('course_id', course.id);

          return {
            ...course,
            units: unitsData || []
          };
        })
      );

      setAllCoursesData(coursesWithUnits);
    } catch (err: any) {
      console.error('Error loading all courses:', err);
      setError('Failed to load courses.');
    } finally {
      setLoadingAllCourses(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'view' && allCoursesData.length === 0) {
      loadAllCoursesWithStructure();
    }
  }, [viewMode]);

  const addUnit = async (moduleIndex: number, semesterIndex: number, inputKey: string) => {
    const unitName = unitInputs[inputKey]?.trim();
    if (!unitName) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let semesterId = null;
      if (!isShortCourse) {
        const mod = modules.find(m => m.module_index === moduleIndex);
        if (!mod) throw new Error('Module not found');
        const sem = semesters.find(s => s.module_id === mod.id && s.semester_index === semesterIndex);
        if (!sem) throw new Error('Semester not found');
        semesterId = sem.id;
      }

      const { data, error: insertError } = await supabase
        .from('units')
        .insert([{
          course_id: selectedCourseId,
          semester_id: semesterId,
          name: unitName,
          module_index: moduleIndex,
          semester_index: semesterIndex
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setUnits(prev => [...prev, data]);
      setUnitInputs(prev => ({ ...prev, [inputKey]: '' }));
      setSuccess('Unit added successfully.');
    } catch (err: any) {
      console.error('Error adding unit:', err);
      setError(`Failed to add unit: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const removeUnit = async (unitId: string) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: deleteError } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (deleteError) throw deleteError;

      setUnits(prev => prev.filter(u => u.id !== unitId));
      setSuccess('Unit removed successfully.');
    } catch (err: any) {
      console.error('Error removing unit:', err);
      setError(`Failed to remove unit: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateUnit = async (unitId: string) => {
    const newName = editUnitName.trim();
    if (!newName) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('units')
        .update({ name: newName })
        .eq('id', unitId);

      if (updateError) throw updateError;

      setUnits(prev => prev.map(u => u.id === unitId ? { ...u, name: newName } : u));
      setSuccess('Unit updated successfully.');
      setEditingUnitId(null);
      setEditUnitName('');
    } catch (err: any) {
      console.error('Error updating unit:', err);
      setError(`Failed to update unit: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getCampusName = (campusCode: string) => {
    switch (campusCode) {
      case 'main': return 'Main Campus';
      case 'west': return 'West Campus';
      default: return 'Unknown Campus';
    }
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
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="relative w-12 h-12">
                <Image src="/logo.webp" alt="EAVI Logo" fill className="object-contain" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Course Enrollment (Units)</h1>
                <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setViewMode('assign')}
                className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors duration-300 text-xs md:text-sm font-semibold border ${
                  viewMode === 'assign'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                Assign Units
              </button>
              <button
                onClick={() => setViewMode('view')}
                className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors duration-300 text-xs md:text-sm font-semibold border ${
                  viewMode === 'view'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                View All Courses
              </button>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-3 py-2 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-300 text-xs md:text-sm font-semibold border border-white/20"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {viewMode === 'assign' ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Assign Units to Course</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
              )}

            <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3 mb-8">
              <div>
                <label className="block text-purple-200 text-xs md:text-sm font-medium mb-2">Exam Body</label>
                <select
                  value={selectedExamBody}
                  onChange={(e) => setSelectedExamBody(e.target.value as 'KNEC' | 'CDACC' | 'JP' | 'internal' | '')}
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base"
                >
                  <option value="" className="text-gray-900">All Exam Bodies</option>
                  <option value="KNEC" className="text-gray-900">KNEC</option>
                  <option value="CDACC" className="text-gray-900">CDACC</option>
                  <option value="JP" className="text-gray-900">JP International</option>
                  <option value="internal" className="text-gray-900">Internal</option>
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-xs md:text-sm font-medium mb-2">Select Course *</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all mb-2 text-sm md:text-base"
                />
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base"
                >
                  <option value="" className="text-gray-900">-- Select a Course --</option>
                  {filteredCourses.map(course => (
                    <option key={course.id} value={course.id} className="text-gray-900">
                      {course.name} ({course.departments?.name || 'No Dept'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-xs md:text-sm font-medium mb-2">Select Level *</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as LevelKey)}
                  disabled={!selectedCourseId || courseTypes.length === 0}
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50 text-sm md:text-base"
                >
                  <option value="" className="text-gray-900">-- Select a Level --</option>
                  {courseTypes.map(ct => (
                    <option key={ct.id} value={ct.level} className="text-gray-900">
                      {ct.level.charAt(0).toUpperCase() + ct.level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedLevel && currentCourseType && (
              <div className="space-y-8 mt-8 border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">
                  {isShortCourse ? 'Short Course Units' : 'Modular Course Units'}
                </h3>
                
                {isShortCourse ? (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-4">All Units</h4>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <input
                        type="text"
                        value={unitInputs['short'] || ''}
                        onChange={(e) => setUnitInputs({ ...unitInputs, 'short': e.target.value })}
                        placeholder="Enter unit name..."
                        className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => addUnit(LEVEL_MODULE_INDEX_MAP[selectedLevel], -1, 'short')}
                        disabled={saving || !unitInputs['short']?.trim()}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
                      >
                        Add Unit
                      </button>
                    </div>

                    <div className="space-y-2">
                      {units.filter(u => u.module_index === LEVEL_MODULE_INDEX_MAP[selectedLevel] && u.semester_index === -1).length === 0 ? (
                        <p className="text-purple-300/60 text-sm italic py-2">No units added yet.</p>
                      ) : (
                        units
                          .filter(u => u.module_index === LEVEL_MODULE_INDEX_MAP[selectedLevel] && u.semester_index === -1)
                          .map((unit) => (
                            <div key={unit.id} className="flex items-center justify-between bg-white/10 px-4 py-3 rounded-lg group hover:bg-white/15 transition-colors">
                              {editingUnitId === unit.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={editUnitName}
                                    onChange={(e) => setEditUnitName(e.target.value)}
                                    className="flex-1 px-3 py-1 bg-white/20 border border-white/30 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                  <button
                                    onClick={() => updateUnit(unit.id)}
                                    disabled={saving}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingUnitId(null);
                                      setEditUnitName('');
                                    }}
                                    disabled={saving}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className="text-purple-100 font-medium">{unit.name}</span>
                              )}
                              <div className="flex gap-2">
                                {editingUnitId !== unit.id && (
                                  <button
                                    onClick={() => {
                                      setEditingUnitId(unit.id);
                                      setEditUnitName(unit.name);
                                    }}
                                    disabled={saving}
                                    className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => removeUnit(unit.id)}
                                  disabled={saving}
                                  className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {modules.map((module) => {
                      const modSemesters = semesters.filter(s => s.module_id === module.id);
                      return (
                        <div key={module.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="bg-white/10 px-4 py-3 md:px-6 md:py-4 border-b border-white/10">
                            <h4 className="text-base md:text-lg font-bold text-white">Module {module.module_index}</h4>
                          </div>
                          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                            {modSemesters.map((semester) => {
                              const inputKey = `mod_${module.module_index}_sem_${semester.semester_index}`;
                              const semesterUnits = units.filter(u => 
                                u.module_index === module.module_index && 
                                u.semester_index === semester.semester_index
                              );
                              
                              return (
                                <div key={semester.id} className="bg-black/20 rounded-lg p-4 md:p-5">
                                  <h5 className="text-sm md:text-md font-semibold text-purple-200 mb-3 md:mb-4">Semester {semester.semester_index}</h5>
                                  
                                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-3 md:mb-4">
                                    <input
                                      type="text"
                                      value={unitInputs[inputKey] || ''}
                                      onChange={(e) => setUnitInputs({ ...unitInputs, [inputKey]: e.target.value })}
                                      placeholder="Enter unit name..."
                                      className="flex-1 px-3 py-2 md:px-4 md:py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs md:text-sm"
                                    />
                                    <button
                                      onClick={() => addUnit(module.module_index, semester.semester_index, inputKey)}
                                      disabled={saving || !unitInputs[inputKey]?.trim()}
                                      className="px-4 py-2 md:px-5 md:py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors"
                                    >
                                      Add Unit
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {semesterUnits.length === 0 ? (
                                      <p className="text-purple-300/50 text-xs italic">No units assigned to this semester.</p>
                                    ) : (
                                      semesterUnits.map((unit) => (
                                        <div key={unit.id} className="flex items-center justify-between bg-white/5 border border-white/10 px-3 py-2 rounded group hover:bg-white/10 transition-colors">
                                          {editingUnitId === unit.id ? (
                                            <div className="flex items-center gap-2 flex-1">
                                              <input
                                                type="text"
                                                value={editUnitName}
                                                onChange={(e) => setEditUnitName(e.target.value)}
                                                className="flex-1 px-2 py-1 bg-white/20 border border-white/30 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                              />
                                              <button
                                                onClick={() => updateUnit(unit.id)}
                                                disabled={saving}
                                                className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
                                              >
                                                Save
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setEditingUnitId(null);
                                                  setEditUnitName('');
                                                }}
                                                disabled={saving}
                                                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          ) : (
                                            <span className="text-purple-100 text-xs md:text-sm">{unit.name}</span>
                                          )}
                                          <div className="flex gap-2">
                                            {editingUnitId !== unit.id && (
                                              <button
                                                onClick={() => {
                                                  setEditingUnitId(unit.id);
                                                  setEditUnitName(unit.name);
                                                }}
                                                disabled={saving}
                                                className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                                              >
                                                Edit
                                              </button>
                                            )}
                                            <button
                                              onClick={() => removeUnit(unit.id)}
                                              disabled={saving}
                                              className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-8 border border-white/20 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-white">All Courses with Units</h2>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors self-start sm:self-auto"
                >
                  Print
                </button>
              </div>

              {loadingAllCourses ? (
                <div className="text-white text-center py-8">Loading courses...</div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {allCoursesData.map((course) => (
                    <div key={course.id} className="bg-white/5 rounded-lg p-4 md:p-6 border border-white/10">
                      <div className="mb-3 md:mb-4">
                        <h3 className="text-base md:text-xl font-bold text-white">{course.name}</h3>
                        <p className="text-purple-200 text-xs md:text-sm">ID: {course.id}</p>
                        <p className="text-purple-200 text-xs md:text-sm">Dept: {course.departments?.name || 'No Dept'}</p>
                      </div>

                      {course.course_types?.filter((ct: any) => ct.enabled).map((ct: any) => (
                        <div key={ct.id} className="ml-2 md:ml-4 mt-3 md:mt-4 p-3 md:p-4 bg-black/20 rounded-lg">
                          <h4 className="text-sm md:text-lg font-semibold text-purple-300 capitalize">{ct.level}</h4>
                          <p className="text-purple-200 text-xs md:text-sm">Min Grade: {ct.min_kcse_grade}</p>
                          <p className="text-purple-200 text-xs md:text-sm">Study Mode: {ct.study_mode}</p>

                          {ct.study_mode === 'module' && ct.modules?.length > 0 && (
                            <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                              {ct.modules.map((module: any) => (
                                <div key={module.id} className="ml-2 md:ml-4">
                                  <h5 className="text-xs md:text-md font-semibold text-white">Module {module.module_index}</h5>
                                  {module.semesters?.map((semester: any) => (
                                    <div key={semester.id} className="ml-2 md:ml-4 mt-2">
                                      <h6 className="text-xs md:text-sm font-semibold text-purple-200">Semester {semester.semester_index}</h6>
                                      <p className="text-purple-300 text-xs">Fee: {semester.fee} KES</p>
                                      <p className="text-purple-300 text-xs">Duration: {semester.duration_months} months</p>
                                      
                                      <div className="mt-2">
                                        <p className="text-xs font-semibold text-white mb-1">Units:</p>
                                        {course.units?.filter((u: any) => 
                                          u.module_index === module.module_index && 
                                          u.semester_index === semester.semester_index
                                        ).map((unit: any) => (
                                          <div key={unit.id} className="text-purple-200 text-xs ml-2">
                                            - {unit.name}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
