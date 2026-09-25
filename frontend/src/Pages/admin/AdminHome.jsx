import { useState } from 'react';
import { blockUser, getPendingHospitals, getUsers, unblockUser, verifyHospital } from '../../api/admin';
import { useAsync } from '../../lib/hooks';
import { useToast } from '../../components/Toast';
import { CenteredSpinner, Empty, Notice, PageHead, Tag } from '../../components/ui';
import { errorMessage } from '../../api/client';
import { initials } from '../../lib/format';

function PendingHospitals() {
  const { data, loading, error, reload } = useAsync(getPendingHospitals, []);
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  async function approve(id) {
    setBusy(id);
    try {
      await verifyHospital(id);
      toast.success('Hospital verified.');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="panel">
      <h2>Hospitals awaiting verification</h2>
      {error && <Notice tone="error">{error}</Notice>}
      {loading && !data ? <CenteredSpinner label="Loading…" /> : (data || []).length === 0 ? (
        <Empty title="Nothing pending">All hospitals are verified.</Empty>
      ) : (
        <div className="stack-s" style={{ marginTop: 10 }}>
          {data.map((h) => (
            <div key={h.id} className="item" style={{ cursor: 'default' }}>
              <div className="grow">
                <div className="title">{h.hospitalName}</div>
                <div className="meta">{h.email}{h.licenseNumber ? ` · Licence ${h.licenseNumber}` : ' · No licence number on file'}</div>
              </div>
              <button className="btn btn-primary btn-sm" disabled={busy === h.id} onClick={() => approve(h.id)}>Verify</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTable() {
  const { data, loading, error, reload } = useAsync(getUsers, []);
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  async function toggle(u) {
    setBusy(u.id);
    try {
      await (u.active ? blockUser(u.id) : unblockUser(u.id));
      toast.success(u.active ? 'User blocked.' : 'User unblocked.');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="panel">
      <h2>All accounts</h2>
      {error && <Notice tone="error">{error}</Notice>}
      {loading && !data ? <CenteredSpinner label="Loading…" /> : (
        <div className="tbl-wrap" style={{ marginTop: 10 }}>
          <table className="tbl">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id}>
                  <td><div className="row"><span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(u.email)}</span>{u.email}</div></td>
                  <td>{[...(u.roles || [])].join(', ')}</td>
                  <td>{u.active ? <Tag tone="ok">Active</Tag> : <Tag tone="primary">Blocked</Tag>}</td>
                  <td>
                    {!u.roles?.includes?.('ADMIN') && (
                      <button className="btn btn-sm" disabled={busy === u.id} onClick={() => toggle(u)}>{u.active ? 'Block' : 'Unblock'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminHome() {
  return (
    <div className="page">
      <PageHead title="Administration">Verify hospitals and manage accounts.</PageHead>
      <div className="stack">
        <PendingHospitals />
        <UsersTable />
      </div>
    </div>
  );
}
