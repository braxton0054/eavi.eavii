'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const programs = [
  { code: 'HIT', name: 'Health Records & Information Technology', levels: 'L4 · L5 · L6', dept: 'Health Sciences' },
  { code: 'PTT', name: 'Perioperative Theatre Technology', levels: 'L5 · L6', dept: 'Surgical Sciences' },
  { code: 'MED', name: 'Medical Engineering', levels: 'L4 · L5 · L6', dept: 'Engineering' },
  { code: 'CHA', name: 'Community Health Assistant', levels: 'L5 · L6', dept: 'Community Health' },
  { code: 'OTT', name: 'Orthopedic & Trauma Technology', levels: 'L5', dept: 'Surgical Sciences' },
  { code: 'CNP', name: 'Counselling & Psychology', levels: 'L6', dept: 'Psychology' },
];

const campuses = [
  { name: 'Main Campus', address: 'City Plaza', city: 'Eldoret', tel: '0724269099', display: '0724 269 099' },
  { name: 'West Campus', address: 'Mailinne, Near Kapyemit', city: 'Eldoret', tel: '0748022044', display: '0748 022 044' },
  { name: 'Town Campus', address: 'Skymart Building', city: 'Eldoret', tel: '0726044022', display: '0726 044 022' },
];

const marqueeItems = ['TVETA Accredited', 'CDACC Registered', '3 Campuses · Eldoret', 'Health Sciences', 'Medical Engineering', 'Counselling & Psychology', 'Community Health', 'Perioperative Theatre Tech', 'Bursary Available', 'Min. KCSE D-'];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ticker, setTicker] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    timerRef.current = setInterval(() => setTicker(t => (t + 1) % programs.length), 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <>
      <div className="eavi-page">

      <div className="e-orb e-orb1" />
      <div className="e-orb e-orb2" />
      <div className="e-orb e-orb3" />

      <nav className="e-nav">
        <div className="e-brand">
          <div className="e-logo relative w-11 h-11 rounded-xl overflow-hidden border border-amber-200/30 flex-shrink-0">
            <Image src="/logo.webp" alt="EAVI Logo" fill sizes="44px" className="object-contain p-1" priority />
          </div>
          <div>
            <div className="e-name">EAVI</div>
            <div className="e-sub">East Africa Vision Institute</div>
          </div>
        </div>

        <div className="e-navlinks">
          <Link href="/login/admin" className="e-nl">Admin</Link>
          <Link href="/login/lecturer" className="e-nl">Lecturer</Link>
          <Link href="/login/student" className="e-nl">Student portal</Link>
          <Link href="/apply" className="e-ncta">Apply now →</Link>
        </div>

        <button className="e-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            {menuOpen
              ? <path d="M2 2l14 14M16 2L2 16" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              : <path d="M2 5h14M2 9h14M2 13h14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="e-mmenu">
          {[{href:'/login/admin',label:'Admin login'},{href:'/login/lecturer',label:'Lecturer login'},{href:'/login/student',label:'Student portal'}].map(l => (
            <Link key={l.href} href={l.href} className="e-mlink" onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          <Link href="/apply" className="e-mlink gold" onClick={() => setMenuOpen(false)}>Apply now →</Link>
        </div>
      )}

      <section className="e-hero">
        <div className={`e-hleft eavi-reveal eavi-in`} style={{transitionDelay:'0.1s'}}>
          <div className="e-eyebrow">
            <span className="e-rule" />
            Accredited · TVETA/PRIVATE/TVC/0062/2017
          </div>

          <h1 className="e-h1">
            Build a<br />career<br /><em>worth having.</em>
          </h1>

          <p className="e-hsub">
            East Africa Vision Institute offers CDACC and JP accredited programmes across healthcare, engineering, and community development — in the heart of Eldoret.
          </p>

          <div className="e-hbtns">
            <Link href="/apply" className="e-btnpri">
              Start application
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link href="/login/student" className="e-btnghost">Student portal</Link>
          </div>

          <div className="e-stats">
            {[{v:'3',l:'Campuses'},{v:'15+',l:'Programmes'},{v:'D-',l:'Min. Grade'},{v:'CDACC',l:'Registered',i:true}].map((s) => (
              <div key={s.l} className="e-stat">
                <div className="e-sv" style={s.i ? {fontStyle:'italic',color:'var(--gold)',fontSize:20} : {}}>{s.v}</div>
                <div className="e-sl">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`e-hright eavi-reveal eavi-in`} style={{transitionDelay:'0.3s'}}>
          <div className="e-stack">
            {[(ticker+2)%programs.length,(ticker+1)%programs.length,ticker].map((idx,i) => {
              const p = programs[idx];
              return (
                <div key={`${idx}-${i}`} className={`e-ticket e-t${i}`}>
                  <div className="e-tcode">{p.code} Programme</div>
                  <div className="e-tname">{p.name}</div>
                  <div className="e-tdept">{p.dept}</div>
                  <div className="e-tlevel">{p.levels}</div>
                  <div className="e-tdeco">🎓</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className={`e-mq eavi-reveal eavi-in`} style={{transitionDelay:'0.45s'}}>
        <div className="e-mqt">
          {[...Array(2)].flatMap((_,r) =>
            marqueeItems.map((item,i) => (
              <span key={`${r}-${i}`} className="e-mqi">
                <span className="e-mqdot"/>
                {item}
              </span>
            ))
          )}
        </div>
      </div>

      <section className="e-sec">
        <div className={`eavi-reveal eavi-in`} style={{transitionDelay:'0.1s'}}>
          <div className="e-eyebrow"><span className="e-rule"/>What we offer</div>
          <h2 className="e-sectitle">Our <em>programmes</em></h2>
          <p className="e-secbody">CDACC and JP accredited courses across healthcare, engineering, and community sciences — built for the real world.</p>

          <div className="e-pgrid">
            {programs.map((p,i) => (
              <div key={p.code} className={`e-pcard${i===0?' feat':''}`}>
                <div className="e-pcode">{p.code}</div>
                <div className="e-pname">{p.name}</div>
                <div className="e-pdept">{p.dept}</div>
                <div className="e-plevel">{p.levels}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="e-sec" style={{paddingTop:0}}>
        <div className={`eavi-reveal eavi-in`} style={{transitionDelay:'0.15s'}}>
          <div className="e-eyebrow"><span className="e-rule"/>Where to find us</div>
          <h2 className="e-sectitle">Our <em>campuses</em></h2>
        </div>

        <div className="e-cgrid">
          <div className={`e-ctl eavi-reveal eavi-in`} style={{transitionDelay:'0.2s'}}>
            {campuses.map(c => (
              <div key={c.name} className="e-ci">
                <div className="e-cdot"/>
                <div className="e-cname">{c.name}</div>
                <div className="e-caddr">{c.address} · {c.city}</div>
                <a href={`tel:${c.tel}`} className="e-ctel" suppressHydrationWarning>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {c.display}
                </a>
              </div>
            ))}
          </div>

          <div className={`e-cside eavi-reveal eavi-in`} style={{transitionDelay:'0.25s'}}>
            <div className="e-bcard">
              <div className="e-blabel">Financial support</div>
              <div className="e-btitle">Bursary available for eligible students</div>
              <div className="e-bbody">Don't let finances stop your education. Apply for bursary support and take the first step toward your future.</div>
              <a href="/api/bursary" download="bursary-form.pdf" className="e-bdl">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download bursary form
              </a>
            </div>

            <div className="e-ecard">
              <div>
                <div className="e-elabel">Email us</div>
                <a href="mailto:support@eastafricavisioninstitute.ac.ke" className="e-eaddr" suppressHydrationWarning>
                  support@eastafricavisioninstitute.ac.ke
                </a>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{opacity:.2,flexShrink:0}}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      </section>

      <section className="e-sec" style={{paddingTop:0}}>
        <div className={`eavi-reveal eavi-in`} style={{transitionDelay:'0.1s'}}>
          <div className="e-eyebrow"><span className="e-rule"/>About EAVI</div>
          <h2 className="e-sectitle">Education that <em>transforms.</em></h2>
          <p className="e-secbody">Registered with the Ministry of Education and TVETA, East Africa Vision Institute equips students with practical, industry-aligned skills across healthcare, beauty, engineering, ICT, fashion, business, and community development.</p>

          <a href="https://www.tveta.go.ke/institution-details/?details=TVETA/PRIVATE/TVC/0062/2017" target="_blank" rel="noopener noreferrer" className="e-tveta">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Verify TVETA / CDACC registration ↗
          </a>

          <div className="e-agrid">
            {[
              {n:'01',t:'Our Mission',b:"Providing industry-relevant, hands-on training that empowers students to thrive in today's competitive workforce and contribute meaningfully to society."},
              {n:'02',t:'Why Choose EAVI',b:'Flexible learning, affordable fees with bursary support, diverse CDACC and JP programmes, and career-focused training at three Eldoret campuses.'},
              {n:'03',t:'Our Commitment',b:'Accessible education for all — minimum KCSE grade D- — giving every Kenyan learner a genuine opportunity to build a better future.'},
            ].map(c => (
              <div key={c.n} className="e-acard">
                <div className="e-anum">{c.n}</div>
                <div className="e-atitle">{c.t}</div>
                <div className="e-abody">{c.b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="e-footer">
        <div className="e-fcopy">© {new Date().getFullYear()} East Africa Vision Institute. All rights reserved.</div>
        <div className="e-flinks">
          <Link href="/login/admin" className="e-flink">Admin</Link>
          <Link href="/login/lecturer" className="e-flink">Lecturer</Link>
          <Link href="/login/student" className="e-flink">Student</Link>
          <Link href="/apply" className="e-flink" style={{color:'var(--gold)'}}>Apply now →</Link>
        </div>
      </footer>
      </div>
    </>
  );
}

