import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Icon from './Icon';
import { getUnreadCount } from '../api/notifications';
import { endSession } from '../store/session';
import { toggleTheme } from '../store/uiSlice';
import { initials } from '../lib/format';

const NAV = {
  DONOR: [
    { to: '/app', label: 'Home', icon: 'home', end: true },
    { to: '/app/requests', label: 'Nearby', icon: 'map' },
    { to: '/app/donations', label: 'Donations', icon: 'heart' },
    { to: '/app/notifications', label: 'Alerts', icon: 'bell' },
    { to: '/app/profile', label: 'Profile', icon: 'user' },
  ],
  HOSPITAL: [
    { to: '/app', label: 'Overview', icon: 'home', end: true },
    { to: '/app/new-request', label: 'New request', icon: 'plus' },
    { to: '/app/requests', label: 'Requests', icon: 'list' },
    { to: '/app/find', label: 'Find donors', icon: 'search' },
    { to: '/app/notifications', label: 'Alerts', icon: 'bell' },
    { to: '/app/profile', label: 'Profile', icon: 'user' },
  ],
  ADMIN: [{ to: '/app', label: 'Admin', icon: 'shield', end: true }],
};

function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="drop"><span>+</span></span>
      BloodConnect
    </Link>
  );
}

function useUnread(enabled) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = () => getUnreadCount().then((n) => alive && setCount(n)).catch(() => {});
    load();
    const id = setInterval(load, 60000);
    window.addEventListener('bc:notifications-changed', load);
    return () => { alive = false; clearInterval(id); window.removeEventListener('bc:notifications-changed', load); };
  }, [enabled]);
  return count;
}

export default function Shell() {
  const { role, email, profile } = useSelector((s) => s.auth);
  const theme = useSelector((s) => s.ui.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = useUnread(role !== 'ADMIN');

  const name = profile?.name || profile?.hospitalName || email || 'Account';
  const links = NAV[role] || [];

  const logout = () => { dispatch(endSession()); navigate('/'); };

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Main">
        <Brand />
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon name={l.icon} /> {l.label}
          </NavLink>
        ))}
        <div className="nav-spacer" />
        <div className="side-foot small muted" style={{ padding: '0 10px' }}>
          Signed in as {role?.toLowerCase()}
        </div>
      </nav>

      <div className="main">
        <header className="topbar">
          <div className="muted small">{role === 'HOSPITAL' ? 'Hospital workspace' : role === 'ADMIN' ? 'Administration' : 'Donor workspace'}</div>
          <div className="row">
            <button className="btn icon-btn" onClick={() => dispatch(toggleTheme())} aria-label="Toggle dark mode">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            {role !== 'ADMIN' && (
              <Link to="/app/notifications" className="btn icon-btn" aria-label={`Notifications, ${unread} unread`}>
                <Icon name="bell" />
                {unread > 0 && <span className="badge-count">{unread > 99 ? '99+' : unread}</span>}
              </Link>
            )}
            <div className="menu">
              <button className="avatar" style={{ border: 0, cursor: 'pointer' }} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu">
                {initials(name)}
              </button>
              {open && (
                <div className="menu-pop" role="menu" onMouseLeave={() => setOpen(false)}>
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontWeight: 650 }}>{name}</div>
                    <div className="small muted">{email}</div>
                  </div>
                  {role !== 'ADMIN' && <button role="menuitem" onClick={() => { setOpen(false); navigate('/app/profile'); }}>Profile and settings</button>}
                  <button role="menuitem" onClick={logout}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

export { Brand };
