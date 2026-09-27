const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const screenshotsDir = path.join(__dirname, '..', 'crm_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching Chromium...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  async function loginAs(role, options = {}) {
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ role, options }) => {
      let demoUser;
      if (role === 'student' && options.isRegisteredStudent) {
        demoUser = {
          uid: 'stu_1',
          email: 'aarav.patel@gmail.com',
          displayName: 'Aarav Patel',
          role: 'student',
          createdAt: Date.now() - 86400000 * 10,
          office: 'Delhi Hub',
          branchId: 'branch-delhi',
          tenantId: 'tenant-demo',
          onboardingStatus: 'completed',
          profileCompleted: true,
          currentStep: 4,
        };
      } else {
        demoUser = {
          uid: `demo_${role}`,
          email: `${role}@educrm.demo`,
          displayName: `Demo ${role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
          role: role,
          createdAt: Date.now(),
          office: 'London HQ',
          branchId: 'branch-london',
          tenantId: 'tenant-demo',
          partnerUniversityId: role === 'university_partner' ? 'univ_oxf' : undefined,
          universityName: role === 'university_partner' ? 'University of Oxford' : undefined,
          ...(role === 'student' ? { onboardingStatus: 'not_started', profileCompleted: false, currentStep: 1 } : {}),
        };
      }
      localStorage.setItem('educrm_demo_user', JSON.stringify(demoUser));
      sessionStorage.setItem('demo_email_verified', 'true');
    }, { role, options });
  }

  async function capture(url, role, filename, options = {}) {
    const filePath = path.join(screenshotsDir, filename);
    console.log(`[CAPTURE] ${filename} from ${url} as ${role}...`);
    try {
      if (role) {
        await loginAs(role, options);
      }
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await wait(options.delay || 2000);
      if (options.action) {
        await options.action(page);
        await wait(1000);
      }
      await page.screenshot({ path: filePath });
      console.log(`  -> Saved ${filename}`);
    } catch (err) {
      console.error(`  -> Failed ${filename}:`, err.message);
    }
  }

  // 1. Login page with Demo Accounts open
  await capture('http://127.0.0.1:5173/login', null, '01_login_and_demo_access.png', {
    delay: 1500,
    action: async (p) => {
      try {
        const demoBtn = await p.$('button:has-text("Demo Accounts")');
        if (demoBtn) await demoBtn.click();
      } catch (e) {}
    }
  });

  // 2. Student Registration with AI CV Scanner
  await capture('http://127.0.0.1:5173/register?role=student', null, '02_student_registration_cv_upload.png');

  // 3. Student Onboarding Step 1
  await capture('http://127.0.0.1:5173/student/onboarding/step-1', 'student', '03_student_onboarding_step1.png', { isRegisteredStudent: false });

  // 4. Student Onboarding Step 2
  await capture('http://127.0.0.1:5173/student/onboarding/step-2', 'student', '04_student_onboarding_step2.png', { isRegisteredStudent: false });

  // 5. Student Onboarding Step 3
  await capture('http://127.0.0.1:5173/student/onboarding/step-3', 'student', '05_student_onboarding_step3.png', { isRegisteredStudent: false });

  // 6. Student Onboarding Step 4
  await capture('http://127.0.0.1:5173/student/onboarding/step-4', 'student', '06_student_onboarding_step4.png', { isRegisteredStudent: false });

  // 7. Student Dashboard (Aarav Patel)
  await capture('http://127.0.0.1:5173/student/dashboard', 'student', '07_student_dashboard.png', { isRegisteredStudent: true });

  // 8. Student Programme Catalog
  await capture('http://127.0.0.1:5173/student/programs', 'student', '08_student_programme_catalog.png', { isRegisteredStudent: true });

  // 9. Student Application Wizard
  await capture('http://127.0.0.1:5173/student/new-application', 'student', '09_student_application_wizard.png', { isRegisteredStudent: true });

  // 10. Student Document Vault
  await capture('http://127.0.0.1:5173/student/documents', 'student', '10_student_document_vault.png', { isRegisteredStudent: true });

  // 11. Student Invoices & Challans
  await capture('http://127.0.0.1:5173/student/invoices', 'student', '11_student_invoices.png', { isRegisteredStudent: true });

  // 12. Counsellor Dashboard
  await capture('http://127.0.0.1:5173/counsellor/dashboard', 'counsellor', '12_counsellor_dashboard.png');

  // 13. Leads Management
  await capture('http://127.0.0.1:5173/leads', 'counsellor', '13_leads_management.png');

  // 14. Counsellor Students Management
  await capture('http://127.0.0.1:5173/counsellor/students', 'counsellor', '14_counsellor_students.png');

  // 15. Programme Matcher & Eligibility
  await capture('http://127.0.0.1:5173/counsellor/programme-matcher', 'counsellor', '15_counsellor_programme_matcher.png');

  // 16. Applications Management (Staff Pipeline)
  await capture('http://127.0.0.1:5173/applications', 'counsellor', '16_applications_pipeline.png');

  // 17. Admissions Dashboard
  await capture('http://127.0.0.1:5173/admissions/dashboard', 'admissions_officer', '17_admissions_dashboard.png');

  // 18. Admissions Document Verification Hub
  await capture('http://127.0.0.1:5173/admissions/verification', 'admissions_officer', '18_admissions_verification_hub.png');

  // 19. Admissions Offer Letters
  await capture('http://127.0.0.1:5173/admissions/offers', 'admissions_officer', '19_admissions_offers.png');

  // 20. Team Leader Dashboard
  await capture('http://127.0.0.1:5173/team-leader/dashboard', 'team_leader', '20_team_leader_dashboard.png');

  // 21. Team Leader Assign Applications
  await capture('http://127.0.0.1:5173/team-leader/assign-applications', 'team_leader', '21_team_leader_assign_applications.png');

  // 22. Visa Officer Dashboard
  await capture('http://127.0.0.1:5173/visa-officer/dashboard', 'visa_officer', '22_visa_officer_dashboard.png');

  // 23. Visa Documents Hub
  await capture('http://127.0.0.1:5173/visa-officer/documents', 'visa_officer', '23_visa_documents_hub.png');

  // 24. Finance Dashboard
  await capture('http://127.0.0.1:5173/finance/dashboard', 'finance_officer', '24_finance_dashboard.png');

  // 25. Finance Invoices & Billing
  await capture('http://127.0.0.1:5173/finance/invoices', 'finance_officer', '25_finance_invoices.png');

  // 26. External Agent Dashboard
  await capture('http://127.0.0.1:5173/agent/dashboard', 'external_agent', '26_agent_dashboard.png');

  // 27. Agent Refer Lead Form
  await capture('http://127.0.0.1:5173/agent/refer-lead', 'external_agent', '27_agent_refer_lead.png');

  // 28. University Partner Dashboard
  await capture('http://127.0.0.1:5173/university/dashboard', 'university_partner', '28_university_partner_dashboard.png');

  // 29. Super Admin Dashboard
  await capture('http://127.0.0.1:5173/super-admin/dashboard', 'platform_super_admin', '29_super_admin_dashboard.png');

  // 30. Auditor Trail & Compliance Logs
  await capture('http://127.0.0.1:5173/auditor/audit-trail', 'auditor', '30_auditor_trail.png');

  await browser.close();
  console.log('Capture script finished successfully!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
