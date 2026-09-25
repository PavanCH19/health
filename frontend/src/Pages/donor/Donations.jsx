import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createDonation, getMyDonations } from '../../api/donations';
import { useAsync } from '../../lib/hooks';
import { useToast } from '../../components/Toast';
import { CenteredSpinner, Empty, Field, Notice, PageHead, Spinner, Tag } from '../../components/ui';
import Icon from '../../components/Icon';
import { errorMessage } from '../../api/client';
import { bloodLabel, statusLabel, statusTone } from '../../lib/bloods';
import { dateToDonationDateTime, fmtDate, toDateInput } from '../../lib/format';
import { loadProfile } from '../../store/session';

function LogForm({ onSaved }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [form, setForm] = useState({ donationDate: toDateInput(), units: 1, hospitalName: '', recipientName: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.donationDate) return setError('Donation date is required.');
    if (new Date(form.donationDate) > new Date()) return setError('Donation date cannot be in the future.');
    setBusy(true);
    try {
      await createDonation({
        donationDate: dateToDonationDateTime(form.donationDate),
        units: Number(form.units),
        hospitalName: form.hospitalName.trim() || undefined,
        recipientName: form.recipientName.trim() || undefined,
      });
      toast.success('Donation recorded. Thank you for donating!');
      setForm({ donationDate: toDateInput(), units: 1, hospitalName: '', recipientName: '' });
      onSaved();
      dispatch(loadProfile()); // refresh cooldown-dependent state
    } catch (err) {
      setError(errorMessage(err, 'Could not save this donation. You may still be inside the 90-day gap.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={submit} noValidate>
      <h2>Log a donation</h2>
      <div className="grid-2">
        <Field label="Date" htmlFor="dd"><input id="dd" type="date" max={toDateInput()} value={form.donationDate} onChange={(e) => setForm({ ...form, donationDate: e.target.value })} required /></Field>
        <Field label="Units" htmlFor="un"><input id="un" type="number" min={1} max={2} value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} /></Field>
      </div>
      <div className="grid-2">
        <Field label="Hospital (optional)"><input value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} /></Field>
        <Field label="Recipient (optional)"><input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} /></Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div><button className="btn btn-primary" disabled={busy}>{busy && <Spinner />} Save donation</button></div>
    </form>
  );
}

export default function Donations() {
  const { data, loading, error, reload } = useAsync(getMyDonations, []);
  const profile = useSelector((s) => s.auth.profile);

  return (
    <div className="page">
      <PageHead title="My donations">Every logged donation resets your 90-day cooldown and counts toward its request.</PageHead>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="two-col">
        <div className="panel">
          <h2>History</h2>
          {loading && !data ? <CenteredSpinner label="Loading…" /> : (data || []).length === 0 ? (
            <Empty title="No donations logged yet">Once you donate, record it here to keep your history and cooldown accurate.</Empty>
          ) : (
            <div className="stack-s" style={{ marginTop: 10 }}>
              {data.map((d) => (
                <div key={d.id} className="item" style={{ cursor: 'default' }}>
                  <Icon name="heart" />
                  <div className="grow">
                    <div className="row between"><span className="title">{fmtDate(d.donationDate)}</span>{d.status && <Tag tone={statusTone(d.status)}>{statusLabel(d.status)}</Tag>}</div>
                    <div className="meta">{d.units} unit(s){d.hospitalName ? ` · ${d.hospitalName}` : ''}{d.bloodGroup ? ` · ${bloodLabel(d.bloodGroup)}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="stack">
          <LogForm onSaved={reload} />
          {profile?.lastDonationDate && (
            <div className="panel small muted">Last donation on record: {fmtDate(profile.lastDonationDate)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
