---
tags:
  - planning/active
  - architecture/completion
date: 2026-08-16
---

# 🚀 Unified Completion Blueprint

Master execution plan for completing EduCRM from its current state to production.

**Last updated**: 2026-08-16 03:00 PKT

---

## 🔑 Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| AI Provider | **Google Gemini (free)** | 60 req/min free tier, native Google ecosystem |
| Firebase Plan | **Spark (free)** — no Blaze | No Cloud Functions deployment; all logic client-side |
| Media Storage | **Firebase Storage** (5 GB free) | Already set up for student documents |
| ChatGPT Plus | **Does NOT include API access** | Separate billing; not usable for CRM |

---

## 🔍 Critical Discovery

All data hooks (**Finance, Admissions, Support, Auditor, SuperAdmin, Portal**) are **already wired to real Firestore** with `onSnapshot` + `addDoc` + `updateDoc`. They fall back to demo data only when Firestore is empty or permissions fail.

**Main blocker**: Audit logger, invitations, and user role updates use Cloud Functions (`httpsCallable`) which require Blaze plan. Fix: move to client-side Firestore writes.

---

## 📋 5 Streams × 23 Work Items

### Stream A — Fix Cloud Function Dependencies (3 items)
- A1. Audit logger → direct Firestore write (not callable function)
- A2. Invitation system → client-side Firestore
- A3. User role updates → direct `updateDoc` by admin

### Stream B — Complete Workspace Features (6 items)
- B1. Dashboard overhaul (role-aware, Recharts, drill-down)
- B2. Global search (Cmd+K command palette)
- B3. Notification system (real-time bell)
- B4. Calendar & appointments (CSS grid, no external lib)
- B5. Reports page (replace stub with real Recharts reports)
- B6. Email templates (`{{variable}}` substitution)

### Stream C — AI Counsellor via Client-Side Gemini (3 items)
- C1. Gemini client module (`src/utils/geminiClient.ts`)
- C2. AI Counsellor page (recommendations, document analysis)
- C3. Visa probability widget

### Stream D — Polish & Missing Features (5 items)
- D1. Enhanced documents (expiry, download logging, bulk upload)
- D2. Agent portal referral links
- D3. University portal application decisions
- D4. Data quality queue (duplicates, completeness, stale)
- D5. Form builder (admin designer + public renderer)

### Stream E — Hardening (6 items)
- E1. Auth hardening (password reset, email verify, session timeout)
- E2. Multi-tenant scoping (`organizationId` filter)
- E3. GDPR basics (consent, DSR, erasure)
- E4. Accessibility (ARIA, keyboard nav)
- E5. Performance (lazy loading, pagination)
- E6. Firestore rules testing

---

## Execution Order

```
A (Fix deps, 1 day) → B (Features, 3-4 days) → C (AI, 1-2 days) → D (Polish, 2-3 days) → E (Harden, 2-3 days)
```

**Total: ~10-14 days**

---

## Links
- [[Implementation Status Dashboard]] — Verified status
- [[Core Architecture]] — Tech stack
- [[AI Counsellor & Recommendation Engine]] — AI module
- [[EduCRM System Overview]] — Role specifications
