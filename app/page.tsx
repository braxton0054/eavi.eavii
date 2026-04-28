'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function LandingPage() {
  const [coursesOpen, setCoursesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar - Logo & Accredited Badge */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Image src="/logo.webp" alt="EAVI Logo" width={50} height={50} className="object-contain" />
              <div className="hidden sm:block">
                <span className="font-bold text-purple-900 text-xl block leading-tight">East Africa Vision Institute</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
                Accredited · TVETA Registered
              </span>
            </div>
          </div>
          
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between py-3">
            {/* Left Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <Link href="/" className="text-gray-700 hover:text-purple-700 font-semibold transition-colors text-sm">Home</Link>
              <Link href="/courses" className="text-gray-700 hover:text-purple-700 font-semibold transition-colors text-sm">Departments</Link>
              <Link href="/downloads" className="text-gray-700 hover:text-purple-700 font-semibold transition-colors text-sm">Downloads</Link>
              <Link href="/contact" className="text-gray-700 hover:text-purple-700 font-semibold transition-colors text-sm">Contact Us</Link>
              <Link href="/campuses" className="text-gray-700 hover:text-purple-700 font-semibold transition-colors text-sm">Campuses</Link>
              <Link href="/gallery" className="text-gray-700 hover:text-purple-700 font-semibold transition-colors text-sm">Gallery</Link>
            </div>

            {/* Right Login Buttons */}
            <div className="flex items-center gap-2">
              <Link href="/login/admin" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold transition-colors border border-gray-300">Admin</Link>
              <Link href="/login/lecturer" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold transition-colors border border-gray-300">Lecturer</Link>
              <Link href="/login/student" className="bg-purple-700 text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-purple-800 transition-colors">Student Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean Design without Background Image */}
      <header className="relative min-h-[600px] flex items-center bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              East Africa Vision Institute
            </h1>
            <p className="text-2xl text-purple-100 mb-12">
              Your Gateway to Quality Technical & Vocational Education in Eldoret
            </p>
            
            {/* Buttons - Stacked Vertically */}
            <div className="flex flex-col items-center gap-4">
              {/* Primary Action */}
              <Link href="/apply" className="bg-green-600 text-white px-16 py-6 rounded-xl text-2xl font-bold hover:bg-green-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 w-full max-w-md">
                Apply Now
              </Link>
              
              {/* Secondary Actions Row */}
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                <div className="relative">
                  <button 
                    onClick={() => setCoursesOpen(!coursesOpen)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg flex items-center gap-2"
                  >
                    Courses
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {coursesOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-3 space-y-2">
                        <div className="bg-purple-50 rounded-lg p-2">
                          <h3 className="font-bold text-purple-900 text-sm">KNEC Courses</h3>
                          <p className="text-xs text-gray-600">Grade: C- (minus)</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <h3 className="font-bold text-purple-900 text-sm">JP Courses</h3>
                          <p className="text-xs text-gray-600">Grade: D (plain)</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <h3 className="font-bold text-purple-900 text-sm">Short Courses</h3>
                          <p className="text-xs text-gray-600">Open to all</p>
                        </div>
                        <Link href="/courses" className="block text-center py-2 text-purple-600 text-sm font-semibold hover:bg-purple-50 rounded-lg">
                          View All →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <Link href="/login/student" className="bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Student Portal
                </Link>
                <Link href="/about" className="bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="bg-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '20+', label: 'Programs Offered' },
              { value: '3', label: 'Campuses' },
              { value: '5000+', label: 'Graduates' },
              { value: '15+', label: 'Years Experience' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Choose from a wide range of accredited diploma, certificate, and artisan courses designed to prepare you for the modern workforce.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Healthcare', icon: '🏥', courses: 'Community Health, Phlebotomy, Caregivers' },
              { title: 'Technology', icon: '💻', courses: 'Web Development, Mobile Technology, CCTV Management' },
              { title: 'Business', icon: '📊', courses: 'Sales & Marketing, Project Management, Purchasing & Supplies' },
              { title: 'Engineering', icon: '⚙️', courses: 'Automotive, Electrical Installation, Plumbing' },
              { title: 'Creative Arts', icon: '🎨', courses: 'Fashion Design, Graphic Design, Hair & Beauty' },
              { title: 'Education', icon: '📚', courses: 'Teacher Training, English, Sociology' }
            ].map((program) => (
              <div key={program.title} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-200">
                <div className="text-4xl mb-4">{program.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{program.title}</h3>
                <p className="text-gray-600 text-sm">{program.courses}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/apply" className="inline-block bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-purple-100">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-purple-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">👨‍🎓</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Message from the Principal</h2>
              <p className="text-purple-600 font-medium">Welcome to East Africa Vision Institute</p>
            </div>
            <blockquote className="text-gray-700 text-lg leading-relaxed text-center italic">
              "At EAVI, we believe in transforming lives through quality education. Our commitment is to provide industry-relevant training that empowers our students to thrive in the workforce and contribute meaningfully to society. Join us in this journey of excellence."
            </blockquote>
            <div className="text-center mt-6">
              <p className="font-bold text-gray-900">— Principal, EAVI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dean of Students Message */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 md:p-12 text-white shadow-lg">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">👩‍💼</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Dean of Students</h2>
              <p className="text-purple-200 font-medium">Student Affairs & Welfare</p>
            </div>
            <blockquote className="text-purple-100 text-lg leading-relaxed text-center italic">
              "We are dedicated to nurturing not just academic excellence, but also character and leadership. Our students are our priority, and we ensure a supportive environment where everyone can thrive and achieve their dreams."
            </blockquote>
            <div className="text-center mt-6">
              <p className="font-bold">— Dean of Students, EAVI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Clubs and Society */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Clubs & Societies</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Beyond academics, we offer vibrant student activities that build leadership, teamwork, and lifelong friendships.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Student Government', icon: '🗳️', desc: 'Student leadership & representation' },
              { name: 'Tech Club', icon: '💻', desc: 'Technology & innovation hub' },
              { name: 'Sports & Athletics', icon: '⚽', desc: 'Fitness & competitive sports' },
              { name: 'Cultural Society', icon: '🎭', desc: 'Arts, music & cultural events' },
              { name: 'Entrepreneurship Club', icon: '💡', desc: 'Business skills & startups' },
              { name: 'Community Service', icon: '🤝', desc: 'Volunteering & social impact' },
              { name: 'Environmental Club', icon: '🌱', desc: 'Sustainability & green initiatives' },
              { name: 'Debate Society', icon: '🎤', desc: 'Public speaking & critical thinking' }
            ].map((club) => (
              <div key={club.name} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="text-4xl mb-3">{club.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{club.name}</h3>
                <p className="text-gray-600 text-sm">{club.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-purple-200 max-w-2xl mx-auto">The principles that guide everything we do at EAVI</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Excellence', desc: 'Striving for the highest standards in education and service', icon: '⭐' },
              { title: 'Integrity', desc: 'Upholding honesty, transparency, and ethical conduct', icon: '🛡️' },
              { title: 'Innovation', desc: 'Embracing new ideas and technologies for better learning', icon: '💡' },
              { title: 'Inclusivity', desc: 'Creating opportunities for all regardless of background', icon: '🤝' },
              { title: 'Professionalism', desc: 'Maintaining high standards of competence and conduct', icon: '👔' },
              { title: 'Community', desc: 'Building strong relationships and supporting each other', icon: '🏫' }
            ].map((value) => (
              <div key={value.title} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-3xl mb-3">{value.icon}</div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-purple-200 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/254726044022" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 z-50 flex items-center gap-2"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.241-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.004 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
        </svg>
        <span className="font-semibold hidden sm:inline">Chat with Us</span>
      </a>

      {/* Why Choose Us */}
      <section className="py-16 bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose EAVI?</h2>
            <p className="text-purple-200 max-w-2xl mx-auto">We're committed to providing quality education that transforms lives.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Flexible Learning', desc: 'Study at your own pace with diploma, certificate, and artisan levels' },
              { title: 'Affordable Fees', desc: 'Quality education with bursary support available for eligible students' },
              { title: 'Industry-Ready', desc: 'Practical skills training that prepares you for real-world jobs' },
              { title: 'Accredited', desc: 'Registered with TVETA, CDACC, and Ministry of Education' }
            ].map((feature) => (
              <div key={feature.title} className="bg-purple-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-purple-200 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campuses Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Campuses</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Conveniently located across Eldoret to serve you better.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Main Campus', location: 'City Plaza, Eldoret', phone: '0726 044 022' },
              { name: 'West Campus', location: 'Mailinne (Near Kapyemit Dispensary)', phone: '0748 022 044' },
              { name: 'Town Campus', location: 'Skymart Building, Eldoret', phone: '0726 044 022' }
            ].map((campus) => (
              <div key={campus.name} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{campus.name}</h3>
                <p className="text-gray-600 mb-2">{campus.location}</p>
                <a href={`tel:${campus.phone.replace(/ /g, '')}`} className="text-purple-700 font-semibold hover:text-purple-800" suppressHydrationWarning>
                  {campus.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-green-100 mb-8 text-lg">Apply now and join thousands of students who have transformed their careers at EAVI.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="bg-white text-green-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              Apply Now
            </Link>
            <a href="/bursary-form.pdf" target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
              Download Bursary Form
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo.webp" alt="EAVI Logo" width={40} height={40} className="object-contain" />
                <span className="font-bold text-lg">EAVI</span>
              </div>
              <p className="text-gray-400 text-sm">East Africa Vision Institute - Empowering futures through quality technical education.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/apply" className="hover:text-white transition-colors">Apply Now</Link></li>
                <li><Link href="/login/student" className="hover:text-white transition-colors">Student Portal</Link></li>
                <li><a href="/bursary-form.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Bursary Form</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Programs</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Healthcare</li>
                <li>Technology</li>
                <li>Business</li>
                <li>Engineering</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>support@eastafricavisioninstitute.ac.ke</li>
                <li>0726 044 022</li>
                <li>Eldoret, Kenya</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p className="mb-2">© 2026 East Africa Vision Institute. All rights reserved.</p>
            <p className="text-purple-400 font-medium">Developed and Maintained by: EAVI ICT Department</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
