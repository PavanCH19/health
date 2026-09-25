import { useState, useEffect, useRef } from "react";

// ── Inline SVG Icon ────────────────────────────────────────────────────────
const Icon = ({ path, size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" width={size} height={size} className={className}>
    <path d={path} />
  </svg>
);

const ICONS = {
  menu:        "M4 6h16M4 12h16M4 18h16",
  close:       "M6 18L18 6M6 6l12 12",
  mapPin:      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  bell:        "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  shield:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  activity:    "M22 12h-4l-3 9L9 3l-3 9H2",
  heart:       "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  users:       "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  checkCircle: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
  arrowRight:  "M5 12h14M12 5l7 7-7 7",
  droplet:     "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  clipboard:   "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  bed:         "M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9",
  twitter:     "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z",
  facebook:    "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  instagram:   "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z",
  mail:        "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  phone:       "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
};

// ── useInView ──────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Medical cross logo ─────────────────────────────────────────────────────
function CrossMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0891B2" />
      <rect x="13" y="6" width="6" height="20" rx="2" fill="white" />
      <rect x="6" y="13" width="20" height="6" rx="2" fill="white" />
    </svg>
  );
}

// ── ECG decoration ─────────────────────────────────────────────────────────
function ECGLine({ className = "" }) {
  return (
    <svg viewBox="0 0 400 60" className={className} fill="none" preserveAspectRatio="none">
      <polyline
        points="0,30 60,30 75,10 90,50 105,30 130,30 145,5 155,55 165,30 200,30 215,15 225,45 235,30 270,30 285,8 295,52 305,30 340,30 355,18 365,42 375,30 400,30"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = ["Home", "Features", "How It Works", "Contact"];
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
      scrolled ? "bg-white border-cyan-100 shadow-sm" : "bg-white/95 backdrop-blur-sm border-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <CrossMark size={34} />
            <div className="leading-none">
              <span className="text-lg font-extrabold text-slate-800 tracking-tight">
                Blood<span className="text-cyan-600">Connect</span>
              </span>
              <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Hospital Network</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium text-slate-500 hover:text-cyan-600 transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button className="text-sm font-semibold text-cyan-700 border border-cyan-200 px-4 py-2 rounded-lg hover:bg-cyan-50 transition-all">Patient Login</button>
            <button className="text-sm font-semibold text-white bg-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-700 transition-all shadow-sm">Register Now</button>
          </div>
          <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setOpen(!open)}>
            <Icon path={open ? ICONS.close : ICONS.menu} size={22} />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4 pt-2 shadow-lg">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-cyan-600"
              onClick={() => setOpen(false)}>{l}</a>
          ))}
          <div className="flex gap-3 mt-4">
            <button className="flex-1 text-sm font-semibold text-cyan-700 border border-cyan-200 py-2 rounded-lg hover:bg-cyan-50">Patient Login</button>
            <button className="flex-1 text-sm font-semibold text-white bg-cyan-600 py-2 rounded-lg hover:bg-cyan-700">Register Now</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="home" className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-slate-50">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.4 }} />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-100 rounded-full blur-3xl opacity-40 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute top-16 left-0 right-0 h-8 pointer-events-none">
        <ECGLine className="w-full h-full text-cyan-200" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-14 items-center">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            Hospital-Grade Blood Management System
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-5">
            Save Lives with{" "}
            <span className="relative inline-block">
              <span className="text-cyan-600">Smart Blood</span>
              <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-cyan-200 rounded-full" />
            </span>{" "}
            Donation
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
            BloodConnect integrates directly with hospital networks to match verified donors with patients in critical need — precise, fast, and clinically safe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button className="flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 px-6 py-3.5 rounded-lg hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5">
              <Icon path={ICONS.heart} size={18} />
              Become a Donor
            </button>
            <button className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700 bg-white border-2 border-slate-200 px-6 py-3.5 rounded-lg hover:border-cyan-300 hover:text-cyan-700 transition-all hover:-translate-y-0.5">
              <Icon path={ICONS.droplet} size={18} />
              Request Blood
            </button>
          </div>
          <div className="flex flex-wrap gap-5 mt-8 justify-center md:justify-start">
            {[
              { label: "WHO Compliant",   color: "text-emerald-600" },
              { label: "NABH Certified",  color: "text-cyan-600" },
              { label: "24/7 Emergency",  color: "text-rose-500" },
            ].map((b) => (
              <span key={b.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Icon path={ICONS.checkCircle} size={14} className={b.color} />
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Hospital Dashboard Card */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
              {/* Header */}
              <div className="bg-cyan-600 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CrossMark size={22} />
                  <span className="text-sm font-bold text-white">Ward Dashboard · ICU</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-100">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              </div>
              {/* ECG monitor */}
              <div className="bg-slate-900 px-4 py-2">
                <ECGLine className="w-full h-6 text-green-400" />
              </div>
              {/* Body */}
              <div className="p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Blood Bank Availability</p>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { type: "A+",  pct: 72, color: "bg-emerald-500" },
                    { type: "B+",  pct: 45, color: "bg-amber-400" },
                    { type: "O+",  pct: 18, color: "bg-rose-500" },
                    { type: "AB+", pct: 60, color: "bg-cyan-500" },
                  ].map((b) => (
                    <div key={b.type} className="text-center">
                      <div className="relative w-full h-16 bg-slate-100 rounded-lg overflow-hidden mb-1 flex items-end">
                        <div className={`w-full ${b.color} rounded-lg`} style={{ height: `${b.pct}%`, opacity: 0.85 }} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">{b.type}</p>
                      <p className="text-[10px] text-slate-400">{b.pct}%</p>
                    </div>
                  ))}
                </div>
                {/* Alert */}
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5 flex items-center gap-2.5 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-700 truncate">Urgent: O+ critical low</p>
                    <p className="text-[10px] text-rose-400">2 donors matched · 1.4 km</p>
                  </div>
                  <button className="text-xs font-bold text-white bg-rose-500 px-2.5 py-1 rounded-md whitespace-nowrap hover:bg-rose-600 transition-colors">Alert</button>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Requests</p>
                {[
                  { patient: "Pt. #4821", ward: "ICU-3", type: "O−", urgency: "Critical" },
                  { patient: "Pt. #3307", ward: "OT-1",  type: "B+",  urgency: "Urgent" },
                ].map((r) => (
                  <div key={r.patient} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon path={ICONS.bed} size={15} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{r.patient} · {r.ward}</p>
                    </div>
                    <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">{r.type}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.urgency === "Critical" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                      {r.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-white border border-emerald-200 rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Icon path={ICONS.checkCircle} size={13} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Donor matched</p>
                <p className="text-[10px] text-slate-400">8 sec ago</p>
              </div>
            </div>
            <div className="absolute -bottom-3 -left-3 bg-cyan-600 text-white rounded-xl shadow-lg px-3 py-2 text-xs font-bold">
              🏥 12 hospitals connected
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, delay }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref}
      className={`bg-white rounded-2xl p-6 border border-slate-100 hover:border-cyan-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className={`w-12 h-12 rounded-xl ${accent} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon path={icon} size={22} className="text-white" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function Features() {
  const [ref, visible] = useInView();
  const features = [
    { icon: ICONS.mapPin,      title: "Location-Based Donor Search",  desc: "Geofenced donor mapping across hospital zones — find compatible blood within minutes of a critical request.",           accent: "bg-cyan-500" },
    { icon: ICONS.bell,        title: "Instant Clinical Alerts",       desc: "Automated SMS and app push notifications dispatch to eligible donors the moment a ward raises a request.",            accent: "bg-amber-500" },
    { icon: ICONS.shield,      title: "HIPAA-Secure Profiles",         desc: "Encrypted patient and donor records compliant with HIPAA, NABH, and ISO/IEC 27001 healthcare data standards.",       accent: "bg-blue-500" },
    { icon: ICONS.activity,    title: "Real-Time Inventory Tracking",  desc: "Live blood bank dashboard showing unit availability, expiry alerts, and cross-hospital transfer workflows.",          accent: "bg-emerald-500" },
    { icon: ICONS.clipboard,   title: "Digital Donor Health Records",  desc: "Haemoglobin, blood pressure, and eligibility checks stored digitally for every donation — zero paper forms.",       accent: "bg-violet-500" },
    { icon: ICONS.checkCircle, title: "Cross-Hospital Network",        desc: "Connect multiple hospitals, labs, and blood banks on one unified platform for city-wide resource optimisation.",      accent: "bg-rose-500" },
  ];
  return (
    <section id="features" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-12 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Clinical Features</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">Built for Hospital Operations</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base">
            Every feature is designed around clinical workflows, patient safety protocols, and real-world emergency scenarios.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 80} />)}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const [ref, visible] = useInView();
  const steps = [
    { num: "01", icon: ICONS.users,     title: "Register",               desc: "Sign up as a donor, hospital staff, or blood bank admin. Identity is verified via Aadhaar or hospital ID." },
    { num: "02", icon: ICONS.clipboard, title: "Complete Health Profile", desc: "Input blood type, donation history, medical eligibility, and geographic availability for intelligent matching." },
    { num: "03", icon: ICONS.droplet,   title: "Request or Donate",       desc: "Hospitals post urgent requests; donors receive real-time alerts with clinical details and nearest donation centre." },
    { num: "04", icon: ICONS.activity,  title: "Connected Instantly",     desc: "Our matching engine pairs requests with donors in seconds — coordinating transport, screening, and handoff." },
  ];
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-14 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">How It Works</h2>
          <p className="text-slate-500 max-w-lg mx-auto text-base">
            A streamlined clinical process designed with zero friction for both donors and medical staff.
          </p>
        </div>
        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-slate-200 via-cyan-300 to-slate-200" />
          {steps.map((s, i) => {
            const [stepRef, stepVis] = useInView();
            return (
              <div key={s.num} ref={stepRef}
                className={`flex flex-col items-center text-center transition-all duration-500 ${stepVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-cyan-600 flex flex-col items-center justify-center shadow-lg shadow-cyan-100 mb-5">
                  <Icon path={s.icon} size={22} className="text-white" />
                  <span className="text-[10px] font-extrabold text-cyan-200 mt-0.5">{s.num}</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────
function useCounter(target, visible, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let v = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [visible, target, duration]);
  return count;
}

function StatCard({ value, suffix, label, icon, sub }) {
  const [ref, visible] = useInView();
  const count = useCounter(value, visible);
  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon path={icon} size={22} className="text-cyan-100" />
        </div>
      </div>
      <p className="text-4xl font-extrabold text-white mb-1">{count.toLocaleString()}{suffix}</p>
      <p className="text-sm font-semibold text-cyan-100">{label}</p>
      {sub && <p className="text-xs text-cyan-300 mt-0.5">{sub}</p>}
    </div>
  );
}

function Stats() {
  const stats = [
    { value: 52000, suffix: "+", label: "Verified Donors",         sub: "Across India",         icon: ICONS.users },
    { value: 98,    suffix: "%", label: "Request Fulfilment Rate",  sub: "Within 2 hours avg.",  icon: ICONS.checkCircle },
    { value: 31000, suffix: "+", label: "Lives Saved",              sub: "Since 2019",           icon: ICONS.heart },
    { value: 240,   suffix: "+", label: "Partner Hospitals",        sub: "Across 18 states",     icon: ICONS.bed },
  ];
  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-slate-800 via-cyan-900 to-slate-900">
      <div className="absolute top-6 left-0 right-0 h-10 opacity-10 pointer-events-none">
        <ECGLine className="w-full h-full text-cyan-400" />
      </div>
      <div className="absolute bottom-6 left-0 right-0 h-10 opacity-10 pointer-events-none">
        <ECGLine className="w-full h-full text-cyan-400" />
      </div>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, rgba(8,145,178,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Clinical Impact
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Measurable Impact Across India</h2>
          <p className="text-cyan-300 text-base max-w-lg mx-auto">
            Real numbers, real patients, real outcomes — backed by hospital-grade reporting.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>
    </section>
  );
}

// ── CTA ────────────────────────────────────────────────────────────────────
function CTA() {
  const [ref, visible] = useInView();
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref}
          className={`relative bg-white rounded-3xl border border-cyan-100 shadow-xl shadow-cyan-50 p-10 sm:p-14 text-center overflow-hidden transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-cyan-400 rounded-t-3xl" />
          <div className="absolute top-6 right-8 opacity-5"><CrossMark size={80} /></div>
          <div className="absolute bottom-6 left-8 opacity-5"><CrossMark size={60} /></div>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto mb-6">
              <CrossMark size={36} />
            </div>
            <span className="inline-block text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-100 px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
              Join the Network
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Every Unit of Blood is a Second Chance
            </h2>
            <p className="text-slate-500 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Partner your hospital or register as a donor today. One simple step puts you at the heart of India's most trusted clinical blood network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 px-8 py-3.5 rounded-lg hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5">
                <Icon path={ICONS.heart} size={18} />
                Register as Donor
              </button>
              <button className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700 border-2 border-slate-200 px-8 py-3.5 rounded-lg hover:border-cyan-300 hover:text-cyan-700 transition-all hover:-translate-y-0.5">
                <Icon path={ICONS.bed} size={18} />
                Onboard Your Hospital
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-5 flex items-center justify-center gap-2">
              <Icon path={ICONS.shield} size={13} className="text-emerald-400" />
              NABH certified · Zero subscription fees for donors · Data never sold
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contact" className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <CrossMark size={28} />
              <span className="text-base font-extrabold text-white">Blood<span className="text-cyan-400">Connect</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              India's hospital-integrated blood donation management system — connecting critical patients with verified donors since 2019.
            </p>
            <div className="flex gap-3">
              {[ICONS.twitter, ICONS.facebook, ICONS.instagram].map((ic, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-cyan-700 flex items-center justify-center transition-colors">
                  <Icon path={ic} size={15} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">
              {["Home", "Features", "How It Works", "Donate Blood", "Request Blood", "Hospital Portal"].map((l) => (
                <li key={l}><a href="#" className="text-sm hover:text-cyan-400 transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Medical Info</h4>
            <ul className="space-y-2.5">
              {["Eligibility Guidelines", "Donation Safety", "Blood Group FAQs", "Post-Donation Care", "Privacy Policy", "Terms of Service"].map((l) => (
                <li key={l}><a href="#" className="text-sm hover:text-cyan-400 transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3.5 mb-5">
              {[
                { ic: ICONS.mail,   text: "support@bloodconnect.in" },
                { ic: ICONS.phone,  text: "+91 98765 43210" },
                { ic: ICONS.mapPin, text: "Bengaluru, Karnataka, India" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-2.5">
                  <Icon path={item.ic} size={15} className="mt-0.5 shrink-0 text-cyan-500" />
                  <span className="text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2.5 bg-rose-900/40 border border-rose-800 rounded-lg px-3 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-300">Emergency Helpline</p>
                <p className="text-sm font-extrabold text-white">1800-000-BLOOD</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} BloodConnect Hospital Network. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["NABH", "WHO", "ISO 27001"].map((cert) => (
              <span key={cert} className="flex items-center gap-1 text-slate-500">
                <Icon path={ICONS.shield} size={11} className="text-cyan-600" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="font-sans antialiased text-slate-900 scroll-smooth">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}