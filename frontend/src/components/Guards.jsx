import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadProfile } from '../store/session';
import { CenteredSpinner, Notice } from './ui';

/** Signed in + profile loaded. Sends new users to onboarding. */
export function RequireAuth({ children }) {
  const { token, profileStatus, profileError } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    if (token && profileStatus === 'idle') dispatch(loadProfile());
  }, [token, profileStatus, dispatch]);

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (profileStatus === 'idle' || profileStatus === 'loading') return <CenteredSpinner label="Loading your account…" />;
  if (profileStatus === 'error') {
    return (
      <div className="page" style={{ maxWidth: 560 }}>
        <Notice tone="error">{profileError}</Notice>
        <p style={{ marginTop: 14 }}><button className="btn btn-primary" onClick={() => dispatch(loadProfile())}>Try again</button></p>
      </div>
    );
  }
  if (profileStatus === 'missing') return <Navigate to="/onboarding" replace />;
  return children;
}

export function RequireRole({ roles, children }) {
  const role = useSelector((s) => s.auth.role);
  return roles.includes(role) ? children : <Navigate to="/app" replace />;
}
