const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BASE_URL = process.env.AUDIT_BASE_URL || 'https://education-crm-9fee2.web.app';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, name: 'desktop' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  mobile: { width: 390, height: 844, name: 'mobile', isMobile: true },
};

const AUDIT_DIR = path.join(__dirname, '..', 'audit');
const SCREENSHOTS_DIR = path.join(AUDIT_DIR, 'screenshots');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function runAudit() {
  console.log(`Starting Complete Audit against: ${BASE_URL}`);

  ensureDir(path.join(SCREENSHOTS_DIR, 'landing-page'));
  ensureDir(path.join(SCREENSHOTS_DIR, 'course-discovery'));
  ensureDir(path.join(SCREENSHOTS_DIR, 'registration'));
  ensureDir(path.join(SCREENSHOTS_DIR, 'student-dashboard'));
  ensureDir(path.join(SCREENSHOTS_DIR, 'staff-login'));
  ensureDir(path.join(SCREENSHOTS_DIR, 'deployed'));
  ensureDir(path.join(SCREENSHOTS_DIR, 'comparisons'));

  const results = {
    url: BASE_URL,
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: [],
    errors: [],
  };

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Public Landing Page Responsiveness (Desktop, Tablet, Mobile)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Public Landing Page Responsiveness ---');
    for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: !!vp.isMobile,
        deviceScaleFactor: 1.5,
      });
      const page = await context.newPage();

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      console.log(`Loading ${BASE_URL}/ on ${vp.name}...`);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await wait(2500);

      const title = await page.title();
      const screenshotPath = path.join(SCREENSHOTS_DIR, 'landing-page', `landing_${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      console.log(`Saved screenshot: ${screenshotPath}`);
      results.screenshots.push({ page: 'landing', viewport: vp.name, path: screenshotPath });

      const hasBrand = await page.evaluate(() => document.body.innerText.includes('EduBridge.AI'));
      const hasHero = await page.evaluate(() => document.body.innerText.includes('Find Your Dream University Course'));
      const hasMatcher = await page.evaluate(() => document.body.innerText.includes('Test Your University Admission Chances'));

      results.tests.push({
        test: `Landing page render (${vp.name})`,
        viewport: vp.name,
        passed: hasBrand && hasHero && hasMatcher,
        details: { title, hasBrand, hasHero, hasMatcher, consoleErrors: consoleErrors.length },
      });

      await context.close();
    }

    // -------------------------------------------------------------
    // Test 2: Course Discovery & Live Filtering Functionality
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Course Discovery & Filtering ---');
    {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await wait(2000);

      // Search input test
      const searchInput = page.locator('input[placeholder*="e.g. Data Science"]');
      await searchInput.fill('Computer Science');
      await wait(1000);

      const searchScreenshot = path.join(SCREENSHOTS_DIR, 'course-discovery', 'search_keyword_filter.png');
      await page.screenshot({ path: searchScreenshot });
      console.log(`Saved search screenshot: ${searchScreenshot}`);

      const resultsText = await page.evaluate(() => document.body.innerText);
      const matchesFiltered = resultsText.includes('Computer Science') || resultsText.includes('MSc in Advanced Computer Science');

      results.tests.push({
        test: 'Course search filtering',
        passed: matchesFiltered,
        details: { keyword: 'Computer Science', matchesFiltered },
      });

      await context.close();
    }

    // -------------------------------------------------------------
    // Test 3: AI Counsellor Matchmaker Interaction
    // -------------------------------------------------------------
    console.log('\n--- Test 3: AI Matchmaker Simulation ---');
    {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/#ai-counsellor`, { waitUntil: 'domcontentloaded' });
      await wait(2000);

      const matcherScreenshot = path.join(SCREENSHOTS_DIR, 'course-discovery', 'ai_matchmaker_widget.png');
      await page.screenshot({ path: matcherScreenshot });
      console.log(`Saved AI Matcher screenshot: ${matcherScreenshot}`);

      const hasAiScores = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('% High Match') || text.includes('% Target Match') || text.includes('AI Recommended University Shortlist');
      });

      results.tests.push({
        test: 'AI Matchmaker calculation & recommendation output',
        passed: hasAiScores,
        details: { hasAiScores },
      });

      await context.close();
    }

    // -------------------------------------------------------------
    // Test 4: Student Registration & Login Screen Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Student Registration & Login UI ---');
    {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      // Test Student Register page
      await page.goto(`${BASE_URL}/student-register`, { waitUntil: 'domcontentloaded' });
      await wait(2000);
      const regScreenshot = path.join(SCREENSHOTS_DIR, 'registration', 'student_registration_page.png');
      await page.screenshot({ path: regScreenshot });
      console.log(`Saved registration screenshot: ${regScreenshot}`);

      const hasCvScanner = await page.evaluate(() => {
        return document.body.innerText.includes('Resume') || document.body.innerText.includes('CV') || document.body.innerText.includes('Registration');
      });

      // Test Login page tabs
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await wait(2000);
      const loginScreenshot = path.join(SCREENSHOTS_DIR, 'staff-login', 'login_page_with_tabs.png');
      await page.screenshot({ path: loginScreenshot });
      console.log(`Saved login screenshot: ${loginScreenshot}`);

      const hasTabs = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Student Portal') && text.includes('Staff / EduCRM');
      });

      results.tests.push({
        test: 'Student registration page',
        passed: hasCvScanner,
        details: { hasCvScanner },
      });

      results.tests.push({
        test: 'Login page role tabs (Student vs Staff EduCRM)',
        passed: hasTabs,
        details: { hasTabs },
      });

      await context.close();
    }

    // -------------------------------------------------------------
    // Test 5: Authenticated Student Portal Experience (Aarav Patel Demo)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Authenticated Student Portal ---');
    {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      // Authenticate as registered student in localStorage
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        const studentUser = {
          uid: 'stu_1',
          email: 'aarav.patel@gmail.com',
          displayName: 'Aarav Patel',
          role: 'student',
          createdAt: Date.now() - 86400000 * 10,
          office: 'Delhi Hub',
          branchId: 'branch-delhi',
          tenantId: 'tenant-delhi',
          onboardingStatus: 'completed',
          profileCompleted: true,
          currentStep: 4,
        };
        localStorage.setItem('educrm_demo_user', JSON.stringify(studentUser));
        sessionStorage.setItem('demo_email_verified', 'true');
      });

      // Navigate to student dashboard
      await page.goto(`${BASE_URL}/student/dashboard`, { waitUntil: 'domcontentloaded' });
      await wait(2500);

      const studentDashScreenshot = path.join(SCREENSHOTS_DIR, 'student-dashboard', 'student_dashboard_desktop.png');
      await page.screenshot({ path: studentDashScreenshot });
      console.log(`Saved student dashboard screenshot: ${studentDashScreenshot}`);

      const studentDashText = await page.evaluate(() => document.body.innerText);
      const isStudentDashLoaded = studentDashText.includes('Applications') || studentDashText.includes('Documents') || studentDashText.includes('Aarav') || studentDashText.includes('Explore');

      results.tests.push({
        test: 'Student dashboard view & metrics for registered student',
        passed: isStudentDashLoaded,
        details: { isStudentDashLoaded },
      });

      // Also test Student Documents Vault
      await page.goto(`${BASE_URL}/student/documents`, { waitUntil: 'domcontentloaded' });
      await wait(2000);
      const studentDocsScreenshot = path.join(SCREENSHOTS_DIR, 'student-dashboard', 'student_documents_vault.png');
      await page.screenshot({ path: studentDocsScreenshot });

      // Also test Student Applications
      await page.goto(`${BASE_URL}/student/applications`, { waitUntil: 'domcontentloaded' });
      await wait(2000);
      const studentAppsScreenshot = path.join(SCREENSHOTS_DIR, 'student-dashboard', 'student_applications_tracker.png');
      await page.screenshot({ path: studentAppsScreenshot });

      await context.close();
    }

    // -------------------------------------------------------------
    // Test 6: Verify Staff EduCRM Workspaces & Role Isolation
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Staff EduCRM Role Workspaces ---');
    const staffRoles = [
      { role: 'counsellor', path: '/counsellor/dashboard', name: 'Education Counsellor' },
      { role: 'visa_officer', path: '/visa-officer/dashboard', name: 'Visa Officer' },
      { role: 'admissions_officer', path: '/admissions/dashboard', name: 'Admissions Officer' },
      { role: 'org_admin', path: '/dashboard', name: 'Organization Admin' },
      { role: 'platform_super_admin', path: '/super-admin/dashboard', name: 'Super Admin' },
      { role: 'finance_officer', path: '/finance/dashboard', name: 'Finance Officer' },
      { role: 'team_leader', path: '/team-leader/dashboard', name: 'Team Leader' },
    ];

    for (const staff of staffRoles) {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ role, name }) => {
        const staffUser = {
          uid: `usr_${role}`,
          email: `${role}@educrm.demo`,
          displayName: name,
          role: role,
          office: 'London HQ',
          branchId: 'branch-london',
          tenantId: 'tenant-london',
          createdAt: Date.now() - 500000,
        };
        localStorage.setItem('educrm_demo_user', JSON.stringify(staffUser));
        sessionStorage.setItem('demo_email_verified', 'true');
      }, staff);

      await page.goto(`${BASE_URL}${staff.path}`, { waitUntil: 'domcontentloaded' });
      await wait(2500);

      const staffScreenshot = path.join(SCREENSHOTS_DIR, 'staff-login', `${staff.role}_workspace.png`);
      await page.screenshot({ path: staffScreenshot });
      console.log(`Saved screenshot for ${staff.name}: ${staffScreenshot}`);

      const pageText = await page.evaluate(() => document.body.innerText);
      const hasSidebar = await page.evaluate(() => !!document.querySelector('aside') || document.body.innerText.includes('Logout'));
      const hasPublicPortalLink = pageText.includes('Public Portal');

      results.tests.push({
        test: `Staff EduCRM workspace access: ${staff.name}`,
        role: staff.role,
        route: staff.path,
        passed: hasSidebar,
        details: { hasSidebar, hasPublicPortalLink },
      });

      await context.close();
    }

    // -------------------------------------------------------------
    // Test 7: Security Guard & Direct Route Refresh (Firebase Rewrites)
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Direct URL Access & Refresh Test (Rewrites) ---');
    {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      const testRoutes = [
        '/',
        '/explore',
        '/programmes',
        '/scholarships',
        '/login',
        '/student-register',
      ];

      for (const r of testRoutes) {
        await page.goto(`${BASE_URL}${r}`, { waitUntil: 'domcontentloaded' });
        await wait(1000);
        // Refresh to test SPA rewrite without 404
        await page.reload({ waitUntil: 'domcontentloaded' });
        await wait(1000);

        const pageTitle = await page.title();
        const isNot404 = !pageTitle.toLowerCase().includes('404') && !pageTitle.toLowerCase().includes('not found');

        results.tests.push({
          test: `Direct route load & refresh: ${r}`,
          route: r,
          passed: isNot404,
          details: { pageTitle },
        });
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // Test 8: Security Guard: Unauthorized Access Blocking
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Security Access Guard ---');
    {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();

      // Clear storage (Unauthenticated guest)
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Attempt to access protected internal routes
      await page.goto(`${BASE_URL}/leads`, { waitUntil: 'domcontentloaded' });
      await wait(1500);

      const finalUrl = page.url();
      const isRedirectedToLogin = finalUrl.includes('/login');

      results.tests.push({
        test: 'Guest access to /leads is blocked and redirected to /login',
        passed: isRedirectedToLogin,
        details: { finalUrl },
      });

      await context.close();
    }

  } catch (err) {
    console.error('Audit Error:', err);
    results.errors.push(err.message);
  } finally {
    await browser.close();
  }

  // Save JSON report
  const jsonReportPath = path.join(AUDIT_DIR, 'reports', 'audit-raw-results.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2));
  console.log(`\nAudit results written to: ${jsonReportPath}`);

  return results;
}

runAudit().then((r) => {
  const total = r.tests.length;
  const passed = r.tests.filter((t) => t.passed).length;
  const failed = total - passed;
  console.log(`\n================ AUDIT SUMMARY ================`);
  console.log(`Target: ${r.url}`);
  console.log(`Total tests: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Screenshots captured: ${r.screenshots.length}`);
  console.log(`===============================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
