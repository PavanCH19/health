import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getDonorDashboard } from '../../api/dashboard';
import { useAsync } from '../../lib/hooks';
import { CenteredSpinner, Empty, Notice, PageHead, Tag } from '../../components/ui';
import { BloodDrop } from '../../components/ui';
import Icon from '../../components/Icon';
import { bloodLabel, urgencyLabel, urgencyTone } from '../../lib/bloods';
import { fmtKm } from '../../lib/format';

function EligibilityRing({ eligible, days }) {
  const pct = eligible ? 100 : Math.max(4, 100 - Math.min(100, (days / 90) * 100));
  const r = 56, c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg width="132" height="132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--muted-soft)" strokeWidth="10" />
        <circle cx="66" cy="66" r={r} fill="none" stroke={eligible ? 'var(--ok)' : 'var(--warn)'} strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round" />
      </svg>
      <div className="c">
        {eligible ? <b style={{ color: 'var(--ok)' }}>Ready</b> : <b>{days}d</b>}
        <span>{eligible ? 'to donate' : 'until eligible'}</span>
      </div>
    </div>
  );
}

export default function DonorHome() {
  const { profile } = useSelector((s) => s.auth);
  const { data, loading, error, reload } = useAsync(getDonorDashboard, []);

  if (loading && !data) return <CenteredSpinner label="Loading your dashboard…" />;

  return (
    <div className="page">
      <PageHead title={`Hi, ${profile?.name?.split(' ')[0] || 'there'}`}>
        Your blood group, {bloodLabel(profile?.bloodGroup)}, and your saved location decide which requests find you.
      </PageHead>

      {error && <Notice tone="error">{error} <button className="btn btn-sm" onClick={reload} style={{ marginLeft: 10 }}>Retry</button></Notice>}

      {data && (
        <div className="two-col">
          <div className="stack">
            <div className="stats">
              <div className="stat"><div className="v num">{data.donationStats?.totalDonations ?? 0}</div><div className="l">Donations made</div></div>
              <div className="stat"><div className="v num">{data.donationStats?.livesSaved ?? 0}</div><div className="l">Estimated lives helped</div></div>
              <div className="stat"><div className="v num">{data.nearbyRequests?.length ?? 0}</div><div className="l">Open requests near you</div></div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Nearby requests you can help with</h2>
                <Link to="/app/requests" className="btn btn-sm">View all on map</Link>
              </div>
              {(data.nearbyRequests || []).length === 0 ? (
                <Empty title="No matching requests right now">
                  We'll notify you the moment a compatible request appears within 25 km.
                </Empty>
              ) : (
                <div className="stack-s">
                  {data.nearbyRequests.slice(0, 5).map((r) => (
                    <Link key={r.requestId} to="/app/requests" className="item">
                      <BloodDrop group={r.bloodGroup} size="sm" />
                      <div className="grow">
                        <div className="title">{r.hospitalName}</div>
                        <div className="meta">{r.city} · {fmtKm(r.distanceKm)}</div>
                      </div>
                      <Tag tone={urgencyTone(r.urgency)}>{urgencyLabel(r.urgency)}</Tag>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stack">
            <div className="panel" style={{ display: 'grid', placeItems: 'center', textAlign: 'center', gap: 10 }}>
              <EligibilityRing eligible={data.donationEligibility?.eligible} days={data.donationEligibility?.daysUntilEligible ?? 0} />
              {!data.donationEligibility?.eligible && <p className="small muted">Donors need a 90-day gap between donations for their own safety.</p>}
              <Link to="/app/donations" className="btn btn-block">Log a donation</Link>
            </div>

            <div className="panel">
              <div className="panel-head"><h2>Recent alerts</h2><Link to="/app/notifications" className="small">See all</Link></div>
              {(data.notifications || []).length === 0 ? <p className="muted small">Nothing yet.</p> : (
                <div className="stack-s">
                  {data.notifications.slice(0, 4).map((n) => (
                    <div key={n.id} className="row" style={{ alignItems: 'flex-start' }}>
                      <Icon name={n.type === 'URGENT_REQUEST' ? 'heart' : 'bell'} size={16} />
                      <div className="grow"><div className="small" style={{ fontWeight: 600 }}>{n.title}</div><div className="small muted">{n.message}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
