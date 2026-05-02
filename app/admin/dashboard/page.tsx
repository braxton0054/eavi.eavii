'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import Chatbot from '@/components/Chatbot';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

// Chart colors
const CHART_COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: '#6b7280'
};

export default function AdminDashboard() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  
  // Core stats - Part 4 Admin Dashboard
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    activeClasses: 0,
    totalRevenueThisMonth: 0,
    totalOutstanding: 0,
    paymentBreakdown: [] as { method: string; amount: number; percentage: number }[]
  });
  
  // Department summary for Part 4
  const [departmentSummary, setDepartmentSummary] = useState<any[]>([]);
  
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

  // Chart data states
  const [revenueChartData, setRevenueChartData] = useState<any>(null);
  const [studentsByCourseData, setStudentsByCourseData] = useState<any>(null);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);

  // UI states
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  
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

      // Part 4: Load courses count
      let coursesQuery = supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true);
      const { count: coursesCount } = await coursesQuery;

      // Part 4: Load active classes count
      let classesQuery = supabase.from('classes').select('*', { count: 'exact', head: true }).eq('is_active', true);
      if (campusVariants) {
        classesQuery = classesQuery.in('campus', campusVariants);
      }
      const { count: classesCount } = await classesQuery;

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

      // Part 4: Calculate total outstanding balance
      let outstandingQuery = supabase
        .from('applications')
        .select('id, campus, total_fee_due, fee_paid')
        .eq('status', 'enrolled');
      if (campusVariants) {
        outstandingQuery = outstandingQuery.in('campus', campusVariants);
      }
      const { data: outstandingData } = await outstandingQuery;
      const totalOutstanding = outstandingData?.reduce((sum: number, s: any) => {
        const due = s.total_fee_due || 0;
        const paid = s.fee_paid || 0;
        return sum + (due - paid);
      }, 0) || 0;

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

      // Part 4: Load department summary
      await loadDepartmentSummary(campusCode);

      setStats({
        totalApplications: totalApps,
        pendingApplications: pendingApps,
        approvedApplications: approvedApps,
        totalStudents: studentsCount || 0,
        totalLecturers: lecturersCount || 0,
        totalCourses: coursesCount || 0,
        activeClasses: classesCount || 0,
        totalRevenueThisMonth: totalRevenue,
        totalOutstanding,
        paymentBreakdown
      });
      
      // Load system logs and financial data
      await Promise.all([
        loadSystemLogs(),
        loadStudentFinancials(campusCode, 0),
        loadChartData(campusCode),
        loadRecentApplications(campusCode)
      ]);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Load chart data for visualizations
  const loadChartData = async (campusCode: string) => {
    try {
      const campusVariants = campusCode && campusCode !== 'all' ? [campusCode] : null;
      
      // Revenue trend (last 6 months)
      const months = [];
      const revenueData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        months.push(monthName);
        
        const monthStart = `${monthKey}-01`;
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const monthEnd = nextMonth.toISOString().slice(0, 10);
        
        let query = supabase
          .from('fee_payments')
          .select('amount, applications!inner(campus)')
          .eq('status', 'completed')
          .gte('payment_date', monthStart)
          .lt('payment_date', monthEnd);
        
        if (campusVariants) {
          query = query.in('applications.campus', campusVariants);
        }
        
        const { data } = await query;
        const total = data?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        revenueData.push(total);
      }
      
      setRevenueChartData({
        labels: months,
        datasets: [{
          label: 'Revenue (KES)',
          data: revenueData,
          borderColor: CHART_COLORS.primary,
          backgroundColor: `${CHART_COLORS.primary}20`,
          fill: true,
          tension: 0.4
        }]
      });
      
      // Students by course (top 5)
      let studentsQuery = supabase
        .from('applications')
        .select('course_id, status, campus')
        .eq('status', 'enrolled');
      
      if (campusVariants) {
        studentsQuery = studentsQuery.in('campus', campusVariants);
      }
      
      const { data: studentsData } = await studentsQuery;
      
      // Group by course and count
      const courseCounts: { [key: string]: number } = {};
      studentsData?.forEach((s: any) => {
        courseCounts[s.course_id] = (courseCounts[s.course_id] || 0) + 1;
      });
      
      // Sort and take top 5
      const sortedCourses = Object.entries(courseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      // Get course names
      const courseIds = sortedCourses.map(([id]) => id);
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, name')
        .in('id', courseIds);
      
      const courseNameMap: { [key: string]: string } = {};
      coursesData?.forEach((c: any) => {
        courseNameMap[c.id] = c.name;
      });
      
      setStudentsByCourseData({
        labels: sortedCourses.map(([id]) => courseNameMap[id] || id),
        datasets: [{
          data: sortedCourses.map(([, count]) => count),
          backgroundColor: [
            CHART_COLORS.primary,
            CHART_COLORS.secondary,
            CHART_COLORS.success,
            CHART_COLORS.warning,
            CHART_COLORS.gray
          ],
          borderWidth: 0
        }]
      });
    } catch (err) {
      console.error('Error loading chart data:', err);
    }
  };

  // Load recent applications for the data table
  const loadRecentApplications = async (campusCode: string) => {
    try {
      const campusVariants = campusCode && campusCode !== 'all' ? [campusCode] : null;
      
      let query = supabase
        .from('applications')
        .select('id, full_name, course_id, application_date, status, campus')
        .order('application_date', { ascending: false })
        .limit(5);
      
      if (campusVariants) {
        query = query.in('campus', campusVariants);
      }
      
      const { data } = await query;
      setRecentApplications(data || []);
    } catch (err) {
      console.error('Error loading recent applications:', err);
    }
  };

  // Part 4: Load department summary
  const loadDepartmentSummary = async (campusCode: string) => {
    try {
      const campusVariants = campusCode && campusCode !== 'all' ? [campusCode] : null;
      
      // Get all departments with their courses
      const { data: departments } = await supabase.from('departments').select('id, name, code');
      
      // Get courses per department
      const { data: courses } = await supabase.from('courses').select('id, name, department_id, is_active');
      
      // Get enrolled students per course
      let studentsQuery = supabase.from('applications').select('course_id, status, financial_hold').eq('status', 'enrolled');
      if (campusVariants) {
        studentsQuery = studentsQuery.in('campus', campusVariants);
      }
      const { data: students } = await studentsQuery;
      
      // Calculate per department
      const summary = departments?.map((dept: any) => {
        const deptCourses = courses?.filter((c: any) => c.department_id === dept.id) || [];
        const totalCourses = deptCourses.length;
        
        const courseIds = deptCourses.map((c: any) => c.id);
        const enrolledStudents = students?.filter((s: any) => courseIds.includes(s.course_id)) || [];
        const totalEnrolled = enrolledStudents.length;
        const onHold = enrolledStudents.filter((s: any) => s.financial_hold).length;
        
        return {
          department: dept.name,
          code: dept.code,
          total_courses: totalCourses,
          total_enrolled: totalEnrolled,
          students_on_hold: onHold
        };
      }).sort((a: any, b: any) => b.total_enrolled - a.total_enrolled) || [];
      
      setDepartmentSummary(summary);
    } catch (err) {
      console.error('Error loading department summary:', err);
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

  // Breadcrumb generator
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length <= 1) return [{ label: 'Dashboard', href: '/admin/dashboard' }];
    
    return paths.slice(1).map((segment, index) => {
      const href = '/admin/' + paths.slice(1, index + 2).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      return { label, href };
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'enrolled':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format currency
  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Zone 2 — Top Action Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <Link 
                    href={crumb.href}
                    className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}
                  >
                    {crumb.label}
                  </Link>
                </span>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Campus Selector */}
            <select
              value={campus}
              onChange={(e) => {
                setCampus(e.target.value);
                loadStats(e.target.value);
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Campuses</option>
              <option value="main">Main Campus</option>
              <option value="west">West Campus</option>
            </select>

            {/* Search */}
            <div className="relative">
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
                  <input
                    type="text"
                    placeholder="Search students, courses..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Notifications */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {(criticalAlerts.length + warningAlerts.length) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Quick Actions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {quickActionsOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link href="/admin/applications" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    New Application
                  </Link>
                  <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    Record Payment
                  </Link>
                  <Link href="/admin/students" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Student
                  </Link>
                  <Link href="/admin/reports" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Report
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6">
        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-red-900 font-semibold text-sm">Critical Issues ({criticalAlerts.length})</h3>
            </div>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <div>
                    <p className="text-red-800">{alert.message}</p>
                    <p className="text-red-600 text-xs">{alert.module} • {new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zone 3 — KPI Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Students */}
          <div className="bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-colors">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Total Students</p>
            <p className="text-2xl font-medium text-gray-900">{stats.totalStudents.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xs text-green-600 font-medium">Enrolled</span>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-colors">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Monthly Revenue</p>
            <p className="text-2xl font-medium text-gray-900">{formatKES(stats.totalRevenueThisMonth)}</p>
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xs text-green-600 font-medium">This month</span>
            </div>
          </div>

          {/* Pending Applications */}
          <div className="bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-colors">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Pending Applications</p>
            <p className="text-2xl font-medium text-gray-900">{stats.pendingApplications}</p>
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-yellow-600 font-medium">Awaiting review</span>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-colors">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Outstanding Balance</p>
            <p className="text-2xl font-medium text-gray-900">{formatKES(stats.totalOutstanding)}</p>
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              <span className="text-xs text-red-600 font-medium">Unpaid fees</span>
            </div>
          </div>
        </div>

        {/* Zone 4 — Chart Row (2/3 + 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Trend Chart (2/3 width on large screens) */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Revenue Trend</h3>
            <div className="h-64">
              {revenueChartData ? (
                <Line 
                  data={revenueChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `KES ${Number(value).toLocaleString()}`,
                          font: { size: 10 }
                        }
                      },
                      x: {
                        ticks: { font: { size: 10 } }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No revenue data available
                </div>
              )}
            </div>
          </div>

          {/* Students by Course Donut (1/3 width) */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Students by Course</h3>
            <div className="h-48">
              {studentsByCourseData ? (
                <Doughnut 
                  data={studentsByCourseData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { font: { size: 10 }, boxWidth: 12 }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone 5 — Data Table + Activity Feed (50/50) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Applications</h3>
              <Link href="/admin/applications" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentApplications.length > 0 ? (
                    recentApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-900">{app.full_name}</p>
                          <p className="text-[10px] text-gray-500">{app.course_id}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {new Date(app.application_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                        No recent applications
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Activity</h3>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-3">
                {systemLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      log.log_type === 'error' ? 'bg-red-500' :
                      log.log_type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 truncate">{log.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {log.module} • {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {systemLogs.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chatbot */}
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