import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getHospitalDashboard } from '../../api/dashboard';
import { useAsync } from '../../lib/hooks';
import { CenteredSpinner, Notice, PageHead } from '../../components/ui';
import Icon from '../../components/Icon';
import { timeAgo } from '../../lib/format';

export default function HospitalHome() {
  const profile = useSelector((s) => s.auth.profile);
  const { data, loading, error } = useAsync(getHospitalDashboard, []);

  if (loading && !data) return <CenteredSpinner label="Loading dashboard…" />;

  return (
    <div className="page">
      <PageHead
        title={profile?.hospitalName || 'Overview'}
        action={<Link to="/app/new-request" className="btn btn-primary"><Icon name="plus" size={16} /> New request</Link>}
      >
        {profile?.verifiedByAdmin ? 'Verified hospital account.' : 'Verification pending — requests and donor search are disabled until an admin approves your hospital.'}
      </PageHead>

      {error && <Notice tone="error">{error}</Notice>}
      {!profile?.verifiedByAdmin && <Notice tone="warn">Your hospital is awaiting admin verification.</Notice>}

      {data && (
        <div className="two-col">
          <div className="stack">
            <div className="stats">
              <div className="stat"><div className="v num">{data.dashboardSummary?.activeRequests ?? 0}</div><div className="l">Active requests</div></div>
              <div className="stat"><div className="v num">{data.dashboardSummary?.availableDonorsNearby ?? 0}</div><div className="l">Available donors within 25 km</div></div>
            </div>
            <div className="panel stack">
              <h2>Quick actions</h2>
              <div className="row wrap">
                <Link to="/app/new-request" className="btn"><Icon name="plus" size={16} /> Raise a request</Link>
                <Link to="/app/find" className="btn"><Icon name="search" size={16} /> Search donors on the map</Link>
                <Link to="/app/requests" className="btn"><Icon name="list" size={16} /> Manage requests</Link>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Recent alerts</h2>
            {(data.notifications || []).length === 0 ? <p className="muted small" style={{ marginTop: 8 }}>Nothing yet.</p> : (
              <div className="stack-s" style={{ marginTop: 10 }}>
                {data.notifications.slice(0, 6).map((n) => (
                  <div key={n.id} className="row" style={{ alignItems: 'flex-start' }}>
                    <Icon name="bell" size={16} />
                    <div className="grow"><div className="small" style={{ fontWeight: 600 }}>{n.title}</div><div className="small muted">{n.message} · {timeAgo(n.createdAt)}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
