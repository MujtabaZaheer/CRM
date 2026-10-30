import type { AcademicRecord, EnglishTestScore, Student } from "../types/student";

export interface StudentProfileHydrationSources {
  students?: Record<string, unknown> | Partial<Student> | null;
  users?: Record<string, unknown> | Partial<Student> | null;
  registrationCache?: Record<string, unknown> | Partial<Student> | null;
}

export interface HydratedStudentProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  countryOfResidence: string;
  nationality: string;
  city: string;
  dob: string;
  gender: Student["gender"] | "";
  passportNumber: string;
  academicHistory: AcademicRecord[];
  englishProficiency?: EnglishTestScore;
}

const isPresent = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null;
};

const valueFrom = (source: Record<string, unknown> | null | undefined, keys: string[]): unknown => {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (isPresent(value)) return value;
  }
  return undefined;
};

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const asRecords = (value: unknown): AcademicRecord[] | undefined => {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value as AcademicRecord[];
};

const asEnglish = (source: Record<string, unknown> | null | undefined): EnglishTestScore | undefined => {
  const direct = valueFrom(source, ["englishProficiency", "englishTest"]);
  const legacyScores = source?.testScores as Record<string, unknown> | undefined;
  const legacyIelts = legacyScores?.ielts as Record<string, unknown> | undefined;
  const candidate = (direct || (legacyIelts ? {
    testType: "IELTS",
    overallScore: legacyIelts.overall,
  } : undefined)) as Record<string, unknown> | undefined;

  if (!candidate) return undefined;
  const overallScore = asText(candidate.overallScore ?? candidate.overall);
  const testType = asText(candidate.testType);
  if (!overallScore && !testType) return undefined;

  return {
    testType: (testType || "") as EnglishTestScore["testType"],
    overallScore,
    ...(asText(candidate.testDate) ? { testDate: asText(candidate.testDate) } : {}),
    ...(asText(candidate.expiryDate) ? { expiryDate: asText(candidate.expiryDate) } : {}),
  };
};

const mergeEnglish = (
  student: Record<string, unknown> | null | undefined,
  user: Record<string, unknown> | null | undefined,
  cache: Record<string, unknown>,
): EnglishTestScore | undefined => {
  const studentEnglish = asEnglish(student);
  const userEnglish = asEnglish(user);
  const cacheEnglish = asEnglish(cache);
  const testType = studentEnglish?.testType || userEnglish?.testType || cacheEnglish?.testType || "";
  const overallScore = studentEnglish?.overallScore || userEnglish?.overallScore || cacheEnglish?.overallScore || "";
  if (!testType && !overallScore) return undefined;

  const testDate = studentEnglish?.testDate || userEnglish?.testDate || cacheEnglish?.testDate;
  const expiryDate = studentEnglish?.expiryDate || userEnglish?.expiryDate || cacheEnglish?.expiryDate;
  return {
    testType: testType as EnglishTestScore["testType"],
    overallScore,
    ...(testDate ? { testDate } : {}),
    ...(expiryDate ? { expiryDate } : {}),
  };
};

const mergeCacheObjects = (cache: Record<string, unknown> | null | undefined): Record<string, unknown> => {
  if (!cache) return {};
  const profileCache = cache.student_profile_cache as Record<string, unknown> | undefined;
  const extractedCache = cache.student_extracted_cv as Record<string, unknown> | undefined;
  return {
    ...(profileCache || {}),
    ...(extractedCache || {}),
    ...cache,
  };
};

/**
 * Hydrates profile fields without inventing values. Every field checks the
 * student document first, the user document second, and registration/session
 * cache last.
 */
export const hydrateStudentProfile = ({
  students,
  users,
  registrationCache,
}: StudentProfileHydrationSources): HydratedStudentProfile => {
  const student = students as Record<string, unknown> | null | undefined;
  const user = users as Record<string, unknown> | null | undefined;
  const cache = mergeCacheObjects(registrationCache);

  const pickText = (keys: string[]): string =>
    asText(valueFrom(student, keys) ?? valueFrom(user, keys) ?? valueFrom(cache, keys));

  const studentName = asText(valueFrom(student, ["fullName"]));
  const userName = asText(valueFrom(user, ["fullName", "displayName"]));
  const cacheName = asText(valueFrom(cache, ["fullName", "student_registration_full_name"]));
  const studentFirstName = asText(valueFrom(student, ["firstName"]));
  const studentLastName = asText(valueFrom(student, ["lastName"]));
  const userFirstName = asText(valueFrom(user, ["firstName"]));
  const userLastName = asText(valueFrom(user, ["lastName"]));
  const cacheFirstName = asText(valueFrom(cache, ["firstName", "student_registration_first_name"]));
  const cacheLastName = asText(valueFrom(cache, ["lastName", "student_registration_last_name"]));
  const fullName = studentName ||
    (studentFirstName || studentLastName ? [studentFirstName, studentLastName].filter(Boolean).join(" ") : "") ||
    userName ||
    (userFirstName || userLastName ? [userFirstName, userLastName].filter(Boolean).join(" ") : "") ||
    cacheName ||
    [cacheFirstName, cacheLastName].filter(Boolean).join(" ");

  const firstName =
    studentFirstName ||
    (studentName ? studentName.split(/\s+/)[0] || "" : "") ||
    userFirstName ||
    (userName ? userName.split(/\s+/)[0] || "" : "") ||
    cacheFirstName;
  const lastName =
    studentLastName ||
    (studentName ? studentName.split(/\s+/).slice(1).join(" ") : "") ||
    userLastName ||
    (userName ? userName.split(/\s+/).slice(1).join(" ") : "") ||
    cacheLastName;
  const resolvedFirstName = firstName || (fullName ? fullName.split(/\s+/)[0] || "" : "");
  const resolvedLastName = lastName || (fullName ? fullName.split(/\s+/).slice(1).join(" ") : "");

  const academicHistory =
    asRecords(valueFrom(student, ["academicHistory"]))
    || asRecords(valueFrom(user, ["academicHistory"]))
    || asRecords(valueFrom(cache, ["academicHistory", "academicRecords"]))
    || [];

  const englishProficiency = mergeEnglish(student, user, cache);

  return {
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    fullName: fullName || [resolvedFirstName, resolvedLastName].filter(Boolean).join(" "),
    email: pickText(["email"]),
    phone: pickText(["phone", "student_registration_phone"]),
    countryOfResidence: pickText(["countryOfResidence", "student_registration_country"]),
    nationality: pickText(["nationality", "student_registration_nationality"]),
    city: pickText(["city"]),
    dob: pickText(["dob", "dateOfBirth"]),
    gender: (pickText(["gender"]) || "") as Student["gender"] | "",
    passportNumber: pickText(["passportNumber"]),
    academicHistory,
    englishProficiency,
  };
};

export const readStudentProfileSessionCache = (
  getItem: (key: string) => string | null,
): Record<string, unknown> => {
  const cache: Record<string, unknown> = {};
  const keys = [
    "student_registration_first_name",
    "student_registration_last_name",
    "student_registration_full_name",
    "student_registration_phone",
    "student_registration_country",
    "student_registration_nationality",
    "student_profile_cache",
    "student_extracted_cv",
  ];

  for (const key of keys) {
    const value = getItem(key);
    if (!value) continue;
    if (key === "student_profile_cache" || key === "student_extracted_cv") {
      try {
        cache[key] = JSON.parse(value);
      } catch {
        // Ignore malformed optional cache entries.
      }
    } else {
      cache[key] = value;
    }
  }
  return cache;
};
