import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BloodPicker from '../components/BloodPicker';
import LocationPicker from '../components/LocationPicker';
import { useToast } from '../components/Toast';
import { Field, Notice, Spinner } from '../components/ui';
import { errorMessage } from '../api/client';
import { createDonorProfile, createHospitalProfile } from '../api/profile';
import { loadProfile } from '../store/session';
import { toDateInput } from '../lib/format';
import { Brand } from '../components/Shell';

const yearsAgo = (n) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); return toDateInput(d); };

/** Editable place text fields (city/district/state are required by the backend). */
export function PlaceFields({ place, onChange }) {
  const set = (k) => (e) => onChange({ ...place, [k]: e.target.value });
  return (
    <div className="grid-3">
      <Field label="City or town"><input value={place?.city || ''} onChange={set('city')} /></Field>
      <Field label="District"><input value={place?.district || ''} onChange={set('district')} /></Field>
      <Field label="State"><input value={place?.state || ''} onChange={set('state')} /></Field>
    </div>
  );
}

export function validatePlace(place) {
  if (!place || !Number.isFinite(Number(place.lat))) return 'Set your location on the map.';
  if (!place.city?.trim() || !place.district?.trim() || !place.state?.trim()) return 'City, district and state are required.';
  return '';
}

export default function Onboarding() {
  const { role, profileStatus, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [place, setPlace] = useState(null);
  const [donor, setDonor] = useState({ name: '', phone: '', birthDate: '', bloodGroup: '' });
  const [hospital, setHospital] = useState({ hospitalName: '', licenseNumber: '', emergencyContact: '', website: '', addressLine: '' });

  if (!token) return <Navigate to="/login" replace />;
  if (role === 'ADMIN' || profileStatus === 'ready') return <Navigate to="/app" replace />;

  const isHospital = role === 'HOSPITAL';

  async function submit(e) {
    e.preventDefault();
    setError('');
    const placeError = validatePlace(place);

    if (isHospital) {
      if (!hospital.hospitalName.trim()) return setError('Hospital name is required.');
    } else {
      if (!donor.name.trim()) return setError('Your full name is required.');
      if (!/^[6-9]\d{9}$/.test(donor.phone.trim())) return setError('Enter a valid 10-digit Indian mobile number.');
      if (!donor.birthDate) return setError('Date of birth is required.');
      if (!donor.bloodGroup) return setError('Choose your blood group.');
    }
    if (placeError) return setError(placeError);

    setBusy(true);
    try {
      const geo = { lat: Number(place.lat), lon: Number(place.lon), city: place.city.trim(), district: place.district.trim(), state: place.state.trim() };
      if (isHospital) {
        await createHospitalProfile({ ...hospital, ...geo, licenseNumber: hospital.licenseNumber.trim() || undefined });
      } else {
        await createDonorProfile({ ...donor, ...geo, name: donor.name.trim(), phone: donor.phone.trim(), village: place.village || undefined, available: true });
      }
      await dispatch(loadProfile());
      toast.success(isHospital ? 'Hospital saved. An admin will verify it shortly.' : 'Profile saved. Thank you for signing up to donate.');
      navigate('/app', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '22px 20px 60px' }}>
      <Brand />
      <form className="stack" onSubmit={submit} noValidate style={{ marginTop: 10 }}>
        <div>
          <h1>{isHospital ? 'Tell us about your hospital' : 'Set up your donor profile'}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {isHospital
              ? 'Your location is used to search for donors. An admin verifies the hospital before it can raise requests.'
              : 'Your blood group and location decide which requests reach you. Only verified hospitals can see your contact details.'}
          </p>
        </div>

        {isHospital ? (
          <div className="panel stack">
            <Field label="Hospital name" htmlFor="hn"><input id="hn" value={hospital.hospitalName} onChange={(e) => setHospital({ ...hospital, hospitalName: e.target.value })} /></Field>
            <div className="grid-2">
              <Field label="Licence number" hint="Helps the admin verify you faster"><input value={hospital.licenseNumber} onChange={(e) => setHospital({ ...hospital, licenseNumber: e.target.value })} /></Field>
              <Field label="Emergency contact"><input inputMode="tel" value={hospital.emergencyContact} onChange={(e) => setHospital({ ...hospital, emergencyContact: e.target.value })} /></Field>
            </div>
            <div className="grid-2">
              <Field label="Website"><input type="url" placeholder="https://" value={hospital.website} onChange={(e) => setHospital({ ...hospital, website: e.target.value })} /></Field>
              <Field label="Street address"><input value={hospital.addressLine} onChange={(e) => setHospital({ ...hospital, addressLine: e.target.value })} /></Field>
            </div>
          </div>
        ) : (
          <div className="panel stack">
            <div className="grid-2">
              <Field label="Full name" htmlFor="nm"><input id="nm" autoComplete="name" value={donor.name} onChange={(e) => setDonor({ ...donor, name: e.target.value })} /></Field>
              <Field label="Mobile number" htmlFor="ph" hint="10 digits, starting with 6–9"><input id="ph" inputMode="tel" maxLength={10} value={donor.phone} onChange={(e) => setDonor({ ...donor, phone: e.target.value.replace(/\D/g, '') })} /></Field>
            </div>
            <Field label="Date of birth" htmlFor="dob" hint="Donors must be between 18 and 65">
              <input id="dob" type="date" min={yearsAgo(65)} max={yearsAgo(18)} value={donor.birthDate} onChange={(e) => setDonor({ ...donor, birthDate: e.target.value })} />
            </Field>
            <Field label="Blood group"><BloodPicker value={donor.bloodGroup} onChange={(g) => setDonor({ ...donor, bloodGroup: g })} /></Field>
          </div>
        )}

        <div className="panel stack">
          <h2>{isHospital ? 'Hospital location' : 'Where do you live?'}</h2>
          <LocationPicker value={place} onChange={setPlace} height={300} />
          {place && <PlaceFields place={place} onChange={setPlace} />}
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        <div><button className="btn btn-primary btn-lg" type="submit" disabled={busy}>{busy && <Spinner />} Save and continue</button></div>
      </form>
    </div>
  );
}
