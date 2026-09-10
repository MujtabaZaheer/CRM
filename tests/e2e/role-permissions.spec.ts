import { test, expect } from '@playwright/test';

test.describe('Role-Based Authorization & Permission Boundaries', () => {
  test('ROLE-BOUND-001: Student role CANNOT access Super Admin portal', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      const student = {
        uid: "stu_test",
        email: "student@educrm.demo",
        displayName: "Student Test",
        role: "student",
        createdAt: Date.now(),
        onboardingStatus: "completed",
        profileCompleted: true,
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(student));
    });

    await page.goto('/super-admin/dashboard');
    // RoleGate must intercept and display Access Restricted banner
    await expect(page.locator('text=/Access Restricted|does not have permission/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('ROLE-BOUND-002: Student role CANNOT access Finance invoices & refunds', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      const student = {
        uid: "stu_test",
        email: "student@educrm.demo",
        displayName: "Student Test",
        role: "student",
        createdAt: Date.now(),
        onboardingStatus: "completed",
        profileCompleted: true,
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(student));
    });

    await page.goto('/finance/invoices');
    await expect(page.locator('text=/Access Restricted|does not have permission/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('ROLE-BOUND-003: Counsellor CANNOT access Super Admin portal', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      const counsellor = {
        uid: "counsellor_test",
        email: "counsellor@educrm.demo",
        displayName: "Counsellor Test",
        role: "counsellor",
        createdAt: Date.now(),
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(counsellor));
    });

    await page.goto('/super-admin/tenants');
    await expect(page.locator('text=/Access Restricted|does not have permission/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('ROLE-BOUND-004: External Agent access is constrained to /agent portal', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      const agent = {
        uid: "agent_test",
        email: "agent@educrm.demo",
        displayName: "Agent Partner",
        role: "external_agent",
        createdAt: Date.now(),
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(agent));
    });

    // Valid route
    await page.goto('/agent/dashboard');
    await expect(page).toHaveURL(/\/agent\/dashboard/);

    // Forbidden route: Users administration
    await page.goto('/users');
    await page.waitForURL((url) => !url.pathname.endsWith('/users'), { timeout: 10000 });
    expect(page.url()).not.toContain('/users');
  });

  test('ROLE-BOUND-005: University Partner access is constrained to /university portal', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      const uniPartner = {
        uid: "partner_test",
        email: "partner@educrm.demo",
        displayName: "Partner Rep",
        role: "university_partner",
        createdAt: Date.now(),
        partnerUniversityId: "univ-oxford",
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(uniPartner));
    });

    // Valid route
    await page.goto('/university/dashboard');
    await expect(page).toHaveURL(/\/university\/dashboard/);

    // Forbidden route: Users administration (guarded by isAuthorized)
    await page.goto('/users');
    await page.waitForURL((url) => !url.pathname.endsWith('/users'), { timeout: 10000 });
    expect(page.url()).not.toContain('/users');
  });

  test('ROLE-BOUND-006: Auditor role has read-only compliance views', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      const auditor = {
        uid: "auditor_test",
        email: "auditor@educrm.demo",
        displayName: "Auditor Test",
        role: "auditor",
        createdAt: Date.now(),
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(auditor));
    });

    await page.goto('/auditor/dashboard');
    await expect(page).toHaveURL(/\/auditor\/dashboard/);
    await expect(page.locator('text=/Auditor|Audit Trail|Compliance/i').first()).toBeVisible();
  });

  test('ROLE-BOUND-007: Unauthenticated visitor accessing protected route redirects to /login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
