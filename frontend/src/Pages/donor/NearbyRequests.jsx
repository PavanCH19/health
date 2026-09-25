import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import MapView from '../../components/MapView';
import Icon from '../../components/Icon';
import { BloodDrop, Empty, Notice, Skeleton, Tag } from '../../components/ui';
import { useAsync } from '../../lib/hooks';
import { getNearbyRequests } from '../../api/requests';
import { bloodLabel, urgencyLabel, urgencyTone } from '../../lib/bloods';
import { fmtDateTime, fmtKm } from '../../lib/format';

const RADII = [10, 25, 50, 100];

export default function NearbyRequests() {
  const profile = useSelector((s) => s.auth.profile);
  const [radiusKm, setRadiusKm] = useState(25);
  const [selected, setSelected] = useState(null);
  const { data, loading, error, reload } = useAsync(() => getNearbyRequests(radiusKm), [radiusKm]);

  const center = profile && Number.isFinite(profile.lat) ? { lat: profile.lat, lng: profile.lng } : null;
  const markers = useMemo(() => (data || []).map((r) => ({
    id: r.id, lat: r.lat, lng: r.lng, tone: urgencyTone(r.urgency), label: bloodLabel(r.bloodGroup),
  })), [data]);

  if (!center) {
    return (
      <div className="page">
        <Notice tone="warn">Add your location to your profile to see nearby requests. <a href="/app/profile">Update profile</a></Notice>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Requests near you</h1>
          <p>Only requests your blood group ({bloodLabel(profile.bloodGroup)}) can serve are shown.</p>
        </div>
        <div className="seg" role="group" aria-label="Search radius">
          {RADII.map((r) => <button key={r} aria-pressed={radiusKm === r} onClick={() => setRadiusKm(r)}>{r} km</button>)}
        </div>
      </div>

      {error && <Notice tone="error">{error} <button className="btn btn-sm" onClick={reload} style={{ marginLeft: 10 }}>Retry</button></Notice>}

      <div className="split">
        <div className="split-list">
          {loading && !data ? <Skeleton h={96} count={4} /> : (data || []).length === 0 ? (
            <Empty title="No matching requests within this radius">Try a wider search radius, or check back soon.</Empty>
          ) : (
            data.map((r) => (
              <button key={r.id} className={`item ${selected === r.id ? 'selected' : ''}`} onClick={() => setSelected(r.id)}>
                <BloodDrop group={r.bloodGroup} size="sm" />
                <div className="grow">
                  <div className="row between">
                    <span className="title">{r.hospitalName}</span>
                    <Tag tone={urgencyTone(r.urgency)}>{urgencyLabel(r.urgency)}</Tag>
                  </div>
                  <div className="meta">{r.units} unit(s) · {r.city}{r.district ? `, ${r.district}` : ''} · {fmtKm(r.distanceKm)}</div>
                  {selected === r.id && (
                    <div className="stack-s" style={{ marginTop: 8 }}>
                      {r.patientName && <div className="small">Patient: {r.patientName}</div>}
                      {r.requiredBefore && <div className="small muted">Needed by {fmtDateTime(r.requiredBefore)}</div>}
                      <div className="actions">
                        {r.contactPhone && <a className="btn btn-sm btn-primary" href={`tel:${r.contactPhone}`}><Icon name="phone" size={15} /> Call {r.contactName || 'contact'}</a>}
                        <a className="btn btn-sm" href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=15/${r.lat}/${r.lng}`} target="_blank" rel="noreferrer"><Icon name="map" size={15} /> Directions</a>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="split-map">
          <MapView
            center={center}
            radiusKm={radiusKm}
            centerStyle="you"
            markers={markers}
            selectedId={selected}
            onSelect={setSelected}
            legend={[
              { label: 'Critical / urgent', color: 'var(--primary)' },
              { label: 'Soon', color: 'var(--warn)' },
              { label: 'Routine', color: 'var(--ok)' },
              { label: 'You', color: 'var(--info)' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
