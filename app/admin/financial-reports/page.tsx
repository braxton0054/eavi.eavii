'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FinancialMetrics {
  totalRevenueToday: number;
  totalRevenueThisWeek: number;
  totalRevenueThisMonth: number;
  pendingPayments: number;
  overduePayments: number;
  paymentSuccessRate: number;
  averagePaymentAmount: number;
}

interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface CourseRevenue {
  courseName: string;
  amount: number;
  studentCount: number;
}

interface ExamBodyRevenue {
  examBody: string;
  amount: number;
  count: number;
}

export default function FinancialReportsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [courseRevenue, setCourseRevenue] = useState<CourseRevenue[]>([]);
  const [examBodyRevenue, setExamBodyRevenue] = useState<ExamBodyRevenue[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

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

      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);
      await loadFinancialData(userCampus);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadFinancialData = async (campusFilter: string) => {
    await loadMetrics(campusFilter);
    await loadPaymentBreakdown(campusFilter);
    await loadCourseRevenue(campusFilter);
    await loadExamBodyRevenue(campusFilter);
  };

  const loadMetrics = async (campusFilter: string) => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Total revenue today
    const { data: todayPayments } = await supabase
      .from('fee_payments')
      .select('amount')
      .eq('campus', campusFilter)
      .eq('status', 'completed')
      .eq('payment_date', today);

    const totalRevenueToday = todayPayments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    // Total revenue this week
    const { data: weekPayments } = await supabase
      .from('fee_payments')
      .select('amount')
      .eq('campus', campusFilter)
      .eq('status', 'completed')
      .gte('payment_date', weekAgo);

    const totalRevenueThisWeek = weekPayments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    // Total revenue this month
    const { data: monthPayments } = await supabase
      .from('fee_payments')
      .select('amount')
      .eq('campus', campusFilter)
      .eq('status', 'completed')
      .gte('payment_date', monthStart);

    const totalRevenueThisMonth = monthPayments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    // Pending payments
    const { data: pendingInstallments } = await supabase
      .from('payment_installments')
      .select('amount')
      .eq('campus', campusFilter)
      .eq('status', 'pending');

    const pendingPayments = pendingInstallments?.reduce((sum: number, i: any) => sum + i.amount, 0) || 0;

    // Overdue payments
    const todayDate = new Date().toISOString().split('T')[0];
    const { data: overdueInstallments } = await supabase
      .from('payment_installments')
      .select('amount')
      .eq('campus', campusFilter)
      .eq('status', 'overdue');

    const overduePayments = overdueInstallments?.reduce((sum: number, i: any) => sum + i.amount, 0) || 0;

    // Payment success rate
    const { data: allPayments } = await supabase
      .from('fee_payments')
      .select('status')
      .eq('campus', campusFilter);

    const completedPayments = allPayments?.filter((p: any) => p.status === 'completed').length || 0;
    const totalPaymentCount = allPayments?.length || 0;
    const paymentSuccessRate = totalPaymentCount > 0 ? (completedPayments / totalPaymentCount) * 100 : 0;

    // Average payment amount
    const averagePaymentAmount = completedPayments > 0 ? totalRevenueThisMonth / completedPayments : 0;

    setMetrics({
      totalRevenueToday,
      totalRevenueThisWeek,
      totalRevenueThisMonth,
      pendingPayments,
      overduePayments,
      paymentSuccessRate,
      averagePaymentAmount
    });
  };

  const loadPaymentBreakdown = async (campusFilter: string) => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const { data: payments } = await supabase
      .from('fee_payments')
      .select('payment_method, amount')
      .eq('campus', campusFilter)
      .eq('status', 'completed')
      .gte('payment_date', monthStart);

    if (!payments) {
      setPaymentBreakdown([]);
      return;
    }

    const breakdown: { [key: string]: { amount: number; count: number } } = {};
    let totalAmount = 0;

    payments.forEach((p: any) => {
      if (!breakdown[p.payment_method]) {
        breakdown[p.payment_method] = { amount: 0, count: 0 };
      }
      breakdown[p.payment_method].amount += p.amount;
      breakdown[p.payment_method].count += 1;
      totalAmount += p.amount;
    });

    const result = Object.entries(breakdown).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
    }));

    setPaymentBreakdown(result);
  };

  const loadCourseRevenue = async (campusFilter: string) => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const { data: payments } = await supabase
      .from('fee_payments')
      .select(`
        amount,
        applications (
          course_id,
          courses (
            name
          )
        )
      `)
      .eq('campus', campusFilter)
      .eq('status', 'completed')
      .gte('payment_date', monthStart);

    if (!payments) {
      setCourseRevenue([]);
      return;
    }

    const courseMap: { [key: string]: { amount: number; count: number } } = {};

    payments.forEach((p: any) => {
      const courseName = p.applications?.courses?.name || 'Unknown';
      if (!courseMap[courseName]) {
        courseMap[courseName] = { amount: 0, count: 0 };
      }
      courseMap[courseName].amount += p.amount;
      courseMap[courseName].count += 1;
    });

    const result = Object.entries(courseMap).map(([courseName, data]) => ({
      courseName,
      amount: data.amount,
      studentCount: data.count
    })).sort((a, b) => b.amount - a.amount);

    setCourseRevenue(result);
  };

  const loadExamBodyRevenue = async (campusFilter: string) => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const { data: payments } = await supabase
      .from('fee_payments')
      .select(`
        amount,
        applications (
          exam_body
        )
      `)
      .eq('campus', campusFilter)
      .eq('status', 'completed')
      .gte('payment_date', monthStart);

    if (!payments) {
      setExamBodyRevenue([]);
      return;
    }

    const examBodyMap: { [key: string]: { amount: number; count: number } } = {};

    payments.forEach((p: any) => {
      const examBody = p.applications?.exam_body || 'unknown';
      if (!examBodyMap[examBody]) {
        examBodyMap[examBody] = { amount: 0, count: 0 };
      }
      examBodyMap[examBody].amount += p.amount;
      examBodyMap[examBody].count += 1;
    });

    const result = Object.entries(examBodyMap).map(([examBody, data]) => ({
      examBody,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => b.amount - a.amount);

    setExamBodyRevenue(result);
  };

  const getCampusName = (campus: string) => {
    return campus === 'main' ? 'Main Campus' : 'West Campus';
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
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-purple-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-white">Financial Reports</h1>
            </div>
            <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-purple-200 text-sm mb-2">Revenue Today</h3>
                <p className="text-white text-3xl font-bold">KES {metrics.totalRevenueToday.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-purple-200 text-sm mb-2">Revenue This Week</h3>
                <p className="text-white text-3xl font-bold">KES {metrics.totalRevenueThisWeek.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-purple-200 text-sm mb-2">Revenue This Month</h3>
                <p className="text-white text-3xl font-bold">KES {metrics.totalRevenueThisMonth.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-purple-200 text-sm mb-2">Pending Payments</h3>
                <p className="text-white text-3xl font-bold">KES {metrics.pendingPayments.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-purple-200 text-sm mb-2">Overdue Payments</h3>
                <p className="text-white text-3xl font-bold text-red-300">KES {metrics.overduePayments.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-purple-200 text-sm mb-2">Success Rate</h3>
                <p className="text-white text-3xl font-bold">{metrics.paymentSuccessRate.toFixed(1)}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-purple-200 text-sm mb-2">Avg Payment</h3>
                <p className="text-white text-3xl font-bold">KES {metrics.averagePaymentAmount.toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Breakdown */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Payment Method Breakdown</h2>
              {paymentBreakdown.length === 0 ? (
                <p className="text-purple-200 text-center py-8">No payment data available</p>
              ) : (
                <div className="space-y-3">
                  {paymentBreakdown.map((item) => (
                    <div key={item.method} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-white capitalize">{item.method}</span>
                          <span className="text-purple-200">{item.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-white font-bold">KES {item.amount.toLocaleString()}</p>
                        <p className="text-purple-200 text-sm">{item.count} payments</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Course Revenue */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Revenue by Course</h2>
              {courseRevenue.length === 0 ? (
                <p className="text-purple-200 text-center py-8">No course data available</p>
              ) : (
                <div className="space-y-3">
                  {courseRevenue.slice(0, 5).map((item) => (
                    <div key={item.courseName} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <p className="text-white font-medium">{item.courseName}</p>
                        <p className="text-purple-200 text-sm">{item.studentCount} students</p>
                      </div>
                      <p className="text-white font-bold">KES {item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exam Body Revenue */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Revenue by Exam Body</h2>
              {examBodyRevenue.length === 0 ? (
                <p className="text-purple-200 text-center py-8">No exam body data available</p>
              ) : (
                <div className="space-y-3">
                  {examBodyRevenue.map((item) => (
                    <div key={item.examBody} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <p className="text-white font-medium uppercase">{item.examBody}</p>
                        <p className="text-purple-200 text-sm">{item.count} students</p>
                      </div>
                      <p className="text-white font-bold">KES {item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Financial Summary</h2>
              {metrics && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-purple-200">Total Collected (This Month)</span>
                    <span className="text-white font-bold">KES {metrics.totalRevenueThisMonth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-purple-200">Pending Collection</span>
                    <span className="text-white font-bold">KES {metrics.pendingPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-purple-200">Overdue Amount</span>
                    <span className="text-red-300 font-bold">KES {metrics.overduePayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-purple-200">Collection Rate</span>
                    <span className="text-green-300 font-bold">
                      {metrics.totalRevenueThisMonth + metrics.pendingPayments > 0
                        ? ((metrics.totalRevenueThisMonth / (metrics.totalRevenueThisMonth + metrics.pendingPayments)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
