'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import StudentEnrollmentForm from '@/components/StudentEnrollmentForm';

export default function StudentEnrollmentPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        router.push('/login/admin');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/applications')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Applications
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Student Enrollment</h1>
          <p className="text-gray-600 mt-1">
            Complete enrollment form with all 21 required fields
          </p>
        </div>

        <StudentEnrollmentForm 
          onSubmit={(data) => {
            console.log('Student enrolled:', data);
            router.push('/admin/applications');
          }}
        />
      </div>
    </div>
  );
}
