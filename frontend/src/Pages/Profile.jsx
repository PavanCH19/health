import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BloodPicker from '../components/BloodPicker';
import LocationPicker from '../components/LocationPicker';
import { PlaceFields, validatePlace } from './Onboarding';
import { useToast } from '../components/Toast';
import { Field, Notice, Spinner, Toggle, Tag } from '../components/ui';
import { errorMessage } from '../api/client';
import { deleteDonorProfile, deleteHospitalProfile, updateDonorProfile, updateHospitalProfile } from '../api/profile';
import { endSession, loadProfile } from '../store/session';
import { bloodLabel } from '../lib/bloods';
import { fmtDate, toDateInput } from '../lib/format';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

function DonorProfileForm({ profile }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [form, setForm] = useState({ name: profile.name || '', phone: profile.phone || '', birthDate: profile.birthDate || '', bloodGroup: profile.bloodGroup || '' });
  const [place, setPlace] = useState({ lat: profile.lat, lon: profile.lng, city: profile.city, district: profile.district, state: profile.state, label: `${profile.city}, ${profile.district}` });
  const [available, setAvailable] = useState(!!profile.available);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const donationLocked = !!profile.lastDonationDate;

  async function saveAvailability(next) {
    setAvailable(next);
    try {
      await updateDonorProfile({ available: next });
      dispatch(loadProfile());
      toast.success(next ? "You're marked as available to donate." : 'You are now hidden from donor searches.');
    } catch (err) {
      setAvailable(!next);
      toast.error(errorMessage(err));
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return setError('Enter a valid 10-digit Indian mobile number.');
    const placeErr = validatePlace(place);
    if (placeErr) return setError(placeErr);
    setBusy(true);
    try {
      await updateDonorProfile({
        name: form.name.trim(), phone: form.phone.trim(), birthDate: form.birthDate,
        bloodGroup: donationLocked ? undefined : form.bloodGroup,
        lat: Number(place.lat), lon: Number(place.lon), city: place.city.trim(), district: place.district.trim(), state: place.state.trim(),
      });
      dispatch(loadProfile());
      toast.success('Profile updated.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="panel row between">
        <div>
          <div style={{ fontWeight: 650 }}>Available to donate</div>
          <div className="small muted">Turn off if you're travelling or unwell — you'll be hidden from matching.</div>
        </div>
        <Toggle checked={available} onChange={saveAvailability} label="Available to donate" />
      </div>

      <div className="panel stack">
        <h2>Personal details</h2>
        <div className="grid-2">
          <Field label="Full name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Mobile number"><input inputMode="tel" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Date of birth"><input type="date" max={toDateInput()} value={form.birthDate || ''} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></Field>
          <Field label="Blood group" hint={donationLocked ? `Locked after your first donation (${fmtDate(profile.lastDonationDate)})` : undefined}>
            <BloodPicker value={form.bloodGroup} onChange={(g) => setForm({ ...form, bloodGroup: g })} disabled={donationLocked} />
          </Field>
        </div>
      </div>

      <div className="panel stack">
        <h2>Location</h2>
        <LocationPicker value={place} onChange={setPlace} height={280} />
        <PlaceFields place={place} onChange={setPlace} />
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <div><button className="btn btn-primary" disabled={busy}>{busy && <Spinner />} Save changes</button></div>
    </form>
  );
}

function HospitalProfileForm({ profile }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [form, setForm] = useState({
    hospitalName: profile.hospitalName || '', licenseNumber: profile.licenseNumber || '',
    emergencyContact: profile.emergencyContact || '', website: profile.website || '', addressLine: profile.addressLine || '',
  });
  const [place, setPlace] = useState({ lat: profile.lat, lon: profile.lon, city: profile.city, district: profile.district, state: profile.state, label: `${profile.city}, ${profile.district}` });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.hospitalName.trim()) return setError('Hospital name is required.');
    const placeErr = validatePlace(place);
    if (placeErr) return setError(placeErr);
    setBusy(true);
    try {
      await updateHospitalProfile({
        ...form, hospitalName: form.hospitalName.trim(),
        lat: Number(place.lat), lon: Number(place.lon), city: place.city.trim(), district: place.district.trim(), state: place.state.trim(),
      });
      dispatch(loadProfile());
      toast.success('Hospital profile updated.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className={`notice ${profile.verifiedByAdmin ? 'ok' : 'warn'}`}>
        {profile.verifiedByAdmin ? 'Verified by an admin. You can create requests and search donors.' : 'Pending admin verification. Requests and donor search are disabled until verified.'}
      </div>

      <div className="panel stack">
        <h2>Hospital details</h2>
        <Field label="Hospital name"><input value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} /></Field>
        <div className="grid-2">
          <Field label="Licence number" hint="Changing this requires re-verification"><input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></Field>
          <Field label="Emergency contact"><input inputMode="tel" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></Field>
        </div>
        <div className="grid-2">
          <Field label="Website"><input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
          <Field label="Street address"><input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} /></Field>
        </div>
      </div>

      <div className="panel stack">
        <h2>Location</h2>
        <LocationPicker value={place} onChange={setPlace} height={280} />
        <PlaceFields place={place} onChange={setPlace} />
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <div><button className="btn btn-primary" disabled={busy}>{busy && <Spinner />} Save changes</button></div>
    </form>
  );
}

function DangerZone({ role }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  async function confirmDeactivate() {
    setBusy(true);
    try {
      await (role === 'HOSPITAL' ? deleteHospitalProfile() : deleteDonorProfile());
      toast.success('Account deactivated.');
      dispatch(endSession());
      navigate('/');
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="panel stack" style={{ borderColor: 'var(--primary)' }}>
      <h2 style={{ color: 'var(--primary)' }}>Danger zone</h2>
      <p className="small muted">Deactivating hides you from all matching and searches{role === 'HOSPITAL' ? ' and cancels your open requests' : ''}. This cannot be undone from the app.</p>
      <div><button className="btn btn-danger" onClick={() => setOpen(true)}>Deactivate account</button></div>
      {open && (
        <Modal title="Deactivate your account?" onClose={() => setOpen(false)}>
          <p>This immediately removes you from search results{role === 'HOSPITAL' ? ' and cancels any open blood requests' : ''}. Continue?</p>
          <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={confirmDeactivate} disabled={busy}>{busy && <Spinner />} Deactivate</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Profile() {
  const { role, profile } = useSelector((s) => s.auth);
  if (!profile) return null;

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head"><div><h1>Profile</h1><p>{role === 'HOSPITAL' ? 'Hospital details and verification status.' : 'Your donor details and location.'}</p></div></div>
      <div className="stack">
        {role === 'HOSPITAL' ? <HospitalProfileForm profile={profile} /> : <DonorProfileForm profile={profile} />}
        <DangerZone role={role} />
      </div>
    </div>
  );
}
