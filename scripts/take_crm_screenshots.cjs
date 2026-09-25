const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const screenshotsDir = path.join(__dirname, '..', 'crm_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Check if port 5173 is already running or start vite
  let viteProcess = null;
  let isRunning = false;
  try {
    const res = await fetch('http://localhost:5173');
    if (res.ok) isRunning = true;
  } catch (e) {
    isRunning = false;
  }

  if (!isRunning) {
    console.log('Starting vite server...');
    viteProcess = spawn('npx.cmd', ['vite', '--port', '5173'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      shell: true
    });

    viteProcess.stdout.on('data', data => console.log(`vite: ${data}`));
    viteProcess.stderr.on('data', data => console.error(`vite err: ${data}`));

    // Wait until server is up
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://localhost:5173');
        if (res.ok) {
          console.log('Vite server is ready!');
          break;
        }
      } catch (e) {
        await wait(1000);
      }
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  async function setSession(role, displayName = 'Saad Ali Qureshi') {
    await page.evaluate(({ role, displayName }) => {
      const user = {
        uid: `user_${role}`,
        email: `${role}@educrm.demo`,
        displayName: displayName,
        role: role,
        createdAt: Date.now(),
        office: "London HQ",
        branchId: "branch-london",
        tenantId: "tenant-demo",
      };
      localStorage.setItem("educrm_demo_user", JSON.stringify(user));
    }, { role, displayName });
  }

  // Helper to capture a page
  async function capture(url, role, filename, delay = 2000) {
    console.log(`Capturing ${filename} (${url}) as ${role}...`);
    await setSession(role);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await wait(delay);
    await page.screenshot({ path: path.join(screenshotsDir, filename) });
  }

  // Base screenshots
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await wait(1500);
  await page.screenshot({ path: path.join(screenshotsDir, '01_login_page.png') });

  await capture('http://localhost:5173/counsellor/dashboard', 'counsellor', '02_counsellor_dashboard.png');
  await capture('http://localhost:5173/leads', 'counsellor', '03_leads_management.png');
  await capture('http://localhost:5173/applications', 'admissions', '04_applications_pipeline.png');
  await capture('http://localhost:5173/student/dashboard', 'student', '05_student_dashboard.png');
  await capture('http://localhost:5173/student/universities', 'student', '06_university_catalog.png');
  await capture('http://localhost:5173/student/programs', 'student', '07_programme_search.png');
  await capture('http://localhost:5173/student/documents', 'student', '08_student_documents.png');
  await capture('http://localhost:5173/agent/dashboard', 'agent', '09_agent_portal.png');
  await capture('http://localhost:5173/university/dashboard', 'university_partner', '10_university_partner_portal.png');
  await capture('http://localhost:5173/lead-scoring', 'super_admin', '11_lead_scoring_ai.png');
  await capture('http://localhost:5173/data-quality', 'super_admin', '12_data_quality_dashboard.png');

  // Additional rich dashboard views
  await capture('http://localhost:5173/lead-routing', 'super_admin', '13_lead_routing_rules.png');
  await capture('http://localhost:5173/admissions/verification', 'admissions', '14_admissions_verification.png');
  await capture('http://localhost:5173/counsellor/matcher', 'counsellor', '15_ai_programme_matcher.png');
  await capture('http://localhost:5173/audit-log', 'super_admin', '16_audit_log_viewer.png');
  await capture('http://localhost:5173/finance/invoices', 'finance', '17_finance_invoices.png');
  await capture('http://localhost:5173/counsellor/students', 'counsellor', '18_assigned_students.png');

  console.log('All screenshots captured successfully!');
  await browser.close();

  if (viteProcess) {
    viteProcess.kill();
  }
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
