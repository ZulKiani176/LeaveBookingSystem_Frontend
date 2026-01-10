/// <reference types="cypress" />

describe("Authentication flow", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("logs in successfully and redirects to dashboard", () => {
    cy.get('[data-cy="email"]').type("admin@company.com");
    cy.get('[data-cy="password"]').type("password123");
    cy.get('[data-cy="login-submit"]').click();

    cy.url().should("include", "/dashboard");
    cy.window().then((win) => {
      const token = win.localStorage.getItem("token");
      expect(token).to.exist;
    });
  });

  it("shows error on invalid credentials", () => {
    cy.get('[data-cy="email"]').type("wrong@test.com");
    cy.get('[data-cy="password"]').type("wrongpassword");
    cy.get('[data-cy="login-submit"]').click();

    cy.contains("There’s a problem").should("be.visible");
cy.contains("Invalid credentials").should("be.visible");

  });
});
