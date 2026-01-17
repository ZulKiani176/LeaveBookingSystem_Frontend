/// <reference types="cypress" />

describe("Security checks (E2E + API)", () => {
  const API = "http://localhost:3000";
  const LOGIN_URL = "/login";
  const EMP_URL = "/dashboard";
  const MGR_URL = "/manager";
  const ADM_URL = "/admin";

  const EMP_EMAIL = "employee1@company.com";
  const EMP_PASSWORD = "Password123!";

  const MANAGER_EMAIL = "manager@northbridge.com";
  const MANAGER_PASSWORD = "Password123!";

  const ADMIN_EMAIL = "admin1@company.com";
  const ADMIN_PASSWORD = "Password123!";

  const uiLogin = (email: string, password: string) => {
    cy.visit(LOGIN_URL);

    cy.get('[data-cy="login-email"], input[name="email"], input[type="email"]')
      .first()
      .should("be.visible")
      .clear()
      .type(email, { delay: 0 });

    cy.get('[data-cy="login-password"], input[name="password"], input[type="password"]')
      .first()
      .should("be.visible")
      .clear()
      .type(password, { delay: 0 });

    cy.get('[data-cy="login-submit"], button[type="submit"]').first().click();
    cy.location("pathname", { timeout: 10000 }).should("not.include", LOGIN_URL);
  };

  const apiLogin = (email: string, password: string) => {
    return cy
      .request({
        method: "POST",
        url: `${API}/api/auth/login`,
        body: { email, password },
        failOnStatusCode: false,
      })
      .then((res) => {
        expect(res.status).to.eq(200);
        // adjust key names if needed
        const token =
          res.body?.token ||
          res.body?.accessToken ||
          res.body?.data?.token ||
          res.body?.jwt;

        expect(token, "JWT token should exist in login response").to.be.a("string");
        return token as string;
      });
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("API: blocks unauthenticated access to protected endpoints", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/leave-requests/pending`,
      failOnStatusCode: false,
    }).then((res) => {
      // depending on your backend middleware, could be 401 or 403
      expect([401, 403]).to.include(res.status);
    });

    cy.request({
      method: "GET",
      url: `${API}/api/admin/all-users`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  it("API: rejects bad/forged token", () => {
    cy.request({
      method: "GET",
      url: `${API}/api/admin/all-users`,
      headers: { Authorization: "Bearer not-a-real-token" },
      failOnStatusCode: false,
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
    });
  });

  it("UI: blocks access when token/session storage is cleared (session invalidation)", () => {
    uiLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.visit(ADM_URL);
    cy.get('[data-cy="adm-wrap"]', { timeout: 10000 }).should("exist");

    cy.clearCookies();
    cy.clearLocalStorage();

    cy.visit(ADM_URL);
    cy.location("pathname", { timeout: 10000 }).should("include", LOGIN_URL);
  });

  it("UI: token tampering forces redirect to login", () => {
    // If your auth uses localStorage, this catches “forged” session attempts.
    // If you store token elsewhere, this still shows session integrity testing.
    cy.visit(LOGIN_URL);
    cy.window().then((win) => {
      win.localStorage.setItem("token", "forged-token");
      win.localStorage.setItem("authToken", "forged-token");
    });

    cy.visit(ADM_URL);
    cy.location("pathname", { timeout: 10000 }).should("include", LOGIN_URL);
  });

  it("API: role-based authorisation - manager cannot access admin endpoints", () => {
    apiLogin(MANAGER_EMAIL, MANAGER_PASSWORD).then((token) => {
      cy.request({
        method: "GET",
        url: `${API}/api/admin/all-users`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        expect([401, 403]).to.include(res.status);
      });
    });
  });

  it("API: employee cannot approve leave (authorisation enforced server-side)", () => {
    apiLogin(EMP_EMAIL, EMP_PASSWORD).then((token) => {
      cy.request({
        method: "PATCH",
        url: `${API}/api/leave-requests/approve`,
        headers: { Authorization: `Bearer ${token}` },
        body: { leaveRequestId: 1 }, // doesn't matter if it exists; auth should fail before logic
        failOnStatusCode: false,
      }).then((res) => {
        expect([401, 403]).to.include(res.status);
      });
    });
  });

  it("Optional: rate limiting returns 429 on repeated login attempts (only when enabled)", () => {
    // Only run when you explicitly enable it:
    // npx cypress run --env RATE_LIMIT_TEST=true
    if (!Cypress.env("RATE_LIMIT_TEST")) return;

    const attempts = Array.from({ length: 20 });

    let saw429 = false;

    cy.wrap(attempts).each(() => {
      cy.request({
        method: "POST",
        url: `${API}/api/auth/login`,
        body: { email: "wrong@company.com", password: "WrongPassword" },
        failOnStatusCode: false,
      }).then((res) => {
        if (res.status === 429) saw429 = true;
      });
    }).then(() => {
      expect(saw429, "should trigger rate limit (429) at some point").to.eq(true);
    });
  });
});
