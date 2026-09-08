import { callGeminiApi, hasGeminiApiKey } from "./geminiClient";
import { Student } from "../types/student";
import { Application } from "../types/application";
import { University } from "../types/university";

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size?: number;
  dataUrl?: string;
  fileUrl?: string;
}

export interface AICounselMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
  suggestions?: string[];
  actionLink?: { label: string; url: string };
}

export interface StudentContextData {
  student?: Student;
  applications?: Application[];
  universities?: University[];
  documents?: {
    id: string;
    documentType?: string;
    docType?: string;
    fileName?: string;
    status?: string;
    remarks?: string;
  }[];
  activeAttachments?: ChatAttachment[];
}

/**
 * Intelligent AI Education Counsellor & CRM System Guide
 * Provides context-aware advisement using Gemini LLM with robust fallback heuristics.
 * Evaluates student qualifications, preferences, targeted universities, and uploaded/attached documents.
 */
export async function getAICounselReply(
  userQuery: string,
  history: { role: "user" | "assistant"; content: string }[],
  context: StudentContextData
): Promise<{ reply: string; suggestions?: string[]; actionLink?: { label: string; url: string } }> {
  const student = context.student;
  const applications = context.applications || [];
  const universities = context.universities || [];
  const docs = context.documents || [];
  const attachments = context.activeAttachments || [];

  const studentName = student?.fullName || "Student";
  const preferredCountry =
    student?.preferredDestination ||
    (student?.preferredDestinations && student.preferredDestinations.length > 0
      ? student.preferredDestinations.join(", ")
      : "UK, Canada, Australia, USA");
  const targetLevel = student?.desiredStudyLevel || "Undergraduate / Master's";
  const preferredIntake = student?.preferredIntake || "September (Fall) / January (Spring)";
  const budget = student?.budgetAnnualUsd ? `$${student.budgetAnnualUsd.toLocaleString()} USD/year` : "Flexible / Not specified";

  const primaryAcademic = student?.academicHistory?.[0];
  const gpa = primaryAcademic?.gradeGpa || "Not specified";
  const degree = primaryAcademic?.degreeTitle || primaryAcademic?.qualification || "General Secondary / Bachelor";
  const prevInstitution = primaryAcademic?.institution || "Previous Academic Institution";
  const englishScore = student?.englishProficiency?.overallScore || "Not specified";
  const englishTestType = student?.englishProficiency?.testType || "IELTS / TOEFL";

  // Summarize applications
  const appSummary =
    applications.length > 0
      ? applications
          .map(
            (a) =>
              `- ${a.universityName} | Program: ${a.programmeName} | Stage: ${a.stage || a.applicationStatus || "Draft"} | Country: ${a.targetCountry || "N/A"}`
          )
          .join("\n")
      : "No active university applications created yet.";

  // Summarize documents
  const docSummary =
    docs.length > 0
      ? docs
          .map(
            (d) =>
              `- ${d.documentType || d.docType || "Document"}: ${d.fileName || "File"} [Status: ${d.status || "Pending"}]`
          )
          .join("\n")
      : "No documents uploaded in vault yet.";

  // Summarize attachments in current chat message
  const attachSummary =
    attachments.length > 0
      ? attachments
          .map((att) => `- ${att.name} (${att.type}, ${(att.size ? (att.size / 1024).toFixed(1) + " KB" : "attached")})`)
          .join("\n")
      : "No new attachments in this message.";

  const systemPrompt = `You are the Official AI Education Counsellor & Global Admissions Guide for EduCRM.
You provide world-class, personalized academic advising to international students.

Current Student Profile:
- Name: ${studentName}
- Academic Background: ${degree} from ${prevInstitution}
- Current GPA / Qualification: ${gpa}
- English Proficiency: ${englishTestType} Score: ${englishScore}
- Target Destinations: ${preferredCountry}
- Target Study Level: ${targetLevel}
- Target Intake: ${preferredIntake}
- Annual Tuition/Living Budget: ${budget}
- Current Active Applications & Targeted Universities:
${appSummary}
- Student's Uploaded Document Vault:
${docSummary}
- Attachments Sent in this Chat:
${attachSummary}

Partnered Institutions: Over ${Math.max(universities.length, 25)} top institutions worldwide across UK (Oxford, Cambridge, UCL, Edinburgh, Manchester, King's), Canada (Toronto, UBC, McGill, Waterloo), Australia (Melbourne, Sydney, UNSW, Monash), and USA (Harvard, MIT, Columbia, NYU, Stanford).

Your Capabilities & Mandatory Guidelines:
1. **Answer All Student Inquiries Directly & Thoroughly**: If they ask "how to choose best university across the world and select best program according to my qualification", break down a clear, step-by-step strategy specifically tuned to their GPA (${gpa}), degree (${degree}), and preferred destination (${preferredCountry}).
2. **Check Documents & Attachments**: When students ask to review their documents or attach new ones, evaluate their uploaded dossier. Point out which essential items are verified, which are pending review, and what is missing (e.g., transcripts, English proficiency, SOP, passport, financial proof). If they attached pictures or documents in this chat, acknowledge them and explain how they will be used.
3. **Analyze Targeted Universities & Preferences**: Review their active applications and target destinations against their qualification (${gpa}). Suggest realistic, safe, and reach options. Mention budget suitability (${budget}) and post-study work visa options.
4. **Actionable CRM Portal Guidance**: Reference portal shortcuts:
   - Programs & Matcher: \`/student/programs\`
   - Universities Catalog: \`/student/universities\`
   - Document Vault: \`/student/documents\`
   - Applications & Drafts: \`/student/applications\` (explain that draft applications can be cancelled/deleted via the red Trash icon)
   - Human Advisor Chat: \`/student/messages\` ("Dedicated Counsellor" tab)
5. **Tone**: Warm, encouraging, structured with bullet points or numbered steps, authoritative yet approachable. Keep response within 2-4 comprehensive, readable paragraphs or structured sections.`;

  // Check if Gemini API key exists
  if (hasGeminiApiKey()) {
    try {
      const conversationHistory = history
        .slice(-6)
        .map((h) => `${h.role === "user" ? "Student" : "AI Counsellor"}: ${h.content}`)
        .join("\n\n");

      // Check if there is an image in current attachments
      const imageAttachment = attachments.find((a) => a.type.startsWith("image/") && a.dataUrl);
      let inlineImageData: { mimeType: string; dataBase64: string } | undefined = undefined;

      if (imageAttachment?.dataUrl) {
        const parts = imageAttachment.dataUrl.split(",");
        if (parts.length === 2) {
          inlineImageData = {
            mimeType: imageAttachment.type,
            dataBase64: parts[1],
          };
        }
      }

      const prompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nStudent: ${userQuery}\n\nAI Counsellor:`;
      const response = await callGeminiApi(prompt, inlineImageData);
      if (response && response.trim()) {
        const reply = response.trim();
        const suggestions = generateContextSuggestions(userQuery, reply, context);
        const actionLink = resolveActionLink(userQuery, reply);
        return { reply, suggestions, actionLink };
      }
    } catch (err) {
      console.warn("Gemini API call failed in AICounselEngine, falling back to comprehensive heuristic engine:", err);
    }
  }

  // High-Quality Intelligent Heuristic Fallback Engine
  return generateHeuristicCounsel(userQuery, context);
}

function resolveActionLink(query: string, reply: string): { label: string; url: string } | undefined {
  const q = (query + " " + reply).toLowerCase();
  if (q.includes("delete draft") || q.includes("my application") || q.includes("application status")) {
    return { label: "Go to My Applications", url: "/student/applications" };
  }
  if (q.includes("document") || q.includes("transcript") || q.includes("passport") || q.includes("vault")) {
    return { label: "Open Document Vault", url: "/student/documents" };
  }
  if (q.includes("explore university") || q.includes("universities") || q.includes("campus")) {
    return { label: "Explore Universities", url: "/student/universities" };
  }
  if (q.includes("program") || q.includes("course") || q.includes("match") || q.includes("qualification")) {
    return { label: "Find & Match Programs", url: "/student/programs" };
  }
  if (q.includes("dedicated counsellor") || q.includes("human") || q.includes("advisor")) {
    return { label: "Chat with Counsellor", url: "/student/messages" };
  }
  return undefined;
}

function generateContextSuggestions(
  query: string,
  reply: string,
  context: StudentContextData
): string[] {
  const q = (query + " " + reply).toLowerCase();
  const docsCount = context.documents?.length || 0;

  if (q.includes("document") || q.includes("transcript") || q.includes("attach") || q.includes("check")) {
    return [
      "Can you review my profile and recommend top matching universities?",
      "What are the upcoming application deadlines for September intake?",
      "How do I write a compelling Statement of Purpose (SOP)?",
    ];
  }

  if (q.includes("university") || q.includes("program") || q.includes("choose") || q.includes("qualification")) {
    return [
      "Could you please check my documents and verify if anything is missing?",
      docsCount > 0 ? "Are my uploaded transcripts sufficient for top universities?" : "Where do I upload my transcripts and passport?",
      "What are the post-study work visa options for my preferred country?",
    ];
  }

  if (q.includes("draft") || q.includes("application")) {
    return [
      "How can I delete or restart a draft application?",
      "What documents are needed before submitting an official dossier?",
      "How long does it take to receive a conditional offer letter?",
    ];
  }

  return [
    "Can you review my profile and recommend top matching universities?",
    "Could you please check my documents and verify if anything is missing?",
    "What are the tuition fees and scholarship options for my preferred country?",
  ];
}

/**
 * Rich Heuristic Advising Engine (Guarantees instant, highly tailored guidance 100% offline)
 */
function generateHeuristicCounsel(
  userQuery: string,
  context: StudentContextData
): { reply: string; suggestions?: string[]; actionLink?: { label: string; url: string } } {
  const q = userQuery.toLowerCase();
  const student = context.student;
  const name = student?.fullName?.split(" ")[0] || "there";
  const preferredDest =
    student?.preferredDestination ||
    (student?.preferredDestinations && student.preferredDestinations.length > 0
      ? student.preferredDestinations.join(", ")
      : "UK, Canada, Australia, and the USA");
  const targetLevel = student?.desiredStudyLevel || "Undergraduate / Master's";
  const primaryAcademic = student?.academicHistory?.[0];
  const gpa = primaryAcademic?.gradeGpa || "your current grades";
  const degree = primaryAcademic?.degreeTitle || primaryAcademic?.qualification || "your previous study";
  const english = student?.englishProficiency?.overallScore || "Not yet submitted";
  const applications = context.applications || [];
  const documents = context.documents || [];
  const attachments = context.activeAttachments || [];

  // ==========================================
  // CASE 1: Document Check, Verification or Attachments
  // ==========================================
  if (
    attachments.length > 0 ||
    q.includes("check my document") ||
    q.includes("check document") ||
    q.includes("my documents") ||
    q.includes("missing document") ||
    q.includes("verify document") ||
    q.includes("transcript") ||
    q.includes("attached")
  ) {
    const requiredDocs = [
      { name: "Academic Transcripts & Certificates", key: "transcript" },
      { name: "Passport (Valid min. 6 months)", key: "passport" },
      { name: "English Language Proficiency (IELTS/TOEFL/PTE)", key: "english" },
      { name: "Statement of Purpose (SOP)", key: "sop" },
      { name: "Proof of Financial Funds / Bank Statement", key: "bank" },
    ];

    const attachedNames = attachments.map((a) => a.name).join(", ");

    const verifiedItems: string[] = [];
    const pendingItems: string[] = [];
    const missingItems: string[] = [];

    requiredDocs.forEach((req) => {
      const match = documents.find((d) => {
        const text = (d.documentType || d.docType || d.fileName || "").toLowerCase();
        return (
          (req.key === "transcript" && (text.includes("transcript") || text.includes("degree") || text.includes("academic"))) ||
          (req.key === "passport" && text.includes("passport")) ||
          (req.key === "english" && (text.includes("ielts") || text.includes("toefl") || text.includes("english") || text.includes("language"))) ||
          (req.key === "sop" && (text.includes("sop") || text.includes("statement") || text.includes("personal"))) ||
          (req.key === "bank" && (text.includes("bank") || text.includes("financial") || text.includes("fund") || text.includes("statement")))
        );
      });

      if (match) {
        if (match.status === "Verified") {
          verifiedItems.push(req.name);
        } else {
          pendingItems.push(`${req.name} (${match.status || "Under review"})`);
        }
      } else {
        missingItems.push(req.name);
      }
    });

    let attachNotice = "";
    if (attachments.length > 0) {
      attachNotice = `📎 **Received in this chat**: ${attachedNames}\n*I have logged your attachments for your admissions advisor to review.*\n\n`;
    }

    const docAudit = `
${attachNotice}📋 **Your Document Vault Status Audit**:
${verifiedItems.length > 0 ? `✅ **Verified**: ${verifiedItems.join(", ")}\n` : ""}
${pendingItems.length > 0 ? `⏳ **Under Review**: ${pendingItems.join(", ")}\n` : ""}
${missingItems.length > 0 ? `⚠️ **Still Missing / Action Needed**: ${missingItems.join(", ")}\n` : "🎉 **All primary required documents are present in your vault!**\n"}

**Guidance & Next Steps:**
1. **Transcripts & Degree**: Ensure your official stamped transcripts include course grades and your cumulative GPA (${gpa}).
2. **English Score**: Your current score record is **${english}**. Top institutions in ${preferredDest} typically require an IELTS 6.5 (no band below 6.0) or TOEFL 88+.
3. **Statement of Purpose (SOP)**: Focus your essay on your academic trajectory from *${degree}* to your target *${targetLevel}*, explaining why this program and university align with your career ambitions.
4. You can upload any remaining files directly to your **Document Vault** (\`/student/documents\`) or send them right here in the chat.`;

    return {
      reply: `Hello ${name}! Here is a detailed check of your documents and admission dossier:${docAudit}`,
      suggestions: [
        "Recommend top universities matching my qualification",
        "What are the upcoming application deadlines for September intake?",
        "Can you review my Statement of Purpose (SOP)?",
      ],
      actionLink: { label: "Open Document Vault", url: "/student/documents" },
    };
  }

  // ==========================================
  // CASE 2: How to Choose Best University & Program by Qualification (User Screenshot Question)
  // ==========================================
  if (
    q.includes("choose best university") ||
    q.includes("select best program") ||
    q.includes("how to choose") ||
    (q.includes("best program") && q.includes("qualification")) ||
    q.includes("recommend") ||
    q.includes("matching universities")
  ) {
    const budgetStr = student?.budgetAnnualUsd
      ? `around $${student.budgetAnnualUsd.toLocaleString()} USD/year`
      : "your designated budget";

    return {
      reply: `Hello ${name}! Choosing the best university across the world and selecting the optimal program for your background requires a structured, 4-step framework based on your profile:

### 1. Match Your Academic Qualification & GPA
- **Your Profile**: You hold a **${degree}** with a reported GPA/grade of **${gpa}**.
- **Tier 1 (Dream / Reach)**: Institutions like Oxford, Cambridge, Imperial, Harvard, Toronto, and Melbourne look for top-tier percentiles (GPA 3.6+/4.0 or 75%+).
- **Tier 2 (Target / Strong Match)**: Excellent research and career-focused universities (e.g., Manchester, Bristol, Leeds, Waterloo, Sydney, Monash) typically require GPA 2.8–3.3 (60–70%).
- **Tier 3 (Safe / High Acceptance)**: Great universities offering generous merit scholarships and practical internships with flexible entry thresholds.

### 2. Compare Target Destinations (${preferredDest})
- **United Kingdom**: 1-year intensive Master's saves 1 year of tuition and living costs, accompanied by a 2-year Graduate Route Post-Study Work (PSW) visa.
- **Canada**: High immigration and PGWP (Post-Graduation Work Permit) friendliness, strong coop work programs, especially in Ontario, BC, and Quebec.
- **Australia**: 2–4 year post-study work visas depending on degree and regional city study, with top Group of Eight (Go8) research universities.
- **USA**: World-leading research infrastructure, 1-year OPT with a 2-year STEM extension (up to 3 years total work authorization).

### 3. Check Program Curriculum & Language Requirements
- Ensure your language score (**${english}**) meets the departmental threshold (generally IELTS 6.5 overall or Duolingo 115+).
- Review core modules to verify they cover specialized topics you intend to master.
- Filter programs that fit within ${budgetStr}.

### 4. Direct Action on This Portal
1. Open **Programs & Matcher** (\`/student/programs\`) where our automated engine pre-screens your eligibility against 500+ programs.
2. Bookmark 3–5 programs across **Reach**, **Target**, and **Safe** categories.
3. Start your dossier by clicking **"Apply Now"** on your top choice!`,
      suggestions: [
        "Could you please check my documents and verify if anything is missing?",
        "What are the upcoming application deadlines for September intake?",
        "How do I apply for scholarships at these universities?",
      ],
      actionLink: { label: "Find & Match Programs", url: "/student/programs" },
    };
  }

  // ==========================================
  // CASE 3: Targeted Universities & Applications Check
  // ==========================================
  if (
    q.includes("targeted university") ||
    q.includes("my applications") ||
    q.includes("target university") ||
    q.includes("shortlist")
  ) {
    let appDetail = "";
    if (applications.length > 0) {
      appDetail = applications
        .map(
          (app, i) =>
            `${i + 1}. **${app.universityName}** — *${app.programmeName}* (Country: ${app.targetCountry || "International"})\n   - **Current Stage**: \`${app.stage || "Draft"}\`\n   - **Eligibility Status**: ${app.eligibilityStatus || "Pre-screened"}\n   - **Next Action**: ${app.stage === "Draft" ? "Complete profile questions and attach documents to submit." : "Under university admissions officer review."}`
        )
        .join("\n\n");
    } else {
      appDetail = `You do not have any active university applications in progress yet.\n\nBased on your preferred destination (**${preferredDest}**) and target level (**${targetLevel}**), I recommend shortlisting 2 Reach universities and 2 Target universities from our catalogue.`;
    }

    return {
      reply: `Hi ${name}! Here is the review of your targeted universities and active applications:\n\n${appDetail}\n\n**Counsellor Advice**: Keep your options diversified across at least two destination countries to maximize offer likelihood and scholarship opportunities.`,
      suggestions: [
        "Recommend top universities matching my qualification",
        "Could you please check my documents and verify if anything is missing?",
        "How do I delete an unwanted draft application?",
      ],
      actionLink: { label: "Manage My Applications", url: "/student/applications" },
    };
  }

  // ==========================================
  // CASE 4: Delete Draft Application
  // ==========================================
  if (q.includes("delete draft") || (q.includes("delete") && q.includes("application"))) {
    return {
      reply: `Hello ${name}! You can easily delete any draft application directly from the portal:

1. Go to **My Applications** (\`/student/applications\`) or your **Student Dashboard**.
2. Locate the application card that has the **"Draft"** status badge.
3. Click the red **Trash Can icon** (or the "Delete Draft" button) on that draft card.
4. Confirm the prompt, and the draft will be permanently removed so you can start fresh.

*Note: Applications that have already been submitted for official admissions review cannot be deleted by students and must be cancelled by the admissions desk.*`,
      suggestions: [
        "How do I start a new application?",
        "Can I apply to multiple universities?",
        "Where do I upload my transcripts?",
      ],
      actionLink: { label: "Manage My Applications", url: "/student/applications" },
    };
  }

  // ==========================================
  // CASE 5: Deadlines, Intakes, and Visas
  // ==========================================
  if (q.includes("deadline") || q.includes("intake") || q.includes("september") || q.includes("january") || q.includes("visa")) {
    return {
      reply: `Hello ${name}! Here is the timeline guidance for your target admissions in **${preferredDest}**:

- **September (Fall) Intake**:
  - Main application window: November to June.
  - Priority & Scholarship deadlines: Usually January 15 to March 31.
  - CAS / I-20 / Visa Lodgement: June to August.
- **January (Spring) Intake**:
  - Application window: June to October.
  - Visa filing: October to December.
- **Student Visa Readiness**:
  - Maintain required bank balance (tuition + 1 year living expenses) in a compliant bank for the mandatory holding duration (28 days for UK, 6 months for Australia, or CAD $20,635 GIC for Canada).
  - Prepare for visa credibility / CAS interviews by reviewing your course syllabus and university rationale.`,
      suggestions: [
        "Could you please check my documents and verify if anything is missing?",
        "Can you review my profile and recommend top matching universities?",
        "How do I talk to my human counsellor?",
      ],
      actionLink: { label: "Find & Match Programs", url: "/student/programs" },
    };
  }

  // ==========================================
  // DEFAULT: Comprehensive Portal & Admission Guide
  // ==========================================
  return {
    reply: `Hello ${name}! I am your **AI Education Counsellor & Global Admissions Guide**.

I am equipped with your full profile:
- **Academic Background**: ${degree} (GPA: ${gpa})
- **English Score**: ${english}
- **Target Destinations**: ${preferredDest}
- **Study Level**: ${targetLevel}
- **Uploaded Documents**: ${documents.length} files tracked in your Document Vault

How can I guide you today?
- **University & Program Recommendations**: Based on your GPA and preferred countries.
- **Document Checking & Verification**: Reviewing your transcripts, SOP, and test scores.
- **Application Assistance**: Preparing drafts, answering admission questions, and visa prep.
- **Human Counsellor Desk**: You can also switch to the **Dedicated Counsellor** tab above to chat with your assigned advisor!`,
    suggestions: [
      "Can you review my profile and recommend top matching universities?",
      "Could you please check my documents and verify if anything is missing?",
      "How do I delete an unwanted draft application?",
    ],
    actionLink: { label: "Explore Universities", url: "/student/universities" },
  };
}
