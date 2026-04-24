import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.webp" alt="EAVI Logo" width={40} height={40} className="object-contain" />
            <span className="font-bold text-purple-900 text-lg hidden sm:block">EAVI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login/admin" className="text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors">Admin</Link>
            <Link href="/login/lecturer" className="text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors">Lecturer</Link>
            <Link href="/login/student" className="bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-800 transition-colors">Student Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Campus Image */}
      <header className="relative min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <Image 
            src="/hero background.webp" 
            alt="EAVI Campus" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="max-w-2xl">
            <span className="inline-block bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">Accredited · TVETA Registered</span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              East Africa Vision Institute
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              Your Gateway to Quality Technical & Vocational Education in Eldoret
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/apply" className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg">
                Apply Now
              </Link>
              <Link href="/login/student" className="bg-white text-purple-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                Student Portal
              </Link>
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
                <a href={`tel:${campus.phone.replace(/ /g, '')}`} className="text-purple-700 font-semibold hover:text-purple-800">
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
            <Link href="/bursary-form.pdf" className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
              Download Bursary Form
            </Link>
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
                <li><Link href="/bursary-form.pdf" className="hover:text-white transition-colors">Bursary Form</Link></li>
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
            <p>© 2026 East Africa Vision Institute. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
