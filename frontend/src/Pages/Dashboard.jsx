import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import MapPage from "./Map";
import { extractRoleFromToken, mapProfileToDashboardUser, normalizeRole } from "../features/auth/authAPI";
import { completeProfile } from "../features/auth/authSlice";
import { getMyDonations } from "../features/donations/donationsAPI";
import { getAllDonors, getDistrictDonorCount } from "../features/donors/donorsAPI";
import { getNotifications, markNotificationRead } from "../features/notifications/notificationsAPI";
import { fetchProfile as apiFetchProfile, getHospitalProfile } from "../features/profile/profileAPI";
import { createBloodRequest, getMyBloodRequests, getNearbyBloodRequests, getNearbyDonors, mapBloodGroupForApi, mapUrgencyForApi, updateBloodRequestStatus } from "../features/requests/bloodRequestsAPI";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ProfilePage from "./DonorProfilePage";
import HospitalProfilePage from "./HospitalProfilePage";

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

// ─── Haversine ────────────────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*toR)*Math.cos(lat2*toR)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function extractUserIdFromToken(token) {
  if (!token || typeof token !== "string") return null;

  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decodedPayload = JSON.parse(atob(normalizedPayload));
    return decodedPayload.id || decodedPayload.userId || decodedPayload.user_id || decodedPayload.sub || null;
  } catch {
    return null;
  }
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const DONOR_USER = { id:1, name:"Arjun Mehta", role:"donor", bloodGroup:"O+", location:"Bengaluru, Karnataka", email:"arjun@gmail.com", phone:"+91 98765 43210", lastDonation:"2025-03-12", totalDonations:8, available:true, avatar:"AM" };
const BANK_USER  = { id:2, name:"Dr. Priya Sharma", role:"hospital", hospital:"Apollo Hospitals", location:"Bengaluru, Karnataka", email:"priya@apollo.in", phone:"+91 80 2660 4050", avatar:"PS" };

const NEARBY_REQUESTS = [
  { id:1, bloodType:"O+",  hospital:"Manipal Hospital", location:"Bengaluru", urgency:"Critical", time:"2 hrs ago",  distance:"1.2 km" },
  { id:2, bloodType:"A+",  hospital:"Fortis Hospital",  location:"Bengaluru", urgency:"Urgent",   time:"5 hrs ago",  distance:"3.4 km" },
  { id:3, bloodType:"B−",  hospital:"NIMHANS",          location:"Bengaluru", urgency:"Normal",   time:"1 day ago",  distance:"5.1 km" },
  { id:4, bloodType:"AB+", hospital:"Narayana Health",  location:"Bengaluru", urgency:"Urgent",   time:"3 hrs ago",  distance:"7.8 km" },
];

const DONATION_HISTORY = [
  { id:1, date:"12 Mar 2025", hospital:"Manipal Hospital", units:1, bloodGroup:"O+", status:"Completed", certificate:true  },
  { id:2, date:"08 Nov 2024", hospital:"Apollo Hospitals",  units:1, bloodGroup:"O+", status:"Completed", certificate:true  },
  { id:3, date:"22 Jul 2024", hospital:"Fortis Hospital",   units:1, bloodGroup:"O+", status:"Completed", certificate:false },
  { id:4, date:"05 Mar 2024", hospital:"NIMHANS",           units:1, bloodGroup:"O+", status:"Completed", certificate:true  },
];

const NOTIFICATIONS = [
  { id:1, type:"urgent",  title:"Critical O+ request near you",    body:"Manipal Hospital needs O+ urgently — 1.2 km away", time:"10 min ago", read:false },
  { id:2, type:"info",    title:"Donation eligibility restored",    body:"You're now eligible to donate again after 90 days", time:"2 hrs ago",  read:false },
  { id:3, type:"success", title:"Certificate ready",                body:"Your Nov 2024 donation certificate is available",  time:"Yesterday",  read:true  },
  { id:4, type:"info",    title:"New blood request in your area",   body:"A+ blood needed at Fortis Hospital",               time:"2 days ago", read:true  },
];

// eslint-disable-next-line no-unused-vars
const AVAILABLE_DONORS = [
  { id:1, name:"Rahul Das",      blood:"O+",  village:"Bengaluru", district:"Bengaluru Urban", state:"Karnataka", available:true,  lastDonated:"3 months ago" },
  { id:2, name:"Meena Krishnan", blood:"A+",  village:"Bengaluru", district:"Bengaluru Urban", state:"Karnataka", available:true,  lastDonated:"4 months ago" },
  { id:3, name:"Sanjay Patel",   blood:"B+",  village:"Mysuru",    district:"Mysuru",          state:"Karnataka", available:false, lastDonated:"1 month ago"  },
  { id:4, name:"Lakshmi Nair",   blood:"AB+", village:"Bengaluru", district:"Bengaluru Urban", state:"Karnataka", available:true,  lastDonated:"5 months ago" },
  { id:5, name:"Vikram Singh",   blood:"O−",  village:"Hubli",     district:"Dharwad",         state:"Karnataka", available:true,  lastDonated:"6 months ago" },
  { id:6, name:"Anita Reddy",    blood:"B−",  village:"Bengaluru", district:"Bengaluru Urban", state:"Karnataka", available:false, lastDonated:"2 months ago" },
];

const BLOOD_REQUESTS = [
  { id:1, blood:"O+",  qty:2, hospital:"Manipal Hospital", city:"Bengaluru", urgency:"Critical", status:"Pending",   date:"Today"     },
  { id:2, blood:"A+",  qty:1, hospital:"Fortis Hospital",  city:"Bengaluru", urgency:"Urgent",   status:"Fulfilled", date:"Yesterday" },
  { id:3, blood:"B+",  qty:3, hospital:"Apollo Hospitals", city:"Bengaluru", urgency:"Normal",   status:"Pending",   date:"2 days ago"},
  { id:4, blood:"AB−", qty:1, hospital:"Narayana Health",  city:"Bengaluru", urgency:"Urgent",   status:"Fulfilled", date:"3 days ago"},
];

// eslint-disable-next-line no-unused-vars
const DONOR_STATS_CITY   = [{ city:"Bengaluru",donors:312},{ city:"Mysuru",donors:87},{ city:"Hubli",donors:64},{ city:"Mangaluru",donors:53},{ city:"Belgaum",donors:41}];


// Geo donors — lat/lng around Bengaluru (map space: 12.85–13.10 lat, 77.50–77.75 lng)
const GEO_DONORS = [
  { id:1,  name:"Rahul Das",       bloodGroup:"O+",  lat:12.9716, lng:77.5946, village:"Bengaluru", lastDonated:"3 months ago", available:true  },
  { id:2,  name:"Meena Krishnan",  bloodGroup:"A+",  lat:12.9352, lng:77.6245, village:"Bengaluru", lastDonated:"4 months ago", available:true  },
  { id:3,  name:"Lakshmi Nair",    bloodGroup:"AB+", lat:12.9870, lng:77.5700, village:"Bengaluru", lastDonated:"5 months ago", available:true  },
  { id:4,  name:"Anita Reddy",     bloodGroup:"B−",  lat:12.9100, lng:77.6500, village:"Bengaluru", lastDonated:"2 months ago", available:false },
  { id:5,  name:"Karthik Rao",     bloodGroup:"O+",  lat:12.9550, lng:77.6210, village:"Bengaluru", lastDonated:"7 months ago", available:true  },
  { id:6,  name:"Divya Menon",     bloodGroup:"A−",  lat:13.0050, lng:77.5700, village:"Bengaluru", lastDonated:"5 months ago", available:true  },
  { id:7,  name:"Suresh Kumar",    bloodGroup:"B+",  lat:12.9630, lng:77.5800, village:"Bengaluru", lastDonated:"4 months ago", available:true  },
  { id:8,  name:"Preethi Sharma",  bloodGroup:"O+",  lat:12.9800, lng:77.6100, village:"Bengaluru", lastDonated:"8 months ago", available:true  },
  { id:9,  name:"Ajay Verma",      bloodGroup:"AB−", lat:12.9400, lng:77.5500, village:"Bengaluru", lastDonated:"3 months ago", available:false },
  { id:10, name:"Mohammed Farhan", bloodGroup:"O+",  lat:12.9900, lng:77.6400, village:"Bengaluru", lastDonated:"5 months ago", available:true  },
  { id:11, name:"Rekha Pillai",    bloodGroup:"B−",  lat:12.9200, lng:77.6800, village:"Bengaluru", lastDonated:"9 months ago", available:true  },
  { id:12, name:"Arun Gowda",      bloodGroup:"O−",  lat:12.9650, lng:77.5650, village:"Bengaluru", lastDonated:"4 months ago", available:false },
  { id:13, name:"Shalini Bhat",    bloodGroup:"A+",  lat:13.0100, lng:77.6300, village:"Bengaluru", lastDonated:"6 months ago", available:true  },
  { id:14, name:"Deepak Nair",     bloodGroup:"B+",  lat:12.8950, lng:77.5900, village:"Bengaluru", lastDonated:"3 months ago", available:true  },
  { id:15, name:"Kavitha Reddy",   bloodGroup:"O+",  lat:12.9450, lng:77.6600, village:"Bengaluru", lastDonated:"7 months ago", available:false },
];

const CITY_COORDS = {
  "Bengaluru": { lat:12.9716, lng:77.5946 },
  "Mysore":    { lat:12.2756, lng:76.6686 },
  "Mysuru":    { lat:12.2958, lng:76.6394 },
  "Hubli":     { lat:15.3647, lng:75.1240 },
  "Mangaluru": { lat:12.9141, lng:74.8560 },
  "Tumkur":    { lat:13.3379, lng:77.1173 },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size=20, className="" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const IC = {
  dashboard:  "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  profile:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  requests:   "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2",
  bell:       "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  history:    "M12 8v4l3 3 M3.05 11a9 9 0 1 0 .5-3M3 3v5h5",
  settings:   "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  logout:     "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  menu:       "M4 6h16M4 12h16M4 18h16",
  close:      "M18 6L6 18M6 6l12 12",
  sun:        "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  moon:       "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  chevronD:   "M6 9l6 6 6-6",
  chevronR:   "M9 18l6-6-6-6",
  droplet:    "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  mapPin:     "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
  activity:   "M22 12h-4l-3 9L9 3l-3 9H2",
  check:      "M20 6L9 17l-5-5",
  plus:       "M12 5v14M5 12h14",
  search:     "M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM21 21l-4.35-4.35",
  phone:      "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  users:      "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  shield:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  download:   "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  xCircle:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M15 9l-6 6M9 9l6 6",
  alert:      "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4M12 17h.01",
  filter:     "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  eye:        "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  bed:        "M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9",
  zoomIn:     "M11 8v6M8 11h6 M21 21l-4.35-4.35 M17 11a6 6 0 1 0-12 0 6 6 0 0 0 12 0z",
  zoomOut:    "M8 11h6 M21 21l-4.35-4.35 M17 11a6 6 0 1 0-12 0 6 6 0 0 0 12 0z",
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
function CrossMark({ size=28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0891B2"/>
      <rect x="13" y="6" width="6" height="20" rx="2" fill="white"/>
      <rect x="6" y="13" width="20" height="6" rx="2" fill="white"/>
    </svg>
  );
}

function Badge({ children, color="gray" }) {
  const map = { red:"bg-red-100 text-red-700 border-red-200", orange:"bg-orange-100 text-orange-700 border-orange-200", green:"bg-green-100 text-green-700 border-green-200", cyan:"bg-cyan-100 text-cyan-700 border-cyan-200", gray:"bg-slate-100 text-slate-600 border-slate-200", yellow:"bg-yellow-100 text-yellow-700 border-yellow-200", blue:"bg-blue-100 text-blue-700 border-blue-200" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${map[color]||map.gray}`}>{children}</span>;
}

function Card({ children, className="" }) {
  const { dark } = useApp();
  return <div className={`rounded-2xl border shadow-sm ${dark?"bg-slate-800 border-slate-700":"bg-white border-slate-100"} ${className}`}>{children}</div>;
}

function SectionTitle({ children, sub }) {
  const { dark } = useApp();
  return (
    <div className="mb-5">
      <h2 className={`text-lg font-bold ${dark?"text-white":"text-slate-900"}`}>{children}</h2>
      {sub && <p className={`text-sm mt-0.5 ${dark?"text-slate-400":"text-slate-500"}`}>{sub}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div className="relative cursor-pointer" onClick={onChange}>
      <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${checked?"bg-cyan-600":"bg-slate-300"}`}/>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${checked?"translate-x-6":"translate-x-1"}`}/>
    </div>
  );
}

function Toast({ toasts, remove }) {
  const colors = { success:"bg-green-600", error:"bg-red-600", info:"bg-cyan-600", warning:"bg-amber-500" };
  return (
    <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-xl text-sm font-medium min-w-64 ${colors[t.type]||"bg-slate-800"}`}
          style={{animation:"slideIn .25s ease"}}>
          <span className="flex-1">{t.message}</span>
          <button onClick={()=>remove(t.id)} className="opacity-70 hover:opacity-100"><Ico d={IC.xCircle} size={15}/></button>
        </div>
      ))}
    </div>
  );
}

// ─── SVG Map (pure React — no external deps) ──────────────────────────────────
const MAP_W = 600, MAP_H = 400;
// Bengaluru bounding box
const LAT_MIN=12.85, LAT_MAX=13.10, LNG_MIN=77.48, LNG_MAX=77.73;

function latLngToXY(lat, lng) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
  const y = MAP_H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return { x, y };
}

// km radius → SVG pixels
function kmToPixels(km) {
  const lngDeg = km / (111.32 * Math.cos(12.97 * Math.PI/180));
  return (lngDeg / (LNG_MAX - LNG_MIN)) * MAP_W;
}

function SVGMap({ center, donors, radiusKm, checkedDonors, onMarkerClick, selectedDonor, dark }) {
  const cp = latLngToXY(center.lat, center.lng);
  const radiusPx = kmToPixels(radiusKm);
  const displayDonors = donors;

  return (
    <div className={`relative rounded-2xl overflow-hidden border ${dark?"border-slate-700":"border-slate-200"}`} style={{background: dark?"#1e293b":"#e8f4f8"}}>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full" style={{maxHeight:420}}>
        {/* Map grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={dark?"#334155":"#b0d4e3"} strokeWidth="0.5"/>
          </pattern>
          <pattern id="grid2" width="200" height="200" patternUnits="userSpaceOnUse">
            <rect width="200" height="200" fill="url(#grid)"/>
            <path d="M 200 0 L 0 0 0 200" fill="none" stroke={dark?"#475569":"#89bdd3"} strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={MAP_W} height={MAP_H} fill={dark?"#1e293b":"#dbeeff"}/>
        <rect width={MAP_W} height={MAP_H} fill="url(#grid2)"/>

        {/* Decorative "roads" */}
        {[
          "M0,200 Q150,180 300,200 T600,195",
          "M0,120 Q200,100 400,130 T600,110",
          "M0,310 Q100,290 300,315 T600,300",
          "M150,0 Q160,100 155,200 T165,400",
          "M350,0 Q360,150 355,280 T370,400",
          "M480,0 Q490,120 485,260 T500,400",
        ].map((d,i) => (
          <path key={i} d={d} fill="none" stroke={dark?"#334155":"#c8ddef"} strokeWidth={i<3?5:3} opacity="0.7"/>
        ))}
        {/* Road labels */}
        <text x="280" y="195" fill={dark?"#475569":"#7fb3cc"} fontSize="9" textAnchor="middle" fontFamily="system-ui">MG Road</text>
        <text x="155" y="110" fill={dark?"#475569":"#7fb3cc"} fontSize="9" textAnchor="middle" fontFamily="system-ui" transform="rotate(-5,155,110)">Outer Ring</text>

        {/* City label */}
        <text x={MAP_W/2} y={MAP_H-10} fill={dark?"#475569":"#89bdd3"} fontSize="11" textAnchor="middle" fontFamily="system-ui" fontWeight="600">Bengaluru, Karnataka</text>

        {/* Radius circle — shown after check */}
        {checkedDonors !== null && (
          <>
            <circle cx={cp.x} cy={cp.y} r={radiusPx}
              fill="#0891B2" fillOpacity="0.08"
              stroke="#0891B2" strokeWidth="2" strokeDasharray="8 5" opacity="0.7"/>
            <text x={cp.x + radiusPx * 0.7} y={cp.y - 8}
              fill="#0891B2" fontSize="10" fontFamily="system-ui" fontWeight="700">
              {radiusKm}km radius
            </text>
          </>
        )}

        {/* Donor markers */}
        {displayDonors.map(d => {
          const p = latLngToXY(d.lat, d.lng);
          const inRadius = checkedDonors !== null && checkedDonors.some(c => c.id === d.id);
          const color = !d.available ? "#94a3b8" : inRadius ? "#22c55e" : "#0891B2";
          const isSelected = selectedDonor && selectedDonor.id === d.id;
          return (
            <g key={d.id} onClick={() => onMarkerClick(d)} style={{cursor:"pointer"}}>
              {/* Pulse ring for available-in-radius */}
              {inRadius && d.available && (
                <circle cx={p.x} cy={p.y} r="14" fill={color} opacity="0.2">
                  <animate attributeName="r" from="10" to="20" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite"/>
                </circle>
              )}
              {/* Selection ring */}
              {isSelected && <circle cx={p.x} cy={p.y} r="16" fill="none" stroke={color} strokeWidth="2.5" opacity="0.8"/>}
              {/* Pin body */}
              <ellipse cx={p.x} cy={p.y+1} rx="8" ry="3" fill="rgba(0,0,0,0.15)"/>
              <path d={`M${p.x},${p.y+12} C${p.x-8},${p.y} ${p.x-8},${p.y-14} ${p.x},${p.y-16} C${p.x+8},${p.y-14} ${p.x+8},${p.y} ${p.x},${p.y+12}Z`}
                fill={color} stroke="white" strokeWidth="1.5"/>
              <circle cx={p.x} cy={p.y-8} r="4" fill="white" opacity="0.85"/>
            </g>
          );
        })}

        {/* Hospital / center marker */}
        <g>
          <ellipse cx={cp.x} cy={cp.y+2} rx="9" ry="3.5" fill="rgba(0,0,0,0.2)"/>
          <path d={`M${cp.x},${cp.y+14} C${cp.x-9},${cp.y} ${cp.x-9},${cp.y-16} ${cp.x},${cp.y-18} C${cp.x+9},${cp.y-16} ${cp.x+9},${cp.y} ${cp.x},${cp.y+14}Z`}
            fill="#dc2626" stroke="white" strokeWidth="2"/>
          <rect x={cp.x-4} y={cp.y-16} width="8" height="2" rx="1" fill="white"/>
          <rect x={cp.x-1} y={cp.y-19} width="2" height="8" rx="1" fill="white"/>
        </g>
      </svg>

      {/* Legend overlay */}
      <div className={`absolute top-2 left-2 flex flex-col gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold border backdrop-blur-sm ${dark?"bg-slate-900/80 border-slate-700 text-slate-300":"bg-white/90 border-slate-200 text-slate-600"}`}>
        {[
          { color:"#22c55e", label:"Available (in radius)" },
          { color:"#94a3b8", label:"Unavailable" },
          { color:"#0891B2", label:"Available (outside)" },
          { color:"#dc2626", label:"Your Location" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full shrink-0" style={{background:l.color}}/>
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* OSM attribution */}
      <div className="absolute bottom-1 right-2 text-[9px] text-slate-400">Map data style inspired by OpenStreetMap</div>
    </div>
  );
}

// Donor popup card
function DonorPopup({ donor, onClose, onContact, dark }) {
  if (!donor) return null;
  return (
    <div className={`rounded-2xl border shadow-xl p-4 ${dark?"bg-slate-800 border-slate-600":"bg-white border-slate-200"}`}
      style={{animation:"fadeUp .2s ease"}}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${donor.available?"bg-cyan-100 text-cyan-700":"bg-slate-100 text-slate-500"}`}>
            {donor.name.split(" ").map(n=>n[0]).join("")}
          </div>
          <div>
            <p className={`text-sm font-bold ${dark?"text-white":"text-slate-800"}`}>{donor.name}</p>
            <p className="text-xs text-slate-400">{donor.village}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Ico d={IC.xCircle} size={18}/></button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label:"Blood Group", value:donor.bloodGroup, highlight:true },
          { label:"Status", value:donor.available?"✓ Available":"Unavailable", green:donor.available },
          { label:"Last Donated", value:donor.lastDonated },
          { label:"Village", value:donor.village },
        ].map(r => (
          <div key={r.label} className={`p-2 rounded-lg ${dark?"bg-slate-700":"bg-slate-50"}`}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{r.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${r.highlight?"text-red-600":r.green?"text-green-600":dark?"text-slate-300":"text-slate-700"}`}>{r.value}</p>
          </div>
        ))}
      </div>
      <button onClick={()=>onContact(donor)} disabled={!donor.available}
        className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-all ${donor.available?"text-white bg-cyan-600 hover:bg-cyan-700":"text-slate-400 bg-slate-100 cursor-not-allowed"}`}>
        <Ico d={IC.phone} size={14}/> Contact Donor
      </button>
    </div>
  );
}

// ─── Blood Request Module ──────────────────────────────────────────────────────
function BloodRequestModule() {
  const { dark, addToast, user } = useApp();
  const authUser = useSelector(state => state.auth?.user);

  const [form, setForm] = useState({
    blood:"",
    qty:"1",
    patientName:"",
    contactName:user?.name || "",
    contact:"",
    hospitalName:user?.hospitalName || user?.hospital || user?.name || "",
    state:"Karnataka",
    district:"",
    city:"Bengaluru",
    urgency:"Normal",
    radius:"10",
    notes:"",
    requiredBefore:"",
    lat:"",
    lng:""
  });
  const set = k => e => {
    setForm(f => ({...f, [k]: e.target.value}));
    if (["blood", "city", "radius"].includes(k)) {
      setCheckedDonors(null);
      setSelectedDonor(null);
    }
  };

  
  const [loading, setLoading]             = useState(false);
  const [checkedDonors, setCheckedDonors] = useState(null);
  const [submitted, setSubmitted]         = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  // table filters
  const [search, setSearch]         = useState("");
  const [filterBlood, setFilterBlood] = useState("all");
  const [filterAvail, setFilterAvail] = useState("all");


  useEffect(() => {

    async function loadHospitalProfile() {

      try {

        const token = localStorage.getItem("token");

        const response = await getHospitalProfile(token);

        const hospital = response.data.data;

        console.log("🏥 Hospital Profile:", hospital);

        setForm(f => ({
          ...f,

          hospitalName: hospital.hospitalName || "",
          city: hospital.city || "",

          lat: hospital.lat,
          lng: hospital.lon,
        }));

      } catch (err) {

        console.log(err);

      }
    }

    loadHospitalProfile();

  }, []);

  // console.log("😊 " + JSON.stringify(form));
  const center = {
    lat: Number(form.lat) || 12.9716,
    lng: Number(form.lng) || 77.5946,
  };
  const radiusKm = Number(form.radius);

  const mapDonorForDisplay = (donor, index) => {
    const fallbackOffset = index * 0.004;
    const fallbackDistance = donor.distanceKm !== undefined
      ? Number(donor.distanceKm).toFixed(1)
      : donor.lat && donor.lng
        ? haversineKm(center.lat, center.lng, Number(donor.lat), Number(donor.lng)).toFixed(1)
        : "-";
    return {
      ...donor,
      lat: Number(donor.lat ?? center.lat + fallbackOffset),
      lng: Number(donor.lng ?? center.lng + fallbackOffset),
      village: donor.village || donor.city || "-",
      distance: donor.distance ?? fallbackDistance,
      lastDonated: donor.lastDonated || "-",
    };
  };

  const mapDonors = checkedDonors || GEO_DONORS.slice(0, 0);
  const availableCount = (checkedDonors || []).filter(d => d.available).length;

  const tableFiltered = (checkedDonors || []).filter(d => {
    const q = search.toLowerCase();
    const name = String(d.name || "").toLowerCase();
    const village = String(d.village || d.city || "").toLowerCase();
    return (
      (name.includes(q) || village.includes(q)) &&
      (filterBlood === "all" || d.bloodGroup === filterBlood) &&
      (filterAvail === "all" || (filterAvail === "yes" ? d.available : !d.available))
    );
  });

  const handleCheck = async () => {
    setLoading(true);
    setSelectedDonor(null);
    try {
      const response = await getNearbyDonors({
        radiusKm,
      });
      const donors = (response?.data?.data || [])
        .map(mapDonorForDisplay)
        .sort((a,b) => Number(a.distanceKm ?? Infinity) - Number(b.distanceKm ?? Infinity));
      const available = donors.filter(d => d.available).length;
      setCheckedDonors(donors);
      addToast(
        available > 0
          ? `${available} donors available within ${radiusKm}km`
          : `No available donors within ${radiusKm}km - try wider radius`,
        available > 0 ? "success" : "warning"
      );
    } catch (err) {
      setCheckedDonors([]);
      addToast(err?.response?.data?.message || err?.message || "Failed to search nearby donors", "error");
    } finally {
      setLoading(false);
    }
  };

  const buildRequestPayload = () => {
    const requestedById = user?.id || authUser?.id || extractUserIdFromToken(localStorage.getItem("token"));
    const payload = {
      requestedById: requestedById ? Number(requestedById) : undefined,
      bloodGroup: mapBloodGroupForApi(form.blood),
      unitsRequired: Number(form.qty),
      urgency: mapUrgencyForApi(form.urgency),
      patientName: form.patientName.trim(),
      contactName: form.contactName.trim(),
      contactPhone: form.contact.trim(),
      hospitalName: form.hospitalName.trim(),
      notes: form.notes.trim(),
      latitude: center.lat,
      longitude: center.lng,
      city: form.city,
      district: form.district,
      state: form.state,
      status: "OPEN",
      requiredBefore: form.requiredBefore ? `${form.requiredBefore}:00` : undefined,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
        delete payload[key];
      }
    });

    return payload;
  };

  const handleSubmit = async () => {
    if (!form.blood)    { addToast("Select a blood group", "error"); return; }
    if (!form.patientName.trim()) { addToast("Enter patient name", "error"); return; }
    if (!form.contactName.trim()) { addToast("Enter contact name", "error"); return; }
    if (!form.hospitalName.trim()) { addToast("Enter hospital name", "error"); return; }
    if (!form.city)     { addToast("Enter city", "error"); return; }
    if (!form.contact)  { addToast("Enter contact number", "error"); return; }
    setSubmitted(true);
    try {
      const response = await createBloodRequest(buildRequestPayload());
      const requestId = response?.data?.data?.requestId || response?.data?.data?.id || response?.data?.requestId;
      setSubmitted(false);
      setCheckedDonors(null);
      setSelectedDonor(null);
      setForm(f => ({...f, blood:"", qty:"1", patientName:"", district:"", contact:"", notes:"", requiredBefore:""}));
      addToast(requestId ? `Blood request #${requestId} submitted` : "Blood request submitted", "success");
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || "Failed to submit blood request", "error");
    } finally {
      setSubmitted(false);
    }
  };

  const urgencyMeta = {
    Normal:   { bar:"bg-green-500",  ring:"border-green-400", text:"text-green-700",  bg:"bg-green-50 border-green-200",  msg:"Standard queue" },
    Urgent:   { bar:"bg-amber-500",  ring:"border-amber-400", text:"text-amber-700",  bg:"bg-amber-50 border-amber-200",  msg:"High priority dispatch" },
    Critical: { bar:"bg-red-600",    ring:"border-red-500",   text:"text-red-700",    bg:"bg-red-50 border-red-200",      msg:"⚠ Immediate — donors alerted now" },
  };
  const um = urgencyMeta[form.urgency];

  const inputCls = `w-full px-3 py-2.5 text-sm rounded-xl border-2 outline-none transition-all focus:border-cyan-500 focus:shadow-sm focus:shadow-cyan-100 ${dark?"bg-slate-700 border-slate-600 text-white placeholder-slate-400":"bg-white border-slate-200 text-slate-800"}`;
  const labelCls = `block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${dark?"text-slate-400":"text-slate-500"}`;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div>
          <h2 className={`text-xl font-extrabold ${dark?"text-white":"text-slate-900"}`}>Blood Request Module</h2>
          <p className={`text-xs mt-0.5 ${dark?"text-slate-400":"text-slate-500"}`}>Find donors on the interactive map and submit a request</p>
        </div>
        {checkedDonors !== null && (
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${availableCount>0?"bg-green-50 border-green-200":"bg-amber-50 border-amber-200"}`}
            style={{animation:"fadeUp .4s ease"}}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base ${availableCount>0?"bg-green-600 text-white":"bg-amber-500 text-white"}`}>
              {availableCount}
            </div>
            <div>
              <p className={`text-sm font-extrabold ${availableCount>0?"text-green-700":"text-amber-700"}`}>
                {availableCount>0 ? "Donors Available" : "No Matches"}
              </p>
              <p className="text-[10px] text-slate-400">within {radiusKm}km radius</p>
            </div>
          </div>
        )}
      </div>

      {/* Two-column: Form + Map */}
      <div className="grid xl:grid-cols-5 gap-5 items-start">

        {/* ── Form ── */}
        <Card className={`xl:col-span-2 p-5 space-y-4 ${submitted?"opacity-60 pointer-events-none":""}`}>
          <p className={`text-xs font-bold uppercase tracking-widest ${dark?"text-slate-400":"text-slate-400"}`}>Request Details</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Blood Group *</label>
              <select value={form.blood} onChange={set("blood")} className={`${inputCls} appearance-none`}>
                <option value="">Any / Select</option>
                {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Quantity (Units)</label>
              <input type="number" min="1" max="10" value={form.qty} onChange={set("qty")} className={inputCls}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Patient Name *</label>
              <input placeholder="Ravi Kumar" value={form.patientName} onChange={set("patientName")} className={inputCls}/>
            </div>
            <div>
              <label className={labelCls}>Contact Name *</label>
              <input placeholder="Suresh" value={form.contactName} onChange={set("contactName")} className={inputCls}/>
            </div>
          </div>

          <div>
            <label className={labelCls}>Hospital Name *</label>
            <input placeholder="Apollo Hospital Mysore" value={form.hospitalName} onChange={set("hospitalName")} className={inputCls}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>State</label>
              <select value={form.state} onChange={set("state")} className={`${inputCls} appearance-none`}>
                {["Karnataka","Maharashtra","Tamil Nadu","Telangana","Kerala"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>District</label>
              <input placeholder="e.g. Bengaluru Urban" value={form.district} onChange={set("district")} className={inputCls}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City *</label>
              <select value={form.city} onChange={e=>{set("city")(e);setCheckedDonors(null);}} className={`${inputCls} appearance-none`}>
                {Object.keys(CITY_COORDS).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Search Radius</label>
              <select value={form.radius} onChange={set("radius")} className={`${inputCls} appearance-none`}>
                {[5, 10, 20, 50, 100, 200, 300, 400, 500].map(r=>(
                  <option key={r} value={r}>{r} km</option>
                ))}
              </select>
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className={labelCls}>Urgency Level</label>
            <div className="flex gap-2">
              {["Normal","Urgent","Critical"].map(u=>(
                <button key={u} type="button" onClick={()=>setForm(f=>({...f,urgency:u}))}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                    form.urgency===u
                      ? u==="Critical"?"bg-red-600 border-red-600 text-white":u==="Urgent"?"bg-amber-500 border-amber-500 text-white":"bg-green-600 border-green-600 text-white"
                      : dark?"border-slate-600 text-slate-400 hover:border-slate-500":"border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}>{u}</button>
              ))}
            </div>
            <div className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${um.bg}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${um.bar} ${form.urgency==="Critical"?"animate-pulse":""}`}/>
              <span className={`font-semibold ${um.text}`}>{um.msg}</span>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Contact Number *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30"><Ico d={IC.phone} size={14}/></div>
                <input placeholder="9876543210" value={form.contact} onChange={set("contact")} className={`${inputCls} pl-8`}/>
              </div>
            </div>
            <div>
              <label className={labelCls}>Required Before</label>
              <input type="datetime-local" value={form.requiredBefore} onChange={set("requiredBefore")} className={inputCls}/>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={2} placeholder="Urgent surgery case" value={form.notes} onChange={set("notes")} className={`${inputCls} resize-none`}/>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            <button onClick={handleCheck} disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl border-2 border-cyan-600 transition-all disabled:opacity-50 ${dark?"text-cyan-400 hover:bg-cyan-900/30":"text-cyan-700 hover:bg-cyan-50"}`}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"/> Searching…</>
              ) : (
                <><Ico d={IC.search} size={16}/> Check Available Donors</>
              )}
            </button>
            <button onClick={handleSubmit} disabled={submitted}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-cyan-600 py-3 rounded-xl hover:bg-cyan-700 transition-all shadow-lg hover:shadow-cyan-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60">
              {submitted
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Submitting…</>
                : <><Ico d={IC.plus} size={16}/> Submit Blood Request</>
              }
            </button>
          </div>
        </Card>

        {/* ── Map + stats ── */}
        <div className="xl:col-span-3 flex flex-col gap-3">
          {/* OpenStreetMap implementation */}
          <div className="rounded-2xl overflow-hidden border" style={{background: dark?"#0f1724":"#f0fbff"}}>
            <MapPage
              center={center}
              donors={mapDonors}
              radiusKm={radiusKm}
              checkedDonors={checkedDonors}
              onMarkerClick={d => setSelectedDonor(prev => prev?.id===d.id ? null : d)}
              selectedDonor={selectedDonor}
              mapHeight={420}
            />
          </div>

          {/* Donor popup */}
          {selectedDonor && (
            <DonorPopup
              donor={selectedDonor}
              onClose={() => setSelectedDonor(null)}
              onContact={d => { addToast(`Contact request sent to ${d.name}`, "success"); setSelectedDonor(null); }}
              dark={dark}
            />
          )}

          {/* Stat pills — shown after check */}
          {checkedDonors !== null && (
            <div className="grid grid-cols-3 gap-3" style={{animation:"fadeUp .4s ease"}}>
              {[
                { label:"In Radius",   value:checkedDonors.length,        color:"text-cyan-600",  bg:dark?"bg-cyan-900/20 border-cyan-800":"bg-cyan-50 border-cyan-100" },
                { label:"Available",   value:availableCount,              color:"text-green-600", bg:dark?"bg-green-900/20 border-green-800":"bg-green-50 border-green-100" },
                { label:"Unavailable", value:checkedDonors.length-availableCount, color:"text-slate-500", bg:dark?"bg-slate-800 border-slate-700":"bg-slate-50 border-slate-200" },
              ].map(s=>(
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Donor Table — shown after check ── */}
      {checkedDonors !== null && (
        <div style={{animation:"fadeUp .5s ease"}}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className={`text-base font-bold ${dark?"text-white":"text-slate-800"}`}>Donors within {radiusKm}km</h3>
              <p className={`text-xs ${dark?"text-slate-400":"text-slate-500"}`}>{availableCount} available · {checkedDonors.length - availableCount} unavailable · sorted by distance</p>
            </div>
            <Badge color="cyan">{checkedDonors.length} total</Badge>
          </div>

          {/* Table filters */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="relative flex-1 min-w-40">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"><Ico d={IC.search} size={13}/></div>
              <input placeholder="Search name or village…" value={search} onChange={e=>setSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border-2 outline-none transition-all focus:border-cyan-500 ${dark?"bg-slate-700 border-slate-600 text-white placeholder-slate-400":"bg-white border-slate-200 text-slate-700"}`}/>
            </div>
            {[
              { val:filterBlood, set:setFilterBlood, opts:["all","A+","A-","B+","B-","O+","O-","AB+","AB-"], labels:{all:"All Groups"} },
              { val:filterAvail, set:setFilterAvail, opts:["all","yes","no"], labels:{all:"All Status",yes:"Available",no:"Unavailable"} },
            ].map((f,i) => (
              <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border-2 outline-none focus:border-cyan-500 font-medium ${dark?"bg-slate-700 border-slate-600 text-white":"bg-white border-slate-200 text-slate-700"}`}>
                {f.opts.map(o=><option key={o} value={o}>{f.labels?.[o]||o}</option>)}
              </select>
            ))}
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${dark?"border-slate-700":"border-slate-100"}`}>
                    {["Donor","Blood","Distance","Location","Last Donated","Status","Action"].map(h=>(
                      <th key={h} className={`text-left px-3 py-3 font-bold uppercase tracking-wider text-[10px] ${dark?"text-slate-400":"text-slate-400"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark?"divide-slate-700/60":"divide-slate-50"}`}>
                  {tableFiltered.length===0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No donors match the filters</td></tr>
                  ) : tableFiltered.map((d,i)=>(
                    <tr key={d.id}
                      onClick={()=>setSelectedDonor(prev=>prev?.id===d.id?null:d)}
                      className={`transition-colors cursor-pointer ${dark?"hover:bg-slate-700/50":"hover:bg-slate-50"} ${selectedDonor?.id===d.id?(dark?"bg-cyan-900/20":"bg-cyan-50"):""}`}
                      style={{animation:`fadeUp .3s ease both`,animationDelay:`${i*30}ms`}}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${d.available?"bg-cyan-100 text-cyan-700":"bg-slate-100 text-slate-500"}`}>
                            {d.name.split(" ").map(n=>n[0]).join("")}
                          </div>
                          <span className={`font-semibold ${dark?"text-white":"text-slate-800"}`}>{d.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] border ${d.available?"bg-red-50 text-red-700 border-red-200":"bg-slate-100 text-slate-500 border-slate-200"}`}>{d.bloodGroup}</span>
                      </td>
                      <td className={`px-3 py-2.5 font-semibold ${dark?"text-cyan-400":"text-cyan-600"}`}>{d.distance} km</td>
                      <td className={`px-3 py-2.5 ${dark?"text-slate-400":"text-slate-500"}`}>{d.village}</td>
                      <td className={`px-3 py-2.5 ${dark?"text-slate-400":"text-slate-500"}`}>{d.lastDonated}</td>
                      <td className="px-3 py-2.5">
                        {d.available
                          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>Available</span>
                          : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Unavailable</span>
                        }
                      </td>
                      <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>{if(d.available){addToast(`Contact sent to ${d.name}`,"success");}}} disabled={!d.available}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${d.available?"text-white bg-cyan-600 hover:bg-cyan-700 hover:-translate-y-0.5":"text-slate-400 bg-slate-100 cursor-not-allowed"}`}>
                          <Ico d={IC.phone} size={11}/> Contact
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"dashboard",     label:"Dashboard",     icon:IC.dashboard },
  { id:"profile",       label:"Profile",       icon:IC.profile   },
  { id:"requests",      label:"Requests",      icon:IC.requests  },
  { id:"notifications", label:"Notifications", icon:IC.bell      },
  { id:"history",       label:"History",       icon:IC.history   },
  { id:"settings",      label:"Settings",      icon:IC.settings  },
];

function Sidebar({ open, collapsed, setCollapsed, active, setActive, onClose }) {
  const { dark, user } = useApp();
  const bg = dark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200";
  return (
    <>
      {open && <div className="fixed inset-0 top-8 bg-black/40 z-30 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed top-8 left-0 z-40 flex flex-col border-r transition-all duration-300 ${bg} ${open?"translate-x-0":"-translate-x-full"} lg:translate-x-0 ${collapsed?"w-[68px]":"w-60"}`}
        style={{height:"calc(100vh - 2rem)"}}>
        {/* Logo */}
        <div className={`flex items-center gap-3 h-16 px-4 border-b ${dark?"border-slate-700":"border-slate-100"}`}>
          <CrossMark size={32}/>
          {!collapsed && (
            <div>
              <p className={`text-base font-extrabold tracking-tight leading-none ${dark?"text-white":"text-slate-800"}`}>Blood<span className="text-cyan-600">Connect</span></p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Hospital Network</p>
            </div>
          )}
          <button onClick={()=>setCollapsed(!collapsed)} className="ml-auto hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-100 transition-colors">
            <Ico d={collapsed?IC.chevronR:IC.close} size={14} className="text-slate-400"/>
          </button>
        </div>
        {/* User pill */}
        {!collapsed && (
          <div className={`mx-3 mt-4 mb-2 rounded-xl p-3 ${dark?"bg-slate-800":"bg-slate-50"}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{user.avatar}</div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${dark?"text-white":"text-slate-800"}`}>{user.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{String(user.role).toUpperCase()==="HOSPITAL"?"Hospital / Blood Bank":"Blood Donor"}</p>
              </div>
            </div>
          </div>
        )}
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={()=>{setActive(item.id);onClose();}}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive?"bg-cyan-600 text-white shadow-sm":dark?"text-slate-400 hover:bg-slate-800 hover:text-white":"text-slate-500 hover:bg-slate-50 hover:text-slate-800"} ${collapsed?"justify-center":""}`}>
                <Ico d={item.icon} size={18} className={isActive?"text-white":""}/>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.id==="notifications" && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>}
              </button>
            );
          })}
        </nav>
        <div className={`p-3 border-t ${dark?"border-slate-700":"border-slate-100"}`}>
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${dark?"text-slate-400 hover:bg-slate-800 hover:text-red-400":"text-slate-500 hover:bg-red-50 hover:text-red-600"} ${collapsed?"justify-center":""}`}>
            <Ico d={IC.logout} size={18}/>{!collapsed&&"Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ sidebarOpen, setSidebarOpen, active, collapsed }) {
  const { dark, setDark, user, addToast } = useApp();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropRef = useRef(null);
  const unread = NOTIFICATIONS.filter(n=>!n.read).length;

  useEffect(() => {
    const fn = e => { if(dropRef.current && !dropRef.current.contains(e.target)){setDropOpen(false);setNotifOpen(false);} };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const titles = { dashboard:"Dashboard", profile:"Profile", requests:"Blood Requests", notifications:"Notifications", history:"History", settings:"Settings" };

  return (
    <header className={`fixed top-8 right-0 h-16 z-20 flex items-center px-4 gap-4 border-b transition-all duration-300 ${dark?"bg-slate-900 border-slate-700":"bg-white border-slate-100 shadow-sm"} left-0 ${collapsed?"lg:left-[68px]":"lg:left-60"}`}>
      <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={()=>setSidebarOpen(!sidebarOpen)}>
        <Ico d={IC.menu} size={20} className="text-slate-500"/>
      </button>
      <div>
        <h1 className={`text-base font-bold ${dark?"text-white":"text-slate-800"}`}>{titles[active]||"Dashboard"}</h1>
        <p className="text-[11px] text-slate-400">{String(user.role).toUpperCase()==="HOSPITAL"?"Hospital / Blood Bank":"Donor"} Portal</p>
      </div>
      <div className="ml-auto flex items-center gap-2" ref={dropRef}>
        <button onClick={()=>setDark(!dark)} className={`p-2 rounded-xl transition-colors ${dark?"bg-slate-800 text-yellow-400 hover:bg-slate-700":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          <Ico d={dark?IC.sun:IC.moon} size={18}/>
        </button>
        {/* Bell */}
        <div className="relative">
          <button onClick={()=>{setNotifOpen(!notifOpen);setDropOpen(false);}} className={`relative p-2 rounded-xl transition-colors ${dark?"bg-slate-800 hover:bg-slate-700":"bg-slate-100 hover:bg-slate-200"}`}>
            <Ico d={IC.bell} size={18} className={dark?"text-slate-300":"text-slate-600"}/>
            {unread>0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
          </button>
          {notifOpen && (
            <div className={`absolute right-0 top-12 w-80 rounded-2xl border shadow-xl z-50 overflow-hidden ${dark?"bg-slate-800 border-slate-700":"bg-white border-slate-100"}`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between ${dark?"border-slate-700":"border-slate-100"}`}>
                <p className={`text-sm font-bold ${dark?"text-white":"text-slate-800"}`}>Notifications</p>
                <Badge color="red">{unread} new</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {NOTIFICATIONS.map(n=>(
                  <div key={n.id} className={`px-4 py-3 border-b last:border-0 ${dark?"border-slate-700":"border-slate-50"} ${!n.read?(dark?"bg-slate-700/50":"bg-cyan-50/50"):""}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type==="urgent"?"bg-red-500":n.type==="success"?"bg-green-500":"bg-cyan-500"}`}/>
                      <div>
                        <p className={`text-xs font-bold ${dark?"text-white":"text-slate-800"}`}>{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Avatar */}
        <div className="relative">
          <button onClick={()=>{setDropOpen(!dropOpen);setNotifOpen(false);}}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">{user.avatar}</div>
            <div className="hidden sm:block text-left">
              <p className={`text-xs font-bold leading-none ${dark?"text-white":"text-slate-800"}`}>{user.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{String(user.role).toUpperCase()==="HOSPITAL"?"Hospital":"Donor"}</p>
            </div>
            <Ico d={IC.chevronD} size={14} className="text-slate-400"/>
          </button>
          {dropOpen && (
            <div className={`absolute right-0 top-12 w-44 rounded-xl border shadow-lg z-50 overflow-hidden ${dark?"bg-slate-800 border-slate-700":"bg-white border-slate-100"}`}>
              {[{label:"View Profile",icon:IC.profile},{label:"Settings",icon:IC.settings}].map(item=>(
                <button key={item.label} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors ${dark?"text-slate-300 hover:bg-slate-700":"text-slate-600 hover:bg-slate-50"}`}>
                  <Ico d={item.icon} size={15}/>{item.label}
                </button>
              ))}
              <div className={`border-t ${dark?"border-slate-700":"border-slate-100"}`}/>
              <button onClick={()=>{addToast("Logged out","success");setDropOpen(false);}} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                <Ico d={IC.logout} size={15}/>Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Donor Sections ───────────────────────────────────────────────────────────
function DonorWelcomeCard() {
  const { user } = useApp();
  const hour = new Date().getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const daysAgo = Math.floor((Date.now()-new Date(user.lastDonation))/86400000);
  const eligible = daysAgo>=90;
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-cyan-700 to-slate-800 pointer-events-none"/>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"20px 20px"}}/>
      <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black text-white">{user.avatar}</div>
        <div className="flex-1">
          <p className="text-cyan-200 text-sm">{greeting} 👋</p>
          <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-cyan-100"><Ico d={IC.droplet} size={13} className="text-red-300"/>Blood Group: <strong>{user.bloodGroup}</strong></span>
            <span className="flex items-center gap-1.5 text-xs text-cyan-100"><Ico d={IC.mapPin} size={13}/>{user.location}</span>
          </div>
        </div>
        <div className={`shrink-0 text-center px-5 py-3 rounded-xl border ${eligible?"bg-green-500/20 border-green-400/30":"bg-orange-500/20 border-orange-400/30"}`}>
          <p className="text-xs text-white/70">Donation Status</p>
          <p className={`text-sm font-extrabold ${eligible?"text-green-300":"text-orange-300"}`}>{eligible?"✓ Eligible":`Wait ${90-daysAgo}d`}</p>
          <p className="text-[10px] text-white/50 mt-0.5">{daysAgo} days since last</p>
        </div>
      </div>
    </Card>
  );
}

function DonorProfileCard({ donations = [] }) {
  const { user, dark, addToast } = useApp();
  const [available, setAvailable] = useState(user.available);
  const totalDonations = donations.length;
  const livesSaved = totalDonations * 3;
  const donorSinceDate = user.createdAt ? new Date(user.createdAt) : null;
  const donorSince = donorSinceDate && !Number.isNaN(donorSinceDate.getTime())
    ? donorSinceDate.getFullYear()
    : "-";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold ${dark?"text-white":"text-slate-800"}`}>Profile Summary</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${available?"text-green-600":"text-slate-400"}`}>{available?"Active":"Inactive"}</span>
          <Toggle checked={available} onChange={()=>{setAvailable(!available);addToast(`Availability set to ${!available?"Active":"Inactive"}`,!available?"success":"info");}}/>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {icon:IC.droplet,val:totalDonations,label:"Donations",color:"text-red-500"},
          {icon:IC.users,val:livesSaved,label:"Lives Saved",color:"text-cyan-600"},
          {icon:IC.history,val:donorSince,label:"Donor Since",color:"text-violet-500"},
        ].map(s=>(
          <div key={s.label} className={`text-center p-3 rounded-xl ${dark?"bg-slate-700":"bg-slate-50"}`}>
            <Ico d={s.icon} size={18} className={`${s.color} mx-auto mb-1`}/>
            <p className={`text-lg font-extrabold ${dark?"text-white":"text-slate-800"}`}>{s.val}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      <div className={`rounded-xl p-3 flex items-center gap-3 ${dark?"bg-slate-700":"bg-cyan-50"}`}>
        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center"><Ico d={IC.shield} size={18} className="text-cyan-600"/></div>
        <div className="flex-1"><p className={`text-xs font-bold ${dark?"text-white":"text-slate-800"}`}>Verified Donor</p><p className="text-[11px] text-slate-400">Blood group confirmed · ID verified</p></div>
        <Badge color="green">✓ Verified</Badge>
      </div>
    </Card>
  );
}

function NearbyRequests() {
  const { dark, addToast } = useApp();
  const [radiusKm, setRadiusKm] = useState(1000);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const urgencyColor = { Critical:"red", Urgent:"orange", Normal:"green" };

  useEffect(() => {
    let mounted = true;

    const loadRequests = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getNearbyBloodRequests(radiusKm);
        if (mounted) setRequests(response?.data?.data || []);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || "Failed to fetch nearby requests");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRequests();
    return () => { mounted = false; };
  }, [radiusKm]);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-5">
        <SectionTitle sub="Blood requests near you matching your blood group">Nearby Blood Requests</SectionTitle>
        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className={`px-3 py-2 text-xs rounded-xl border-2 outline-none focus:border-cyan-500 font-bold ${dark?"bg-slate-700 border-slate-600 text-white":"bg-white border-slate-200 text-slate-700"}`}
        >
          {[10, 25, 50, 100, 500, 1000].map((radius) => (
            <option key={radius} value={radius}>{radius} km</option>
          ))}
        </select>
      </div>
      <div className="grid gap-3">
        {loading ? (
          <Card className="p-5 text-center text-sm text-slate-400">Loading nearby requests...</Card>
        ) : error ? (
          <Card className="p-5 text-center text-sm text-rose-500">{error}</Card>
        ) : requests.length === 0 ? (
          <Card className="p-5 text-center text-sm text-slate-400">No nearby requests found</Card>
        ) : requests.map(req=>(
          <Card key={req.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${req.urgency==="Critical"?"bg-red-100 text-red-700":req.urgency==="Urgent"?"bg-orange-100 text-orange-700":"bg-green-100 text-green-700"}`}>{req.bloodType}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-bold ${dark?"text-white":"text-slate-800"}`}>{req.hospital}</p>
                  <Badge color={urgencyColor[req.urgency]}>{req.urgency}</Badge>
                  {req.units && <Badge color="cyan">{req.units} unit{req.units > 1 ? "s" : ""}</Badge>}
                </div>
                {req.recipientName && <p className="text-[11px] text-slate-400 mt-1">Recipient: {req.recipientName}</p>}
                <div className="flex gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Ico d={IC.mapPin} size={11}/>{req.location} · {req.distance}</span>
                  <span className="text-xs text-slate-400">{req.time}</span>
                </div>
              </div>
              <button onClick={()=>addToast(`Contact sent to ${req.hospital}`,"success")} className="shrink-0 text-xs font-bold text-white bg-cyan-600 px-3 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-1.5">
                <Ico d={IC.phone} size={13}/> Contact
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DonationHistory({ donations: providedDonations = null, loading: providedLoading = null, error: providedError = null }) {
  const { dark, addToast } = useApp();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (providedDonations !== null) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadDonations = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getMyDonations();
        if (mounted) setDonations(response?.data?.data || []);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || "Failed to fetch donation history");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDonations();
    return () => { mounted = false; };
  }, [providedDonations]);

  const effectiveDonations = providedDonations ?? donations;
  const effectiveLoading = providedLoading ?? loading;
  const effectiveError = providedError ?? error;

  const displayRows = effectiveLoading
    ? [{ id: "loading", message: "Loading donation history..." }]
    : effectiveError
      ? [{ id: "error", message: effectiveError, isError: true }]
      : effectiveDonations;

  const openCertificate = (donation) => {
    if (!donation.certificateUrl) {
      addToast("Certificate is not available yet", "info");
      return;
    }
    window.open(donation.certificateUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <SectionTitle sub="Your complete donation record">Donation History</SectionTitle>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${dark?"border-slate-700":"border-slate-100"}`}>
                {["Date","Hospital","Blood Group","Units","Status","Certificate"].map(h=>(
                  <th key={h} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${dark?"text-slate-400":"text-slate-500"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${dark?"divide-slate-700":"divide-slate-50"}`}>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No donations found</td>
                </tr>
              ) : displayRows.map(d=> d.message ? (
                <tr key={d.id}>
                  <td colSpan={6} className={`px-4 py-8 text-center text-sm ${d.isError ? "text-rose-500" : "text-slate-400"}`}>{d.message}</td>
                </tr>
              ) : (
                <tr key={d.id} className={`transition-colors ${dark?"hover:bg-slate-700/50":"hover:bg-slate-50"}`}>
                  <td className={`px-4 py-3 font-medium text-xs ${dark?"text-slate-300":"text-slate-700"}`}>{d.date}</td>
                  <td className={`px-4 py-3 text-xs ${dark?"text-slate-300":"text-slate-600"}`}>{d.hospital}</td>
                  <td className="px-4 py-3"><Badge color="red">{d.bloodGroup}</Badge></td>
                  <td className={`px-4 py-3 text-xs ${dark?"text-slate-300":"text-slate-600"}`}>{d.units} unit</td>
                  <td className="px-4 py-3"><Badge color="green">✓ {d.status}</Badge></td>
                  <td className="px-4 py-3">
                    {d.certificate ? (
                      <button onClick={()=>openCertificate(d)} className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-semibold"><Ico d={IC.download} size={13}/>Download</button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Not issued</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DonorNotifications() {
  const { dark, addToast } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const typeStyle = {
    urgent:  { dot:"bg-red-500",   bg:dark?"bg-red-900/20 border-red-800":"bg-red-50 border-red-200" },
    info:    { dot:"bg-cyan-500",  bg:dark?"bg-cyan-900/20 border-cyan-800":"bg-cyan-50 border-cyan-200" },
    success: { dot:"bg-green-500", bg:dark?"bg-green-900/20 border-green-800":"bg-green-50 border-green-200" },
  };

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getNotifications();
        if (mounted) setNotifications(response?.data?.data || []);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || "Failed to fetch notifications");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNotifications();
    return () => { mounted = false; };
  }, []);

  const handleMarkRead = async (notification) => {
    if (!notification?.id || notification.read) return;

    try {
      await markNotificationRead(notification.id);
      setNotifications(current =>
        current.map(item => item.id === notification.id ? { ...item, read: true } : item)
      );
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || "Failed to mark notification read", "error");
    }
  };

  return (
    <div>
      <SectionTitle sub="Recent alerts and updates">Notifications</SectionTitle>
      <div className="space-y-3">
        {loading ? (
          <Card className="p-5 text-center text-sm text-slate-400">Loading notifications...</Card>
        ) : error ? (
          <Card className="p-5 text-center text-sm text-rose-500">{error}</Card>
        ) : notifications.length === 0 ? (
          <Card className="p-5 text-center text-sm text-slate-400">No notifications found</Card>
        ) : notifications.map(n=>{
          const s = typeStyle[n.type]||typeStyle.info;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => handleMarkRead(n)}
              className={`w-full text-left flex gap-3 p-4 rounded-2xl border transition-opacity ${s.bg} ${!n.read?"font-medium":"opacity-70"}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${s.dot} mt-1.5 shrink-0`}/>
              <div className="flex-1">
                <p className={`text-sm font-bold ${dark?"text-white":"text-slate-800"}`}>{n.title}</p>
                <p className={`text-xs mt-0.5 leading-relaxed ${dark?"text-slate-400":"text-slate-500"}`}>{n.body}</p>
                <p className="text-[10px] text-slate-400 mt-1.5">{n.time}</p>
              </div>
              {!n.read&&<div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 mt-2"/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hospital Sections ────────────────────────────────────────────────────────
function HospitalWelcomeCard() {
  const { user } = useApp();
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-cyan-900 to-slate-900 pointer-events-none"/>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"20px 20px"}}/>
      <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black text-white">{user.avatar}</div>
        <div className="flex-1">
          <p className="text-cyan-200 text-sm font-medium">Hospital Portal 🏥</p>
          <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
          <p className="text-cyan-300 text-sm mt-0.5">{user.hospital}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-xs text-cyan-100"><Ico d={IC.mapPin} size={13}/>{user.location}</span>
        </div>
        <div className="text-center px-5 py-2.5 rounded-xl bg-green-500/20 border border-green-400/30 shrink-0">
          <p className="text-[10px] text-white/70">Active Requests</p>
          <p className="text-xl font-extrabold text-green-300">{BLOOD_REQUESTS.filter(r=>r.status==="Pending").length}</p>
        </div>
      </div>
    </Card>
  );
}

function RequestStatus() {
  const { dark, addToast } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const urgencyColor = { Critical:"red", Urgent:"orange", Normal:"green" };
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  const statusMeta = {
    Pending: { color: "yellow", label: "Pending" },
    Matching: { color: "blue", label: "Matching" },
    Fulfilled: { color: "green", label: "Fulfilled" },
    Cancelled: { color: "gray", label: "Cancelled" },
  };
  const statusDisplay = {
    OPEN: "Pending",
    MATCHING: "Matching",
    FULFILLED: "Fulfilled",
    CANCELLED: "Cancelled",
  };

  useEffect(() => {
    let mounted = true;

    const loadRequests = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getMyBloodRequests();
        console.log("Fetched requests:", response?.data?.data || []);
        if (mounted) setRequests(response?.data?.data || []);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || "Failed to fetch your requests");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRequests();
    return () => { mounted = false; };
  }, []);

  const handleStatusUpdate = async (request, nextStatus) => {
    const requestId = request.requestId || request.id || request.request_id || request.requestID || request._id;
    if (!requestId) {
      addToast("Unable to update request status: missing request ID", "error");
      return;
    }
    if (updatingRequestId) return;

    // Log request and resolved identifier for debugging
    console.info('handleStatusUpdate: resolved identifier', { requestId, nextStatus, request });

    setUpdatingRequestId(requestId);

    try {
      await updateBloodRequestStatus(requestId, nextStatus);
      const nextDisplayStatus = statusDisplay[nextStatus] || nextStatus;
      setRequests(current =>
        current.map(item =>
          ((item.requestId || item.id) === requestId)
            ? { ...item, status: nextDisplayStatus, rawStatus: nextStatus }
            : item
        )
      );
      addToast(`Request marked ${nextDisplayStatus.toLowerCase()}`, "success");
    } catch (err) {
      console.error('handleStatusUpdate error', err);
      addToast(err?.response?.data?.message || err?.message || "Failed to update request status", "error");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  return (
    <div>
      <SectionTitle sub="Track the status of your submitted requests">Request Status</SectionTitle>
      <div className="grid gap-3">
        {loading ? (
          <Card className="p-5 text-center text-sm text-slate-400">Loading your requests...</Card>
        ) : error ? (
          <Card className="p-5 text-center text-sm text-rose-500">{error}</Card>
        ) : requests.length === 0 ? (
          <Card className="p-5 text-center text-sm text-slate-400">No requests found</Card>
        ) : requests.map((req,index)=>{
          const requestId = req.requestId || req.id || req.request_id || req.requestID || req._id;
          const isUpdating = updatingRequestId === requestId;
          const status = statusMeta[req.status] || statusMeta.Pending;

          return (
          <Card key={req.requestId || req.id || req.request_id || req.requestID || req._id || `${req.createdAt}-${index}`} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${req.urgency==="Critical"?"bg-red-100 text-red-700":req.urgency==="Urgent"?"bg-orange-100 text-orange-700":"bg-green-100 text-green-700"}`}>{req.bloodGroup}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-bold ${dark?"text-white":"text-slate-800"}`}>{req.hospital}</p>
                  <Badge color={urgencyColor[req.urgency]}>{req.urgency}</Badge>
                  <Badge color={status.color}>{status.label}</Badge>
                </div>
                {req.recipientName && <p className="text-[11px] text-slate-400 mt-1">Patient: {req.recipientName}</p>}
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="text-xs text-slate-400">{req.qty} unit{req.qty>1?"s":""}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Ico d={IC.mapPin} size={11}/>{req.city}</span>
                  <span className="text-xs text-slate-400">{req.date}</span>
                </div>
              </div>
              {(req.status==="Pending" || req.status==="Matching") && (
                <div className="shrink-0 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={()=>handleStatusUpdate(req, "FULFILLED")}
                    disabled={isUpdating}
                    className="text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-wait transition-colors"
                  >
                    {isUpdating ? "Saving..." : "Fulfill"}
                  </button>
                  <button
                    type="button"
                    onClick={()=>handleStatusUpdate(req, "CANCELLED")}
                    disabled={isUpdating}
                    className="text-xs font-bold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-60 disabled:cursor-wait transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </Card>
        )})}
      </div>
    </div>
  );
}

function DonorStats() {
  const { dark } = useApp();
  const [districtStats, setDistrictStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const total = districtStats.reduce((a,b)=>a+b.donors,0);
  const [bloodGroupStats, setBloodGroupStats] = useState([]);
  const [totalDonors, setTotalDonors] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadDistrictStats = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getDistrictDonorCount();
        if (mounted) setDistrictStats(response?.data?.data || []);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || "Failed to fetch district donor count");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDistrictStats();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    loadDonorStats();
}, []);

const loadDonorStats = async () => {
    try {

        const response = await getAllDonors();

        const donors = response.data.data || [];

        setTotalDonors(donors.length);

        const counts = {
            "O+": 0,
            "A+": 0,
            "B+": 0,
            "AB+": 0,
            "O-": 0,
            "A-": 0,
            "B-": 0,
            "AB-": 0
        };

        donors.forEach((donor) => {

            const group = donor.bloodGroup;

            if (counts[group] !== undefined) {
                counts[group]++;
            }
        });

        setBloodGroupStats([
            { name: "O+", value: counts["O+"], color: "#ef4444" },
            { name: "A+", value: counts["A+"], color: "#f97316" },
            { name: "B+", value: counts["B+"], color: "#eab308" },
            { name: "AB+", value: counts["AB+"], color: "#22c55e" },
            { name: "O-", value: counts["O-"], color: "#06b6d4" },
            { name: "A-", value: counts["A-"], color: "#8b5cf6" },
            { name: "B-", value: counts["B-"], color: "#ec4899" },
            { name: "AB-", value: counts["AB-"], color: "#64748b" }
        ]);

    } catch (error) {
        console.error(error);
    }
};

  return (
    <div>
      <SectionTitle sub="Available donor distribution across your region">Donor Availability Stats</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <p className={`text-sm font-bold mb-4 ${dark?"text-white":"text-slate-800"}`}>Donors by District</p>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">Loading district count...</div>
          ) : error ? (
            <div className="h-[200px] flex items-center justify-center text-center text-sm text-rose-500">{error}</div>
          ) : districtStats.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">No donor count found</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={districtStats} margin={{top:0,right:0,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark?"#334155":"#f1f5f9"}/>
                <XAxis dataKey="district" tick={{fontSize:10,fill:dark?"#94a3b8":"#64748b"}}/>
                <YAxis tick={{fontSize:10,fill:dark?"#94a3b8":"#64748b"}}/>
                <Tooltip contentStyle={{borderRadius:12,border:"none",background:dark?"#1e293b":"#fff",color:dark?"#fff":"#1e293b"}}/>
                <Bar dataKey="donors" fill="#0891B2" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="p-5">
          <p className={`text-sm font-bold mb-4 ${dark?"text-white":"text-slate-800"}`}>Donors by Blood Group</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={bloodGroupStats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {bloodGroupStats.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{borderRadius:12,border:"none",background:dark?"#1e293b":"#fff",color:dark?"#fff":"#1e293b"}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 grid grid-cols-2 gap-1">
              {bloodGroupStats.map(g=>(
                <div key={g.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:g.color}}/>
                  <span className="text-[11px] text-slate-500">{g.name}: <strong className={dark?"text-slate-300":"text-slate-700"}>{g.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
          <div className={`mt-3 pt-3 border-t text-center ${dark?"border-slate-700":"border-slate-100"}`}>
            <p className="text-xs text-slate-400">Total registered donors: <strong className={dark?"text-white":"text-slate-800"}>{loading ? "..." : totalDonors}</strong></p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AvailableDonors() {
  const { dark, addToast } = useApp();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterBlood, setFilterBlood] = useState("all");
  const [filterAvail, setFilterAvail] = useState("all");

  useEffect(() => {
    let mounted = true;

    const loadDonors = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getAllDonors();
        if (mounted) setDonors(response?.data?.data || []);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err?.message || "Failed to fetch donors");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDonors();
    return () => { mounted = false; };
  }, []);

  const filtered = donors.filter(d=>{
    const term = search.toLowerCase();
    const matchSearch = d.name.toLowerCase().includes(term)||d.location.toLowerCase().includes(term)||d.village.toLowerCase().includes(term);
    const matchBlood = filterBlood==="all"||d.blood===filterBlood;
    const matchAvail = filterAvail==="all"||(filterAvail==="yes"?d.available:!d.available);
    return matchSearch&&matchBlood&&matchAvail;
  });
  const sel = `px-3 py-2 text-sm rounded-xl border-2 outline-none transition-all focus:border-cyan-500 ${dark?"bg-slate-700 border-slate-600 text-white":"bg-white border-slate-200 text-slate-700"}`;
  return (
    <div>
      <SectionTitle sub="Search and contact available donors">Available Donors</SectionTitle>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-40 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"><Ico d={IC.search} size={14}/></div>
          <input placeholder="Search by name or village…" value={search} onChange={e=>setSearch(e.target.value)} className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border-2 outline-none transition-all focus:border-cyan-500 ${dark?"bg-slate-700 border-slate-600 text-white placeholder-slate-400":"bg-white border-slate-200 text-slate-700"}`}/>
        </div>
        <select value={filterBlood} onChange={e=>setFilterBlood(e.target.value)} className={sel}>
          <option value="all">All Blood Groups</option>
          {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g=><option key={`api-${g}`} value={g}>{g}</option>)}
          {["A+","A−","B+","B−","O+","O−","AB+","AB−"].map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterAvail} onChange={e=>setFilterAvail(e.target.value)} className={sel}>
          <option value="all">All Status</option><option value="yes">Available</option><option value="no">Unavailable</option>
        </select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${dark?"border-slate-700":"border-slate-100"}`}>
                {["Donor","Blood","Location","Last Donated","Status","Action"].map(h=>(
                  <th key={h} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${dark?"text-slate-400":"text-slate-500"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${dark?"divide-slate-700":"divide-slate-50"}`}>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">Loading donors...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-rose-500">{error}</td></tr>
              ) : filtered.length===0?<tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No donors found</td></tr>:filtered.map(d=>(
                <tr key={d.id} className={`transition-colors ${dark?"hover:bg-slate-700/50":"hover:bg-slate-50"}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center">{d.initials}</div><span className={`text-xs font-semibold ${dark?"text-white":"text-slate-800"}`}>{d.name}</span></div></td>
                  <td className="px-4 py-3"><Badge color="red">{d.blood}</Badge></td>
                  <td className={`px-4 py-3 text-xs ${dark?"text-slate-400":"text-slate-500"}`}>{d.location}</td>
                  <td className={`px-4 py-3 text-xs ${dark?"text-slate-400":"text-slate-500"}`}>{d.lastDonated}</td>
                  <td className="px-4 py-3"><Badge color={d.available?"green":"gray"}>{d.available?"✓ Available":"Unavailable"}</Badge></td>
                  <td className="px-4 py-3"><button onClick={()=>{if(d.available)addToast(`Contact sent to ${d.name}`,"success");}} disabled={!d.available} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${d.available?"text-white bg-cyan-600 hover:bg-cyan-700":"text-slate-400 bg-slate-100 cursor-not-allowed"}`}><Ico d={IC.phone} size={12}/> Contact</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PlaceholderPage({ title }) {
  const { dark } = useApp();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 ${dark?"bg-slate-800":"bg-slate-100"}`}><Ico d={IC.settings} size={36} className="text-slate-400"/></div>
      <h2 className={`text-xl font-bold mb-2 ${dark?"text-white":"text-slate-800"}`}>{title}</h2>
      <p className="text-slate-400 text-sm">This section is coming soon.</p>
    </div>
  );
}

// ─── Page Compositions ────────────────────────────────────────────────────────
function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [donationsError, setDonationsError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDonations = async () => {
      setDonationsLoading(true);
      setDonationsError("");

      try {
        const response = await getMyDonations();
        if (mounted) setDonations(response?.data?.data || []);
      } catch (err) {
        if (mounted) setDonationsError(err?.response?.data?.message || err?.message || "Failed to fetch donation history");
      } finally {
        if (mounted) setDonationsLoading(false);
      }
    };

    loadDonations();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-8">
      <DonorWelcomeCard/>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1"><DonorProfileCard donations={donations}/></div>
        <div className="lg:col-span-2"><NearbyRequests/></div>
      </div>
      <DonationHistory donations={donations} loading={donationsLoading} error={donationsError}/>
      <DonorNotifications/>
    </div>
  );
}

function HospitalDashboard() {
  return (
    <div className="space-y-8">
      <HospitalWelcomeCard/>
      <BloodRequestModule/>
      <RequestStatus/>
      <DonorStats/>
      <AvailableDonors/>
      <DonorNotifications/>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector(state => state.auth?.user);
  const tokenRole = extractRoleFromToken(localStorage.getItem("token"));
  const [role, setRole]               = useState(tokenRole || normalizeRole(localStorage.getItem("role")) || normalizeRole(authUser?.role));
  const [dark, setDark]               = useState(false);
  const [active, setActive]           = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [toasts, setToasts]           = useState([]);

  const roleKey = normalizeRole(role);
  const fallbackUser = roleKey === "DONOR" ? DONOR_USER : BANK_USER;
  const user = authUser ? { ...authUser, role: normalizeRole(authUser.role) || roleKey } : fallbackUser;

  useEffect(() => {
    const fetchDashboardProfile = async () => {
      const token = localStorage.getItem("token");
      const storedRole = normalizeRole(localStorage.getItem("role"));

      if (!token || !storedRole) return;

      try {
        const response = await apiFetchProfile();
        const profile = response?.data?.data || response?.data || {};
        const dashboardUser = mapProfileToDashboardUser(profile, token);
        dispatch(completeProfile(dashboardUser));
        setRole(dashboardUser.role || storedRole);
      } catch (error) {
        console.error("Failed to fetch profile:", error);

        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      }
    };

    fetchDashboardProfile();
  }, [dispatch, navigate]);

  const addToast = useCallback((message, type="info") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const removeToast = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

  const sidebarW = collapsed ? "lg:pl-[68px]" : "lg:pl-60";
  const bg = dark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900";

  const renderPage = () => {
    if (active === "dashboard")     return roleKey === "DONOR" ? <DonorDashboard/> : <HospitalDashboard/>;
    if (active === "requests")      return roleKey === "DONOR" ? <NearbyRequests/>  : <BloodRequestModule/>;
    if (active === "notifications") return <DonorNotifications/>;
    if (active === "history")       return roleKey === "DONOR" ? <DonationHistory/> : <RequestStatus/>;
    if (active === "profile")       return roleKey === "DONOR" ? <ProfilePage/> : <HospitalProfilePage/>;
    return <PlaceholderPage title={active.charAt(0).toUpperCase()+active.slice(1)}/>;
  };

  return (
    <AppContext.Provider value={{ dark, setDark, user, addToast }}>
      <div className={`min-h-screen font-sans antialiased ${bg} transition-colors duration-200`}>
        {false && <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center items-center gap-3 bg-slate-800 py-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Demo — Switch Role:</span>
          {[{val:"donor",label:"🩸 Donor"},{val:"hospital",label:"🏥 Hospital"}].map(r=>(
            <button key={r.val} onClick={()=>{setRole(r.val);setActive("dashboard");}}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${roleKey===String(r.val).toUpperCase()?"bg-cyan-600 text-white":"text-slate-400 hover:text-white"}`}>
              {r.label}
            </button>
          ))}
        </div>}

        <div>
          <Sidebar open={sidebarOpen} collapsed={collapsed} setCollapsed={setCollapsed}
            active={active} setActive={setActive} onClose={()=>setSidebarOpen(false)}/>
          <div className={`transition-all duration-300 ${sidebarW}`}>
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active={active} collapsed={collapsed}/>
            <main className="pt-20 min-h-screen">
              <div className="p-5 sm:p-7 max-w-6xl mx-auto" style={{animation:"fadeUp .35s ease"}}>
                {renderPage()}
              </div>
            </main>
          </div>
        </div>

        <Toast toasts={toasts} remove={removeToast}/>
      </div>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:none} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:99px; }
      `}</style>
    </AppContext.Provider>
  );
}
