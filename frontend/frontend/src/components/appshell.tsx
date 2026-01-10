import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AppShell({ title, subtitle, children }: Props) {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  const initials = (user?.firstname?.[0] || "U") + (user?.surname?.[0] || "");
  const roleLabel = user?.role?.name ? user.role.name.toUpperCase() : "USER";

  return (
    <div style={styles.page}>
      {/* Global a11y styles + focus ring + skip link behaviour */}
      <style>{a11yCss}</style>

      {/* Skip link (only visible when focused via keyboard) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <TopBar
        companyName="Northbridge Co."
        productTagline="Leave Management Portal"
        roleLabel={roleLabel}
        userName={user ? `${user.firstname} ${user.surname}` : "User"}
        initials={initials.toUpperCase()}
        onLogout={() => {
          logout();
          nav("/login");
        }}
      />

      {/* Landmarked main region */}
      <main id="main-content" style={styles.main} tabIndex={-1} aria-label="Main content">
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.h1}>{title}</h1>
              {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
            </div>
          </div>

          <div style={styles.card}>{children}</div>

          <footer style={styles.footer} aria-label="Footer">
            <span>© {new Date().getFullYear()} Northbridge Co.</span>
            <span style={{ opacity: 0.7 }}>Internal use</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function TopBar({
  companyName,
  productTagline,
  roleLabel,
  userName,
  initials,
  onLogout,
}: {
  companyName: string;
  productTagline: string;
  roleLabel: string;
  userName: string;
  initials: string;
  onLogout: () => void;
}) {
  return (
    <header style={styles.topbar} aria-label="Top navigation">
      <div style={styles.topbarInner}>
        <div style={styles.brand}>
          <div style={styles.logo} aria-hidden="true">
            <span style={{ fontWeight: 900, letterSpacing: 0.5 }}>NC</span>
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={styles.company}>{companyName}</div>
            <div style={styles.tagline}>{productTagline}</div>
          </div>
        </div>

        <div style={styles.right}>
          <span style={styles.rolePill} aria-label={`Role: ${roleLabel}`}>
            {roleLabel}
          </span>

          <div style={styles.user} aria-label="Signed in user">
            <div style={styles.avatar} aria-hidden="true">
              {initials}
            </div>
            <div style={{ display: "grid", gap: 2 }}>
              <div style={styles.userName}>{userName}</div>
              <div style={styles.userSub}>Signed in</div>
            </div>
          </div>

          <button onClick={onLogout} style={styles.logoutBtn} type="button" aria-label="Logout">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

const a11yCss = `
/* Strong, consistent keyboard focus ring */
:focus { outline: none; }
:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.95);
  outline-offset: 3px;
  border-radius: 12px;
}

/* Ensure touch targets don’t get clipped */
button, a, input, select, textarea {
  scroll-margin-top: 90px;
}

/* Skip link: hidden until focused */
.skip-link{
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 9999;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #0f172a;
  font-weight: 900;
  text-decoration: none;

  transform: translateY(-200%);
  transition: transform 120ms ease;
}
.skip-link:focus-visible{
  transform: translateY(0);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce){
  *{ transition: none !important; scroll-behavior: auto !important; }
}
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 20% 0%, #eef2ff 0%, rgba(238,242,255,0) 55%), radial-gradient(900px 500px at 80% 10%, #ecfeff 0%, rgba(236,254,255,0) 60%), #f8fafc",
    color: "#0f172a",
  },

  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    borderBottom: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(8px)",
  },

  topbarInner: {
    maxWidth: 1440,
    width: "100%",
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 260,
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #111827 0%, #334155 100%)",
    color: "white",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.18)",
  },

  company: { fontWeight: 900, fontSize: 14, letterSpacing: 0.2 },
  tagline: { fontSize: 12, color: "#64748b" },

  right: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  rolePill: {
    fontSize: 11,
    fontWeight: 800,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111827",
  },

  user: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 10px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    background: "#0f172a",
    color: "white",
  },

  userName: { fontSize: 13, fontWeight: 800, lineHeight: 1.1 },
  userSub: { fontSize: 12, color: "#64748b", lineHeight: 1.1 },

  logoutBtn: {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: 800,
  },

  main: { padding: "28px 24px" },

  container: {
    width: "100%",
    maxWidth: 1440,
    margin: "0 auto",
    display: "grid",
    gap: 14,
  },

  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  h1: { margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: -0.2 },
  subtitle: { marginTop: 6, color: "#475569", fontSize: 13 },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#ffffff",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
    padding: 16,
    width: "100%",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 12,
    color: "#64748b",
    padding: "6px 2px",
  },
};
