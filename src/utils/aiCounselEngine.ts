import { callGeminiApi, hasGeminiApiKey } from "./geminiClient";
import { Student } from "../types/student";
import { Application } from "../types/application";
import { University } from "../types/university";

export interface AICounselMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: number;
  suggestions?: string[];
  actionLink?: { label: string; url: string };
}

export interface StudentContextData {
  student?: Student;
  applications?: Application[];
  universities?: University[];
}

/**
 * Intelligent AI Education Counsellor & CRM System Guide
 * Provides context-aware advisement using Gemini LLM with robust fallback heuristics.
 */
export async function getAICounselReply(
  userQuery: string,
  history: { role: "user" | "assistant"; content: string }[],
  context: StudentContextData
): Promise<{ reply: string; suggestions?: string[]; actionLink?: { label: string; url: string } }> {
  const student = context.student;
  const applications = context.applications || [];
  const universities = context.universities || [];

  const studentName = student?.fullName || "Student";
  const preferredCountry = student?.preferredDestination || student?.preferredDestinations?.join(", ") || "UK, USA, Canada, Australia";
  const targetLevel = student?.desiredStudyLevel || "Undergraduate / Postgraduate";
  const gpa = student?.academicHistory?.[0]?.gradeGpa || "Not specified";
  const english = student?.englishProficiency?.overallScore || "Not specified";

  const appSummary = applications.length > 0
    ? applications.map((a) => `${a.universityName} (${a.programmeName}, Stage: ${a.stage})`).join("; ")
    : "No applications started yet";

  const systemPrompt = `You are the Official AI Education Counsellor & Portal Guide for EduCRM.
You assist international students with:
1. University and program selection according to their qualifications and target destinations.
2. System navigation in this CRM (how to find universities at /student/universities, match programs at /student/programs, track applications at /student/applications, upload documents at /student/documents, manage drafts, and chat with human counsellors at /student/messages).
3. Document compliance (transcripts, IELTS/TOEFL scores, SOP, passport validity).
4. Admissions steps, offer confirmation, CAS issuance, and student visa guidance.

Current Student Profile:
- Name: ${studentName}
- Target Destinations: ${preferredCountry}
- Target Level: ${targetLevel}
- GPA / Qualifications: ${gpa}
- English Score: ${english}
- Active Applications: ${appSummary}
- Partnered Universities available: ${universities.length} institutions (including Oxford, Cambridge, Harvard, MIT, Toronto, Melbourne, Edinburgh, UCL, etc.)

Instructions:
- Be warm, encouraging, highly professional, and concise (2-4 paragraphs max).
- Provide practical advice and suggest exact next steps or portal sections.
- If they ask how to delete a draft application, explain they can delete drafts directly from the "My Applications" page (/student/applications) or on the Student Dashboard by clicking the red Trash icon on any draft application card.
- If they ask about human counsellors, explain they can chat directly with their assigned advisor in the "Counsellor Advisory Desk" tab.`;

  if (hasGeminiApiKey()) {
    try {
      const conversationHistory = history
        .slice(-6)
        .map((h) => `${h.role === "user" ? "Student" : "AI Counsellor"}: ${h.content}`)
        .join("\n\n");

      const prompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nStudent: ${userQuery}\n\nAI Counsellor:`;
      const response = await callGeminiApi(prompt);
      if (response && response.trim()) {
        const reply = response.trim();
        // Generate helpful contextual suggestions
        const suggestions = generateContextSuggestions(userQuery, reply);
        const actionLink = resolveActionLink(userQuery, reply);
        return { reply, suggestions, actionLink };
      }
    } catch (err) {
      console.warn("Gemini API call failed in AICounselEngine, falling back to heuristic engine:", err);
    }
  }

  // High-Quality Heuristic Fallback Engine
  return generateHeuristicCounsel(userQuery, context);
}

function resolveActionLink(query: string, reply: string): { label: string; url: string } | undefined {
  const q = (query + " " + reply).toLowerCase();
  if (q.includes("delete draft") || q.includes("my application") || q.includes("application status")) {
    return { label: "Go to My Applications", url: "/student/applications" };
  }
  if (q.includes("explore university") || q.includes("universities") || q.includes("campus")) {
    return { label: "Explore Universities", url: "/student/universities" };
  }
  if (q.includes("program") || q.includes("course") || q.includes("eligibility") || q.includes("matcher")) {
    return { label: "Find & Match Programs", url: "/student/programs" };
  }
  if (q.includes("document") || q.includes("transcript") || q.includes("passport") || q.includes("upload")) {
    return { label: "Open Document Vault", url: "/student/documents" };
  }
  if (q.includes("counsellor") || q.includes("human") || q.includes("advisor") || q.includes("staff")) {
    return { label: "Chat with Counsellor", url: "/student/messages" };
  }
  return undefined;
}

function generateContextSuggestions(query: string, reply: string): string[] {
  const q = (query + " " + reply).toLowerCase();
  if (q.includes("university") || q.includes("program")) {
    return [
      "Which universities match my GPA and budget?",
      "How do I apply for a scholarship?",
      "What are the English test score requirements?"
    ];
  }
  if (q.includes("draft") || q.includes("application")) {
    return [
      "How can I delete or restart a draft application?",
      "What documents are needed before submitting?",
      "How long does it take to receive an offer letter?"
    ];
  }
  return [
    "Recommend the best universities for my profile",
    "How does the admissions workflow work?",
    "Can you check if my documents are ready for submission?"
  ];
}

function generateHeuristicCounsel(
  userQuery: string,
  context: StudentContextData
): { reply: string; suggestions?: string[]; actionLink?: { label: string; url: string } } {
  const q = userQuery.toLowerCase();
  const student = context.student;
  const name = student?.fullName?.split(" ")[0] || "there";

  // 1. Delete draft application query
  if (q.includes("delete draft") || (q.includes("delete") && q.includes("application"))) {
    return {
      reply: `Hello ${name}! You can easily delete any draft application directly from the portal:\n\n1. Go to **My Applications** (\`/student/applications\`) or your **Student Dashboard**.\n2. Locate the application card that has the **"Draft"** status badge.\n3. Click the red **Trash Can icon** (or the "Delete Draft" button) on that draft.\n4. Confirm the prompt, and the draft will be permanently removed so you can start fresh.\n\n*Note: Applications that have already been submitted for official admissions review cannot be deleted by students and must be cancelled by the admissions desk.*`,
      suggestions: [
        "How do I start a new application?",
        "Can I apply to multiple universities?",
        "Where do I upload my transcripts?"
      ],
      actionLink: { label: "Manage My Applications", url: "/student/applications" }
    };
  }

  // 2. University / Program recommendation query
  if (q.includes("recommend") || q.includes("choose") || q.includes("university") || q.includes("program") || q.includes("course") || q.includes("best")) {
    const dest = student?.preferredDestination || "the UK, Canada, Australia, or the USA";
    return {
      reply: `Hi ${name}! To select the best university and program based on your qualification:\n\n1. **Explore Partner Universities**: Head over to **Programs** (\`/student/programs\`) where our live matching engine ranks institutions based on your GPA, study level, and target destination (${dest}).\n2. **Verify Entry Requirements**: Check minimum IELTS/TOEFL scores and GPA thresholds on each program card. Our system flags whether you are "Meets requirements", "Needs review", or "Needs improvement".\n3. **Tuition & Intakes**: Filter by maximum tuition fee budget and choose between Fall (September) or Spring (January) intakes.\n4. **Direct Application**: Once you find a suitable match, click **"Apply Now"** to start your official dossier.`,
      suggestions: [
        "What are the upcoming application deadlines?",
        "How do I write an effective Statement of Purpose (SOP)?",
        "How do I delete an unwanted draft application?"
      ],
      actionLink: { label: "Find & Match Programs", url: "/student/programs" }
    };
  }

  // 3. Document or Visa guidance
  if (q.includes("document") || q.includes("transcript") || q.includes("visa") || q.includes("sop") || q.includes("ielts")) {
    return {
      reply: `Here is what you need for your university and visa dossier:\n\n- **Academic Documents**: Official high school or bachelor's transcripts and graduation certificates.\n- **Language Proficiency**: Standard test report (IELTS 6.0–7.0, TOEFL 80–100, or Duolingo 110–125 depending on level).\n- **Identity & Financials**: Clear passport copy with at least 6 months validity and bank statements demonstrating tuition + living costs.\n- **Statement of Purpose (SOP)**: A clear 500–800 word essay detailing your academic rationale and career ambitions.\n\nYou can upload and manage these anytime in your **Document Vault** (\`/student/documents\`).`,
      suggestions: [
        "Can you review my profile?",
        "How do I talk to my human counsellor?",
        "What happens after I receive an offer?"
      ],
      actionLink: { label: "Open Document Vault", url: "/student/documents" }
    };
  }

  // 4. Default portal guide
  return {
    reply: `Hello ${name}! I am your **AI Education & CRM Guide**.\n\nI can help you:\n- **Find universities and programs** tailored to your background (\`/student/programs\`).\n- **Guide you through application forms** and document requirements.\n- **Manage your draft applications** (you can delete drafts directly from \`/student/applications\`).\n- **Connect you with your human advisor** at the Counsellor Advisory Desk (\`/student/messages\`).\n\nWhat would you like to explore or do next?`,
    suggestions: [
      "Recommend universities matching my profile",
      "How do I delete a draft application?",
      "How do I contact my education counsellor?"
    ],
    actionLink: { label: "Explore Universities", url: "/student/universities" }
  };
}
