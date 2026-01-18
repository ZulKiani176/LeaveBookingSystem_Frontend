/// <reference types="cypress" />

describe("Auth + role protection (smoke)", () => {
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

  const login = (email: string, password: string) => {
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

  const assertRedirectToLogin = (url: string) => {
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.visit(url);
    cy.location("pathname", { timeout: 10000 }).should("include", LOGIN_URL);
  };

  it("blocks unauthenticated access to all dashboards", () => {
    assertRedirectToLogin(EMP_URL);
    assertRedirectToLogin(MGR_URL);
    assertRedirectToLogin(ADM_URL);
  });

  it("keeps manager logged in after refresh", () => {
    cy.clearCookies();
    cy.clearLocalStorage();

    login(MANAGER_EMAIL, MANAGER_PASSWORD);
    cy.visit(MGR_URL);

    cy.get('[data-cy="mgr-wrap"]', { timeout: 10000 }).should("exist");
    cy.reload();
    cy.get('[data-cy="mgr-wrap"]', { timeout: 10000 }).should("exist");
  });

  it("prevents manager from accessing admin dashboard", () => {
    cy.clearCookies();
    cy.clearLocalStorage();

    login(MANAGER_EMAIL, MANAGER_PASSWORD);
    cy.visit(ADM_URL);

    cy.location("pathname", { timeout: 10000 }).should("not.include", ADM_URL);
    cy.get("body").should("not.contain", "Admin");
  });

  it("prevents employee from accessing manager and admin dashboards", () => {
    cy.clearCookies();
    cy.clearLocalStorage();

    login(EMP_EMAIL, EMP_PASSWORD);

    cy.visit(MGR_URL);
    cy.location("pathname", { timeout: 10000 }).should("not.include", MGR_URL);

    cy.visit(ADM_URL);
    cy.location("pathname", { timeout: 10000 }).should("not.include", ADM_URL);
  });

  it("shows error alert when manager pending API fails", () => {
    cy.clearCookies();
    cy.clearLocalStorage();

    login(MANAGER_EMAIL, MANAGER_PASSWORD);
    cy.visit(MGR_URL);

    cy.intercept("GET", "**/api/leave-requests/pending*", {
  statusCode: 500,
  body: { error: "Forced error" }, // matches api.ts: data.error || data.message
}).as("pendingFail");

cy.get('[data-cy="mgr-nav-pending"]').click();
cy.get('[data-cy="mgr-pending-refresh"]').click();

cy.wait("@pendingFail");
cy.get('[data-cy="mgr-alert-error"]', { timeout: 10000 }).should("exist");

  });

  it("clearing storage blocks admin access (logout equivalent)", () => {
    cy.clearCookies();
    cy.clearLocalStorage();

    login(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.visit(ADM_URL);
    cy.get('[data-cy="adm-wrap"]', { timeout: 10000 }).should("exist");

    cy.clearCookies();
    cy.clearLocalStorage();

    cy.visit(ADM_URL);
    cy.location("pathname", { timeout: 10000 }).should("include", LOGIN_URL);
  });
});
