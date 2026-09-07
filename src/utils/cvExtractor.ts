/**
 * EduCRM AI CV / Resume Extractor Engine
 * Uses PDF.js for zero-error client-side PDF text extraction, Mammoth for DOCX,
 * Google Gemini AI with automatic multi-model fallback, and robust heuristic intelligence
 * to parse resumes, CVs, and academic profiles into accurate, structured student fields.
 */

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import mammoth from "mammoth";
import { callGeminiApi, cleanAndParseJson, hasGeminiApiKey } from "./geminiClient";
import { AcademicRecord, QualificationLevel } from "../types/student";

export type { QualificationLevel };

// Configure PDF.js worker in browser environment
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface ExtractedStudentCVData {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  nationality: string;
  countryOfResidence: string;
  city?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say";
  desiredStudyLevel?: string;
  academicRecords?: AcademicRecord[];
  englishProficiency?: {
    testType: "IELTS" | "PTE" | "TOEFL" | "Duolingo" | "MOI Evidence";
    overallScore: string;
  };
  skillsSummary?: string;
  sourceFileName?: string;
}

export const COMMON_COUNTRIES = [
  "Pakistan", "United Kingdom", "Canada", "Australia", "United States",
  "Germany", "Ireland", "New Zealand", "United Arab Emirates", "Saudi Arabia",
  "France", "Netherlands", "Sweden", "Singapore", "Malaysia", "India",
  "Nigeria", "Ghana", "Bangladesh", "Egypt", "Turkey", "China", "Kenya",
  "South Africa", "Spain", "Italy", "Norway", "Switzerland", "Qatar", "Kuwait", "Oman"
];

export const COUNTRY_TO_DEMONYM: Record<string, string> = {
  "pakistan": "Pakistani",
  "united kingdom": "British",
  "uk": "British",
  "great britain": "British",
  "england": "British",
  "united states": "American",
  "usa": "American",
  "us": "American",
  "canada": "Canadian",
  "australia": "Australian",
  "india": "Indian",
  "nigeria": "Nigerian",
  "united arab emirates": "Emirati",
  "uae": "Emirati",
  "saudi arabia": "Saudi",
  "bangladesh": "Bangladeshi",
  "germany": "German",
  "france": "French",
  "ireland": "Irish",
  "new zealand": "New Zealander",
  "ghana": "Ghanaian",
  "egypt": "Egyptian",
  "china": "Chinese",
  "turkey": "Turkish",
  "kenya": "Kenyan",
  "south africa": "South African",
  "malaysia": "Malaysian",
  "singapore": "Singaporean",
  "netherlands": "Dutch",
  "sweden": "Swedish",
};

export const DEMONYM_TO_COUNTRY: Record<string, string> = {
  "pakistani": "Pakistan",
  "british": "United Kingdom",
  "american": "United States",
  "canadian": "Canada",
  "australian": "Australia",
  "indian": "India",
  "nigerian": "Nigeria",
  "emirati": "United Arab Emirates",
  "saudi": "Saudi Arabia",
  "bangladeshi": "Bangladesh",
  "german": "Germany",
  "french": "France",
  "irish": "Ireland",
  "new zealander": "New Zealand",
  "ghanaian": "Ghana",
  "egyptian": "Egypt",
  "chinese": "China",
  "turkish": "Turkey",
  "kenyan": "Kenya",
  "south african": "South Africa",
  "malaysian": "Malaysia",
  "singaporean": "Singapore",
  "dutch": "Netherlands",
  "swedish": "Sweden",
};

/**
 * Converts a demonym (e.g. "Pakistani") or country code to standard country name (e.g. "Pakistan")
 */
export function toCountryName(val?: string): string {
  if (!val) return "Pakistan";
  const key = val.trim().toLowerCase();
  if (DEMONYM_TO_COUNTRY[key]) return DEMONYM_TO_COUNTRY[key];
  for (const country of COMMON_COUNTRIES) {
    if (country.toLowerCase() === key) return country;
  }
  return val.trim();
}

/**
 * Converts a country name (e.g. "Pakistan") to standard nationality demonym (e.g. "Pakistani")
 */
export function toNationalityDemonym(val?: string): string {
  if (!val) return "Pakistani";
  const key = val.trim().toLowerCase();
  if (COUNTRY_TO_DEMONYM[key]) return COUNTRY_TO_DEMONYM[key];
  for (const [dem] of Object.entries(DEMONYM_TO_COUNTRY)) {
    if (dem === key) return dem.charAt(0).toUpperCase() + dem.slice(1);
  }
  return val.trim();
}

/**
 * Extracts printable, properly aligned text streams from a PDF ArrayBuffer using PDF.js
 */
async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      let pageStr = "";
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if ("str" in item) {
          const textItem = item as { str: string; transform: number[]; hasEOL?: boolean };
          const currentY = textItem.transform ? textItem.transform[5] : null;

          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 3) {
            pageStr += "\n";
          } else if (pageStr.length > 0 && !pageStr.endsWith("\n") && !pageStr.endsWith(" ")) {
            pageStr += " ";
          }

          pageStr += textItem.str;
          if (textItem.hasEOL) {
            pageStr += "\n";
          }
          lastY = currentY;
        }
      }
      if (pageStr.trim()) {
        pageTexts.push(pageStr.trim());
      }
    }

    if (pageTexts.length > 0) {
      return pageTexts.join("\n\n");
    }
  } catch (err) {
    console.warn("PDF.js extraction failed, attempting fallback parser:", err);
  }

  // Safe fallback for edge cases: extract printable ASCII words without repeating binary junk
  return extractRawPdfTextFallback(buffer);
}

/**
 * Fallback parser that reads raw PDF streams safely without accepting binary garbage
 */
function extractRawPdfTextFallback(buffer: ArrayBuffer): string {
  try {
    const uint8 = new Uint8Array(buffer);
    const latin1 = new TextDecoder("latin1").decode(uint8);
    const pieces: string[] = [];

    // Match Tj text operators: (text) Tj
    const tjRegex = /\(([^)\r\n]+)\)\s*(?:Tj|'|")/g;
    let match;
    while ((match = tjRegex.exec(latin1)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, "$1").trim();
      if (clean.length > 1 && !/^[\x00-\x1F]+$/.test(clean)) {
        pieces.push(clean);
      }
    }

    // Match TJ array operators: [(text) -20 (more text)] TJ
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/gi;
    let arrMatch;
    while ((arrMatch = tjArrayRegex.exec(latin1)) !== null) {
      const inner = arrMatch[1];
      const strMatches = inner.match(/\(([^)]+)\)/g);
      if (strMatches) {
        for (const s of strMatches) {
          const clean = s.slice(1, -1).replace(/\\([()\\])/g, "$1").trim();
          if (clean.length > 1 && !/^[\x00-\x1F]+$/.test(clean)) {
            pieces.push(clean);
          }
        }
      }
    }

    return pieces.join("\n");
  } catch (_) {
    return "";
  }
}

/**
 * Extracts clean text from Word (.docx) ArrayBuffer using Mammoth
 */
async function extractTextFromDocxBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || "";
  } catch (err) {
    console.warn("Mammoth DOCX extraction error:", err);
    return "";
  }
}

/**
 * Validates whether a candidate string is a plausible phone number
 * Rejects corrupt binary repetitions like "222222222222222" or "00000000"
 */
export function isValidPhone(candidate: string): boolean {
  const digits = candidate.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 16) return false;

  // Reject repeating single digits (e.g. 222222222222222)
  const uniqueDigits = new Set(digits);
  if (uniqueDigits.size <= 2) return false;

  // Reject sequential runs
  if ("123456789012345".includes(digits) || "987654321098765".includes(digits)) return false;

  return true;
}

/**
 * Cleans candidate names by stripping numbers, IDs, file extensions, and extra punctuation
 */
export function cleanCandidateName(raw: string): string {
  if (!raw) return "";

  let cleaned = raw
    // Remove file extension
    .replace(/\.[a-zA-Z0-9]{2,4}$/, "")
    // Remove labels like ID:, Roll No:, CNIC:, etc.
    .replace(/\b(?:id|roll\s*no|reg\s*no|cnic|passport|cv|resume|profile|applicant|bio\s*data|curriculum\s*vitae)\b[:#\s\d-]*/gi, " ")
    // Remove numbers and dates like 271016, 2024, 12345
    .replace(/\b\d{2,}\b/g, " ")
    .replace(/[0-9]+/g, " ")
    // Remove invalid symbols
    .replace(/[^a-zA-Z\s.'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Strip prefixes like Mr, Ms, Dr, Prof
  cleaned = cleaned.replace(/^(?:mr|ms|mrs|dr|prof|engr)\.?\s+/i, "");

  // Convert to Title Case
  if (cleaned.length >= 2) {
    cleaned = cleaned
      .split(" ")
      .filter((w) => w.length > 0)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return cleaned;
}

/**
 * Parses diverse date formats into standard YYYY-MM-DD for HTML date inputs
 */
function parseToIsoDate(rawDate: string): string {
  try {
    const cleaned = rawDate.trim().replace(/,/g, " ");

    // 1. DD/MM/YYYY or DD-MM-YYYY
    const dmy = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, "0");
      const month = dmy[2].padStart(2, "0");
      const year = dmy[3];
      const numYear = parseInt(year, 10);
      if (numYear >= 1960 && numYear <= 2015) {
        return `${year}-${month}-${day}`;
      }
    }

    // 2. YYYY-MM-DD
    const ymd = cleaned.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (ymd) {
      const year = ymd[1];
      const month = ymd[2].padStart(2, "0");
      const day = ymd[3].padStart(2, "0");
      const numYear = parseInt(year, 10);
      if (numYear >= 1960 && numYear <= 2015) {
        return `${year}-${month}-${day}`;
      }
    }

    // 3. DD Month YYYY (e.g. 27 Oct 1998 or 27 October 1998)
    const monthNames: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };

    const textDate = cleaned.match(/(\d{1,2})\s+([a-zA-Z]{3,9})\s+(\d{4})/);
    if (textDate) {
      const day = textDate[1].padStart(2, "0");
      const mStr = textDate[2].slice(0, 3).toLowerCase();
      const year = textDate[3];
      if (monthNames[mStr]) {
        return `${year}-${monthNames[mStr]}-${day}`;
      }
    }

    // 4. Month DD, YYYY (e.g. October 27, 1998)
    const monthFirst = cleaned.match(/([a-zA-Z]{3,9})\s+(\d{1,2})\s+(\d{4})/);
    if (monthFirst) {
      const mStr = monthFirst[1].slice(0, 3).toLowerCase();
      const day = monthFirst[2].padStart(2, "0");
      const year = monthFirst[3];
      if (monthNames[mStr]) {
        return `${year}-${monthNames[mStr]}-${day}`;
      }
    }
  } catch (_) {}

  return "";
}

/**
 * Intelligent client-side heuristic parser that extracts structured fields from text
 */
export function heuristicExtractFromText(text: string, fileName?: string): ExtractedStudentCVData {
  const rawLines = text.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l.length > 0);
  const fullText = text;

  // 1. Email extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = fullText.match(emailRegex);
  const email = emailMatch ? emailMatch[0].toLowerCase().replace(/[.,;:]+$/, "") : "";

  // 2. Phone extraction
  let phone = "";
  // Look for labeled phone first: Phone: +92 300 1234567
  const labeledPhoneRegex = /(?:phone|mobile|cell|tel|whatsapp|contact|contact\s*no|phone\s*no)\s*[:\-]?\s*([+\d\s().-]{7,25})/i;
  const labeledMatch = fullText.match(labeledPhoneRegex);
  if (labeledMatch && isValidPhone(labeledMatch[1])) {
    phone = labeledMatch[1].trim();
  }

  // Fallback to pattern search if labeled phone was missing or invalid
  if (!phone) {
    const candidatePhones = fullText.match(/(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g) || [];
    for (const cand of candidatePhones) {
      const cleanedCand = cand.trim();
      if (isValidPhone(cleanedCand)) {
        phone = cleanedCand;
        // If it starts with a country prefix or +, prioritize it and stop
        if (phone.startsWith("+") || phone.startsWith("00")) {
          break;
        }
      }
    }
  }

  // Format phone cleanly
  if (phone) {
    phone = phone.replace(/[^\d+]/g, " ").replace(/\s+/g, " ").trim();
  }

  // 3. Full Name extraction
  let fullName = "";

  // A. Check for explicit name label: Name: Khawaja Tariq Mahmood
  const labeledNameMatch = fullText.match(/(?:full\s*name|name|applicant\s*name|candidate\s*name)\s*[:\-]\s*([A-Za-z.'\- ]{3,45})/i);
  if (labeledNameMatch && labeledNameMatch[1]) {
    const candidate = cleanCandidateName(labeledNameMatch[1]);
    const parts = candidate.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts.length <= 4) {
      fullName = candidate;
    }
  }

  // B. Scan top 12 lines for prominent candidate name
  if (!fullName) {
    for (const line of rawLines.slice(0, 12)) {
      const lower = line.toLowerCase();
      // Skip lines containing email, urls, or section headers
      if (
        lower.includes("@") ||
        lower.includes("http") ||
        lower.includes("linkedin") ||
        lower.includes("github") ||
        lower.includes("curriculum") ||
        lower.includes("resume") ||
        lower.includes("profile") ||
        lower.includes("contact") ||
        lower.includes("objective") ||
        lower.includes("summary") ||
        lower.includes("education") ||
        lower.includes("experience") ||
        lower.includes("skills") ||
        lower.includes("biodata")
      ) {
        continue;
      }

      // Clean the line
      const candidate = cleanCandidateName(line);
      const parts = candidate.split(/\s+/).filter(Boolean);

      if (
        candidate.length >= 3 &&
        candidate.length <= 40 &&
        parts.length >= 2 &&
        parts.length <= 4
      ) {
        fullName = candidate;
        break;
      }
    }
  }

  // C. Fallback to clean filename if not found in text
  if (!fullName && fileName) {
    const cleanedFile = cleanCandidateName(fileName);
    const parts = cleanedFile.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      fullName = cleanedFile;
    } else if (cleanedFile.length >= 3) {
      fullName = cleanedFile;
    }
  }

  // Final fallback if name could not be inferred
  if (!fullName) {
    fullName = "Student Applicant";
  }

  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "Student";
  const lastName = nameParts.slice(1).join(" ") || "";

  // 4. Date of Birth (DOB)
  let dob = "";
  const dobRegexes = [
    /(?:date\s*of\s*birth|dob|d\.o\.b\.?|birth\s*date|born\s*(?:on)?)\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    /(?:date\s*of\s*birth|dob|d\.o\.b\.?|birth\s*date|born\s*(?:on)?)\s*[:\-]?\s*([0-9]{4}[\/\-.][0-9]{1,2}[\/\-.][0-9]{1,2})/i,
    /(?:date\s*of\s*birth|dob|d\.o\.b\.?|birth\s*date|born\s*(?:on)?)\s*[:\-]?\s*([0-9]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[,\s]+[0-9]{4})/i,
    /(?:date\s*of\s*birth|dob|d\.o\.b\.?|birth\s*date|born\s*(?:on)?)\s*[:\-]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+[0-9]{1,2}[,\s]+[0-9]{4})/i,
  ];
  for (const rx of dobRegexes) {
    const match = fullText.match(rx);
    if (match && match[1]) {
      const parsedIso = parseToIsoDate(match[1]);
      if (parsedIso) {
        dob = parsedIso;
        break;
      }
    }
  }

  // 5. Gender
  let gender: "Male" | "Female" | "Other" | "Prefer not to say" = "Prefer not to say";
  const genderMatch = fullText.match(/\b(?:gender|sex)\s*[:\-]?\s*(male|female|other)\b/i);
  if (genderMatch) {
    const gVal = genderMatch[1].toLowerCase();
    if (gVal === "male") gender = "Male";
    else if (gVal === "female") gender = "Female";
    else if (gVal === "other") gender = "Other";
  }

  // 6. Country & Nationality
  let countryOfResidence = "Pakistan";
  let nationality = "Pakistani";

  // Check labeled nationality: Nationality: Pakistani (single-line only)
  const labeledNat = fullText.match(/\b(?:nationality)\s*[:\-]?\s*([A-Za-z\- ]{3,30})/i);
  if (labeledNat && labeledNat[1]) {
    const rawNat = labeledNat[1].trim();
    nationality = toNationalityDemonym(rawNat);
    countryOfResidence = toCountryName(rawNat);
  }

  // Check labeled country: Country / Country of Residence (single-line only)
  const labeledCountry = fullText.match(/\b(?:country\s*of\s*residence|current\s*country|residence\s*country|country)\s*[:\-]?\s*([A-Za-z\- ]{3,30})/i);
  if (labeledCountry && labeledCountry[1]) {
    const rawC = labeledCountry[1].trim();
    countryOfResidence = toCountryName(rawC);
    if (!labeledNat) {
      nationality = toNationalityDemonym(rawC);
    }
  }

  // Keyword scan across text if neither labeled
  if (!labeledNat && !labeledCountry) {
    const lowerText = fullText.toLowerCase();
    for (const [demKey, cName] of Object.entries(DEMONYM_TO_COUNTRY)) {
      if (lowerText.includes(demKey)) {
        nationality = demKey.charAt(0).toUpperCase() + demKey.slice(1);
        countryOfResidence = cName;
        break;
      }
    }
    if (nationality === "Pakistani") {
      for (const country of COMMON_COUNTRIES) {
        if (lowerText.includes(country.toLowerCase())) {
          countryOfResidence = country;
          nationality = toNationalityDemonym(country);
          break;
        }
      }
    }
  }

  // 7. City
  let city = "";
  const labeledCity = fullText.match(/\b(?:city|current\s*city|residing\s*in|location)\s*[:\-]?\s*([A-Za-z\s]{2,25})/i);
  if (labeledCity && labeledCity[1]) {
    const candCity = labeledCity[1].trim();
    if (!["pakistan", "united kingdom", "canada", "address", "phone", "email"].includes(candCity.toLowerCase())) {
      city = candCity.split(/\s+/)[0];
    }
  }
  if (!city) {
    const MAJOR_CITIES = [
      "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
      "London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Edinburgh",
      "Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary",
      "Dubai", "Abu Dhabi", "Sharjah", "Riyadh", "Jeddah",
      "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Dhaka", "Lagos"
    ];
    const lowerText = fullText.toLowerCase();
    for (const c of MAJOR_CITIES) {
      if (lowerText.includes(c.toLowerCase())) {
        city = c;
        break;
      }
    }
  }

  // 8. Desired Study Level
  let desiredStudyLevel = "Master's";
  const lowerAll = fullText.toLowerCase();
  if (lowerAll.includes("phd") || lowerAll.includes("doctorate") || lowerAll.includes("postgraduate research")) {
    desiredStudyLevel = "PhD";
  } else if (
    lowerAll.includes("undergraduate admission") ||
    lowerAll.includes("bachelor application") ||
    lowerAll.includes("a-levels") ||
    lowerAll.includes("fsc pre-engineering")
  ) {
    desiredStudyLevel = "Bachelor's";
  }

  // 9. Academic Records (real extraction without fake universities)
  const academicRecords = extractAcademicRecordsFromText(fullText, countryOfResidence);

  // 10. English Proficiency
  let englishProficiency: ExtractedStudentCVData["englishProficiency"] | undefined;
  const ieltsMatch = fullText.match(/\b(?:IELTS|PTE|TOEFL|Duolingo)\b[^\n\r]*?\b(?:overall|score|band)?\s*[:\-]?\s*([1-9](?:\.[05])?|[5-9][0-9]|[1][0-2][0-9])\b/i);
  if (ieltsMatch) {
    let testType: "IELTS" | "PTE" | "TOEFL" | "Duolingo" | "MOI Evidence" = "IELTS";
    const upperMatch = fullText.toUpperCase();
    if (upperMatch.includes("PTE")) testType = "PTE";
    else if (upperMatch.includes("TOEFL")) testType = "TOEFL";
    else if (upperMatch.includes("DUOLINGO")) testType = "Duolingo";

    englishProficiency = {
      testType,
      overallScore: ieltsMatch[1].trim(),
    };
  }

  return {
    fullName,
    firstName,
    lastName,
    email: email || "student.applicant@example.com",
    phone: phone || "+92 300 1234567",
    nationality,
    countryOfResidence,
    city: city || undefined,
    dob: dob || undefined,
    gender,
    desiredStudyLevel,
    academicRecords,
    englishProficiency,
    sourceFileName: fileName,
  };
}

/**
 * Extracts authentic academic records from CV text
 */
/**
 * Normalizes any qualification string to one of the 5 allowed QualificationLevel union values
 */
export function normalizeQualificationLevel(raw?: string): QualificationLevel {
  if (!raw) return "Bachelor's Degree";
  const lower = raw.toLowerCase();
  if (lower.includes("phd") || lower.includes("ph.d") || lower.includes("doctorate") || lower.includes("doctoral")) {
    return "Doctorate / PhD";
  }
  if (lower.includes("master") || lower.includes("msc") || lower.includes("m.sc") || lower.includes("ms") || lower.includes("m.s.") || lower.includes("mba") || lower.includes("mphil") || lower.includes("postgraduate") || lower.includes("llm") || lower.includes("m.eng") || lower.includes("mtech")) {
    return "Master's Degree";
  }
  if (lower.includes("diploma") || lower.includes("associate") || lower.includes("pgd") || lower.includes("certificate") || lower.includes("certification") || lower.includes("hnd") || lower.includes("dae")) {
    return "Diploma / Certificate";
  }
  if (lower.includes("bachelor") || lower.includes("bsc") || lower.includes("b.sc") || lower.includes("bs") || lower.includes("b.s.") || lower.includes("bba") || lower.includes("btech") || lower.includes("b.e.") || lower.includes("undergraduate") || lower.includes("llb") || lower.includes("mbbs") || lower.includes("bds") || lower.includes("pharm") || lower.includes("bcom") || lower.includes("ba") || lower.includes("bcs") || lower.includes("b.eng")) {
    return "Bachelor's Degree";
  }
  if (lower.includes("a-level") || lower.includes("a level") || lower.includes("o-level") || lower.includes("o level") || lower.includes("high school") || lower.includes("secondary") || lower.includes("hssc") || lower.includes("ssc") || lower.includes("fsc") || lower.includes("f.sc") || lower.includes("intermediate") || lower.includes("matric") || lower.includes("12th") || lower.includes("10th") || lower.includes("pre-engineering") || lower.includes("pre-medical") || lower.includes("ics") || lower.includes("icom")) {
    return "High School / A-Levels";
  }
  return "Bachelor's Degree";
}

export function cleanInstitutionName(raw?: string): string {
  if (!raw) return "";
  let cleaned = raw
    .replace(/^(?:institution|university|college|school|campus|board|academy|alma\s*mater)\s*[:\-]\s*/i, "")
    .replace(/^[\s•*\-0-9.)]+/, "")
    .replace(/^(?:from|at|@)\s+/i, "")
    .replace(/\s*\(\s*(?:19|20)\d{2}\s*[-–to\s]*(?:(?:19|20)\d{2}|present)?\s*\)/gi, "")
    .replace(/,\s*(?:Lahore|Islamabad|Karachi|Rawalpindi|Peshawar|Multan|Faisalabad|London|Manchester|Toronto|Dubai|Pakistan|United Kingdom|Canada|UK|USA)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned.replace(/[,;:\-]+$/, "").trim();
  return cleaned;
}

/**
 * Checks if a string or clause represents a credential/degree rather than an institution name
 */
export function isQualificationOrDegreeString(text: string): boolean {
  if (!text) return false;
  const t = text.trim();

  // 1. High school / Secondary school credentials
  if (/\b(?:higher\s*secondary|secondary\s*school|high\s*school\s*(?:certificate|diploma)?|school\s*certificate|intermediate|matriculation|matric|o[- ]?levels?|a[- ]?levels?|gcse|igcse|hssc|ssc|f\.?sc|ics|i\.?com)\b/i.test(t)) {
    // If it mentions university, college, or an education board explicitly, it's not purely a degree
    if (!/\b(?:universit(?:y|ies)|colleges?|institutes?|board\s*of|academ(?:y|ies)|campuses?)\b/i.test(t)) {
      return true;
    }
  }

  // 2. Degree prefixes or degree credentials
  const stripped = t.replace(/^[\s•*\-0-9.)]+/, "").trim();
  if (/^(?:bachelor|master|doctorate|doctor\s*of|ph\.?d|m\.?phil|diploma|associate\s*degree|certificate|b\.?sc|m\.?sc|bs|ms|bba|mba|bcs|b\.?e\.|btech|mtech|llb|llm|mbbs|bds|pharm-?d)\b/i.test(stripped)) {
    if (!/\b(?:universit(?:y|ies)|colleges?|institutes?|board\s*of|academ(?:y|ies)|campuses?)\b/i.test(stripped)) {
      return true;
    }
  }

  return false;
}

export function extractInstitutionFromText(str: string): string {
  if (!str) return "";

  // 1. Explicit label: Institution: XYZ or University: ABC
  const labeled = str.match(/(?:institution|university|college|school|campus|board|academy|alma\s*mater)\s*[:\-]\s*([^\r\n,;]+)/i);
  if (labeled && labeled[1]) {
    const cand = cleanInstitutionName(labeled[1]);
    if (cand && !isQualificationOrDegreeString(cand)) {
      return cand;
    }
  }

  // 2. Look for "from <Institution>" or "at <Institution>" or "@ <Institution>"
  const fromAtMatch = str.match(/\b(?:from|at|@)\s+([A-Za-z0-9&.,'\s]{3,60})/i);
  if (fromAtMatch && fromAtMatch[1]) {
    const cand = cleanInstitutionName(fromAtMatch[1].split(/[,;]/)[0]);
    if (
      cand.length >= 3 &&
      !isQualificationOrDegreeString(cand) &&
      (/\b(?:universit(?:y|ies)|colleges?|institutes?|academ(?:y|ies)|schools?|polytechnics?|facult(?:y|ies)|board)\b/i.test(cand) ||
       /\b(LUMS|NUST|FAST(?:-NUCES)?|FAST\s*NUCES|GIKI|IBA|UET|COMSATS|GCU|PIEAS|NED|SZABIST|FCCU|QAU|Harvard|MIT|Stanford|Oxford|Cambridge|UCL)\b/i.test(cand))
    ) {
      return cand;
    }
  }

  // 3. Split line by commas, pipes, or semicolons to inspect clauses
  const clauses = str.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  for (const clause of clauses) {
    if (isQualificationOrDegreeString(clause)) {
      continue;
    }

    if (
      /\b(?:universit(?:y|ies)|colleges?|institutes?|academ(?:y|ies)|polytechnics?|facult(?:y|ies)|board\s*of)\b/i.test(clause) ||
      /\b(?:grammar\s*schools?|public\s*schools?|cadet\s*colleges?|schools?\s*system|international\s*schools?|convent)\b/i.test(clause) ||
      /\b(LUMS|NUST|FAST(?:-NUCES)?|FAST\s*NUCES|GIKI|IBA|UET|COMSATS|GCU|PIEAS|NED|SZABIST|FCCU|QAU|Harvard|MIT|Stanford|Oxford|Cambridge|UCL)\b/i.test(clause)
    ) {
      const cand = cleanInstitutionName(clause);
      if (cand.length >= 3) {
        return cand;
      }
    }
  }

  // 4. Fallback regex patterns
  const univMatch = str.match(/\b(?:[A-Z][A-Za-z&.,'\s]{1,40}\s+)?(?:Universit(?:y|ies)|Colleges?|Institutes?|Academ(?:y|ies))(?:\s+of\s+[A-Za-z&.,'\s]{1,40})?\b/i);
  if (univMatch) {
    const cand = cleanInstitutionName(univMatch[0]);
    if (cand.length >= 4 && !isQualificationOrDegreeString(cand)) return cand;
  }

  return "";
}

export function cleanDegreeTitle(raw?: string): string {
  if (!raw) return "";
  let cleaned = raw
    .replace(/^[\s•*\-0-9.)]+/, "")
    .replace(/^(?:degree|qualification|course|major|title)\s*[:\-]\s*/i, "")
    .replace(/\s*\(\s*(?:19|20)\d{2}\s*[-–to\s]*(?:(?:19|20)\d{2}|present|current)?\s*\)/gi, "")
    .replace(/\b(?:19|20)\d{2}\s*[-–to\s]+(?:(?:19|20)\d{2}|present|current)\b/gi, "")
    .replace(/\b(?:19|20)\d{2}\b/g, "")
    .replace(/\b(?:cgpa|gpa|grade|score|marks)\s*[:\-]?\s*(?:[0-5]\.\d{1,2}(?:\s*\/\s*[0-5](?:\.00?)?)?|[5-9]\d%|[1-9]\d%)\b/gi, "")
    .replace(/,\s*(?:University|College|Institute|Academy|School|FAST|NUST|LUMS|UET|COMSATS|GCU|GIKI|IBA).*$/i, "")
    .replace(/\b(?:from|at|@)\s+(?:University|College|Institute|Academy|School|FAST|NUST|LUMS|UET|COMSATS|GCU|GIKI|IBA).*$/i, "")
    .replace(/,\s*\)/g, ")")
    .replace(/\(\s*,/g, "(")
    .replace(/\(\s*\)/g, "")
    .replace(/[^a-zA-Z0-9\s()&/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length > 70) {
    cleaned = cleaned.slice(0, 70).trim();
  }
  return cleaned;
}

export function extractGpaOrGrade(ctxText: string): string {
  // 1. CGPA / GPA: e.g. CGPA: 3.78 / 4.00 or GPA: 3.65 or 3.78/4.00
  const gpaMatch = ctxText.match(/\b(?:cgpa|gpa)\s*[:\-]?\s*([0-4]\.\d{1,2}(?:\s*\/\s*4(?:\.00?)?)?|[0-5]\.\d{1,2}\s*\/\s*5(?:\.00?)?|[0-9]\.\d{1,2}\s*\/\s*10(?:\.00?)?|[0-4]\.\d{1,2})/i);
  if (gpaMatch && gpaMatch[1]) {
    const val = gpaMatch[1].trim();
    if (!val.includes("/")) {
      return `${val} / 4.00`;
    }
    return val;
  }

  // 2. Labeled Grade with percentage or sign: e.g. Grade: A+ (88%) or Grade: 88% or Grade: A+
  const fullGradeMatch = ctxText.match(/\b(?:grade|result|score|marks)\s*[:\-]?\s*([A-Fa-f][+\-]?\s*(?:\([0-9]{1,3}(?:\.[0-9]{1,2})?%\))?|[0-9]{1,3}(?:\.[0-9]{1,2})?%|[A-Fa-f][+\-]?)/i);
  if (fullGradeMatch && fullGradeMatch[1]) {
    return fullGradeMatch[1].trim();
  }

  // 3. Standalone percentage: 88% or 88.5%
  const pctMatch = ctxText.match(/\b([5-9][0-9](?:\.[0-9]{1,2})?%|[1-9][0-9]%(?:\s*marks)?)\b/i);
  if (pctMatch && pctMatch[1]) {
    return pctMatch[1].trim();
  }

  // 4. Standalone GPA without "CGPA" label: e.g. "3.78 / 4.00"
  const plainGpa = ctxText.match(/\b([0-4]\.\d{1,2}\s*\/\s*4(?:\.00?)?|[0-5]\.\d{1,2}\s*\/\s*5(?:\.00?)?)\b/);
  if (plainGpa && plainGpa[1]) {
    return plainGpa[1].trim();
  }

  // 5. Division / Honours: 1st Division, First Class Honours, Distinction
  const divMatch = ctxText.match(/\b(1st\s*division|first\s*division|distinction|first\s*class(?:\s*honou?rs)?)\b/i);
  if (divMatch && divMatch[1]) {
    return divMatch[1].trim();
  }

  return "";
}

export function extractCompletionYear(ctxText: string): number {
  const rangeMatch = ctxText.match(/\b(19[7-9][0-9]|20[0-2][0-9])\s*[-–to\s]+(19[7-9][0-9]|20[0-3][0-9])\b/);
  if (rangeMatch && rangeMatch[2]) {
    return parseInt(rangeMatch[2], 10);
  }

  const labeledMatch = ctxText.match(/(?:passing\s*year|completion\s*year|graduated|year|session)\s*[:\-]?\s*(19[7-9][0-9]|20[0-3][0-9])/i);
  if (labeledMatch && labeledMatch[1]) {
    return parseInt(labeledMatch[1], 10);
  }

  const years = ctxText.match(/\b(19[7-9][0-9]|20[0-2][0-9])\b/g);
  if (years && years.length > 0) {
    const numYears = years.map((y) => parseInt(y, 10)).sort((a, b) => b - a);
    return numYears[0];
  }

  return 2024;
}

export function extractCountryForRecord(ctxText: string, defaultCountry: string): string {
  const lower = ctxText.toLowerCase();
  for (const country of COMMON_COUNTRIES) {
    if (lower.includes(country.toLowerCase())) {
      return country;
    }
  }
  for (const [dem, cName] of Object.entries(DEMONYM_TO_COUNTRY)) {
    if (lower.includes(dem)) {
      return cName;
    }
  }
  return defaultCountry;
}

/**
 * Extracts authentic, complete academic records from CV text
 */
export function extractAcademicRecordsFromText(
  text: string,
  countryOfResidence: string,
  isolateSection: boolean = true
): AcademicRecord[] {
  const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l.length > 0);
  const records: AcademicRecord[] = [];

  const degreeDefinitions = [
    {
      level: "Doctorate / PhD" as QualificationLevel,
      rx: /\b(ph\.?d|doctorate|doctor\s*of\s*philosophy|d\.?phil|doctoral)\b/i,
      defaultTitle: "Doctor of Philosophy (PhD)"
    },
    {
      level: "Master's Degree" as QualificationLevel,
      rx: /\b(master'?s?|m\.?sc|ms|m\.?s\.|mba|m\.?b\.?a|m\.?phil|postgraduate|ll\.?m|m\.?eng|m\.?tech)\b/i,
      defaultTitle: "Master's Degree"
    },
    {
      level: "Bachelor's Degree" as QualificationLevel,
      rx: /\b(bachelor'?s?|b\.?sc|bs|b\.?s\.|bba|b\.?b\.?a|b\.?tech|b\.?e\.|b\.?eng|undergraduate|ll\.?b|mbbs|bds|pharm-?d|bcs|b\.?com|b\.?a\.)\b/i,
      defaultTitle: "Bachelor's Degree"
    },
    {
      level: "Diploma / Certificate" as QualificationLevel,
      rx: /\b(diploma|associate\s*degree|postgraduate\s*diploma|pgd|certification|hnd|dae|advanced\s*diploma)\b/i,
      defaultTitle: "Diploma / Certificate"
    },
    {
      level: "High School / A-Levels" as QualificationLevel,
      rx: /\b(a[- ]?levels?|o[- ]?levels?|gcse|igcse|high\s*school|secondary\s*school|hssc|ssc|f\.?sc|f\.?a|ics|i\.?com|intermediate|matriculation|matric|12th\s*grade|10th\s*grade|pre[- ]engineering|pre[- ]medical)\b/i,
      defaultTitle: "High School / Intermediate"
    }
  ];

  // 1. Isolate Education Section if present AND isolateSection is true
  let scanLines = lines;
  if (isolateSection) {
    const eduStartIdx = lines.findIndex((l) =>
      /\b(?:EDUCATION|ACADEMIC\s*BACKGROUND|ACADEMIC\s*QUALIFICATIONS|EDUCATIONAL\s*QUALIFICATIONS|EDUCATION\s*&\s*QUALIFICATIONS|ACADEMIC\s*HISTORY|ACADEMICS)\b/i.test(l)
    );

    if (eduStartIdx !== -1) {
      const remaining = lines.slice(eduStartIdx + 1);
      const eduEndIdx = remaining.findIndex((l) =>
        /\b(?:WORK\s*EXPERIENCE|EMPLOYMENT\s*HISTORY|PROFESSIONAL\s*EXPERIENCE|EXPERIENCE|PROJECTS|SKILLS|TECHNICAL\s*SKILLS|CERTIFICATIONS|PUBLICATIONS|AWARDS|LANGUAGES|REFERENCES)\b/i.test(l)
      );
      if (eduEndIdx !== -1) {
        scanLines = remaining.slice(0, eduEndIdx);
      } else {
        scanLines = remaining;
      }
    }
  }

  // 2. Check for Table rows (pipe | or tab \t delimited)
  for (const line of scanLines) {
    if (line.includes("|") || line.includes("\t")) {
      const cells = line.split(/[|\t]+/).map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        for (const def of degreeDefinitions) {
          const matchCell = cells.find((c) => def.rx.test(c));
          if (matchCell) {
            const instCell = cells.find((c) => c !== matchCell && /(?:University|College|Institute|School|Academy|FAST|NUST|LUMS|UET|COMSATS|GCU)/i.test(c)) || cells[1] || "";
            const yearCell = cells.find((c) => /\b(19[7-9][0-9]|20[0-2][0-9])\b/.test(c)) || "";
            const gpaCell = cells.find((c) => /(?:[0-4]\.\d|%|\bgrade\b)/i.test(c)) || "";

            records.push({
              institution: cleanInstitutionName(instCell) || "Educational Institution",
              qualification: def.level,
              degreeTitle: cleanDegreeTitle(matchCell) || def.defaultTitle,
              country: extractCountryForRecord(line, countryOfResidence),
              completionYear: extractCompletionYear(yearCell || line),
              gradeGpa: extractGpaOrGrade(gpaCell || line) || "Completed"
            });
            break;
          }
        }
      }
    }
  }

  // 3. Scan standard line blocks
  for (let i = 0; i < scanLines.length; i++) {
    const line = scanLines[i];
    if (!line || /\b(?:education|academic)\b/i.test(line)) continue;

    for (const def of degreeDefinitions) {
      if (def.rx.test(line)) {
        // Find previous degree index (boundary above)
        let prevDegreeIdx = -1;
        for (let b = i - 1; b >= 0; b--) {
          if (degreeDefinitions.some((d) => d.rx.test(scanLines[b]))) {
            prevDegreeIdx = b;
            break;
          }
        }

        // Find next degree index (boundary below)
        let nextDegreeIdx = scanLines.length;
        for (let a = i + 1; a < scanLines.length; a++) {
          if (degreeDefinitions.some((d) => d.rx.test(scanLines[a]))) {
            nextDegreeIdx = a;
            break;
          }
        }

        const startCtx = i;
        const endCtx = Math.min(nextDegreeIdx, i + 4);
        const contextSlice = scanLines.slice(startCtx, endCtx);
        const contextStr = contextSlice.join(" ");

        let degreeTitle = cleanDegreeTitle(line);
        if (!degreeTitle || degreeTitle.length < 3) {
          degreeTitle = def.defaultTitle;
        }

        // Search institution in order of proximity within this degree's boundary:
        // Current line, next line (i+1), line +2, line +3, and fallback to line above (i-1)
        let institution = extractInstitutionFromText(line);
        if (!institution) {
          const candidateOffsets = [1, 2, 3, -1];
          for (const offset of candidateOffsets) {
            const targetIdx = i + offset;
            if (targetIdx > prevDegreeIdx && targetIdx < nextDegreeIdx) {
              const candLine = scanLines[targetIdx];
              const candInst = extractInstitutionFromText(candLine);
              if (candInst) {
                institution = candInst;
                break;
              }
            }
          }
        }

        const completionYear = extractCompletionYear(contextStr);
        const gradeGpa = extractGpaOrGrade(contextStr) || "Completed";
        const country = extractCountryForRecord(contextStr, countryOfResidence);

        records.push({
          institution: institution || "Academic Institution",
          qualification: def.level,
          degreeTitle,
          country,
          completionYear,
          gradeGpa
        });

        break;
      }
    }
  }

  if (records.length === 0 && isolateSection && scanLines !== lines) {
    return extractAcademicRecordsFromText(text, countryOfResidence, false);
  }

  // Deduplicate identical records (same institution and same degree title)
  const uniqueRecords: AcademicRecord[] = [];
  const seenKeys = new Set<string>();

  for (const r of records) {
    const key = `${r.qualification}_${r.institution.toLowerCase().replace(/[^a-z0-9]/g, "")}_${r.degreeTitle.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueRecords.push(r);
    }
  }

  // Sort: latest completion year first
  uniqueRecords.sort((a, b) => b.completionYear - a.completionYear);

  if (uniqueRecords.length > 0) {
    return uniqueRecords;
  }

  return [
    {
      institution: "",
      qualification: "Bachelor's Degree",
      degreeTitle: "Bachelor's Degree",
      country: countryOfResidence,
      completionYear: 2024,
      gradeGpa: "",
    },
  ];
}

/**
 * Reads a File object and extracts clean text + base64 data for AI or heuristics
 */
export async function readFileForAI(file: File): Promise<{ mimeType: string; base64?: string; text?: string }> {
  const fileName = file.name.toLowerCase();

  // 1. Plain text or CSV
  if (file.type.startsWith("text/") || fileName.endsWith(".txt") || fileName.endsWith(".csv")) {
    const text = await file.text();
    return { mimeType: file.type || "text/plain", text };
  }

  // 2. PDF (Extract clean text with PDF.js)
  if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfText = await extractTextFromPdfBuffer(arrayBuffer);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const commaIdx = dataUrl.indexOf(",");
        const base64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
        resolve({
          mimeType: "application/pdf",
          text: pdfText,
          base64,
        });
      };
      reader.onerror = () => resolve({ mimeType: "application/pdf", text: pdfText });
      reader.readAsDataURL(file);
    });
  }

  // 3. Word DOCX (Extract clean text with Mammoth)
  if (fileName.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const arrayBuffer = await file.arrayBuffer();
    const docxText = await extractTextFromDocxBuffer(arrayBuffer);
    return { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", text: docxText };
  }

  // 4. Images or fallback formats
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const commaIdx = dataUrl.indexOf(",");
      const base64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
      resolve({ mimeType: file.type || "image/jpeg", base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Built-in Sample CV Text for Instant Testing
 */
export function getSampleStudentCVText(): string {
  return `Zainab Tariq
Email: zainab.tariq@gmail.com
Phone: +92 321 8765432
Date of Birth: 24/08/2001
Gender: Female
Nationality: Pakistani
Country of Residence: Pakistan
City: Lahore

ACADEMIC QUALIFICATIONS:
1. Bachelor of Science in Software Engineering (2020 - 2024)
   Lahore University of Management Sciences (LUMS), Pakistan
   CGPA: 3.78 / 4.00
   Major: Distributed Systems & Machine Learning

2. Higher Secondary School Certificate (F.Sc Pre-Engineering, 2018 - 2020)
   Kinnaird College for Women, Lahore
   Grade: A+ (88%)

ENGLISH PROFICIENCY:
IELTS Academic: Overall 7.5 (Listening: 8.0, Reading: 7.5, Writing: 7.0, Speaking: 7.5)

CAREER OBJECTIVE:
Seeking admission to Master's in Artificial Intelligence / Data Science in the UK or Canada.`;
}

/**
 * Main AI CV Extraction Function
 * Extracts student details with PDF.js/Mammoth, Google Gemini Vision/Text AI (if key is set),
 * and intelligent client-side heuristics.
 */
export async function extractStudentCVDetails(fileOrText: File | string, fileName?: string): Promise<ExtractedStudentCVData> {
  const name = typeof fileOrText === "string" ? (fileName || "Pasted_CV.txt") : fileOrText.name;

  let textContent = "";
  let sourceText = "";
  let inlineData: { mimeType: string; dataBase64: string } | undefined = undefined;

  try {
    if (typeof fileOrText === "string") {
      textContent = fileOrText;
    } else {
      const fileData = await readFileForAI(fileOrText);
      if (fileData.text) {
        textContent = fileData.text;
      }
      if (fileData.base64) {
        inlineData = {
          mimeType: fileData.mimeType,
          dataBase64: fileData.base64,
        };
      }
    }

    sourceText = textContent && textContent.length > 20 ? textContent : (typeof fileOrText === "string" ? fileOrText : name);

    // If Gemini API is configured, use it for deep AI extraction
    if (hasGeminiApiKey()) {
      const prompt = `You are an expert university admissions AI evaluator.
Carefully inspect this candidate's CV / Resume / Academic Profile${textContent ? `:\n\n"""\n${textContent}\n"""` : ""}.
Extract all pertinent student details accurately.

Return ONLY a valid JSON object matching the exact schema below (no explanations):
{
  "fullName": "Full legal name (e.g. Khawaja Tariq Mahmood, no numbers, no IDs)",
  "firstName": "First name",
  "lastName": "Last name / family name",
  "email": "Email address",
  "phone": "Phone number with country code",
  "nationality": "Nationality (e.g. Pakistani, British, American, Indian, etc.)",
  "countryOfResidence": "Country of residence (e.g. Pakistan, United Kingdom, etc.)",
  "city": "Current city or empty string",
  "dob": "YYYY-MM-DD or empty string",
  "desiredStudyLevel": "Bachelor's" | "Master's" | "PhD",
  "academicRecords": [
    {
      "institution": "Full School or University name",
      "qualification": "High School / A-Levels" | "Diploma / Certificate" | "Bachelor's Degree" | "Master's Degree" | "Doctorate / PhD",
      "degreeTitle": "Degree title / Major",
      "country": "Country of study",
      "completionYear": number year,
      "gradeGpa": "GPA / Grade / Percentage"
    }
  ]
}`;

      const aiResponse = await callGeminiApi(prompt, inlineData);
      const parsed = cleanAndParseJson<ExtractedStudentCVData>(aiResponse);

      if (parsed && (parsed.fullName || parsed.email)) {
        // Clean any numbers from AI extracted name
        if (parsed.fullName) {
          parsed.fullName = cleanCandidateName(parsed.fullName);
        }
        if (!parsed.firstName && parsed.fullName) {
          const parts = parsed.fullName.trim().split(/\s+/);
          parsed.firstName = parts[0];
          parsed.lastName = parts.slice(1).join(" ");
        } else if (parsed.firstName) {
          parsed.firstName = cleanCandidateName(parsed.firstName);
          if (parsed.lastName) parsed.lastName = cleanCandidateName(parsed.lastName);
        }

        // Validate phone number from AI
        if (parsed.phone && !isValidPhone(parsed.phone)) {
          parsed.phone = "";
        }

        // Normalize and clean all academic records from AI
        if (parsed.academicRecords && parsed.academicRecords.length > 0) {
          parsed.academicRecords = parsed.academicRecords.map((rec) => ({
            institution: cleanInstitutionName(rec.institution) || "Academic Institution",
            qualification: normalizeQualificationLevel(rec.qualification || rec.degreeTitle),
            degreeTitle: cleanDegreeTitle(rec.degreeTitle || rec.qualification),
            country: rec.country || parsed.countryOfResidence || "Pakistan",
            completionYear: Number(rec.completionYear) || 2024,
            gradeGpa: rec.gradeGpa || "Completed",
          }));
        } else {
          // If Gemini didn't return academicRecords, run heuristic parser to extract them!
          parsed.academicRecords = extractAcademicRecordsFromText(sourceText, parsed.countryOfResidence || "Pakistan");
        }

        parsed.sourceFileName = name;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Gemini AI CV parsing notice (falling back to local parser):", err);
  }

  // High-fidelity fallback on extracted text content
  if (!sourceText) {
    sourceText = textContent && textContent.length > 20 ? textContent : (typeof fileOrText === "string" ? fileOrText : name);
  }
  return heuristicExtractFromText(sourceText, name);
}
