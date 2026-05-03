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
  { name: 'Main Campus', address: 'City Plaza', city: 'Eldoret', tel: '0726044022', display: '0726 044 022' },
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
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --dp:#0e0020;
          --mid:#26004d;
          --rich:#5b0fa8;
          --light:#9b5de5;
          --gold:#c9a84c;
          --gold-l:#e8cc7e;
          --w:rgba(255,255,255,1);
          --w4:rgba(255,255,255,0.4);
          --w12:rgba(255,255,255,0.12);
          --w06:rgba(255,255,255,0.06);
          --g12:rgba(201,168,76,0.12);
          --g25:rgba(201,168,76,0.25);
        }
        html{scroll-behavior:smooth}
        body{background:var(--dp);color:#fff;font-family:'DM Sans',sans-serif;overflow-x:hidden;min-height:100vh}
        a{text-decoration:none}

        body::after{
          content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.03;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .e-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0}
        .e-orb1{width:700px;height:700px;top:-250px;right:-200px;background:radial-gradient(circle,rgba(91,15,168,.5) 0%,transparent 65%)}
        .e-orb2{width:450px;height:450px;bottom:-100px;left:-120px;background:radial-gradient(circle,rgba(201,168,76,.1) 0%,transparent 70%)}
        .e-orb3{width:350px;height:350px;top:55%;left:35%;background:radial-gradient(circle,rgba(155,93,229,.18) 0%,transparent 70%)}

        .eavi-reveal{opacity:0;transform:translateY(26px);transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1)}
        .eavi-in{opacity:1!important;transform:translateY(0)!important}

        .e-nav{
          position:fixed;top:0;left:0;right:0;z-index:200;
          height:70px;padding:0 5vw;
          display:flex;align-items:center;justify-content:space-between;gap:16px;
          background:rgba(14,0,32,.7);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
          border-bottom:1px solid rgba(201,168,76,.1);
        }
        .e-brand{display:flex;align-items:center;gap:12px}
        .e-logo{width:44px;height:44px;border-radius:10px;overflow:hidden;border:1px solid var(--g25);position:relative;flex-shrink:0}
        .e-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#fff;line-height:1;letter-spacing:.02em}
        .e-sub{font-size:10px;color:var(--gold);letter-spacing:.12em;text-transform:uppercase;margin-top:3px}
        .e-navlinks{display:flex;align-items:center;gap:4px}
        .e-nl{padding:8px 15px;font-size:13px;color:rgba(255,255,255,.6);border-radius:6px;transition:all .2s}
        .e-nl:hover{color:#fff;background:rgba(255,255,255,.07)}
        .e-ncta{padding:9px 20px;font-size:13px;font-weight:500;color:var(--dp);background:var(--gold);border-radius:7px;letter-spacing:.03em;transition:all .2s}
        .e-ncta:hover{background:var(--gold-l);transform:translateY(-1px)}
        .e-burger{display:none;background:none;border:1px solid var(--w12);border-radius:6px;padding:8px;cursor:pointer;color:#fff;align-items:center;justify-content:center}
        .e-mmenu{position:fixed;top:70px;left:0;right:0;z-index:199;background:rgba(14,0,32,.97);backdrop-filter:blur(28px);border-bottom:1px solid rgba(201,168,76,.1);padding:18px 5vw;display:flex;flex-direction:column;gap:8px}
        .e-mlink{display:block;padding:13px 16px;font-size:15px;color:rgba(255,255,255,.7);border:1px solid var(--w06);border-radius:8px;text-align:center;transition:all .2s}
        .e-mlink:hover{color:#fff;background:rgba(255,255,255,.05)}
        .e-mlink.gold{background:var(--gold);color:var(--dp);font-weight:600;border-color:var(--gold)}

        .e-hero{
          min-height:100vh;padding-top:70px;
          display:grid;grid-template-columns:55% 45%;
          align-items:center;position:relative;z-index:1;
        }
        .e-hleft{padding:72px 5vw 72px 5vw}
        .e-eyebrow{
          display:flex;align-items:center;gap:0;
          font-size:11px;letter-spacing:.18em;text-transform:uppercase;
          color:var(--gold);font-weight:500;margin-bottom:28px;
        }
        .e-rule{display:inline-block;width:44px;height:1.5px;background:var(--gold);margin-right:14px;flex-shrink:0}
        .e-h1{
          font-family:'Playfair Display',serif;
          font-size:clamp(44px,5vw,78px);
          font-weight:900;line-height:.97;
          letter-spacing:-.025em;color:#fff;margin-bottom:24px;
        }
        .e-h1 em{font-style:italic;color:var(--gold)}
        .e-hsub{font-size:15px;line-height:1.72;color:rgba(255,255,255,.48);max-width:410px;margin-bottom:40px;font-weight:300}
        .e-hbtns{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:48px}
        .e-btnpri{
          display:inline-flex;align-items:center;gap:8px;
          padding:14px 26px;font-size:13.5px;font-weight:500;letter-spacing:.04em;
          color:var(--dp);background:var(--gold);border-radius:8px;transition:all .2s;
        }
        .e-btnpri:hover{background:var(--gold-l);transform:translateY(-2px);box-shadow:0 14px 36px rgba(201,168,76,.22)}
        .e-btnghost{
          display:inline-flex;align-items:center;gap:8px;
          padding:14px 26px;font-size:13.5px;color:rgba(255,255,255,.65);
          border:1px solid var(--w12);border-radius:8px;transition:all .2s;
        }
        .e-btnghost:hover{color:#fff;border-color:var(--g25);background:rgba(255,255,255,.04)}
        .e-stats{display:flex;align-items:center;gap:0;padding-top:28px;border-top:1px solid var(--w06)}
        .e-stat{display:flex;flex-direction:column;gap:3px;padding-right:28px;margin-right:28px;border-right:1px solid var(--w06)}
        .e-stat:last-child{border-right:none}
        .e-sv{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#fff;line-height:1}
        .e-sl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.35)}

        .e-hright{
          height:100vh;display:flex;align-items:center;
          justify-content:center;position:relative;overflow:hidden;
        }
        .e-stack{position:relative;width:320px;height:440px}
        .e-ticket{
          position:absolute;width:288px;
          border:1px solid rgba(255,255,255,.09);
          border-radius:18px;padding:26px 24px;
          backdrop-filter:blur(12px);
          transition:all .7s cubic-bezier(.16,1,.3,1);
        }
        .e-t0{top:0;left:32px;transform:rotate(5deg);z-index:1;opacity:.35;background:rgba(255,255,255,.025)}
        .e-t1{top:18px;left:16px;transform:rotate(2.5deg);z-index:2;opacity:.6;background:rgba(255,255,255,.035)}
        .e-t2{top:36px;left:0;transform:rotate(0deg);z-index:3;opacity:1;background:rgba(45,0,77,.7);border-color:var(--g25)}
        .e-tcode{font-family:'Playfair Display',serif;font-size:11px;letter-spacing:.2em;color:var(--gold);text-transform:uppercase;margin-bottom:14px}
        .e-tname{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:#fff;line-height:1.25;margin-bottom:8px}
        .e-tdept{font-size:11px;color:rgba(255,255,255,.38);letter-spacing:.06em;text-transform:uppercase;margin-bottom:20px}
        .e-tlevel{display:inline-block;padding:5px 11px;border-radius:5px;background:var(--g12);color:var(--gold-l);font-size:11px;letter-spacing:.1em}
        .e-tdeco{position:absolute;bottom:20px;right:20px;width:38px;height:38px;border-radius:50%;border:1.5px solid var(--g25);display:flex;align-items:center;justify-content:center;font-size:16px}

        .e-mq{border-top:1px solid rgba(201,168,76,.1);border-bottom:1px solid rgba(201,168,76,.1);overflow:hidden;padding:13px 0;background:rgba(201,168,76,.03);position:relative;z-index:1}
        .e-mqt{display:flex;animation:mqscroll 30s linear infinite;white-space:nowrap}
        .e-mqi{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(201,168,76,.65);padding:0 30px;display:inline-flex;align-items:center;gap:14px;flex-shrink:0}
        .e-mqdot{width:4px;height:4px;border-radius:50%;background:var(--gold);opacity:.45;flex-shrink:0}
        @keyframes mqscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

        .e-sec{padding:88px 5vw;position:relative;z-index:1}
        .e-sectitle{font-family:'Playfair Display',serif;font-size:clamp(30px,3.8vw,50px);font-weight:900;color:#fff;line-height:1.08;margin-bottom:14px}
        .e-sectitle em{font-style:italic;color:var(--gold)}
        .e-secbody{font-size:15px;color:rgba(255,255,255,.42);max-width:500px;line-height:1.72;font-weight:300;margin-bottom:52px}

        .e-pgrid{display:grid;grid-template-columns:1.8fr 1fr 1fr;gap:14px}
        .e-pcard{
          border:1px solid var(--w06);border-radius:16px;padding:26px 24px;
          background:rgba(255,255,255,.02);position:relative;overflow:hidden;
          transition:all .3s;cursor:default;
        }
        .e-pcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),transparent);opacity:0;transition:opacity .3s}
        .e-pcard:hover{border-color:var(--g25);background:rgba(255,255,255,.042);transform:translateY(-3px)}
        .e-pcard:hover::before{opacity:1}
        .e-pcard.feat{grid-row:span 2}
        .e-pcode{font-family:'Playfair Display',serif;font-size:11px;letter-spacing:.2em;color:var(--gold);text-transform:uppercase;margin-bottom:13px}
        .e-pname{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:#fff;line-height:1.28;margin-bottom:7px}
        .e-pcard.feat .e-pname{font-size:24px}
        .e-pdept{font-size:12px;color:rgba(255,255,255,.32);margin-bottom:18px}
        .e-plevel{display:inline-block;padding:5px 11px;border-radius:5px;border:1px solid var(--g25);color:var(--gold-l);font-size:11px;letter-spacing:.08em}

        .e-cgrid{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:start;margin-top:52px}
        .e-ctl{position:relative;padding-left:36px}
        .e-ctl::before{content:'';position:absolute;left:7px;top:14px;bottom:14px;width:1px;background:linear-gradient(to bottom,var(--gold) 0%,rgba(201,168,76,.08) 100%)}
        .e-ci{position:relative;padding-bottom:42px}
        .e-ci:last-child{padding-bottom:0}
        .e-cdot{position:absolute;left:-32px;top:7px;width:16px;height:16px;border-radius:50%;border:2px solid var(--gold);background:var(--dp);display:flex;align-items:center;justify-content:center}
        .e-cdot::after{content:'';width:6px;height:6px;border-radius:50%;background:var(--gold)}
        .e-cname{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:4px}
        .e-caddr{font-size:13px;color:rgba(255,255,255,.38);margin-bottom:12px}
        .e-ctel{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--gold);font-weight:500;transition:color .2s}
        .e-ctel:hover{color:var(--gold-l)}

        .e-cside{display:flex;flex-direction:column;gap:18px}
        .e-bcard{
          border:1px solid var(--g25);border-radius:20px;padding:34px 30px;
          background:linear-gradient(135deg,rgba(201,168,76,.07) 0%,rgba(38,0,77,.4) 100%);
          position:relative;overflow:hidden;
        }
        .e-bcard::before{content:'"';position:absolute;top:-24px;right:16px;font-family:'Playfair Display',serif;font-size:180px;color:rgba(201,168,76,.05);line-height:1;pointer-events:none;user-select:none}
        .e-blabel{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
        .e-btitle{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#fff;margin-bottom:10px;line-height:1.22}
        .e-bbody{font-size:13px;color:rgba(255,255,255,.42);line-height:1.65;margin-bottom:22px}
        .e-bdl{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;font-size:13px;font-weight:500;color:var(--dp);background:var(--gold);border-radius:8px;transition:all .2s;letter-spacing:.02em}
        .e-bdl:hover{background:var(--gold-l);transform:translateY(-1px)}
        .e-ecard{border:1px solid var(--w06);border-radius:14px;padding:22px 26px;display:flex;align-items:center;justify-content:space-between;gap:14px;background:rgba(255,255,255,.02)}
        .e-elabel{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.28);margin-bottom:6px}
        .e-eaddr{font-size:12.5px;color:rgba(255,255,255,.65);transition:color .2s;word-break:break-all}
        .e-eaddr:hover{color:var(--gold)}

        .e-agrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:52px}
        .e-acard{border:1px solid var(--w06);border-radius:16px;padding:30px 26px;background:rgba(255,255,255,.02);transition:all .3s}
        .e-acard:hover{border-color:rgba(201,168,76,.18);background:rgba(255,255,255,.04)}
        .e-anum{font-family:'Playfair Display',serif;font-size:46px;font-weight:900;color:rgba(201,168,76,.15);line-height:1;margin-bottom:14px}
        .e-atitle{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#fff;margin-bottom:8px}
        .e-abody{font-size:13px;color:rgba(255,255,255,.38);line-height:1.65}
        .e-tveta{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border:1px solid var(--g25);border-radius:8px;font-size:13px;color:var(--gold);transition:all .2s;margin-top:44px}
        .e-tveta:hover{background:rgba(201,168,76,.07);border-color:var(--gold)}

        .e-footer{border-top:1px solid var(--w06);padding:28px 5vw;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;position:relative;z-index:1}
        .e-fcopy{font-size:12px;color:rgba(255,255,255,.22);letter-spacing:.04em}
        .e-flinks{display:flex;align-items:center;gap:18px}
        .e-flink{font-size:12px;color:rgba(255,255,255,.28);transition:color .2s;letter-spacing:.04em}
        .e-flink:hover{color:var(--gold)}

        @media(max-width:1024px){
          .e-pgrid{grid-template-columns:1fr 1fr}
          .e-pcard.feat{grid-row:span 1}
          .e-pcard.feat .e-pname{font-size:19px}
          .e-cgrid{grid-template-columns:1fr;gap:48px}
          .e-agrid{grid-template-columns:1fr 1fr}
        }
        @media(max-width:768px){
          .e-hero{grid-template-columns:1fr;min-height:auto}
          .e-hleft{padding:56px 5vw 40px}
          .e-hright{display:none}
          .e-h1{font-size:42px}
          .e-navlinks{display:none}
          .e-burger{display:flex}
          .e-pgrid{grid-template-columns:1fr}
          .e-agrid{grid-template-columns:1fr}
          .e-footer{flex-direction:column;text-align:center}
          .e-stats{flex-wrap:wrap;gap:16px}
          .e-stat{border-right:none;margin-right:0;padding-right:0}
        }
      `}</style>

      <div className="e-orb e-orb1" />
      <div className="e-orb e-orb2" />
      <div className="e-orb e-orb3" />

      <nav className="e-nav">
        <div className="e-brand">
          <div className="e-logo">
            <Image src="/logo.webp" alt="EAVI Logo" fill className="object-contain p-1" priority />
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
        <div className={`e-hleft eavi-reveal ${mounted ? 'eavi-in' : ''}`} style={{transitionDelay:'0.1s'}}>
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

        <div className={`e-hright eavi-reveal ${mounted ? 'eavi-in' : ''}`} style={{transitionDelay:'0.3s'}}>
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

      <div className={`e-mq eavi-reveal ${mounted ? 'eavi-in' : ''}`} style={{transitionDelay:'0.45s'}}>
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
        <div className={`eavi-reveal ${mounted ? 'eavi-in' : ''}`} style={{transitionDelay:'0.1s'}}>
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
        <div className={`eavi-reveal ${mounted ? 'eavi-in' : ''}`} style={{transitionDelay:'0.15s'}}>
          <div className="e-eyebrow"><span className="e-rule"/>Where to find us</div>
          <h2 className="e-sectitle">Our <em>campuses</em></h2>
        </div>

        <div className="e-cgrid">
          <div className={`e-ctl eavi-reveal ${mounted ? 'eavi-in' : ''}`} style={{transitionDelay:'0.2s'}}>
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

          <div className={`e-cside eavi-reveal ${mounted ? 'eavi-in' : ''}`} style={{transitionDelay:'0.25s'}}>
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
        <div className={`eavi-reveal ${mounted ? 'eavi-in' : ''}`} style={{transitionDelay:'0.1s'}}>
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
    </>
  );
}
