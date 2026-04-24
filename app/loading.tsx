'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Header with Login Buttons */}
      <div className="relative z-10 w-full px-4 md:px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="w-full max-w-6xl mx-auto flex justify-between items-center gap-4">
          <div className="flex-shrink-0 relative w-20 h-20 md:w-28 md:h-28">
            <Image
              src="/logo.webp"
              alt="East Africa Vision Institute Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden sm:flex flex-wrap justify-center gap-3">
            <a
              href="/login/admin"
              className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium backdrop-blur-sm"
            >
              Admin
            </a>
            <a
              href="/login/lecturer"
              className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium backdrop-blur-sm"
            >
              Lecturer
            </a>
            <a
              href="/login/student"
              className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium backdrop-blur-sm"
            >
              Student
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-white hover:text-purple-300 transition-colors"
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
          <div className="sm:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col gap-2">
              <a
                href="/login/admin"
                className="px-4 py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium backdrop-blur-sm text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Login
              </a>
              <a
                href="/login/lecturer"
                className="px-4 py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium backdrop-blur-sm text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Lecturer Login
              </a>
              <a
                href="/login/student"
                className="px-4 py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium backdrop-blur-sm text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Student Login
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header Section */}
        <div className={`text-center mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            EAVI College Eldoret
          </h1>
          <p className="text-purple-200 text-base md:text-lg font-light">
            East Africa Vision Institute
          </p>
        </div>

        {/* Loading Animation */}
        <div className={`flex justify-center mb-8 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-purple-400/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Apply Button */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <a
            href="/apply"
            className="px-20 py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl transition-all duration-300 text-xl md:text-2xl font-bold shadow-2xl hover:shadow-green-500/50 transform hover:scale-105"
          >
            Apply Now
          </a>
        </div>

        {/* Campus Information */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Main Campus */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-2">Main Campus</h3>
            <p className="text-purple-200 text-sm mb-3">City Plaza, Eldoret</p>
            <a href="tel:0726044022" className="text-purple-300 text-sm hover:text-white transition-colors" suppressHydrationWarning>
              0726 044 022
            </a>
          </div>

          {/* West Campus */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-2">West Campus</h3>
            <p className="text-purple-200 text-sm mb-3">Mailinne (Near Kapyemit Dispensary)</p>
            <a href="tel:0748022044" className="text-purple-300 text-sm hover:text-white transition-colors" suppressHydrationWarning>
              0748 022 044
            </a>
          </div>

          {/* Town Campus */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-2">Town Campus</h3>
            <p className="text-purple-200 text-sm mb-3">Skymart Building, Eldoret</p>
            <a href="tel:0726044022" className="text-purple-300 text-sm hover:text-white transition-colors" suppressHydrationWarning>
              0726 044 022
            </a>
          </div>

          {/* Email */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-2">Email</h3>
            <a href="mailto:support@eastafricavisioninstitute.ac.ke" className="text-purple-300 text-sm hover:text-white transition-colors break-all" suppressHydrationWarning>
              support@eastafricavisioninstitute.ac.ke
            </a>
          </div>
        </div>

        {/* Student Login Section */}
        <div className={`text-center mb-8 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <a
            href="/login/student"
            className="inline-block px-12 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 text-lg md:text-xl font-bold shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105"
          >
            Student Login
          </a>
        </div>

        {/* Bursary Download Section */}
        <div className={`text-center mb-12 transition-all duration-1000 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-purple-200 text-sm mb-4">Already a student? Apply for bursary support</p>
          <a
            href="/api/bursary"
            download="bursary-form.pdf"
            className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all duration-300 text-base font-semibold shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105"
          >
            Download Bursary Form
          </a>
        </div>

        {/* Image Gallery */}
        <div className={`transition-all duration-1000 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-white font-semibold text-xl mb-6 text-center">Campus Gallery</h2>
          <div className="columns-2 md:columns-4 lg:columns-5 xl:columns-6 gap-3 md:gap-4 space-y-3 md:space-y-4">
            {(galleryExpanded ? [
              'BK-4.jpg',
              'BK-7.jpg',
              'BK-9.jpg',
              'BK-10.jpg',
              'BK-11.jpg',
              'BK-17.jpg',
              'BK-18.jpg',
              'BK-22.jpg',
              'BK-23.jpg',
              'BK-24.jpg',
              'BK-34.jpg',
              'IMG-20250902-WA0014.jpg',
              'IMG-20251018-WA0061.jpg',
              'IMG-20251025-WA0001.jpg',
              'IMG-20251025-WA0007.jpg',
              'IMG-20251025-WA0008.jpg',
              'IMG-20251028-WA0010.jpg',
              'IMG-20251028-WA0016.jpg',
              'IMG-20251028-WA0017.jpg',
              'IMG-20251030-WA0000.jpg',
              'IMG-20251030-WA0005.jpg',
              'IMG-20251030-WA0006.jpg',
              'IMG-20251030-WA0007.jpg',
              'IMG-20251030-WA0008.jpg',
              'IMG-20251030-WA0010.jpg',
              'IMG-20260206-WA0124.jpg',
              'IMG-20260323-WA0006.jpg',
              'IMG-20260324-WA0007.jpg',
              'IMG-20260326-WA0099.jpg',
              'IMG-20260326-WA0104.jpg',
              'IMG-20260326-WA0106.jpg',
              'IMG-20260326-WA0108.jpg',
              'IMG-20260329-WA0069.jpg',
              'IMG-20260329-WA0071.jpg'
            ] : [
              'BK-4.jpg',
              'BK-7.jpg',
              'BK-9.jpg',
              'BK-10.jpg',
              'BK-11.jpg',
              'BK-17.jpg'
            ]).map((img) => (
              <Link key={img} href="/apply" className="relative break-inside-avoid group block">
                <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-purple-400/50 cursor-pointer">
                  <div className="relative aspect-[4/3] md:aspect-[3/4]">
                    <Image
                      src={`/${img}`}
                      alt="Campus"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <button
              onClick={() => setGalleryExpanded(!galleryExpanded)}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium"
            >
              {galleryExpanded ? 'Show Less' : 'View Full Gallery'}
            </button>
          </div>
        </div>

        {/* School Information */}
        <div className={`mt-12 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/10">
            <h2 className="text-white font-semibold text-xl mb-4 text-center">About East Africa Vision Institute</h2>
            <p className="text-purple-200 text-sm md:text-base text-center leading-relaxed mb-4">
              East Africa Vision Institute is accredited internationally and is registered with the Ministry of Education and TVETA. We are dedicated to equipping students with real-world skills for today's competitive job market. We offer Diploma, Certificate, Artisan, and Short Courses across diverse fields including healthcare, beauty, engineering, ICT, fashion, business, and community development.
            </p>
            <div className="text-center mb-6">
              <a
                href="https://www.tveta.go.ke/institution-details/?details=TVETA/PRIVATE/TVC/0062/2017"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-blue-500/50 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                View TVETA/CDACC Registration
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <h3 className="text-white font-semibold text-base mb-2">Our Mission</h3>
                <p className="text-purple-300 text-xs md:text-sm">To provide industry-relevant, hands-on training that empowers students to thrive in the workforce and contribute meaningfully to society.</p>
              </div>
              <div className="text-center">
                <h3 className="text-white font-semibold text-base mb-2">Why Choose EAVI</h3>
                <p className="text-purple-300 text-xs md:text-sm">Flexible learning options, affordable fees with bursary support, diverse courses, and career-focused training.</p>
              </div>
              <div className="text-center">
                <h3 className="text-white font-semibold text-base mb-2">Our Commitment</h3>
                <p className="text-purple-300 text-xs md:text-sm">Accessible education for students with minimum KCSE grade of D- and above, giving every learner a chance to succeed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 transition-all duration-1000 delay-800 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-purple-300 text-sm mb-4">Loading your experience...</p>
          <a
            href="/login/student"
            className="inline-block px-8 py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium backdrop-blur-sm"
          >
            Student Login
          </a>
        </div>
      </div>
    </div>
  );
}
