import { test, expect } from '@playwright/test';

test.describe('Leads Route Authorization & Role Gate (Phase 3 Fix Verification)', () => {
  // Helper to set role in localStorage session
  const setDemoSession = async (page: any, role: string, extra = {}) => {
    await page.addInitScript(({ r, ex }) => {
      const demoUser = {
        uid: `demo_${r}`,
        email: `${r}@educrm.demo`,
        displayName: `Test ${r}`,
        role: r,
        tenantId: 'tenant-demo',
        branchId: 'branch-london',
        createdAt: Date.now(),
        ...ex,
      };
      localStorage.setItem('educrm_demo_user', JSON.stringify(demoUser));
    }, { r: role, ex: extra });
  };

  test('LEADS-AUTH-001: Student navigating directly to /leads is DENIED by RoleGate', async ({ page }) => {
    await setDemoSession(page, 'student', { onboardingStatus: 'completed', profileCompleted: true });
    await page.goto('/leads');

    // Must display Access Restricted gate
    await expect(page.locator('text=/Access Restricted|Access Denied|Security Authorization Required/i').first()).toBeVisible({ timeout: 10000 });
    // Leads table must NOT be visible to student
    await expect(page.locator('text=/Leads Management|Add New Lead|All Stages/i')).not.toBeVisible();
  });

  test('LEADS-AUTH-002: Auditor navigating directly to /leads is DENIED by RoleGate', async ({ page }) => {
    await setDemoSession(page, 'auditor');
    await page.goto('/leads');

    await expect(page.locator('text=/Access Restricted|Access Denied/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Add Lead"), button:has-text("New Lead")')).not.toBeVisible();
  });

  test('LEADS-AUTH-003: University Partner navigating directly to /leads is DENIED by RoleGate', async ({ page }) => {
    await setDemoSession(page, 'university_partner', { partnerUniversityId: 'univ-oxford' });
    await page.goto('/leads');

    await expect(page.locator('text=/Access Restricted|Access Denied/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('LEADS-AUTH-004: External Agent navigating directly to /leads is DENIED by RoleGate', async ({ page }) => {
    await setDemoSession(page, 'external_agent');
    await page.goto('/leads');

    await expect(page.locator('text=/Access Restricted|Access Denied/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('LEADS-AUTH-005: Counsellor navigating to /leads is ALLOWED', async ({ page }) => {
    await setDemoSession(page, 'counsellor');
    await page.goto('/leads');

    // Should load Leads workspace
    await expect(page.locator('text=/Leads/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Access Restricted/i')).not.toBeVisible();
  });

  test('LEADS-AUTH-006: Team Leader navigating to /leads is ALLOWED', async ({ page }) => {
    await setDemoSession(page, 'team_leader');
    await page.goto('/leads');

    await expect(page.locator('text=/Leads/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Access Restricted/i')).not.toBeVisible();
  });

  test('LEADS-AUTH-007: Org Admin navigating to /leads is ALLOWED', async ({ page }) => {
    await setDemoSession(page, 'org_admin');
    await page.goto('/leads');

    await expect(page.locator('text=/Leads/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Access Restricted/i')).not.toBeVisible();
  });

  test('LEADS-AUTH-008: Platform Super Admin navigating to /leads is ALLOWED', async ({ page }) => {
    await setDemoSession(page, 'platform_super_admin');
    await page.goto('/leads');

    await expect(page.locator('text=/Leads/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Access Restricted/i')).not.toBeVisible();
  });
});
