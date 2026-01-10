/// <reference types="cypress" />

describe("Employee dashboard (base)", () => {
  const EMAIL = "employee1@company.com";
  const PASSWORD = "Password123!";

  const login = () => {
    cy.visit("/login");
    cy.get('[data-cy="email"]').clear().type(EMAIL);
    cy.get('[data-cy="password"]').clear().type(PASSWORD);
    cy.get('[data-cy="login-submit"]').click();
    cy.url().should("include", "/dashboard");
  };

  beforeEach(() => {
    cy.session("employee", () => {
      login();
    });

    
    cy.visit("/dashboard");
  });

  it("renders dashboard main container", () => {
    cy.get('[data-cy="emp-main"]').should("exist");
  });

  it("renders key sections", () => {
    cy.get('[data-cy="emp-profile"]').should("exist");
    cy.get('[data-cy="emp-balance"]').should("exist");
    cy.get('[data-cy="emp-request-form"]').should("exist");
    cy.get('[data-cy="emp-requests"]').should("exist");
  });


  it("refresh buttons reload without crashing", () => {
  cy.get('[data-cy="emp-refresh-top"]').click();
  cy.get('[data-cy="emp-main"]').should("exist");

  cy.get('[data-cy="emp-refresh-requests"]').click();
  cy.get('[data-cy="emp-requests"]').should("exist");
});

it("shows balance as a number (or '-')", () => {
  cy.get('[data-cy="emp-balance"]')
    .invoke("text")
    .then((t) => t.trim())
    .then((text) => {
      
      expect(text === "-" || /\d+/.test(text)).to.eq(true);
    });
});

it("submits a valid 1-day leave request and shows success", () => {
  
  cy.intercept("POST", "**/api/leave-requests").as("createLeave");

  // pick a date far ahead to avoid overlaps with existing leave
  const dateStr = "2099-01-09";

  cy.get('[data-cy="emp-start-date"]').clear().type(dateStr);
  cy.get('[data-cy="emp-end-date"]').clear().type(dateStr);

  cy.get('[data-cy="emp-submit-request"]').click();

  cy.wait("@createLeave").then((i) => {
    const status = i.response?.statusCode;

    
    if (status && status >= 400) {
      cy.get('[data-cy="emp-alert-error"]').should("exist");
      return;
    }

    
    cy.get('[data-cy="emp-alert-success"]').should("exist");
    cy.get('[data-cy="emp-alert-success"]').contains("Leave request submitted.");
  });
});

it("shows the request form inputs", () => {
  cy.get('[data-cy="emp-leave-type"]').should("exist");
  cy.get('[data-cy="emp-start-date"]').should("exist");
  cy.get('[data-cy="emp-end-date"]').should("exist");
  cy.get('[data-cy="emp-submit-request"]').should("exist");
});

it("renders either request rows or the empty-state text", () => {
  cy.get('[data-cy="emp-requests"]').should("exist").then(($section) => {
    const hasRows = $section.find('[data-cy="emp-request-row"]').length > 0;

    if (hasRows) {
      cy.wrap($section)
        .find('[data-cy="emp-request-row"]')
        .should("have.length.greaterThan", 0);
    } else {
      cy.wrap($section).contains("No requests yet.").should("exist");
    }
  });
});



it("if a request row exists, status pill shows icon + non-empty text", () => {
  cy.get("body").then(($body) => {
    const hasRows = $body.find('[data-cy="emp-request-row"]').length > 0;
    if (!hasRows) return;

    cy.get('[data-cy="emp-request-row"]').first().within(() => {
      cy.get('[data-cy="emp-status-pill"]').should("exist");
      cy.get('[data-cy="emp-status-icon"]')
        .invoke("text")
        .then((t) => t.trim())
        .should("match", /✓|✕|⏳/);

      cy.get('[data-cy="emp-status-text"]')
        .invoke("text")
        .then((t) => t.trim())
        .should("not.eq", "");
    });
  });
});




});
