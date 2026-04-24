'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

type LevelKey = 'diploma' | 'certificate' | 'artisan' | 'level6' | 'level5' | 'level4';
type ExamBody = 'JP' | 'CDACC' | 'KNEC' | 'internal';

interface Unit {
  course_id: string;
  unit_code: string;
  name: string;
  module_index: number;
  semester_index: number;
  course_name?: string;
  level?: string;
  exam_body?: string;
}

export default function UnitsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamBody, setSelectedExamBody] = useState<ExamBody | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | 'all'>('all');

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

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

      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  useEffect(() => {
    if (!supabase) return;
    loadUnits();
  }, [supabase]);

  useEffect(() => {
    filterUnits();
  }, [units, searchTerm, selectedExamBody, selectedLevel]);

  const loadUnits = async () => {
    try {
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .order('course_id, module_index, semester_index');

      if (unitsError) {
        console.error('Error loading units:', unitsError);
        return;
      }

      // Get course information
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name');

      if (coursesError) {
        console.error('Error loading courses:', coursesError);
        return;
      }

      // Get course type information for level and exam body
      const { data: courseTypesData, error: courseTypesError } = await supabase
        .from('course_types')
        .select('course_id, level, enabled');

      if (courseTypesError) {
        console.error('Error loading course types:', courseTypesError);
        return;
      }

      // Get module information for exam body
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, course_type_id, exam_body');

      if (modulesError) {
        console.error('Error loading modules:', modulesError);
        return;
      }

      // Combine data
      const courseMap = new Map(coursesData?.map((c: any) => [c.id, c.name]) || []);
      const courseTypeMap = new Map(courseTypesData?.map((ct: any) => [ct.course_id, ct.level]) || []);
      const moduleExamBodyMap = new Map(modulesData?.map((m: any) => [m.course_type_id, m.exam_body]) || []);

      const unitsWithInfo: Unit[] = (unitsData || []).map((u: any) => {
        const courseName = courseMap.get(u.course_id);
        const level = courseTypeMap.get(u.course_id);
        
        // Determine exam body from course ID prefix
        let examBody: ExamBody = 'internal';
        if (u.course_id.startsWith('KNEC-')) {
          examBody = 'KNEC';
        } else if (u.course_id.startsWith('CDACC-')) {
          examBody = 'CDACC';
        } else if (u.course_id.startsWith('JP-')) {
          examBody = 'JP';
        }

        return {
          ...u,
          course_name: courseName,
          level,
          exam_body: examBody
        };
      });

      setUnits(unitsWithInfo);
    } catch (err) {
      console.error('Error loading units:', err);
    }
  };

  const filterUnits = () => {
    let filtered = units;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.unit_code.toLowerCase().includes(term) ||
          u.course_id.toLowerCase().includes(term) ||
          u.course_name?.toLowerCase().includes(term)
      );
    }

    if (selectedExamBody !== 'all') {
      filtered = filtered.filter((u) => u.exam_body === selectedExamBody);
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter((u) => u.level === selectedLevel);
    }

    setFilteredUnits(filtered);
  };

  const getExamBodyColor = (examBody: ExamBody) => {
    switch (examBody) {
      case 'KNEC':
        return 'bg-blue-100 text-blue-800';
      case 'CDACC':
        return 'bg-green-100 text-green-800';
      case 'JP':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: LevelKey) => {
    switch (level) {
      case 'diploma':
        return 'bg-indigo-100 text-indigo-800';
      case 'certificate':
        return 'bg-teal-100 text-teal-800';
      case 'artisan':
        return 'bg-orange-100 text-orange-800';
      case 'level6':
        return 'bg-pink-100 text-pink-800';
      case 'level5':
        return 'bg-cyan-100 text-cyan-800';
      case 'level4':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Units Management</h1>
          <p className="text-gray-600">View and search all units across courses</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, code, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Exam Body Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Body</label>
              <select
                value={selectedExamBody}
                onChange={(e) => setSelectedExamBody(e.target.value as ExamBody | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Exam Bodies</option>
                <option value="KNEC">KNEC</option>
                <option value="CDACC">CDACC</option>
                <option value="JP">JP International</option>
                <option value="internal">Internal</option>
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as LevelKey | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="diploma">Diploma</option>
                <option value="certificate">Certificate</option>
                <option value="artisan">Artisan</option>
                <option value="level6">Level 6</option>
                <option value="level5">Level 5</option>
                <option value="level4">Level 4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{units.length}</div>
            <div className="text-sm text-gray-600">Total Units</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredUnits.length}</div>
            <div className="text-sm text-gray-600">Filtered Units</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {new Set(units.map((u) => u.course_id)).size}
            </div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(units.filter((u) => u.exam_body === 'KNEC').map((u) => u.course_id)).size}
            </div>
            <div className="text-sm text-gray-600">KNEC Courses</div>
          </div>
        </div>

        {/* Units Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam Body
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No units found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr key={`${unit.course_id}-${unit.unit_code}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {unit.unit_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {unit.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {unit.course_name || unit.course_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExamBodyColor(unit.exam_body as ExamBody)}`}>
                          {unit.exam_body}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unit.level ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(unit.level as LevelKey)}`}>
                            {unit.level}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {unit.module_index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {unit.semester_index}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
