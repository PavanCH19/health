import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BLOOD_GROUPS, CAN_DONATE_TO, bloodLabel } from '../lib/bloods';
import { Brand } from '../components/Shell';

function Radar() {
  // Illustrative: a hospital at the centre, compatible donors inside the search radius
  const dots = [
    { x: 250, y: 130, g: 'O_NEG' }, { x: 120, y: 200, g: 'A_POS' }, { x: 300, y: 270, g: 'B_POS' },
    { x: 180, y: 300, g: 'O_POS' }, { x: 330, y: 170, g: 'A_NEG' },
  ];
  return (
    <svg className="radar" viewBox="0 0 400 400" role="img" aria-label="A hospital at the centre of a search radius with compatible donors around it">
      <circle className="ring-line" cx="200" cy="200" r="70" />
      <circle className="ring-line" cx="200" cy="200" r="130" />
      <circle className="ring-line" cx="200" cy="200" r="190" />
      {dots.map((d) => (
        <g key={d.g} transform={`translate(${d.x} ${d.y})`}>
          <circle r="19" fill="var(--ok)" />
          <text textAnchor="middle" dy="5" fontFamily="var(--font-display)" fontWeight="700" fontSize="14" fill="#fff">{bloodLabel(d.g)}</text>
        </g>
      ))}
      <g transform="translate(200 200)">
        <circle r="24" fill="var(--primary)" />
        <path d="M0 -10v20M-10 0h20" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const token = useSelector((s) => s.auth.token);

  return (
    <div className="land">
      <header className="land-nav">
        <Brand />
        <div className="row">
          {token ? (
            <Link to="/app" className="btn btn-primary">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign in</Link>
              <Link to="/register" className="btn btn-primary">Create account</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <h1>The nearest compatible donor should hear first.</h1>
          <p className="lead">
            BloodConnect connects hospitals across Karnataka with volunteer donors, ranked by blood compatibility,
            distance, and whether the donor is ready to give again.
          </p>
          <div className="row wrap">
            <Link to="/register?role=DONOR" className="btn btn-primary btn-lg">Become a donor</Link>
            <Link to="/register?role=HOSPITAL" className="btn btn-lg">Register a hospital</Link>
          </div>
        </div>
        <Radar />
      </section>

      <section className="land-section">
        <h2>How a request travels</h2>
        <ol className="steps">
          <li><b>1. A verified hospital raises a request</b><p className="muted">It picks the blood group, urgency and the exact place on the map where the blood is needed.</p></li>
          <li><b>2. Compatible donors nearby are alerted</b><p className="muted">Only donors who are available, past their 90-day break, and within the radius are notified.</p></li>
          <li><b>3. Donations close the request</b><p className="muted">Each recorded donation counts toward the units needed, and the request closes when the count is met.</p></li>
        </ol>
      </section>

      <section className="land-section" style={{ paddingTop: 0 }}>
        <h2>Who can give to whom</h2>
        <p className="muted" style={{ marginTop: 6 }}>Matching uses red-cell compatibility, so an O− donor can help any patient.</p>
        <div className="tbl-wrap">
          <table className="compat">
            <thead>
              <tr><th scope="col">Donor \ Patient</th>{BLOOD_GROUPS.map((g) => <th key={g} scope="col">{bloodLabel(g)}</th>)}</tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((d) => (
                <tr key={d}>
                  <th scope="row">{bloodLabel(d)}</th>
                  {BLOOD_GROUPS.map((r) => {
                    const yes = CAN_DONATE_TO[d].includes(r);
                    return <td key={r} className={yes ? 'y' : 'n'} aria-label={yes ? 'can give' : 'cannot give'}>{yes ? '✓' : '·'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="land-foot">BloodConnect. Donor locations are only shown to admin-verified hospitals.</footer>
    </div>
  );
}
