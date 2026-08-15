/**
 * EduCRM Client-Side Gemini AI Engine
 * Uses free Google Gemini API (gemini-2.0-flash) for client-side AI recommendation,
 * visa risk evaluation, and document OCR data extraction.
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

const GEMINI_MODEL = "gemini-2.0-flash";

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

async function callGeminiApi(prompt: string, inlineImageData?: { mimeType: string; dataBase64: string }): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env or enter your free Google Gemini API Key.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: prompt }];
  if (inlineImageData) {
    parts.push({
      inlineData: {
        mimeType: inlineImageData.mimeType,
        data: inlineImageData.dataBase64,
      },
    });
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `Gemini API call failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response returned from Gemini AI.");

  return text;
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
  return JSON.parse(responseText);
}

/**
 * 2. AI Visa Success Probability Calculator
 */
export async function calculateVisaProbability(details: {
  studentName: string;
  country: string;
  financialProofUSD: string;
  studyGapYears: string;
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
  return JSON.parse(responseText);
}

/**
 * 3. AI Document OCR Extractor
 */
export async function extractDocumentData(mimeType: string, base64Data: string): Promise<ExtractedDocumentData> {
  const prompt = `Extract all key student details from this document (transcript, passport, certificate, test score report).
Return JSON with exact schema:
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
  return JSON.parse(responseText);
}
