import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login as loginAction, completeProfile } from "../features/auth/authSlice";
import { extractRoleFromToken, login as apiLogin, mapProfileToDashboardUser, normalizeRole, register as apiRegister } from "../features/auth/authAPI";
import { fetchProfile as apiFetchProfile } from "../features/profile/profileAPI";
import { useNavigate, Navigate } from "react-router-dom";
import karnatakaData from "../assets/karnataka_data.json";
// ProfileCompletionForm is rendered via its own route (/auth/completeProfile)

// ─────────────────────────────────────────────────────────────────────────────
// ICON PRIMITIVES  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
  >
    <path d={path} />
  </svg>
);

const ICONS = {
  eye:         "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff:      "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
  mail:        "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock:        "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  user:        "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  phone:       "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  droplet:     "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  check:       "M20 6L9 17l-5-5",
  chevronR:    "M9 18l6-6-6-6",
  activity:    "M22 12h-4l-3 9L9 3l-3 9H2",
  shield:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  building:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  calendar:    "M3 4h18M16 2v4M8 2v4M3 10h18M5 4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5z",
  alertCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI ATOMS  (pixel-identical to original)
// ─────────────────────────────────────────────────────────────────────────────
function CrossMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0891B2" />
      <rect x="13" y="6" width="6" height="20" rx="2" fill="white" />
      <rect x="6" y="13" width="20" height="6" rx="2" fill="white" />
    </svg>
  );
}

function ECGLine({ className = "" }) {
  return (
    <svg viewBox="0 0 400 60" className={className} fill="none" preserveAspectRatio="none">
      <polyline
        points="0,30 60,30 75,10 90,50 105,30 130,30 145,5 155,55 165,30 200,30 215,15 225,45 235,30 270,30 285,8 295,52 305,30 340,30 355,18 365,42 375,30 400,30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Field — unchanged API, unchanged markup
function Field({ label, type = "text", icon, placeholder, value, onChange, suffix, error, hint }) {
  const [showPass, setShowPass] = useState(false);
  const inputType = type === "password" ? (showPass ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
      <div
        className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200 focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100 ${
          error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {icon && (
          <div className="pl-3.5 shrink-0">
            <Icon path={icon} size={16} className="text-slate-400" />
          </div>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="flex-1 px-3 py-3 text-sm text-slate-800 bg-transparent outline-none placeholder-slate-300 font-medium"
        />
        {type === "password" && (
          <button type="button" onClick={() => setShowPass(!showPass)} className="pr-3.5 shrink-0">
            <Icon
              path={showPass ? ICONS.eyeOff : ICONS.eye}
              size={16}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            />
          </button>
        )}
        {suffix && <span className="pr-3.5 text-xs text-slate-400 font-medium shrink-0">{suffix}</span>}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
          <Icon path={ICONS.alertCircle} size={11} /> {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// SelectField — unchanged
function SelectField({ label, icon, options, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100 transition-all duration-200">
        {icon && (
          <div className="pl-3.5 shrink-0">
            <Icon path={icon} size={16} className="text-slate-400" />
          </div>
        )}
        <select
          value={value}
          onChange={onChange}
          className="flex-1 px-3 py-3 text-sm text-slate-800 bg-transparent outline-none font-medium appearance-none cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="pr-3.5">
          <Icon path={ICONS.chevronR} size={14} className="text-slate-400 rotate-90" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT PANEL  (unchanged — "register" mode now also covers profile completion)
// ─────────────────────────────────────────────────────────────────────────────
function LeftPanel({ mode }) {
  const isLogin = mode === "login";

  return (
    <div className="hidden lg:flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 p-10 text-white">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(8,145,178,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute top-16 left-0 right-0 h-10 opacity-15 pointer-events-none">
        <ECGLine className="w-full h-full text-cyan-400" />
      </div>
      <div className="absolute bottom-24 left-0 right-0 h-10 opacity-15 pointer-events-none">
        <ECGLine className="w-full h-full text-cyan-400" />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3 mb-auto">
        <CrossMark size={40} />
        <div>
          <p className="text-xl font-extrabold tracking-tight">
            Blood<span className="text-cyan-400">Connect</span>
          </p>
          <p className="text-[10px] text-cyan-300 uppercase tracking-widest font-medium">Hospital Network</p>
        </div>
      </div>

      {/* Illustration */}
      <div className="relative my-10 flex justify-center">
        <div className="relative">
          <div className="bg-slate-800/80 border border-slate-600 rounded-2xl p-5 w-64 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {isLogin ? "Access Portal" : "Intake Form"}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>

            <div className="mb-4 bg-slate-900 rounded-lg px-3 py-2">
              <ECGLine className="w-full h-7 text-emerald-400" />
            </div>

            {isLogin ? (
              <div className="space-y-2">
                {[
                  { label: "Active Donors",    val: "52,481", color: "text-cyan-400"    },
                  { label: "Hospitals Online", val: "240+",   color: "text-emerald-400" },
                  { label: "Requests Today",   val: "1,847",  color: "text-amber-400"   },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{s.label}</span>
                    <span className={`text-xs font-bold font-mono ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { step: "01", label: "Personal Info",   done: true  },
                  { step: "02", label: "Medical Profile", done: false },
                  { step: "03", label: "Verification",    done: false },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        s.done ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {s.done ? <Icon path={ICONS.check} size={10} /> : s.step}
                    </div>
                    <span className={`text-xs ${s.done ? "text-slate-300" : "text-slate-500"}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="absolute -top-4 -right-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-xs">
            <p className="font-bold text-white">🏥 NABH Certified</p>
          </div>
          <div className="absolute -bottom-4 -left-6 bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 rounded-xl px-3 py-2 text-xs">
            <p className="font-bold text-cyan-200">🔒 256-bit Encrypted</p>
          </div>
        </div>
      </div>

      {/* Bottom copy */}
      <div className="relative mt-auto">
        <h2 className="text-2xl font-extrabold leading-tight mb-2">
          {isLogin
            ? "Welcome back to the network"
            : "Join India's largest clinical blood network"}
        </h2>
        <p className="text-sm text-cyan-300 leading-relaxed">
          {isLogin
            ? "Access real-time donor data, manage ward requests, and save lives — all from one secure portal."
            : "Register as a donor or hospital partner and become part of a life-saving community across 18 states."}
        </p>
        <div className="flex gap-4 mt-5">
          {["WHO Compliant", "ISO 27001", "24/7 Support"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-semibold">
              <Icon path={ICONS.shield} size={11} className="text-cyan-400" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN FORM — behaviour unchanged
// ─────────────────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: "", password: "", role: "donor", remember: false });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email)                             e.email    = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))  e.email    = "Enter a valid email";
    if (!form.password)                          e.password = "Password is required";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    (async () => {
      setLoading(true);
      try {
        const res = await apiLogin({ email: form.email, password: form.password });
        const token = res?.data?.data?.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        const storedToken = localStorage.getItem('token');
        const role = extractRoleFromToken(storedToken) || normalizeRole(form.role);
        if (role) {
          localStorage.setItem('role', role);
        }

        // Immediately check profile existence BEFORE updating auth state to avoid
        // premature redirects from the auth UI.
        try {
          const profRes = await apiFetchProfile();
          console.log('Profile Data:', profRes.data);
          const profile = profRes?.data?.data || profRes?.data || {};
          const dashboardUser = mapProfileToDashboardUser(profile, storedToken);
          // mark profile complete and store profile (this also marks isProfileComplete)
          dispatch(loginAction({ email: form.email, role, token: storedToken, isProfileComplete: true }));
          dispatch(completeProfile(dashboardUser));
          setSuccess(true);
          setTimeout(() => navigate('/dashboard'), 700);
        } catch (pErr) {
          const status = pErr?.response?.status;
          if (status === 404) {
            // profile missing — sign in user (profile incomplete) and redirect to complete-profile
            dispatch(loginAction({ email: form.email, role, token, isProfileComplete: false }));
            navigate('/auth/completeProfile');
          } else if (status === 401) {
            // unauthorized — clear auth and show error
            localStorage.clear();
            setErrors({ form: 'Session expired — please login again' });
          } else {
            const msg = pErr?.response?.data?.message || pErr?.message || 'Profile check failed';
            setErrors({ form: msg });
          }
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Login failed';
        setErrors({ form: msg });
      } finally {
        setLoading(false);
      }
    })();
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8" style={{ animation: "fadeIn .4s ease" }}>
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-5">
          <Icon path={ICONS.check} size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Access Granted</h2>
        <p className="text-slate-500 text-sm mb-6">Welcome back. Redirecting to your dashboard…</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-cyan-500"
              style={{ animation: "bounce .8s ease infinite", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center py-10 px-6 sm:px-10" style={{ animation: "fadeIn .4s ease" }}>
      {/* Mobile logo */}
      <div className="flex lg:hidden items-center gap-2.5 mb-8">
        <CrossMark size={30} />
        <span className="text-base font-extrabold text-slate-800">
          Blood<span className="text-cyan-600">Connect</span>
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-px bg-cyan-500" />
          <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Secure Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Sign In</h1>
        <p className="text-slate-500 text-sm">Access your BloodConnect account</p>
      </div>

      {/* Role selector */}
      {/* <div className="flex gap-2 mb-7 p-1 bg-slate-100 rounded-xl">
        {[
          { val: "donor",    label: "Donor",    icon: ICONS.droplet  },
          { val: "hospital", label: "Hospital", icon: ICONS.building },
          { val: "admin",    label: "Admin",    icon: ICONS.shield   },
        ].map((r) => (
          <button key={r.val} type="button" onClick={() => setForm((f) => ({ ...f, role: r.val }))}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-lg transition-all ${
              form.role === r.val ? "bg-white text-cyan-700 shadow-sm border border-cyan-100" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon path={r.icon} size={13} />
            {r.label}
          </button>
        ))}
      </div> */}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email Address" type="email" icon={ICONS.mail}
          placeholder="doctor@hospital.in" value={form.email}
          onChange={set("email")} error={errors.email} />
        <Field label="Password" type="password" icon={ICONS.lock}
          placeholder="Enter your password" value={form.password}
          onChange={set("password")} error={errors.password} />

        {errors.form && (
          <p className="text-sm text-rose-500 font-medium">{errors.form}</p>
        )}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                form.remember ? "bg-cyan-600 border-cyan-600" : "border-slate-300"
              }`}
              onClick={() => setForm((f) => ({ ...f, remember: !f.remember }))}
            >
              {form.remember && <Icon path={ICONS.check} size={10} className="text-white" />}
            </div>
            <span className="text-xs text-slate-600 font-medium">Remember me</span>
          </label>
          <button type="button" className="text-xs text-cyan-600 font-semibold hover:text-cyan-700">
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 py-3.5 rounded-xl hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Authenticating…
            </>
          ) : (
            <>Sign In <Icon path={ICONS.chevronR} size={16} /></>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-200" />
        {/* <span className="text-xs text-slate-400 font-medium">or continue with</span> */}
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* OAuth stubs */}
      {/* <div className="grid grid-cols-2 gap-3 mb-8">
        {[{ name: "Google", emoji: "🔵" }, { name: "Hospital SSO", emoji: "🏥" }].map((p) => (
          <button key={p.name} type="button"
            className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 py-2.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all">
            <span>{p.emoji}</span> {p.name}
          </button>
        ))}
      </div> */}

      <p className="text-center text-sm text-slate-500">
        New to BloodConnect?{" "}
        <button onClick={onSwitch} className="text-cyan-600 font-bold hover:text-cyan-700 hover:underline">
          Create account
        </button>
      </p>

      <div className="mt-6 flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
        <p className="text-xs text-rose-600 font-semibold">
          Emergency? Call <span className="font-extrabold">1800-000-BLOOD</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER FORM — simplified to 3 fields only (email + password + confirm)
// ─────────────────────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const dispatch = useDispatch();
  // use `onSwitch` to flip back to login view after successful registration

  const [form, setForm]       = useState({ email: "", password: "", confirm: "", role: "donor" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email    = "Valid email required";
    if (!form.password || form.password.length < 8)       e.password = "Min. 8 characters";
    if (form.password !== form.confirm)                   e.confirm  = "Passwords don't match";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    (async () => {
      setLoading(true);
      try {
        await apiRegister({
          email: form.email,
          role: normalizeRole(form.role),
          password: form.password,
          confirmPassword: form.confirm,
        });
        // After successful registration, switch to the login view
        onSwitch();
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Registration failed';
        setErrors({ form: msg });
      } finally {
        setLoading(false);
      }
    })();
  };

  // Success state — matches original "Registration Complete" screen aesthetics
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8" style={{ animation: "fadeIn .4s ease" }}>
        <div className="w-20 h-20 rounded-full bg-cyan-50 border-2 border-cyan-200 flex items-center justify-center mb-5">
          <Icon path={ICONS.check} size={36} className="text-cyan-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Account Created!</h2>
        <p className="text-slate-500 text-sm mb-2">Setting up your profile next…</p>
        <p className="text-xs text-slate-400 mb-6">
          Signed in as <span className="font-semibold text-slate-600">{form.email}</span>
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-cyan-500"
              style={{ animation: "bounce .8s ease infinite", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center py-10 px-6 sm:px-10" style={{ animation: "fadeIn .4s ease" }}>
      {/* Mobile logo */}
      <div className="flex lg:hidden items-center gap-2.5 mb-8">
        <CrossMark size={30} />
        <span className="text-base font-extrabold text-slate-800">
          Blood<span className="text-cyan-600">Connect</span>
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-px bg-cyan-500" />
          <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">New Account</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Create Account</h1>
        <p className="text-slate-500 text-sm">Quick sign-up — full profile comes next</p>
      </div>

      {/* Role selector (donor / hospital only — no admin on register) */}
      {/* <div className="flex gap-2 mb-7 p-1 bg-slate-100 rounded-xl">
        {[
          { val: "donor",    label: "Donor",    icon: ICONS.droplet  },
          { val: "hospital", label: "Hospital", icon: ICONS.building },
        ].map((r) => (
          <button key={r.val} type="button" onClick={() => setForm((f) => ({ ...f, role: r.val }))}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-lg transition-all ${
              form.role === r.val ? "bg-white text-cyan-700 shadow-sm border border-cyan-100" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon path={r.icon} size={13} />
            {r.label}
          </button>
        ))}
      </div> */}

      {/* ── Only 3 fields ── */}
      <div className="space-y-4">
        <Field label="Email Address" type="email" icon={ICONS.mail}
          placeholder="arjun@hospital.in" value={form.email}
          onChange={set("email")} error={errors.email} />
        <Field label="Password" type="password" icon={ICONS.lock}
          placeholder="Min. 8 characters" value={form.password}
          onChange={set("password")} error={errors.password} />
        <Field label="Confirm Password" type="password" icon={ICONS.lock}
          placeholder="Repeat password" value={form.confirm}
          onChange={set("confirm")} error={errors.confirm} />
      </div>

      {errors.form && (
        <p className="text-sm text-rose-500 font-medium mt-3">{errors.form}</p>
      )}

      <button type="button" onClick={handleSubmit} disabled={loading}
        className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 py-3 rounded-xl hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Creating account…
          </>
        ) : (
          <>Create Account <Icon path={ICONS.chevronR} size={16} /></>
        )}
      </button>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <button onClick={onSwitch} className="text-cyan-600 font-bold hover:text-cyan-700 hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE COMPLETION FORM
//
// This IS the original multi-step registration UI — pixel-identical.
// It renders post-login when isProfileComplete === false.
// Password fields are intentionally removed (account already exists).
// Email is pre-filled from the Redux store.
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_STEPS = ["Account", "Medical", "Verify"];

// function ProfileCompletionForm() {
//   const dispatch  = useDispatch();
//   const authUser  = useSelector((s) => s.auth.user); // { email, role }
//   const navigate = useNavigate();

//   const [step, setStep]       = useState(0);
//   const [errors, setErrors]   = useState({});
//   const [loading, setLoading] = useState(false);
//   const [done, setDone]       = useState(false);

//   const [form, setForm] = useState({
//     name:       "",
//     phone:      "",
//     email:      authUser?.email ?? "",   // pre-filled, read-only feel
//     city:       "",
//     district:   "",
//     village:    "",
//     state:      "",
//     role:       authUser?.role  ?? "donor",
//     bloodGroup: "",
//     birthDate:  "",
//     agree:      false,
//     lat:        null,
//     lng:        null,
//   });

//   const set = (k) => (e) =>
//     setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

//   // Per-step validation — mirrors original exactly (minus password fields)
//   const validateStep = () => {
//     const e = {};
//     if (step === 0) {
//       if (!form.name)                                        e.name     = "Name is required";
//       if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email   = "Valid email required";
//       if (!form.phone || form.phone.length < 10)             e.phone   = "Valid phone required";
//       if (!form.district)                                    e.district= "District is required";
//       if (!form.city)                                        e.city    = "City / Taluk is required";
//       if (!form.village)                                     e.village = "Village is required";
//       if (!form.state)                                       e.state   = "State is required";
//     }
//     if (step === 1) {
//       if (!form.bloodGroup)                                  e.bloodGroup = "Select blood group";
//       if (!form.birthDate)                                   e.birthDate  = "Date of birth required";
//     }
//     if (step === 2) {
//       if (!form.agree) e.agree = "You must accept the terms";
//     }
//     return e;
//   };

//   const next = () => {
//     const e = validateStep();
//     if (Object.keys(e).length) { setErrors(e); return; }
//     setErrors({});
//     if (step < PROFILE_STEPS.length - 1) {
//       setStep((s) => s + 1);
//     } else {
//       setLoading(true);
//       setTimeout(() => {
//         setLoading(false);
//         // Sets isProfileComplete: true in the store
//         dispatch(completeProfile({ ...form }));
//         // after completing profile, navigate to login page
//         navigate('/auth');
//       }, 1000);
//     }
//   };

//   // --- Location helpers -------------------------------------------------
//   function getGPSLocation() {
//     return new Promise((resolve, reject) => {
//       if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
//       navigator.geolocation.getCurrentPosition(
//         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//         (err) => reject(err),
//         { enableHighAccuracy: true, timeout: 10000 }
//       );
//     });
//   }

//   async function reverseGeocode(lat, lng) {
//     // small delay to be polite to Nominatim
//     await new Promise((r) => setTimeout(r, 600));
//     const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
//     const res = await fetch(url);
//     if (!res.ok) throw new Error('Reverse geocode failed');
//     const data = await res.json();
//     const a = data.address || {};
//     return {
//       village: a.village || a.suburb || a.hamlet || a.locality || "",
//       city: a.county || a.town || a.city || a.city_district || "",
//       district: a.state_district || a.county || a.district || "",
//       state: a.state || "",
//     };
//   }

//   async function geocodeAddress(village, taluq, district) {
//     // small delay to be polite to Nominatim
//     await new Promise((r) => setTimeout(r, 600));
//     const query = `${village || ''}, ${taluq || ''}, ${district || ''}, Karnataka, India`;
//     const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
//     const res = await fetch(url);
//     if (!res.ok) throw new Error('Geocode failed');
//     const data = await res.json();
//     if (!data || !data.length) throw new Error('Location not found');
//     return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
//   }

//   const [locLoading, setLocLoading] = useState(false);
//   const [locError, setLocError] = useState("");

//   async function handleUseCurrentLocation() {
//     setLocError("");
//     setLocLoading(true);
//     try {
//       const gps = await getGPSLocation();
//       const addr = await reverseGeocode(gps.lat, gps.lng);
//       setForm((f) => ({ ...f, lat: gps.lat, lng: gps.lng, village: addr.village || f.village, city: addr.city || f.city, district: addr.district || f.district, state: addr.state || f.state }));
//     } catch (err) {
//       setLocError(err?.message || 'Could not resolve current location');
//     } finally {
//       setLocLoading(false);
//     }
//   }

//   async function handleGeocodeAddress() {
//     setLocError("");
//     setLocLoading(true);
//     try {
//       const g = await geocodeAddress(form.village, form.city, form.district);
//       setForm((f) => ({ ...f, lat: g.lat, lng: g.lng }));
//     } catch (err) {
//       setLocError(err?.message || 'Could not geocode address');
//     } finally {
//       setLocLoading(false);
//     }
//   }

//   // ── Completion state (identical style to original "Registration Complete") ──
//   if (done) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8" style={{ animation: "fadeIn .4s ease" }}>
//         <div className="w-20 h-20 rounded-full bg-cyan-50 border-2 border-cyan-200 flex items-center justify-center mb-5">
//           <Icon path={ICONS.check} size={36} className="text-cyan-600" />
//         </div>
//         <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Profile Complete!</h2>
//         <p className="text-slate-500 text-sm mb-2">Taking you to your dashboard…</p>
//         <p className="text-xs text-slate-400 mb-6">
//           Welcome, <span className="font-semibold text-slate-600">{form.firstName || authUser?.email}</span>
//         </p>
//         <div className="flex gap-1.5">
//           {[0, 1, 2].map((i) => (
//             <div key={i} className="w-2 h-2 rounded-full bg-cyan-500"
//               style={{ animation: "bounce .8s ease infinite", animationDelay: `${i * 0.2}s` }} />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col justify-center py-10 px-6 sm:px-10" style={{ animation: "fadeIn .4s ease" }}>
//       {/* Mobile logo */}
//       <div className="flex lg:hidden items-center gap-2.5 mb-8">
//         <CrossMark size={30} />
//         <span className="text-base font-extrabold text-slate-800">
//           Blood<span className="text-cyan-600">Connect</span>
//         </span>
//       </div>

//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center gap-2 mb-3">
//           <div className="w-8 h-px bg-cyan-500" />
//           <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">New Patient Intake</span>
//         </div>
//         <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Complete Profile</h1>
//         <p className="text-slate-500 text-sm">Join the BloodConnect hospital network</p>
//       </div>

//       {/* Progress stepper — pixel-identical to original */}
//       <div className="flex items-center gap-0 mb-8">
//         {PROFILE_STEPS.map((s, i) => (
//           <div key={s} className="flex items-center flex-1 last:flex-none">
//             <div className="flex flex-col items-center">
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
//                 i < step    ? "bg-cyan-600 border-cyan-600 text-white"
//                 : i === step  ? "bg-white border-cyan-600 text-cyan-700"
//                 : "bg-white border-slate-200 text-slate-400"
//               }`}>
//                 {i < step ? <Icon path={ICONS.check} size={13} /> : i + 1}
//               </div>
//               <span className={`text-[10px] font-bold mt-1 uppercase tracking-wide ${
//                 i <= step ? "text-cyan-600" : "text-slate-400"
//               }`}>{s}</span>
//             </div>
//             {i < PROFILE_STEPS.length - 1 && (
//               <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${i < step ? "bg-cyan-500" : "bg-slate-200"}`} />
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Role selector — step 0 only */}
//       {step === 0 && (
//         <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-xl">
//           {[
//             { val: "donor",    label: "Donor",    icon: ICONS.droplet  },
//             { val: "hospital", label: "Hospital", icon: ICONS.building },
//           ].map((r) => (
//             <button key={r.val} type="button" onClick={() => setForm((f) => ({ ...f, role: r.val }))}
//               className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-lg transition-all ${
//                 form.role === r.val ? "bg-white text-cyan-700 shadow-sm border border-cyan-100" : "text-slate-500 hover:text-slate-700"
//               }`}>
//               <Icon path={r.icon} size={13} />
//               {r.label}
//             </button>
//           ))}
//         </div>
//       )}

//       {/* ── Step 0: Personal Info (uses single name field) ── */}
//       {step === 0 && (
//         <div className="space-y-4">
//           <Field label="Full Name" icon={ICONS.user} placeholder="Arjun Mehta"
//             value={form.name} onChange={set("name")} error={errors.name} />
//           <Field label="Email Address" type="email" icon={ICONS.mail}
//             placeholder="arjun@hospital.in" value={form.email}
//             onChange={set("email")} error={errors.email} />
//           <Field label="Mobile Number" icon={ICONS.phone} placeholder="98765 43210"
//             value={form.phone} onChange={set("phone")} error={errors.phone}
//             hint="OTP will be sent for verification" />

//           <div className="grid grid-cols-2 gap-3">
//             <SelectField
//               label="District" icon={ICONS.building}
//               value={form.district}
//               onChange={(e) => {
//                 // set district and clear city/village selection
//                 set("district")(e);
//                 setForm((f) => ({ ...f, city: "", village: "", lat: null, lng: null }));
//               }}
//               options={[
//                 { value: "", label: "Select district" },
//                 ...Object.keys(karnatakaData.Karnataka || {}).map((d) => ({ value: d, label: d })),
//               ]}
//             />

//             <SelectField
//               label="City / Taluk" icon={ICONS.activity}
//               value={form.city}
//               onChange={(e) => {
//                 set("city")(e);
//                 setForm((f) => ({ ...f, village: "", lat: null, lng: null }));
//               }}
//               options={[
//                 { value: "", label: "Select district" },
//                 ...Object.keys(karnatakaData?.Karnataka ?? karnatakaData ?? {}).map((d) => ({ value: d, label: d })),
//               ]}
//             />
//           </div>

//           <SelectField
//             label="Village" icon={ICONS.user}
//             value={form.village}
//             onChange={set("village")}
//             options={[
//               { value: "", label: form.city ? "Select village" : "Select taluk first" },
//               ...((form.district && form.city && karnatakaData.Karnataka[form.district] && karnatakaData.Karnataka[form.district][form.city]) || []).map((v) => ({ value: v, label: v })),
//             ]}
//           />

//           <div className="flex gap-2 mt-2">
//             <button type="button" onClick={handleUseCurrentLocation} disabled={locLoading}
//               className="px-3 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700">
//               {locLoading ? 'Detecting…' : 'Use current location'}
//             </button>
//             <button type="button" onClick={handleGeocodeAddress} disabled={locLoading || !form.village}
//               className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold border">
//               {locLoading ? 'Resolving…' : 'Resolve from address'}
//             </button>
//           </div>
//           {locError && <p className="text-xs text-rose-500 mt-2">{locError}</p>}

//           <Field label="State" icon={ICONS.calendar} placeholder="Karnataka"
//             value={form.state} onChange={set("state")} error={errors.state} />
//         </div>
//       )}

//       {/* ── Step 1: Medical — identical to original ── */}
//       {step === 1 && (
//         <div className="space-y-4">
//           <SelectField
//             label="Blood Group" icon={ICONS.droplet}
//             value={form.bloodGroup} onChange={set("bloodGroup")}
//             options={[
//               { value: "", label: "Select blood group" },
//               ...["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"].map((g) => ({ value: g, label: g })),
//             ]}
//           />
//           <Field label="Birth Date" type="date" icon={ICONS.calendar}
//             value={form.birthDate} onChange={set("birthDate")} error={errors.birthDate} />

//           {form.role === "donor" && (
//             <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3">
//               <p className="text-xs font-bold text-cyan-700 mb-1">Donation Eligibility</p>
//               <p className="text-xs text-cyan-600 leading-relaxed">
//                 You must be 18–65 years old, weigh ≥ 50 kg, and be in good health.
//                 A nurse will confirm eligibility before each donation.
//               </p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── Step 2: Verify / Review — identical to original ── */}
//       {step === 2 && (
//         <div className="space-y-5">
//           <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
//             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Review Your Details</p>
//             {[
//               { label: "Name",          val: form.name },
//               { label: "Email",         val: form.email },
//               { label: "Phone",         val: form.phone },
//               { label: "City",          val: form.city || "—" },
//               { label: "Village",       val: form.village || "—" },
//               { label: "District",      val: form.district || "—" },
//               { label: "State",         val: form.state || "—" },
//               { label: "Role",          val: form.role === "donor" ? "Blood Donor" : "Hospital Partner" },
//               { label: "Blood Group",   val: form.bloodGroup || "—" },
//               { label: "Birth Date",    val: form.birthDate || "—" },
//             ].map((r) => (
//               <div key={r.label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
//                 <span className="text-xs text-slate-400">{r.label}</span>
//                 <span className="text-xs font-bold text-slate-700 text-right">{r.val}</span>
//               </div>
//             ))}
//           </div>

//           <label className="flex items-start gap-3 cursor-pointer">
//             <div
//               className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
//                 form.agree ? "bg-cyan-600 border-cyan-600" : "border-slate-300"
//               }`}
//               onClick={() => setForm((f) => ({ ...f, agree: !f.agree }))}
//             >
//               {form.agree && <Icon path={ICONS.check} size={11} className="text-white" />}
//             </div>
//             <span className="text-xs text-slate-500 leading-relaxed">
//               I agree to BloodConnect's{" "}
//               <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">Terms of Service</span>
//               {" "}and{" "}
//               <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span>,
//               and consent to my health data being used for donor-matching purposes only.
//             </span>
//           </label>
//           {errors.agree && (
//             <p className="flex items-center gap-1.5 text-xs text-rose-500 font-medium -mt-2">
//               <Icon path={ICONS.alertCircle} size={11} /> {errors.agree}
//             </p>
//           )}
//         </div>
//       )}

//       {/* Navigation — identical markup to original */}
//       <div className="flex gap-3 mt-7">
//         {step > 0 && (
//           <button type="button" onClick={() => setStep((s) => s - 1)}
//             className="flex items-center gap-2 text-sm font-bold text-slate-600 border-2 border-slate-200 px-5 py-3 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all">
//             <Icon path="M15 18l-6-6 6-6" size={16} /> Back
//           </button>
//         )}
//         <button type="button" onClick={next} disabled={loading}
//           className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 py-3 rounded-xl hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed">
//           {loading ? (
//             <>
//               <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
//                 <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
//               </svg>
//               Saving…
//             </>
//           ) : step < PROFILE_STEPS.length - 1 ? (
//             <>Continue <Icon path={ICONS.chevronR} size={16} /></>
//           ) : (
//             <>Complete Profile <Icon path={ICONS.check} size={16} /></>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }

// ─────────────────────────────────────────────────────────────────────────────
// ROOT ORCHESTRATOR
//
// Routing decision tree:
//   isLoggedIn && !isProfileComplete  →  ProfileCompletionForm
//   isLoggedIn &&  isProfileComplete  →  (your <Navigate to="/dashboard" /> in the router)
//   !isLoggedIn                       →  Login / Register toggle
// ─────────────────────────────────────────────────────────────────────────────
export default function AuthPages() {
  const authState = useSelector((s) => s.auth);
  // Expected shape: { isLoggedIn: bool, isProfileComplete: bool, user: {...} }

  // If user is logged in but profile not complete, redirect to the
  // standalone complete-profile route instead of rendering it inside the auth box.

  const [mode, setMode] = useState("login");
  const toggle = () => setMode((m) => (m === "login" ? "register" : "login"));

  // If logged in but profile not complete — navigate to the standalone page
  if (authState.isLoggedIn && !authState.isProfileComplete) {
    return <Navigate to="/auth/completeProfile" replace />;
  }

  // ── Default: not logged in — show Login or Register ───────────────────────
  return (
    <div
      className="min-h-screen bg-slate-100 flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)", backgroundSize: "24px 24px" }}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-300/40 overflow-hidden grid lg:grid-cols-2 min-h-[600px]"
        style={{ animation: "fadeIn .5s ease" }}
      >
        <LeftPanel mode={mode} />
        <div className="overflow-y-auto max-h-screen lg:max-h-[90vh] scrollbar-hide">
          {mode === "login"
            ? <LoginForm    key="login"    onSwitch={toggle} />
            : <RegisterForm key="register" onSwitch={toggle} />
          }
        </div>
      </div>
      <GlobalStyles />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES — extracted to avoid duplication across render branches
// ─────────────────────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-6px); }
      }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
  );
}
