import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/appshell";

type ManagedEmployee = {
  userId: number;
  firstname: string;
  surname: string;
};

type PendingLeaveRow = {
  request_id: number;
  employee_id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
};

type PendingSummaryRow = {
  userId: number;
  name: string;
  pendingRequests: number;
};

type UpcomingLeaveRow = {
  userId: number;
  name: string;
  startDate: string;
  endDate: string;
};

type EmployeeLeaveBalanceResponse = {
  message: string;
  data: {
    userId: number;
    firstname: string;
    surname: string;
    "days remaining": number;
  };
};

type TabKey = "team" | "pending" | "actions" | "reports";

const NAV: Array<{ key: TabKey; label: string; desc: string }> = [
  { key: "team", label: "Team", desc: "Managed employees and balances" },
  { key: "pending", label: "Pending", desc: "Pending requests in your team" },
  { key: "actions", label: "Actions", desc: "Approve and reject requests" },
  { key: "reports", label: "Reports", desc: "Pending summary + upcoming leave" },
];

export default function ManagerDashboard() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<TabKey>("team");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Mobile drawer
  const [navOpen, setNavOpen] = useState(false);

  // TEAM
  const [managedEmployees, setManagedEmployees] = useState<ManagedEmployee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeBalance, setSelectedEmployeeBalance] = useState<number | null>(null);

  // PENDING
  const [pending, setPending] = useState<PendingLeaveRow[]>([]);

  // ACTIONS
  const [approveId, setApproveId] = useState("");
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // REPORTS
  const [pendingSummary, setPendingSummary] = useState<PendingSummaryRow[]>([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState<UpcomingLeaveRow[]>([]);

  // Accessibility refs
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const openBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);

  const resetAlerts = () => {
    setMsg("");
    setErr("");
  };

  const showError = (e: unknown) => {
    if (e instanceof ApiError) setErr(`${e.status}: ${e.message}`);
    else setErr("Request failed");
  };

  
  const loadManagedEmployees = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const res = await api<{ message: string; data: ManagedEmployee[] }>("/api/leave-requests/managed-users", { auth: true });
      setManagedEmployees(res.data);
      setMsg("Refresh successful.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const loadEmployeeBalance = async (employeeId: number) => {
    resetAlerts();
    setBusy(true);
    try {
      const res = await api<EmployeeLeaveBalanceResponse>(`/api/leave-requests/remaining/${employeeId}`, { auth: true });
      setSelectedEmployeeBalance(res.data["days remaining"]);
      setMsg(`Loaded leave balance for employee ${employeeId}.`);
    } catch (e) {
      setSelectedEmployeeBalance(null);
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const loadPendingRequests = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const res = await api<{ message: string; data: PendingLeaveRow[] }>("/api/leave-requests/pending", { auth: true });
      setPending(res.data);
      setMsg("Successfully loaded");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const loadPendingSummary = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const res = await api<{ message: string; data: PendingSummaryRow[] }>("/api/leave-requests/reports/pending-summary", { auth: true });
      setPendingSummary(res.data);
      setMsg("Successfully loaded");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const loadUpcomingLeaves = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const res = await api<{ message: string; data: UpcomingLeaveRow[] }>("/api/leave-requests/reports/upcoming-leaves", { auth: true });
      setUpcomingLeaves(res.data);
      setMsg("Loaded upcoming leaves report.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  
  const approveLeave = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const id = Number(approveId);
      if (!id) throw new ApiError(400, "Enter a valid leaveRequestId");

      await api("/api/leave-requests/approve", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ leaveRequestId: id }),
      });

      setMsg(`Approved request ${id}.`);
      setApproveId("");
      await loadPendingRequests();
      await loadPendingSummary();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const rejectLeave = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const id = Number(rejectId);
      if (!id) throw new ApiError(400, "Enter a valid leaveRequestId");

      await api("/api/leave-requests/reject", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          leaveRequestId: id,
          reason: rejectReason.trim() || undefined,
        }),
      });

      setMsg(`Rejected request ${id}.`);
      setRejectId("");
      setRejectReason("");
      await loadPendingRequests();
      await loadPendingSummary();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  
  useEffect(() => {
    if (user?.role?.name && user.role.name !== "manager") {
      nav("/dashboard", { replace: true });
      return;
    }

    loadManagedEmployees();
    loadPendingRequests();
    
  }, []);

  
  useEffect(() => {
    setNavOpen(false);
  }, [tab]);

  
  useEffect(() => {
    if (!msg && !err) return;
    alertRef.current?.focus();
  }, [msg, err]);

  
  useEffect(() => {
    if (!navOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into drawer
    setTimeout(() => closeBtnRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setNavOpen(false);
        return;
      }

      if (e.key !== "Tab") return;
      const root = drawerRef.current;
      if (!root) return;

      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
      openBtnRef.current?.focus();
    };
  }, [navOpen]);

  const selectedEmployeeName = useMemo(() => {
    const id = Number(selectedEmployeeId);
    if (!id) return "";
    const emp = managedEmployees.find((e) => e.userId === id);
    return emp ? `${emp.firstname} ${emp.surname}` : "";
  }, [selectedEmployeeId, managedEmployees]);

  const activeNav = NAV.find((n) => n.key === tab);

  const SideNav = (
    <aside className="mgr-side" aria-label="Manager navigation" data-cy="mgr-sidenav">
      <div className="mgr-brand" data-cy="mgr-brand">
        <div className="mgr-dot" data-cy="mgr-brand-dot" />
        <div>
          <div className="mgr-brandTitle" data-cy="mgr-brand-title">Northbridge Co.</div>
          <div className="mgr-brandSub" data-cy="mgr-brand-sub">Manager Console</div>
        </div>
      </div>

      <nav className="mgr-nav" aria-label="Manager sections" data-cy="mgr-nav">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={`mgr-navBtn ${tab === item.key ? "active" : ""}`}
            onClick={() => setTab(item.key)}
            type="button"
            aria-current={tab === item.key ? "page" : undefined}
            data-cy={`mgr-nav-${item.key}`}
          >
            <div className="mgr-navBtnTop">
              <span className="mgr-navLabel">{item.label}</span>
              {tab === item.key && <span className="mgr-chip">Active</span>}
            </div>
            <div className="mgr-navDesc">{item.desc}</div>
          </button>
        ))}
      </nav>

      <div className="mgr-foot" data-cy="mgr-help">
        <div className="mgr-footTitle">Help</div>
        <div className="mgr-footText">
          Use <span className="mgr-kbd">Pending</span> to grab request IDs, then approve/reject in{" "}
          <span className="mgr-kbd">Actions</span>. Reports are evidence-ready.
        </div>
      </div>
    </aside>
  );

  return (
    <AppShell title="Manager Dashboard" subtitle="Approve team leave requests and generate manager reports.">
      <style>{css}</style>

      {/* Mobile top bar */}
      <div className="mgr-mobileBar" data-cy="mgr-mobile-bar">
        <button
          ref={openBtnRef}
          className="mgr-iconBtn"
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={navOpen}
          aria-controls="manager-nav-drawer"
          data-cy="mgr-open-menu"
        >
          ☰
        </button>

        <div className="mgr-mobileTitle" data-cy="mgr-mobile-title">
          <div className="mgr-mobileTitleTop" data-cy="mgr-mobile-title-top">{activeNav?.label}</div>
          <div className="mgr-mobileTitleSub" data-cy="mgr-mobile-title-sub">{activeNav?.desc}</div>
        </div>

        <button
          className="mgr-iconBtn"
          type="button"
          disabled={busy}
          onClick={loadPendingRequests}
          aria-label="Refresh pending"
          data-cy="mgr-refresh-pending-mobile"
        >
          ↻
        </button>
      </div>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="mgr-drawerOverlay" role="dialog" aria-modal="true" aria-label="Navigation menu" data-cy="mgr-drawer-overlay">
          <div id="manager-nav-drawer" ref={drawerRef} className="mgr-drawer" data-cy="mgr-drawer">
            <div className="mgr-drawerTop" data-cy="mgr-drawer-top">
              <div className="mgr-drawerTopTitle">Menu</div>
              <button
                ref={closeBtnRef}
                className="mgr-iconBtn"
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close menu"
                data-cy="mgr-close-menu"
              >
                ✕
              </button>
            </div>
            {SideNav}
          </div>
          <button
            className="mgr-drawerBackdrop"
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu backdrop"
            data-cy="mgr-drawer-backdrop"
          />
        </div>
      )}

      <div className="mgr-wrap" data-cy="mgr-wrap">
        <div className="mgr-sideDesktop" data-cy="mgr-side-desktop">{SideNav}</div>

        <main className="mgr-main" data-cy="mgr-main">
          <div className="mgr-head" data-cy="mgr-header">
            <div>
              <div className="mgr-hTitle" data-cy="mgr-header-title">{activeNav?.label}</div>
              <div className="mgr-hSub" data-cy="mgr-header-sub">{activeNav?.desc}</div>
            </div>

            <div className="mgr-actions" data-cy="mgr-header-actions">
              <button className="mgr-btnSecondary" disabled={busy} onClick={loadManagedEmployees} type="button" data-cy="mgr-refresh-team">
                Refresh
              </button>
            </div>
          </div>

          {(msg || err) && (
            <div
              ref={alertRef}
              tabIndex={-1}
              className={`mgr-alert ${err ? "err" : "ok"}`}
              role={err ? "alert" : "status"}
              aria-live={err ? "assertive" : "polite"}
              data-cy={err ? "mgr-alert-error" : "mgr-alert-success"}
            >
              <div className="mgr-alertTitle">{err ? "Error" : "Success"}</div>
              <div className="mgr-alertBody">{err || msg}</div>
            </div>
          )}

          {/* TEAM */}
          {tab === "team" && (
            <section className="mgr-card" aria-label="Managed employees" data-cy="mgr-tab-team">
              <div className="mgr-cardTop">
                <div>
                  <div className="mgr-cardTitle">Managed employees</div>
                  <div className="mgr-cardSub">Select an employee to pull their remaining leave balance.</div>
                </div>
                <button className="mgr-btnPrimary" disabled={busy} onClick={loadManagedEmployees} type="button" data-cy="mgr-team-refresh">
                  {busy ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="mgr-grid2">
                <div className="mgr-miniCard" data-cy="mgr-team-left">
                  <label className="mgr-field">
                    <div className="mgr-fieldLabel">Select employee</div>
                    <select
                      className="mgr-input"
                      value={selectedEmployeeId}
                      onChange={async (e) => {
                        const v = e.target.value;
                        setSelectedEmployeeId(v);
                        setSelectedEmployeeBalance(null);
                        const id = Number(v);
                        if (id) await loadEmployeeBalance(id);
                      }}
                      aria-label="Select employee"
                      data-cy="mgr-select-employee"
                    >
                      <option value="">Select employee</option>
                      {managedEmployees.map((e) => (
                        <option key={e.userId} value={e.userId}>
                          {e.userId} — {e.firstname} {e.surname}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mgr-panel" data-cy="mgr-team-panel">
                    <div className="muted">Selected employee</div>
                    <div className="mgr-strong" data-cy="mgr-selected-employee-name">
                      {selectedEmployeeName || "-"}
                    </div>

                    <div className="mgr-stats" data-cy="mgr-team-stats">
                      <Stat label="Leave balance (days)" value={selectedEmployeeBalance ?? 0} muted={selectedEmployeeBalance === null} />
                      <Stat label="Employees managed" value={managedEmployees.length} muted={false} />
                    </div>

                    {selectedEmployeeId && selectedEmployeeBalance === null && (
                      <div className="muted" style={{ marginTop: 8, fontSize: 12 }} data-cy="mgr-balance-not-loaded">
                        Balance not loaded (or you don’t manage this employee).
                      </div>
                    )}
                  </div>

                  {!managedEmployees.length && (
                    <div className="muted" style={{ marginTop: 10, fontSize: 12 }} data-cy="mgr-team-empty">
                      No managed employees found.
                    </div>
                  )}
                </div>

                <div className="mgr-miniCard" data-cy="mgr-team-right">
                  <div className="mgr-miniTitle">Team list</div>
                  <div className="mgr-tableWrap">
                    <table className="mgr-table" data-cy="mgr-team-table">
                      <caption className="sr-only">Managed employees</caption>
                      <thead>
                        <tr>
                          {["User ID", "First name", "Surname"].map((h) => (
                            <th key={h} scope="col">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {managedEmployees.map((e) => (
                          <tr key={e.userId} data-cy="mgr-team-row" data-user-id={e.userId}>
                            <td data-cy="mgr-team-userid">{e.userId}</td>
                            <td data-cy="mgr-team-firstname">{e.firstname}</td>
                            <td data-cy="mgr-team-surname">{e.surname}</td>
                          </tr>
                        ))}
                        {!managedEmployees.length && (
                          <tr>
                            <td colSpan={3} className="muted" data-cy="mgr-team-empty-row">
                              No managed employees found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* PENDING */}
          {tab === "pending" && (
            <section className="mgr-card" aria-label="Pending requests" data-cy="mgr-tab-pending">
              <div className="mgr-cardTop">
                <div>
                  <div className="mgr-cardTitle">Pending requests (your team)</div>
                  <div className="mgr-cardSub">Use request IDs in Actions to approve/reject.</div>
                </div>
                <button className="mgr-btnPrimary" disabled={busy} onClick={loadPendingRequests} type="button" data-cy="mgr-pending-refresh">
                  {busy ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="mgr-tableWrap">
                <table className="mgr-table mgr-tableWide" data-cy="mgr-pending-table">
                  <caption className="sr-only">Pending leave requests</caption>
                  <thead>
                    <tr>
                      {["Request ID", "Employee ID", "Name", "Start", "End", "Status"].map((h) => (
                        <th key={h} scope="col">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((p) => (
                      <tr key={p.request_id} data-cy="mgr-pending-row" data-request-id={p.request_id}>
                        <td data-cy="mgr-pending-request-id">{p.request_id}</td>
                        <td data-cy="mgr-pending-employee-id">{p.employee_id}</td>
                        <td data-cy="mgr-pending-name">{p.name}</td>
                        <td className="muted" data-cy="mgr-pending-start">{p.start_date}</td>
                        <td className="muted" data-cy="mgr-pending-end">{p.end_date}</td>
                        <td>
                          <span className="mgr-pill pending" data-cy="mgr-pending-status">{p.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!pending.length && (
                      <tr>
                        <td colSpan={6} className="muted" data-cy="mgr-pending-empty">
                          No pending requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="muted" style={{ marginTop: 10, fontSize: 12 }} data-cy="mgr-pending-tip">
                Tip: copy a Request ID into Actions to approve/reject quickly.
              </div>
            </section>
          )}

          {/* ACTIONS */}
          {tab === "actions" && (
            <section className="mgr-grid2" aria-label="Actions" data-cy="mgr-tab-actions">
              <div className="mgr-card" data-cy="mgr-action-approve">
                <div className="mgr-cardTitle">Approve</div>
                <div className="mgr-cardSub">Use LeaveRequestID found in Pending to approve leave</div>

                <div className="mgr-formGrid" data-cy="mgr-approve-form">
                  <Field label="leaveRequestId" value={approveId} onChange={setApproveId} inputMode="numeric" dataCy="mgr-approve-id" />
                  <button className="mgr-btnPrimary" disabled={busy} onClick={approveLeave} type="button" data-cy="mgr-approve-submit">
                    Approve request
                  </button>
                  <div className="muted" style={{ fontSize: 12 }} data-cy="mgr-approve-tip">
                    Tip: {"{ An admin can also approve leave if you are unable to}"}
                  </div>
                </div>
              </div>

              <div className="mgr-card" data-cy="mgr-action-reject">
                <div className="mgr-cardTitle">Reject</div>
                <div className="mgr-cardSub">Use LeaveRequestID found in Pending to reject leave</div>

                <div className="mgr-formGrid" data-cy="mgr-reject-form">
                  <Field label="leaveRequestId" value={rejectId} onChange={setRejectId} inputMode="numeric" dataCy="mgr-reject-id" />
                  <Field label="Reason (optional)" value={rejectReason} onChange={setRejectReason} dataCy="mgr-reject-reason" />
                  <button className="mgr-btnDanger" disabled={busy} onClick={rejectLeave} type="button" data-cy="mgr-reject-submit">
                    Reject request
                  </button>
                  <div className="muted" style={{ fontSize: 12 }} data-cy="mgr-reject-tip">
                    Tip: {"{ Ask an admin to reject leave if you are unable to, User will see reason on their UI }"}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* REPORTS */}
          {tab === "reports" && (
            <section className="mgr-card" aria-label="Reports" data-cy="mgr-tab-reports">
              <div className="mgr-cardTop">
                <div>
                  <div className="mgr-cardTitle">Reports</div>
                  <div className="mgr-cardSub">Evidence-ready: team workload and upcoming absences.</div>
                </div>
                <div className="mgr-actions" data-cy="mgr-reports-actions">
                  <button
                    className="mgr-btnSecondary"
                    disabled={busy}
                    onClick={loadPendingSummary}
                    type="button"
                    data-cy="mgr-reports-load-pending-summary"
                  >
                    Pending summary
                  </button>
                  <button
                    className="mgr-btnPrimary"
                    disabled={busy}
                    onClick={loadUpcomingLeaves}
                    type="button"
                    data-cy="mgr-reports-load-upcoming"
                  >
                    Upcoming leaves (30 days)
                  </button>
                </div>
              </div>

              <div className="mgr-grid2">
                <div className="mgr-miniCard" data-cy="mgr-report-pending-card">
                  <div className="mgr-miniTitle">Pending requests per employee</div>
                  <div className="mgr-tableWrap">
                    <table className="mgr-table" data-cy="mgr-report-pending-table">
                      <caption className="sr-only">Pending requests per employee</caption>
                      <thead>
                        <tr>
                          {["Employee", "Pending requests"].map((h) => (
                            <th key={h} scope="col">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pendingSummary.map((r) => (
                          <tr key={r.userId} data-cy="mgr-report-pending-row" data-user-id={r.userId}>
                            <td data-cy="mgr-report-pending-employee">
                              {r.userId} — {r.name}
                            </td>
                            <td data-cy="mgr-report-pending-count">{r.pendingRequests}</td>
                          </tr>
                        ))}
                        {!pendingSummary.length && (
                          <tr>
                            <td colSpan={2} className="muted" data-cy="mgr-report-pending-empty">
                              Not loaded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mgr-miniCard" data-cy="mgr-report-upcoming-card">
                  <div className="mgr-miniTitle">Upcoming approved leaves</div>
                  <div className="mgr-tableWrap">
                    <table className="mgr-table mgr-tableWide" data-cy="mgr-report-upcoming-table">
                      <caption className="sr-only">Upcoming approved leaves</caption>
                      <thead>
                        <tr>
                          {["Employee", "Start", "End"].map((h) => (
                            <th key={h} scope="col">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingLeaves.map((r, idx) => (
                          <tr key={`${r.userId}-${idx}`} data-cy="mgr-report-upcoming-row" data-user-id={r.userId}>
                            <td data-cy="mgr-report-upcoming-employee">
                              {r.userId} — {r.name}
                            </td>
                            <td className="muted" data-cy="mgr-report-upcoming-start">{r.startDate}</td>
                            <td className="muted" data-cy="mgr-report-upcoming-end">{r.endDate}</td>
                          </tr>
                        ))}
                        {!upcomingLeaves.length && (
                          <tr>
                            <td colSpan={3} className="muted" data-cy="mgr-report-upcoming-empty">
                              Not loaded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="muted" style={{ marginTop: 10, fontSize: 12 }} data-cy="mgr-report-upcoming-footnote">
                    This report helps with planning team coverage for the next 30 days.
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  dataCy,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  dataCy?: string;
}) {
  return (
    <label className="mgr-field">
      <div className="mgr-fieldLabel">{label}</div>
      <input
        className="mgr-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        inputMode={inputMode}
        data-cy={dataCy}
      />
    </label>
  );
}

function Stat({ label, value, muted }: { label: string; value: number; muted: boolean }) {
  return (
    <div className="mgr-stat">
      <div className="mgr-statLabel">{label}</div>
      <div className={`mgr-statValue ${muted ? "mutedVal" : ""}`}>{muted ? "-" : value}</div>
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
  --danger: #dc2626;
  --radius: 16px;
}

/* Screen-reader only utility */
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

/* Strong visible focus (keyboard + WCAG) */
.mgr-iconBtn:focus-visible,
.mgr-btnPrimary:focus-visible,
.mgr-btnSecondary:focus-visible,
.mgr-btnDanger:focus-visible,
.mgr-navBtn:focus-visible,
.mgr-input:focus-visible{
  outline: 3px solid rgba(37,99,235,0.75);
  outline-offset: 2px;
}

/* Layout */
.mgr-wrap{
  display: grid;
  grid-template-columns: clamp(220px, 24vw, 300px) 1fr;
  gap: 16px;
  align-items: start;
  width: 100%;
}

.mgr-sideDesktop{ display: block; }
.mgr-mobileBar{ display: none; }

@media (max-width: 980px){
  .mgr-wrap{ grid-template-columns: 1fr; }
  .mgr-sideDesktop{ display: none; }
  .mgr-head{ display: none; }
  .mgr-mobileBar{ display: flex; }
}

.mgr-main{ display: grid; gap: 12px; min-width: 0; }

/* Mobile top bar */
.mgr-mobileBar{
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: var(--shadow);
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.mgr-iconBtn{
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 900;
  cursor: pointer;
}
.mgr-iconBtn:disabled{ opacity: 0.6; cursor: not-allowed; }
.mgr-mobileTitle{ min-width: 0; flex: 1; }
.mgr-mobileTitleTop{ font-weight: 950; color: var(--text); }
.mgr-mobileTitleSub{ font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Drawer */
.mgr-drawerOverlay{ position: fixed; inset: 0; z-index: 60; display: flex; }
.mgr-drawer{
  width: min(340px, 88vw);
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  padding: 12px;
  z-index: 61;
}
.mgr-drawerBackdrop{ flex: 1; border: none; background: rgba(2,6,23,0.45); cursor: pointer; }
.mgr-drawerTop{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: var(--shadow);
  margin-bottom: 10px;
}
.mgr-drawerTopTitle{ font-weight: 950; color: var(--text); }

/* Sidebar */
.mgr-side{
  background: linear-gradient(180deg, #0b1220 0%, #0a1533 55%, #071029 100%);
  color: #e5e7eb;
  border-radius: var(--radius);
  padding: 14px;
  box-shadow: var(--shadow);
  position: sticky;
  top: 14px;
  max-height: calc(100vh - 28px);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
@media (max-width: 980px){
  .mgr-side{
    position: relative;
    top: 0;
    max-height: none;
    overflow: visible;
  }
}

.mgr-brand{
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 10px 14px;
  border-bottom: 1px solid rgba(226,232,240,0.15);
  margin-bottom: 12px;
}
.mgr-dot{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #93c5fd, #2563eb 60%, #1e3a8a);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.15);
}
.mgr-brandTitle{ font-weight: 900; letter-spacing: 0.2px; }
.mgr-brandSub{ font-size: 12px; color: rgba(226,232,240,0.75); margin-top: 2px; }

.mgr-nav{ display: grid; gap: 8px; margin-top: 12px; }
.mgr-navBtn{
  text-align: left;
  border: 1px solid rgba(226,232,240,0.18);
  background: rgba(255,255,255,0.06);
  color: #e5e7eb;
  border-radius: 14px;
  padding: 10px;
  cursor: pointer;
  transition: transform 120ms ease, background 120ms ease, border 120ms ease;
}
.mgr-navBtn:hover{
  transform: translateY(-1px);
  background: rgba(255,255,255,0.10);
  border-color: rgba(147,197,253,0.45);
}
.mgr-navBtn.active{ background: rgba(37,99,235,0.25); border-color: rgba(147,197,253,0.65); }
.mgr-navBtnTop{ display:flex; align-items:center; justify-content:space-between; gap: 10px; }
.mgr-navLabel{ font-weight: 800; }
.mgr-navDesc{ font-size: 12px; color: rgba(226,232,240,0.75); margin-top: 4px; }
.mgr-chip{
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(147,197,253,0.16);
  border: 1px solid rgba(147,197,253,0.35);
  color: #bfdbfe;
  font-weight: 800;
}

.mgr-foot{
  margin-top: 14px;
  border-top: 1px solid rgba(226,232,240,0.15);
  padding-top: 12px;
}
.mgr-footTitle{ font-weight: 800; font-size: 12px; color: rgba(226,232,240,0.85); margin-bottom: 6px; }
.mgr-footText{ font-size: 12px; color: rgba(226,232,240,0.70); line-height: 1.5; }
.mgr-kbd{ padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(226,232,240,0.18); background: rgba(255,255,255,0.06); font-weight: 800; }

/* Header (desktop) */
.mgr-head{
  display:flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  box-shadow: var(--shadow);
}
.mgr-hTitle{ font-weight: 900; color: var(--text); font-size: 16px; }
.mgr-hSub{ font-size: 12px; color: var(--muted); margin-top: 3px; }

.mgr-actions{ display:flex; gap: 10px; flex-wrap: wrap; align-items: center; }

/* Alerts */
.mgr-alert{
  border-radius: var(--radius);
  padding: 12px 14px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.mgr-alert.ok{ background: #ecfeff; border-color: rgba(3,105,161,0.25); }
.mgr-alert.err{ background: #fef2f2; border-color: rgba(185,28,28,0.22); }
.mgr-alertTitle{ font-weight: 900; margin-bottom: 4px; color: var(--text); }
.mgr-alertBody{ color: var(--text); font-size: 14px; }

/* Cards */
.mgr-card{
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
  min-width: 0;
}
.mgr-cardTop{
  display:flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.mgr-cardTitle{ font-weight: 900; color: var(--text); }
.mgr-cardSub{ font-size: 12px; color: var(--muted); margin-top: 4px; }

.mgr-grid2{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
@media (max-width: 980px){
  .mgr-grid2{ grid-template-columns: 1fr; }
}

.mgr-formGrid{ display:grid; gap: 10px; margin-top: 12px; }
.mgr-field{ display:grid; gap: 6px; }
.mgr-fieldLabel{ font-size: 12px; color: var(--muted); font-weight: 800; }

/* Inputs & buttons */
.mgr-input{
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  outline: none;
  background: #ffffff;
  color: var(--text);
  min-width: 0;
}
.mgr-input:focus{ border-color: rgba(37,99,235,0.55); box-shadow: 0 0 0 4px rgba(37,99,235,0.12); }

.mgr-btnPrimary,
.mgr-btnSecondary,
.mgr-btnDanger{
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-weight: 900;
  cursor: pointer;
  transition: transform 120ms ease, opacity 120ms ease;
}
.mgr-btnPrimary{ background: linear-gradient(180deg, var(--primary) 0%, var(--primary2) 100%); color: white; }
.mgr-btnSecondary{ background: #ffffff; border: 1px solid var(--border); color: var(--text); }
.mgr-btnDanger{ background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%); color: white; }

.mgr-btnPrimary:disabled,
.mgr-btnSecondary:disabled,
.mgr-btnDanger:disabled{ opacity: 0.6; cursor: not-allowed; }
.mgr-btnPrimary:hover,
.mgr-btnSecondary:hover,
.mgr-btnDanger:hover{ transform: translateY(-1px); }

/* Tables */
.mgr-tableWrap{
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--border);
  min-width: 0;
  -webkit-overflow-scrolling: touch;
}
.mgr-table{
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
}
.mgr-tableWide{ min-width: 760px; }

.mgr-table th{
  text-align:left;
  font-size: 12px;
  color: var(--muted);
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  font-weight: 900;
  white-space: nowrap;
}
.mgr-table td{
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: var(--text);
  font-size: 14px;
  vertical-align: top;
}
.mgr-table tr:hover td{ background: #f8fbff; }

.muted{ color: var(--muted); }

/* Pills (not colour-only) */
.mgr-pill{
  display:inline-flex;
  align-items:center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid var(--border);
  background: #ffffff;
  white-space: nowrap;
}
.mgr-pill::before{
  display:inline-block;
  width: 1.1em;
  text-align:center;
  font-weight: 950;
  content: "⏳";
}
.mgr-pill.pending{
  border-color: rgba(234,179,8,0.35);
  background: rgba(234,179,8,0.10);
  color: #a16207;
}

/* Mini cards + panel */
.mgr-miniCard{
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: #ffffff;
  min-width: 0;
}
.mgr-miniTitle{ font-weight: 950; margin-bottom: 8px; color: var(--text); font-size: 13px; }

.mgr-panel{
  border: 1px solid #f1f5f9;
  border-radius: 14px;
  padding: 12px;
  background: #fbfdff;
  margin-top: 12px;
}
.mgr-strong{ font-weight: 950; font-size: 16px; margin-top: 4px; color: var(--text); }

.mgr-stats{ display:flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
.mgr-stat{
  min-width: 180px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  background: #ffffff;
}
.mgr-statLabel{ font-size: 12px; color: var(--muted); font-weight: 900; }
.mgr-statValue{ font-size: 18px; font-weight: 950; color: var(--text); margin-top: 2px; }
.mutedVal{ color: #9ca3af; }
`;
