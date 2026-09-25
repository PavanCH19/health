import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BloodPicker from '../../components/BloodPicker';
import LocationPicker from '../../components/LocationPicker';
import { PlaceFields, validatePlace } from '../Onboarding';
import { Field, Notice, Spinner } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { errorMessage } from '../../api/client';
import { createRequest } from '../../api/requests';
import { URGENCY } from '../../lib/bloods';
import { toDateTimeInput, toLocalDateTime } from '../../lib/format';

export default function NewRequest() {
  const profile = useSelector((s) => s.auth.profile);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    bloodGroup: '', unitsRequired: 1, urgency: 'MEDIUM', patientName: '',
    contactName: '', contactPhone: '', requiredBefore: '',
  });
  const [place, setPlace] = useState(
    profile?.lat ? { lat: profile.lat, lon: profile.lon, city: profile.city, district: profile.district, state: profile.state, label: `${profile.hospitalName}, ${profile.city}` } : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (profile && !profile.verifiedByAdmin) {
    return <div className="page" style={{ maxWidth: 640 }}><Notice tone="warn">Your hospital must be verified by an admin before you can create requests.</Notice></div>;
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.bloodGroup) return setError('Choose the blood group needed.');
    if (!form.unitsRequired || Number(form.unitsRequired) < 1) return setError('Units required must be at least 1.');
    if (!form.patientName.trim()) return setError('Patient name is required.');
    if (!form.contactName.trim() || !/^[6-9]\d{9}$/.test(form.contactPhone.trim())) return setError('Provide a contact name and a valid 10-digit phone number.');
    const placeErr = validatePlace(place);
    if (placeErr) return setError(placeErr);
    if (form.requiredBefore && new Date(form.requiredBefore) <= new Date()) return setError('The "needed by" time must be in the future.');

    setBusy(true);
    try {
      const id = await createRequest({
        bloodGroup: form.bloodGroup, unitsRequired: Number(form.unitsRequired), urgency: form.urgency,
        patientName: form.patientName.trim(), contactName: form.contactName.trim(), contactPhone: form.contactPhone.trim(),
        hospitalName: profile?.hospitalName, notes: form.notes,
        city: place.city.trim(), district: place.district.trim(), state: place.state.trim(),
        latitude: Number(place.lat), longitude: Number(place.lon),
        requiredBefore: toLocalDateTime(form.requiredBefore),
      });
      toast.success('Request created. Find donors now, or do it later from Requests.');
      navigate(id ? `/app/find?requestId=${id}` : '/app/requests');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head"><div><h1>New blood request</h1><p>Compatible donors within your search radius will be notified once you find donors.</p></div></div>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="panel stack">
          <Field label="Blood group needed"><BloodPicker value={form.bloodGroup} onChange={(g) => setForm({ ...form, bloodGroup: g })} /></Field>
          <div className="grid-2">
            <Field label="Units required"><input type="number" min={1} value={form.unitsRequired} onChange={set('unitsRequired')} /></Field>
            <Field label="Urgency">
              <select value={form.urgency} onChange={set('urgency')}>
                {URGENCY.map((u) => <option key={u.value} value={u.value}>{u.label} — {u.hint}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Needed by (optional)"><input type="datetime-local" min={toDateTimeInput()} value={form.requiredBefore} onChange={set('requiredBefore')} /></Field>
        </div>

        <div className="panel stack">
          <h2>Patient and contact</h2>
          <Field label="Patient name"><input value={form.patientName} onChange={set('patientName')} /></Field>
          <div className="grid-2">
            <Field label="Contact person"><input value={form.contactName} onChange={set('contactName')} /></Field>
            <Field label="Contact phone"><input inputMode="tel" maxLength={10} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value.replace(/\D/g, '') })} /></Field>
          </div>
          <Field label="Notes (optional)"><textarea value={form.notes || ''} onChange={set('notes')} /></Field>
        </div>

        <div className="panel stack">
          <h2>Where is the blood needed?</h2>
          <LocationPicker value={place} onChange={setPlace} height={280} />
          {place && <PlaceFields place={place} onChange={setPlace} />}
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        <div><button className="btn btn-primary btn-lg" disabled={busy}>{busy && <Spinner />} Create request</button></div>
      </form>
    </div>
  );
}
