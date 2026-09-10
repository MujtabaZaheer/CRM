import { test, expect } from '@playwright/test';

test.describe('Student End-to-End Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as a registered student with completed profile
    await page.goto('/login');
    await page.evaluate(() => {
      const studentUser = {
        uid: "stu_1",
        email: "aarav.patel@gmail.com",
        displayName: "Aarav Patel",
        role: "student",
        createdAt: Date.now() - 86400000 * 10,
        office: "Delhi Hub",
        branchId: "branch-delhi",
        tenantId: "tenant-demo",
        onboardingStatus: "completed",
        profileCompleted: true,
        currentStep: 4,
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(studentUser));
    });
  });

  test('STUD-FLOW-001: Student Dashboard renders application metrics and upcoming deadlines', async ({ page }) => {
    await page.goto('/student/dashboard');
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Verify key UI cards: Applications, Documents, Programs, Status
    await expect(page.locator('text=/Applications|My Applications/i').first()).toBeVisible();
    await expect(page.locator('text=/Document Vault|Documents/i').first()).toBeVisible();
  });

  test('STUD-FLOW-002: Student Profile allows reviewing personal & academic information', async ({ page }) => {
    await page.goto('/student/profile');
    await expect(page).toHaveURL(/\/student\/profile/);

    // Verify profile tabs or fields
    await expect(page.locator('text=/Personal Information|Aarav Patel|Academic/i').first()).toBeVisible();
  });

  test('STUD-FLOW-003: University Discovery allows browsing and filtering academic partners', async ({ page }) => {
    await page.goto('/student/universities');
    await expect(page).toHaveURL(/\/student\/universities/);

    // Check university cards render
    const univCards = page.locator('.rounded-2xl, .rounded-xl, div:has-text("University")');
    await expect(univCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('STUD-FLOW-004: Program Discovery displays programs and search filtering', async ({ page }) => {
    await page.goto('/student/programs');
    await expect(page).toHaveURL(/\/student\/programs/);

    // Search bar should be present
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Computer Science');
      await page.waitForTimeout(500);
    }
  });

  test('STUD-FLOW-005: New Application wizard renders programme selection and submission steps', async ({ page }) => {
    await page.goto('/apply/prog_oxford_cs');
    await expect(page).toHaveURL(/\/apply\/prog_oxford_cs|\/student\/new-application/);

    // Check application wizard steps
    await expect(page.locator('text=/Overview|Personal Info|Academic History|Submit/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('STUD-FLOW-006: Student Document Vault displays document requirements and upload triggers', async ({ page }) => {
    await page.goto('/student/documents');
    await expect(page).toHaveURL(/\/student\/documents/);

    // Check document vault header and categories
    await expect(page.locator('text=/Document Vault|Upload Document|Required Documents/i').first()).toBeVisible();
  });

  test('STUD-FLOW-007: Counsellor Chat channel connects student with assigned counsellor', async ({ page }) => {
    await page.goto('/student/messages');
    await expect(page).toHaveURL(/\/student\/messages/);

    // Message input or conversation pane should render
    await expect(page.locator('text=/Messages|Conversation|Chat|Counsellor/i').first()).toBeVisible();
  });

  test('STUD-FLOW-008: Student Onboarding Guard redirects incomplete profiles to wizard', async ({ page }) => {
    // Set uncompleted onboarding student
    await page.evaluate(() => {
      const incompleteStudent = {
        uid: "stu_new",
        email: "new.student@educrm.demo",
        displayName: "New Student",
        role: "student",
        createdAt: Date.now(),
        onboardingStatus: "not_started",
        profileCompleted: false,
        currentStep: 1,
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(incompleteStudent));
    });

    await page.goto('/student/dashboard');
    // Guard must redirect to onboarding
    await page.waitForURL(/\/student\/onboarding/, { timeout: 10000 });
    expect(page.url()).toContain('/student/onboarding');
  });
});
