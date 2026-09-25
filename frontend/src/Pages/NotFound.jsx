import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <h1>Page not found</h1>
        <p className="muted" style={{ margin: '10px 0 18px' }}>That page doesn't exist or has moved.</p>
        <Link className="btn btn-primary" to="/">Go home</Link>
      </div>
    </div>
  );
}
