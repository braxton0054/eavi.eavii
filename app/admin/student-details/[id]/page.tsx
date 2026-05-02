'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter, useParams } from 'next/navigation';
import DocumentChecklist from '@/components/DocumentChecklist';
import GuardianManager from '@/components/GuardianManager';
import SendNotification from '@/components/SendNotification';
import NotificationHistory from '@/components/NotificationHistory';
import StudentEnrollmentForm from '@/components/StudentEnrollmentForm';

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  phone: string;
  email: string;
  campus: string;
  course: string;
  status: string;
}

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [supabase, setSupabase] = useState<any>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'guardians' | 'notifications' | 'profile'>('documents');
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase || !studentId) return;

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

      fetchStudent();
    };

    checkAuth();
  }, [supabase, studentId]);

  const fetchStudent = async () => {
    try {
      // Fetch basic info for header
      const { data, error } = await supabase
        .from('applications')
        .select('id, full_name, admission_number, phone, email, campus, course, status')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudent(data);

      // Fetch full data for form
      const { data: fullData, error: fullError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', studentId)
        .single();

      if (!fullError) {
        setStudentData(fullData);
      }
    } catch (err) {
      console.error('Failed to fetch student:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading student details...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-500">Student not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/applications')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Applications
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{student.full_name}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
            <span className="bg-blue-100 px-3 py-1 rounded-full">Admission: {student.admission_number}</span>
            <span className="bg-green-100 px-3 py-1 rounded-full">Campus: {student.campus}</span>
            <span className="bg-purple-100 px-3 py-1 rounded-full">Course: {student.course}</span>
            <span className={`px-3 py-1 rounded-full ${
              student.status === 'enrolled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              Status: {student.status}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'documents'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Document Checklist
          </button>
          <button
            onClick={() => setActiveTab('guardians')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'guardians'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👨‍👩‍👧 Guardians
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'notifications'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📧 Email Notifications
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✏️ Edit Profile
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'documents' && (
            <>
              <div className="lg:col-span-2">
                <DocumentChecklist
                  applicationId={studentId}
                  onUpdate={(items) => console.log('Documents updated:', items)}
                />
              </div>
            </>
          )}

          {activeTab === 'guardians' && (
            <>
              <div className="lg:col-span-2">
                <GuardianManager applicationId={studentId} />
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <SendNotification
                applicationId={studentId}
                onSend={() => console.log('Notification sent')}
              />
              <NotificationHistory applicationId={studentId} />
            </>
          )}

          {activeTab === 'profile' && studentData && (
            <>
              <div className="lg:col-span-2">
                <StudentEnrollmentForm
                  applicationId={studentId}
                  initialData={studentData}
                  onSubmit={(data) => {
                    console.log('Profile updated:', data);
                    fetchStudent(); // Refresh data
                    alert('Profile updated successfully!');
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
