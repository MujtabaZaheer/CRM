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

  console.log('Capturing Login Page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '01_login_page.png') });

  // Function to set user session
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

  // 1. Counsellor Dashboard
  console.log('Capturing Counsellor Dashboard...');
  await setSession('counsellor');
  await page.goto('http://localhost:5173/counsellor/dashboard', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '02_counsellor_dashboard.png') });

  // 2. Leads Desk
  console.log('Capturing Leads Desk...');
  await page.goto('http://localhost:5173/leads', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '03_leads_management.png') });

  // 3. Applications Desk
  console.log('Capturing Applications Desk...');
  await page.goto('http://localhost:5173/applications', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '04_applications_pipeline.png') });

  // 4. Student Portal Dashboard
  console.log('Capturing Student Dashboard...');
  await setSession('student', 'Saad Ali Qureshi');
  await page.goto('http://localhost:5173/student/dashboard', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '05_student_dashboard.png') });

  // 5. University Catalog
  console.log('Capturing University Catalog...');
  await page.goto('http://localhost:5173/student/universities', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '06_university_catalog.png') });

  // 6. Programme Search
  console.log('Capturing Programme Catalog...');
  await page.goto('http://localhost:5173/student/programs', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '07_programme_search.png') });

  // 7. Student Document Vault
  console.log('Capturing Student Document Vault...');
  await page.goto('http://localhost:5173/student/documents', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '08_student_documents.png') });

  // 8. External Agent Portal
  console.log('Capturing External Agent Portal...');
  await setSession('agent', 'Saad Ali Qureshi');
  await page.goto('http://localhost:5173/agent/dashboard', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '09_agent_portal.png') });

  // 9. University Partner Portal
  console.log('Capturing University Partner Portal...');
  await setSession('university_partner', 'University Partner Admin');
  await page.goto('http://localhost:5173/university/dashboard', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '10_university_partner_portal.png') });

  // 10. Lead Scoring / AI Engine
  console.log('Capturing Lead Scoring Matrix...');
  await setSession('super_admin', 'Saad Ali Qureshi');
  await page.goto('http://localhost:5173/lead-scoring', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '11_lead_scoring_ai.png') });

  // 11. Data Quality / Super Admin
  console.log('Capturing Super Admin & Data Quality...');
  await page.goto('http://localhost:5173/data-quality', { waitUntil: 'domcontentloaded' });
  await wait(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '12_data_quality_dashboard.png') });

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
