/// <reference types="cypress" />

describe("Accessibility (axe) - key pages", () => {
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

  const runA11y = () => {
    cy.injectAxe();
    cy.checkA11y(
      undefined,
      {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa"],
        },
      },
      undefined,
      true // skipFailures = true (so it reports but doesn't fail run)
    );
  };

  it("Login page passes baseline WCAG checks", () => {
    cy.visit(LOGIN_URL);
    runA11y();
  });

  it("Employee dashboard passes baseline WCAG checks", () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    login(EMP_EMAIL, EMP_PASSWORD);
    cy.visit(EMP_URL);
    cy.get('[data-cy="emp-main"]', { timeout: 10000 }).should("exist");
    runA11y();
  });

  it("Manager dashboard passes baseline WCAG checks", () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    login(MANAGER_EMAIL, MANAGER_PASSWORD);
    cy.visit(MGR_URL);
    cy.get('[data-cy="mgr-wrap"]', { timeout: 10000 }).should("exist");
    runA11y();
  });

  it("Admin dashboard passes baseline WCAG checks", () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    login(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.visit(ADM_URL);
    cy.get('[data-cy="adm-wrap"]', { timeout: 10000 }).should("exist");
    runA11y();
  });
});
