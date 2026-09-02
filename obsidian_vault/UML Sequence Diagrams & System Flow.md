---
tags:
  - architecture/uml
  - diagrams/sequence
date: 2026-08-18
---

# 📐 EduCRM System Flow & UML Sequence Diagrams

See also:
- [[Process Diagrams - SSD Transition BPMN]] — Complete System Sequence Diagram, State Transition Diagram, and BPMN Diagram.
- [[Student Application Lifecycle]] — Comprehensive 10-phase student pipeline from registration to enrollment.

---

## 🔄 End-to-End System Workflow

```
[1. Lead Capture] ➔ [2. Counselling & AI Match] ➔ [3. App Submission & Docs] ➔ [4. Admissions Review] ➔ [5. CAS & Visa] ➔ [6. Enrolment & Finance] ➔ [7. Audit & Quality]
```

## 1. System Sequence Diagram (SSD)

```mermaid
sequenceDiagram
    autonumber
    actor Lead as Student / Lead
    actor Agent as External Agent
    actor Counsellor as Education Counsellor
    actor Admissions as Admissions Officer
    actor Admin as Super Admin / Org Admin
    participant System as EduCRM Platform Boundary
    participant Drive as Google Drive Storage API
    participant Gemini as Google Gemini 2.0 AI API

    rect rgb(20, 30, 45)
    note right of Lead: Stage 1: Lead Ingestion & Registration
    Lead->>System: Submit Form / Register (Name, Email, Preferences)
    System-->>Lead: Send Confirmation & Provision Portal Access
    Agent->>System: Submit Referral Lead (Student Profile, Referral Code)
    System-->>Agent: Generate Referral Link & Commission Entry
    end

    rect rgb(25, 40, 35)
    note right of Counsellor: Stage 2: AI Counselling & Eligibility
    Counsellor->>System: Run AI Course Recommendation Query
    System->>Gemini: POST Prompt (GPA, IELTS, Budget, Preferences)
    Gemini-->>System: Return Ranked Universities & Rationale
    System-->>Counsellor: Display Ranked Course Matches & "Draft Application" button

    Counsellor->>System: Request AI Personal Statement (SOP)
    System->>Gemini: POST Prompt (Academic History, Career Goals)
    Gemini-->>System: Return Formatted SOP Text
    System-->>Counsellor: Display SOP Draft with Copy Action
    end

    rect rgb(35, 30, 50)
    note right of Lead: Stage 3: Document Storage & OCR
    Lead->>System: Upload Passport / Transcript File
    System->>Drive: POST Base64 File to Apps Script Endpoint
    Drive-->>System: Return Google Drive View/Download URL
    System->>Gemini: POST Document Image for Vision OCR
    Gemini-->>System: Return Extracted Name, DOB, Passport #, GPA
    System-->>Counsellor: Pre-populate Profile & Save Document Metadata
    end
```

## 2. Detailed Component Sequence Diagram (SD)

```mermaid
sequenceDiagram
    autonumber
    actor User as Counsellor / Student
    participant UI as React UI (Leads.tsx / Topbar.tsx)
    participant AuthCtx as AuthContext.tsx
    participant CounsellorHook as useCounsellorData.ts
    participant GeminiClient as geminiClient.ts
    participant DocStorage as documentStorage.ts
    participant Firestore as Cloud Firestore SDK
    participant DriveScript as Google Apps Script (Drive)
    participant GeminiAPI as Gemini 2.0 Flash REST API

    rect rgb(15, 25, 40)
    note over UI,Firestore: 1. Convert Lead to Student (Tenant-Scoped)
    User->>UI: Click "Convert Lead to Student"
    UI->>CounsellorHook: convertLeadToStudent(leadData)
    CounsellorHook->>AuthCtx: Get appUser (tenantId / office)
    CounsellorHook->>Firestore: addDoc("students", scopeDocumentWithTenant(newStudent, appUser))
    Firestore-->>CounsellorHook: Return studentDocId
    CounsellorHook->>Firestore: updateDoc("leads", leadId, { stage: "Converted" })
    CounsellorHook->>Firestore: addDoc("audit_logs", { action: "STUDENT_CONVERTED", ... })
    CounsellorHook-->>UI: Return studentDocId (Success)
    end
```

## 3. Student Self-Registration & Direct Application Submission Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Applicant
    participant UI as React UI (/register & /student/*)
    participant AuthCtx as AuthContext.tsx
    participant FireAuth as Firebase Auth
    participant PortalHook as usePortalData.ts
    participant DocStorage as documentStorage.ts
    participant Firestore as Cloud Firestore
    actor Staff as Counsellor / Admissions Desk

    rect rgb(20, 35, 45)
    note over Student,Firestore: 1. Self-Registration & Account Activation
    Student->>UI: Select Student Role & Submit /register form
    UI->>FireAuth: createUserWithEmailAndPassword(email, password)
    FireAuth-->>UI: Return user.uid
    UI->>Firestore: setDoc("users/{uid}", { role: "student", ... })
    UI->>Firestore: setDoc("students/{uid}", { profileCompleteness: 30, ... })
    UI->>Firestore: addDoc("consent_records", { consentType: "data_processing", ... })
    UI->>FireAuth: sendEmailVerification()
    Student->>FireAuth: Click email link & Verify
    Student->>UI: Sign in at /login -> Redirect to /student/dashboard
    end

    rect rgb(30, 45, 30)
    note over Student,Firestore: 2. Document Upload & Storage
    Student->>UI: Navigate to /student/documents -> Upload Document (Passport/Transcript)
    UI->>PortalHook: uploadDocument(metadata, file)
    PortalHook->>DocStorage: uploadStudentDocument(studentId, file)
    DocStorage-->>PortalHook: Return download URL / file path
    PortalHook->>Firestore: addDoc("student_documents", { status: "Pending", ... })
    Firestore-->>PortalHook: Document record created
    UI-->>Student: Display "Pending" verification badge
    end

    rect rgb(45, 35, 20)
    note over Student,Staff: 3. Direct Application Submission & Pipeline Ingestion
    Student->>UI: Navigate to /student/new-application
    Student->>UI: Fill University, Programme, Intake, SOP & Submit
    UI->>PortalHook: createApplication(applicationData)
    PortalHook->>Firestore: addDoc("applications", { stage: "Draft", ... })
    Firestore-->>PortalHook: Return new application reference
    UI-->>Student: Display "Application Submitted Successfully"
    Firestore-)Staff: Real-time onSnapshot sync to Counsellor & Admissions Queues
    Staff->>Firestore: updateDoc("applications/{id}", { stage: "Initial Review" })
    Firestore-)UI: Real-time onSnapshot update reflects on /student/applications
    end
```

