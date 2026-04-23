'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LecturersPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'add' | 'list' | 'migrate'>('add');
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [editingLecturer, setEditingLecturer] = useState<string | null>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Migration state
  const [migrateFrom, setMigrateFrom] = useState('');
  const [migrateTo, setMigrateTo] = useState('');

  // Lecturer form data
  const [formData, setFormData] = useState({
    lecturerNumber: '',
    fullName: '',
    phoneNumber: '',
    gender: ''
  });

  // Generate 6-digit lecturer number
  const generateLecturerNumber = () => {
    const sequenceNumber = Math.floor(Math.random() * 900000) + 100000; // Random 6-digit number
    return `LEC${sequenceNumber}`;
  };

  useEffect(() => {
    if (!supabase) return;

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

      setCampus(session.user?.user_metadata?.campus || '');

      // Generate initial lecturer number
      setFormData(prev => ({ ...prev, lecturerNumber: generateLecturerNumber() }));
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  // Load lecturers when viewMode changes
  useEffect(() => {
    if (viewMode === 'list') {
      loadLecturers();
    }
  }, [viewMode]);

  const loadLecturers = async () => {
    try {
      const { data, error } = await supabase
        .from('lecturers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading lecturers:', error);
      } else {
        setLecturers(data || []);
      }
    } catch (err) {
      console.error('Error loading lecturers:', err);
    }
  };

  const handleEditLecturer = (lecturer: any) => {
    setEditingLecturer(lecturer.id);
    setFormData({
      lecturerNumber: lecturer.lecturer_number,
      fullName: lecturer.full_name,
      phoneNumber: lecturer.phone,
      gender: lecturer.gender || ''
    });
    setViewMode('add');
  };

  const handleDeleteLecturer = async (lecturerId: string) => {
    if (!confirm('Are you sure you want to delete this lecturer? This will affect both campuses.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('lecturers')
        .delete()
        .eq('id', lecturerId);
      
      if (error) {
        setError('Failed to delete lecturer. Please try again.');
        console.error('Error deleting lecturer:', error);
      } else {
        setError('Lecturer deleted successfully!');
        loadLecturers();
      }
    } catch (err) {
      setError('Failed to delete lecturer. Please try again.');
      console.error('Error deleting lecturer:', err);
    }
  };

  const handleCopyLecturerNumber = (lecturerNumber: string) => {
    navigator.clipboard.writeText(lecturerNumber).then(() => {
      setError('Lecturer number copied to clipboard!');
      setTimeout(() => setError(''), 2000);
    }).catch(() => {
      setError('Failed to copy lecturer number');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate form
      if (!formData.fullName.trim()) {
        setError('Full name is required');
        setSubmitting(false);
        return;
      }
      if (!formData.phoneNumber.trim()) {
        setError('Phone number is required');
        setSubmitting(false);
        return;
      }

      if (!campus) {
        setError('Campus information not found. Please log in again.');
        setSubmitting(false);
        return;
      }

      const lecturerData = {
        lecturer_number: formData.lecturerNumber,
        full_name: formData.fullName,
        phone: formData.phoneNumber,
        email: `${formData.lecturerNumber.toLowerCase()}@eavicollege.ac.ke`,
        gender: formData.gender,
        campus: campus
      };

      if (editingLecturer) {
        // Update existing lecturer
        const { error } = await supabase
          .from('lecturers')
          .update(lecturerData)
          .eq('id', editingLecturer);
        
        if (error) {
          setError('Failed to update lecturer. Please try again.');
          console.error('Error updating lecturer:', error);
        } else {
          setError('Lecturer updated successfully!');
        }
      } else {
        // Insert new lecturer
        const { data, error } = await supabase
          .from('lecturers')
          .insert([lecturerData])
          .select();

        if (error) {
          setError(`Failed to add lecturer: ${error.message}`);
          console.error('Error adding lecturer:', error);
          console.error('Lecturer data:', lecturerData);
        } else {
          setError('Lecturer added successfully!');
          console.log('Lecturer added successfully:', data);
        }
      }

      // Reset form
      setFormData({
        lecturerNumber: generateLecturerNumber(),
        fullName: '',
        phoneNumber: '',
        gender: ''
      });
      setEditingLecturer(null);

    } catch (err) {
      setError('Failed to save lecturer. Please try again.');
      console.error('Error saving lecturer:', err);
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

  const handleMigration = async () => {
    if (!migrateFrom || !migrateTo) {
      setError('Please select both lecturers for migration');
      return;
    }

    if (migrateFrom === migrateTo) {
      setError('Cannot migrate to the same lecturer');
      return;
    }

    if (!confirm(`Are you sure you want to migrate all assignments from the selected lecturer to the new lecturer? This action cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Get lecturer assignments for the old lecturer
      const { data: oldAssignments } = await supabase
        .from('lecturer_assignments')
        .select('*')
        .eq('lecturer_number', migrateFrom);

      if (!oldAssignments || oldAssignments.length === 0) {
        setError('No assignments found for the selected lecturer');
        setSubmitting(false);
        return;
      }

      // Update all assignments to the new lecturer
      const { error: updateError } = await supabase
        .from('lecturer_assignments')
        .update({ lecturer_number: migrateTo })
        .eq('lecturer_number', migrateFrom);

      if (updateError) {
        setError('Failed to migrate assignments. Please try again.');
        console.error('Error migrating assignments:', updateError);
      } else {
        setError(`Successfully migrated ${oldAssignments.length} assignment(s) from old lecturer to new lecturer!`);
        setMigrateFrom('');
        setMigrateTo('');
      }
    } catch (err) {
      setError('Failed to migrate lecturer. Please try again.');
      console.error('Error migrating lecturer:', err);
    } finally {
      setSubmitting(false);
    }
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
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="inline-block">
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.webp"
                  alt="East Africa Vision Institute Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Lecturer Management</h1>
              <p className="text-purple-200 text-sm">
                Campus: {campus === 'main' ? 'Main Campus' : campus === 'west' ? 'West Campus' : 'Unknown'}
              </p>
            </div>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg transition-all duration-300 text-sm font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {viewMode === 'migrate' ? 'Migrate Lecturer Assignments' : viewMode === 'add' ? (editingLecturer ? 'Edit Lecturer' : 'Add New Lecturer') : 'Existing Lecturers'}
            </h2>
            <div className="flex gap-2">
              {viewMode !== 'migrate' && (
                <button
                  type="button"
                  onClick={() => {
                    setViewMode(viewMode === 'add' ? 'list' : 'add');
                    if (viewMode === 'add') {
                      setEditingLecturer(null);
                      setFormData({
                        lecturerNumber: generateLecturerNumber(),
                        fullName: '',
                        phoneNumber: '',
                        gender: ''
                      });
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
                >
                  {viewMode === 'add' ? 'View All Lecturers' : 'Add New Lecturer'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setViewMode(viewMode === 'migrate' ? 'list' : 'migrate');
                  setMigrateFrom('');
                  setMigrateTo('');
                  setError('');
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
              >
                {viewMode === 'migrate' ? 'Cancel' : 'Migrate Lecturer'}
              </button>
            </div>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              error.includes('successfully') 
                ? 'bg-green-500/20 text-green-200 border border-green-500/50' 
                : 'bg-red-500/20 text-red-200 border border-red-500/50'
            }`}>
              {error}
            </div>
          )}

          {viewMode === 'migrate' ? (
            <div className="space-y-6">
              <p className="text-purple-200 text-sm mb-4">
                Select a lecturer to migrate assignments FROM and a lecturer to migrate TO. All course and unit assignments will be transferred.
              </p>

              {/* Migrate From */}
              <div>
                <label htmlFor="migrateFrom" className="block text-purple-200 text-sm mb-2">
                  Migrate From (Old Lecturer) *
                </label>
                <select
                  id="migrateFrom"
                  value={migrateFrom}
                  onChange={(e) => setMigrateFrom(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select lecturer to migrate from</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.lecturer_number} className="text-gray-900">
                      {lecturer.full_name} ({lecturer.lecturer_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Migrate To */}
              <div>
                <label htmlFor="migrateTo" className="block text-purple-200 text-sm mb-2">
                  Migrate To (New Lecturer) *
                </label>
                <select
                  id="migrateTo"
                  value={migrateTo}
                  onChange={(e) => setMigrateTo(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select lecturer to migrate to</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.lecturer_number} className="text-gray-900">
                      {lecturer.full_name} ({lecturer.lecturer_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Migration */}
              <button
                onClick={handleMigration}
                disabled={submitting || !migrateFrom || !migrateTo}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Migrating...' : 'Migrate Assignments'}
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-4">
              {lecturers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-purple-200">No lecturers found. Add your first lecturer.</p>
                </div>
              ) : (
                lecturers.map((lecturer) => (
                  <div key={lecturer.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{lecturer.full_name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-purple-200 text-sm">Lecturer Number: {lecturer.lecturer_number}</p>
                          <button
                            onClick={() => handleCopyLecturerNumber(lecturer.lecturer_number)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-colors"
                            title="Copy lecturer number"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-purple-200 text-sm">Phone: {lecturer.phone}</p>
                        <p className="text-purple-200 text-sm">Gender: {lecturer.gender ? lecturer.gender.charAt(0).toUpperCase() + lecturer.gender.slice(1) : 'Not specified'}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditLecturer(lecturer)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLecturer(lecturer.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lecturer Number (Auto-generated) */}
              <div>
                <label htmlFor="lecturerNumber" className="block text-purple-200 text-sm mb-1">
                  Lecturer Number (Auto-generated)
                </label>
                <input
                  type="text"
                  id="lecturerNumber"
                  name="lecturerNumber"
                  value={formData.lecturerNumber}
                  disabled
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white/70 cursor-not-allowed text-sm"
                />
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-purple-200 text-sm mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter lecturer's full name"
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-purple-200 text-sm mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter phone number (e.g., 0712345678)"
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-purple-200 text-sm mb-1">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="male" className="text-gray-900">Male</option>
                  <option value="female" className="text-gray-900">Female</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (editingLecturer ? 'Updating Lecturer...' : 'Adding Lecturer...') : (editingLecturer ? 'Update Lecturer' : 'Add Lecturer')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
