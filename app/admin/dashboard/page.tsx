'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Chatbot from '@/components/Chatbot';

// Type definitions for dashboard data
interface SystemLog {
  id: string;
  log_type: 'error' | 'warning' | 'info';
  module?: string;
  message: string;
  context?: string;
  created_at: string;
}

interface StudentFinancial {
  student_id: string;
  full_name: string;
  admission_number: string;
  course: string;
  campus: string;
  total_balance: number;
  total_paid: number;
  status: string;
}

interface AIIssue {
  id: string;
  issue_type: string;
  description: string;
  occurrences: number;
  last_seen: string;
  solution?: string;
}

export const dynamic = 'force-dynamic';

// Neumorphism color palette
const COLORS = {
  base: '#e0e5ec',
  shadowDark: '#b8bec7',
  shadowLight: '#ffffff',
  text: '#2d3748',
  muted: '#718096',
  accent: '#4a90d9',
  danger: '#e74c3c',
  success: '#27ae60',
  warning: '#f39c12'
};

export default function AdminDashboard() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  
  // Core stats
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalRevenueThisMonth: 0,
    paymentBreakdown: [] as { method: string; amount: number; percentage: number }[]
  });
  
  // Financial dashboard data
  const [studentFinancials, setStudentFinancials] = useState<StudentFinancial[]>([]);
  const [financialStats, setFinancialStats] = useState({
    totalStudents: 0,
    fullyPaid: 0,
    unpaidStudents: 0,
    totalOutstanding: 0
  });
  const [financialFilter, setFinancialFilter] = useState({ campus: 'all', course: 'all', status: 'all' });
  const [financialPage, setFinancialPage] = useState(0);
  const FINANCIAL_PAGE_SIZE = 10;
  
  // System logs and alerts
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<SystemLog[]>([]);
  const [warningAlerts, setWarningAlerts] = useState<SystemLog[]>([]);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [aiIssues, setAIIssues] = useState<AIIssue[]>([]);
  
  // Legacy data
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await client.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);
  const [viewedNotifications, setViewedNotifications] = useState<Set<string>>(new Set());

  // Send email alert to developer
  const sendEmailAlert = async (alerts: SystemLog[], alertType: 'critical' | 'warning') => {
    try {
      const response = await fetch('/api/send-alert-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alerts,
          alertType,
          systemInfo: {
            campus: campus || 'all',
            adminEmail: adminEmail || 'Unknown'
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to send email alert:', await response.text());
      } else {
        console.log(`Email alert sent for ${alerts.length} ${alertType} alerts`);
      }
    } catch (err) {
      console.error('Error sending email alert:', err);
    }
  };

  // Track which alerts have been emailed
  const [emailedAlertIds, setEmailedAlertIds] = useState<Set<string>>(new Set());

  // Load system logs and alerts
  const loadSystemLogs = async () => {
    try {
      // Fetch critical errors (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: criticalLogs } = await supabase
        .from('system_logs')
        .select('*')
        .eq('log_type', 'error')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Fetch warning logs (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const { data: warningLogs } = await supabase
        .from('system_logs')
        .select('*')
        .eq('log_type', 'warning')
        .gte('created_at', lastWeek.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Fetch all recent logs for display
      const { data: allLogs } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Fetch AI known issues
      const { data: issues } = await supabase
        .from('ai_issue_memory')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(10);
      
      const newCriticalAlerts = criticalLogs || [];
      const newWarningAlerts = warningLogs || [];
      
      // Send email for new critical alerts (not yet emailed)
      const newCriticalToEmail = newCriticalAlerts.filter((a: SystemLog) => !emailedAlertIds.has(a.id));
      if (newCriticalToEmail.length > 0) {
        await sendEmailAlert(newCriticalToEmail, 'critical');
        setEmailedAlertIds(prev => new Set([...prev, ...newCriticalToEmail.map((a: SystemLog) => a.id)]));
      }
      
      // Send email for new warning alerts (not yet emailed, limit to prevent spam)
      const newWarningsToEmail = newWarningAlerts.filter((a: SystemLog) => !emailedAlertIds.has(a.id)).slice(0, 5);
      if (newWarningsToEmail.length > 0) {
        await sendEmailAlert(newWarningsToEmail, 'warning');
        setEmailedAlertIds(prev => new Set([...prev, ...newWarningsToEmail.map((a: SystemLog) => a.id)]));
      }
      
      setCriticalAlerts(newCriticalAlerts);
      setWarningAlerts(newWarningAlerts);
      setSystemLogs(allLogs || []);
      setAIIssues(issues || []);
    } catch (err) {
      console.error('Error loading system logs:', err);
    }
  };

  // Load student financial data from v_student_financials
  const loadStudentFinancials = async (campusCode: string, page: number = 0) => {
    try {
      let query = supabase
        .from('v_student_financials')
        .select('*')
        .range(page * FINANCIAL_PAGE_SIZE, (page + 1) * FINANCIAL_PAGE_SIZE - 1);
      
      if (campusCode && campusCode !== 'all') {
        query = query.eq('campus', campusCode);
      }
      
      if (financialFilter.status !== 'all') {
        query = query.eq('status', financialFilter.status);
      }
      
      const { data } = await query;
      const financials = data || [];
      setStudentFinancials(financials);
      
      // Calculate financial statistics
      const totalStudents = financials.length;
      const fullyPaid = financials.filter((s: StudentFinancial) => s.total_balance === 0).length;
      const unpaidStudents = financials.filter((s: StudentFinancial) => s.total_balance > 0).length;
      const totalOutstanding = financials.reduce((sum: number, s: StudentFinancial) => sum + (s.total_balance || 0), 0);
      
      setFinancialStats({
        totalStudents,
        fullyPaid,
        unpaidStudents,
        totalOutstanding
      });
    } catch (err) {
      console.error('Error loading student financials:', err);
    }
  };

  const loadStats = async (campusCode: string) => {
    try {
      // Build campus variants for filtering (handle both 'main'/'west' and 'Main Campus'/'West Campus')
      const getCampusVariants = (code: string) => {
        if (!code || code === 'all') return null;
        return [
          code,
          code === 'main' ? 'Main Campus' : code === 'west' ? 'West Campus' : code,
          code === 'Main Campus' ? 'main' : code === 'West Campus' ? 'west' : code
        ];
      };
      const campusVariants = getCampusVariants(campusCode);

      // Load applications stats filtered by campus
      let appsQuery = supabase.from('applications').select('status');
      if (campusVariants) {
        appsQuery = appsQuery.in('campus', campusVariants);
      }
      const { data: applications } = await appsQuery;

      const totalApps = applications?.length || 0;
      const pendingApps = applications?.filter((app: any) => app.status === 'pending').length || 0;
      const approvedApps = applications?.filter((app: any) => app.status === 'enrolled').length || 0;

      // Load lecturers count filtered by campus
      let lecturersQuery = supabase.from('lecturers').select('*', { count: 'exact', head: true });
      if (campusVariants) {
        lecturersQuery = lecturersQuery.in('campus', campusVariants);
      }
      const { count: lecturersCount } = await lecturersQuery;

      // Load students count from applications table with enrolled status filtered by campus
      let studentsQuery = supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'enrolled');
      if (campusVariants) {
        studentsQuery = studentsQuery.in('campus', campusVariants);
      }
      const { count: studentsCount } = await studentsQuery;

      // Load revenue this month
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      let revenueQuery = supabase
        .from('fee_payments')
        .select('amount, payment_method, applications!inner(campus)')
        .eq('status', 'completed')
        .gte('payment_date', monthStart);

      if (campusVariants) {
        revenueQuery = revenueQuery.in('applications.campus', campusVariants);
      }
      const { data: revenueData } = await revenueQuery;

      const totalRevenue = revenueData?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

      // Calculate payment breakdown
      const breakdown: { [key: string]: number } = {};
      revenueData?.forEach((p: any) => {
        breakdown[p.payment_method] = (breakdown[p.payment_method] || 0) + p.amount;
      });

      const paymentBreakdown = Object.entries(breakdown).map(([method, amount]) => ({
        method,
        amount,
        percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      // Load recent payments
      let recentPaymentsQuery = supabase
        .from('fee_payments')
        .select('*, applications!inner(full_name, campus)')
        .order('payment_date', { ascending: false })
        .limit(5);
      
      if (campusVariants) {
        recentPaymentsQuery = recentPaymentsQuery.in('applications.campus', campusVariants);
      }
      const { data: recentPaymentsData } = await recentPaymentsQuery;
      setRecentPayments(recentPaymentsData || []);

      setStats({
        totalApplications: totalApps,
        pendingApplications: pendingApps,
        approvedApplications: approvedApps,
        totalStudents: studentsCount || 0,
        totalLecturers: lecturersCount || 0,
        totalRevenueThisMonth: totalRevenue,
        paymentBreakdown
      });
      
      // Load system logs and financial data
      await Promise.all([
        loadSystemLogs(),
        loadStudentFinancials(campusCode, 0)
      ]);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadNotifications = async (campusCode: string) => {
    try {
      // Fetch recent exam marks submissions
      let query = supabase
        .from('exam_marks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (campusCode && campusCode !== 'all') {
        query = query.eq('campus', campusCode);
      }

      const { data: marksData } = await query;

      if (marksData) {
        // Fetch lecturer assignments to get lecturer names
        const { data: assignments } = await supabase
          .from('lecturer_assignments')
          .select('*, lecturers(full_name)');

        // Group by lecturer and unit to show unique submissions
        const uniqueNotifications = marksData.map((mark: any) => {
          const assignment = assignments?.find((a: any) =>
            a.course === mark.course && a.campus === mark.campus && a.units.includes(mark.unit)
          );

          return {
            id: mark.id,
            lecturer_name: assignment?.lecturers?.full_name || 'Unknown Lecturer',
            course: mark.course,
            unit: mark.unit,
            semester: mark.semester,
            exam_type: mark.exam_type,
            created_at: mark.created_at
          };
        });

        setNotifications(uniqueNotifications);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
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

      // Get user metadata to determine campus
      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);
      setAdminEmail(session.user?.email || '');

      // Load real stats from Supabase with campus parameter
      await loadStats(userCampus);

      // Load notifications
      await loadNotifications(userCampus);
      
      // Load system logs and financial data
      await loadSystemLogs();
      await loadStudentFinancials(userCampus, 0);

      setLoading(false);
    };
    
    // Auto-refresh system logs every 30 seconds
    const logRefreshInterval = setInterval(() => {
      if (supabase) loadSystemLogs();
    }, 30000);

    checkAuth();
    
    return () => {
      // Cleanup interval on unmount
    };
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminCampus');
    router.push('/login/admin');
  };

  const getCampusName = (campusCode: string) => {
    switch (campusCode) {
      case 'main':
        return 'Main Campus';
      case 'west':
        return 'West Campus';
      default:
        return 'All Campuses';
    }
  };
  
  // Get log severity color
  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Dismiss warning alert
  const dismissWarning = (id: string) => {
    setDismissedWarnings(prev => new Set([...prev, id]));
  };

  // Icon SVGs map
  const icons: Record<string, string> = {
    applications: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    courses: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    classes: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    lecturers: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    students: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    results: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    reporting: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    'fee-pdf': 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    admission: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    'fee-structure': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    payments: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    financial: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    reports: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  };

  // Icon colors for different action cards
  const iconColors: Record<string, string> = {
    applications: '#a78bfa',      // Purple
    courses: '#60a5fa',           // Blue
    classes: '#34d399',           // Green
    lecturers: '#fb923c',         // Orange
    students: '#4ade80',          // Light Green
    results: '#f87171',           // Red
    calendar: '#2dd4bf',          // Teal
    reporting: '#fbbf24',         // Yellow
    'fee-pdf': '#c084fc',         // Violet
    admission: '#38bdf8',         // Light Blue
    'fee-structure': '#f472b6',   // Pink
    payments: '#22d3ee',          // Cyan
    financial: '#818cf8',         // Indigo
    reports: '#5eead4'            // Teal Green
  };

  // Action Card Component
  const ActionCard = ({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) => (
    <Link
      href={href}
      className="glass-neu hover:bg-white/20 transition-colors duration-300 block p-4"
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconColors[icon] || '#a78bfa' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon] || icons.applications} />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white truncate leading-tight">
            {title}
          </h3>
          <p className="text-xs text-purple-200 truncate leading-tight">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div 
          className="px-8 py-4 rounded-2xl"
          style={{ 
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white'
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <style jsx global>{`
        :root {
          --base: ${COLORS.base};
          --shadow-dark: ${COLORS.shadowDark};
          --shadow-light: ${COLORS.shadowLight};
          --text: ${COLORS.text};
          --muted: ${COLORS.muted};
          --accent: ${COLORS.accent};
          --raised: 6px 6px 12px ${COLORS.shadowDark}, -6px -6px 12px ${COLORS.shadowLight};
          --raised-sm: 3px 3px 7px ${COLORS.shadowDark}, -3px -3px 7px ${COLORS.shadowLight};
          --inset: inset 4px 4px 8px ${COLORS.shadowDark}, inset -4px -4px 8px ${COLORS.shadowLight};
        }
      `}</style>
      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="relative w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <Link href="/" className="relative w-8 h-8">
                  <Image
                    src="/logo.webp"
                    alt="EAVI Logo"
                    fill
                    className="object-contain"
                  />
                </Link>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-purple-200 text-sm">
                  {getCampusName(campus)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      setViewedNotifications(new Set(notifications.map(n => n.id)));
                    }
                  }}
                  className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.filter(n => !viewedNotifications.has(n.id)).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !viewedNotifications.has(n.id)).length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Exam Submissions</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-gray-500 text-sm">No recent submissions</p>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.lecturer_name}</p>
                                <p className="text-xs text-gray-600">
                                  Submitted marks for <span className="font-semibold">{notification.unit}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {notification.course} - Semester {notification.semester}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome, {adminEmail}
            </h2>
            <p className="text-purple-200">
              Manage {getCampusName(campus)} operations
            </p>
          </div>

          {/* CRITICAL ALERTS BANNER */}
          {criticalAlerts.length > 0 && (
            <div className="mb-6 bg-red-600 border border-red-400 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-white font-bold text-lg">Critical System Issues ({criticalAlerts.length})</h3>
              </div>
              <div className="space-y-2">
                {criticalAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="bg-red-700/50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{alert.message}</p>
                      <p className="text-red-200 text-sm">{alert.module} • {new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">CRITICAL</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowSystemLogs(true)}
                className="mt-3 text-white underline text-sm hover:text-red-200"
              >
                View all system logs →
              </button>
            </div>
          )}
          
          {/* WARNING ALERTS */}
          {warningAlerts.filter(w => !dismissedWarnings.has(w.id)).length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warningAlerts.filter(w => !dismissedWarnings.has(w.id)).slice(0, 6).map((warning) => (
                <div key={warning.id} className="bg-yellow-500/20 border border-yellow-400 rounded-xl p-4 relative">
                  <button 
                    onClick={() => dismissWarning(warning.id)}
                    className="absolute top-2 right-2 text-yellow-300 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-yellow-400 font-semibold text-sm">WARNING</span>
                  </div>
                  <p className="text-white text-sm">{warning.message}</p>
                  <p className="text-yellow-200/70 text-xs mt-1">{warning.module} • {new Date(warning.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* FINANCIAL DASHBOARD SECTION */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Financial Overview</h3>
              <div className="flex gap-2">
                <select 
                  value={financialFilter.campus}
                  onChange={(e) => {
                    setFinancialFilter(prev => ({ ...prev, campus: e.target.value }));
                    loadStudentFinancials(e.target.value, 0);
                  }}
                  className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1 text-sm"
                >
                  <option value="all" className="text-gray-900">All Campuses</option>
                  <option value="main" className="text-gray-900">Main Campus</option>
                  <option value="west" className="text-gray-900">West Campus</option>
                </select>
                <button
                  onClick={() => setShowSystemLogs(!showSystemLogs)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                >
                  {showSystemLogs ? 'Hide' : 'Show'} System Logs
                </button>
              </div>
            </div>
            
            {/* Financial Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="glass-neu p-4">
                <p className="text-purple-300 text-xs uppercase mb-1">Total Students</p>
                <p className="text-2xl font-bold text-white">{financialStats.totalStudents}</p>
              </div>
              <div className="glass-neu p-4">
                <p className="text-purple-300 text-xs uppercase mb-1">Fully Paid</p>
                <p className="text-2xl font-bold text-green-400">{financialStats.fullyPaid}</p>
              </div>
              <div className="glass-neu p-4">
                <p className="text-purple-300 text-xs uppercase mb-1">With Balance</p>
                <p className="text-2xl font-bold text-yellow-400">{financialStats.unpaidStudents}</p>
              </div>
              <div className="glass-neu p-4">
                <p className="text-purple-300 text-xs uppercase mb-1">Total Outstanding</p>
                <p className="text-xl font-bold text-red-400">KES {financialStats.totalOutstanding.toLocaleString()}</p>
              </div>
            </div>
            
            {/* Student Financial Table (Limited Rows) */}
            <div className="glass-neu p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 px-3 text-purple-300 font-semibold">Student</th>
                    <th className="text-left py-2 px-3 text-purple-300 font-semibold">Campus</th>
                    <th className="text-right py-2 px-3 text-purple-300 font-semibold">Balance</th>
                    <th className="text-right py-2 px-3 text-purple-300 font-semibold">Paid</th>
                    <th className="text-center py-2 px-3 text-purple-300 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentFinancials.slice(0, FINANCIAL_PAGE_SIZE).map((student) => (
                    <tr key={student.student_id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-2 px-3 text-white">
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-purple-300 text-xs">{student.admission_number}</p>
                      </td>
                      <td className="py-2 px-3 text-white">{student.campus}</td>
                      <td className="py-2 px-3 text-right text-red-400">KES {student.total_balance?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-green-400">KES {student.total_paid?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${student.total_balance === 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {student.total_balance === 0 ? 'Paid' : 'Balance'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => {
                    const newPage = Math.max(0, financialPage - 1);
                    setFinancialPage(newPage);
                    loadStudentFinancials(campus, newPage);
                  }}
                  disabled={financialPage === 0}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg text-sm"
                >
                  ← Previous
                </button>
                <span className="text-purple-300 text-sm">Page {financialPage + 1}</span>
                <button
                  onClick={() => {
                    const newPage = financialPage + 1;
                    setFinancialPage(newPage);
                    loadStudentFinancials(campus, newPage);
                  }}
                  disabled={studentFinancials.length < FINANCIAL_PAGE_SIZE}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg text-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* SYSTEM LOGS PANEL (Collapsible) */}
          {showSystemLogs && (
            <div className="glass-neu p-4 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">System Logs</h3>
                <button
                  onClick={() => setShowSystemLogs(false)}
                  className="text-purple-300 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getLogColor(log.log_type)}`} />
                    <div className="flex-1">
                      <p className="text-white text-sm">{log.message}</p>
                      <p className="text-purple-300 text-xs">{log.module} • {new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      log.log_type === 'error' ? 'bg-red-500/20 text-red-400' :
                      log.log_type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.log_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI KNOWN ISSUES */}
          {aiIssues.length > 0 && (
            <div className="glass-neu p-4 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Known System Issues</h3>
              <div className="space-y-3">
                {aiIssues.slice(0, 5).map((issue) => (
                  <div key={issue.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{issue.description}</p>
                        <p className="text-purple-300 text-sm">Type: {issue.issue_type}</p>
                        {issue.solution && (
                          <p className="text-green-400 text-sm mt-1">Fix: {issue.solution}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                          {issue.occurrences} occurrences
                        </span>
                        <p className="text-purple-300 text-xs mt-1">
                          Last: {new Date(issue.last_seen).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Total Applications */}
            <div className="glass-neu p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Total Applications</p>
                  <p className="text-2xl md:text-3xl font-bold text-white truncate">{stats.totalApplications}</p>
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="glass-neu p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Pending</p>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-400 truncate">{stats.pendingApplications}</p>
                </div>
              </div>
            </div>

            {/* Approved */}
            <div className="glass-neu p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Approved</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-400 truncate">{stats.approvedApplications}</p>
                </div>
              </div>
            </div>

            {/* Total Students */}
            <div className="glass-neu p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Total Students</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-400 truncate">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            {/* Total Lecturers */}
            <div className="glass-neu p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Total Lecturers</p>
                  <p className="text-2xl md:text-3xl font-bold text-pink-400 truncate">{stats.totalLecturers}</p>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="glass-neu p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Revenue (Month)</p>
                  <p className="text-xl md:text-2xl font-bold text-emerald-400 truncate">
                    KES {stats.totalRevenueThisMonth.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <ActionCard href="/admin/applications" icon="applications" title="Applications" description="View and manage applications" />
            <ActionCard href="/admin/courses" icon="courses" title="Courses" description="Manage course catalog" />
            <ActionCard href="/admin/classes" icon="classes" title="Classes" description="Manage classes & intakes" />
            <ActionCard href="/admin/lecturers" icon="lecturers" title="Lecturers" description="Manage lecturers" />
            <ActionCard href="/admin/students" icon="students" title="Students" description="Manage student records" />
            <ActionCard href="/admin/results" icon="results" title="Results" description="View exam results" />
            <ActionCard href="/admin/calendar" icon="calendar" title="Academic Calendar" description="Manage term dates" />
            <ActionCard href="/admin/reporting-dates" icon="reporting" title="Reporting Dates" description="Set reporting dates" />
            <ActionCard href="/admin/fee-structures" icon="fee-pdf" title="Generate Fee PDFs" description="Generate fee structures" />
            <ActionCard href="/admin/applications" icon="admission" title="Admission Letters" description="Generate admission letters" />
            <ActionCard href="/admin/fee-structure" icon="fee-structure" title="Fee Structure" description="Set course fees" />
            <ActionCard href="/admin/payments" icon="payments" title="Fee Payments" description="Record & manage payments" />
            <ActionCard href="/admin/financial-reports" icon="financial" title="Financial Reports" description="Revenue analysis" />
            <ActionCard href="/admin/reports" icon="reports" title="Reports" description="View & print reports" />
          </div>

          {/* Recent Activity & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payments */}
            <div className="glass-neu">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Payments</h3>
              <div className="space-y-4">
                {recentPayments.length === 0 ? (
                  <p className="text-purple-200 text-sm">No recent payments to display.</p>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 glass-neu-inset">
                      <div>
                        <p className="text-white font-medium text-sm">{payment.applications?.full_name}</p>
                        <p className="text-purple-300 text-xs capitalize">{payment.payment_type} - {payment.payment_method}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-sm">KES {payment.amount.toLocaleString()}</p>
                        <p className="text-purple-300 text-[10px]">{new Date(payment.payment_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
                <Link 
                  href="/admin/payments"
                  className="block text-center text-purple-300 hover:text-white text-sm mt-4 transition-colors"
                >
                  View all payments →
                </Link>
              </div>
            </div>

            {/* Payment Methods Chart */}
            <div className="glass-neu">
              <h3 className="text-xl font-semibold text-white mb-4">Payment Methods (This Month)</h3>
              {stats.paymentBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-purple-200">
                  <p>No revenue data for this month</p>
                </div>
              ) : (
                <div className="space-y-5 mt-4">
                  {stats.paymentBreakdown.map((item) => (
                    <div key={item.method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white capitalize">{item.method.replace('_', ' ')}</span>
                        <span className="text-purple-300">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2.5">
                        <div 
                          className="bg-emerald-500 h-2.5 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-purple-300">KES {item.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  <Link 
                    href="/admin/financial-reports"
                    className="block text-center text-purple-300 hover:text-white text-sm mt-6 transition-colors"
                  >
                    Detailed financial reports →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Chatbot 
        userId={currentUser?.id}
        campus={campus}
        userEmail={currentUser?.email}
        userRole={currentUser?.user_metadata?.role}
        userName={currentUser?.user_metadata?.full_name || adminEmail}
      />
    </div>
  );
}
