import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => (
  <nav className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0f0d]">
    <div className="flex items-center gap-3">
      <Image src="/logo.webp" alt="Logo" width={40} height={40} />
      <div>
        <h1 className="text-white font-bold text-lg">EAVI College Eldoret</h1>
        <p className="text-[#1D9E75] text-xs">East Africa Vision Institute</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex bg-[#111a16] rounded-full p-1 border border-white/10">
        {['Student', 'Lecturer', 'Admin'].map(role => (
          <button key={role} className={`px-4 py-1.5 rounded-full text-xs font-medium ${role === 'Student' ? 'bg-[#d4537e] text-white' : 'text-gray-400'}`}>
            {role}
          </button>
        ))}
      </div>
      <Link href="/apply" className="bg-[#1D9E75] text-white px-6 py-2 rounded-full text-sm font-bold">Apply Now</Link>
    </div>
  </nav>
);

const AccreditationStrip = () => (
  <div className="bg-[#1D9E75] text-white py-2 text-center text-xs font-medium tracking-wide">
    Ministry of Education · TVETA · CDACC · International Accreditation
  </div>
);

const Hero = () => (
  <section className="grid grid-cols-2 gap-8 p-12 bg-[#0a0f0d]">
    <div>
      <span className="inline-block bg-[#FBEAF0] text-[#d4537e] px-3 py-1 rounded-full text-xs font-bold mb-4">ACCREDITED INSTITUTION</span>
      <h1 className="text-5xl font-bold text-white mb-4">Building Your <span className="text-[#d4537e]">Futures</span></h1>
      <p className="text-gray-400 mb-6 text-lg">Diverse courses with D- entry grade requirements.</p>
      <div className="flex gap-4">
        <Link href="/apply" className="bg-[#d4537e] text-white px-8 py-3 rounded font-bold">Apply Now</Link>
        <Link href="/login/student" className="border border-[#1D9E75] text-[#1D9E75] px-8 py-3 rounded font-bold">Student Login</Link>
        <Link href="/bursary-form.pdf" className="border border-gray-600 text-gray-400 px-8 py-3 rounded font-bold">Download Bursary Form</Link>
      </div>
    </div>
    <div className="bg-[#111a16] p-6 rounded border border-white/10">
      <h3 className="text-white font-bold mb-4">Quick Stats</h3>
      <ul className="space-y-3 text-gray-400 text-sm">
        <li>Entry Grade: D-</li>
        <li>Accreditation: TVETA & CDACC</li>
        <li>Campuses: 3</li>
        <li>Bursary: Available</li>
      </ul>
    </div>
  </section>
);

const CampusCard = ({ name, address, phone }: { name: string, address: string, phone: string }) => (
  <div className="bg-[#111a16] p-6 rounded border border-white/10">
    <h4 className="text-white font-bold mb-2">{name}</h4>
    <p className="text-gray-400 text-sm">{address}</p>
    <p className="text-[#1D9E75] text-sm mt-2 font-medium">{phone}</p>
  </div>
);

const Footer = () => (
  <footer className="bg-[#111a16] text-gray-500 p-6 text-sm flex justify-between">
    <p>© {new Date().getFullYear()} EAVI College. All rights reserved.</p>
    <p className="text-[#1D9E75]">info@eavi.ac.ke</p>
  </footer>
);

export default function LandingPage() {
  return (
    <div className="bg-[#0a0f0d] min-h-screen font-sans">
      <Navbar />
      <AccreditationStrip />
      <Hero />
      <section className="grid grid-cols-3 gap-6 px-12 pb-12">
        <CampusCard name="Main Campus" address="City Plaza" phone="07XX XXX XXX" />
        <CampusCard name="West Campus" address="Mailinne" phone="07XX XXX XXX" />
        <CampusCard name="Town Campus" address="Skymart Building" phone="07XX XXX XXX" />
      </section>
      <Footer />
    </div>
  );
}
