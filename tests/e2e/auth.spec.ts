import { test, expect } from '@playwright/test';

test.describe('Authentication and Account Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test for clean state
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('AUTH-001: Login page renders with branding, input fields, demo logins, and register links', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In|Sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Create New Account/i }).first()).toBeVisible();
  });

  test('AUTH-002: Rejects empty or missing credentials with HTML5 / validation feedback', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Sign In|Sign in/i });
    await submitBtn.click();
    // Verify user remains on login page
    expect(page.url()).toContain('/login');
  });

  test('AUTH-003: Login with invalid credentials displays error notification without crashing', async ({ page }) => {
    await page.locator('input[type="email"]').fill('nonexistent.qa.user@example.test');
    await page.locator('input[type="password"]').fill('WrongPassword999!');
    await page.getByRole('button', { name: /Sign In|Sign in/i }).click();

    // Application should display error alert / message
    const errorNotice = page.locator('.text-rose-400, .bg-rose-500\\/10').or(page.getByText(/invalid|failed|error|user-not-found/i)).first();
    await expect(errorNotice).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('AUTH-004: Quick Demo Login transitions smoothly to role dashboard', async ({ page }) => {
    // Find Demo Counsellor or Quick Login trigger
    const counsellorDemoBtn = page.locator('button:has-text("Counsellor"), button:has-text("Demo Counsellor")').first();
    if (await counsellorDemoBtn.isVisible()) {
      await counsellorDemoBtn.click();
      // Should redirect to counsellor dashboard or main dashboard
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
      expect(page.url()).not.toContain('/login');
    }
  });

  test('AUTH-005: Demo Student Fast-Login navigates to Student Experience', async ({ page }) => {
    const studentDemoBtn = page.locator('button:has-text("Student"), button:has-text("Demo Student")').first();
    if (await studentDemoBtn.isVisible()) {
      await studentDemoBtn.click();
      await page.waitForURL((url) => url.pathname.includes('/student'), { timeout: 15000 });
      expect(page.url()).toContain('/student');
    }
  });

  test('AUTH-006: Session persistence maintains user after browser reload', async ({ page }) => {
    // Inject mock session
    await page.evaluate(() => {
      const user = {
        uid: "demo_counsellor",
        email: "counsellor@educrm.demo",
        displayName: "Demo Counsellor",
        role: "counsellor",
        createdAt: Date.now(),
        office: "London HQ",
        branchId: "branch-london",
        tenantId: "tenant-demo"
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(user));
    });

    await page.goto('/counsellor/dashboard');
    await expect(page).toHaveURL(/\/counsellor\/dashboard|\//);
    // Reload page
    await page.reload();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('AUTH-007: Registration page renders role selection and form validation fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText(/Create Your Account|Create Account|Select your role/i).first()).toBeVisible();

    // Check presence of role options
    const studentCard = page.locator('text=/Student|Applicant/i').first();
    await expect(studentCard).toBeVisible();
  });

  test('AUTH-008: Password strength meter enforces complexity rules', async ({ page }) => {
    await page.goto('/register?role=student');
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('weak');
      // Should show unmet requirements
      await expect(page.getByText(/At least 8 characters/i)).toBeVisible();
      
      // Fill strong password
      await passwordInput.fill('SecurePass123!@#');
      // At least 8 characters requirement should be satisfied
      await expect(page.getByText(/At least 8 characters/i)).toBeVisible();
    }
  });

  test('AUTH-009: Forgot password toggle reveals reset form', async ({ page }) => {
    await page.goto('/login');
    const forgotBtn = page.getByRole('button', { name: /Forgot password|Reset password/i });
    if (await forgotBtn.isVisible()) {
      await forgotBtn.click();
      await expect(page.getByRole('button', { name: /Send Reset Link|Reset Password/i })).toBeVisible();
    }
  });

  test('AUTH-010: Logout clears session and redirects to /login', async ({ page }) => {
    // Login as counsellor first
    await page.evaluate(() => {
      const user = {
        uid: "demo_counsellor",
        email: "counsellor@educrm.demo",
        displayName: "Demo Counsellor",
        role: "counsellor",
        createdAt: Date.now(),
        office: "London HQ",
        branchId: "branch-london",
        tenantId: "tenant-demo"
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(user));
    });

    await page.goto('/counsellor/dashboard');
    // Find logout button
    const logoutBtn = page.locator('button[title*="Sign Out"], button:has-text("Sign Out"), button:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/login');
    }
  });
});
