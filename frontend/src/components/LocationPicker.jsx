import { useEffect, useRef, useState } from 'react';
import MapView from './MapView';
import Icon from './Icon';
import { Field, Notice, Spinner, Tag } from './ui';
import { currentPosition, geocodeKarnataka, hasCoords, reversePlace, searchPlaces } from '../lib/geo';

/** District → taluk → village drill-down using the bundled Karnataka dataset. */
function KarnatakaPicker({ onPlace }) {
  const [data, setData] = useState(null);
  const [district, setDistrict] = useState('');
  const [taluk, setTaluk] = useState('');
  const [village, setVillage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    import('../assets/karnataka_data.json').then((m) => alive && setData(m.default.Karnataka));
    return () => { alive = false; };
  }, []);

  if (!data) return <div className="row muted"><Spinner /> Loading districts…</div>;

  const districts = Object.keys(data).sort();
  const taluks = district ? Object.keys(data[district]).sort() : [];
  const villages = district && taluk ? [...data[district][taluk]].sort() : [];

  async function place() {
    setBusy(true); setError('');
    try {
      const p = await geocodeKarnataka({ village, taluk, district });
      if (!p) setError('Could not find that place on the map. Search by name instead.');
      else onPlace(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-s">
      <div className="grid-3">
        <Field label="District">
          <select value={district} onChange={(e) => { setDistrict(e.target.value); setTaluk(''); setVillage(''); }}>
            <option value="">Select</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Taluk">
          <select value={taluk} onChange={(e) => { setTaluk(e.target.value); setVillage(''); }} disabled={!district}>
            <option value="">Select</option>
            {taluks.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Village">
          <select value={village} onChange={(e) => setVillage(e.target.value)} disabled={!taluk}>
            <option value="">Any / taluk centre</option>
            {villages.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div><button type="button" className="btn btn-sm" onClick={place} disabled={!district || busy}>{busy ? <Spinner /> : <Icon name="pin" size={16} />} Place on map</button></div>
    </div>
  );
}

/**
 * value: { lat, lon, label, village, city, district, state, precision } | null
 * Users can search a place, use their GPS, click/drag on the map, or pick a Karnataka village.
 */
export default function LocationPicker({ value, onChange, radiusKm, height = 300 }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [showKA, setShowKA] = useState(false);
  const seq = useRef(0);

  const center = hasCoords(value) ? { lat: Number(value.lat), lng: Number(value.lon) } : null;

  async function search(e) {
    e.preventDefault();
    if (q.trim().length < 3) { setError('Type at least 3 characters.'); return; }
    setBusy('search'); setError(''); setResults([]);
    try {
      const found = await searchPlaces(q);
      if (!found.length) setError('No matching place. Try a nearby town, or use the district picker below.');
      setResults(found);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  function choose(place) {
    onChange({ ...place, precision: 'exact' });
    setResults([]); setQ(''); setError('');
  }

  async function pick(lat, lon) {
    const id = ++seq.current;
    onChange({ ...(value || {}), lat, lon, label: 'Finding address…', precision: 'pin' });
    try {
      const place = await reversePlace(lat, lon);
      if (id === seq.current) onChange({ ...place, precision: 'pin' });
    } catch {
      if (id === seq.current) onChange({ ...(value || {}), lat, lon, label: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, precision: 'pin' });
    }
  }

  async function locate() {
    setBusy('locate'); setError('');
    try {
      const { lat, lon } = await currentPosition();
      await pick(lat, lon);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="stack-s">
      <form className="picker-search" onSubmit={search}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a village, town or landmark" aria-label="Search a place" />
        <button className="btn" type="submit" disabled={busy === 'search'}>{busy === 'search' ? <Spinner /> : <Icon name="search" size={16} />} Search</button>
        <button className="btn" type="button" onClick={locate} disabled={busy === 'locate'} title="Use my current location">
          {busy === 'locate' ? <Spinner /> : <Icon name="locate" size={16} />}
          <span className="sr-only">Use my location</span>
        </button>
      </form>

      {error && <Notice tone="error">{error}</Notice>}
      {results.length > 0 && (
        <div className="results" role="listbox">
          {results.map((r, i) => (
            <button type="button" key={`${r.lat}-${r.lon}-${i}`} onClick={() => choose(r)}>
              <div style={{ fontWeight: 600 }}>{r.label.split(',').slice(0, 2).join(',')}</div>
              <div className="small muted">{r.label}</div>
            </button>
          ))}
        </div>
      )}

      <MapView center={center} radiusKm={radiusKm} onPick={pick} draggableCenter height={height} />

      <div className="row wrap between small">
        <div className="row muted">
          <Icon name="pin" size={16} />
          <span>{center ? (value.label || `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`) : 'Search, use GPS, or click the map to set the location.'}</span>
        </div>
        {value?.precision === 'taluk' && <Tag tone="warn">Placed at taluk centre. Drag the pin to refine</Tag>}
        {value?.precision === 'district' && <Tag tone="warn">Placed at district centre. Drag the pin to refine</Tag>}
      </div>

      <div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowKA((s) => !s)} aria-expanded={showKA}>
          {showKA ? 'Hide district picker' : 'Pick by district, taluk and village'}
        </button>
      </div>
      {showKA && <KarnatakaPicker onPlace={(p) => { onChange(p); setError(''); }} />}
    </div>
  );
}
