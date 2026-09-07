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

  it("should accurately extract multiple academic degrees with correct institutions, years, and GPAs", () => {
    const multiDegreeCv = `
Zainab Tariq
Email: zainab.tariq@gmail.com
Phone: +92 321 8765432
Country: Pakistan

ACADEMIC QUALIFICATIONS:
1. Bachelor of Science in Software Engineering (2020 - 2024)
   Lahore University of Management Sciences (LUMS), Pakistan
   CGPA: 3.78 / 4.00
   Major: Distributed Systems & Machine Learning

2. Higher Secondary School Certificate (F.Sc Pre-Engineering, 2018 - 2020)
   Kinnaird College for Women, Lahore
   Grade: A+ (88%)
    `;

    const result = heuristicExtractFromText(multiDegreeCv);

    expect(result.academicRecords).toBeDefined();
    expect(result.academicRecords!.length).toBe(2);

    // Record 1: Bachelor's
    const bachelors = result.academicRecords![0];
    expect(bachelors.qualification).toBe("Bachelor's Degree");
    expect(bachelors.degreeTitle).toContain("Bachelor of Science in Software Engineering");
    expect(bachelors.institution).toContain("Lahore University of Management Sciences");
    expect(bachelors.completionYear).toBe(2024);
    expect(bachelors.gradeGpa).toContain("3.78");

    // Record 2: High School
    const intermediate = result.academicRecords![1];
    expect(intermediate.qualification).toBe("High School / A-Levels");
    expect(intermediate.institution).toContain("Kinnaird College");
    expect(intermediate.completionYear).toBe(2020);
    expect(intermediate.gradeGpa).toContain("88%");
  });

  it("should extract institutions starting with 'University of ...' properly instead of generic fallbacks", () => {
    const univOfCv = `
Muhammad Usman
Email: usman@example.com
Phone: +92 333 1122334

EDUCATION:
• Master of Science in Computer Science (2022 - 2024)
  University of the Punjab, Lahore
  CGPA: 3.85 / 4.00
• Bachelor of Science in Information Technology (2018 - 2022)
  University of Engineering and Technology, Lahore
  CGPA: 3.60 / 4.00
    `;

    const result = heuristicExtractFromText(univOfCv);
    expect(result.academicRecords!.length).toBe(2);

    expect(result.academicRecords![0].institution).toContain("University of the Punjab");
    expect(result.academicRecords![0].qualification).toBe("Master's Degree");
    expect(result.academicRecords![0].completionYear).toBe(2024);

    expect(result.academicRecords![1].institution).toContain("University of Engineering and Technology");
    expect(result.academicRecords![1].qualification).toBe("Bachelor's Degree");
    expect(result.academicRecords![1].completionYear).toBe(2022);
  });

  it("should extract 3 or 4 qualifications without dropping intermediate or matriculation", () => {
    const fullAcademicCv = `
Ahmad Raza
Email: ahmad.raza@example.com
Phone: +92 301 5544332
Country: Pakistan

EDUCATION:
Master of Science in Data Science (2022 - 2024)
National University of Sciences and Technology (NUST), Islamabad
CGPA: 3.82 / 4.00

Bachelor of Science in Computer Science (2018 - 2022)
FAST National University, Islamabad
CGPA: 3.55 / 4.00

F.Sc Pre-Engineering (2016 - 2018)
Punjab Group of Colleges, Rawalpindi
Marks: 85%

Matriculation in Science (2014 - 2016)
Army Public School (APS), Rawalpindi
Grade: A+ (88%)
    `;

    const result = heuristicExtractFromText(fullAcademicCv);
    expect(result.academicRecords).toBeDefined();
    expect(result.academicRecords!.length).toBe(4);

    // Latest first: Master's
    expect(result.academicRecords![0].qualification).toBe("Master's Degree");
    expect(result.academicRecords![0].institution).toContain("NUST");
    expect(result.academicRecords![0].completionYear).toBe(2024);
    expect(result.academicRecords![0].gradeGpa).toContain("3.82");

    // Bachelor's
    expect(result.academicRecords![1].qualification).toBe("Bachelor's Degree");
    expect(result.academicRecords![1].institution).toContain("FAST");
    expect(result.academicRecords![1].completionYear).toBe(2022);
    expect(result.academicRecords![1].gradeGpa).toContain("3.55");

    // F.Sc
    expect(result.academicRecords![2].qualification).toBe("High School / A-Levels");
    expect(result.academicRecords![2].degreeTitle).toContain("F.Sc");
    expect(result.academicRecords![2].institution).toContain("Punjab Group of Colleges");
    expect(result.academicRecords![2].completionYear).toBe(2018);

    // Matric
    expect(result.academicRecords![3].qualification).toBe("High School / A-Levels");
    expect(result.academicRecords![3].degreeTitle).toContain("Matriculation");
    expect(result.academicRecords![3].institution).toContain("Army Public School");
    expect(result.academicRecords![3].completionYear).toBe(2016);
  });

  it("should extract inline qualifications with 'from <Institution>' accurately", () => {
    const inlineCv = `
Sana Sheikh
Email: sana.sheikh@test.com
Phone: +92 345 9988776

ACADEMIC BACKGROUND:
• BS Electrical Engineering from UET Lahore (2019 - 2023), CGPA: 3.68
• A-Levels Pre-Engineering from Beaconhouse School System (2017 - 2019), Grade: 3 A*s
    `;

    const result = heuristicExtractFromText(inlineCv);
    expect(result.academicRecords!.length).toBe(2);

    expect(result.academicRecords![0].institution).toContain("UET Lahore");
    expect(result.academicRecords![0].degreeTitle).toContain("BS Electrical Engineering");
    expect(result.academicRecords![0].completionYear).toBe(2023);
    expect(result.academicRecords![0].gradeGpa).toContain("3.68");

    expect(result.academicRecords![1].institution).toContain("Beaconhouse");
    expect(result.academicRecords![1].degreeTitle).toContain("A-Levels");
    expect(result.academicRecords![1].completionYear).toBe(2019);
  });

  it("should never cause Maximum call stack size exceeded or infinite recursion when education section contains unparsed text", () => {
    const unparsedSectionCv = `
Applicant Name
Email: applicant@example.com
Phone: +92 300 1234567

EDUCATION:
Some arbitrary description or bullet points without standard degree keywords
Self-taught programming and online tutorials
EXPERIENCE:
Software developer at company
    `;

    // Must return safely without throwing RangeError: Maximum call stack size exceeded
    expect(() => {
      const result = heuristicExtractFromText(unparsedSectionCv);
      expect(result.academicRecords).toBeDefined();
    }).not.toThrow();
  });
});
