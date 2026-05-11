'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/client';
import Chatbot from '@/components/Chatbot';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  totalStudents: number;
  pendingApplications: number;
  totalLecturers: number;
  totalCourses: number;
  revenueThisMonth: number;
  totalOutstanding: number;
  enrolledStudents: number;
  activeClasses: number;
}

interface RecentApp {
  id: string;
  full_name: string;
  application_date: string;
  status: string;
  campus: string;
  course_id: string;
}

interface RecentPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  receipt_number: string;
  applications: { full_name: string };
}

interface SystemLog {
  id: string;
  log_type: 'error' | 'warning' | 'info';
  module?: string;
  message: string;
  created_at: string;
}

interface CourseCount {
  course_name: string;
  enrolled_students: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000
    ? `KES ${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `KES ${(n / 1_000).toFixed(0)}K`
    : `KES ${n.toLocaleString()}`;

const statusCls = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'enrolled': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'pending':  return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
    default:         return 'bg-gray-50 text-gray-600 border border-gray-200';
  }
};

const logDot = (t: string) => {
  switch (t) {
    case 'error':   return 'bg-red-500';
    case 'warning': return 'bg-amber-400';
    default:        return 'bg-sky-400';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router   = useRouter();
  const pathname = usePathname();

  const [sb, setSb]           = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus]   = useState('');
  const [user, setUser]       = useState<any>(null);

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, pendingApplications: 0,
    totalLecturers: 0, totalCourses: 0,
    revenueThisMonth: 0, totalOutstanding: 0,
    enrolledStudents: 0, activeClasses: 0,
  });

  const [recentApps,      setRecentApps]      = useState<RecentApp[]>([]);
  const [recentPayments,  setRecentPayments]   = useState<RecentPayment[]>([]);
  const [systemLogs,      setSystemLogs]       = useState<SystemLog[]>([]);
  const [criticalAlerts,  setCriticalAlerts]   = useState<SystemLog[]>([]);
  const [courseBreakdown, setCourseBreakdown]  = useState<CourseCount[]>([]);

  const [navOpen,    setNavOpen]    = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [actionsOpen,setActionsOpen]= useState(false);

  // ── Data loaders ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async (client: any, campusCode: string) => {
    try {
      const isFiltered = campusCode && campusCode !== 'all';
      const campusVal  = isFiltered ? campusCode : null;

      // Applications
      let appsQ = client.from('applications').select('status, campus');
      if (campusVal) appsQ = appsQ.eq('campus', campusVal);
      const { data: apps } = await appsQ;

      const totalStudents       = apps?.filter((a: any) => a.status === 'enrolled').length ?? 0;
      const pendingApplications = apps?.filter((a: any) => a.status === 'pending').length ?? 0;

      // Lecturers
      let lecQ = client.from('lecturers').select('id', { count: 'exact', head: true });
      const { count: totalLecturers } = await lecQ;

      // Courses
      const { count: totalCourses } = await client.from('courses')
        .select('id', { count: 'exact', head: true }).eq('is_active', true);

      // Classes
      let clsQ = client.from('classes').select('id', { count: 'exact', head: true }).eq('is_active', true);
      if (campusVal) clsQ = clsQ.eq('campus', campusVal);
      const { count: activeClasses } = await clsQ;

      // Revenue this month
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      let revQ = client.from('fee_payments')
        .select('amount, applications!inner(campus)')
        .eq('status', 'completed')
        .gte('payment_date', monthStart);
      if (campusVal) revQ = revQ.eq('applications.campus', campusVal);
      const { data: revData } = await revQ;
      const revenueThisMonth = revData?.reduce((s: number, p: any) => s + (p.amount ?? 0), 0) ?? 0;

      // Outstanding balance (sum of total_balance on enrolled applications)
      let balQ = client.from('applications').select('total_balance').eq('status', 'enrolled');
      if (campusVal) balQ = balQ.eq('campus', campusVal);
      const { data: balData } = await balQ;
      const totalOutstanding = balData?.reduce((s: number, a: any) => s + (a.total_balance ?? 0), 0) ?? 0;

      setStats({
        totalStudents,
        pendingApplications,
        totalLecturers:  totalLecturers ?? 0,
        totalCourses:    totalCourses   ?? 0,
        revenueThisMonth,
        totalOutstanding,
        enrolledStudents: totalStudents,
        activeClasses:    activeClasses ?? 0,
      });

      // Recent applications
      let raQ = client.from('applications')
        .select('id, full_name, application_date, status, campus, course_id')
        .order('application_date', { ascending: false }).limit(6);
      if (campusVal) raQ = raQ.eq('campus', campusVal);
      const { data: ra } = await raQ;
      setRecentApps(ra ?? []);

      // Recent payments
      let rpQ = client.from('fee_payments')
        .select('id, amount, payment_method, payment_date, receipt_number, applications!inner(full_name, campus)')
        .eq('status', 'completed')
        .order('payment_date', { ascending: false }).limit(5);
      if (campusVal) rpQ = rpQ.eq('applications.campus', campusVal);
      const { data: rp } = await rpQ;
      setRecentPayments(rp ?? []);

      // System logs
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const { data: crit } = await client.from('system_logs')
        .select('*').eq('log_type', 'error')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false }).limit(5);
      const { data: allLogs } = await client.from('system_logs')
        .select('*').order('created_at', { ascending: false }).limit(20);
      setCriticalAlerts(crit ?? []);
      setSystemLogs(allLogs ?? []);

      // Course breakdown from v_students_per_course
      let cbQ = client.from('v_students_per_course')
        .select('course_name, enrolled_students')
        .order('enrolled_students', { ascending: false }).limit(5);
      if (campusVal) cbQ = cbQ.eq('campus', campusVal);
      const { data: cb } = await cbQ;
      setCourseBreakdown(cb ?? []);

    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  }, []);

  // ── Auth + Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const client = createClient();
    setSb(client);

    (async () => {
      const { data: { session } } = await client.auth.getSession();
      if (!session) { router.push('/login/admin'); return; }

      const role = session.user?.user_metadata?.role;
      if (role !== 'admin') {
        router.push(role === 'lecturer' ? '/lecturer/dashboard' : '/login/admin');
        return;
      }

      setUser(session.user);
      const c = session.user?.user_metadata?.campus ?? localStorage.getItem('adminCampus') ?? '';
      setCampus(c);
      await loadAll(client, c);
      setLoading(false);
    })();
  }, [router, loadAll]);

  const handleCampusChange = async (val: string) => {
    setCampus(val);
    if (sb) await loadAll(sb, val);
  };

  const handleLogout = async () => {
    await sb?.auth.signOut();
    localStorage.removeItem('adminCampus');
    router.push('/login/admin');
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const campusLabel = campus === 'main' ? 'Main Campus' : campus === 'west' ? 'West Campus' : 'All Campuses';

  const maxEnrolled = courseBreakdown[0]?.enrolled_students ?? 1;

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#666] font-medium tracking-wide">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#1a1a1a]">

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-gray-50 border-b border-[#e5e5e2] h-14">
        <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center justify-between gap-3">

          {/* Logo + campus pill */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-bold text-sm tracking-tight shrink-0">EAVI</span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[#f0f0ed] text-[10px] font-medium text-[#555] uppercase tracking-widest shrink-0">
              {campusLabel}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* Campus selector — hidden when user has a single campus assigned */}
            {!campus && (
              <select
                value={campus}
                onChange={e => handleCampusChange(e.target.value)}
                className="hidden sm:block text-xs border border-[#ddd] rounded-md px-2 py-1.5 bg-gray-50 text-[#333] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
              >
                <option value="">All Campuses</option>
                <option value="main">Main Campus</option>
                <option value="west">West Campus</option>
              </select>
            )}

            {/* Alerts bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-md hover:bg-[#f0f0ed] transition-colors"
                aria-label="Notifications"
              >
                <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {criticalAlerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-gray-50 rounded-xl shadow-lg border border-[#e5e5e2] overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-[#f0f0ed]">
                    <p className="text-xs font-semibold text-[#333]">System Alerts</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#f0f0ed]">
                    {criticalAlerts.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-[#888] text-center">No critical alerts</p>
                    ) : criticalAlerts.map(a => (
                      <div key={a.id} className="px-3 py-2">
                        <p className="text-xs text-[#333]">{a.message}</p>
                        <p className="text-[10px] text-[#999] mt-0.5">{a.module} · {new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="relative">
              <button
                onClick={() => setActionsOpen(!actionsOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#333] text-white text-xs font-medium rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New</span>
              </button>

              {actionsOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-gray-50 rounded-xl shadow-lg border border-[#e5e5e2] py-1 z-50">
                  {[
                    { href: '/admin/applications', label: 'New Application' },
                    { href: '/admin/payments',     label: 'Record Payment' },
                    { href: '/admin/students',     label: 'Add Student' },
                    { href: '/admin/reports',      label: 'Generate Report' },
                  ].map(a => (
                    <Link key={a.href} href={a.href}
                      className="block px-4 py-2 text-xs text-[#333] hover:bg-gray-50"
                      onClick={() => setActionsOpen(false)}
                    >
                      {a.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar / logout */}
            <button onClick={handleLogout} title="Sign out"
              className="w-7 h-7 rounded-full bg-[#1a1a1a] text-white text-[10px] font-bold flex items-center justify-center shrink-0 hover:bg-[#444] transition-colors">
              {(user?.email?.[0] ?? 'A').toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* ── CRITICAL ALERTS ─────────────────────────────────────────────────────── */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-3">
          <div className="max-w-screen-xl mx-auto flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-800 mb-1">{criticalAlerts.length} critical issue{criticalAlerts.length > 1 ? 's' : ''} detected</p>
              {criticalAlerts.slice(0, 2).map(a => (
                <p key={a.id} className="text-xs text-red-700 truncate">{a.message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ────────────────────────────────────────────────────────────────── */}
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-[#888] mt-0.5">{campusLabel} · {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {/* Mobile campus selector — hidden when user has a single campus */}
          {!campus && (
            <select
              value={campus}
              onChange={e => handleCampusChange(e.target.value)}
              className="sm:hidden text-xs border border-[#ddd] rounded-md px-2 py-1.5 bg-gray-50 text-[#333] focus:outline-none"
            >
              <option value="">All</option>
              <option value="main">Main</option>
              <option value="west">West</option>
            </select>
          )}
        </div>

        {/* ── KPI GRID (Material Dashboard style) ────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Enrolled Students',
              value: stats.totalStudents.toLocaleString(),
              sub: `${stats.pendingApplications} pending`,
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
              color: 'emerald',
            },
            {
              label: 'Revenue (Month)',
              value: fmt(stats.revenueThisMonth),
              sub: 'Completed payments',
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
              color: 'sky',
            },
            {
              label: 'Outstanding',
              value: fmt(stats.totalOutstanding),
              sub: 'Unpaid balances',
              icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
              color: 'amber',
            },
            {
              label: 'Lecturers',
              value: stats.totalLecturers.toLocaleString(),
              sub: `${stats.totalCourses} active courses`,
              icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
              color: 'violet',
            },
          ].map((kpi, i) => {
            const colorMap: Record<string, {bg: string, text: string, shadow: string}> = {
              emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', shadow: 'shadow-emerald-500/20' },
              sky:   { bg: 'bg-sky-500',     text: 'text-sky-600',     shadow: 'shadow-sky-500/20' },
              amber: { bg: 'bg-amber-500',   text: 'text-amber-600',   shadow: 'shadow-amber-500/20' },
              violet:{ bg: 'bg-violet-500',  text: 'text-violet-600',  shadow: 'shadow-violet-500/20' },
            };
            const c = colorMap[kpi.color] || colorMap.emerald;
            return (
              <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-start justify-between px-4 pt-3 pb-2">
                  <div className={"w-12 h-12 -mt-2 rounded-xl flex items-center justify-center shadow-lg " + c.bg + " " + c.shadow}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={kpi.icon} />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{kpi.value}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-4 py-2">
                  <p className="text-[11px] text-gray-400">{kpi.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SECONDARY STATS ROW ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending Apps',   value: stats.pendingApplications, color: 'text-amber-600' },
            { label: 'Active Classes', value: stats.activeClasses,        color: 'text-sky-600' },
            { label: 'Total Courses',  value: stats.totalCourses,         color: 'text-violet-600' },
            { label: 'Total Enrolled', value: stats.enrolledStudents,     color: 'text-emerald-600' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-xl border border-[#e5e5e2] px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-[#888]">{s.label}</p>
              <p className={`text-sm font-semibold ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Applications */}
          <div className="lg:col-span-2 bg-gray-50 rounded-xl border border-[#e5e5e2] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0f0ed] flex items-center justify-between">
              <p className="text-xs font-semibold text-[#333] uppercase tracking-widest">Recent Applications</p>
              <Link href="/admin/applications" className="text-[10px] text-[#888] hover:text-[#1a1a1a] transition-colors">View all →</Link>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden divide-y divide-[#f7f7f5]">
              {recentApps.length === 0 ? (
                <p className="px-4 py-6 text-xs text-center text-[#aaa]">No recent applications</p>
              ) : recentApps.map(app => (
                <div key={app.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{app.full_name}</p>
                    <p className="text-[10px] text-[#888] mt-0.5">{new Date(app.application_date).toLocaleDateString()} · {app.campus}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCls(app.status)}`}>{app.status}</span>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#fafaf8]">
                  <tr>
                    {['Name', 'Date', 'Campus', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[10px] font-medium text-[#888] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7f7f5]">
                  {recentApps.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-[#aaa]">No recent applications</td></tr>
                  ) : recentApps.map(app => (
                    <tr key={app.id} className="hover:bg-[#fafaf8] transition-colors">
                      <td className="px-4 py-3 text-xs font-medium truncate max-w-[160px]">{app.full_name}</td>
                      <td className="px-4 py-3 text-xs text-[#666]">{new Date(app.application_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs text-[#666] capitalize">{app.campus || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCls(app.status)}`}>{app.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enrollment by Course */}
          <div className="bg-gray-50 rounded-xl border border-[#e5e5e2] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0f0ed]">
              <p className="text-xs font-semibold text-[#333] uppercase tracking-widest">Top Courses</p>
            </div>
            <div className="px-4 py-3 space-y-3">
              {courseBreakdown.length === 0 ? (
                <p className="text-xs text-[#aaa] text-center py-4">No data</p>
              ) : courseBreakdown.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] text-[#444] truncate pr-2 leading-tight">{c.course_name}</p>
                    <p className="text-[11px] font-semibold text-[#1a1a1a] shrink-0">{c.enrolled_students}</p>
                  </div>
                  <div className="h-1.5 bg-[#f0f0ed] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(c.enrolled_students / maxEnrolled) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Payments */}
          <div className="bg-gray-50 rounded-xl border border-[#e5e5e2] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0f0ed] flex items-center justify-between">
              <p className="text-xs font-semibold text-[#333] uppercase tracking-widest">Recent Payments</p>
              <Link href="/admin/payments" className="text-[10px] text-[#888] hover:text-[#1a1a1a] transition-colors">View all →</Link>
            </div>
            <div className="divide-y divide-[#f7f7f5]">
              {recentPayments.length === 0 ? (
                <p className="px-4 py-6 text-xs text-center text-[#aaa]">No payments recorded</p>
              ) : recentPayments.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{p.applications?.full_name}</p>
                    <p className="text-[10px] text-[#888] mt-0.5 capitalize">{p.payment_method} · {new Date(p.payment_date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 shrink-0">KES {p.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-gray-50 rounded-xl border border-[#e5e5e2] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0f0ed]">
              <p className="text-xs font-semibold text-[#333] uppercase tracking-widest">Activity Log</p>
            </div>
            <div className="divide-y divide-[#f7f7f5] max-h-72 overflow-y-auto">
              {systemLogs.length === 0 ? (
                <p className="px-4 py-6 text-xs text-center text-[#aaa]">No activity</p>
              ) : systemLogs.slice(0, 10).map(log => (
                <div key={log.id} className="px-4 py-3 flex items-start gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${logDot(log.log_type)}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-[#444] truncate">{log.message}</p>
                    <p className="text-[10px] text-[#aaa] mt-0.5">{log.module} · {new Date(log.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUICK NAV LINKS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Students',     href: '/admin/students',     emoji: '🎓' },
            { label: 'Lecturers',    href: '/admin/lecturers',    emoji: '👨‍🏫' },
            { label: 'Applications', href: '/admin/applications', emoji: '📋' },
            { label: 'Payments',     href: '/admin/payments',     emoji: '💳' },
            { label: 'Courses',      href: '/admin/courses',      emoji: '📚' },
            { label: 'Reports',      href: '/admin/reports',      emoji: '📊' },
          ].map(nav => (
            <Link key={nav.href} href={nav.href}
              className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl border border-[#e5e5e2] p-4 hover:border-[#1a1a1a] hover:shadow-sm transition-all group"
            >
              <span className="text-xl">{nav.emoji}</span>
              <span className="text-[10px] font-medium text-[#666] group-hover:text-[#1a1a1a] uppercase tracking-widest transition-colors">{nav.label}</span>
            </Link>
          ))}
        </div>

      </main>

      {/* ── CHATBOT ──────────────────────────────────────────────────────────────── */}
      <Chatbot
        userId={user?.id}
        campus={campus}
        userEmail={user?.email}
        userRole={user?.user_metadata?.role}
        userName={user?.user_metadata?.full_name ?? user?.email}
      />
    </div>
  );
}