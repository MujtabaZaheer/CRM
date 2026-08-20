/**
 * EduCRM Client-Side Gemini AI Engine
 * Uses Google Gemini API (gemini-3.5-flash-lite with multi-model fallback) for client-side AI recommendation,
 * visa risk evaluation, document OCR data extraction, and personal statement generation.
 */

export interface CourseRecommendation {
  universityName: string;
  programmeName: string;
  country: string;
  matchScore: number; // 0-100
  rationale: string;
  estimatedTuition: string;
  admissionLikelihood: "High" | "Medium" | "Reach";
}

export interface VisaRiskAnalysis {
  probabilityScore: number; // 0-100
  riskLevel: "Low" | "Medium" | "High";
  riskFactors: string[];
  recommendations: string[];
  financialAdequacy: string;
}

export interface ExtractedDocumentData {
  fullName?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  gpaScore?: string;
  englishTestScore?: string;
  institutionName?: string;
  degreeTitle?: string;
  graduationYear?: string;
  documentType: "Transcript" | "Passport" | "IELTS/TOEFL" | "Other";
}

export interface PersonalStatementDraft {
  title: string;
  statementContent: string;
  keyHighlights: string[];
  wordCount: number;
}

export interface ApplicationReadinessReport {
  readinessScore: number; // 0-100
  status: "Ready for Submission" | "Action Required" | "Incomplete";
  missingRequirements: string[];
  strengths: string[];
  recommendations: string[];
}

export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.5-flash-lite";

function getApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() !== "") return envKey.trim();

  const storedKey = localStorage.getItem("EDUC_CRM_GEMINI_API_KEY");
  if (storedKey && storedKey.trim() !== "") return storedKey.trim();

  return "";
}

export function setRuntimeGeminiApiKey(key: string) {
  localStorage.setItem("EDUC_CRM_GEMINI_API_KEY", key.trim());
}

export function hasGeminiApiKey(): boolean {
  return getApiKey() !== "";
}

/**
 * Robust JSON extraction from LLM response (strips markdown code blocks and finds valid JSON boundaries)
 */
export function cleanAndParseJson<T = any>(text: string): T {
  let cleaned = text.trim();

  // Strip markdown code fences ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Find the start of JSON object or array
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  let startIdx = -1;
  let isArray = false;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isArray = false;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isArray = true;
  }

  if (startIdx !== -1) {
    const endIdx = isArray ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
    if (endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  return JSON.parse(cleaned) as T;
}

export async function callGeminiApi(prompt: string, inlineImageData?: { mimeType: string; dataBase64: string }): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env or enter your Google Gemini API Key.");
  }

  const candidateModels = [
    GEMINI_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];
  // Remove duplicates while preserving order
  const modelsToTry = Array.from(new Set(candidateModels));

  const parts: any[] = [{ text: prompt }];
  if (inlineImageData) {
    parts.push({
      inlineData: {
        mimeType: inlineImageData.mimeType,
        data: inlineImageData.dataBase64,
      },
    });
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errorJson = await response.json().catch(() => ({}));
        lastError = new Error(errorJson?.error?.message || `Gemini API call to ${model} failed with status ${response.status}`);
        // If 404 model not found, try next model in fallback list
        if (response.status === 404) {
          console.warn(`Model ${model} not available, falling back to next candidate...`);
          continue;
        }
        throw lastError;
      }
    } catch (err: any) {
      lastError = err;
      if (err.message && err.message.includes("404")) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("All Gemini models failed to respond.");
}

/**
 * 1. AI Course Recommendation Generator
 */
export async function generateCourseRecommendations(profile: {
  studentName: string;
  gpa: string;
  englishScore: string;
  preferredCountry: string;
  fieldOfStudy: string;
  maxBudgetUSD: string;
}): Promise<CourseRecommendation[]> {
  const prompt = `You are an expert international study abroad advisor. Recommend 3 to 4 best matching university programmes for the following student profile:
Student Name: ${profile.studentName}
GPA / Qualification: ${profile.gpa}
English Proficiency (IELTS/TOEFL/Duolingo): ${profile.englishScore}
Preferred Country: ${profile.preferredCountry}
Field of Study: ${profile.fieldOfStudy}
Max Annual Budget: $${profile.maxBudgetUSD} USD

Return a JSON array of objects with the exact schema:
[
  {
    "universityName": "String",
    "programmeName": "String",
    "country": "String",
    "matchScore": number (80-99),
    "rationale": "String brief 1-2 sentence reason",
    "estimatedTuition": "String tuition fee",
    "admissionLikelihood": "High" | "Medium" | "Reach"
  }
]`;

  const responseText = await callGeminiApi(prompt);
  return cleanAndParseJson<CourseRecommendation[]>(responseText);
}

/**
 * 2. AI Visa Approval Probability Calculator
 */
export async function calculateVisaProbability(details: {
  studentName: string;
  country: string;
  financialProofUSD: number | string;
  studyGapYears: number | string;
  previousRejections: string;
  interviewReadiness: string;
}): Promise<VisaRiskAnalysis> {
  const prompt = `You are a licensed visa compliance auditor for international student visas. Analyze the following visa application data:
Applicant: ${details.studentName}
Target Country: ${details.country}
Financial Proof / Bank Balance: $${details.financialProofUSD} USD
Study Gap: ${details.studyGapYears} years
Previous Visa Rejections: ${details.previousRejections}
Interview Readiness / SOP Quality: ${details.interviewReadiness}

Evaluate visa approval probability and risk factors. Return JSON with exact schema:
{
  "probabilityScore": number (0-100),
  "riskLevel": "Low" | "Medium" | "High",
  "riskFactors": ["Array of string risk factors"],
  "recommendations": ["Array of string actionable advice to improve approval"],
  "financialAdequacy": "String summary of financial assessment"
}`;

  const responseText = await callGeminiApi(prompt);
  return cleanAndParseJson<VisaRiskAnalysis>(responseText);
}

/**
 * 3. AI Document OCR Extractor
 */
export async function extractDocumentData(mimeType: string, base64Data: string): Promise<ExtractedDocumentData> {
  const prompt = `Extract all key student details from this document (transcript, passport, certificate, test score report).
Return ONLY a valid JSON object with the exact schema:
{
  "fullName": "Extracted student name or empty string",
  "dateOfBirth": "YYYY-MM-DD or empty string",
  "passportNumber": "Extracted passport number or empty string",
  "gpaScore": "Extracted GPA/grade or empty string",
  "englishTestScore": "Extracted IELTS/TOEFL score or empty string",
  "institutionName": "Extracted school/university name or empty string",
  "degreeTitle": "Extracted degree title or empty string",
  "graduationYear": "Extracted year or empty string",
  "documentType": "Transcript" | "Passport" | "IELTS/TOEFL" | "Other"
}`;

  const responseText = await callGeminiApi(prompt, { mimeType, dataBase64: base64Data });
  return cleanAndParseJson<ExtractedDocumentData>(responseText);
}

/**
 * 4. AI Personal Statement / Statement of Purpose Drafter
 */
export async function generatePersonalStatement(details: {
  studentName: string;
  targetUniversity: string;
  targetProgramme: string;
  academicBackground: string;
  workExperience: string;
  careerGoals: string;
}): Promise<PersonalStatementDraft> {
  const prompt = `Draft a compelling, highly professional Personal Statement / Statement of Purpose (SOP) for an international university application.
Applicant Name: ${details.studentName}
Target Institution: ${details.targetUniversity}
Target Programme: ${details.targetProgramme}
Academic Background: ${details.academicBackground}
Work / Research Experience: ${details.workExperience}
Career Ambitions: ${details.careerGoals}

Return JSON with exact schema:
{
  "title": "String title",
  "statementContent": "Full draft multi-paragraph personal statement",
  "keyHighlights": ["Array of 3-4 bullet points highlighted in the statement"],
  "wordCount": number
}`;

  const responseText = await callGeminiApi(prompt);
  return cleanAndParseJson<PersonalStatementDraft>(responseText);
}

/**
 * 5. AI Application Dossier Readiness Checker
 */
export async function auditApplicationReadiness(details: {
  studentName: string;
  programmeName: string;
  hasPassport: boolean;
  hasTranscript: boolean;
  hasEnglishTest: boolean;
  hasSOP: boolean;
  hasFinancialProof: boolean;
  gpa: string;
  englishScore: string;
}): Promise<ApplicationReadinessReport> {
  const prompt = `Evaluate application readiness and document completeness for this student:
Applicant: ${details.studentName}
Programme: ${details.programmeName}
Passport Uploaded: ${details.hasPassport}
Transcript Uploaded: ${details.hasTranscript}
English Test Uploaded: ${details.hasEnglishTest}
SOP Uploaded: ${details.hasSOP}
Financial Proof Uploaded: ${details.hasFinancialProof}
GPA / Qualification: ${details.gpa}
English Score: ${details.englishScore}

Return JSON with exact schema:
{
  "readinessScore": number (0-100),
  "status": "Ready for Submission" | "Action Required" | "Incomplete",
  "missingRequirements": ["Array of missing items or documents"],
  "strengths": ["Array of profile strengths"],
  "recommendations": ["Actionable steps before submitting"]
}`;

  const responseText = await callGeminiApi(prompt);
  return cleanAndParseJson<ApplicationReadinessReport>(responseText);
}

export const evaluateApplicationReadiness = auditApplicationReadiness;
