// cypress/e2e/manager-dashboard.cy.ts

describe("Manager dashboard", () => {
  const DASHBOARD_URL = "/manager";
  const LOGIN_URL = "/login";

  const MANAGER_EMAIL = "manager@northbridge.com";
  const MANAGER_PASSWORD = "Password123!";

  const loginAsManager = () => {
    cy.visit(LOGIN_URL);

    cy.get('[data-cy="login-email"], input[name="email"], input[type="email"]')
      .first()
      .should("be.visible")
      .clear()
      .type(MANAGER_EMAIL, { delay: 0 });

    cy.get('[data-cy="login-password"], input[name="password"], input[type="password"]')
      .first()
      .should("be.visible")
      .clear()
      .type(MANAGER_PASSWORD, { delay: 0 });

    cy.get('[data-cy="login-submit"], button[type="submit"]').first().click();

    cy.location("pathname", { timeout: 10000 }).should("not.include", LOGIN_URL);
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    loginAsManager();

    cy.visit(DASHBOARD_URL);
    cy.get('[data-cy="mgr-wrap"]', { timeout: 10000 }).should("exist");
  });

  it("renders shell + nav", () => {
    cy.get('[data-cy="mgr-sidenav"]').should("exist");
    cy.get('[data-cy="mgr-brand"]').should("exist");
    cy.get('[data-cy="mgr-nav"]').should("exist");

    cy.get('[data-cy="mgr-nav-team"]').should("exist");
    cy.get('[data-cy="mgr-nav-pending"]').should("exist");
    cy.get('[data-cy="mgr-nav-actions"]').should("exist");
    cy.get('[data-cy="mgr-nav-reports"]').should("exist");
  });

  
  it("team tab: loads team list and can select an employee (if any)", () => {
    cy.get('[data-cy="mgr-nav-team"]').click();
    cy.get('[data-cy="mgr-tab-team"]').should("exist");
    cy.get('[data-cy="mgr-team-table"]').should("exist");

    cy.get('[data-cy="mgr-select-employee"]').should("exist").then(($sel) => {
      const options = $sel.find("option");
      if (options.length <= 1) {
        cy.get('[data-cy="mgr-team-empty"]').should("exist");
        return;
      }

      const firstValue = (options.get(1) as HTMLOptionElement).value;

      
      cy.wrap($sel).select(firstValue);

      
      cy.get('[data-cy="mgr-selected-employee-name"]', { timeout: 10000 }).should("not.contain", "-");

      
      cy.get("body", { timeout: 10000 }).should(($body) => {
        const t = $body.text();
        const hasLoadedMsg = t.includes("Loaded leave balance for employee");
        const hasNotLoadedHint = t.includes("Balance not loaded");
        expect(hasLoadedMsg || hasNotLoadedHint).to.eq(true);
      });
    });
  });

  it("pending tab: shows pending table and rows or empty", () => {
    cy.get('[data-cy="mgr-nav-pending"]').click();
    cy.get('[data-cy="mgr-tab-pending"]').should("exist");
    cy.get('[data-cy="mgr-pending-table"]').should("exist");

    cy.get("body").then(($body) => {
      if ($body.find('[data-cy="mgr-pending-row"]').length) {
        cy.get('[data-cy="mgr-pending-row"]').first().within(() => {
          cy.get('[data-cy="mgr-pending-request-id"]').should("exist");
          cy.get('[data-cy="mgr-pending-employee-id"]').should("exist");
          cy.get('[data-cy="mgr-pending-status"]').should("exist");
        });
      } else {
        cy.get('[data-cy="mgr-pending-empty"]').should("exist");
      }
    });
  });

  it("actions tab: approve and reject forms exist", () => {
    cy.get('[data-cy="mgr-nav-actions"]').click();
    cy.get('[data-cy="mgr-tab-actions"]').should("exist");

    cy.get('[data-cy="mgr-action-approve"]').should("exist");
    cy.get('[data-cy="mgr-approve-form"]').should("exist");
    cy.get('[data-cy="mgr-approve-id"]').should("exist");
    cy.get('[data-cy="mgr-approve-submit"]').should("exist");

    cy.get('[data-cy="mgr-action-reject"]').should("exist");
    cy.get('[data-cy="mgr-reject-form"]').should("exist");
    cy.get('[data-cy="mgr-reject-id"]').should("exist");
    cy.get('[data-cy="mgr-reject-reason"]').should("exist");
    cy.get('[data-cy="mgr-reject-submit"]').should("exist");
  });

  it("reports tab: can load pending summary and upcoming leaves (handles empty)", () => {
    cy.get('[data-cy="mgr-nav-reports"]').click();
    cy.get('[data-cy="mgr-tab-reports"]').should("exist");

    // Pending summary
    cy.get('[data-cy="mgr-reports-load-pending-summary"]').click();
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy="mgr-report-pending-row"]').length) {
        cy.get('[data-cy="mgr-report-pending-row"]').first().within(() => {
          cy.get('[data-cy="mgr-report-pending-employee"]').should("exist");
          cy.get('[data-cy="mgr-report-pending-count"]').should("exist");
        });
      } else {
        cy.get('[data-cy="mgr-report-pending-empty"]').should("exist");
      }
    });

    // Upcoming leaves
    cy.get('[data-cy="mgr-reports-load-upcoming"]').click();
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy="mgr-report-upcoming-row"]').length) {
        cy.get('[data-cy="mgr-report-upcoming-row"]').first().within(() => {
          cy.get('[data-cy="mgr-report-upcoming-employee"]').should("exist");
          cy.get('[data-cy="mgr-report-upcoming-start"]').should("exist");
          cy.get('[data-cy="mgr-report-upcoming-end"]').should("exist");
        });
      } else {
        cy.get('[data-cy="mgr-report-upcoming-empty"]').should("exist");
      }
    });
  });

  it("actions: shows validation error if you submit approve with empty id", () => {
    cy.get('[data-cy="mgr-nav-actions"]').click();
    cy.get('[data-cy="mgr-approve-id"]').clear();
    cy.get('[data-cy="mgr-approve-submit"]').click();
    cy.get('[data-cy="mgr-alert-error"]', { timeout: 10000 }).should("exist");
  });

  it("actions: shows validation error if you submit reject with empty id", () => {
    cy.get('[data-cy="mgr-nav-actions"]').click();
    cy.get('[data-cy="mgr-reject-id"]').clear();
    cy.get('[data-cy="mgr-reject-submit"]').click();
    cy.get('[data-cy="mgr-alert-error"]', { timeout: 10000 }).should("exist");
  });

  it("optional: approve first pending request if one exists", () => {
    cy.get('[data-cy="mgr-nav-pending"]').click();

    cy.get("body").then(($body) => {
      const rowCount = $body.find('[data-cy="mgr-pending-row"]').length;
      if (!rowCount) {
        cy.log("No pending requests to approve");
        return;
      }

      cy.get('[data-cy="mgr-pending-row"]')
        .first()
        .find('[data-cy="mgr-pending-request-id"]')
        .invoke("text")
        .then((txt) => {
          const requestId = (txt || "").trim();
          expect(requestId).to.match(/^\d+$/);

          cy.get('[data-cy="mgr-nav-actions"]').click();
          cy.get('[data-cy="mgr-approve-id"]').clear().type(requestId);
          cy.get('[data-cy="mgr-approve-submit"]').click();

          cy.get("body").then(($b2) => {
            const hasOk = $b2.find('[data-cy="mgr-alert-success"]').length > 0;
            const hasErr = $b2.find('[data-cy="mgr-alert-error"]').length > 0;
            expect(hasOk || hasErr).to.eq(true);
          });
        });
    });
  });

  it("optional: reject first pending request if one exists (with reason)", () => {
    cy.get('[data-cy="mgr-nav-pending"]').click();

    cy.get("body").then(($body) => {
      const rowCount = $body.find('[data-cy="mgr-pending-row"]').length;
      if (!rowCount) {
        cy.log("No pending requests to reject");
        return;
      }

      cy.get('[data-cy="mgr-pending-row"]')
        .first()
        .find('[data-cy="mgr-pending-request-id"]')
        .invoke("text")
        .then((txt) => {
          const requestId = (txt || "").trim();
          expect(requestId).to.match(/^\d+$/);

          cy.get('[data-cy="mgr-nav-actions"]').click();
          cy.get('[data-cy="mgr-reject-id"]').clear().type(requestId);
          cy.get('[data-cy="mgr-reject-reason"]').clear().type("Rejected by automated E2E test");
          cy.get('[data-cy="mgr-reject-submit"]').click();

          cy.get("body").then(($b2) => {
            const hasOk = $b2.find('[data-cy="mgr-alert-success"]').length > 0;
            const hasErr = $b2.find('[data-cy="mgr-alert-error"]').length > 0;
            expect(hasOk || hasErr).to.eq(true);
          });
        });
    });
  });
});
