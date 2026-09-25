import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  MapContainer, TileLayer, Marker, Popup,
  Circle, useMapEvents, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { completeProfile as completeProfileAction } from "../features/auth/authSlice";
import {
  fetchProfile as apiFetchProfile,
  completeProfile as apiCompleteProfile,
  getProfile,
  updateProfile,
} from "../features/profile/profileAPI";
import karnatakaData from "../assets/karnataka_data.json";

// ── Fix Leaflet default icon URLs ─────────────────────────────────────────────
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
  user:          "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  mail:          "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  phone:         "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  droplet:       "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  mapPin:        "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  map:           "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15",
  calendar:      "M3 4h18M16 2v4M8 2v4M3 10h18M5 4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5z",
  edit:          "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  check:         "M20 6L9 17l-5-5",
  x:             "M18 6L6 18M6 6l12 12",
  chevronR:      "M9 18l6-6-6-6",
  alertCircle:   "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
  alertTriangle: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  target:        "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-6zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  shield:        "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  refresh:       "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  save:          "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  activity:      "M22 12h-4l-3 9L9 3l-3 9H2",
  eye:           "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  lock:          "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
};

// ─────────────────────────────────────────────────────────────────────────────
// BLOOD GROUP HELPERS — same enum mapping as ProfileCompletionForm
// ─────────────────────────────────────────────────────────────────────────────
const BLOOD_GROUP_MAP = {
  A_POS: "A+", A_NEG: "A−",
  B_POS: "B+", B_NEG: "B−",
  O_POS: "O+", O_NEG: "O−",
  AB_POS: "AB+", AB_NEG: "AB−",
};
const BLOOD_GROUP_REVERSE = Object.fromEntries(
  Object.entries(BLOOD_GROUP_MAP).map(([k, v]) => [v, k])
);
const displayBlood  = (v) => BLOOD_GROUP_MAP[v] ?? v ?? "—";
const encodeBlood   = (v) => BLOOD_GROUP_REVERSE[v] ?? v;

// ─────────────────────────────────────────────────────────────────────────────
// NOMINATIM — identical 3-tier resolution from ProfileCompletionForm
// ─────────────────────────────────────────────────────────────────────────────
const NOMINATIM_DELAY = 500;

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

async function resolveLocation({ village, city, district, state = "Karnataka" }) {
  // Tier 1 — exact
  const exactQuery = [village, city, district, state, "India"].filter(Boolean).join(", ");
  const exact = await nominatimSearch(exactQuery);
  if (exact) {
    return {
      lat: parseFloat(exact.lat), lng: parseFloat(exact.lon),
      precision: "exact", circleRadius: 0,
    };
  }
  // Tier 2 — village + district
  const fallbackQuery = [village, district, state, "India"].filter(Boolean).join(", ");
  const fallback = await nominatimSearch(fallbackQuery);
  if (fallback) {
    const type = fallback.type || fallback.class || "";
    const circleRadius = type === "village" ? 1000 : type === "town" ? 3000 : 5000;
    return {
      lat: parseFloat(fallback.lat), lng: parseFloat(fallback.lon),
      precision: "approximate", circleRadius,
    };
  }
  // Tier 3 — district only
  const districtQuery = [district, state, "India"].filter(Boolean).join(", ");
  const dist = await nominatimSearch(districtQuery);
  if (dist) {
    return {
      lat: parseFloat(dist.lat), lng: parseFloat(dist.lon),
      precision: "approximate", circleRadius: 8000,
    };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom]);
  return null;
}

function MapClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP PICKER MODAL — identical pattern as ProfileCompletionForm
// ─────────────────────────────────────────────────────────────────────────────
function MapPickerModal({ initialLat, initialLng, onConfirm, onClose }) {
  const DEFAULT = { lat: 15.3173, lng: 75.7139 };
  const [picked, setPicked] = useState(
    initialLat ? { lat: initialLat, lng: initialLng } : null
  );
  const center = picked ? [picked.lat, picked.lng] : [DEFAULT.lat, DEFAULT.lng];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
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
        <div className="relative" style={{ height: 460 }}>
          <MapContainer center={center} zoom={picked ? 14 : 7}
            style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onPick={(coords) => setPicked(coords)} />
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
// LOCATION PREVIEW — identical to ProfileCompletionForm
// ─────────────────────────────────────────────────────────────────────────────
function LocationPreview({ lat, lng, precision, circleRadius, onChangePinClick }) {
  const center    = [lat, lng];
  const isExact   = precision === "exact" || precision === "manual";
  const isApprox  = precision === "approximate";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            precision === "manual"
              ? "text-cyan-700 bg-cyan-50 border-cyan-200"
              : isExact
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-amber-700 bg-amber-50 border-amber-200"
          }`}>
            <Icon path={precision === "manual" ? ICONS.mapPin : isExact ? ICONS.target : ICONS.alertTriangle} size={10} />
            {precision === "manual" ? "Manual pin" : isExact ? "Exact location" : "Approximate area"}
          </span>
          <span className="text-xs text-slate-500 font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
        {onChangePinClick && (
          <button type="button" onClick={onChangePinClick}
            className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 underline underline-offset-2 flex items-center gap-1">
            <Icon path={ICONS.mapPin} size={10} /> Change pin
          </button>
        )}
      </div>

      {isApprox && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Icon path={ICONS.alertTriangle} size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">Approximate location</span> — your exact village wasn't found.
            The shaded area shows the estimated zone (~{Math.round(circleRadius / 1000)} km radius).{" "}
            {onChangePinClick && (
              <button type="button" onClick={onChangePinClick}
                className="underline font-bold hover:text-amber-800">Pin your exact location</button>
            )}.
          </p>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 240, pointerEvents: "none" }}>
        <MapContainer center={center} zoom={isExact ? 14 : 11}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false} dragging={false} scrollWheelZoom={false}
          doubleClickZoom={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {isExact  && <Marker position={center} />}
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
// SHARED FIELD ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, type = "text", icon, placeholder, value, onChange, error, hint, readOnly }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200
        ${readOnly ? "bg-slate-50 border-slate-100 cursor-not-allowed" : ""}
        ${error ? "border-rose-400 bg-rose-50/30" : !readOnly ? "border-slate-200 hover:border-slate-300 focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100" : ""}
      `}>
        {icon && <div className="pl-3.5 shrink-0"><Icon path={icon} size={15} className="text-slate-400" /></div>}
        <input
          type={type} placeholder={placeholder} value={value ?? ""}
          onChange={onChange} readOnly={readOnly}
          className={`flex-1 px-3 py-2.5 text-sm bg-transparent outline-none font-medium
            ${readOnly ? "text-slate-500 cursor-not-allowed" : "text-slate-800 placeholder-slate-300"}`}
        />
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

function SelectField({ label, icon, options, value, onChange, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200
        focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100
        ${error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}
      `}>
        {icon && <div className="pl-3.5 shrink-0"><Icon path={icon} size={15} className="text-slate-400" /></div>}
        <select value={value ?? ""} onChange={onChange}
          className="flex-1 px-3 py-2.5 text-sm text-slate-800 bg-transparent outline-none font-medium appearance-none cursor-pointer">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="pr-3.5"><Icon path={ICONS.chevronR} size={13} className="text-slate-400 rotate-90" /></div>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
          <Icon path={ICONS.alertCircle} size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY STAT TILE
// ─────────────────────────────────────────────────────────────────────────────
function StatTile({ icon, label, value, accent = "cyan" }) {
  const accentMap = {
    cyan:   "bg-cyan-50 text-cyan-700 border-cyan-100",
    red:    "bg-red-50 text-red-700 border-red-100",
    green:  "bg-green-50 text-green-700 border-green-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    amber:  "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${accentMap[accent]}`}>
      <Icon path={icon} size={18} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
        <p className="text-sm font-extrabold truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  const styles = {
    success: "bg-emerald-600",
    error:   "bg-red-600",
    info:    "bg-cyan-600",
  };
  return (
    <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-2xl text-sm font-semibold min-w-64 ${styles[type] || "bg-slate-700"}`}
      style={{ animation: "slideIn .25s ease" }}>
      <Icon path={type === "success" ? ICONS.check : ICONS.alertCircle} size={16} />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100">
        <Icon path={ICONS.x} size={15} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOOD GROUP BADGE
// ─────────────────────────────────────────────────────────────────────────────
function BloodBadge({ raw }) {
  const label = displayBlood(raw);
  return (
    <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-sm font-extrabold">
      <Icon path={ICONS.droplet} size={13} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name, size = "lg" }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const sz = size === "lg" ? "w-20 h-20 text-2xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-white font-extrabold flex items-center justify-center shadow-lg shadow-cyan-200`}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — ProfilePage
// ─────────────────────────────────────────────────────────────────────────────
const KA = karnatakaData?.Karnataka ?? karnatakaData ?? {};
const BLOOD_GROUPS_UI = ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"];

export default function ProfilePage() {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth.user);

  // ── page-level state ──────────────────────────────────────────────────────
  const [profile, setProfile]     = useState(null);       // raw API data
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast]         = useState(null);       // { message, type }

  // ── edit-form state ───────────────────────────────────────────────────────
  const EMPTY_FORM = {
    name: "", phone: "", email: "",
    district: "", city: "", village: "", state: "Karnataka",
    bloodGroup: "", birthDate: "",
    lat: null, lng: null, precision: null, circleRadius: 0,
  };
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState("");
  const [showMap, setShowMap]   = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]     = useState("");

  // ── dropdown options derived from karnatakaData ───────────────────────────
  const districtOptions = Object.keys(KA);
  const talukOptions    = form.district ? Object.keys(KA[form.district] ?? {}) : [];
  const villageOptions  = form.district && form.city ? (KA[form.district]?.[form.city] ?? []) : [];

  // ── fetch profile — uses role-aware apiFetchProfile from profileAPI ─────────
  const fetchProfile = useCallback(async () => {
  setPageLoading(true);
  setPageError("");

  try {
    const res = await apiFetchProfile();

    console.log("Data:", res.data);

    const data = res?.data?.data ?? res?.data ?? res;

    setProfile(data);
  } catch (err) {
    console.error(err);

    setPageError(
      err?.response?.data?.message ??
      err?.message ??
      "Failed to load profile"
    );
  } finally {
    setPageLoading(false);
  }
}, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── populate form when entering edit mode ─────────────────────────────────
  const enterEdit = () => {
    if (!profile) return;
    setForm({
      name:       profile.name       ?? "",
      phone:      profile.phone      ?? "",
      email:      profile.email      ?? "",
      district:   profile.district   ?? "",
      city:       profile.city       ?? "",
      village:    profile.village    ?? "",
      state:      profile.state      ?? "Karnataka",
      bloodGroup: displayBlood(profile.bloodGroup),
      birthDate:  profile.birthDate  ?? "",
      lat:        profile.lat        ?? null,
      lng:        profile.lng        ?? null,
      // Existing saved coords are treated as "exact" for display
      precision:  (profile.lat && profile.lng) ? "exact" : null,
      circleRadius: 0,
    });
    setErrors({});
    setApiError("");
    setGeoError("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    setApiError("");
    setGeoError("");
  };

  // ── field setters ─────────────────────────────────────────────────────────
  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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

  // ── auto-resolve location when village changes (mirrors ProfileCompletion) ─
  useEffect(() => {
    if (!isEditing) return;
    if (!form.village || !form.city || !form.district) return;

    setGeoError("");
    setForm((f) => ({ ...f, lat: null, lng: null, precision: null, circleRadius: 0 }));

    let cancelled = false;
    setGeoLoading(true);

    resolveLocation({
      village: form.village, city: form.city,
      district: form.district, state: form.state,
    }).then((result) => {
      if (cancelled) return;
      if (result) {
        setForm((f) => ({
          ...f,
          lat: result.lat, lng: result.lng,
          precision: result.precision, circleRadius: result.circleRadius,
        }));
      } else {
        setGeoError("Could not auto-resolve location. Please pin it manually.");
      }
    }).catch(() => {
      if (!cancelled) setGeoError("Location lookup failed. Please pin manually.");
    }).finally(() => {
      if (!cancelled) setGeoLoading(false);
    });

    return () => { cancelled = true; };
  }, [form.village, isEditing]);

  // ── manual map confirm ────────────────────────────────────────────────────
  const handleMapConfirm = (coords) => {
    setForm((f) => ({
      ...f,
      lat: coords.lat, lng: coords.lng,
      precision: "manual", circleRadius: 0,
    }));
    setGeoError("");
    setShowMap(false);
  };

  // ── validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())                              e.name       = "Name is required";
    if (!form.phone || form.phone.length < 10)          e.phone      = "Valid 10-digit phone required";
    if (!form.district)                                 e.district   = "District is required";
    if (!form.city)                                     e.city       = "City / Taluk is required";
    if (!form.village)                                  e.village    = "Village is required";
    if (!form.bloodGroup)                               e.bloodGroup = "Select a blood group";
    if (!form.birthDate)                                e.birthDate  = "Date of birth is required";
    return e;
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setApiError("");
    setSaving(true);

    try {
      const token = authUser?.token ?? localStorage.getItem("token");

      const payload = {
        name:       form.name,
        phone:      form.phone,
        city:       form.city,
        district:   form.district,
        state:      form.state,
        village:    form.village,
        bloodGroup: encodeBlood(form.bloodGroup),
        birthDate:  form.birthDate,
        // Only include coordinates when they were resolved/pinned in this session
        ...(form.lat != null && form.lng != null
          ? { lat: form.lat, lon: form.lng }
          : {}),
      };

      // Uses POST /Profile/CompleteProfile — the existing update endpoint
      await updateProfile(payload, token);

      // Mirror into Redux so navbar / header reflect the new name immediately
      dispatch(completeProfileAction({ ...payload, lng: payload.lon, email: form.email }));

      // Re-fetch so the view card shows server-confirmed values
      await fetchProfile();

      setIsEditing(false);
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to update profile";
      setApiError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center animate-pulse">
            <Icon path={ICONS.user} size={24} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Icon path={ICONS.alertCircle} size={22} className="text-red-500" />
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-2">Could not load profile</h2>
          <p className="text-sm text-slate-500 mb-5">{pageError}</p>
          <button onClick={fetchProfile}
            className="flex items-center gap-2 text-sm font-bold text-white bg-cyan-600 px-5 py-2.5 rounded-xl hover:bg-cyan-700 transition-all mx-auto">
            <Icon path={ICONS.refresh} size={15} /> Try again
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW MODE
  // ─────────────────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <>
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

            {/* ── Profile header card ── */}
            <div className="relative bg-gradient-to-br from-slate-800 via-cyan-900 to-slate-900 rounded-2xl overflow-hidden p-6 sm:p-8">
              {/* Dot grid */}
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "22px 22px" }} />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <Avatar name={profile?.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-cyan-300 text-xs font-semibold uppercase tracking-widest mb-1">Blood Donor Profile</p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 truncate">
                    {profile?.name || "—"}
                  </h1>
                  <div className="flex flex-wrap gap-2 items-center">
                    <BloodBadge raw={profile?.bloodGroup} />
                    <span className="flex items-center gap-1.5 text-xs text-cyan-200 font-medium">
                      <Icon path={ICONS.mapPin} size={12} />
                      {[profile?.village, profile?.city, profile?.district].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                </div>
                <button onClick={enterEdit}
                  className="shrink-0 flex items-center gap-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 rounded-xl transition-all">
                  <Icon path={ICONS.edit} size={14} /> Edit Profile
                </button>
              </div>
            </div>

            {/* ── Quick stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile icon={ICONS.droplet}  label="Blood Group" value={displayBlood(profile?.bloodGroup)} accent="red" />
              <StatTile icon={ICONS.calendar} label="Date of Birth" value={profile?.birthDate || "—"} accent="violet" />
              <StatTile icon={ICONS.phone}    label="Phone" value={profile?.phone || "—"} accent="cyan" />
              <StatTile icon={ICONS.mail}     label="Email" value={profile?.email || "—"} accent="green" />
            </div>

            {/* ── Details + Map ── */}
            <div className="grid lg:grid-cols-2 gap-5">

              {/* Details card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon path={ICONS.user} size={16} className="text-cyan-600" />
                  <h2 className="text-sm font-bold text-slate-800">Personal Details</h2>
                </div>

                {[
                  { label: "Full Name",    icon: ICONS.user,     value: profile?.name     },
                  { label: "Email",        icon: ICONS.mail,     value: profile?.email    },
                  { label: "Phone",        icon: ICONS.phone,    value: profile?.phone    },
                  { label: "Date of Birth",icon: ICONS.calendar, value: profile?.birthDate},
                  { label: "Blood Group",  icon: ICONS.droplet,  value: displayBlood(profile?.bloodGroup) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon path={row.icon} size={13} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.label}</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{row.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Location card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon path={ICONS.mapPin} size={16} className="text-cyan-600" />
                  <h2 className="text-sm font-bold text-slate-800">Location</h2>
                </div>

                {[
                  { label: "Village",  value: profile?.village  },
                  { label: "City / Taluk", value: profile?.city },
                  { label: "District", value: profile?.district },
                  { label: "State",    value: profile?.state    },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400 font-medium">{row.label}</span>
                    <span className="text-sm font-semibold text-slate-700">{row.value || "—"}</span>
                  </div>
                ))}

                {/* Map preview — read-only */}
                {profile?.lat && profile?.lng ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 mt-2" style={{ height: 180, pointerEvents: "none" }}>
                    <MapContainer center={[profile.lat, profile.lng]} zoom={13}
                      style={{ height: "100%", width: "100%" }}
                      zoomControl={false} dragging={false} scrollWheelZoom={false}
                      doubleClickZoom={false} attributionControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[profile.lat, profile.lng]} />
                    </MapContainer>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center h-28 text-xs text-slate-400 font-medium">
                    No location pinned
                  </div>
                )}

                {/* Coords */}
                {profile?.lat && profile?.lng && (
                  <p className="text-[10px] text-slate-400 font-mono text-center">
                    {profile.lat.toFixed(5)}, {profile.lng.toFixed(5)}
                  </p>
                )}
              </div>
            </div>

            {/* Member since */}
            {profile?.createdAt && (
              <p className="text-xs text-slate-400 text-center">
                Member since{" "}
                <span className="font-semibold text-slate-600">
                  {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </p>
            )}

          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <GlobalStyles />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDIT MODE
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

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* Edit header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Edit Profile</h1>
              <p className="text-xs text-slate-400 mt-0.5">Update your personal and location details</p>
            </div>
            <button onClick={cancelEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all">
              <Icon path={ICONS.x} size={14} /> Cancel
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-7">

            {/* ── Section: Personal Info ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Icon path={ICONS.user} size={13} className="text-cyan-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Personal Information</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" icon={ICONS.user}
                  value={form.name} onChange={set("name")} error={errors.name} />
                <Field label="Email Address" type="email" icon={ICONS.mail}
                  value={form.email} readOnly
                  hint="Email cannot be changed" />
                <Field label="Mobile Number" icon={ICONS.phone}
                  value={form.phone} onChange={set("phone")} error={errors.phone} />
                <Field label="Date of Birth" type="date" icon={ICONS.calendar}
                  value={form.birthDate} onChange={set("birthDate")} error={errors.birthDate} />
                <div className="sm:col-span-2">
                  <SelectField label="Blood Group" icon={ICONS.droplet}
                    value={form.bloodGroup} onChange={set("bloodGroup")} error={errors.bloodGroup}
                    options={[
                      { value: "", label: "Select blood group" },
                      ...BLOOD_GROUPS_UI.map((g) => ({ value: g, label: g })),
                    ]} />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* ── Section: Location — identical layout to ProfileCompletionForm ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Icon path={ICONS.mapPin} size={13} className="text-cyan-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Location</h2>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* LEFT — dropdowns */}
                <div className="space-y-4">
                  <Field label="State" value={form.state} onChange={set("state")} error={errors.state} />

                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="District"
                      value={form.district} onChange={setDistrict} error={errors.district}
                      options={[
                        { value: "", label: "Select district" },
                        ...districtOptions.map((d) => ({ value: d, label: d })),
                      ]} />
                    <SelectField label="City / Taluk"
                      value={form.city} onChange={setCity} error={errors.city}
                      options={[
                        { value: "", label: "Select taluk" },
                        ...talukOptions.map((t) => ({ value: t, label: t })),
                      ]} />
                  </div>

                  <SelectField label="Village"
                    value={form.village} onChange={set("village")} error={errors.village}
                    options={[
                      { value: "", label: "Select village" },
                      ...villageOptions.map((v) => ({ value: v, label: v })),
                    ]} />

                  {/* Geo error */}
                  {geoError && (
                    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
                      <Icon path={ICONS.alertTriangle} size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700 leading-relaxed">{geoError}</p>
                    </div>
                  )}
                </div>

                {/* RIGHT — map panel (mirrors ProfileCompletion exactly) */}
                <div className="sticky top-6 h-fit">
                  <div className="rounded-xl border-2 border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Location Preview</span>
                      <button type="button" onClick={() => setShowMap(true)}
                        className="flex items-center gap-1 text-[10px] font-bold text-cyan-600 hover:text-cyan-700">
                        <Icon path={ICONS.mapPin} size={11} /> Open map
                      </button>
                    </div>

                    <div className="p-3">
                      {/* Loading skeleton */}
                      {geoLoading && (
                        <div className="h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
                          <p className="text-xs text-slate-400 font-medium">Resolving location…</p>
                        </div>
                      )}

                      {/* Map preview with location badge */}
                      {!geoLoading && form.lat && form.lng && (
                        <LocationPreview
                          lat={form.lat}
                          lng={form.lng}
                          precision={form.precision}
                          circleRadius={form.circleRadius}
                          onChangePinClick={() => setShowMap(true)}
                        />
                      )}

                      {/* No location yet */}
                      {!geoLoading && !form.lat && (
                        <div className="text-center py-10 space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
                            <Icon path={ICONS.mapPin} size={18} className="text-slate-400" />
                          </div>
                          <p className="text-xs text-slate-400">
                            Select a village to auto-resolve,<br />or pin your location manually
                          </p>
                          <button type="button" onClick={() => setShowMap(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white text-xs font-bold rounded-lg hover:bg-cyan-700 transition-all">
                            <Icon path={ICONS.map} size={13} /> Open Map
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── API error banner ── */}
            {apiError && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <Icon path={ICONS.alertCircle} size={15} className="text-rose-500 shrink-0" />
                <p className="text-xs text-rose-600 font-semibold">{apiError}</p>
              </div>
            )}

            {/* ── Action row ── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" onClick={cancelEdit}
                className="flex items-center justify-center gap-2 text-sm font-bold text-slate-600 border-2 border-slate-200 px-6 py-3 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all">
                <Icon path={ICONS.x} size={15} /> Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving || geoLoading}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 py-3 rounded-xl hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? (
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
                ) : (
                  <>
                    <Icon path={ICONS.save} size={15} /> Save Changes
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <GlobalStyles />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:none} }
      @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    `}</style>
  );
}
