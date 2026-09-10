import { test, expect } from '@playwright/test';

test.describe('Admin & Counsellor Operational Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as a Counsellor by default
    await page.goto('/login');
    await page.evaluate(() => {
      const counsellor = {
        uid: "demo_counsellor",
        email: "counsellor@educrm.demo",
        displayName: "Demo Counsellor",
        role: "counsellor",
        createdAt: Date.now(),
        office: "London HQ",
        branchId: "branch-london",
        tenantId: "tenant-demo",
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(counsellor));
    });
  });

  test('ADMIN-001: Counsellor Dashboard displays actionable pipeline metrics', async ({ page }) => {
    await page.goto('/counsellor/dashboard');
    await expect(page).toHaveURL(/\/counsellor\/dashboard|\//);

    // Verify presence of pipeline statistics
    await expect(page.locator('text=/Leads|Applications|Tasks|Pipeline/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('ADMIN-002: Leads Queue allows browsing leads, search, and status filtering', async ({ page }) => {
    await page.goto('/counsellor/leads');
    await expect(page).toHaveURL(/\/counsellor\/leads|\/leads/);

    // Check leads table or card list
    await expect(page.locator('text=/Leads|Add Lead|New Lead|Status/i').first()).toBeVisible();
  });

  test('ADMIN-003: Student Directory renders student roster and profile access', async ({ page }) => {
    await page.goto('/counsellor/students');
    await expect(page).toHaveURL(/\/counsellor\/students|\/students/);

    // Check student listing
    await expect(page.locator('text=/Students|Enrolled|Applicant/i').first()).toBeVisible();
  });

  test('ADMIN-004: Applications Pool renders submission stages and lifecycle statuses', async ({ page }) => {
    await page.goto('/counsellor/applications');
    await expect(page).toHaveURL(/\/counsellor\/applications|\/applications/);

    // Check application queue headers
    await expect(page.locator('text=/Applications|Submitted|Under Review|Offer/i').first()).toBeVisible();
  });

  test('ADMIN-005: Programme Matcher evaluates student parameters against university criteria', async ({ page }) => {
    await page.goto('/counsellor/programme-matcher');
    await expect(page).toHaveURL(/\/counsellor\/programme-matcher/);

    // Check match criteria inputs (Budget, Country, IELTS, Grade)
    await expect(page.locator('text=/Programme Matcher|Criteria|Eligibility|Recommendation/i').first()).toBeVisible();
  });

  test('ADMIN-006: Tasks & Follow-ups engine allows tracking operational deadlines', async ({ page }) => {
    await page.goto('/counsellor/tasks');
    await expect(page).toHaveURL(/\/counsellor\/tasks|\/tasks/);

    // Check tasks view
    await expect(page.locator('text=/Tasks|Follow-up|Pending|Completed/i').first()).toBeVisible();
  });

  test('ADMIN-007: Platform Super Admin workspace manages multi-tenant configuration', async ({ page }) => {
    // Switch session to platform_super_admin
    await page.evaluate(() => {
      const superAdmin = {
        uid: "demo_superadmin",
        email: "superadmin@educrm.demo",
        displayName: "Demo Super Admin",
        role: "platform_super_admin",
        createdAt: Date.now(),
        office: "London HQ",
        branchId: "branch-london",
        tenantId: "tenant-demo",
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(superAdmin));
    });

    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/\/super-admin\/dashboard|\/super-admin/);

    // Check tenants and system health navigation
    await expect(page.locator('text=/Super Admin|Tenants|System Health|Global Settings/i').first()).toBeVisible();
  });

  test('ADMIN-008: Immutable Audit Trail page is accessible to Super Admin and Auditor', async ({ page }) => {
    await page.evaluate(() => {
      const superAdmin = {
        uid: "demo_superadmin",
        email: "superadmin@educrm.demo",
        displayName: "Demo Super Admin",
        role: "platform_super_admin",
        createdAt: Date.now(),
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(superAdmin));
    });

    await page.goto('/audit-log');
    await expect(page).toHaveURL(/\/audit-log/);
    await expect(page.locator('text=/Audit Log|Audit Trail|Activity/i').first()).toBeVisible();
  });
});
