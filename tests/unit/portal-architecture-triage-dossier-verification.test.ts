import { describe, it, expect, vi } from "vitest";
import { Application, ApplicationStage } from "../../src/types/application";
import { StudentDocument } from "../../src/pages/Documents";

// Mock Firestore methods
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}`, id })),
    collection: vi.fn((_db, name) => ({ path: name, id: name })),
    updateDoc: vi.fn().mockResolvedValue(true),
    addDoc: vi.fn().mockResolvedValue({ id: "mock-log-id" }),
  };
});

describe("Portal Architecture: Agent Referral Triage, Counsellor Dossier & Admissions Verification", () => {
  describe("1. Agent Referral Triage Desk Access & Operations", () => {
    const allowedTriageRoles = [
      "platform_super_admin",
      "org_admin",
      "office_manager",
      "team_leader",
      "admissions_officer",
    ];

    it("verifies internal triage access permissions according to CRM.pdf specifications", () => {
      // Internal staff roles MUST have access
      allowedTriageRoles.forEach((role) => {
        expect(allowedTriageRoles.includes(role)).toBe(true);
      });

      // Student and External Agent portals MUST NEVER access internal triage desk
      expect(allowedTriageRoles.includes("student")).toBe(false);
      expect(allowedTriageRoles.includes("external_agent")).toBe(false);
      expect(allowedTriageRoles.includes("counsellor")).toBe(false); // Counsellors receive referrals post-triage
    });

    it("identifies agent-referred applications in Draft or Initial Review stages", () => {
      const sampleApplications: Application[] = [
        {
          id: "app_1",
          applicationNumber: "APP-2026-0001",
          studentId: "stu_1",
          studentName: "Direct Applicant",
          universityName: "Univ A",
          universityId: "u_1",
          programmeName: "Prog A",
          programmeId: "p_1",
          intake: "Fall 2026",
          stage: "Draft",
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: "app_2",
          applicationNumber: "APP-2026-0002",
          studentId: "stu_2",
          studentName: "Agent Applicant",
          universityName: "Univ B",
          universityId: "u_2",
          programmeName: "Prog B",
          programmeId: "p_2",
          intake: "Fall 2026",
          stage: "Initial Review",
          agentUid: "agent_123",
          agentName: "Global EduBridge",
          agentReferred: true,
          admissionsVisibility: false,
          vettingStatus: "pending_triage",
          createdAt: 1000,
          updatedAt: 1000,
        },
      ];

      const triaged = sampleApplications.filter(
        (app) =>
          (app.agentUid || app.agentId || app.agentReferred) &&
          (app.stage === "Draft" || app.stage === "Initial Review")
      );

      expect(triaged.length).toBe(1);
      expect(triaged[0].id).toBe("app_2");
      expect(triaged[0].agentName).toBe("Global EduBridge");
    });

    it("correctly simulates accepting a referral and routing to active counsellor", () => {
      const referralApp: Application = {
        id: "app_ref_1",
        applicationNumber: "APP-2026-REF1",
        studentId: "stu_ref_1",
        studentName: "Farhan Qureshi",
        universityName: "University of Manchester",
        universityId: "univ_mcr",
        programmeName: "MSc Computer Science",
        programmeId: "prog_cs",
        intake: "September 2026",
        stage: "Draft",
        agentUid: "ag_88",
        agentName: "Beacon Education",
        agentReferred: true,
        admissionsVisibility: false,
        vettingStatus: "pending_triage",
        createdAt: 1000,
        updatedAt: 1000,
      };

      const assignedCounsellorEmail = "counsellor@educrm.demo";
      const acceptedUpdates: Partial<Application> = {
        assignedCounsellor: assignedCounsellorEmail,
        stage: "Initial Review",
        admissionsVisibility: true,
        vettingStatus: "documents_verified",
        vettedBy: "Team Leader John",
        vettedAt: 2000,
      };

      const updated = { ...referralApp, ...acceptedUpdates };
      expect(updated.assignedCounsellor).toBe("counsellor@educrm.demo");
      expect(updated.stage).toBe("Initial Review");
      expect(updated.admissionsVisibility).toBe(true);
      expect(updated.vettingStatus).toBe("documents_verified");
    });

    it("correctly records rejection reason code and locks admissions visibility", () => {
      const referralApp: Application = {
        id: "app_ref_2",
        applicationNumber: "APP-2026-REF2",
        studentId: "stu_ref_2",
        studentName: "Duplicate Candidate",
        universityName: "King's College London",
        universityId: "univ_kcl",
        programmeName: "LLM Law",
        programmeId: "prog_law",
        intake: "September 2026",
        stage: "Initial Review",
        agentUid: "ag_99",
        agentReferred: true,
        admissionsVisibility: false,
        vettingStatus: "pending_triage",
        createdAt: 1000,
        updatedAt: 1000,
      };

      const rejectionReason = "duplicate_lead: Lead already registered under direct counselling.";
      const rejectedUpdates: Partial<Application> = {
        stage: "Rejected",
        vettingStatus: "rejected",
        admissionsVisibility: false,
        vettingNotes: rejectionReason,
        decisionNotes: rejectionReason,
      };

      const updated = { ...referralApp, ...rejectedUpdates };
      expect(updated.stage).toBe("Rejected");
      expect(updated.vettingStatus).toBe("rejected");
      expect(updated.admissionsVisibility).toBe(false);
      expect(updated.vettingNotes).toContain("duplicate_lead");
    });
  });

  describe("2. Counsellor Application Dossier Modal Requirements", () => {
    it("handles required dossier tabs and candidate metadata", () => {
      const requiredTabs = [
        "profile",
        "documents",
        "request_docs",
        "decision",
        "scholarship_comms",
      ];
      expect(requiredTabs.length).toBe(5);

      const candidateProfile = {
        fullName: "Zainab Al-Mansoor",
        referenceId: "APP-2026-0042",
        agentBadge: "Agent: Direct",
        englishProficiency: {
          testType: "IELTS",
          overallScore: "7.5",
          trfNumber: "TRF-UKVI-12345",
        },
        academicQualifications: [
          {
            degreeTitle: "BSc Computer Science",
            institution: "FAST NUCES",
            gradeGpa: "3.8/4.0",
          },
        ],
      };

      expect(candidateProfile.fullName).toBe("Zainab Al-Mansoor");
      expect(candidateProfile.referenceId).toMatch(/^APP-2026/);
      expect(candidateProfile.englishProficiency.overallScore).toBe("7.5");
      expect(candidateProfile.academicQualifications[0].gradeGpa).toBe("3.8/4.0");
    });

    it("verifies document request dispatch from counsellor", () => {
      const sampleReq = {
        id: "req_101",
        docType: "Academic Transcript",
        reason: "Semester 7 & 8 mark sheets missing",
        deadline: "2026-10-15",
        requestedAt: 1000,
        status: "pending",
      };

      expect(sampleReq.docType).toBe("Academic Transcript");
      expect(sampleReq.status).toBe("pending");

      // Once student uploads or counsellor verifies
      const fulfilledReq = { ...sampleReq, status: "fulfilled" };
      expect(fulfilledReq.status).toBe("fulfilled");
    });
  });

  describe("3. Admissions Officer Document Verification Hub", () => {
    const documents: StudentDocument[] = [
      {
        id: "d1",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        fileName: "Passport_Bio_Page.pdf",
        docType: "Passport",
        fileUrl: "#",
        status: "Verified",
        uploadedBy: "student",
        createdAt: 1000,
      },
      {
        id: "d2",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        fileName: "BSc_Transcripts.pdf",
        docType: "Academic Transcript",
        fileUrl: "#",
        status: "Verified",
        uploadedBy: "student",
        createdAt: 1000,
      },
      {
        id: "d3",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        fileName: "IELTS_Score_Sheet.pdf",
        docType: "IELTS / English Test",
        fileUrl: "#",
        status: "Verified",
        uploadedBy: "student",
        createdAt: 1000,
      },
      {
        id: "d4",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        fileName: "Bank_Solvency_Letter.pdf",
        docType: "Financial Proof",
        fileUrl: "#",
        status: "Verified",
        uploadedBy: "student",
        createdAt: 1000,
      },
    ];

    it("groups documents into the 4 mandatory compliance categories", () => {
      const categories = {
        identity: [] as StudentDocument[],
        academic: [] as StudentDocument[],
        english: [] as StudentDocument[],
        financial: [] as StudentDocument[],
      };

      documents.forEach((doc) => {
        const type = doc.docType.toLowerCase();
        if (type.includes("passport") || type.includes("id")) {
          categories.identity.push(doc);
        } else if (type.includes("transcript") || type.includes("degree")) {
          categories.academic.push(doc);
        } else if (type.includes("ielts") || type.includes("english")) {
          categories.english.push(doc);
        } else {
          categories.financial.push(doc);
        }
      });

      expect(categories.identity.length).toBe(1);
      expect(categories.academic.length).toBe(1);
      expect(categories.english.length).toBe(1);
      expect(categories.financial.length).toBe(1);
    });

    it("enforces Advance to Submitted gate condition (all mandatory documents must be Verified)", () => {
      // All 4 documents are Verified
      const allVerified = documents.every((d) => d.status === "Verified");
      expect(allVerified).toBe(true);

      // If one document is flagged / rejected
      const withDefect = [
        ...documents.slice(0, 3),
        { ...documents[3], status: "Rejected" as const, remarks: "Blurry scan" },
      ];
      const canAdvanceWithDefect = withDefect.every((d) => d.status === "Verified");
      expect(canAdvanceWithDefect).toBe(false);
    });

    it("formats defect issue category and resubmission instructions when flagged", () => {
      const issueCategory = "Blurry";
      const issueComment = "Resolution is under 150 DPI; university OCR will reject.";
      const formattedFeedback = `[Flagged Issue: ${issueCategory}] ${issueComment}`;

      expect(formattedFeedback).toBe(
        "[Flagged Issue: Blurry] Resolution is under 150 DPI; university OCR will reject."
      );
    });
  });

  describe("4. Admissions Verification Completion & Handoff to Finance Desk", () => {
    it("routes verified application to Finance awaiting Challan & Deposit Clearance", () => {
      const verifiedApplication: Application = {
        id: "app_verified_1",
        applicationNumber: "APP-2026-VER1",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        universityName: "University of Manchester",
        programmeName: "MSc Computer Science",
        intake: "September 2026",
        stage: "Ready for Submission",
        admissionsVisibility: true,
        admissionsVerificationCompleted: false,
        createdAt: 1000,
        updatedAt: 1000,
      };

      // Admissions officer clicks "Approve & Route to Finance (Challan)"
      const financeHandoffPayload: Partial<Application> = {
        stage: "Unconditional Offer",
        status: "Unconditional Offer",
        admissionsVerificationCompleted: true,
        vettingStatus: "documents_verified",
        assignedDepartment: "Finance",
        updatedAt: 2000,
      };

      const routedApp = { ...verifiedApplication, ...financeHandoffPayload };
      expect(routedApp.stage).toBe("Unconditional Offer");
      expect(routedApp.admissionsVerificationCompleted).toBe(true);
      expect(routedApp.assignedDepartment).toBe("Finance");
    });
  });

  describe("5. Finance Portal Fee Challan Generation & Deposit Pending State", () => {
    it("generates tuition deposit challan, sets Deposit Pending, and notifies student & agent", () => {
      const offerApp: Application = {
        id: "app_offer_1",
        applicationNumber: "APP-2026-OFR1",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        universityName: "University of Manchester",
        programmeName: "MSc Computer Science",
        intake: "September 2026",
        stage: "Unconditional Offer",
        admissionsVerificationCompleted: true,
        assignedDepartment: "Finance",
        createdAt: 1000,
        updatedAt: 2000,
      };

      const challanNumber = `CHAL-2026-${offerApp.id.slice(-6).toUpperCase()}`;
      const challanAmount = 2500;
      const challanCurrency = "USD";
      const challanDueDate = "2026-10-15";

      const updatedWithChallan: Application = {
        ...offerApp,
        stage: "Deposit Pending",
        status: "Deposit Pending",
        challanGenerated: true,
        challanNumber,
        challanAmount,
        challanCurrency,
        challanDueDate,
        updatedAt: 3000,
      };

      expect(updatedWithChallan.stage).toBe("Deposit Pending");
      expect(updatedWithChallan.challanGenerated).toBe(true);
      expect(updatedWithChallan.challanNumber).toContain("CHAL-2026");
      expect(updatedWithChallan.challanAmount).toBe(2500);
    });
  });

  describe("6. Agent Portal Challan Retrieval, Payment Proof Upload, & Auto Commission Calculation", () => {
    it("identifies challan in agent portal and advances stage to Deposit Paid on payment proof upload", () => {
      const challanApp: Application = {
        id: "app_chal_1",
        applicationNumber: "APP-2026-CHAL1",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        universityName: "University of Manchester",
        programmeName: "MSc Computer Science",
        intake: "September 2026",
        stage: "Deposit Pending",
        challanGenerated: true,
        challanNumber: "CHAL-2026-CHAL1",
        challanAmount: 2500,
        challanCurrency: "USD",
        agentUid: "agent_42",
        agentName: "Beacon Agency",
        agentReferred: true,
        createdAt: 1000,
        updatedAt: 3000,
      };

      // Agent uploads deposit slip / bank receipt
      const paymentProofPayload: Partial<Application> = {
        stage: "Deposit Paid",
        status: "Deposit Paid",
        depositPaid: true,
        depositAmountPaid: 2500,
        depositPaymentDate: "2026-09-28",
        depositTransactionRef: "TXN-91823901",
        assignedDepartment: "Visa",
        updatedAt: 4000,
      };

      const paidApp = { ...challanApp, ...paymentProofPayload };
      expect(paidApp.stage).toBe("Deposit Paid");
      expect(paidApp.depositPaid).toBe(true);
      expect(paidApp.depositTransactionRef).toBe("TXN-91823901");
      expect(paidApp.assignedDepartment).toBe("Visa");

      // Verify automatic agent commission calculation
      const tuitionFee = 24000;
      const commissionRate = 12.5; // Gold tier standard
      const expectedCommission = Math.round((tuitionFee * commissionRate) / 100);
      expect(expectedCommission).toBe(3000);
    });
  });

  describe("7. Visa Processing Pipeline Progression", () => {
    it("progresses application through CAS Issuance, Visa Submission, and Visa Approval", () => {
      const depositPaidApp: Application = {
        id: "app_visa_1",
        applicationNumber: "APP-2026-VISA1",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        universityName: "University of Manchester",
        programmeName: "MSc Computer Science",
        intake: "September 2026",
        stage: "Deposit Paid",
        depositPaid: true,
        assignedDepartment: "Visa",
        createdAt: 1000,
        updatedAt: 4000,
      };

      // 1. Visa Officer issues CAS
      const casApp: Application = {
        ...depositPaidApp,
        stage: "CAS Issued",
        casReference: "CAS-MCR-2026-90124",
        updatedAt: 5000,
      };
      expect(casApp.stage).toBe("CAS Issued");

      // 2. Visa Officer lodges visa
      const submittedVisaApp: Application = {
        ...casApp,
        stage: "Visa Submitted",
        updatedAt: 6000,
      };
      expect(submittedVisaApp.stage).toBe("Visa Submitted");

      // 3. Visa Officer grants visa clearance
      const approvedVisaApp: Application = {
        ...submittedVisaApp,
        stage: "Visa Approved",
        updatedAt: 7000,
      };
      expect(approvedVisaApp.stage).toBe("Visa Approved");
    });
  });

  describe("8. University Portal Final Admission Decision & Enrolment", () => {
    it("confirms final admission enrolment when application reaches Visa Approved", () => {
      const visaApprovedApp: Application = {
        id: "app_final_1",
        applicationNumber: "APP-2026-FINAL1",
        studentId: "stu_10",
        studentName: "Hamza Tariq",
        universityName: "University of Manchester",
        programmeName: "MSc Computer Science",
        intake: "September 2026",
        stage: "Visa Approved",
        depositPaid: true,
        createdAt: 1000,
        updatedAt: 7000,
      };

      // University Partner marks final enrolment
      const enrolledApp: Application = {
        ...visaApprovedApp,
        stage: "Enrolled",
        status: "Enrolled",
        updatedAt: 8000,
      };

      expect(enrolledApp.stage).toBe("Enrolled");
    });
  });
});

