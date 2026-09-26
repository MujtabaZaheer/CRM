# AI Agent Guidelines & Project Architecture Reference

> **MANDATORY FIRST STEP FOR ANY AI AGENT:**
> Before analyzing or modifying code, **READ [`PROJECT_CONTEXT.md`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/PROJECT_CONTEXT.md)**.
> It contains the comprehensive architectural blueprint, role definitions (10+ roles), student application workflows, zero-redundancy rules, AI CV parsing pipeline, and build/deploy instructions.

---

## Quick Reference Summary

1. **Project Identity**:
   - **EduCRM**: Multi-tenant Higher Education Admissions CRM & Student Recruitment Platform.
   - **Live Production URL**: [https://education-crm-9fee2.web.app](https://education-crm-9fee2.web.app)
   - **Tech Stack**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Firebase (Auth, Firestore, Hosting), Google Gemini 3.8 Flash.

2. **Core Operational Principles**:
   - **Zero Redundancy**: Information requested once (e.g. at student registration or CV parsing) must **never** be requested again in subsequent onboarding or application wizard stages. Pre-fill all matching fields from Firestore or session cache.
   - **No Dummy Defaults in CV Extraction**: Real parsed data only; empty fields remain blank without hardcoded filler values.
   - **Windows PowerShell Note**: To avoid PowerShell execution policy blocks, run build/deploy scripts using `cmd /c "npm ..."` or `npx.cmd`.

3. **Key Files**:
   - Full Architectural & Workflow Map: [`PROJECT_CONTEXT.md`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/PROJECT_CONTEXT.md)
   - AI CV Extractor & Heuristics: [`src/utils/cvExtractor.ts`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/utils/cvExtractor.ts)
   - Student Onboarding: [`src/pages/portal/onboarding/StudentOnboardingStage1.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/pages/portal/onboarding/StudentOnboardingStage1.tsx)
   - Application Wizard: [`src/pages/portal/StudentApplicationWizard.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/pages/portal/StudentApplicationWizard.tsx)
   - Application Lifecycle Stages: [`src/utils/applicationWorkflowConfig.ts`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/utils/applicationWorkflowConfig.ts)
   - Verification Hub: [`src/components/admissions/AdmissionsDocumentVerificationHub.tsx`](file:///c:/Users/mujta/OneDrive/Documents/Projects/CRM/src/components/admissions/AdmissionsDocumentVerificationHub.tsx)
