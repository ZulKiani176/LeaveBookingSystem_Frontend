import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../utils/api";
import AppShell from "../components/appshell";

type UserRow = {
  userId: number;
  firstname: string;
  surname: string;
  email: string;
  department: string;
  role: string;
  annualLeaveBalance: number;
};

type PendingLeaveRow = {
  requestId: number;
  userId: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string | null;
};

type CompanySummaryResponse = {
  message: string;
  data: {
    departmentUsage: Record<string, number>;
    userUsage: Record<number, { name: string; days: number }>;
    totalApprovedRequests: number;
  };
};

type DepartmentUsageResponse = {
  message: string;
  data: Record<string, number>;
};

type TabKey = "users" | "addUser" | "assignManager" | "pending" | "tools" | "reports";

const NAV: Array<{ key: TabKey; label: string; desc: string }> = [
  { key: "users", label: "Users", desc: "View and maintain staff records" },
  { key: "addUser", label: "Add user", desc: "Create a new account" },
  { key: "assignManager", label: "Assign manager", desc: "Link employees to managers" },
  { key: "pending", label: "Pending requests", desc: "Review pending leave" },
  { key: "tools", label: "Admin tools", desc: "Approve/cancel and update balances" },
  { key: "reports", label: "Reports", desc: "Usage and summaries" },
];

const COLOR_SAFE_KEY = "a11y_color_safe";

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("users");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [userQuery, setUserQuery] = useState("");

  const [newUser, setNewUser] = useState({
    firstname: "",
    surname: "",
    email: "",
    password: "",
    roleId: 1,
    department: "Ops",
  });

  const [assign, setAssign] = useState({
    employeeId: "",
    managerId: "",
    startDate: "",
  });

  const [pending, setPending] = useState<PendingLeaveRow[]>([]);
  const [pendingFilter, setPendingFilter] = useState({ userId: "", managerId: "" });

  const [approveId, setApproveId] = useState("");
  const [cancelId, setCancelId] = useState("");

  
  const [rejectReason, setRejectReason] = useState("");


  const [balanceUserId, setBalanceUserId] = useState("");
  const [balanceValue, setBalanceValue] = useState("");

  const [companySummary, setCompanySummary] = useState<CompanySummaryResponse["data"] | null>(null);
  const [deptUsage, setDeptUsage] = useState<Record<string, number> | null>(null);

  const [editRole, setEditRole] = useState<Record<number, number>>({});
  const [editDept, setEditDept] = useState<Record<number, string>>({});
  const [rowBusy, setRowBusy] = useState<Record<number, boolean>>({});

  // Mobile drawer
  const [navOpen, setNavOpen] = useState(false);

  // Colour-safe 
  const [colorSafe, setColorSafe] = useState<boolean>(() => {
    const raw = localStorage.getItem(COLOR_SAFE_KEY);
    return raw === "1";
  });

  // Accessibility 
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

  // apply colour-safe mode to the page 
  useEffect(() => {
    localStorage.setItem(COLOR_SAFE_KEY, colorSafe ? "1" : "0");
    document.documentElement.setAttribute("data-color-safe", colorSafe ? "1" : "0");
  }, [colorSafe]);

  const loadUsers = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const res = await api<{ message: string; data: UserRow[] }>("/api/admin/all-users", { auth: true });
      setUsers(res.data);

      const roleMap: Record<number, number> = {};
      const deptMap: Record<number, string> = {};
      for (const u of res.data) {
        roleMap[u.userId] = roleNameToId(u.role);
        deptMap[u.userId] = u.department ?? "";
      }
      setEditRole(roleMap);
      setEditDept(deptMap);
      setMsg("Refreshed Page.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const addUser = async () => {
    resetAlerts();
    setBusy(true);
    try {
      await api("/api/admin/add-user", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          firstname: newUser.firstname.trim(),
          surname: newUser.surname.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          roleId: Number(newUser.roleId),
          department: newUser.department.trim(),
        }),
      });
      setMsg("User created.");
      setNewUser({ firstname: "", surname: "", email: "", password: "", roleId: 1, department: "Ops" });
      await loadUsers();
      setTab("users");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const assignManager = async () => {
    resetAlerts();
    setBusy(true);
    try {
      await api("/api/admin/assign-manager", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          employeeId: Number(assign.employeeId),
          managerId: Number(assign.managerId),
          startDate: assign.startDate || undefined,
        }),
      });
      setMsg("Manager assigned.");
      setAssign({ employeeId: "", managerId: "", startDate: "" });
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const loadPending = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const qs = new URLSearchParams();
      if (pendingFilter.userId.trim()) qs.set("userId", pendingFilter.userId.trim());
      if (pendingFilter.managerId.trim()) qs.set("managerId", pendingFilter.managerId.trim());

      const url = qs.toString() ? `/api/admin/all-leave-requests?${qs.toString()}` : "/api/admin/all-leave-requests";
      const res = await api<{ message: string; data: PendingLeaveRow[] }>(url, { auth: true });
      setPending(res.data);
      setMsg("Loaded leave request.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const approveAsAdmin = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const id = Number(approveId);
      if (!id) throw new ApiError(400, "Enter a valid leaveRequestId");
      await api(`/api/admin/approve/${id}`, { method: "PATCH", auth: true });
      setMsg(`Approved request ${id}.`);
      setApproveId("");
      await loadPending();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const cancelAsAdmin = async () => {
  resetAlerts();
  setBusy(true);
  try {
    const id = Number(cancelId);
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
    setCancelId("");
    setRejectReason("");
    await loadPending();
  } catch (e) {
    showError(e);
  } finally {
    setBusy(false);
  }
};


  const loadCompanySummary = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const res = await api<CompanySummaryResponse>("/api/admin/reports/company-summary", { auth: true });
      setCompanySummary(res.data);
      setMsg("Loaded company summary.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const loadDepartmentUsage = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const res = await api<DepartmentUsageResponse>("/api/admin/reports/department-usage", { auth: true });
      setDeptUsage(res.data);
      setMsg("Loaded department usage.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const updateUserRole = async (userId: number) => {
    resetAlerts();
    setRowBusy((s) => ({ ...s, [userId]: true }));
    try {
      const roleId = Number(editRole[userId]);
      if (![1, 2, 3].includes(roleId)) throw new ApiError(400, "RoleId must be 1, 2 or 3");

      await api(`/api/admin/update-role/${userId}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ roleId }),
      });

      setMsg(`Updated role for user ${userId}.`);
      await loadUsers();
    } catch (e) {
      showError(e);
    } finally {
      setRowBusy((s) => ({ ...s, [userId]: false }));
    }
  };

  const updateUserDepartment = async (userId: number) => {
    resetAlerts();
    setRowBusy((s) => ({ ...s, [userId]: true }));
    try {
      const department = (editDept[userId] ?? "").trim();
      if (!department) throw new ApiError(400, "Department cannot be empty");

      await api(`/api/admin/update-department/${userId}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ department }),
      });

      setMsg(`Updated department for user ${userId}.`);
      await loadUsers();
    } catch (e) {
      showError(e);
    } finally {
      setRowBusy((s) => ({ ...s, [userId]: false }));
    }
  };

  const updateLeaveBalance = async () => {
    resetAlerts();
    setBusy(true);
    try {
      const userId = Number(balanceUserId);
      const newBalance = Number(balanceValue);

      if (!userId) throw new ApiError(400, "Enter a valid userId");
      if (!Number.isFinite(newBalance) || newBalance < 0) throw new ApiError(400, "Balance must be a number >= 0");

      await api(`/api/admin/update-leave-balance/${userId}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ annualLeaveBalance: newBalance }),
      });

      setMsg(`Updated annual leave balance for user ${userId}.`);
      setBalanceUserId("");
      setBalanceValue("");
      await loadUsers();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadUsers();
    
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

    const prevOverflow = document.body.style.overflow;
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
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      // Return focus to opener
      openBtnRef.current?.focus();
    };
  }, [navOpen]);

  const managers = useMemo(() => users.filter((u) => (u.role || "").toLowerCase() === "manager"), [users]);
  const employees = useMemo(() => users.filter((u) => (u.role || "").toLowerCase() === "employee"), [users]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = `${u.firstname} ${u.surname}`.toLowerCase();
      return (
        String(u.userId).includes(q) ||
        name.includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q)
      );
    });
  }, [users, userQuery]);

  const activeNav = NAV.find((n) => n.key === tab);

  const SideNav = (
    <aside className="adm-side" aria-label="Admin navigation" data-cy="adm-sidenav">
      <div className="adm-brand" data-cy="adm-brand">
        <div className="adm-dot" data-cy="adm-brand-dot" />
        <div>
          <div className="adm-brandTitle" data-cy="adm-brand-title">
            Northbridge Co.
          </div>
          <div className="adm-brandSub" data-cy="adm-brand-sub">
            Admin Console
          </div>
        </div>
      </div>

      <nav className="adm-nav" aria-label="Admin sections" data-cy="adm-nav">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={`adm-navBtn ${tab === item.key ? "active" : ""}`}
            onClick={() => setTab(item.key)}
            type="button"
            aria-current={tab === item.key ? "page" : undefined}
            data-cy={`adm-nav-${item.key}`}
          >
            <div className="adm-navBtnTop">
              <span className="adm-navLabel">{item.label}</span>
              {tab === item.key && <span className="adm-chip">Active</span>}
            </div>
            <div className="adm-navDesc">{item.desc}</div>
          </button>
        ))}
      </nav>

      <div className="adm-foot" data-cy="adm-help">
        <div className="adm-footTitle">Help</div>
        <div className="adm-footText">
          Use <span className="adm-kbd">Reports</span> for company-wide statistics. Use{" "}
          <span className="adm-kbd">Assign manager</span> before testing manager workflows.
        </div>
      </div>
    </aside>
  );

  return (
    <AppShell title="Admin Dashboard" subtitle="Manage staff, approvals, and reporting for your company.">
      <style>{css}</style>

      {/* Mobile top bar (hamburger) */}
      <div className="adm-mobileBar" data-cy="adm-mobile-bar">
        <button
          ref={openBtnRef}
          className="adm-iconBtn"
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={navOpen}
          aria-controls="admin-nav-drawer"
          data-cy="adm-open-menu"
        >
          ☰
        </button>

        <div className="adm-mobileTitle" data-cy="adm-mobile-title">
          <div className="adm-mobileTitleTop" data-cy="adm-mobile-title-top">
            {activeNav?.label}
          </div>
          <div className="adm-mobileTitleSub" data-cy="adm-mobile-title-sub">
            {activeNav?.desc}
          </div>
        </div>

        <button
          className="adm-iconBtn"
          type="button"
          onClick={() => setColorSafe((v) => !v)}
          aria-pressed={colorSafe}
          aria-label="Toggle colour-safe mode"
          title="Colour-safe mode"
          data-cy="adm-toggle-color-safe-mobile"
        >
          {colorSafe ? "A11Y" : "A11Y"}
        </button>

        <button
          className="adm-iconBtn"
          type="button"
          disabled={busy}
          onClick={loadUsers}
          aria-label="Refresh users"
          data-cy="adm-refresh-users-mobile"
        >
          ↻
        </button>
      </div>

      {/* Mobile drawer */}
      {navOpen && (
        <div
          className="adm-drawerOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          data-cy="adm-drawer-overlay"
        >
          <div id="admin-nav-drawer" ref={drawerRef} className="adm-drawer" data-cy="adm-drawer">
            <div className="adm-drawerTop" data-cy="adm-drawer-top">
              <div className="adm-drawerTopTitle">Menu</div>
              <button
                ref={closeBtnRef}
                className="adm-iconBtn"
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close menu"
                data-cy="adm-close-menu"
              >
                ✕
              </button>
            </div>
            {SideNav}
          </div>
          <button
            className="adm-drawerBackdrop"
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu backdrop"
            data-cy="adm-drawer-backdrop"
          />
        </div>
      )}

      <div className="adm-wrap" data-cy="adm-wrap">
        <div className="adm-sideDesktop" data-cy="adm-side-desktop">
          {SideNav}
        </div>

        <main className="adm-main" data-cy="adm-main">
          <div className="adm-head" data-cy="adm-header">
            <div>
              <div className="adm-hTitle" data-cy="adm-header-title">
                {activeNav?.label}
              </div>
              <div className="adm-hSub" data-cy="adm-header-sub">
                {activeNav?.desc}
              </div>
            </div>
            <div className="adm-actions" data-cy="adm-header-actions">
              <button
                className="adm-btnSecondary"
                type="button"
                onClick={() => setColorSafe((v) => !v)}
                aria-pressed={colorSafe}
                title="Colour-safe mode"
                data-cy="adm-toggle-color-safe"
              >
                Colour-safe: {colorSafe ? "On" : "Off"}
              </button>
              <button
                className="adm-btnSecondary"
                disabled={busy}
                onClick={loadUsers}
                type="button"
                data-cy="adm-refresh-users"
              >
                Refresh
              </button>
            </div>
          </div>

          {(msg || err) && (
            <div
              ref={alertRef}
              tabIndex={-1}
              className={`adm-alert ${err ? "err" : "ok"}`}
              role={err ? "alert" : "status"}
              aria-live={err ? "assertive" : "polite"}
              data-cy={err ? "adm-alert-error" : "adm-alert-success"}
            >
              <div className="adm-alertTitle">{err ? "Error" : "Success"}</div>
              <div className="adm-alertBody">{err || msg}</div>
            </div>
          )}

          {tab === "users" && (
            <section className="adm-card" aria-label="All users" data-cy="adm-tab-users">
              <div className="adm-cardTop">
                <div>
                  <div className="adm-cardTitle" data-cy="adm-users-title">
                    All users
                  </div>
                  <div className="adm-cardSub">Search and update role/department inline.</div>
                </div>

                <div className="adm-actions">
                  <input
                    className="adm-input adm-search"
                    placeholder="Search by ID, name, email, role, dept..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    aria-label="Search users"
                    data-cy="adm-user-search"
                  />
                  <button
                    className="adm-btnPrimary"
                    disabled={busy}
                    onClick={loadUsers}
                    type="button"
                    data-cy="adm-users-refresh"
                  >
                    {busy ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>

              <div className="adm-tableWrap" data-cy="adm-users-tablewrap">
                <table className="adm-table" data-cy="adm-users-table">
                  <caption className="sr-only">Company users list</caption>
                  <thead>
                    <tr>
                      {["ID", "Name", "Email", "Role", "Department", "Leave"].map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const uid = u.userId;
                      const isBusy = !!rowBusy[uid];

                      return (
                        <tr
                          key={uid}
                          data-cy="adm-user-row"
                          data-user-id={uid}
                        >
                          <td data-cy="adm-user-id">{uid}</td>
                          <td>
                            <div className="adm-nameCell">
                              <div className="adm-nameTop">
                                <span className="adm-name" data-cy="adm-user-name">
                                  {u.firstname} {u.surname}
                                </span>
                                <span
                                  className={`adm-pill ${String(u.role).toLowerCase()}`}
                                  data-cy="adm-user-role-pill"
                                >
                                  {u.role}
                                </span>
                              </div>

                              <div className="adm-nameMeta">
                                <span className="muted" data-cy="adm-user-email-meta">
                                  {u.email}
                                </span>
                                <span className="muted" data-cy="adm-user-dept-meta">
                                  • {u.department}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="muted" data-cy="adm-user-email">
                            {u.email}
                          </td>

                          <td>
                            <div className="adm-inline adm-inlineStack">
                              <select
                                className="adm-input compact"
                                value={editRole[uid] ?? roleNameToId(u.role)}
                                onChange={(e) => setEditRole((s) => ({ ...s, [uid]: Number(e.target.value) }))}
                                disabled={isBusy}
                                aria-label={`Role for user ${uid}`}
                                data-cy={`adm-role-select-${uid}`}
                              >
                                <option value={1}>Employee (1)</option>
                                <option value={2}>Manager (2)</option>
                                <option value={3}>Admin (3)</option>
                              </select>

                              <button
                                className="adm-btnMini"
                                disabled={isBusy}
                                onClick={() => updateUserRole(uid)}
                                type="button"
                                data-cy={`adm-role-save-${uid}`}
                              >
                                Save
                              </button>
                            </div>
                          </td>

                          <td>
                            <div className="adm-inline adm-inlineStack">
                              <input
                                className="adm-input compact"
                                value={editDept[uid] ?? u.department ?? ""}
                                onChange={(e) => setEditDept((s) => ({ ...s, [uid]: e.target.value }))}
                                disabled={isBusy}
                                aria-label={`Department for user ${uid}`}
                                data-cy={`adm-dept-input-${uid}`}
                              />
                              <button
                                className="adm-btnMini"
                                disabled={isBusy}
                                onClick={() => updateUserDepartment(uid)}
                                type="button"
                                data-cy={`adm-dept-save-${uid}`}
                              >
                                Save
                              </button>
                            </div>
                          </td>

                          <td data-cy="adm-user-leave-balance">{u.annualLeaveBalance}</td>
                        </tr>
                      );
                    })}

                    {!filteredUsers.length && (
                      <tr>
                        <td colSpan={6} className="muted" data-cy="adm-users-empty">
                          No users match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "addUser" && (
            <section className="adm-card adm-cardNarrow" aria-label="Create user" data-cy="adm-tab-add-user">
              <div className="adm-cardTitle" data-cy="adm-add-user-title">
                Create user
              </div>
              <div className="adm-cardSub">Creates an account with the selected role ID.</div>

              <div className="adm-formGrid" data-cy="adm-add-user-form">
                <Field
                  label="First name"
                  value={newUser.firstname}
                  onChange={(v) => setNewUser((s) => ({ ...s, firstname: v }))}
                  dataCy="adm-new-firstname"
                />
                <Field
                  label="Surname"
                  value={newUser.surname}
                  onChange={(v) => setNewUser((s) => ({ ...s, surname: v }))}
                  dataCy="adm-new-surname"
                />
                <Field
                  label="Email"
                  value={newUser.email}
                  onChange={(v) => setNewUser((s) => ({ ...s, email: v }))}
                  dataCy="adm-new-email"
                />
                <Field
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(v) => setNewUser((s) => ({ ...s, password: v }))}
                  dataCy="adm-new-password"
                />
                <Field
                  label="Department"
                  value={newUser.department}
                  onChange={(v) => setNewUser((s) => ({ ...s, department: v }))}
                  dataCy="adm-new-department"
                />

                <label className="adm-field">
                  <div className="adm-fieldLabel">Role</div>
                  <select
                    className="adm-input"
                    value={newUser.roleId}
                    onChange={(e) => setNewUser((s) => ({ ...s, roleId: Number(e.target.value) }))}
                    data-cy="adm-new-role"
                  >
                    <option value={1}>Employee (1)</option>
                    <option value={2}>Manager (2)</option>
                    <option value={3}>Admin (3)</option>
                  </select>
                </label>

                <button
                  className="adm-btnPrimary"
                  disabled={busy}
                  onClick={addUser}
                  type="button"
                  data-cy="adm-create-user"
                >
                  {busy ? "Creating..." : "Create user"}
                </button>
              </div>
            </section>
          )}

          {tab === "assignManager" && (
            <section className="adm-card adm-cardWide" aria-label="Assign manager" data-cy="adm-tab-assign-manager">
              <div className="adm-cardTitle" data-cy="adm-assign-title">
                Assign manager
              </div>
              <div className="adm-cardSub">Links an employee to a manager (UserManagement table).</div>

              <div className="adm-formGrid adm-formGridWide" data-cy="adm-assign-form">
                <label className="adm-field">
                  <div className="adm-fieldLabel">Employee</div>
                  <select
                    className="adm-input"
                    value={assign.employeeId}
                    onChange={(e) => setAssign((s) => ({ ...s, employeeId: e.target.value }))}
                    data-cy="adm-assign-employee"
                  >
                    <option value="">Select employee</option>
                    {employees.map((e) => (
                      <option key={e.userId} value={e.userId}>
                        {e.userId} — {e.firstname} {e.surname}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="adm-field">
                  <div className="adm-fieldLabel">Manager</div>
                  <select
                    className="adm-input"
                    value={assign.managerId}
                    onChange={(e) => setAssign((s) => ({ ...s, managerId: e.target.value }))}
                    data-cy="adm-assign-manager"
                  >
                    <option value="">Select manager</option>
                    {managers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userId} — {m.firstname} {m.surname}
                      </option>
                    ))}
                  </select>
                </label>

                <Field
                  label="Start date (optional, YYYY-MM-DD)"
                  value={assign.startDate}
                  onChange={(v) => setAssign((s) => ({ ...s, startDate: v }))}
                  dataCy="adm-assign-start-date"
                />

                <button
                  className="adm-btnPrimary"
                  disabled={busy}
                  onClick={assignManager}
                  type="button"
                  data-cy="adm-assign-submit"
                >
                  {busy ? "Assigning..." : "Assign"}
                </button>
              </div>
            </section>
          )}

          {tab === "pending" && (
            <section className="adm-card" aria-label="Pending leave requests" data-cy="adm-tab-pending">
              <div className="adm-cardTop">
                <div>
                  <div className="adm-cardTitle" data-cy="adm-pending-title">
                    Pending leave requests
                  </div>
                  <div className="adm-cardSub">Filter by user ID or manager ID.</div>
                </div>
                <button
                  className="adm-btnPrimary"
                  disabled={busy}
                  onClick={loadPending}
                  type="button"
                  data-cy="adm-pending-load"
                >
                  {busy ? "Loading..." : "Load"}
                </button>
              </div>

              <div className="adm-filters" data-cy="adm-pending-filters">
                <Field
                  label="Filter by userId"
                  value={pendingFilter.userId}
                  onChange={(v) => setPendingFilter((s) => ({ ...s, userId: v }))}
                  dataCy="adm-pending-filter-userid"
                />
                <Field
                  label="Filter by managerId"
                  value={pendingFilter.managerId}
                  onChange={(v) => setPendingFilter((s) => ({ ...s, managerId: v }))}
                  dataCy="adm-pending-filter-managerid"
                />
              </div>

              <div className="adm-tableWrap" data-cy="adm-pending-tablewrap">
                <table className="adm-table adm-tableTight" data-cy="adm-pending-table">
                  <caption className="sr-only">Leave request list</caption>
                  <thead>
                    <tr>
                      {["Request", "User", "Name", "Start", "End", "Status", "Reason"].map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((p) => (
                      <tr
                        key={p.requestId}
                        data-cy="adm-pending-row"
                        data-request-id={p.requestId}
                      >
                        <td data-cy="adm-pending-request-id">{p.requestId}</td>
                        <td data-cy="adm-pending-user-id">{p.userId}</td>
                        <td data-cy="adm-pending-name">{p.name}</td>
                        <td className="muted" data-cy="adm-pending-start">
                          {p.startDate}
                        </td>
                        <td className="muted" data-cy="adm-pending-end">
                          {p.endDate}
                        </td>
                        <td>
                          <span className="adm-pill pending" data-cy="adm-pending-status">
                            {p.status}
                          </span>
                        </td>
                        <td className="muted" data-cy="adm-pending-reason">
                          {p.reason ?? "-"}
                        </td>
                      </tr>
                    ))}
                    {!pending.length && (
                      <tr>
                        <td colSpan={7} className="muted" data-cy="adm-pending-empty">
                          No pending requests loaded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "tools" && (
            <section className="adm-grid2" aria-label="Admin tools" data-cy="adm-tab-tools">
              <div className="adm-card" data-cy="adm-tool-approve">
                <div className="adm-cardTitle">Approve by ID</div>
                <div className="adm-cardSub">Use LeaveRequestID to approve leave</div>

                <div className="adm-formGrid">
                  <Field
                    label="leaveRequestId"
                    value={approveId}
                    onChange={setApproveId}
                    inputMode="numeric"
                    dataCy="adm-approve-id"
                  />
                  <button
                    className="adm-btnPrimary"
                    disabled={busy}
                    onClick={approveAsAdmin}
                    type="button"
                    data-cy="adm-approve-submit"
                  >
                    Approve
                  </button>
                </div>
              </div>

              <div className="adm-card" data-cy="adm-tool-cancel">
  <div className="adm-cardTitle">Cancel any request by ID</div>
  <div className="adm-cardSub">Use LeaveRequestID found in Pending requests</div>

  <div className="adm-formGrid">
    <Field
      label="leaveRequestId"
      value={cancelId}
      onChange={setCancelId}
      inputMode="numeric"
      dataCy="adm-cancel-id"
    />

    <Field
      label="Reason (optional)"
      value={rejectReason}
      onChange={setRejectReason}
      dataCy="adm-cancel-reason"
    />

    <button
      className="adm-btnDanger"
      disabled={busy}
      onClick={cancelAsAdmin}
      type="button"
      data-cy="adm-cancel-submit"
    >
      Cancel request
    </button>
  </div>
</div>

              <div className="adm-card" data-cy="adm-tool-balance">
                <div className="adm-cardTitle">Update annual leave balance</div>
                <div className="adm-cardSub">Use UserID and a number to update balance</div>

                <div className="adm-formGrid adm-formGridWide">
                  <Field
                    label="userId"
                    value={balanceUserId}
                    onChange={setBalanceUserId}
                    inputMode="numeric"
                    dataCy="adm-balance-userid"
                  />
                  <Field
                    label="New balance"
                    value={balanceValue}
                    onChange={setBalanceValue}
                    inputMode="numeric"
                    dataCy="adm-balance-value"
                  />
                  <button
                    className="adm-btnPrimary"
                    disabled={busy}
                    onClick={updateLeaveBalance}
                    type="button"
                    data-cy="adm-balance-submit"
                  >
                    Update balance
                  </button>
                </div>
              </div>

              <div className="adm-card soft" data-cy="adm-tool-info">
                <div className="adm-cardTitle">Admin Console</div>
                <div className="adm-cardSub">Use the left menu to access tools and reports.</div>
              </div>
            </section>
          )}

          {tab === "reports" && (
            <section className="adm-card" aria-label="Reports" data-cy="adm-tab-reports">
              <div className="adm-cardTop">
                <div>
                  <div className="adm-cardTitle" data-cy="adm-reports-title">
                    Reporting
                  </div>
                  <div className="adm-cardSub">Evidence-ready stats: department usage + top users.</div>
                </div>
                <div className="adm-actions">
                  <button
                    className="adm-btnSecondary"
                    disabled={busy}
                    onClick={loadCompanySummary}
                    type="button"
                    data-cy="adm-reports-load-company"
                  >
                    Load company summary
                  </button>
                  <button
                    className="adm-btnPrimary"
                    disabled={busy}
                    onClick={loadDepartmentUsage}
                    type="button"
                    data-cy="adm-reports-load-dept"
                  >
                    Load department usage
                  </button>
                </div>
              </div>

              <div className="adm-grid2" data-cy="adm-reports-grid">
                <div className="adm-card soft" data-cy="adm-company-summary">
                  <div className="adm-cardTitle">Company summary</div>
                  <div className="adm-cardSub">Approved leave aggregated by department and user.</div>

                  {!companySummary ? (
                    <div className="muted" data-cy="adm-company-summary-empty">
                      Not loaded.
                    </div>
                  ) : (
                    <>
                      <div className="adm-stats" data-cy="adm-company-summary-stats">
                        <Stat label="Approved requests" value={companySummary.totalApprovedRequests} />
                        <Stat label="Departments tracked" value={Object.keys(companySummary.departmentUsage || {}).length} />
                        <Stat label="Users tracked" value={Object.keys(companySummary.userUsage || {}).length} />
                      </div>

                      <div className="adm-grid2">
                        <div className="adm-miniCard" data-cy="adm-company-summary-dept-usage">
                          <div className="adm-miniTitle">Department usage (days)</div>
                          <SimpleKeyValueTable
                            data={companySummary.departmentUsage}
                            leftHeader="Department"
                            rightHeader="Days"
                            dataCy="adm-company-summary-dept-table"
                          />
                        </div>

                        <div className="adm-miniCard" data-cy="adm-company-summary-user-usage">
                          <div className="adm-miniTitle">Top users (days)</div>
                          <UserUsageTable userUsage={companySummary.userUsage} dataCy="adm-company-summary-user-table" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="adm-card soft" data-cy="adm-dept-usage">
                  <div className="adm-cardTitle">Department usage</div>
                  <div className="adm-cardSub">Approved leave days per department.</div>

                  {!deptUsage ? (
                    <div className="muted" data-cy="adm-dept-usage-empty">
                      Not loaded.
                    </div>
                  ) : (
                    <div className="adm-miniCard" data-cy="adm-dept-usage-card">
                      <SimpleKeyValueTable
                        data={deptUsage}
                        leftHeader="Department"
                        rightHeader="Days"
                        dataCy="adm-dept-usage-table"
                      />
                    </div>
                  )}
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
    <label className="adm-field">
      <div className="adm-fieldLabel">{label}</div>
      <input
        className="adm-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        inputMode={inputMode}
        data-cy={dataCy}
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="adm-stat">
      <div className="adm-statLabel">{label}</div>
      <div className="adm-statValue">{value}</div>
    </div>
  );
}

function SimpleKeyValueTable({
  data,
  leftHeader,
  rightHeader,
  dataCy,
}: {
  data: Record<string, number>;
  leftHeader: string;
  rightHeader: string;
  dataCy?: string;
}) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="adm-tableWrap" data-cy={dataCy ? `${dataCy}-wrap` : undefined}>
      <table className="adm-table adm-tableTight" data-cy={dataCy}>
        <caption className="sr-only">
          {leftHeader} and {rightHeader} table
        </caption>
        <thead>
          <tr>
            <th scope="col">{leftHeader}</th>
            <th scope="col">{rightHeader}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
          {!entries.length && (
            <tr>
              <td colSpan={2} className="muted">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UserUsageTable({
  userUsage,
  dataCy,
}: {
  userUsage: Record<number, { name: string; days: number }>;
  dataCy?: string;
}) {
  const rows = Object.entries(userUsage || {})
    .map(([userId, v]) => ({ userId: Number(userId), name: v.name, days: v.days }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 12);

  return (
    <div className="adm-tableWrap" data-cy={dataCy ? `${dataCy}-wrap` : undefined}>
      <table className="adm-table adm-tableTight" data-cy={dataCy}>
        <caption className="sr-only">Top users by approved leave days</caption>
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Days</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} data-cy="adm-report-user-row" data-user-id={r.userId}>
              <td>
                {r.userId} — {r.name}
              </td>
              <td>{r.days}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={2} className="muted">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function roleNameToId(role: string): number {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return 3;
  if (r === "manager") return 2;
  return 1;
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
  --okbg: #ecfeff;
  --errbg: #fef2f2;
  --radius: 16px;
}

/* Colour-safe mode: shifts accents to safer hues + stronger borders */
html[data-color-safe="1"]{
  --primary: #0b5cff;
  --primary2: #0847c6;
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

/* Layout */
.adm-wrap{
  display: grid;
  grid-template-columns: clamp(220px, 24vw, 300px) 1fr;
  gap: 16px;
  align-items: start;
  width: 100%;
}

.adm-sideDesktop{ display: block; }
.adm-mobileBar{ display: none; }

@media (max-width: 980px){
  .adm-wrap{ grid-template-columns: 1fr; }
  .adm-sideDesktop{ display: none; }
  .adm-head{ display: none; }
  .adm-mobileBar{ display: flex; }
}

/* Mobile top bar */
.adm-mobileBar{
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

.adm-iconBtn{
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 900;
  cursor: pointer;
}
.adm-iconBtn:disabled{ opacity: 0.6; cursor: not-allowed; }

/* Strong visible focus (keyboard + WCAG) */
.adm-iconBtn:focus-visible,
.adm-btnPrimary:focus-visible,
.adm-btnSecondary:focus-visible,
.adm-btnDanger:focus-visible,
.adm-btnMini:focus-visible,
.adm-navBtn:focus-visible,
.adm-input:focus-visible{
  outline: 3px solid rgba(37,99,235,0.75);
  outline-offset: 2px;
}

html[data-color-safe="1"] .adm-iconBtn:focus-visible,
html[data-color-safe="1"] .adm-btnPrimary:focus-visible,
html[data-color-safe="1"] .adm-btnSecondary:focus-visible,
html[data-color-safe="1"] .adm-btnDanger:focus-visible,
html[data-color-safe="1"] .adm-btnMini:focus-visible,
html[data-color-safe="1"] .adm-navBtn:focus-visible,
html[data-color-safe="1"] .adm-input:focus-visible{
  outline-color: rgba(0,0,0,0.85);
}

.adm-mobileTitle{ min-width: 0; flex: 1; }
.adm-mobileTitleTop{ font-weight: 950; color: var(--text); }
.adm-mobileTitleSub{ font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Drawer */
.adm-drawerOverlay{
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
}

.adm-drawer{
  width: min(340px, 88vw);
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  padding: 12px;
  z-index: 61;
}

.adm-drawerBackdrop{
  flex: 1;
  border: none;
  background: rgba(2,6,23,0.45);
  cursor: pointer;
}

.adm-drawerTop{
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
.adm-drawerTopTitle{ font-weight: 950; color: var(--text); }

/* Sidebar */
.adm-side{
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
  .adm-side{
    position: relative;
    top: 0;
    max-height: none;
    overflow: visible;
  }
}

.adm-brand{
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 10px 14px;
  border-bottom: 1px solid rgba(226,232,240,0.15);
  margin-bottom: 12px;
}

.adm-dot{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #93c5fd, #2563eb 60%, #1e3a8a);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.15);
}

.adm-brandTitle{ font-weight: 900; letter-spacing: 0.2px; }
.adm-brandSub{ font-size: 12px; color: rgba(226,232,240,0.75); margin-top: 2px; }

.adm-nav{ display: grid; gap: 8px; margin-top: 12px; }

.adm-navBtn{
  text-align: left;
  border: 1px solid rgba(226,232,240,0.18);
  background: rgba(255,255,255,0.06);
  color: #e5e7eb;
  border-radius: 14px;
  padding: 10px;
  cursor: pointer;
  transition: transform 120ms ease, background 120ms ease, border 120ms ease;
}
.adm-navBtn:hover{
  transform: translateY(-1px);
  background: rgba(255,255,255,0.10);
  border-color: rgba(147,197,253,0.45);
}
.adm-navBtn.active{
  background: rgba(37,99,235,0.25);
  border-color: rgba(147,197,253,0.65);
}

.adm-navBtnTop{ display:flex; align-items:center; justify-content:space-between; gap: 10px; }
.adm-navLabel{ font-weight: 800; }
.adm-navDesc{ font-size: 12px; color: rgba(226,232,240,0.75); margin-top: 4px; }

.adm-chip{
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(147,197,253,0.16);
  border: 1px solid rgba(147,197,253,0.35);
  color: #bfdbfe;
  font-weight: 800;
}

.adm-foot{
  margin-top: 14px;
  border-top: 1px solid rgba(226,232,240,0.15);
  padding-top: 12px;
}
.adm-footTitle{ font-weight: 800; font-size: 12px; color: rgba(226,232,240,0.85); margin-bottom: 6px; }
.adm-footText{ font-size: 12px; color: rgba(226,232,240,0.70); line-height: 1.5; }
.adm-kbd{ padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(226,232,240,0.18); background: rgba(255,255,255,0.06); font-weight: 800; }

/* Main */
.adm-main{ display: grid; gap: 12px; min-width: 0; }

.adm-head{
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
.adm-hTitle{ font-weight: 900; color: var(--text); font-size: 16px; }
.adm-hSub{ font-size: 12px; color: var(--muted); margin-top: 3px; }
.adm-actions{ display:flex; gap: 10px; flex-wrap: wrap; align-items: center; }

.adm-alert{
  border-radius: var(--radius);
  padding: 12px 14px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.adm-alert.ok{ background: var(--okbg); border-color: rgba(3,105,161,0.25); }
.adm-alert.err{ background: var(--errbg); border-color: rgba(185,28,28,0.22); }
.adm-alertTitle{ font-weight: 900; margin-bottom: 4px; color: var(--text); }
.adm-alertBody{ color: var(--text); font-size: 14px; }

.adm-card{
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
  min-width: 0;
}
.adm-card.soft{ background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); }
.adm-cardNarrow{ max-width: 620px; }
.adm-cardWide{ max-width: 980px; }

.adm-cardTop{
  display:flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.adm-cardTitle{ font-weight: 900; color: var(--text); }
.adm-cardSub{ font-size: 12px; color: var(--muted); margin-top: 4px; }

.adm-grid2{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
@media (max-width: 980px){
  .adm-grid2{ grid-template-columns: 1fr; }
}

.adm-formGrid{ display:grid; gap: 10px; margin-top: 12px; }
.adm-formGridWide{ grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); align-items: end; }

.adm-field{ display:grid; gap: 6px; }
.adm-fieldLabel{ font-size: 12px; color: var(--muted); font-weight: 800; }

.adm-input{
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  outline: none;
  background: #ffffff;
  color: var(--text);
  min-width: 0;
}
.adm-input.compact{ padding: 8px 10px; }
.adm-search{ width: min(420px, 80vw); }

.adm-btnPrimary,
.adm-btnSecondary,
.adm-btnDanger{
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-weight: 900;
  cursor: pointer;
  transition: transform 120ms ease, opacity 120ms ease;
}
.adm-btnPrimary{ background: linear-gradient(180deg, var(--primary) 0%, var(--primary2) 100%); color: white; }
.adm-btnSecondary{ background: #ffffff; border: 1px solid var(--border); color: var(--text); }
.adm-btnDanger{ background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%); color: white; }

.adm-btnPrimary:disabled,
.adm-btnSecondary:disabled,
.adm-btnDanger:disabled{ opacity: 0.6; cursor: not-allowed; }

.adm-btnPrimary:hover,
.adm-btnSecondary:hover,
.adm-btnDanger:hover{ transform: translateY(-1px); }

.adm-btnMini{
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #ffffff;
  font-weight: 900;
  cursor: pointer;
}
.adm-btnMini:disabled{ opacity: 0.6; cursor: not-allowed; }

.adm-inline{ display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
@media (max-width: 520px){
  .adm-inlineStack{ flex-direction: column; align-items: stretch; }
  .adm-inlineStack .adm-btnMini{ width: 100%; }
  .adm-inlineStack .adm-input{ width: 100%; }
}

/* Tables */
.adm-tableWrap{
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--border);
  min-width: 0;
  -webkit-overflow-scrolling: touch;
}
.adm-table{
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  min-width: 760px;
}
.adm-tableTight{ min-width: 640px; }

.adm-table th{
  text-align:left;
  font-size: 12px;
  color: var(--muted);
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  font-weight: 900;
  white-space: nowrap;
}
.adm-table td{
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: var(--text);
  font-size: 14px;
  vertical-align: top;
}
.adm-table tr:hover td{ background: #f8fbff; }

.muted{ color: var(--muted); }

.adm-nameCell{ display: grid; gap: 6px; }
.adm-nameTop{ display:flex; align-items:center; justify-content: space-between; gap: 10px; }
.adm-name{ font-weight: 900; color: var(--text); }
.adm-nameMeta{ display:none; font-size: 12px; gap: 8px; }

@media (max-width: 760px){
  .adm-table th:nth-child(3),
  .adm-table td:nth-child(3),
  .adm-table th:nth-child(5),
  .adm-table td:nth-child(5){ display: none; }

  .adm-nameMeta{ display:flex; flex-wrap: wrap; }
}

/* Pills: text + symbol marker (works even in grayscale) */
.adm-pill{
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
.adm-pill::before{
  display:inline-block;
  width: 1.1em;
  text-align:center;
  font-weight: 950;
  content: "•";
}
.adm-pill.employee::before{ content: "●"; }
.adm-pill.manager::before{ content: "◆"; }
.adm-pill.admin::before{ content: "★"; }
.adm-pill.pending::before{ content: "⏳"; }

.adm-pill.employee{ border-color: rgba(37,99,235,0.30); background: rgba(37,99,235,0.08); color: #1d4ed8; }
.adm-pill.manager{ border-color: rgba(14,116,144,0.30); background: rgba(14,116,144,0.08); color: #0e7490; }
.adm-pill.admin{ border-color: rgba(109,40,217,0.30); background: rgba(109,40,217,0.08); color: #6d28d9; }
.adm-pill.pending{ border-color: rgba(234,179,8,0.35); background: rgba(234,179,8,0.10); color: #a16207; }

/* Colour-safe mode strengthens differentiation without relying on hue */
html[data-color-safe="1"] .adm-pill.employee,
html[data-color-safe="1"] .adm-pill.manager,
html[data-color-safe="1"] .adm-pill.admin,
html[data-color-safe="1"] .adm-pill.pending{
  background: #ffffff;
  color: #0f172a;
  border-color: rgba(15,23,42,0.35);
}

/* Filters + stats */
.adm-filters{
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.adm-stats{ display:flex; gap: 10px; flex-wrap: wrap; margin: 12px 0; }
.adm-stat{
  min-width: 180px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  background: #ffffff;
}
.adm-statLabel{ font-size: 12px; color: var(--muted); font-weight: 900; }
.adm-statValue{ font-size: 18px; font-weight: 950; color: var(--text); margin-top: 2px; }

.adm-miniCard{
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: #ffffff;
  min-width: 0;
}
.adm-miniTitle{ font-weight: 950; margin-bottom: 8px; color: var(--text); font-size: 13px; }
`;
