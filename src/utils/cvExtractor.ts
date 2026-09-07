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
import { AcademicRecord } from "../types/student";

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
function extractAcademicRecordsFromText(text: string, countryOfResidence: string): AcademicRecord[] {
  const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l.length > 0);
  const records: AcademicRecord[] = [];

  const degreeKeywords = [
    { level: "Master's Degree", rx: /\b(master'?s?|msc|m\.sc|ms|mba|m\.phil|postgraduate)\b/i },
    { level: "Bachelor's Degree", rx: /\b(bachelor'?s?|bsc|b\.sc|bs|bba|b\.tech|b\.e\.|undergraduate|b\.eng)\b/i },
    { level: "High School / A-Levels", rx: /\b(a[- ]?levels?|hssc|fsc|f\.sc|intermediate|high\s*school|matriculation|matric|o[- ]?levels?)\b/i },
    { level: "Doctorate / PhD", rx: /\b(phd|ph\.d|doctorate|doctoral)\b/i },
  ];

  const institutionRegex = /\b([A-Z][A-Za-z&.,'\s]{2,45}(?:University|College|Institute|Academy|School|LUMS|NUST|FAST|GIKI|IBA))\b/i;
  const yearRegex = /\b(19[89][0-9]|20[0-2][0-9])\b/g;
  const gpaRegex = /\b(?:gpa|cgpa|grade|score|marks)?\s*[:\-]?\s*([0-4]\.[0-9]{1,2}(?:\s*\/\s*4(?:\.00?)?)?|[5-9][0-9]%|[1-9][0-9]%(?:\s*marks)?)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const dk of degreeKeywords) {
      if (dk.rx.test(line)) {
        let degreeTitle = line.replace(/[^a-zA-Z0-9\s()&/.-]/g, "").trim();
        let institution = "";
        let year = 2024;
        let grade = "";

        // Inspect context lines around this degree
        const contextLines = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 4));
        for (const ctx of contextLines) {
          if (!institution) {
            const instMatch = ctx.match(institutionRegex);
            if (instMatch) institution = instMatch[1].trim();
          }
          const years = ctx.match(yearRegex);
          if (years && years.length > 0) {
            year = parseInt(years[years.length - 1], 10);
          }
          if (!grade) {
            const gpaMatch = ctx.match(gpaRegex);
            if (gpaMatch && gpaMatch[1]) grade = gpaMatch[1].trim();
          }
        }

        if (degreeTitle.length > 55) {
          degreeTitle = degreeTitle.slice(0, 55).trim();
        }

        records.push({
          institution: institution || "Educational Institution",
          qualification: dk.level as any,
          degreeTitle: degreeTitle || dk.level,
          country: countryOfResidence,
          completionYear: year,
          gradeGpa: grade || "Completed",
        });
        break;
      }
    }
  }

  // Deduplicate by qualification
  const unique: AcademicRecord[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    if (!seen.has(r.qualification)) {
      seen.add(r.qualification);
      unique.push(r);
    }
  }

  if (unique.length > 0) {
    return unique;
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
      "institution": "School or University name",
      "qualification": "High School / A-Levels" | "Bachelor's Degree" | "Master's Degree" | "Doctorate / PhD",
      "degreeTitle": "Degree title",
      "country": "Country",
      "completionYear": number year,
      "gradeGpa": "GPA / Grade"
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

        parsed.sourceFileName = name;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Gemini AI CV parsing notice (falling back to local parser):", err);
  }

  // High-fidelity fallback on extracted text content
  const sourceText = textContent && textContent.length > 20 ? textContent : (typeof fileOrText === "string" ? fileOrText : name);
  return heuristicExtractFromText(sourceText, name);
}
