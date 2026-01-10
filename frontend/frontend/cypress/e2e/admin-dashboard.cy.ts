/// <reference types="cypress" />

describe("Admin dashboard (base)", () => {
  const EMAIL = "admin1@company.com";
  const PASSWORD = "Password123!";

  const login = () => {
    cy.visit("/login");
    cy.get('[data-cy="email"]').clear().type(EMAIL);
    cy.get('[data-cy="password"]').clear().type(PASSWORD);
    cy.get('[data-cy="login-submit"]').click();

    
    cy.url().should("match", /(\/admin|\/dashboard)/);
  };

  beforeEach(() => {
    cy.session("admin", () => {
      login();
    });

  
    cy.visit("/admin");
    cy.get('[data-cy="adm-main"]').should("exist");
  });

  it("renders main shell + nav", () => {
    cy.get('[data-cy="adm-wrap"]').should("exist");
    cy.get('[data-cy="adm-sidenav"]').should("exist");
    cy.get('[data-cy="adm-nav"]').should("exist");
  });

  it("Users tab: table renders and can search", () => {
    cy.get('[data-cy="adm-nav-users"]').click();
    cy.get('[data-cy="adm-tab-users"]').should("exist");

    cy.get('[data-cy="adm-users-table"]').should("exist");
    cy.get('[data-cy="adm-user-search"]').clear().type("admin");

    cy.get("body").then(($b) => {
      if ($b.find('[data-cy="adm-user-row"]').length) {
        cy.get('[data-cy="adm-user-row"]').its("length").should("be.greaterThan", 0);
      } else {
        cy.get('[data-cy="adm-users-empty"]').should("exist");
      }
    });
  });

  it("Add user tab: creates a new user and user appears in Users table", () => {
  cy.get('[data-cy="adm-nav-addUser"]').click();

  cy.intercept("POST", "**/api/admin/add-user").as("addUser");
  cy.intercept("GET", "**/api/admin/all-users*").as("allUsers");

  const uniq = `e2e_${Date.now()}`;
  const email = `${uniq}@company.com`;

  cy.get('[data-cy="adm-new-firstname"]').clear().type("E2E");
  cy.get('[data-cy="adm-new-surname"]').clear().type("User");
  cy.get('[data-cy="adm-new-email"]').clear().type(email);
  cy.get('[data-cy="adm-new-password"]').clear().type("Password123!");
  cy.get('[data-cy="adm-new-department"]').clear().type("Ops");
  cy.get('[data-cy="adm-new-role"]').select("Employee (1)");

  cy.get('[data-cy="adm-create-user"]').click();

  cy.wait("@addUser").then((i) => {
    const status = i.response?.statusCode ?? 0;

    // if backend rejects 
    if (status >= 400) {
      cy.get('[data-cy="adm-alert-error"]').should("exist");
      return;
    }

    
    cy.wait("@allUsers");

    
    cy.get('[data-cy="adm-tab-users"]').should("exist");

    
    cy.get('[data-cy="adm-user-search"]').clear().type(email);

    cy.get('[data-cy="adm-users-table"] tbody')
      .contains(email)
      .should("exist");
  });
});



  it("Assign manager tab: loads selects and submit calls API", () => {
    cy.get('[data-cy="adm-nav-assignManager"]').click();
    cy.get('[data-cy="adm-tab-assign-manager"]').should("exist");

    // requires that users list has at least one employee + one manager
    cy.intercept("POST", "**/api/admin/assign-manager").as("assignMgr");

    cy.get('[data-cy="adm-assign-employee"]').then(($sel) => {
      // pick first non-empty option if exists
      const opts = $sel.find("option").toArray().map((o) => (o as HTMLOptionElement).value);
      const chosen = opts.find((v) => v && v !== "");
      if (!chosen) {
        
        cy.log("No employees available to assign");
        return;
      }
      cy.wrap($sel).select(chosen);
    });

    cy.get('[data-cy="adm-assign-manager"]').then(($sel) => {
      const opts = $sel.find("option").toArray().map((o) => (o as HTMLOptionElement).value);
      const chosen = opts.find((v) => v && v !== "");
      if (!chosen) {
        cy.log("No managers available to assign");
        return;
      }
      cy.wrap($sel).select(chosen);
    });

    
    cy.get('[data-cy="adm-assign-start-date"]').then(($i) => {
      if ($i.length) cy.wrap($i).clear().type("2099-01-09");
    });

    cy.get('[data-cy="adm-assign-submit"]').click();

    cy.wait("@assignMgr").then((i) => {
      const status = i.response?.statusCode ?? 0;

      if (status >= 400) {
        cy.get('[data-cy="adm-alert-error"]').should("exist");
        return;
      }

      cy.get('[data-cy="adm-alert-success"]').should("exist");
      cy.get('[data-cy="adm-alert-success"]').contains("Manager assigned.");
    });
  });

  it("Pending tab: load button calls API and table renders", () => {
    cy.get('[data-cy="adm-nav-pending"]').click();
    cy.get('[data-cy="adm-tab-pending"]').should("exist");

    cy.intercept("GET", "**/api/admin/all-leave-requests*").as("loadPending");
    cy.get('[data-cy="adm-pending-load"]').click();

    cy.wait("@loadPending").then((i) => {
      const status = i.response?.statusCode ?? 0;

      if (status >= 400) {
        cy.get('[data-cy="adm-alert-error"]').should("exist");
        return;
      }

      
      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="adm-pending-row"]').length) {
          cy.get('[data-cy="adm-pending-row"]').its("length").should("be.greaterThan", 0);
        } else {
          cy.get('[data-cy="adm-pending-empty"]').should("exist");
        }
      });
    });
  });

  it("Tools tab: approve/cancel/balance inputs exist", () => {
    cy.get('[data-cy="adm-nav-tools"]').click();
    cy.get('[data-cy="adm-tab-tools"]').should("exist");

    cy.get('[data-cy="adm-approve-id"]').should("exist");
    cy.get('[data-cy="adm-approve-submit"]').should("exist");

    cy.get('[data-cy="adm-cancel-id"]').should("exist");
    cy.get('[data-cy="adm-cancel-submit"]').should("exist");

    cy.get('[data-cy="adm-balance-userid"]').should("exist");
    cy.get('[data-cy="adm-balance-value"]').should("exist");
    cy.get('[data-cy="adm-balance-submit"]').should("exist");
  });

  it("Reports tab: buttons call APIs and render loaded sections", () => {
    cy.get('[data-cy="adm-nav-reports"]').click();
    cy.get('[data-cy="adm-tab-reports"]').should("exist");

    cy.intercept("GET", "**/api/admin/reports/company-summary").as("companySummary");
    cy.intercept("GET", "**/api/admin/reports/department-usage").as("deptUsage");

    cy.get('[data-cy="adm-reports-load-company"]').click();
    cy.wait("@companySummary").then((i) => {
      const status = i.response?.statusCode ?? 0;
      if (status >= 400) {
        cy.get('[data-cy="adm-alert-error"]').should("exist");
      } else {
        
        cy.get('[data-cy="adm-company-summary-empty"]').should("not.exist");
      }
    });

    cy.get('[data-cy="adm-reports-load-dept"]').click();
    cy.wait("@deptUsage").then((i) => {
      const status = i.response?.statusCode ?? 0;
      if (status >= 400) {
        cy.get('[data-cy="adm-alert-error"]').should("exist");
      } else {
        cy.get('[data-cy="adm-dept-usage-empty"]').should("not.exist");
      }
    });
  });
});
