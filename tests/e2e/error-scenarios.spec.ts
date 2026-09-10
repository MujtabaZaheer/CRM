import { test, expect } from '@playwright/test';

test.describe('Error Handling, Edge Cases & Recovery', () => {
  test('ERR-001: Non-existent routes gracefully redirect to root fallback without breaking', async ({ page }) => {
    await page.goto('/some-completely-invalid-nonexistent-url-path');
    // Allow React Router to mount and execute client-side redirect
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/login', { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login)?$/);
  });

  test('ERR-002: Corrupted or invalid localStorage state recovers safely', async ({ page }) => {
    await page.goto('/login');
    // Inject malformed JSON in localStorage
    await page.evaluate(() => {
      localStorage.setItem("educrm_demo_user", "{malformed_json_corrupted: true,");
    });

    await page.reload();
    // App should not crash with white screen, should stay on login or safely clear corrupted state
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('ERR-003: Direct navigation to protected resource while logged out safely directs to login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/applications');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('ERR-004: Empty state rendering does not crash data tables or lists', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      const emptyUser = {
        uid: "demo_empty",
        email: "empty@educrm.demo",
        displayName: "Empty Roster User",
        role: "counsellor",
        createdAt: Date.now(),
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(emptyUser));
    });

    await page.goto('/tasks');
    await page.waitForLoadState('domcontentloaded');
    // Either tasks or empty placeholder should be visible, no unhandled exceptions
    await expect(page.locator('text=/Tasks|No tasks|Create Task/i').first()).toBeVisible({ timeout: 10000 });
  });
});
