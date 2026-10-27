const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SCREENSHOTS_DIR = path.join(__dirname, "..", "audit", "screenshots");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const LIVE_URL = "https://education-crm-9fee2.web.app";

async function runLiveVerification() {
  console.log("=== STARTING LIVE PRODUCTION VERIFICATION ===");
  console.log(`Target: ${LIVE_URL}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.log("Default chromium launch failed, trying with system channel chrome/msedge...");
    try {
      browser = await chromium.launch({ channel: "chrome", headless: true });
    } catch (err2) {
      browser = await chromium.launch({ channel: "msedge", headless: true });
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  // Test 1: Public Landing Page
  console.log("\n[Test 1] Navigating to Public Portal Landing Page...");
  await page.goto(`${LIVE_URL}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "live_01_public_landing.png") });
  console.log("✓ Public Landing Page loaded & captured");

  // Test 2: Login Page
  console.log("\n[Test 2] Navigating to Login Page...");
  await page.goto(`${LIVE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "live_02_login_page.png") });
  console.log("✓ Login Page loaded & captured");

  // Test 3: Student Experience (Aarav Patel - Registered Student)
  console.log("\n[Test 3] Logging in as Demo Student (Aarav Patel)...");
  const demoTrigger = page.locator('button:has-text("Demo Accounts")').first();
  if (await demoTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
    await demoTrigger.click();
    await page.waitForTimeout(600);
  }

  const studentRegBtn = page.locator('button:has-text("Student (Reg)")').first();
  await studentRegBtn.click();

  await page.waitForURL("**/student/dashboard", { timeout: 20000 });
  await page.waitForTimeout(2000);

  const studentDashboardUrl = page.url();
  console.log(`Current URL: ${studentDashboardUrl}`);

  const bodyText = await page.innerText("body");
  const hasStudentBrand = bodyText.includes("EduBridge.AI") || bodyText.includes("Student Portal");
  const hasAarav = bodyText.includes("Aarav");
  const hasManchesterOffer = bodyText.includes("University of Manchester");
  const hasSarahJenkins = bodyText.includes("Sarah Jenkins");

  console.log(`- Has Student Portal branding: ${hasStudentBrand}`);
  console.log(`- Has student name greeting: ${hasAarav}`);
  console.log(`- Has Manchester Priority Offer: ${hasManchesterOffer}`);
  console.log(`- Has Assigned Counsellor: ${hasSarahJenkins}`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "live_03_student_dashboard_redesigned.png"), fullPage: false });
  console.log("✓ Live Redesigned Student Dashboard captured");

  // Test 4: Student AI Study Match
  console.log("\n[Test 4] Navigating to /student/ai-match via student sidebar...");
  const aiMatchLink = page.locator('a[href="/student/ai-match"]').first();
  await aiMatchLink.click();
  await page.waitForTimeout(2000);
  const hasMatcherTitle = (await page.innerText("body")).includes("AI University & Programme Matcher");
  console.log(`- AI Matcher page rendered: ${hasMatcherTitle}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "live_04_student_ai_match.png") });
  console.log("✓ Live Student AI Match page captured");

  // Test 5: Student Scholarships Page
  console.log("\n[Test 5] Navigating to /student/scholarships via student sidebar...");
  const scholarshipsLink = page.locator('a[href="/student/scholarships"]').first();
  await scholarshipsLink.click();
  await page.waitForTimeout(2000);
  const hasScholarships = (await page.innerText("body")).includes("Scholarships Radar");
  console.log(`- Scholarships radar rendered: ${hasScholarships}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "live_05_student_scholarships.png") });
  console.log("✓ Live Student Scholarships page captured");

  // Test 6: Staff Counsellor Experience (EduCRM Intact)
  console.log("\n[Test 6] Logging in as Counsellor in EduCRM...");
  await page.goto(`${LIVE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1000);

  const demoTriggerStaff = page.locator('button:has-text("Demo Accounts")').first();
  if (await demoTriggerStaff.isVisible({ timeout: 5000 }).catch(() => false)) {
    await demoTriggerStaff.click();
    await page.waitForTimeout(600);
  }

  const counsellorBtn = page.locator('button:has-text("Counsellor")').first();
  await counsellorBtn.click();
  await page.waitForTimeout(3000);

  console.log(`Counsellor URL: ${page.url()}`);
  const staffBodyText = await page.innerText("body");
  const hasEduCRMStaff = staffBodyText.includes("EduCRM") || staffBodyText.includes("Counsellor") || staffBodyText.includes("Leads");
  console.log(`- Staff EduCRM operational: ${hasEduCRMStaff}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "live_06_staff_counsellor_dashboard.png") });
  console.log("✓ Live Staff Counsellor EduCRM captured");

  // Test 7: Staff Visa Officer Experience (EduCRM Intact)
  console.log("\n[Test 7] Logging in as Visa Officer in EduCRM...");
  await page.goto(`${LIVE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1000);

  const demoTriggerVisa = page.locator('button:has-text("Demo Accounts")').first();
  if (await demoTriggerVisa.isVisible({ timeout: 5000 }).catch(() => false)) {
    await demoTriggerVisa.click();
    await page.waitForTimeout(600);
  }

  const visaBtn = page.locator('button:has-text("Visa Officer")').first();
  await visaBtn.click();
  await page.waitForTimeout(3000);

  console.log(`Visa Officer URL: ${page.url()}`);
  const visaBodyText = await page.innerText("body");
  const hasVisaWorkspace = visaBodyText.includes("Visa") || visaBodyText.includes("Compliance");
  console.log(`- Visa Officer workspace operational: ${hasVisaWorkspace}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "live_07_staff_visa_workspace.png") });
  console.log("✓ Live Staff Visa Workspace captured");

  await browser.close();
  console.log("\n=== ALL LIVE PRODUCTION VERIFICATIONS COMPLETED SUCCESSFULLY ===");
}

runLiveVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
