'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 w-full px-4 md:px-6 py-4 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex-shrink-0 relative w-16 h-16 md:w-20 md:h-20">
            <Image
              src="/logo.webp"
              alt="East Africa Vision Institute Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login/admin" className="px-5 py-2.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-lg transition-all duration-300 text-sm font-semibold backdrop-blur-sm hover:shadow-lg hover:shadow-purple-600/30">
              Admin
            </Link>
            <Link href="/login/lecturer" className="px-5 py-2.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-lg transition-all duration-300 text-sm font-semibold backdrop-blur-sm hover:shadow-lg hover:shadow-purple-600/30">
              Lecturer
            </Link>
            <Link href="/login/student" className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-600/40">
              Student
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-2">
            <Link href="/login/admin" className="block px-4 py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-all text-center font-semibold" onClick={() => setMobileMenuOpen(false)}>
              Admin Login
            </Link>
            <Link href="/login/lecturer" className="block px-4 py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-all text-center font-semibold" onClick={() => setMobileMenuOpen(false)}>
              Lecturer Login
            </Link>
            <Link href="/login/student" className="block px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg transition-all text-center font-semibold shadow-lg" onClick={() => setMobileMenuOpen(false)}>
              Student Login
            </Link>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Hero Section */}
        <div className={`text-center mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-purple-200 text-sm font-medium">Accredited Institution</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
            EAVI College
          </h1>
          <p className="text-purple-200 text-lg md:text-xl font-light mb-2">
            East Africa Vision Institute
          </p>
          <p className="text-purple-300 text-sm md:text-base max-w-2xl mx-auto">
            Transforming lives through quality education and practical skills
          </p>
        </div>

        {/* Loading Animation */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-400/20 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row justify-center gap-4 mb-16 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link
            href="/apply"
            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all duration-300 text-lg font-bold shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Apply Now
          </Link>
          <Link
            href="/login/student"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-purple-400 text-white rounded-xl transition-all duration-300 text-lg font-semibold hover:shadow-xl transform hover:scale-105"
          >
            Student Portal
          </Link>
        </div>

        {/* Campus Information Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Main Campus */}
          <div className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/20 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold">Main Campus</h3>
            </div>
            <p className="text-purple-200 text-sm mb-2">City Plaza, Eldoret</p>
            <a href="tel:0726044022" className="text-purple-300 text-sm hover:text-white transition-colors font-medium" suppressHydrationWarning>
              0726 044 022
            </a>
          </div>

          {/* West Campus */}
          <div className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/20 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold">West Campus</h3>
            </div>
            <p className="text-purple-200 text-sm mb-2">Mailinne (Near Kapyemit)</p>
            <a href="tel:0748022044" className="text-purple-300 text-sm hover:text-white transition-colors font-medium" suppressHydrationWarning>
              0748 022 044
            </a>
          </div>

          {/* Town Campus */}
          <div className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/20 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold">Town Campus</h3>
            </div>
            <p className="text-purple-200 text-sm mb-2">Skymart Building, Eldoret</p>
            <a href="tel:0726044022" className="text-purple-300 text-sm hover:text-white transition-colors font-medium" suppressHydrationWarning>
              0726 044 022
            </a>
          </div>

          {/* Email */}
          <div className="group bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/20 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold">Email</h3>
            </div>
            <a href="mailto:support@eastafricavisioninstitute.ac.ke" className="text-purple-300 text-sm hover:text-white transition-colors break-all font-medium" suppressHydrationWarning>
              support@eastafricavisioninstitute.ac.ke
            </a>
          </div>
        </div>

        {/* Bursary Download */}
        <div className={`text-center mb-16 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-left">
              <h3 className="text-white font-semibold text-lg mb-1">Financial Support Available</h3>
              <p className="text-purple-200 text-sm">Apply for bursary to support your education</p>
            </div>
            <a
              href="/api/bursary"
              download="bursary-form.pdf"
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Form
            </a>
          </div>
        </div>

        {/* About Section */}
        <div className={`transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-10 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-white font-bold text-2xl md:text-3xl mb-3">About East Africa Vision Institute</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-purple-700 mx-auto rounded-full" />
            </div>
            <p className="text-purple-200 text-sm md:text-base text-center leading-relaxed mb-8 max-w-4xl mx-auto">
              East Africa Vision Institute is accredited internationally and is registered with the Ministry of Education and TVETA. We are dedicated to equipping students with real-world skills for today's competitive job market. We offer Diploma, Certificate, Artisan, and Short Courses across diverse fields including healthcare, beauty, engineering, ICT, fashion, business, and community development.
            </p>
            
            <div className="text-center mb-8">
              <a
                href="https://www.tveta.go.ke/institution-details/?details=TVETA/PRIVATE/TVC/0062/2017"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-blue-500/50 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                View TVETA/CDACC Registration
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-400/30 transition-all">
                <div className="w-12 h-12 bg-purple-600/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-base mb-2 text-center">Our Mission</h3>
                <p className="text-purple-300 text-xs md:text-sm text-center leading-relaxed">To provide industry-relevant, hands-on training that empowers students to thrive in the workforce and contribute meaningfully to society.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-400/30 transition-all">
                <div className="w-12 h-12 bg-purple-600/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-base mb-2 text-center">Why Choose EAVI</h3>
                <p className="text-purple-300 text-xs md:text-sm text-center leading-relaxed">Flexible learning options, affordable fees with bursary support, diverse courses, and career-focused training.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-400/30 transition-all">
                <div className="w-12 h-12 bg-purple-600/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-base mb-2 text-center">Our Commitment</h3>
                <p className="text-purple-300 text-xs md:text-sm text-center leading-relaxed">Accessible education for students with minimum KCSE grade of D- and above, giving every learner a chance to succeed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-16 pt-8 border-t border-white/10 transition-all duration-1000 delay-800 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <p className="text-purple-300 text-sm">Loading your experience...</p>
          </div>
          <p className="text-purple-400 text-xs">
            © {new Date().getFullYear()} East Africa Vision Institute. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
