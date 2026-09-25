// import { useEffect, useState } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Circle,
//   useMapEvents,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // ✅ Fix marker icon issue
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
//   iconUrl:
//     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
//   shadowUrl:
//     "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
// });

// export default function MapPage({ center = null, donors = [], radiusKm = 10, checkedDonors = null, onMarkerClick = () => {}, selectedDonor = null, mapHeight = "100%" }) {
//   // position: either controlled by `center` prop or local geolocation
//   const initial = center ? (Array.isArray(center) ? center : [center.lat, center.lng]) : [12.9716, 77.5946];
//   const [position, setPosition] = useState(initial); // default Bangalore

//   // ✅ Get user location
//   useEffect(() => {
//     if (!center) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           setPosition([pos.coords.latitude, pos.coords.longitude]);
//         },
//         (err) => {
//           console.log("Location permission denied, using default.");
//         }
//       );
//     }
//   }, []);

//   // when parent provides a center, update local position
//   useEffect(() => {
//     if (center) {
//       const c = Array.isArray(center) ? center : [center.lat, center.lng];
//       setPosition(c);
//     }
//   }, [center]);

//   // ✅ Click on map to change location
//   function LocationPicker() {
//     useMapEvents({
//       click(e) {
//         setPosition([e.latlng.lat, e.latlng.lng]);
//       },
//     });
//     return null;
//   }

//   return (
//     <div style={{ height: mapHeight, width: "100%" }}>
//       <MapContainer center={position} zoom={13} style={{ height: "100%" }}>
//         {/* OpenStreetMap tiles */}
//         <TileLayer
//           attribution="© OpenStreetMap contributors"
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />

//         {/* User / center Marker */}
//         <Marker position={position}>
//           <Popup>Your Selected Location</Popup>
//         </Marker>

//         {/* Radius */}
//         <Circle center={position} radius={radiusKm * 1000} />

//         {/* Donor markers (if any) */}
//         {donors.map((d) => {
//           const inRadius = checkedDonors && checkedDonors.some(c => c.id === d.id);
//           const color = !d.available ? "#94a3b8" : inRadius ? "#22c55e" : "#0891B2";
//           return (
//             <Circle
//               key={d.id}
//               center={[d.lat, d.lng]}
//               radius={60}
//               pathOptions={{ color, fillColor: color, fillOpacity: 1 }}
//               eventHandlers={{ click: () => onMarkerClick(d) }}
//             >
//               <Popup>
//                 <div style={{minWidth:140}}>
//                   <div style={{fontWeight:700}}>{d.name}</div>
//                   <div style={{fontSize:12}}>{d.bloodGroup} • {d.village}</div>
//                 </div>
//               </Popup>
//             </Circle>
//           );
//         })}

//         {/* Click Handler to move center */}
//         <LocationPicker />
//       </MapContainer>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ==============================
// Hospital RED Marker
// ==============================
const hospitalIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// ==============================
// Donor BLUE Marker
// ==============================
const donorIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function ChangeMapView({ center }) {

  const map = useMap();

  useEffect(() => {

    if (
      center &&
      center.lat !== undefined &&
      center.lng !== undefined
    ) {

      const newCenter = [center.lat, center.lng];

      map.setView(newCenter, 13, {
        animate: true,
      });

      // Important
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    }

  }, [center, map]);

  return null;
}

export default function MapPage({
  center = null,
  donors = [],
  radiusKm = 10,
  checkedDonors = null,
  onMarkerClick = () => {},
  selectedDonor = null,
  mapHeight = "100%",
}) {

  const initial = Array.isArray(center)
  ? center
  : center?.lat && center?.lng
    ? [center.lat, center.lng]
    : [12.9716, 77.5946];

  const [position, setPosition] = useState(initial);

  // ==============================
  // Current location if no center
  // ==============================
  useEffect(() => {
    if (!center) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([
            pos.coords.latitude,
            pos.coords.longitude
          ]);
        },
        () => {
          console.log("Location permission denied");
        }
      );
    }
  }, []);

  // ==============================
  // Update center dynamically
  // ==============================
  useEffect(() => {
    if (center) {
      const c = Array.isArray(center)
        ? center
        : [center.lat, center.lng];

      setPosition(c);
    }
  }, [center]);

  // ==============================
  // Optional click move
  // ==============================
  function LocationPicker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });

    return null;
  }

  return (
    <div style={{ height: mapHeight, width: "100%" }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <ChangeMapView
          center={{
            lat: position[0],
            lng: position[1],
          }}
        />

        {/* Map Tiles */}
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ==============================
            Hospital Marker (RED)
        ============================== */}
        <Marker position={position} icon={hospitalIcon}>
          <Popup>
            <div>
              <b>Hospital Location</b>
            </div>
          </Popup>
        </Marker>

        {/* Radius Circle */}
        <Circle
          center={position}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "red",
            fillColor: "#f03",
            fillOpacity: 0.08,
          }}
        />

        {/* ==============================
            Donor Markers (BLUE)
        ============================== */}
        {donors.map((d) => (
          <Marker
            key={d.id}
            position={[d.lat, d.lng]}
            icon={donorIcon}
            eventHandlers={{
              click: () => onMarkerClick(d),
            }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700 }}>
                  {d.name}
                </div>

                <div style={{ fontSize: 12 }}>
                  {d.bloodGroup}
                </div>

                <div style={{ fontSize: 12 }}>
                  {d.village}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    color: d.available
                      ? "green"
                      : "gray",
                  }}
                >
                  {d.available
                    ? "Available"
                    : "Unavailable"}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <LocationPicker />
      </MapContainer>
    </div>
  );
}