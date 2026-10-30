import { describe, expect, it } from "vitest";
import { hydrateStudentProfile, readStudentProfileSessionCache } from "./studentProfileHydration";

describe("hydrateStudentProfile", () => {
  it("uses students, then users, then registration/session cache for each field", () => {
    const profile = hydrateStudentProfile({
      students: {
        fullName: "Student Document Name",
        phone: "+1 student",
        academicHistory: [{ institution: "Student University" }],
        englishProficiency: { testType: "PTE", overallScore: "70" },
      },
      users: {
        fullName: "User Document Name",
        phone: "+1 user",
        nationality: "Canada",
        passportNumber: "USER123",
        academicHistory: [{ institution: "User University" }],
        englishProficiency: { testType: "IELTS", overallScore: "7" },
      },
      registrationCache: {
        student_registration_first_name: "Cache",
        student_registration_last_name: "Student",
        student_registration_phone: "+1 cache",
        student_registration_country: "Canada",
        student_registration_nationality: "Canadian",
        passportNumber: "CACHE123",
        academicRecords: [{ institution: "Cache University" }],
        englishProficiency: { testType: "TOEFL", overallScore: "100" },
      },
    });

    expect(profile.fullName).toBe("Student Document Name");
    expect(profile.phone).toBe("+1 student");
    expect(profile.nationality).toBe("Canada");
    expect(profile.passportNumber).toBe("USER123");
    expect(profile.academicHistory[0].institution).toBe("Student University");
    expect(profile.englishProficiency).toMatchObject({ testType: "PTE", overallScore: "70" });

    const partialProfile = hydrateStudentProfile({
      students: { englishProficiency: { testType: "PTE" } },
      users: { englishProficiency: { overallScore: "70" } },
      registrationCache: { englishProficiency: { testType: "IELTS", overallScore: "6.5" } },
    });
    expect(partialProfile.englishProficiency).toMatchObject({ testType: "PTE", overallScore: "70" });
  });

  it("hydrates all supported fields from cache and leaves absent values blank", () => {
    const profile = hydrateStudentProfile({
      registrationCache: {
        student_registration_first_name: "Cache",
        student_registration_last_name: "Student",
        student_registration_phone: "+1 555",
        student_registration_country: "Canada",
        student_registration_nationality: "Canada",
        city: "Toronto",
        dob: "2000-01-02",
        gender: "Female",
        passportNumber: "AB1234567",
        academicRecords: [{ institution: "Cache University" }],
        englishProficiency: { testType: "IELTS", overallScore: "7.5" },
      },
    });

    expect(profile).toMatchObject({
      firstName: "Cache",
      lastName: "Student",
      fullName: "Cache Student",
      phone: "+1 555",
      countryOfResidence: "Canada",
      nationality: "Canada",
      city: "Toronto",
      dob: "2000-01-02",
      gender: "Female",
      passportNumber: "AB1234567",
    });
    expect(profile.academicHistory).toHaveLength(1);
    expect(profile.englishProficiency?.overallScore).toBe("7.5");

    const empty = hydrateStudentProfile({});
    expect(empty.fullName).toBe("");
    expect(empty.countryOfResidence).toBe("");
    expect(empty.academicHistory).toEqual([]);
    expect(empty.englishProficiency).toBeUndefined();
  });

  it("reads registration and JSON session caches without accessing browser globals", () => {
    const values: Record<string, string> = {
      student_registration_first_name: "Cache",
      student_profile_cache: JSON.stringify({ passportNumber: "AB1234567" }),
    };
    const cache = readStudentProfileSessionCache((key) => values[key] || null);
    const profile = hydrateStudentProfile({ registrationCache: cache });

    expect(profile.firstName).toBe("Cache");
    expect(profile.passportNumber).toBe("AB1234567");
  });
});
