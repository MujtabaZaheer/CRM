import { describe, it, expect } from "vitest";
import {
  cleanCandidateName,
  isValidPhone,
  toCountryName,
  toNationalityDemonym,
  heuristicExtractFromText,
} from "./cvExtractor";

describe("CV Extractor & Document Parser", () => {
  it("should cleanly strip numeric IDs and file suffixes from student names", () => {
    expect(cleanCandidateName("Khawaja Tariq Mahmood 271016")).toBe("Khawaja Tariq Mahmood");
    expect(cleanCandidateName("Khawaja_Tariq_Mahmood_271016.pdf")).toBe("Khawaja Tariq Mahmood");
    expect(cleanCandidateName("tariq mahmood")).toBe("Tariq Mahmood");
    expect(cleanCandidateName("khawaja")).toBe("Khawaja");
  });

  it("should reject corrupted/repeating binary phone numbers like 222222222222222 and accept valid phone numbers", () => {
    expect(isValidPhone("222222222222222")).toBe(false);
    expect(isValidPhone("0000000000")).toBe(false);
    expect(isValidPhone("1111111111")).toBe(false);
    expect(isValidPhone("123")).toBe(false); // too short

    expect(isValidPhone("+92 300 1234567")).toBe(true);
    expect(isValidPhone("0321 8765432")).toBe(true);
    expect(isValidPhone("+44 7123 456789")).toBe(true);
  });

  it("should correctly convert between demonyms and country names", () => {
    expect(toCountryName("Pakistani")).toBe("Pakistan");
    expect(toCountryName("British")).toBe("United Kingdom");
    expect(toCountryName("American")).toBe("United States");
    expect(toCountryName("Canadian")).toBe("Canada");

    expect(toNationalityDemonym("Pakistan")).toBe("Pakistani");
    expect(toNationalityDemonym("United Kingdom")).toBe("British");
    expect(toNationalityDemonym("United States")).toBe("American");
  });

  it("should extract full profile including DOB, email, clean name and education from CV text", () => {
    const cvText = `
Khawaja Tariq Mahmood
Email: tariq512@yahoo.com
Phone: +92 300 9876543
Date of Birth: 27/10/1998
Gender: Male
Nationality: Pakistani
Country of Residence: Pakistan
City: Lahore

EDUCATION:
Bachelor of Science in Computer Science (2018 - 2022)
FAST National University, Lahore
CGPA: 3.65 / 4.00

Intermediate Pre-Engineering (2016 - 2018)
Punjab Group of Colleges, Lahore
Grade: 84%
    `;

    const result = heuristicExtractFromText(cvText, "Khawaja Tariq Mahmood 271016.pdf");

    expect(result.fullName).toBe("Khawaja Tariq Mahmood");
    expect(result.firstName).toBe("Khawaja");
    expect(result.lastName).toBe("Tariq Mahmood");
    expect(result.email).toBe("tariq512@yahoo.com");
    expect(result.phone).toBe("+92 300 9876543");
    expect(result.dob).toBe("1998-10-27");
    expect(result.gender).toBe("Male");
    expect(result.nationality).toBe("Pakistani");
    expect(result.countryOfResidence).toBe("Pakistan");
    expect(result.city).toBe("Lahore");
    expect(result.academicRecords?.length).toBeGreaterThanOrEqual(1);
    expect(result.academicRecords?.[0].institution).toContain("FAST");
  });

  it("should safely handle corrupt text with numbers in filename without mangling name or accepting junk phone numbers", () => {
    const corruptText = `
Some unparsed stream text with binary remnants
222222222222222
tariq512@yahoo.com
Pakistan
    `;

    const result = heuristicExtractFromText(corruptText, "Khawaja Tariq Mahmood 271016.pdf");

    // Name must be cleaned of 271016
    expect(result.fullName).toBe("Khawaja Tariq Mahmood");
    expect(result.firstName).toBe("Khawaja");
    expect(result.lastName).toBe("Tariq Mahmood");
    expect(result.email).toBe("tariq512@yahoo.com");

    // Phone MUST NOT be 222222222222222
    expect(result.phone).not.toContain("222222222222222");
  });
});
