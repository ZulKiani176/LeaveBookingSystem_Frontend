import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/appshell";
import { ApiError } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { fetchMyLeaveRequests, fetchRemainingLeave, requestLeave, cancelLeave } from "../utils/leaveapi";
import type { LeaveRequest } from "../types/leave";
import { daysBetweenInclusive, todayYYYYMMDD } from "../utils/date";

export default function Dashboard() {
  const { user } = useAuth();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  // accessibility
  const alertRef = useRef<HTMLDivElement | null>(null);

  // form
  const [startDate, setStartDate] = useState(todayYYYYMMDD());
  const [endDate, setEndDate] = useState(todayYYYYMMDD());
  const [leaveType, setLeaveType] = useState<"Annual Leave">("Annual Leave");

  const resetAlerts = () => {
    setMsg("");
    setErr("");
  };

  const showError = (e: unknown) => {
    if (e instanceof ApiError) setErr(`${e.status}: ${e.message}`);
    else setErr("Request failed");
  };

  const load = async () => {
  setLoading(true);
  try {
    const [r1, r2] = await Promise.all([fetchMyLeaveRequests(), fetchRemainingLeave()]);
    setRequests(r1.data);
    setRemaining(r2.data["days remaining"]);
  } catch (e) {
    showError(e);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    void load();
    
  }, []);

  // focus the alert region when msg/err appears
  useEffect(() => {
    if (!msg && !err) return;
    alertRef.current?.focus();
  }, [msg, err]);

  const daysRequested = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const n = daysBetweenInclusive(startDate, endDate);
    return Number.isFinite(n) ? n : 0;
  }, [startDate, endDate]);

  const onRequestLeave = async () => {
    resetAlerts();
    setBusy(true);
    try {
      await requestLeave({ startDate, endDate, leaveType });
      setMsg("Leave request submitted.");
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async (id: number) => {
    resetAlerts();
    setBusy(true);
    try {
      await cancelLeave(id);
      setMsg(`Cancelled request ${id}.`);
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Employee Dashboard" subtitle="View your balance, request leave, and manage your requests.">
        <style>{css}</style>
        <a className="sr-only sr-only-focusable" href="#emp-main" data-cy="skip-main">
          Skip to main content
        </a>
        <main id="emp-main" style={{ padding: 8 }} aria-busy="true" data-cy="emp-main">
          Loading...
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell title="Employee Dashboard" subtitle="Request leave, track approvals, and cancel if needed.">
      <style>{css}</style>

      <a className="sr-only sr-only-focusable" href="#emp-main" data-cy="skip-main">
        Skip to main content
      </a>

      <main id="emp-main" aria-busy={busy ? "true" : "false"} data-cy="emp-main">
        {(msg || err) && (
          <div
            ref={alertRef}
            tabIndex={-1}
            className={`emp-alert ${err ? "err" : "ok"}`}
            role={err ? "alert" : "status"}
            aria-live={err ? "assertive" : "polite"}
            data-cy={err ? "emp-alert-error" : "emp-alert-success"}
          >
            <div className="emp-alertTitle">{err ? "Error" : "Success"}</div>
            <div className="emp-alertBody">{err || msg}</div>
          </div>
        )}

        <div className="emp-wrap">
          {/* LEFT COLUMN */}
          <div className="emp-left">
            {/* Profile / summary card */}
            <section style={cardStyle} aria-label="Profile and balance" data-cy="emp-profile">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Signed in as</div>
                  <div style={{ fontSize: 16, fontWeight: 900 }} data-cy="emp-user-name">
                    {user ? `${user.firstname} ${user.surname}` : "User"}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }} data-cy="emp-user-meta">
                    {user ? `${user.role.name} • ${user.department}` : ""}
                  </div>
                </div>

                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    background: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
                    color: "white",
                    boxShadow: "0 10px 22px rgba(37, 99, 235, 0.20)",
                    flex: "0 0 auto",
                  }}
                  aria-hidden="true"
                  data-cy="emp-avatar"
                >
                  {(user?.firstname?.[0] || "U") + (user?.surname?.[0] || "")}
                </div>
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <div style={statCardStyle} data-cy="emp-balance-card">
                  <div style={{ fontSize: 12, color: "#64748b" }}>Annual leave remaining</div>
                  <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: -0.5 }} data-cy="emp-balance">
                    {remaining ?? "-"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>days</div>
                </div>

                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Tip: Use <b>Annual Leave</b> for booked time off
                </div>
              </div>
            </section>

            {/* Quick actions */}
            <section style={cardStyle} aria-label="Quick actions" data-cy="emp-quick-actions">
              <div style={cardHeaderStyle}>
                <h2 style={cardTitleStyle}>Quick actions</h2>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void load()}
                  style={btnGhostStyle(busy)}
                  aria-disabled={busy}
                  data-cy="emp-refresh-top"
                >
                  Refresh
                </button>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Reloads your leave requests + leave balance.</div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="emp-right">
            {/* Request leave */}
            <section style={cardStyle} aria-label="Request leave form" data-cy="emp-request-form">
              <div style={cardHeaderStyle}>
                <h2 style={cardTitleStyle}>Request leave</h2>
                <div style={{ fontSize: 12, color: "#64748b" }} data-cy="emp-days-requested">
                  Days requested: <b>{daysRequested}</b>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  Leave type
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    style={inputStyle}
                    aria-label="Leave type"
                    data-cy="emp-leave-type"
                  >
                    <option>Annual Leave</option>
                  </select>
                </label>

                <div className="emp-dateGrid" data-cy="emp-date-grid">
                  <label style={{ display: "grid", gap: 6 }}>
                    Start date
                    <input
                      type="date"
                      value={startDate}
                      min={todayYYYYMMDD()}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={inputStyle}
                      aria-label="Start date"
                      data-cy="emp-start-date"
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    End date
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || todayYYYYMMDD()}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={inputStyle}
                      aria-label="End date"
                      data-cy="emp-end-date"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={onRequestLeave}
                  disabled={busy}
                  style={btnPrimaryStyle(busy)}
                  aria-disabled={busy}
                  data-cy="emp-submit-request"
                >
                  {busy ? "Submitting..." : "Submit request"}
                </button>

                <div style={{ fontSize: 12, color: "#64748b" }}>Your backend enforces overlaps, balance, and status rules.</div>
              </div>
            </section>

            {/* Your requests */}
            <section style={cardStyle} aria-label="Your leave requests" data-cy="emp-requests">
              <div style={cardHeaderStyle}>
                <h2 style={cardTitleStyle}>Your leave requests</h2>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void load()}
                  style={btnGhostStyle(busy)}
                  aria-disabled={busy}
                  data-cy="emp-refresh-requests"
                >
                  Refresh
                </button>
              </div>

              {requests.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }} data-cy="emp-no-requests">
                  No requests yet.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }} data-cy="emp-requests-list">
                  {requests.map((r) => {
                    const statusKey = String(r.status || "").toLowerCase();
                    const canCancel = r.status === "Pending" || r.status === "Approved";

                    return (
                      <div key={r.id} className="emp-rowCard" data-cy="emp-request-row" data-request-id={r.id}>
                        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                          <div style={{ fontWeight: 900 }} data-cy="emp-request-dates">
                            {r.start_date} → {r.end_date}
                          </div>

                          {/* Status is not colour-only: icon + text pill */}
                          <div className="emp-rowMeta">
                            <span className={`emp-pill ${statusKey}`} data-cy="emp-status-pill">
                              <span className="emp-pillIcon" aria-hidden="true" data-cy="emp-status-icon">
                                {statusKey === "approved"
                                  ? "✓"
                                  : statusKey === "cancelled" || statusKey === "canceled" || statusKey === "rejected"
                                    ? "✕"
                                    : "⏳"}
                              </span>

                              <span className="emp-pillText" data-cy="emp-status-text">
                                {r.status}
                              </span>
                            </span>

                            <span className="emp-reason muted" data-cy="emp-reason">
                              {r.reason ? r.reason : ""}
                            </span>
                          </div>
                        </div>

                        <div className="emp-rowActions">
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => void onCancel(r.id)}
                              disabled={busy}
                              style={btnDangerGhostStyle(busy)}
                              aria-disabled={busy}
                              data-cy="emp-cancel-request"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

/* ===== styles ===== */

const css = `
/* Screen reader helpers */
.sr-only{
  position:absolute;
  width:1px;
  height:1px;
  padding:0;
  margin:-1px;
  overflow:hidden;
  clip:rect(0,0,0,0);
  white-space:nowrap;
  border:0;
}
.sr-only-focusable:focus{
  position:static;
  width:auto;
  height:auto;
  margin:0;
  clip:auto;
  white-space:normal;
  padding: 10px 12px;
  border-radius: 12px;
  border: 2px solid rgba(37,99,235,0.75);
  background: #fff;
  display:inline-block;
}

/* Strong keyboard focus (visible without relying on colour differences) */
button:focus-visible,
input:focus-visible,
select:focus-visible{
  outline: 3px solid rgba(37,99,235,0.75);
  outline-offset: 2px;
}

/* Alerts */
.emp-alert{
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.emp-alert.ok{ background: #ecfeff; }
.emp-alert.err{ background: #fef2f2; }
.emp-alertTitle{ font-weight: 900; margin-bottom: 4px; color: #0f172a; }
.emp-alertBody{ font-weight: 700; color: #0f172a; }

.emp-wrap{
  display: grid;
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  width: 100%;
}

.emp-left,
.emp-right{
  display: grid;
  gap: 16px;
  min-width: 0;
}

@media (max-width: 980px){
  .emp-wrap{
    grid-template-columns: 1fr;
  }
}

/* Date inputs: 2 cols on desktop, 1 col on phone */
.emp-dateGrid{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 520px){
  .emp-dateGrid{
    grid-template-columns: 1fr;
  }
}

/* Request rows: allow wrapping on small screens */
.emp-rowCard{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 14px;
  padding: 12px;
  background: #ffffff;
  flex-wrap: wrap;
}

.emp-rowMeta{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: wrap;
}

.emp-rowActions{
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Status pill: NOT colour-only (icon + text + border) */
.emp-pill{
  display:inline-flex;
  align-items:center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-weight: 900;
  font-size: 12px;
  white-space: nowrap;
}
.emp-pillIcon{
  width: 1.2em;
  text-align:center;
  font-weight: 950;
}

/* Optional colour — meaning still works without it */
.emp-pill.pending{ border-color: rgba(234,179,8,0.45); }
.emp-pill.approved{ border-color: rgba(3,105,161,0.35); }
.emp-pill.rejected{ border-color: rgba(185,28,28,0.30); }

.muted{ color: #64748b; }
.emp-reason{ font-size: 13px; }
`;

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#ffffff",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
  padding: 16,
  minWidth: 0,
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 950,
  letterSpacing: -0.2,
};

const inputStyle: React.CSSProperties = {
  padding: 10,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  outline: "none",
};

const statCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  background: "radial-gradient(700px 200px at 20% 0%, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0) 55%), #ffffff",
};

function btnPrimaryStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: 10,
    borderRadius: 12,
    border: "1px solid #1d4ed8",
    background: disabled ? "#e5e7eb" : "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    color: disabled ? "#6b7280" : "white",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
    boxShadow: disabled ? "none" : "0 10px 22px rgba(37, 99, 235, 0.22)",
  };
}

function btnGhostStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
    opacity: disabled ? 0.7 : 1,
  };
}

function btnDangerGhostStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#b91c1c",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
    opacity: disabled ? 0.7 : 1,
  };
}
