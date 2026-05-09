'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard' },
      { href: '/admin/applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Applications' },
      { href: '/admin/students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Students' },
      { href: '/admin/lecturers', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Lecturers' },
    ]
  },
  {
    title: 'ACADEMIC',
    items: [
      { href: '/admin/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Courses' },
      { href: '/admin/units', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Units' },
      { href: '/admin/classes', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label: 'Classes' },
      { href: '/admin/results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Results' },
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { href: '/admin/payments', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z', label: 'Payments' },
      { href: '/admin/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Reports' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/admin/announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Announcements' },
    ]
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 640) {
        setSidebarOpen(false);
      } else if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const client = createClient();
    const getUser = async () => {
      const { data: { user } } = await client.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login/admin');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const sidebarWidth = sidebarCollapsed ? 'w-14' : 'w-60';

  return (
    <div className="admin-theme min-h-screen flex">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full admin-sidebar z-50 transition-all duration-300 ease-in-out ${sidebarWidth} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        {/* Brand Logo */}
        <div className={`h-14 border-b border-[var(--admin-border)] flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
          <Link href="/admin/dashboard" className="relative w-8 h-8 flex-shrink-0">
            <Image
              src="/logo.webp"
              alt="EAVI"
              fill
              className="object-contain"
            />
          </Link>
          {!sidebarCollapsed && (
            <span className="font-semibold text-gray-900 text-sm">EAVI Admin</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2">
                  <span className="section-title">
                    {section.title}
                  </span>
                </div>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => isMobile && setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive 
                            ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600' 
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                        </svg>
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-[var(--admin-border)] p-3">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full user-avatar flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--admin-text)] truncate">
                  {currentUser?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)]">Administrator</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button 
                onClick={handleLogout}
                className="p-1.5 text-[var(--admin-text-dim)] hover:text-[var(--admin-danger)] transition-colors"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 admin-header z-40 flex items-center px-4 gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card)] rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/admin/dashboard" className="relative w-8 h-8 flex-shrink-0">
            <Image
              src="/logo.webp"
              alt="EAVI"
              fill
              className="object-contain"
            />
          </Link>
          <span className="font-semibold text-gray-900 text-sm">EAVI Admin</span>
        </header>
      )}

      {/* Main Content */}
      <main 
        className={`admin-main flex-1 transition-all duration-300 
          ${isMobile ? 'ml-0 pt-14' : sidebarCollapsed ? 'ml-14' : 'ml-60'}`}
      >
        {children}
      </main>
    </div>
  );
}
