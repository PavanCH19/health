import { useEffect } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KARNATAKA_CENTER } from '../lib/geo';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const iconCache = new Map();

/** Drop-shaped pin drawn in CSS (no external image files). */
function pinIcon({ tone = 'primary', label = '', size = 34, selected = false }) {
  const key = `${tone}|${label}|${size}|${selected}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, L.divIcon({
      className: 'pin-wrap',
      html: `<div class="pin ${tone} ${selected ? 'sel' : ''}" style="--s:${size}px"><span>${esc(label)}</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, Math.round(size * 1.2)],
      popupAnchor: [0, -Math.round(size * 1.1)],
    }));
  }
  return iconCache.get(key);
}

const youIcon = L.divIcon({ className: 'pin-wrap', html: '<div class="pin-you"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

function Controller({ center, radiusKm, selected, onPick }) {
  const map = useMap();

  // keep tiles correct when the container resizes (tabs, responsive layout)
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [map]);

  // frame the search circle whenever the origin or radius changes
  useEffect(() => {
    if (!center) return;
    if (radiusKm > 0) {
      map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radiusKm * 2000), { padding: [24, 24], maxZoom: 15 });
    } else {
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 13));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, radiusKm, map]);

  // focus the marker chosen in the list
  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, map]);

  useMapEvents({ click: (e) => onPick?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

/**
 * markers: [{ id, lat, lng, tone, label, size, popup }]
 * center:  { lat, lng } search origin (rendered as "you" dot or a draggable pin)
 */
export default function MapView({
  center, radiusKm, markers = [], selectedId, onSelect, onPick, draggableCenter = false,
  centerStyle = 'pin', legend, height = '100%',
}) {
  const initial = center ? [center.lat, center.lng] : [KARNATAKA_CENTER.lat, KARNATAKA_CENTER.lng];
  const selected = markers.find((m) => m.id === selectedId) || null;

  return (
    <div className="map-shell" style={{ height }}>
      <MapContainer center={initial} zoom={center ? 12 : 7} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Controller center={center} radiusKm={radiusKm} selected={selected} onPick={onPick} />

        {center && radiusKm > 0 && (
          <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000}
            pathOptions={{ color: '#b8101f', weight: 1.5, fillColor: '#b8101f', fillOpacity: 0.06 }} interactive={false} />
        )}

        {center && (
          <Marker
            position={[center.lat, center.lng]}
            icon={centerStyle === 'you' ? youIcon : pinIcon({ tone: 'ink', label: '+', size: 32 })}
            draggable={draggableCenter}
            zIndexOffset={1000}
            eventHandlers={draggableCenter ? {
              dragend: (e) => { const p = e.target.getLatLng(); onPick?.(p.lat, p.lng); },
            } : undefined}
          />
        )}

        {markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng)).map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={pinIcon({ tone: m.tone, label: m.label, size: m.size || 34, selected: m.id === selectedId })}
            zIndexOffset={m.id === selectedId ? 900 : 0}
            eventHandlers={{ click: () => onSelect?.(m.id) }}
          >
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
      {legend && (
        <div className="map-legend">
          {legend.map((l) => <span key={l.label}><i style={{ background: l.color }} />{l.label}</span>)}
        </div>
      )}
    </div>
  );
}
