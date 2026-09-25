import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { completeProfile as completeProfileAction } from "../features/auth/authSlice";
import { completeHospitalProfile, completeProfile as apiCompleteProfile } from "../features/profile/profileAPI";
import { useNavigate } from "react-router-dom";
import {
  MapContainer, TileLayer, Marker, Popup,
  Circle, useMapEvents, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import karnatakaData from "../assets/karnataka_data.json";

// ── Fix Leaflet marker icons ──────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" width={size} height={size} className={className}>
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
  building:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  calendar:    "M3 4h18M16 2v4M8 2v4M3 10h18M5 4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5z",
  alertCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
  mapPin:      "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  map:         "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15",
  x:           "M18 6L6 18M6 6l12 12",
  alertTriangle: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  target:      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  refresh:     "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION RESOLUTION — 3-tier system
// ─────────────────────────────────────────────────────────────────────────────

// precision: "exact" | "approximate" | "manual" | null
// "exact"       → village + taluq + district matched   → Marker
// "approximate" → fallback (village + district only)   → Circle
// "manual"      → user dropped a pin                   → Marker (cyan)

const NOMINATIM_DELAY = 500; // ms between requests (be polite)

async function nominatimSearch(query) {
  await new Promise((r) => setTimeout(r, NOMINATIM_DELAY));
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&countrycodes=in`;
  const res  = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "BloodConnect/1.0" },
  });
  if (!res.ok) throw new Error("Nominatim request failed");
  const data = await res.json();
  return data?.[0] ?? null;
}

// Returns { lat, lng, precision, circleRadius }
async function resolveLocation({ village, city, district, state }) {
  const s = state || "Karnataka";

  // ── Tier 1: exact — village + taluq + district ──────────────────────────
  const exactQuery = [village, city, district, s, "India"].filter(Boolean).join(", ");
  console.log("%c🔍 Tier 1 exact query:", "color:#6366f1;font-weight:bold;", exactQuery);

  const exact = await nominatimSearch(exactQuery);
  if (exact) {
    const lat = parseFloat(exact.lat);
    const lng = parseFloat(exact.lon);
    console.log("%c✅ Tier 1 EXACT match", "color:#10b981;font-weight:bold;", { lat, lng });
    return { lat, lng, precision: "exact", circleRadius: 0 };
  }

  console.warn("%c⚠️  Tier 1 failed — trying fallback", "color:#f59e0b;font-weight:bold;");

  // ── Tier 2: fallback — village + district (drop taluq) ──────────────────
  const fallbackQuery = [village, district, s, "India"].filter(Boolean).join(", ");
  console.log("%c🔍 Tier 2 fallback query:", "color:#f59e0b;font-weight:bold;", fallbackQuery);

  const fallback = await nominatimSearch(fallbackQuery);
  if (fallback) {
    const lat = parseFloat(fallback.lat);
    const lng = parseFloat(fallback.lon);

    // Determine approximate radius based on result type
    const type = fallback.type || fallback.class || "";
    let circleRadius = 2000; // default 2 km
    if (type === "village")    circleRadius = 1000;
    else if (type === "town")  circleRadius = 3000;
    else if (type === "administrative") circleRadius = 5000;

    console.log("%c🟡 Tier 2 APPROXIMATE match", "color:#f59e0b;font-weight:bold;", { lat, lng, circleRadius, type });
    return { lat, lng, precision: "approximate", circleRadius };
  }

  // ── Tier 3: district-level last resort ───────────────────────────────────
  const districtQuery = [district, s, "India"].filter(Boolean).join(", ");
  console.log("%c🔍 Tier 3 district-level query:", "color:#ef4444;font-weight:bold;", districtQuery);

  const districtResult = await nominatimSearch(districtQuery);
  if (districtResult) {
    const lat = parseFloat(districtResult.lat);
    const lng = parseFloat(districtResult.lon);
    console.log("%c🔴 Tier 3 DISTRICT-level approximate", "color:#ef4444;font-weight:bold;", { lat, lng });
    return { lat, lng, precision: "approximate", circleRadius: 8000 };
  }

  console.error("%c❌ All tiers failed", "color:#ef4444;font-weight:bold;");
  return null; // triggers manual picker prompt
}

// ─────────────────────────────────────────────────────────────────────────────
// UI ATOMS
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

function Field({ label, type = "text", icon, placeholder, value, onChange, suffix, error, hint, readOnly }) {
  const [showPass, setShowPass] = useState(false);
  const inputType = type === "password" ? (showPass ? "text" : "password") : type;
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
      <div className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200
        ${readOnly ? "bg-slate-50 border-slate-200" : ""}
        ${error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}
        ${!readOnly && !error ? "focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100" : ""}
      `}>
        {icon && <div className="pl-3.5 shrink-0"><Icon path={icon} size={16} className="text-slate-400" /></div>}
        <input type={inputType} placeholder={placeholder} value={value} onChange={onChange} readOnly={readOnly}
          className={`flex-1 px-3 py-3 text-sm text-slate-800 bg-transparent outline-none placeholder-slate-300 font-medium
            ${readOnly ? "cursor-not-allowed text-slate-500" : ""}`} />
        {type === "password" && !readOnly && (
          <button type="button" onClick={() => setShowPass(!showPass)} className="pr-3.5 shrink-0">
            <Icon path={showPass ? ICONS.eyeOff : ICONS.eye} size={16}
              className="text-slate-400 hover:text-slate-600 transition-colors" />
          </button>
        )}
        {suffix && <span className="pr-3.5 text-xs text-slate-400 font-medium shrink-0">{suffix}</span>}
      </div>
      {error && <p className="flex items-center gap-1.5 text-xs text-rose-500 font-medium"><Icon path={ICONS.alertCircle} size={11} /> {error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({ label, icon, options, value, onChange, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
      <div className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200
        focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100
        ${error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}
      `}>
        {icon && <div className="pl-3.5 shrink-0"><Icon path={icon} size={16} className="text-slate-400" /></div>}
        <select value={value} onChange={onChange}
          className="flex-1 px-3 py-3 text-sm text-slate-800 bg-transparent outline-none font-medium appearance-none cursor-pointer">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="pr-3.5"><Icon path={ICONS.chevronR} size={14} className="text-slate-400 rotate-90" /></div>
      </div>
      {error && <p className="flex items-center gap-1.5 text-xs text-rose-500 font-medium"><Icon path={ICONS.alertCircle} size={11} /> {error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Flies map to new center when coords change
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom]);
  return null;
}

// Handles click inside map
function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP PICKER MODAL  (manual override)
// ─────────────────────────────────────────────────────────────────────────────
function MapPickerModal({ initialLat, initialLng, onConfirm, onClose }) {
  const DEFAULT = { lat: 15.3173, lng: 75.7139 }; // center of Karnataka
  const [picked, setPicked] = useState(
    initialLat ? { lat: initialLat, lng: initialLng } : null
  );
  const [mapInstance, setMapInstance] = useState(null);
  useEffect(() => {
    if (!mapInstance) return;
    // Invalidate size after a short delay so tiles fill the modal correctly
    const id = setTimeout(() => {
      try { mapInstance.invalidateSize(true); } catch (err) { /* ignore */ }
    }, 150);
    return () => clearTimeout(id);
  }, [mapInstance]);
  const center = picked
    ? [picked.lat, picked.lng]
    : [DEFAULT.lat, DEFAULT.lng];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl overflow-hidden"
        style={{ animation: "fadeIn .2s ease" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Icon path={ICONS.map} size={15} className="text-cyan-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">Pin Your Location</p>
              <p className="text-xs text-slate-400">Click anywhere on the map to set your pin</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <Icon path={ICONS.x} size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Map */}
        <div className="relative" style={{ height: 500 }}>
          <MapContainer center={center} zoom={picked ? 14 : 7}
            whenCreated={setMapInstance}
            style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onPick={(coords) => {
              setPicked(coords);
              console.log(
                "%c📍 Manual pin dropped",
                "color:#10b981;font-weight:bold;",
                `\n  lat : ${coords.lat.toFixed(6)}\n  lng : ${coords.lng.toFixed(6)}`
              );
            }} />
            {picked && (
              <>
                <Marker position={[picked.lat, picked.lng]}>
                  <Popup>
                    <span className="text-xs font-semibold font-mono">
                      {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
                    </span>
                  </Popup>
                </Marker>
                <MapFlyTo center={[picked.lat, picked.lng]} zoom={15} />
              </>
            )}
          </MapContainer>

          {/* Hint overlay */}
          {!picked && (
            <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none z-10">
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 shadow-lg">
                <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Icon path={ICONS.mapPin} size={13} className="text-cyan-500" />
                  Tap anywhere on the map to drop a pin
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {picked ? (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <Icon path={ICONS.check} size={12} />
              <span className="font-mono">{picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400">No pin dropped yet</p>
          )}
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button disabled={!picked} onClick={() => onConfirm(picked)}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION PREVIEW (inline map card inside the form)
// ─────────────────────────────────────────────────────────────────────────────
function LocationPreview({ lat, lng, precision, circleRadius, onChangePinClick }) {
  const center = [lat, lng];
  const isExact   = precision === "exact"   || precision === "manual";
  const isApprox  = precision === "approximate";

  return (
    <div className="space-y-2">
      {/* Coords + badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            precision === "manual"
              ? "text-cyan-700 bg-cyan-50 border-cyan-200"
              : isExact
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-amber-700 bg-amber-50 border-amber-200"
          }`}>
            <Icon
              path={precision === "manual" ? ICONS.mapPin : isExact ? ICONS.target : ICONS.alertTriangle}
              size={10}
            />
            {precision === "manual" ? "Manual pin"
              : isExact ? "Exact location"
              : "Approximate area"}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>
        <button type="button" onClick={onChangePinClick}
          className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 underline underline-offset-2 flex items-center gap-1">
          <Icon path={ICONS.mapPin} size={10} /> Change pin
        </button>
      </div>

      {/* Approximate warning */}
      {isApprox && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Icon path={ICONS.alertTriangle} size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">Approximate location</span> — your exact village wasn't found.
            The shaded area shows the estimated zone (~{Math.round(circleRadius / 1000)} km radius).
            For better donor matching, <button type="button" onClick={onChangePinClick}
              className="underline font-bold hover:text-amber-800">pin your exact location</button>.
          </p>
        </div>
      )}

      {/* Map preview */}
      <div className="rounded-lg overflow-hidden border border-slate-200"
        style={{ height: 275, pointerEvents: "none" }}>
        <MapContainer center={center} zoom={isExact ? 14 : 11}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false} dragging={false} scrollWheelZoom={false}
          doubleClickZoom={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {isExact && <Marker position={center} />}
          {isApprox && (
            <Circle center={center} radius={circleRadius}
              pathOptions={{ color: "#f59e0b", fillColor: "#fef3c7", fillOpacity: 0.5, weight: 2 }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_STEPS = ["Account", "Medical", "Verify"];
const KA = karnatakaData?.Karnataka ?? karnatakaData ?? {};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE COMPLETION FORM
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileCompletionForm() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const authUser  = useSelector((s) => s.auth.user);
  const role      = (authUser?.role ?? localStorage.getItem('role') ?? "donor").toLowerCase();
  const isHospital = role === "hospital";
  const profileSteps = isHospital ? ["Hospital", "Verify"] : PROFILE_STEPS;

  const [step, setStep]             = useState(0);
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [apiError, setApiError]     = useState("");
  const [done, setDone]             = useState(false);
  const [showMap, setShowMap]       = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]     = useState("");  // shown when all tiers fail

  const [form, setForm] = useState({
    name:         "",
    phone:        "",
    email:        authUser?.email ?? "",
    city:         "",
    district:     "",
    village:      "",
    state:        "Karnataka",
    bloodGroup:   "",
    birthDate:    "",
    agree:        false,
    lat:          null,
    lng:          null,
    precision:    null,   // "exact" | "approximate" | "manual" | null
    circleRadius: 0,
    hospitalName:     "",
    licenseNumber:    "",
    emergencyContact: "",
    website:          "",
  });

  // ── Derived dropdown options ──────────────────────────────────────────────
  const districtOptions = Object.keys(KA);
  const talukOptions    = form.district ? Object.keys(KA[form.district] ?? {}) : [];
  const villageOptions  = form.district && form.city
    ? KA[form.district]?.[form.city] ?? [] : [];

  // ── Live console logging ──────────────────────────────────────────────────
  useEffect(() => {
    const hasAnyValue = Object.entries(form).some(([k, v]) =>
      !["agree","lat","lng","precision","circleRadius"].includes(k) && v !== "" && v !== null
    );
    if (!hasAnyValue) return;
    console.groupCollapsed("%c📝 Form updated", "color:#0891B2;font-weight:bold;");
    console.table(Object.entries(form).map(([field, value]) => ({ field, value: value ?? "—" })));
    console.groupEnd();
  }, [form]);

  // ── Auto-resolve whenever village changes (village is the last dropdown) ──
  useEffect(() => {
    if (!form.village || !form.city || !form.district) return;

    // Reset previous resolved location
    setGeoError("");
    setForm((f) => ({ ...f, lat: null, lng: null, precision: null, circleRadius: 0 }));

    let cancelled = false;
    setGeoLoading(true);

    resolveLocation({
      village:  form.village,
      city:     form.city,
      district: form.district,
      state:    form.state,
    }).then((result) => {
      if (cancelled) return;
      if (result) {
        setForm((f) => ({
          ...f,
          lat:          result.lat,
          lng:          result.lng,
          precision:    result.precision,
          circleRadius: result.circleRadius,
        }));
        console.log(
          `%c📌 Location resolved [${result.precision}]`,
          "color:#10b981;font-weight:bold;",
          { lat: result.lat, lng: result.lng, circleRadius: result.circleRadius }
        );
      } else {
        setGeoError("Could not auto-resolve your location. Please pin it manually on the map.");
      }
    }).catch((err) => {
      if (!cancelled) setGeoError("Location lookup failed. Please pin manually.");
      console.error("resolveLocation error:", err);
    }).finally(() => {
      if (!cancelled) setGeoLoading(false);
    });

    return () => { cancelled = true; };
  }, [form.village]); // only re-run when village is finally chosen

  // ── Field setters ─────────────────────────────────────────────────────────
  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const setDistrict = (e) =>
    setForm((f) => ({
      ...f, district: e.target.value,
      city: "", village: "", lat: null, lng: null, precision: null, circleRadius: 0,
    }));

  const setCity = (e) =>
    setForm((f) => ({
      ...f, city: e.target.value,
      village: "", lat: null, lng: null, precision: null, circleRadius: 0,
    }));

  // ── Manual map confirm ────────────────────────────────────────────────────
  const handleMapConfirm = (coords) => {
    console.log(
      "%c✅ Manual pin confirmed",
      "color:#10b981;font-weight:bold;",
      `\n  lat : ${coords.lat.toFixed(6)}\n  lng : ${coords.lng.toFixed(6)}`
    );
    setForm((f) => ({
      ...f,
      lat:          coords.lat,
      lng:          coords.lng,
      precision:    "manual",
      circleRadius: 0,
    }));
    setGeoError("");
    setShowMap(false);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (isHospital) {
        if (!form.hospitalName.trim())                         e.hospitalName = "Hospital name is required";
        if (!form.licenseNumber.trim())                        e.licenseNumber = "License number is required";
        if (!form.emergencyContact || form.emergencyContact.length < 10) {
          e.emergencyContact = "Valid emergency contact is required";
        }
        if (form.website && !/^https?:\/\/\S+\.\S+/.test(form.website)) e.website = "Enter a valid website URL";
      } else {
        if (!form.name.trim())                                e.name     = "Name is required";
        if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email   = "Valid email required";
        if (!form.phone || form.phone.length < 10)            e.phone   = "Valid 10-digit phone required";
        if (!form.district)                                   e.district = "District is required";
        if (!form.city)                                       e.city    = "City / Taluk is required";
        if (!form.village)                                    e.village = "Village is required";
        if (!form.state.trim())                               e.state   = "State is required";
      }
    }
    if (!isHospital && step === 1) {
      if (!form.bloodGroup) e.bloodGroup = "Select blood group";
      if (!form.birthDate)  e.birthDate  = "Date of birth required";
    }
    if (step === profileSteps.length - 1) {
      if (!form.agree) e.agree = "You must accept the terms";
    }
    return e;
  };

  // ── Navigation / submit ───────────────────────────────────────────────────
  const next = async () => {
    const e = validateStep();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setApiError("");

    if (step < profileSteps.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final submit
    setLoading(true);
    try {
      // map UI blood-group strings (e.g. "A+", "O-") to backend enum values
      const mapBloodGroup = (g) => {
        if (!g) return null;
        const normalized = g.replace('\u2212', '-').replace('−', '-').replace('+', '_POS').replace('-', '_NEG').replace(' ', '_');
        // normalize AB, A, B, O prefixes
        return normalized.replace(/[+-]/g, (m) => (m === '+' ? '_POS' : '_NEG')).replace(/\s+/g, '_').toUpperCase()
          .replace(/__/, '_');
      };

      const token = authUser?.token ?? localStorage.getItem('token');
      if (isHospital) {
        const payload = {
          hospitalName:     form.hospitalName,
          licenseNumber:    form.licenseNumber,
          emergencyContact: form.emergencyContact,
          website:          form.website,
        };
        await completeHospitalProfile(payload, token);
        dispatch(completeProfileAction({
          role: "HOSPITAL",
          hospitalName: form.hospitalName,
          hospital: form.hospitalName,
          name: form.hospitalName,
          licenseNumber: form.licenseNumber,
          emergencyContact: form.emergencyContact,
          website: form.website,
        }));
        setDone(true);
        setTimeout(() => navigate("/dashboard"), 1500);
        return;
      }

      const payload = {
        name:       form.name,
        phone:      form.phone,
        city:       form.city,
        district:   form.district,
        state:      form.state,
        bloodGroup: mapBloodGroup(form.bloodGroup),
        birthDate:  form.birthDate,
        lat:         form.lat,
        lon:         form.lng,
      };
      console.log(
        "%c🚀 Submitting payload",
        "color:#0891B2;font-weight:bold;",
        JSON.stringify({ ...payload, precision: form.precision }, null, 2)
      );
      await apiCompleteProfile(payload, token);
      dispatch(completeProfileAction({ ...form }));
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to save profile";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Done state ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8"
        style={{ animation: "fadeIn .4s ease" }}>
        <div className="w-20 h-20 rounded-full bg-cyan-50 border-2 border-cyan-200 flex items-center justify-center mb-5">
          <Icon path={ICONS.check} size={36} className="text-cyan-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Profile Complete!</h2>
        <p className="text-slate-500 text-sm mb-2">Taking you to your dashboard…</p>
        <p className="text-xs text-slate-400 mb-6">
          Welcome, <span className="font-semibold text-slate-600">{form.name || authUser?.email}</span>
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

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {showMap && (
        <MapPickerModal
          initialLat={form.lat}
          initialLng={form.lng}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMap(false)}
        />
      )}

      <div className="flex flex-col justify-center py-10 px-6 sm:px-10" style={{ animation: "fadeIn .4s ease" }}>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-1xl bg-white shadow-xl rounded-2xl border border-slate-200">
    
          <div className="flex flex-col py-10 px-6 sm:px-10">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <CrossMark size={30} />
          <span className="text-base font-extrabold text-slate-800">
            Blood<span className="text-cyan-600">Connect</span>
          </span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-px bg-cyan-500" />
          <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">
            {isHospital ? "Hospital Intake" : "New Patient Intake"}
          </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Complete Profile</h1>
          <p className="text-slate-500 text-sm">
            {isHospital ? "Add your hospital verification details" : "Join the BloodConnect hospital network"}
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {profileSteps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
                  i < step ? "bg-cyan-600 border-cyan-600 text-white"
                  : i === step ? "bg-white border-cyan-600 text-cyan-700"
                  : "bg-white border-slate-200 text-slate-400"
                }`}>
                  {i < step ? <Icon path={ICONS.check} size={13} /> : i + 1}
                </div>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-wide ${i <= step ? "text-cyan-600" : "text-slate-400"}`}>{s}</span>
              </div>
              {i < profileSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${i < step ? "bg-cyan-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0 ── */}
        {step === 0 && isHospital && (
          <div className="space-y-4">
            <Field label="Hospital Name" icon={ICONS.building}
              placeholder="Apollo Hospital"
              value={form.hospitalName} onChange={set("hospitalName")} error={errors.hospitalName} />

            <Field label="License Number" icon={ICONS.shield}
              placeholder="LIC123456"
              value={form.licenseNumber} onChange={set("licenseNumber")} error={errors.licenseNumber} />

            <Field label="Emergency Contact" icon={ICONS.phone}
              placeholder="9876543210"
              value={form.emergencyContact} onChange={set("emergencyContact")} error={errors.emergencyContact} />

            <Field label="Website" icon={ICONS.mail}
              placeholder="https://apollo.com"
              value={form.website} onChange={set("website")} error={errors.website}
              hint="Use the full URL, including https://" />
          </div>
        )}

        {step === 0 && !isHospital && (
  <div className="grid lg:grid-cols-2 gap-6">

    {/* LEFT SIDE — FORM */}
    <div className="space-y-4">
      <Field label="Full Name" icon={ICONS.user}
        value={form.name} onChange={set("name")} error={errors.name} />

      <Field label="Email Address" type="email" icon={ICONS.mail}
        value={form.email} onChange={set("email")} error={errors.email}
        readOnly={!!authUser?.email} />

      <Field label="Mobile Number" icon={ICONS.phone}
        value={form.phone} onChange={set("phone")} error={errors.phone} />

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="District"
          value={form.district} onChange={setDistrict} error={errors.district}
          options={[{ value: "", label: "Select district" }, ...districtOptions.map(d => ({ value: d, label: d }))]} />

        <SelectField label="City / Taluk"
          value={form.city} onChange={setCity} error={errors.city}
          options={[{ value: "", label: "Select taluk" }, ...talukOptions.map(t => ({ value: t, label: t }))]} />
      </div>

      <SelectField label="Village"
        value={form.village} onChange={set("village")} error={errors.village}
        options={[{ value: "", label: "Select village" }, ...villageOptions.map(v => ({ value: v, label: v }))]} />

      <Field label="State"
        value={form.state} onChange={set("state")} error={errors.state} />
    </div>

    {/* RIGHT SIDE — MAP PANEL */}
    <div className="sticky top-6 h-fit">
      <div className="rounded-xl border-2 border-slate-200 overflow-hidden">

        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-600">Location Preview</span>
        </div>

        <div className="p-3">

          {/* loading */}
          {geoLoading && (
            <div className="h-48 bg-slate-100 animate-pulse rounded-lg" />
          )}

          {/* map */}
          {!geoLoading && form.lat && (
            <LocationPreview
              lat={form.lat}
              lng={form.lng}
              precision={form.precision}
              circleRadius={form.circleRadius}
              onChangePinClick={() => setShowMap(true)}
            />
          )}

          {/* fallback */}
          {!geoLoading && !form.lat && (
            <div className="text-center py-10 space-y-3">
              <p className="text-xs text-slate-400">
                Select village or pin manually
              </p>
              <button
                onClick={() => setShowMap(true)}
                className="px-3 py-2 bg-cyan-600 text-white text-xs rounded-lg"
              >
                Open Map
              </button>
            </div>
          )}

        </div>
      </div>
    </div>

  </div>
)}

        {/* ── Step 1: Medical ── */}
        {!isHospital && step === 1 && (
          <div className="space-y-4">
            <SelectField label="Blood Group" icon={ICONS.droplet}
              value={form.bloodGroup} onChange={set("bloodGroup")} error={errors.bloodGroup}
              options={[
                { value: "", label: "Select blood group" },
                ...["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"].map((g) => ({ value: g, label: g })),
              ]} />
            <Field label="Date of Birth" type="date" icon={ICONS.calendar}
              value={form.birthDate} onChange={set("birthDate")} error={errors.birthDate} />
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-cyan-700 mb-1">Donation Eligibility</p>
              <p className="text-xs text-cyan-600 leading-relaxed">
                You must be 18–65 years old, weigh ≥ 50 kg, and be in good health.
                A nurse will confirm eligibility before each donation.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === profileSteps.length - 1 && (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Review Your Details</p>
              {(isHospital ? [
                { label: "Hospital Name",     val: form.hospitalName     || "-" },
                { label: "License Number",    val: form.licenseNumber    || "-" },
                { label: "Emergency Contact", val: form.emergencyContact || "-" },
                { label: "Website",           val: form.website          || "-" },
              ] : [
                { label: "Name",         val: form.name       || "—" },
                { label: "Email",        val: form.email      || "—" },
                { label: "Phone",        val: form.phone      || "—" },
                { label: "District",     val: form.district   || "—" },
                { label: "City / Taluk", val: form.city       || "—" },
                { label: "Village",      val: form.village    || "—" },
                { label: "State",        val: form.state      || "—" },
                { label: "Blood Group",  val: form.bloodGroup || "—" },
                { label: "Birth Date",   val: form.birthDate  || "—" },
                {
                  label: "Location",
                  val: form.lat
                    ? `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)} (${form.precision})`
                    : "Not resolved",
                },
              ]).map((r) => (
                <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-xs text-slate-400">{r.label}</span>
                  <span className="text-xs font-bold text-slate-700 text-right max-w-[60%] truncate">{r.val}</span>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <div
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                  form.agree ? "bg-cyan-600 border-cyan-600" : "border-slate-300"
                }`}
                onClick={() => setForm((f) => ({ ...f, agree: !f.agree }))}
              >
                {form.agree && <Icon path={ICONS.check} size={11} className="text-white" />}
              </div>
              <span className="text-xs text-slate-500 leading-relaxed">
                I agree to BloodConnect's{" "}
                <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">Terms of Service</span>
                {" "}and{" "}
                <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span>,
                and consent to my health data being used for donor-matching purposes only.
              </span>
            </label>
            {errors.agree && (
              <p className="flex items-center gap-1.5 text-xs text-rose-500 font-medium -mt-2">
                <Icon path={ICONS.alertCircle} size={11} /> {errors.agree}
              </p>
            )}
            {apiError && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <Icon path={ICONS.alertCircle} size={15} className="text-rose-500 shrink-0" />
                <p className="text-xs text-rose-600 font-semibold">{apiError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-7">
          {step > 0 && (
            <button type="button" onClick={() => { setStep((s) => s - 1); setApiError(""); }}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 border-2 border-slate-200 px-5 py-3 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all">
              <Icon path="M15 18l-6-6 6-6" size={16} /> Back
            </button>
          )}
          <button type="button" onClick={next} disabled={loading || geoLoading}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 py-3 rounded-xl hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : geoLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Resolving location…
              </>
            ) : step < profileSteps.length - 1 ? (
              <>Continue <Icon path={ICONS.chevronR} size={16} /></>
            ) : (
              <>Complete Profile <Icon path={ICONS.check} size={16} /></>
            )}
          </button>
        </div>
        </div>
        </div>
        </div>
      </div>
    </>
  );


}
