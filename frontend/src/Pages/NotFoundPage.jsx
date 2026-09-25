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
  home:       "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  arrowLeft:  "M19 12H5M12 5l-7 7 7 7",
  search:     "M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM21 21l-4.35-4.35",
  activity:   "M22 12h-4l-3 9L9 3l-3 9H2",
  alertCircle:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
  phone:      "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  droplet:    "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
};

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

// ── ECG line ───────────────────────────────────────────────────────────────
function ECGLine({ className = "", flatline = false }) {
  const points = flatline
    ? "0,30 400,30"
    : "0,30 60,30 75,10 90,50 105,30 130,30 145,5 155,55 165,30 200,30 215,15 225,45 235,30 270,30 285,8 295,52 305,30 340,30 355,18 365,42 375,30 400,30";
  return (
    <svg viewBox="0 0 400 60" className={className} fill="none" preserveAspectRatio="none">
      <polyline points={points} stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Animated flatline ECG with one spike then silence ─────────────────────
function FlatlineMonitor() {
  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-slate-900/50">
      {/* Monitor header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase">Vitals Monitor · Bed 404</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono">HR: --</span>
          <span className="text-xs text-slate-500 font-mono">SpO₂: --</span>
          <span className="text-[10px] font-bold text-rose-400 bg-rose-900/40 border border-rose-800 px-2 py-0.5 rounded">NO SIGNAL</span>
        </div>
      </div>

      {/* Screen */}
      <div className="px-6 py-5 relative" style={{ minHeight: 120 }}>
        {/* Grid overlay */}
        <div className="absolute inset-0"
          style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        {/* ECG traces — one normal then flatline */}
        <div className="relative z-10 overflow-hidden" style={{ height: 60 }}>
          {/* Normal pulse strip (partial) */}
          <div className="absolute left-0 top-0 w-1/3 h-full">
            <ECGLine className="w-full h-full text-green-400 opacity-60" />
          </div>
          {/* Flatline */}
          <div className="absolute right-0 top-0 w-2/3 h-full">
            <ECGLine flatline className="w-full h-full text-green-400" />
          </div>
          {/* Blinking cursor dot at end */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-green-400"
            style={{ animation: "blink 1s step-start infinite" }} />
        </div>

        {/* Bottom readings */}
        <div className="flex gap-5 mt-3">
          {[
            { label: "TEMP",  val: "--.-°C", color: "text-amber-400" },
            { label: "RESP",  val: "--/min",  color: "text-cyan-400" },
            { label: "BP",    val: "---/---", color: "text-violet-400" },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-[9px] font-bold text-slate-500 font-mono tracking-widest">{r.label}</p>
              <p className={`text-sm font-bold font-mono ${r.color}`}>{r.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alarm bar */}
      <div className="bg-rose-900/60 border-t border-rose-800 px-4 py-1.5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
        <span className="text-xs font-bold text-rose-300 font-mono tracking-wider">⚠ PATIENT RECORD NOT FOUND — PAGE 404</span>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

// ── Clip board / patient chart ─────────────────────────────────────────────
function PatientChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left">
      {/* Clipboard top clip */}
      <div className="flex justify-center py-2 bg-slate-100 border-b border-slate-200">
        <div className="w-10 h-4 rounded-full bg-slate-300" />
      </div>
      <div className="px-5 py-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Patient Record</p>
        {[
          { label: "Patient ID",   val: "#404-ERR",        alert: true },
          { label: "Ward",         val: "Not Assigned",    alert: false },
          { label: "Blood Group",  val: "Unknown",         alert: false },
          { label: "Status",       val: "Record Missing",  alert: true },
          { label: "Admitted",     val: "Never",           alert: false },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
            <span className="text-xs text-slate-400">{row.label}</span>
            <span className={`text-xs font-bold ${row.alert ? "text-rose-500" : "text-slate-600"}`}>
              {row.val}
            </span>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold">
            <Icon path={ICONS.alertCircle} size={13} />
            No data found for this path
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main 404 Page ──────────────────────────────────────────────────────────
export default function NotFoundPage() {
  const [pulse, setPulse] = useState(true);

  // toggle ECG animation state
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{
      backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
      backgroundSize: "28px 28px",
    }}>

      {/* Top ECG strip */}
      <div className="h-10 bg-white border-b border-slate-100 shadow-sm flex items-center px-6">
        <div className="flex items-center gap-2.5 mr-auto">
          <CrossMark size={28} />
          <span className="text-sm font-extrabold text-slate-800">
            Blood<span className="text-cyan-600">Connect</span>
          </span>
          <span className="hidden sm:block text-xs text-slate-400 font-medium">· Hospital Network</span>
        </div>
        <div className="w-48 h-6 opacity-30">
          <ECGLine className="w-full h-full text-cyan-500" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — Text content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* 404 display */}
            <div className="relative inline-block mb-6">
              <span className="text-[120px] sm:text-[160px] font-black leading-none text-slate-100 select-none"
                style={{ letterSpacing: "-0.04em" }}>
                404
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-3">
                  {["4", "0", "4"].map((d, i) => (
                    <span key={i}
                      className="text-6xl sm:text-8xl font-black text-slate-800"
                      style={{
                        animation: `fadeSlideUp 0.5s ease both`,
                        animationDelay: `${i * 0.1}s`,
                        letterSpacing: "-0.02em",
                      }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">
                Patient Record Not Found
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
              This page has been<br />
              <span className="text-cyan-600">discharged</span> from our system
            </h1>

            <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              The ward you're looking for doesn't exist, has been relocated, or was never admitted. Our records show no trace of this URL in our hospital network.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700 bg-white border-2 border-slate-200 px-5 py-3 rounded-lg hover:border-cyan-300 hover:text-cyan-700 transition-all hover:-translate-y-0.5 shadow-sm">
                <Icon path={ICONS.arrowLeft} size={16} />
                Go Back
              </button>
              <a href="/"
                className="flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 px-5 py-3 rounded-lg hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5">
                <Icon path={ICONS.home} size={16} />
                Return to Home
              </a>
              <a href="#contact"
                className="flex items-center justify-center gap-2 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 px-5 py-3 rounded-lg hover:bg-rose-100 transition-all hover:-translate-y-0.5">
                <Icon path={ICONS.phone} size={16} />
                Emergency
              </a>
            </div>

            {/* Suggested pages */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-left max-w-md mx-auto lg:mx-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested Wards</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Donor Registration", icon: ICONS.droplet, href: "#" },
                  { label: "Blood Request",       icon: ICONS.activity, href: "#" },
                  { label: "Hospital Portal",     icon: ICONS.search,   href: "#" },
                  { label: "Contact Support",     icon: ICONS.phone,    href: "#" },
                ].map((s) => (
                  <a key={s.label} href={s.href}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-cyan-700 bg-slate-50 hover:bg-cyan-50 border border-slate-100 hover:border-cyan-200 px-3 py-2.5 rounded-lg transition-all">
                    <Icon path={s.icon} size={13} className="text-cyan-500 shrink-0" />
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Medical illustration */}
          <div className="order-1 lg:order-2 flex flex-col gap-5">
            <FlatlineMonitor />
            <PatientChart />

            {/* Error code tag */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <Icon path={ICONS.alertCircle} size={18} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">HTTP Error Code</p>
                  <p className="text-[10px] text-slate-400">Requested resource unavailable</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-rose-500 font-mono">404</span>
                <p className="text-[10px] text-slate-400 font-mono">NOT FOUND</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ECG strip / footer */}
      <div className="border-t border-slate-200 bg-white px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="w-40 h-6 opacity-20">
          <ECGLine flatline className="w-full h-full text-slate-500" />
        </div>
        <p className="text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} BloodConnect Hospital Network · Page not found
        </p>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          FLATLINE · 404
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}