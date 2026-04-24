import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a0533] font-sans text-[#f3e8ff]">
      {/* Top Nav */}
      <nav className="bg-[#120225] border-b border-[#2e0f52] p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex gap-2">
            <button className="bg-green-600 text-white rounded-full px-3 py-1 text-xs font-semibold">Admin</button>
            <button className="bg-[#2e0f52] text-purple-300 border border-purple-800 rounded-full px-3 py-1 text-xs">Lecturer</button>
            <button className="bg-[#2e0f52] text-purple-300 border border-purple-800 rounded-full px-3 py-1 text-xs">Student</button>
          </div>
          <div className="text-[#7c3aed] font-bold text-sm">EAVI</div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-[#2d0a57] via-[#1a0533] to-[#0a1f3d] p-6 text-center">
        <div className="max-w-sm mx-auto">
          <span className="bg-green-600 text-white text-[10px] uppercase px-3 py-1 rounded-full">Accredited · TVETA Registered</span>
          <div className="w-16 h-16 bg-[#2e0f52] border-2 border-purple-600 rounded-full flex items-center justify-center mx-auto my-4 text-purple-200 font-bold">EAV</div>
          <h1 className="font-serif text-2xl font-bold mb-1">East Africa Vision Institute</h1>
          <p className="text-xs text-purple-400 tracking-wider mb-6 uppercase">EAVI College · Eldoret</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/apply" className="bg-green-700 text-white rounded-lg px-6 py-3 text-sm font-semibold flex-1 min-w-[120px]">Apply Now</Link>
            <Link href="/login/student" className="bg-blue-700 text-white rounded-lg px-6 py-3 text-sm font-semibold flex-1 min-w-[120px]">Student Login</Link>
            <button className="border-2 border-purple-500 text-purple-300 rounded-lg px-6 py-3 text-sm font-semibold flex-1 min-w-[120px]">View Gallery</button>
          </div>
        </div>
      </header>

      {/* Accreditation */}
      <div className="bg-[#0f3720] px-4 py-2 flex flex-wrap gap-2 text-xs">
        {['TVETA', 'CDACC', 'Ministry of Education'].map(b => (
            <span key={b} className="bg-green-600 text-white px-2 py-0.5 rounded font-bold">{b}</span>
        ))}
        <span className="text-green-300 self-center">Internationally Accredited</span>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 md:grid md:grid-cols-[2fr_1fr] md:gap-8">
        <div>
          {/* Campuses */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold tracking-widest text-purple-500 uppercase mb-3">Our Campuses</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { name: 'Main Campus', addr: 'City Plaza', ph: '0726 044 022' },
                { name: 'West Campus', addr: 'Mailinne', ph: '0748 022 044' },
                { name: 'Town Campus', addr: 'Skymart Building', ph: '0726 044 022' }
              ].map(c => (
                <div key={c.name} className="bg-[#2e0f52] rounded-xl p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-blue-700 flex items-center justify-center text-xs text-white">📍</div>
                    <div>
                        <div className="text-xs font-semibold">{c.name}</div>
                        <div className="text-[10px] text-purple-400">{c.addr} · <a href={`tel:${c.ph.replace(/ /g,'')}`}>{c.ph}</a></div>
                    </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why Choose EAVI */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold tracking-widest text-purple-500 uppercase mb-3">Why Choose EAVI</h2>
            <div className="grid grid-cols-2 gap-2">
              {[ {t: 'Flexible Learning', s: 'Diploma · Cert · Artisan'}, {t: 'Entry: D- & Above', s: 'For all KCSE grads'}, {t: 'Bursary Support', s: 'Affordable fees'}, {t: 'Career-Focused', s: 'Real-world skills'}].map(item => (
                  <div key={item.t} className="bg-[#2e0f52] rounded-lg p-3 text-center">
                      <div className="text-xs font-semibold text-purple-200">{item.t}</div>
                      <div className="text-[10px] text-purple-400 mt-0.5">{item.s}</div>
                  </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside>
            <div className="bg-[#2e0f52] rounded-lg p-4 mb-4">
                <h2 className="text-xs font-semibold tracking-widest text-purple-500 uppercase mb-2">About EAVI</h2>
                <p className="text-xs text-purple-300 leading-relaxed">EAVI is internationally accredited and registered with TVETA. We offer Diploma, Certificate, Artisan, and Short Courses in healthcare, beauty, engineering, ICT, fashion, business, and community development.</p>
            </div>

            <div className="bg-[#1e1045] p-4 rounded-lg border border-[#2e0f52] mb-4 flex items-center justify-between">
                <p className="text-xs text-purple-300">Already a student? Apply for bursary.</p>
                <Link href="/bursary-form.pdf" className="border-2 border-green-600 text-green-400 rounded-md px-3 py-1.5 text-xs font-semibold">Download Form</Link>
            </div>
        </aside>
      </main>

      {/* Login Banner */}
      <div className="bg-[#0a1f3d] p-4 flex items-center justify-between mt-auto">
        <div>
            <span className="text-sm font-semibold text-blue-200 block">Student Portal</span>
            <a href="mailto:support@eastafricavisioninstitute.ac.ke" className="text-xs text-blue-400">support@eastafricavisioninstitute.ac.ke</a>
        </div>
        <Link href="/login/student" className="bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold">Login →</Link>
      </div>
    </div>
  );
}
