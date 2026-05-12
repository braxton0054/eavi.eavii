'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function StudentArchive() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login/student'); return; }

      const admissionNumber = session.user?.user_metadata?.admission_number;
      const { data } = await supabase
        .from('applications')
        .select('*, courses(name), course_types(level)')
        .eq('admission_number', admissionNumber)
        .single();

      if (!data) { router.push('/login/student'); return; }
      setStudentInfo({
        ...data,
        course: data.courses?.name,
        course_type: data.course_types?.level
      });
      setLoading(false);
    };
    if (supabase) load();
  }, [supabase]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0020] via-[#1a0533] to-[#0e0020] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-lg border border-white/20 text-center">
        <Image src="/logo.webp" alt="EAVI" width={80} height={80} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">🎓 Congratulations!</h1>
        <p className="text-purple-200 mb-6">
          You have successfully completed your studies at East Africa Vision Institute.
        </p>

        {studentInfo && (
          <div className="bg-white/5 rounded-xl p-6 mb-6 text-left space-y-3">
            <p className="text-white"><span className="text-purple-300">Name:</span> {studentInfo.full_name}</p>
            <p className="text-white"><span className="text-purple-300">Course:</span> {studentInfo.course}</p>
            <p className="text-white"><span className="text-purple-300">Certificate:</span> {studentInfo.certificate_number || 'Pending'}</p>
            <p className="text-white"><span className="text-purple-300">Graduated:</span> {studentInfo.graduation_date ? new Date(studentInfo.graduation_date).toLocaleDateString() : 'N/A'}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <a
            href={studentInfo?.certificate_number ? '#' : '#'}
            className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold"
          >
            📄 Download Certificate
          </a>
          <Link
            href="/"
            className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-gray-500 text-xs mt-8">
          This is an archived account. You no longer have access to the active student system.
        </p>
      </div>
    </div>
  );
}
