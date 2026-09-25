import { useState } from 'react';
import { getNotifications, markNotificationRead } from '../api/notifications';
import { useAsync } from '../lib/hooks';
import { CenteredSpinner, Empty, Notice, PageHead } from '../components/ui';
import Icon from '../components/Icon';
import { timeAgo } from '../lib/format';

export default function Notifications() {
  const { data, loading, error, reload } = useAsync(getNotifications, []);
  const [reading, setReading] = useState(null);

  async function open(n) {
    if (n.read) return;
    setReading(n.id);
    try {
      await markNotificationRead(n.id);
      window.dispatchEvent(new Event('bc:notifications-changed'));
      reload();
    } finally {
      setReading(null);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <PageHead title="Notifications">Updates about requests near you and donations you've helped with.</PageHead>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="panel flush">
        {loading && !data ? <div style={{ padding: 20 }}><CenteredSpinner label="Loading…" /></div> : (data || []).length === 0 ? (
          <Empty title="No notifications yet" />
        ) : (
          data.map((n) => (
            <button key={n.id} className={`notif ${n.type} ${n.read ? '' : 'unread'}`} style={{ width: '100%', border: 0, cursor: n.read ? 'default' : 'pointer', background: 'transparent', textAlign: 'left' }} onClick={() => open(n)}>
              <span className="ico"><Icon name={n.type === 'URGENT_REQUEST' ? 'heart' : 'bell'} size={16} /></span>
              <div className="grow">
                <div className="row between"><span style={{ fontWeight: 650 }}>{n.title}</span><span className="small muted">{timeAgo(n.createdAt)}</span></div>
                <div className="small muted">{n.message}</div>
              </div>
              {!n.read && reading !== n.id && <span className="dot" style={{ color: 'var(--primary)', marginTop: 6 }} />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
