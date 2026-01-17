/// <reference types="cypress" />

describe("Responsive UI (viewport checks)", () => {
  const LOGIN_URL = "/login";
  const EMP_URL = "/dashboard";
  const MGR_URL = "/manager";
  const ADM_URL = "/admin";

  // same creds style you used everywhere
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

  it("Login page renders on mobile and inputs usable", () => {
    cy.viewport("iphone-x");
    cy.visit(LOGIN_URL);

    cy.get('[data-cy="login-email"], input[name="email"], input[type="email"]').first().should("be.visible");
    cy.get('[data-cy="login-password"], input[name="password"], input[type="password"]').first().should("be.visible");
    cy.get('[data-cy="login-submit"], button[type="submit"]').first().should("be.visible");
  });

  it("Manager dashboard switches to mobile nav (hamburger) on small screens", () => {
    cy.viewport("iphone-x");
    cy.clearCookies();
    cy.clearLocalStorage();
    login(MANAGER_EMAIL, MANAGER_PASSWORD);

    cy.visit(MGR_URL);

    // You *already* have these in the ManagerDashboard code:
    // .mgr-mobileBar exists only under @media (max-width: 980px)
    cy.get(".mgr-mobileBar", { timeout: 10000 }).should("be.visible");

    // Desktop head/sidebar should be hidden on mobile
    cy.get(".mgr-sideDesktop").should("not.be.visible");
    
  });

  it("Manager dashboard shows desktop layout on wide screens", () => {
    cy.viewport(1280, 800);
    cy.clearCookies();
    cy.clearLocalStorage();
    login(MANAGER_EMAIL, MANAGER_PASSWORD);

    cy.visit(MGR_URL);

    cy.get(".mgr-head", { timeout: 10000 }).should("be.visible");
    cy.get(".mgr-sideDesktop").should("be.visible");
    cy.get(".mgr-mobileBar").should("not.be.visible");
  });

  it("Employee dashboard renders on mobile without crashing", () => {
    cy.viewport("iphone-x");
    cy.clearCookies();
    cy.clearLocalStorage();
    login(EMP_EMAIL, EMP_PASSWORD);

    cy.visit(EMP_URL);
    cy.get('[data-cy="emp-main"]', { timeout: 10000 }).should("exist");
  });

  it("Admin dashboard renders on tablet viewport without crashing", () => {
    cy.viewport("ipad-2");
    cy.clearCookies();
    cy.clearLocalStorage();
    login(ADMIN_EMAIL, ADMIN_PASSWORD);

    cy.visit(ADM_URL);
    cy.get('[data-cy="adm-wrap"]', { timeout: 10000 }).should("exist");
  });
});
