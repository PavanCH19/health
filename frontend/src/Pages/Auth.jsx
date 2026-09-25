import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, register } from '../api/auth';
import { errorMessage } from '../api/client';
import { startSession } from '../store/session';
import { Brand } from '../components/Shell';
import { Field, Notice, Spinner } from '../components/ui';

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  const [role, setRole] = useState(params.get('role') === 'HOSPITAL' ? 'HOSPITAL' : 'DONOR');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (token) return <Navigate to="/app" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const email = form.email.trim();
    if (isRegister) {
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    }
    setBusy(true);
    try {
      if (isRegister) await register({ email, password: form.password, confirmPassword: form.confirmPassword, role });
      const { token: jwt } = await login(email, form.password);
      await dispatch(startSession(jwt));
      navigate(isRegister ? '/onboarding' : location.state?.from || '/app', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not sign you in.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth-side">
        <Brand />
        <div>
          <h2>{isRegister ? 'Join the network that answers first.' : 'Welcome back.'}</h2>
          <p>{isRegister
            ? 'Donors share a location and a blood group. Hospitals get verified before they can contact anyone.'
            : 'Sign in to see who needs you nearby, or to find donors for a patient.'}</p>
        </div>
        <span className="small" style={{ opacity: 0.6 }}>Your contact details are never shown to unverified accounts.</span>
      </aside>

      <main className="auth-main">
        <form className="auth-card stack" onSubmit={submit} noValidate>
          <h1>{isRegister ? 'Create your account' : 'Sign in'}</h1>

          {isRegister && (
            <Field label="I am registering as">
              <div className="seg" role="group" aria-label="Account type">
                <button type="button" aria-pressed={role === 'DONOR'} onClick={() => setRole('DONOR')}>A donor</button>
                <button type="button" aria-pressed={role === 'HOSPITAL'} onClick={() => setRole('HOSPITAL')}>A hospital</button>
              </div>
            </Field>
          )}

          <Field label="Email" htmlFor="email">
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="Password" htmlFor="password" hint={isRegister ? 'At least 6 characters' : undefined}>
            <input id="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} required />
          </Field>
          {isRegister && (
            <Field label="Confirm password" htmlFor="confirm">
              <input id="confirm" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            </Field>
          )}

          {error && <Notice tone="error">{error}</Notice>}

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            {busy && <Spinner />} {isRegister ? 'Create account' : 'Sign in'}
          </button>

          <p className="muted small">
            {isRegister ? <>Already registered? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}
          </p>
        </form>
      </main>
    </div>
  );
}
