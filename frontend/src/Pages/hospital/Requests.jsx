import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMyRequests, updateRequestStatus } from '../../api/requests';
import { useAsync } from '../../lib/hooks';
import { useToast } from '../../components/Toast';
import { CenteredSpinner, Empty, Notice, PageHead, Tag } from '../../components/ui';
import { BloodDrop } from '../../components/ui';
import Icon from '../../components/Icon';
import { errorMessage } from '../../api/client';
import { STATUS_TRANSITIONS, statusLabel, statusTone, urgencyLabel, urgencyTone } from '../../lib/bloods';
import { fmtDate } from '../../lib/format';

const FILTERS = ['ALL', 'OPEN', 'MATCHING', 'FULFILLED', 'CANCELLED'];

export default function Requests() {
  const { data, loading, error, reload } = useAsync(getMyRequests, []);
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();
  const [params] = useSearchParams();
  const highlight = Number(params.get('highlight')) || null;

  async function changeStatus(id, status) {
    setBusyId(id);
    try {
      await updateRequestStatus(id, status);
      toast.success(`Request marked ${statusLabel(status).toLowerCase()}.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const rows = (data || []).filter((r) => filter === 'ALL' || r.status === filter);

  return (
    <div className="page">
      <PageHead title="My requests" action={<Link to="/app/new-request" className="btn btn-primary"><Icon name="plus" size={16} /> New request</Link>}>
        Track status and find donors for each request.
      </PageHead>
      {error && <Notice tone="error">{error}</Notice>}

      <div className="chips" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'All' : statusLabel(f)}
          </button>
        ))}
      </div>

      {loading && !data ? <CenteredSpinner label="Loading requests…" /> : rows.length === 0 ? (
        <Empty title="No requests here">{filter === 'ALL' ? 'Create your first blood request to get started.' : 'Nothing with this status yet.'}</Empty>
      ) : (
        <div className="stack-s">
          {rows.map((r) => (
            <div key={r.id} className="panel row" style={{ alignItems: 'flex-start', outline: r.id === highlight ? '2px solid var(--primary)' : 'none' }}>
              <BloodDrop group={r.bloodGroup} />
              <div className="grow">
                <div className="row between wrap">
                  <div>
                    <span className="title" style={{ fontWeight: 650 }}>{r.patientName}</span>
                    <span className="meta"> · {r.unitsRequired} unit(s) · {r.city}</span>
                  </div>
                  <div className="row">
                    <Tag tone={urgencyTone(r.urgency)}>{urgencyLabel(r.urgency)}</Tag>
                    <Tag tone={statusTone(r.status)}>{statusLabel(r.status)}</Tag>
                  </div>
                </div>
                <div className="small muted" style={{ marginTop: 4 }}>Created {fmtDate(r.createdAt)}{r.requiredBefore ? ` · Needed by ${fmtDate(r.requiredBefore)}` : ''}</div>

                <div className="actions">
                  {(r.status === 'OPEN' || r.status === 'MATCHING') && (
                    <Link to={`/app/find?requestId=${r.id}`} className="btn btn-sm btn-primary"><Icon name="search" size={14} /> Find donors</Link>
                  )}
                  {STATUS_TRANSITIONS[r.status]?.filter((s) => s !== 'MATCHING').map((s) => (
                    <button key={s} className="btn btn-sm" disabled={busyId === r.id} onClick={() => changeStatus(r.id, s)}>
                      Mark {statusLabel(s).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
