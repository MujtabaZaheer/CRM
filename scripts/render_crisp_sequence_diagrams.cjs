const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'diagrams_png');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const diagrams = {
  "SSD_System_Sequence_Diagram": {
    title: "System Sequence Diagram (SSD) — High-Level Enterprise Flow",
    mermaid: `sequenceDiagram
    autonumber
    actor Lead as Student / Lead
    actor Agent as External Agent
    actor Counsellor as Education Counsellor
    actor Admissions as Admissions Officer
    actor Admin as Super Admin / Org Admin
    participant System as EduCRM Platform Boundary
    participant Drive as Google Drive Storage API
    participant Gemini as Google Gemini 2.0 AI API

    rect rgb(240, 244, 252)
    note over Lead,System: Stage 1: Ingestion & Registration
    Lead->>System: Submit Web Form / Register Account
    System-->>Lead: Send Confirmation & Provision Portal Access
    Agent->>System: Register Referral Lead (Student Info + Ref Code)
    System-->>Agent: Generate Referral Code & Commission Ledger Entry
    end

    rect rgb(240, 250, 244)
    note over Counsellor,Gemini: Stage 2: AI Counselling & Eligibility
    Counsellor->>System: Run AI Course Recommendation Query
    System->>Gemini: POST Criteria (GPA, IELTS, Budget, Country)
    Gemini-->>System: Return Ranked Programmes & Rationale
    System-->>Counsellor: Display Ranked Course Matches
    Counsellor->>System: Request AI Personal Statement (SOP)
    System->>Gemini: POST Prompt (Academic Background, Ambitions)
    Gemini-->>System: Return Formatted SOP Text
    System-->>Counsellor: Display SOP Draft with Copy Action
    end

    rect rgb(253, 242, 248)
    note over Lead,Drive: Stage 3: Document Upload & Vision OCR
    Lead->>System: Upload Passport / Transcript File
    System->>Drive: POST Base64 File to Apps Script Endpoint
    Drive-->>System: Save File in Drive & Return Download URL
    System->>Gemini: POST Document Image for Vision OCR
    Gemini-->>System: Return Parsed Profile Data (Name, DOB, GPA)
    System-->>Counsellor: Pre-populate Profile & Save Metadata
    end

    rect rgb(255, 247, 237)
    note over Admissions,System: Stage 4: Application Processing
    Admissions->>System: Review Dossier & Verify Checklist Files
    Admissions->>System: Issue Conditional / Unconditional Offer
    System-->>Lead: Notify Offer Status in Student Portal
    end

    rect rgb(245, 243, 255)
    note over Admin,System: Stage 5: Financial Ledger & Governance
    Admin->>System: Run Lead Deduplication Scan
    System-->>Admin: Display Duplicates & Execute Merge
    Admin->>System: Request GDPR Right of Access Data Export
    System-->>Admin: Download Structured Student JSON Data Dump
    end`
  },
  "SD1_Authentication_and_Impersonation": {
    title: "SD-1: Multi-Tenant Authentication & Session Impersonation Flow",
    mermaid: `sequenceDiagram
    autonumber
    actor User as User / Admin
    participant UI as Login.tsx / Topbar.tsx
    participant AuthContext as AuthContext.tsx
    participant FirebaseAuth as Firebase Auth SDK
    participant Firestore as Cloud Firestore SDK

    User->>UI: Select Role or Enter Email & Password
    UI->>AuthContext: login(email, password) / demoLogin(role)
    AuthContext->>FirebaseAuth: signInWithEmailAndPassword(auth, email, password)
    FirebaseAuth-->>AuthContext: Return UserCredential (uid, token)
    AuthContext->>Firestore: getDoc(doc(db, "users", uid))
    Firestore-->>AuthContext: Return User Profile (role, permissions, tenantId)
    AuthContext-->>UI: Update appUser State & Set Session Token
    UI-->>User: Navigate to Role-Scoped Dashboard

    rect rgb(240, 244, 252)
    note over User,Firestore: Administrative Impersonation Flow
    User->>UI: Select User & Click "Impersonate User"
    UI->>AuthContext: startImpersonation(targetUserUid)
    AuthContext->>Firestore: addDoc("audit_logs", { action: "USER_IMPERSONATED", adminUid, targetUid })
    AuthContext-->>UI: Swap appUser context to Target User
    UI-->>User: Display Impersonation Notice Banner
    end`
  },
  "SD2_Lead_Lifecycle_and_Deduplication": {
    title: "SD-2: Automated Lead Lifecycle, Deduplication & Routing Flow",
    mermaid: `sequenceDiagram
    autonumber
    actor Counsellor as Counsellor / Admin
    participant UI as Leads.tsx
    participant DedupEngine as dataQuality.ts
    participant Firestore as Cloud Firestore SDK

    Counsellor->>UI: Submit "Add New Lead" Form
    UI->>Firestore: addDoc("leads", scopeDocumentWithTenant(newLead, appUser))
    Firestore-->>UI: Return leadId
    UI-->>Counsellor: Display Lead in Pipeline

    rect rgb(240, 250, 244)
    note over Counsellor,Firestore: Lead Deduplication Scan Flow
    Counsellor->>UI: Click "Deduplicate" Button
    UI->>Firestore: getDocs(collection(db, "leads"))
    Firestore-->>UI: Return all Lead records
    UI->>DedupEngine: detectDuplicateLeads(leads)
    DedupEngine->>DedupEngine: Match fuzzy email, normalized phone, passport
    DedupEngine-->>UI: Return DuplicateCluster[]
    UI-->>Counsellor: Render Duplicate Clusters Modal
    Counsellor->>UI: Click "Merge into Master"
    UI->>DedupEngine: mergeDuplicateLeads(masterId, duplicateId, mergedData)
    DedupEngine->>Firestore: updateDoc("leads", masterId, { mergedAt })
    DedupEngine->>Firestore: deleteDoc("leads", duplicateId)
    DedupEngine-->>UI: Update Deduplication UI
    end`
  },
  "SD3_Gemini_AI_Counsellor_Suite": {
    title: "SD-3: Google Gemini AI Resume OCR & Counsellor Suite Integration",
    mermaid: `sequenceDiagram
    autonumber
    actor Counsellor as Counsellor / Student
    participant UI as AI Modals (Topbar.tsx)
    participant GeminiClient as geminiClient.ts
    participant GeminiAPI as Google Gemini 2.0 REST API

    rect rgb(240, 244, 252)
    note over UI,GeminiAPI: 1. Course Recommendation Engine
    Counsellor->>UI: Enter GPA, IELTS, Country, Budget
    UI->>GeminiClient: getCourseRecommendations({ gpa, ielts, budget, country })
    GeminiClient->>GeminiAPI: POST Model Endpoint (Structured Prompt)
    GeminiAPI-->>GeminiClient: Return JSON [{ universityName, matchScore, reasoning }]
    GeminiClient-->>UI: Render Ranked Course Cards
    end

    rect rgb(253, 242, 248)
    note over UI,GeminiAPI: 2. AI SOP & Personal Statement Drafter
    Counsellor->>UI: Submit Target Programme & Career Ambitions
    UI->>GeminiClient: generatePersonalStatement({ studentName, targetUni, goals })
    GeminiClient->>GeminiAPI: POST Prompt for Structured 500-word SOP
    GeminiAPI-->>GeminiClient: Return JSON { title, statementContent, wordCount }
    GeminiClient-->>UI: Display SOP Draft with Copy Action
    end

    rect rgb(255, 247, 237)
    note over UI,GeminiAPI: 3. AI Application Readiness Auditor
    Counsellor->>UI: Select Uploaded Checklist Status
    UI->>GeminiClient: auditApplicationReadiness({ studentName, checklist })
    GeminiClient->>GeminiAPI: POST Prompt for Completeness & Risk Analysis
    GeminiAPI-->>GeminiClient: Return JSON { readinessScore, missingRequirements, recommendations }
    GeminiClient-->>UI: Display Readiness Gauge (0-100%) & Checklist
    end`
  },
  "SD4_Zero_Cost_Google_Drive_Upload": {
    title: "SD-4: Zero-Cost Cloud Storage & Document Ingestion Flow",
    mermaid: `sequenceDiagram
    autonumber
    actor Student as Student / Counsellor
    participant UI as Documents.tsx
    participant DocStorage as documentStorage.ts
    participant AppsScript as Google Apps Script Endpoint
    participant GoogleDrive as Google Drive Storage
    participant Firestore as Cloud Firestore SDK

    Student->>UI: Select File & Document Type (Passport / Transcript)
    UI->>DocStorage: uploadStudentDocument(studentId, file)
    DocStorage->>DocStorage: validateDocumentFile(file) (Format & Size <= 15MB)
    DocStorage->>DocStorage: fileToBase64(file)
    DocStorage->>AppsScript: POST Storage Endpoint { fileName, fileBase64, mimeType, studentId }
    AppsScript->>GoogleDrive: DriveApp.createFolder(studentId).createFile(blob)
    GoogleDrive-->>AppsScript: Return fileId & Direct View URL
    AppsScript-->>DocStorage: Return { success: true, fileUrl, viewUrl, filePath }
    DocStorage-->>UI: Return Upload Result
    UI->>Firestore: addDoc("student_documents", { studentId, fileUrl, status: "Received" })
    UI->>Firestore: addDoc("audit_logs", { action: "DOCUMENT_UPLOADED" })
    UI-->>Student: Display Document Status Badge ("Received")`
  },
  "SD5_Application_Pipeline_and_Admissions": {
    title: "SD-5: University Application Processing & Admissions Desk Flow",
    mermaid: `sequenceDiagram
    autonumber
    actor Admissions as Admissions Officer / Counsellor
    participant UI as Applications.tsx
    participant Firestore as Cloud Firestore SDK

    Admissions->>UI: Select Student & Target Programme
    UI->>Firestore: addDoc("applications", { applicationNumber: "APP-2026-XXXX", stage: "Draft" })
    Firestore-->>UI: Return applicationDocId

    Admissions->>UI: Progress Stage to "Documents Pending"
    UI->>Firestore: updateDoc("applications", id, { stage: "Documents Pending" })
    Firestore-->>UI: Trigger Document Checklist Requirement

    Admissions->>UI: Upload Offer Letter & Update Stage to "Conditional Offer"
    UI->>Firestore: updateDoc("applications", id, { stage: "Conditional Offer", offerLetterUrl })
    UI->>Firestore: addDoc("notifications", { recipient: studentEmail, title: "Offer Issued" })
    UI->>Firestore: addDoc("audit_logs", { action: "APPLICATION_STAGE_UPDATED" })
    UI-->>Admissions: Lock Submission Fields & Notify Student`
  },
  "SD6_Agent_Network_and_Commissions": {
    title: "SD-6: External Agent Referral Lifecycle & Commission Calculation",
    mermaid: `sequenceDiagram
    autonumber
    actor Agent as External Recruitment Agent
    actor Admin as Office Manager / Org Admin
    participant UI as Agents.tsx / Register.tsx
    participant Firestore as Cloud Firestore SDK

    Admin->>UI: Onboard New External Agency
    UI->>Firestore: addDoc("agents", { agencyName, referralCode: "REF-APX-4821", status: "Active" })
    Firestore-->>UI: Return Agent Record

    Agent->>UI: Share Referral Link (crm.app/register?ref=REF-APX-4821)
    Student->>UI: Register via Referral Link
    UI->>Firestore: addDoc("leads", { source: "Agent", referralCode: "REF-APX-4821" })

    rect rgb(240, 250, 244)
    note over Admin,Firestore: Commission Calculation & Disbursement
    Admin->>UI: Mark Student Application as "Enrolled"
    UI->>Firestore: addDoc("commissions", { agentName, studentName, amount: 1500, status: "Pending" })
    Admin->>UI: Approve Commission Payout
    UI->>Firestore: updateDoc("commissions", id, { status: "Paid", paidAt: Date.now() })
    UI->>Firestore: updateDoc("agents", agentId, { totalCommissionPaidUSD: total + 1500 })
    UI-->>Admin: Display Updated Agent Ledger
    end`
  }
};

async function renderAll() {
  const browser = await chromium.launch({ headless: true });
  
  for (const [key, item] of Object.entries(diagrams)) {
    const context = await browser.newContext({
      deviceScaleFactor: 2.0, // High DPI for crisp vector rendering!
      viewport: { width: 1400, height: 1200 }
    });
    const page = await context.newPage();

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      display: inline-block;
    }
    #wrapper {
      display: inline-block;
      padding: 16px 20px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
    }
    .header {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0284c7;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mermaid {
      background: #ffffff;
      display: flex;
      justify-content: center;
    }
    .mermaid svg {
      font-family: 'Inter', sans-serif !important;
    }
    /* Enhance actor and text sharpness */
    text.actor > tspan {
      font-weight: 600 !important;
      font-size: 13px !important;
    }
    .messageText {
      font-size: 12.5px !important;
      font-weight: 500 !important;
    }
  </style>
</head>
<body>
  <div id="wrapper">
    <div class="header">
      <span>📐 ${item.title}</span>
    </div>
    <div class="mermaid">
${item.mermaid}
    </div>
  </div>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      themeVariables: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        primaryColor: '#eff6ff',
        primaryBorderColor: '#3b82f6',
        primaryTextColor: '#1e3a8a',
        lineColor: '#334155',
        actorBorder: '#2563eb',
        actorBkg: '#f0f9ff',
        actorTextColor: '#0f172a',
        signalColor: '#0f172a',
        signalTextColor: '#0f172a',
        noteBkgColor: '#fef3c7',
        noteBorderColor: '#d97706',
        noteTextColor: '#92400e',
        rectBorderColor: '#94a3b8',
        rectBkgColor: '#f8fafc'
      },
      sequence: {
        actorMargin: 50,
        width: 150,
        height: 48,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 32,
        mirrorActors: false
      }
    });
  </script>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle' });
    // Wait for mermaid SVG render
    await page.waitForSelector('.mermaid svg');
    // Allow any fonts or icons to finish layout
    await page.waitForTimeout(1000);

    const wrapper = await page.$('#wrapper');
    const outPng = path.join(outputDir, `${key}.png`);
    await wrapper.screenshot({ path: outPng });
    console.log(`Saved ultra-crisp diagram: ${outPng}`);
    await context.close();
  }

  await browser.close();
  console.log('Finished rendering all sequence diagrams!');
}

renderAll().catch(err => {
  console.error('Error rendering diagrams:', err);
  process.exit(1);
});
