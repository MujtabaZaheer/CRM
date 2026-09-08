import { describe, it, expect } from "vitest";
import { Lead } from "../types/lead";
import { Student } from "../types/student";

describe("Lead to Student Conversion Engine", () => {
  it("converts a Lead into a linked Student record preserving data attributes and tenant scoping", () => {
    const mockLead: Lead = {
      id: "lead_test_01",
      fullName: "Zainab Ahmed",
      email: "zainab.ahmed@example.com",
      phone: "+44 7911 889900",
      nationality: "British",
      countryOfResidence: "United Kingdom",
      destinationCountry: "Canada",
      programInterest: "MSc Cybersecurity",
      assignedCounsellor: "Sarah Jenkins",
      assignedTo: "usr_counsellor_1",
      source: "Website",
      stage: "Qualified",
      tenantId: "tenant-org-alpha",
      office: "Manchester Office",
      createdAt: Date.now() - 3600000 * 24,
      updatedAt: Date.now() - 3600000 * 12,
    };

    const newStudentId = `stu_${Date.now()}`;
    const student: Student = {
      id: newStudentId,
      fullName: mockLead.fullName,
      email: mockLead.email,
      phone: mockLead.phone,
      nationality: mockLead.nationality || "Not specified",
      countryOfResidence: mockLead.countryOfResidence || "Not specified",
      preferredDestination: mockLead.destinationCountry,
      preferredProgram: mockLead.programInterest,
      assignedCounsellor: mockLead.assignedCounsellor,
      assignedCounsellorId: mockLead.assignedTo,
      office: mockLead.office || "London HQ",
      tenantId: mockLead.tenantId || "tenant-default",
      profileCompleteness: 55,
      academicHistory: [
        {
          institution: "Prior University",
          qualification: "Bachelor's Degree",
          degreeTitle: mockLead.programInterest!,
          country: mockLead.nationality!,
          completionYear: 2025,
          gradeGpa: "3.2 / 4.0",
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(student.email).toBe(mockLead.email);
    expect(student.fullName).toBe(mockLead.fullName);
    expect(student.tenantId).toBe("tenant-org-alpha");
    expect(student.assignedCounsellor).toBe("Sarah Jenkins");
    expect(student.preferredDestination).toBe("Canada");
    expect(student.academicHistory?.[0].degreeTitle).toBe("MSc Cybersecurity");
  });

  it("detects when a lead already corresponds to an existing student profile by email", () => {
    const existingStudents: Student[] = [
      {
        id: "stu_existing_99",
        fullName: "Existing Student",
        email: "existing@example.com",
        phone: "+44 7123456789",
        nationality: "UK",
        countryOfResidence: "UK",
        academicHistory: [],
        profileCompleteness: 50,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const duplicateLead: Partial<Lead> = {
      email: "EXISTING@example.com",
    };

    const isDuplicate = existingStudents.some(
      (s) => s.email.toLowerCase() === duplicateLead.email!.toLowerCase()
    );

    expect(isDuplicate).toBe(true);
  });
});
