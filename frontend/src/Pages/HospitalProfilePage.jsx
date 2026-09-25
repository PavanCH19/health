import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { completeProfile as completeProfileAction } from "../features/auth/authSlice";
import { getHospitalProfile, updateHospitalProfile } from "../features/profile/profileAPI";
import karnatakaData from "../assets/karnataka_data.json";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const Icon = ({ path, size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" width={size} height={size} className={className}>
    <path d={path} />
  </svg>
);

const ICONS = {
  building: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  map: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  chevronR: "M9 18l6-6-6-6",
  alertCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01",
  alertTriangle: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-6zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20",
  id: "M10 13a5 5 0 0 0-5 5M14 13a5 5 0 0 1 5 5M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4z",
};

const KA = karnatakaData?.Karnataka ?? karnatakaData ?? {};
const DEFAULT_CENTER = { lat: 15.3173, lng: 75.7139 };
const NOMINATIM_DELAY = 500;

const getLng = (data) => data?.lng ?? data?.lon ?? data?.longitude ?? null;
const getLat = (data) => data?.lat ?? data?.latitude ?? null;
const dash = (value) => value || "-";

async function nominatimSearch(query) {
  await new Promise((resolve) => setTimeout(resolve, NOMINATIM_DELAY));
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&countrycodes=in`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "BloodConnect/1.0" },
  });
  if (!res.ok) throw new Error("Nominatim request failed");
  const data = await res.json();
  return data?.[0] ?? null;
}

async function resolveLocation({ addressLine, village, city, district, state = "Karnataka" }) {
  const queries = [
    [addressLine, village, city, district, state, "India"],
    [village, city, district, state, "India"],
    [city, district, state, "India"],
    [district, state, "India"],
  ].map((parts) => parts.filter(Boolean).join(", "));

  for (const query of queries) {
    if (!query) continue;
    const result = await nominatimSearch(query);
    if (result) {
      const broad = query === queries[2];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        precision: broad ? "approximate" : "exact",
        circleRadius: broad ? 8000 : 0,
      };
    }
  }

  return null;
}

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, map, zoom]);
  return null;
}

function MapClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function MapPickerModal({ initialLat, initialLng, onConfirm, onClose }) {
  const [picked, setPicked] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const center = picked ? [picked.lat, picked.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
        style={{ animation: "fadeIn .2s ease" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Icon path={ICONS.map} size={15} className="text-cyan-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">Pin Hospital Location</p>
              <p className="text-xs text-slate-400">Click anywhere on the map to set your pin</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <Icon path={ICONS.x} size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="relative" style={{ height: 460 }}>
          <MapContainer center={center} zoom={picked ? 14 : 7} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onPick={(coords) => setPicked(coords)} />
            {picked && (
              <>
                <Marker position={[picked.lat, picked.lng]}>
                  <Popup><span className="text-xs font-semibold font-mono">{picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}</span></Popup>
                </Marker>
                <MapFlyTo center={[picked.lat, picked.lng]} zoom={15} />
              </>
            )}
          </MapContainer>
        </div>

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

function LocationPreview({ lat, lng, precision, circleRadius, onChangePinClick }) {
  const center = [lat, lng];
  const isApprox = precision === "approximate";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            precision === "manual"
              ? "text-cyan-700 bg-cyan-50 border-cyan-200"
              : isApprox
              ? "text-amber-700 bg-amber-50 border-amber-200"
              : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}>
            <Icon path={precision === "manual" ? ICONS.mapPin : isApprox ? ICONS.alertTriangle : ICONS.target} size={10} />
            {precision === "manual" ? "Manual pin" : isApprox ? "Approximate area" : "Exact location"}
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
          <p className="text-xs text-amber-700 leading-relaxed">This is an approximate area. Drop a manual pin for accurate donor matching.</p>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 240, pointerEvents: "none" }}>
        <MapContainer center={center} zoom={isApprox ? 11 : 14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false} dragging={false} scrollWheelZoom={false}
          doubleClickZoom={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {!isApprox && <Marker position={center} />}
          {isApprox && (
            <Circle center={center} radius={circleRadius}
              pathOptions={{ color: "#f59e0b", fillColor: "#fef3c7", fillOpacity: 0.5, weight: 2 }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

function Field({ label, type = "text", icon, placeholder, value, onChange, error, hint, readOnly }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200
        ${readOnly ? "bg-slate-50 border-slate-100 cursor-not-allowed" : ""}
        ${error ? "border-rose-400 bg-rose-50/30" : !readOnly ? "border-slate-200 hover:border-slate-300 focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100" : ""}
      `}>
        {icon && <div className="pl-3.5 shrink-0"><Icon path={icon} size={15} className="text-slate-400" /></div>}
        <input type={type} placeholder={placeholder} value={value ?? ""} onChange={onChange} readOnly={readOnly}
          className={`flex-1 px-3 py-2.5 text-sm bg-transparent outline-none font-medium ${readOnly ? "text-slate-500 cursor-not-allowed" : "text-slate-800 placeholder-slate-300"}`} />
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
      <div className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200 focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100 ${error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}`}>
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

function TextAreaField({ label, icon, value, onChange, error, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className={`relative flex rounded-xl border-2 bg-white transition-all duration-200 ${error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300 focus-within:border-cyan-500 focus-within:shadow-sm focus-within:shadow-cyan-100"}`}>
        {icon && <div className="pl-3.5 pt-3 shrink-0"><Icon path={icon} size={15} className="text-slate-400" /></div>}
        <textarea rows={3} placeholder={placeholder} value={value ?? ""} onChange={onChange}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none font-medium text-slate-800 placeholder-slate-300 resize-none" />
      </div>
      {error && <p className="flex items-center gap-1.5 text-xs text-rose-500 font-medium"><Icon path={ICONS.alertCircle} size={11} /> {error}</p>}
    </div>
  );
}

function StatTile({ icon, label, value, accent = "cyan" }) {
  const accentMap = {
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    green: "bg-green-50 text-green-700 border-green-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${accentMap[accent]}`}>
      <Icon path={icon} size={18} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
        <p className="text-sm font-extrabold truncate">{dash(value)}</p>
      </div>
    </div>
  );
}

function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  const styles = { success: "bg-emerald-600", error: "bg-red-600", info: "bg-cyan-600" };
  return (
    <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-2xl text-sm font-semibold min-w-64 ${styles[type] || "bg-slate-700"}`}
      style={{ animation: "slideIn .25s ease" }}>
      <Icon path={type === "success" ? ICONS.check : ICONS.alertCircle} size={16} />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100"><Icon path={ICONS.x} size={15} /></button>
    </div>
  );
}

function Avatar({ name, size = "lg" }) {
  const initials = (name || "?").split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const sz = size === "lg" ? "w-20 h-20 text-2xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-white font-extrabold flex items-center justify-center shadow-lg shadow-cyan-200`}>
      {initials}
    </div>
  );
}

export default function HospitalProfilePage() {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth.user);
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [form, setForm] = useState({
    hospitalName: "",
    licenseNumber: "",
    emergencyContact: "",
    website: "",
    addressLine: "",
    village: "",
    district: "",
    city: "",
    state: "Karnataka",
    lat: null,
    lng: null,
    precision: null,
    circleRadius: 0,
  });

  const districtOptions = Object.keys(KA);
  const cityOptions = form.district ? Object.keys(KA[form.district] ?? {}) : [];
  const villageOptions = form.district && form.city ? (KA[form.district]?.[form.city] ?? []) : [];

  const fetchProfile = useCallback(async () => {
    setPageLoading(true);
    setPageError("");
    try {
      const token = authUser?.token ?? localStorage.getItem("token");
      const res = await getHospitalProfile(token);
      const data = res?.data?.data ?? res?.data ?? {};
      setProfile(data);
    } catch (err) {
      setPageError(err?.response?.data?.message ?? err?.message ?? "Failed to load hospital profile");
    } finally {
      setPageLoading(false);
    }
  }, [authUser?.token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const enterEdit = () => {
    if (!profile) return;
    const lat = getLat(profile);
    const lng = getLng(profile);
    setForm({
      hospitalName: profile.hospitalName ?? "",
      licenseNumber: profile.licenseNumber ?? "",
      emergencyContact: profile.emergencyContact ?? "",
      website: profile.website ?? "",
      addressLine: profile.addressLine ?? "",
      village: profile.village ?? "",
      district: profile.district ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "Karnataka",
      lat,
      lng,
      precision: lat && lng ? "exact" : null,
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

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setDistrict = (e) => setForm((f) => ({ ...f, district: e.target.value, city: "", village: "", lat: null, lng: null, precision: null, circleRadius: 0 }));
  const setCity = (e) => setForm((f) => ({ ...f, city: e.target.value, village: "", lat: null, lng: null, precision: null, circleRadius: 0 }));

  useEffect(() => {
    if (!isEditing) return;
    if (!form.city && !form.district && !form.addressLine) return;

    setGeoError("");
    setForm((f) => ({ ...f, lat: null, lng: null, precision: null, circleRadius: 0 }));

    let cancelled = false;
    setGeoLoading(true);

    resolveLocation({
      addressLine: form.addressLine,
      village: form.village,
      city: form.city,
      district: form.district,
      state: form.state,
    }).then((result) => {
      if (cancelled) return;
      if (result) {
        setForm((f) => ({ ...f, lat: result.lat, lng: result.lng, precision: result.precision, circleRadius: result.circleRadius }));
      } else {
        setGeoError("Could not auto-resolve location. Please pin it manually.");
      }
    }).catch(() => {
      if (!cancelled) setGeoError("Location lookup failed. Please pin manually.");
    }).finally(() => {
      if (!cancelled) setGeoLoading(false);
    });

    return () => { cancelled = true; };
  }, [form.addressLine, form.village, form.city, form.district, form.state, isEditing]);

  const handleMapConfirm = (coords) => {
    setForm((f) => ({ ...f, lat: coords.lat, lng: coords.lng, precision: "manual", circleRadius: 0 }));
    setGeoError("");
    setShowMap(false);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.hospitalName.trim()) nextErrors.hospitalName = "Hospital name is required";
    if (!form.licenseNumber.trim()) nextErrors.licenseNumber = "License number is required";
    if (!form.emergencyContact || form.emergencyContact.length < 10) nextErrors.emergencyContact = "Valid emergency contact required";
    return nextErrors;
  };

  const handleSave = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setErrors({});
    setApiError("");
    setSaving(true);

    try {
      const token = authUser?.token ?? localStorage.getItem("token");
      const payload = {
        hospitalName: form.hospitalName,
        licenseNumber: form.licenseNumber,
        emergencyContact: form.emergencyContact,
        website: form.website,
        addressLine: form.addressLine,
        village: form.village,
        city: form.city,
        district: form.district,
        state: form.state,
        ...(form.lat != null && form.lng != null ? { lat: form.lat, lon: form.lng } : {}),
      };

      await updateHospitalProfile(payload, token);
      dispatch(completeProfileAction({
        role: "HOSPITAL",
        hospitalName: payload.hospitalName,
        hospital: payload.hospitalName,
        name: payload.hospitalName,
        licenseNumber: payload.licenseNumber,
        emergencyContact: payload.emergencyContact,
        website: payload.website,
        city: payload.city,
        village: payload.village,
        district: payload.district,
        state: payload.state,
        lat: payload.lat,
        lng: payload.lon,
      }));
      await fetchProfile();
      setIsEditing(false);
      setToast({ message: "Hospital profile updated successfully!", type: "success" });
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to update hospital profile";
      setApiError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center animate-pulse">
            <Icon path={ICONS.building} size={24} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Loading hospital profile...</p>
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

  const profileLat = getLat(profile);
  const profileLng = getLng(profile);
  const locationText = [profile?.addressLine, profile?.village, profile?.city, profile?.district, profile?.state].filter(Boolean).join(", ");

  if (!isEditing) {
    return (
      <>
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="relative bg-gradient-to-br from-slate-800 via-cyan-900 to-slate-900 rounded-2xl overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <Avatar name={profile?.hospitalName} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-cyan-300 text-xs font-semibold uppercase tracking-widest mb-1">Hospital Profile</p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 truncate">
                    {profile?.hospitalName || "-"}
                  </h1>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="inline-flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-700 px-3 py-1 rounded-full text-sm font-extrabold">
                      <Icon path={ICONS.shield} size={13} /> Verified Hospital
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-cyan-200 font-medium">
                      <Icon path={ICONS.mapPin} size={12} />
                      {locationText || "-"}
                    </span>
                  </div>
                </div>
                <button onClick={enterEdit}
                  className="shrink-0 flex items-center gap-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 rounded-xl transition-all">
                  <Icon path={ICONS.edit} size={14} /> Edit Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile icon={ICONS.id} label="License" value={profile?.licenseNumber} accent="violet" />
              <StatTile icon={ICONS.phone} label="Emergency" value={profile?.emergencyContact} accent="cyan" />
              <StatTile icon={ICONS.globe} label="Website" value={profile?.website} accent="green" />
              <StatTile icon={ICONS.mapPin} label="District" value={profile?.district} accent="amber" />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon path={ICONS.building} size={16} className="text-cyan-600" />
                  <h2 className="text-sm font-bold text-slate-800">Hospital Details</h2>
                </div>
                {[
                  { label: "Hospital Name", icon: ICONS.building, value: profile?.hospitalName },
                  { label: "License Number", icon: ICONS.id, value: profile?.licenseNumber },
                  { label: "Emergency Contact", icon: ICONS.phone, value: profile?.emergencyContact },
                  { label: "Website", icon: ICONS.globe, value: profile?.website },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon path={row.icon} size={13} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.label}</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{dash(row.value)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon path={ICONS.mapPin} size={16} className="text-cyan-600" />
                  <h2 className="text-sm font-bold text-slate-800">Location</h2>
                </div>
                {[
                  { label: "Address", value: profile?.addressLine },
                  { label: "Village", value: profile?.village },
                  { label: "City / Taluk", value: profile?.city },
                  { label: "District", value: profile?.district },
                  { label: "State", value: profile?.state },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400 font-medium">{row.label}</span>
                    <span className="text-sm font-semibold text-slate-700 text-right">{dash(row.value)}</span>
                  </div>
                ))}
                {profileLat && profileLng ? (
                  <>
                    <div className="rounded-xl overflow-hidden border border-slate-200 mt-2" style={{ height: 180, pointerEvents: "none" }}>
                      <MapContainer center={[profileLat, profileLng]} zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false} dragging={false} scrollWheelZoom={false}
                        doubleClickZoom={false} attributionControl={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[profileLat, profileLng]} />
                      </MapContainer>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono text-center">
                      {profileLat.toFixed(5)}, {profileLng.toFixed(5)}
                    </p>
                  </>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center h-28 text-xs text-slate-400 font-medium">
                    No location pinned
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <GlobalStyles />
      </>
    );
  }

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Edit Hospital Profile</h1>
              <p className="text-xs text-slate-400 mt-0.5">Update hospital verification and location details</p>
            </div>
            <button onClick={cancelEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all">
              <Icon path={ICONS.x} size={14} /> Cancel
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-7">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Icon path={ICONS.building} size={13} className="text-cyan-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Hospital Information</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Hospital Name" icon={ICONS.building} value={form.hospitalName} onChange={set("hospitalName")} error={errors.hospitalName} />
                <Field label="License Number" icon={ICONS.id} value={form.licenseNumber} onChange={set("licenseNumber")} error={errors.licenseNumber} />
                <Field label="Emergency Contact" icon={ICONS.phone} value={form.emergencyContact} onChange={set("emergencyContact")} error={errors.emergencyContact} />
                <Field label="Website" icon={ICONS.globe} value={form.website} onChange={set("website")} placeholder="https://apollohospital.com" />
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Icon path={ICONS.mapPin} size={13} className="text-cyan-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Location</h2>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Field label="State" value={form.state} onChange={set("state")} />
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="District" value={form.district} onChange={setDistrict}
                      options={[{ value: "", label: "Select district" }, ...districtOptions.map((d) => ({ value: d, label: d }))]} />
                    <SelectField label="City / Taluk" value={form.city} onChange={setCity}
                      options={[{ value: "", label: "Select taluk" }, ...cityOptions.map((c) => ({ value: c, label: c }))]} />
                  </div>
                  <SelectField label="Village" value={form.village} onChange={set("village")}
                    options={[{ value: "", label: "Select village" }, ...villageOptions.map((v) => ({ value: v, label: v }))]} />
                  <TextAreaField label="Address Line" icon={ICONS.mapPin} value={form.addressLine} onChange={set("addressLine")} placeholder="Street, landmark, campus, ward" />
                  {geoError && (
                    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
                      <Icon path={ICONS.alertTriangle} size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700 leading-relaxed">{geoError}</p>
                    </div>
                  )}
                </div>

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
                      {geoLoading && (
                        <div className="h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
                          <p className="text-xs text-slate-400 font-medium">Resolving location...</p>
                        </div>
                      )}
                      {!geoLoading && form.lat && form.lng && (
                        <LocationPreview
                          lat={form.lat}
                          lng={form.lng}
                          precision={form.precision}
                          circleRadius={form.circleRadius}
                          onChangePinClick={() => setShowMap(true)}
                        />
                      )}
                      {!geoLoading && !form.lat && (
                        <div className="text-center py-10 space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
                            <Icon path={ICONS.mapPin} size={18} className="text-slate-400" />
                          </div>
                          <p className="text-xs text-slate-400">Enter address details to auto-resolve,<br />or pin the hospital manually</p>
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

            {apiError && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <Icon path={ICONS.alertCircle} size={15} className="text-rose-500 shrink-0" />
                <p className="text-xs text-rose-600 font-semibold">{apiError}</p>
              </div>
            )}

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
                    Saving...
                  </>
                ) : geoLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Resolving location...
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

function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:none} }
    `}</style>
  );
}
