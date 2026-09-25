import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView from '../../components/MapView';
import LocationPicker from '../../components/LocationPicker';
import BloodPicker from '../../components/BloodPicker';
import Icon from '../../components/Icon';
import { BloodDrop, Empty, Field, Notice, Skeleton, Tag, Toggle } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../api/client';
import { searchDonors } from '../../api/donors';
import { notifyDonorsForRequest, getMyRequests } from '../../api/requests';
import { bloodLabel, donorsFor } from '../../lib/bloods';
import { fmtDate, fmtKm } from '../../lib/format';

const RADII = [5, 10, 25, 50, 100];

export default function FindDonors() {
  const [params, setParams] = useSearchParams();
  const requestId = params.get('requestId') ? Number(params.get('requestId')) : null;
  const profile = useSelector((s) => s.auth.profile);
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [origin, setOrigin] = useState(
    profile?.lat ? { lat: profile.lat, lon: profile.lon, label: profile.hospitalName } : null,
  );
  const [radiusKm, setRadiusKm] = useState(25);
  const [forRecipient, setForRecipient] = useState(''); // compatibility mode
  const [bloodGroup, setBloodGroup] = useState('');      // exact-group mode
  const [availableOnly, setAvailableOnly] = useState(true);
  const [donors, setDonors] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [notifying, setNotifying] = useState(false);

  const activeRequest = requests.find((r) => r.id === requestId) || null;

  useEffect(() => {
    getMyRequests().then((list) => {
      setRequests(list);
      const req = list.find((r) => r.id === requestId);
      if (req) {
        setForRecipient(req.bloodGroup);
        if (Number.isFinite(req.latitude)) setOrigin({ lat: req.latitude, lon: req.longitude, label: `${req.patientName} · ${req.hospitalName}` });
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  async function runSearch(e) {
    e?.preventDefault();
    if (!origin) { setError('Set a location to search around.'); return; }
    setLoading(true); setError(''); setSelected(null);
    try {
      const results = await searchDonors({
        lat: origin.lat, lon: origin.lon, radiusKm, forRecipient: forRecipient || undefined,
        bloodGroup: forRecipient ? undefined : bloodGroup || undefined, available: availableOnly || undefined,
      });
      setDonors(results);
      if (results.length === 0) toast.info('No donors matched. Try a wider radius or fewer filters.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (origin) runSearch(); /* initial */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function notifyAll() {
    if (!activeRequest) return;
    setNotifying(true);
    try {
      const matched = await notifyDonorsForRequest(activeRequest.id, radiusKm);
      toast.success(`${matched.length} compatible donor(s) within ${radiusKm} km were notified.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setNotifying(false);
    }
  }

  const markers = useMemo(() => (donors || []).map((d) => ({
    id: d.id, lat: d.lat, lng: d.lon, tone: d.eligible ? 'ok' : 'muted', label: bloodLabel(d.bloodGroup),
  })), [donors]);

  const compatibleGroups = forRecipient ? donorsFor(forRecipient) : null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Find donors</h1>
          <p>{activeRequest ? <>Searching for <BloodDrop group={activeRequest.bloodGroup} size="sm" /> {' '}compatible donors for <b>{activeRequest.patientName}</b>.</> : 'Search any place, or link this from a request to auto-fill the blood group and location.'}</p>
        </div>
        {activeRequest && (
          <button className="btn btn-primary" onClick={notifyAll} disabled={notifying}>
            {notifying ? 'Notifying…' : <><Icon name="bell" size={16} /> Notify matching donors</>}
          </button>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <form className="stack" onSubmit={runSearch}>
          <LocationPicker value={origin} onChange={setOrigin} height={220} />
          <div className="grid-3">
            <Field label="Radius">
              <div className="seg">{RADII.map((r) => <button type="button" key={r} aria-pressed={radiusKm === r} onClick={() => setRadiusKm(r)}>{r} km</button>)}</div>
            </Field>
            <Field label="Compatible with recipient group" hint="Leave as Any to filter by exact donor group instead">
              <select value={forRecipient} onChange={(e) => { setForRecipient(e.target.value); setBloodGroup(''); }}>
                <option value="">Any</option>
                {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map((g) => <option key={g} value={g}>{bloodLabel(g)}</option>)}
              </select>
            </Field>
            <Field label="Only available donors">
              <div className="row" style={{ height: 40 }}><Toggle checked={availableOnly} onChange={setAvailableOnly} label="Only available donors" /><span className="small muted">Skip donors who marked themselves unavailable</span></div>
            </Field>
          </div>
          {!forRecipient && (
            <Field label="Exact donor blood group"><BloodPicker value={bloodGroup} onChange={setBloodGroup} allowAny /></Field>
          )}
          {compatibleGroups && <div className="small muted">Matches donor groups: {compatibleGroups.map(bloodLabel).join(', ')}</div>}
          <div><button className="btn btn-primary" disabled={loading}>{loading ? 'Searching…' : <><Icon name="search" size={16} /> Search</>}</button></div>
        </form>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="split">
        <div className="split-list">
          {loading ? <Skeleton h={90} count={4} /> : donors == null ? null : donors.length === 0 ? (
            <Empty title="No donors found">Try a wider radius, remove filters, or switch off "available only".</Empty>
          ) : (
            <>
              <div className="small muted">{donors.length} donor{donors.length === 1 ? '' : 's'} found</div>
              {donors.map((d) => (
                <button key={d.id} className={`item ${selected === d.id ? 'selected' : ''}`} onClick={() => setSelected(d.id)}>
                  <BloodDrop group={d.bloodGroup} size="sm" tone={d.eligible ? '' : 'muted'} />
                  <div className="grow">
                    <div className="row between">
                      <span className="title">{d.name}</span>
                      {d.eligible ? <Tag tone="ok">Eligible</Tag> : <Tag>In cooldown</Tag>}
                    </div>
                    <div className="meta">{d.city}{d.district ? `, ${d.district}` : ''} · {fmtKm(d.distanceKm)}</div>
                    {selected === d.id && (
                      <div className="actions">
                        {d.phone && <a className="btn btn-sm btn-primary" href={`tel:${d.phone}`}><Icon name="phone" size={14} /> Call</a>}
                        <a className="btn btn-sm" href={`https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lon}#map=15/${d.lat}/${d.lon}`} target="_blank" rel="noreferrer"><Icon name="map" size={14} /> Directions</a>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
        <div className="split-map">
          <MapView
            center={origin ? { lat: origin.lat, lng: origin.lon } : null}
            radiusKm={radiusKm}
            markers={markers}
            selectedId={selected}
            onSelect={setSelected}
            legend={[{ label: 'Eligible now', color: 'var(--ok)' }, { label: 'In cooldown', color: 'var(--muted)' }, { label: 'Search origin', color: 'var(--ink)' }]}
          />
        </div>
      </div>
    </div>
  );
}
