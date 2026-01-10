import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../utils/api";

type FieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  const emailTrimmed = email.trim();

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (!emailTrimmed) next.email = "Enter your email address.";
    else {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
      if (!ok) next.email = "Enter a valid email address (e.g. name@company.com).";
    }

    if (!password) next.password = "Enter your password.";

    return next;
  };

  const clientErrors = useMemo(() => validate(), [emailTrimmed, password]);

  const showEmailError = touched.email && !!clientErrors.email;
  const showPasswordError = touched.password && !!clientErrors.password;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ email: true, password: true });

    const v = validate();
    if (v.email || v.password) {
      setErrors(v);
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await login(emailTrimmed, password);
      nav("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Login failed. Try again.";

      setErrors({ form: msg });
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (errors.form) {
      setErrors((s) => ({ ...s, form: undefined }));
    }
    
  }, [email, password]);

  const emailDescribedBy = ["email-help", showEmailError ? "email-error" : ""]
    .filter(Boolean)
    .join(" ");

  const passwordDescribedBy = ["password-help", showPasswordError ? "password-error" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <div className="login-shell" style={styles.shell}>
        {/* Left brand panel */}
        <div className="login-brand" style={styles.brandPanel}>
          <div style={styles.brandTop}>
            <div style={styles.logo} aria-hidden="true">
              <span style={{ fontWeight: 900, letterSpacing: 0.5 }}>NC</span>
            </div>
            <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <div style={styles.company}>Northbridge Co.</div>
              <div style={styles.tagline}>Leave Management Portal</div>
            </div>
          </div>

          <div className="login-brandBody" style={styles.brandBody}>
            <h1 style={styles.h1}>Sign in</h1>
            <p style={styles.p}>
              Use your company account to request leave and manage approvals.
            </p>

            <div className="login-featureGrid" style={styles.featureGrid}>
              <Feature title="Employees" text="Request and cancel leave, view balances." />
              <Feature title="Managers" text="Approve team requests and generate reports." />
              <Feature title="Admins" text="Create users, assign managers, and audit usage." />
            </div>

            <div className="login-brandFooter" style={styles.brandFooter}>
              <span>Internal use</span>
              <span style={{ opacity: 0.75 }}>© {new Date().getFullYear()} Northbridge Co.</span>
            </div>
          </div>
        </div>

        {/* Right login card */}
        <div className="login-formPanel" style={styles.formPanel}>
          <div style={styles.card}>
            <div style={{ marginBottom: 14 }}>
              <div style={styles.cardTitle}>Welcome back</div>
              <div style={styles.cardSub}>Enter your email and password to continue.</div>
            </div>

            {(errors.form || showEmailError || showPasswordError) && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                style={styles.alertError}
                role="alert"
                aria-live="assertive"
                data-cy="login-error-summary"
              >
                <div style={{ fontWeight: 900, marginBottom: 6 }}>There’s a problem</div>

                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {errors.form && <li>{errors.form}</li>}
                  {showEmailError && <li>{clientErrors.email}</li>}
                  {showPasswordError && <li>{clientErrors.password}</li>}
                </ul>
              </div>
            )}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }} noValidate>
              <label style={styles.label} htmlFor="email">
                Email
              </label>

              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                style={styles.input}
                aria-invalid={showEmailError ? "true" : "false"}
                aria-describedby={emailDescribedBy}
                data-cy="email"
              />

              <div id="email-help" style={styles.helpText}>
                Use your company email address.
              </div>

              {showEmailError && (
                <div id="email-error" style={styles.fieldError} role="alert">
                  {clientErrors.email}
                </div>
              )}

              <label style={styles.label} htmlFor="password">
                Password
              </label>

              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                style={styles.input}
                aria-invalid={showPasswordError ? "true" : "false"}
                aria-describedby={passwordDescribedBy}
                data-cy="password"
              />

              <div id="password-help" style={styles.helpText}>
                Enter the password for your account.
              </div>

              {showPasswordError && (
                <div id="password-error" style={styles.fieldError} role="alert">
                  {clientErrors.password}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={btnPrimary(submitting)}
                data-cy="login-submit"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>

              <div style={styles.hint}>
                Tip: if you’re testing roles, use accounts created in the Admin dashboard.
              </div>
            </form>
          </div>

          <div style={styles.smallPrint}>
            Trouble signing in? Check your backend is running on <b>http://localhost:3000</b> and CORS
            allows <b>http://localhost:5173</b>.
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div style={styles.feature}>
      <div style={{ fontWeight: 950 }}>{title}</div>
      <div style={{ marginTop: 4, color: "rgba(255,255,255,0.82)", fontSize: 13 }}>{text}</div>
    </div>
  );
}

const css = `
@media (max-width: 980px){
  .login-shell{ grid-template-columns: 1fr !important; }
  .login-formPanel{ align-content: start !important; }
}

@media (max-width: 520px){
  .login-shell{ border-radius: 16px !important; }
  .login-brand{ padding: 14px !important; }
  .login-formPanel{ padding: 14px !important; }
  .login-brandBody h1{ font-size: 20px !important; }
  .login-brandFooter{ flex-direction: column !important; align-items: flex-start !important; }
}
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 20% 0%, #eef2ff 0%, rgba(238,242,255,0) 55%), radial-gradient(900px 500px at 80% 10%, #ecfeff 0%, rgba(236,254,255,0) 60%), #f8fafc",
    color: "#0f172a",
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 1100,
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 22px 60px rgba(15, 23, 42, 0.10)",
    background: "#ffffff",
    minWidth: 0,
  },

  brandPanel: {
    background:
      "radial-gradient(900px 400px at 20% 10%, rgba(96,165,250,0.35) 0%, rgba(96,165,250,0) 60%), radial-gradient(900px 500px at 80% 0%, rgba(37,99,235,0.35) 0%, rgba(37,99,235,0) 60%), linear-gradient(135deg, #0f172a 0%, #111827 55%, #0b1224 100%)",
    color: "white",
    padding: 20,
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gap: 18,
    minWidth: 0,
  },
  brandTop: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
    flex: "0 0 auto",
  },
  company: { fontWeight: 950, fontSize: 14, letterSpacing: 0.2 },
  tagline: { fontSize: 12, opacity: 0.8 },

  brandBody: { display: "grid", gap: 14, alignContent: "start", padding: "6px 4px 0 4px", minWidth: 0 },
  h1: { margin: 0, fontSize: 26, fontWeight: 950, letterSpacing: -0.4 },
  p: { margin: 0, fontSize: 14, opacity: 0.85, maxWidth: 460, lineHeight: 1.5 },

  featureGrid: { display: "grid", gap: 10, marginTop: 4, maxWidth: 460 },
  feature: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" },

  brandFooter: {
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 12,
    opacity: 0.75,
    flexWrap: "wrap",
  },

  formPanel: { padding: 20, display: "grid", alignContent: "center", gap: 12, background: "#ffffff", minWidth: 0 },
  card: { border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)", background: "#ffffff" },
  cardTitle: { fontSize: 18, fontWeight: 950, letterSpacing: -0.2 },
  cardSub: { marginTop: 6, fontSize: 13, color: "#64748b" },

  label: { display: "grid", gap: 6, fontSize: 13, fontWeight: 900, color: "#0f172a" },
  input: { padding: 10, border: "1px solid #d1d5db", borderRadius: 12, outline: "none", width: "100%", boxSizing: "border-box" },

  helpText: { fontSize: 12, color: "#64748b", lineHeight: 1.4, marginTop: -6 },
  fieldError: { fontSize: 12, color: "#991b1b", fontWeight: 800, marginTop: -6 },

  alertError: { border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 14, padding: 12, marginBottom: 12, outline: "none" },

  hint: { fontSize: 12, color: "#64748b", lineHeight: 1.45 },
  smallPrint: { fontSize: 12, color: "#64748b", paddingLeft: 2, lineHeight: 1.45 },
};

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    padding: 10,
    borderRadius: 12,
    border: "1px solid #1d4ed8",
    background: disabled ? "#e5e7eb" : "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    color: disabled ? "#6b7280" : "white",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 950,
    boxShadow: disabled ? "none" : "0 10px 22px rgba(37, 99, 235, 0.22)",
    width: "100%",
  };
}
