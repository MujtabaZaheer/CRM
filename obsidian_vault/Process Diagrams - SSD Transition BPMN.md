---
tags:
  - architecture/diagrams
  - diagrams/ssd
  - diagrams/state-transition
  - diagrams/bpmn
  - status/completed
date: 2026-09-03
---

# 📊 EduCRM System Process Diagrams (SSD, State Transition, BPMN)

This document contains the complete, high-definition process diagrams for the EduCRM multi-role onboarding and application processing architecture.

---

## 1. 🔄 System Sequence Diagram (SSD)

Shows the full interaction between actors and system components for the **registration → email verification → login → session init → onboarding** flow.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Student / Agent / Uni)
    participant Browser as Client Browser (/register)
    participant FireAuth as Firebase Authentication
    participant Firestore as Cloud Firestore
    participant EmailSvc as SMTP / Email Dispatcher

    Note over User,EmailSvc: ─── PHASE 1: UNIFIED MULTI-ROLE REGISTRATION ───

    User->>Browser: Navigate to /register
    Browser->>User: Display role selection cards (Student, Agent, University Partner)
    User->>Browser: Select role (e.g. "Student / Applicant")
    Browser->>User: Display dynamic role-specific form fields

    User->>Browser: Fill details & submit
    Browser->>Browser: Validate 5 password rules (Length, Upper, Lower, Digit, Special)<br/>Verify password confirmation & GDPR consent checkbox

    alt Validation Failure
        Browser->>User: Display inline error banner
    end

    Browser->>FireAuth: createUserWithEmailAndPassword(email, password)
    FireAuth-->>Browser: Return UserCredential { uid }

    par Create User Profile
        Browser->>Firestore: setDoc("users/{uid}")<br/>{uid, email, displayName, role, createdAt}
    and Create Role Document
        Browser->>Firestore: setDoc("{collection}/{uid}")<br/>(students/ | agents/ | university_partners/)
    and Log GDPR Consent
        Browser->>Firestore: addDoc("consent_records")<br/>{userId, consentType: "data_processing", version: "v1.0", timestamp}
    end

    Firestore-->>Browser: Write confirmations

    Browser->>FireAuth: sendEmailVerification(user)
    FireAuth->>EmailSvc: Dispatch verification email
    EmailSvc-->>User: Deliver verification link

    Browser->>FireAuth: signOut()
    Browser->>User: Display "Check Your Email" confirmation screen

    Note over User,EmailSvc: ─── PHASE 2: EMAIL VERIFICATION ───

    User->>EmailSvc: Click verification link
    EmailSvc->>FireAuth: Mark emailVerified = true

    Note over User,EmailSvc: ─── PHASE 3: AUTHENTICATION & LOGIN ───

    User->>Browser: Visit /login, input credentials
    Browser->>FireAuth: signInWithEmailAndPassword(email, password)
    FireAuth-->>Browser: Return UserCredential

    alt Email Not Verified
        Browser->>FireAuth: sendEmailVerification(user)
        Browser->>FireAuth: signOut()
        Browser->>User: Show warning & prompt to check inbox
    end

    alt Email Is Verified
        Browser->>User: Redirect to "/"
    end

    Note over User,EmailSvc: ─── PHASE 4: SESSION INITIALIZATION & ROLE ROUTING ───

    Browser->>Browser: AuthContext.onAuthStateChanged(user)
    Browser->>Firestore: onSnapshot("users/{uid}")
    Firestore-->>Browser: Return AppUser { role, email, displayName, ... }

    Browser->>Browser: ProtectedLayout renders<br/>Sidebar loads role-specific nav items

    alt role = "student"
        Browser->>User: Redirect → /student/dashboard
    else role = "external_agent"
        Browser->>User: Redirect → /agent/dashboard
    else role = "university_partner"
        Browser->>User: Redirect → /university/dashboard
    else Internal Staff Role
        Browser->>User: Redirect → Role Workspace (Admissions, Counsellor, Finance, Visa)
    end

    Note over User,EmailSvc: ─── PHASE 5: ROLE-SPECIFIC ONBOARDING ───

    Browser->>User: Display dashboard with contextual onboarding actions
    alt Student (profileCompleteness < 50%)
        Browser->>User: Prompt to complete profile & submit new application
    else Agent (totalReferrals = 0)
        Browser->>User: Prompt to copy unique referral link
    else University (totalApplicationsReceived = 0)
        Browser->>User: Prompt to review partner programmes & admissions queue
    end
```

---

## 2. 🔀 State Transition Diagram

Documents the lifecycle states of a user account from initial registration through full activation, operational stages, and administrative status transitions.

```mermaid
stateDiagram-v2
    [*] --> Unregistered: User visits /register

    Unregistered --> RoleSelected: Selects role (Student / Agent / University)
    RoleSelected --> FormFilling: Renders dynamic form fields
    FormFilling --> ValidationFailed: Input validation error
    ValidationFailed --> FormFilling: User corrects error

    FormFilling --> AccountCreating: Submits valid form
    AccountCreating --> AuthError: Firebase Auth error (e.g. Email in use)
    AuthError --> FormFilling: User updates input

    AccountCreating --> Registered_Unverified: Account created<br/>Firestore documents written<br/>Verification email sent

    Registered_Unverified --> Email_Verified: User clicks verification link
    Registered_Unverified --> Verification_Expired: Link expired (72h)
    Verification_Expired --> Registered_Unverified: User requests new link

    Email_Verified --> Login_Attempt: User enters credentials at /login
    Login_Attempt --> Login_Failed: Invalid credentials
    Login_Failed --> Login_Attempt: User retries

    Login_Attempt --> Session_Active: Login successful<br/>AuthContext loads AppUser profile

    Session_Active --> Role_Dashboard: Navigates to dashboard via getRoleDashboardPath(role)

    state Role_Dashboard {
        [*] --> Student_Portal: role == "student"
        [*] --> Agent_Portal: role == "external_agent"
        [*] --> University_Portal: role == "university_partner"
        [*] --> Staff_Module: role == internal staff

        Student_Portal --> Profile_Completion: Complete profile & upload documents
        Profile_Completion --> Application_Submission: Submit new application (/student/new-application)
        Application_Submission --> Application_Tracking: Real-time 20-stage pipeline tracking

        Agent_Portal --> Referral_Setup: Copy unique referral tracking link
        Referral_Setup --> Lead_Submission: Submit student referral lead
        Lead_Submission --> Commission_Tracking: Monitor earned commissions & payouts

        University_Portal --> App_Review: Review incoming student dossiers
        App_Review --> Decision_Issuance: Issue Conditional / Unconditional Offer or Reject
        Decision_Issuance --> CAS_Release: Release official CAS / COE reference
    }

    Session_Active --> Logged_Out: User clicks Sign Out
    Logged_Out --> Login_Attempt: Signs in again

    Session_Active --> Suspended: Organization Admin suspends access
    Suspended --> Session_Active: Admin reactivates account
    Suspended --> Deactivated: Admin permanently deletes user
    Deactivated --> [*]
```

---

## 3. 🗺️ BPMN Process Diagram

Comprehensive Business Process Model and Notation diagram organized with dedicated swimlanes for User, System, Email Verification, Login & Session, Role Routing, Onboarding, and Admin lanes.

```mermaid
flowchart TD
    subgraph UserLane["👤 USER (Student / Agent / University Partner)"]
        A["Visit /register"] --> B{"Select Role"}
        B -->|Student| C1["Fill Student Form<br/>(Name, Email, Phone,<br/>Nationality, Country)"]
        B -->|Agent| C2["Fill Agent Form<br/>(Name, Email, Phone,<br/>Agency Name, Country)"]
        B -->|University| C3["Fill University Form<br/>(Name, Email, University Name,<br/>Position, Country)"]
        C1 --> D["Set Password (5 Rules) +<br/>Accept GDPR Consent"]
        C2 --> D
        C3 --> D
        D --> E["Click 'Create Account'"]
    end

    subgraph SystemLane["⚙️ SYSTEM BACKEND (Firebase Auth & Firestore)"]
        E --> F{"Validate Form &<br/>Password Strength"}
        F -->|Fail| G["Display Form Error Message"]
        G --> D
        F -->|Pass| H["Create Firebase Auth Account<br/>(createUserWithEmailAndPassword)"]
        H --> I["Write users/{uid} Base Profile<br/>(role, email, displayName)"]
        I --> J{"Selected Role?"}
        J -->|Student| K1["Write students/{uid}<br/>(profileCompleteness: 30)"]
        J -->|Agent| K2["Write agents/{uid}<br/>(referralCode: REF-XXXX)"]
        J -->|University| K3["Write university_partners/{uid}<br/>(position, institution)"]
        K1 --> L["Write consent_records Document<br/>(consentType: data_processing)"]
        K2 --> L
        K3 --> L
        L --> M["Dispatch Verification Email<br/>(sendEmailVerification)"]
        M --> N["Sign Out Auth Session (signOut)"]
        N --> O["Display 'Check Your Email'<br/>Confirmation Screen"]
    end

    subgraph VerifyLane["📧 EMAIL VERIFICATION SERVICE"]
        O --> P["User Receives Verification Email"]
        P --> Q{"Click Verification Link?"}
        Q -->|Yes| R["Firebase Auth Updates<br/>emailVerified = true"]
        Q -->|No / Link Expired| S["User Requests New Link<br/>at /login"]
        S --> P
    end

    subgraph LoginLane["🔐 AUTHENTICATION & LOGIN"]
        R --> T["User Navigates to /login"]
        T --> U["Input Email & Password"]
        U --> V{"Firebase Auth<br/>Validation"}
        V -->|Invalid| W["Show Error Banner"]
        W --> U
        V -->|Valid| X{"emailVerified == true?"}
        X -->|No| Y["Resend Verification Link &<br/>Block Session"]
        Y --> P
        X -->|Yes| Z["AuthContext onAuthStateChanged<br/>Loads Profile from users/{uid}"]
    end

    subgraph RoutingLane["🧭 ROLE-BASED ROUTING"]
        Z --> AA{"Evaluate appUser.role"}
        AA -->|student| BB["Navigate to /student/dashboard"]
        AA -->|external_agent| CC["Navigate to /agent/dashboard"]
        AA -->|university_partner| DD["Navigate to /university/dashboard"]
        AA -->|staff roles| EE["Navigate to Role Workspace<br/>(Admissions / Counsellor / Finance / Visa)"]
    end

    subgraph OnboardingLane["🎯 ROLE-SPECIFIC WORKFLOW & ONBOARDING"]
        BB --> FF["Student Self-Service Portal:<br/>1. Complete Profile (/student/profile)<br/>2. Upload Documents (/student/documents)<br/>3. Submit Direct Application (/student/new-application)<br/>4. Track Real-Time 20-Stage Pipeline"]
        CC --> GG["External Agent Portal:<br/>1. Generate & Share Referral Link<br/>2. Register New Leads (/agent/refer-lead)<br/>3. Monitor Pipeline Progress (/agent/referrals)<br/>4. Track Commission Ledger (/agent/commissions)"]
        DD --> HH["University Partner Portal:<br/>1. Review Incoming Applications (/university/applications)<br/>2. 1-Click Offer / Reject Decisions<br/>3. Release CAS / COE Reference Numbers<br/>4. Monitor Processing Analytics"]
        EE --> II["Internal Staff Modules:<br/>Counsellor, Admissions Officer, Team Leader,<br/>Finance Officer, Visa Officer, Auditor"]
    end

    subgraph AdminLane["🛡️ ADMIN ONBOARDING (Invitation-Only Roles)"]
        JJ["Org Admin Generates Invitation at /users"] --> KK["Firestore Stores invitations/{token}"]
        KK --> LL["Email Sent with Link to /accept-invitation?token=xxx"]
        LL --> MM["Invited User Creates Verified Account"]
        MM --> NN["Accepts Invitation Token:<br/>users/{uid} Provisioned with Assigned Role"]
        NN --> Z
    end

    style UserLane fill:#064e3b,stroke:#34d399,color:#fff
    style SystemLane fill:#1e1b4b,stroke:#818cf8,color:#fff
    style VerifyLane fill:#451a03,stroke:#fbbf24,color:#fff
    style LoginLane fill:#172554,stroke:#60a5fa,color:#fff
    style RoutingLane fill:#0f172a,stroke:#38bdf8,color:#fff
    style OnboardingLane fill:#064e3b,stroke:#4ade80,color:#fff
    style AdminLane fill:#4c0519,stroke:#f472b6,color:#fff
```

---

## 🔗 Related Obsidian Documentation
- [[Student Application Lifecycle]] — Comprehensive 10-phase lifecycle flow
- [[Student Self-Service Portal]] — Student dashboard and application actions
- [[UML Sequence Diagrams & System Flow]] — Architectural sequence diagrams
- [[Core Architecture]] — Tech stack, context hierarchy, and security
- [[EduCRM System Overview]] — Executive role matrix and pipeline
