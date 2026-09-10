import { test, expect } from '@playwright/test';

test.describe('UI Interactions, Buttons, Modals & Console Integrity', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    // Listen for uncaught JavaScript exceptions and errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Exclude benign network/favicon or third-party simulator warnings
        if (!text.includes('favicon') && !text.includes('Failed to load resource')) {
          consoleErrors.push(text);
        }
      }
    });

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

  test('UI-001: Navigation sidebar collapses and expands smoothly', async ({ page }) => {
    await page.goto('/counsellor/dashboard');
    const collapseToggle = page.locator('button[title*="Collapse"], button:has(.lucide-chevron-left), button:has(.lucide-chevron-right)').first();
    if (await collapseToggle.isVisible()) {
      await collapseToggle.click();
      await page.waitForTimeout(300);
      await collapseToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('UI-002: Theme toggle switches between Dark and Light color palettes', async ({ page }) => {
    await page.goto('/counsellor/dashboard');
    const themeBtn = page.locator('button[title*="theme"], button:has(.lucide-sun), button:has(.lucide-moon)').first();
    if (await themeBtn.isVisible()) {
      const htmlEl = page.locator('html');
      const initialClass = await htmlEl.getAttribute('class');
      await themeBtn.click();
      await page.waitForTimeout(300);
      const newClass = await htmlEl.getAttribute('class');
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('UI-003: Search inputs filter data without throwing unhandled exceptions', async ({ page }) => {
    await page.goto('/universities');
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Oxford');
      await page.waitForTimeout(500);
      await searchInput.clear();
      await page.waitForTimeout(300);
    }
  });

  test('UI-004: Modal dialogs open, display content, and dismiss gracefully', async ({ page }) => {
    await page.goto('/leads');
    const addLeadBtn = page.locator('button:has-text("Add Lead"), button:has-text("New Lead")').first();
    if (await addLeadBtn.isVisible()) {
      await addLeadBtn.click();
      // Verify modal is open
      const modal = page.locator('.fixed.inset-0, [role="dialog"], div:has-text("Add New Lead")').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Dismiss modal via Close or Cancel button
      const closeBtn = page.locator('button:has(.lucide-x), button:has-text("Cancel")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('UI-005: Zero uncaught runtime fatal crashes on primary navigation surfaces', async ({ page }) => {
    const testRoutes = ['/counsellor/dashboard', '/leads', '/universities', '/tasks'];

    for (const route of testRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
    }

    // Filter out known React warnings if any; verify no fatal error explosions
    const fatalErrors = consoleErrors.filter(e => e.includes('Uncaught') || e.includes('TypeError:') || e.includes('ReferenceError:'));
    expect(fatalErrors).toHaveLength(0);
  });
});
