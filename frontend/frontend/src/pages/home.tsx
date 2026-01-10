import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-page">
      <style>{css}</style>

      {/* WCAG: skip link for keyboard users */}
      <a className="home-skip" href="#main">
        Skip to main content
      </a>

      <header className="home-top" role="banner">
        <div className="home-brand">
          <div className="home-logo" aria-hidden="true">
            <span>NB</span>
          </div>
          <div className="home-brandText">
            <div className="home-company">Northbridge Co.</div>
            <div className="home-tagline">Leave Management Portal</div>
          </div>
        </div>

        <Link className="home-btnPrimary" to="/login" aria-label="Sign in to Northbridge Leave Portal">
          Sign in
        </Link>
      </header>

      <main id="main" className="home-shell" role="main" tabIndex={-1}>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-kicker">Secure internal portal</div>
          <h1 id="home-title" className="home-h1">
            Northbridge Leave Portal
          </h1>

          <p className="home-p">
            Request leave, track approvals, and manage team workflows in one place. Built for clean role-based access
            and audit-friendly reporting.
          </p>

          <div className="home-meta" aria-label="Portal highlights">
            <div className="home-metaItem">
              <div className="home-metaLabel">Roles</div>
              <div className="home-metaValue">Employee • Manager • Admin</div>
            </div>

            <div className="home-metaItem">
              <div className="home-metaLabel">Tracking</div>
              <div className="home-metaValue">Pending • Approved • Rejected</div>
            </div>

            <div className="home-metaItem">
              <div className="home-metaLabel">Reporting</div>
              <div className="home-metaValue">Department + company summary</div>
            </div>
          </div>

          <div className="home-ctaRow">
            <Link className="home-btnPrimary" to="/login">
              Sign in
            </Link>

            {/* Anchor is fine, but we add better focus styling in CSS */}
            <a className="home-btnSecondary" href="#about">
              About
            </a>
          </div>
        </section>

        <section id="about" className="home-about" aria-labelledby="about-title">
          <div id="about-title" className="home-aboutTitle">
            How it works
          </div>
          <div className="home-aboutSub">
            The portal routes you to the correct dashboard based on your role after login. All rules (overlaps, balances,
            approvals) are enforced by the backend.
          </div>

          <div className="home-aboutGrid" role="list">
            <div className="home-aboutCard" role="listitem">
              <div className="home-aboutCardTitle">Employees</div>
              <div className="home-aboutCardText">Request annual/sick leave and cancel when allowed.</div>
            </div>

            <div className="home-aboutCard" role="listitem">
              <div className="home-aboutCardTitle">Managers</div>
              <div className="home-aboutCardText">Review team requests, approve/reject, generate reports.</div>
            </div>

            <div className="home-aboutCard" role="listitem">
              <div className="home-aboutCardTitle">Admins</div>
              <div className="home-aboutCardText">Manage users, roles, manager assignments, and usage reporting.</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer" role="contentinfo">
        <div className="home-footerInner">
          <div className="home-footerLeft">
            <div className="home-footerBrand">
              <div className="home-footerLogo" aria-hidden="true">
                NB
              </div>
              <div>
                <div className="home-footerCompany">Northbridge Co.</div>
                <div className="home-footerSub">Internal Leave Management Portal</div>
              </div>
            </div>
          </div>

          <div className="home-footerRight">
            <div className="home-footerText">© {new Date().getFullYear()} Northbridge Co.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const css = `
:root{
  --bg: #f6f8fc;
  --panel: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --shadow: 0 10px 30px rgba(2,6,23,0.06);
  --primary: #2563eb;
  --primary2: #1d4ed8;
  --radius: 16px;
}

/* WCAG: clear visible focus on keyboard navigation */
.home-page :focus-visible{
  outline: 3px solid rgba(37,99,235,0.85);
  outline-offset: 3px;
}

/* WCAG: Skip link (hidden until focused) */
.home-skip{
  position: absolute;
  left: 12px;
  top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #ffffff;
  color: var(--text);
  text-decoration: none;
  font-weight: 950;
  transform: translateY(-160%);
  transition: transform 120ms ease;
  z-index: 9999;
}
.home-skip:focus{
  transform: translateY(0);
}

/* Reduce motion preference */
@media (prefers-reduced-motion: reduce){
  .home-btnPrimary,
  .home-btnSecondary,
  .home-skip{
    transition: none !important;
  }
  .home-btnPrimary:hover,
  .home-btnSecondary:hover{
    transform: none !important;
  }
}

.home-page{
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 20% 0%, #eef2ff 0%, rgba(238,242,255,0) 55%),
    radial-gradient(900px 500px at 80% 10%, #ecfeff 0%, rgba(236,254,255,0) 60%),
    var(--bg);
  color: var(--text);
}

.home-top{
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px 18px 0 18px;
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 12px;
}

.home-brand{
  display:flex;
  align-items:center;
  gap: 12px;
  min-width: 0;
}

.home-logo{
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display:grid;
  place-items:center;
  font-weight: 950;
  color: white;
  background: linear-gradient(135deg, #0f172a 0%, #111827 55%, #0b1224 100%);
  box-shadow: 0 10px 22px rgba(2,6,23,0.20);
}

.home-brandText{ display:grid; gap: 2px; min-width: 0; }
.home-company{ font-weight: 950; letter-spacing: 0.2px; }
.home-tagline{ font-size: 12px; color: var(--muted); }

.home-shell{
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px;
  display:grid;
  gap: 16px;
}

.home-hero{
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow);
}

.home-kicker{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(37,99,235,0.25);
  background: rgba(37,99,235,0.08);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
}

.home-h1{
  margin: 12px 0 6px 0;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.6px;
}

@media (max-width: 520px){
  .home-h1{ font-size: 26px; }
}

.home-p{
  margin: 0;
  color: var(--muted);
  max-width: 720px;
  line-height: 1.6;
}

.home-meta{
  margin-top: 14px;
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 780px){
  .home-meta{ grid-template-columns: 1fr; }
}

.home-metaItem{
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.home-metaLabel{
  font-size: 12px;
  color: var(--muted);
  font-weight: 900;
}

.home-metaValue{
  margin-top: 4px;
  font-weight: 950;
  letter-spacing: -0.2px;
}

.home-ctaRow{
  display:flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.home-btnPrimary,
.home-btnSecondary{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  text-decoration: none;
  font-weight: 950;
  cursor: pointer;
  transition: transform 120ms ease, opacity 120ms ease;
  white-space: nowrap;
}

.home-btnPrimary{
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary2) 100%);
  color: white;
  border-color: rgba(255,255,255,0.16);
  box-shadow: 0 10px 22px rgba(37,99,235,0.20);
}

.home-btnSecondary{
  background: #ffffff;
  border: 1px solid var(--border);
  color: var(--text);
}

.home-btnPrimary:hover,
.home-btnSecondary:hover{
  transform: translateY(-1px);
}

.home-about{
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow);
}

.home-aboutTitle{
  font-weight: 950;
  letter-spacing: -0.2px;
  font-size: 16px;
}

.home-aboutSub{
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
  max-width: 780px;
}

.home-aboutGrid{
  margin-top: 12px;
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 980px){
  .home-aboutGrid{ grid-template-columns: 1fr; }
}

.home-aboutCard{
  border: 1px solid var(--border);
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  padding: 14px;
}

.home-aboutCardTitle{ font-weight: 950; }
.home-aboutCardText{ margin-top: 6px; color: var(--muted); font-size: 13px; line-height: 1.5; }

.home-footer{
  margin-top: 8px;
  padding: 0 18px 18px 18px;
}

.home-footerInner{
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: #ffffff;
  box-shadow: var(--shadow);
  padding: 14px;
  display:flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.home-footerBrand{
  display:flex;
  gap: 10px;
  align-items:center;
}

.home-footerLogo{
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display:grid;
  place-items:center;
  font-weight: 950;
  color: white;
  background: linear-gradient(135deg, #0f172a 0%, #111827 55%, #0b1224 100%);
}

.home-footerCompany{ font-weight: 950; }
.home-footerSub{ font-size: 12px; color: var(--muted); margin-top: 2px; }
.home-footerText{ font-size: 12px; color: var(--muted); }
`;
