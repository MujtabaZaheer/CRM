---
tags:
  - module/universityportal
  - status/completed
date: 2026-09-03
---

# 🏛️ University Partner Portal

**Status**: 🟢 Implemented & Live in Production (`/university/*`, `/register`)

Portal for partner university admissions staff to self-register, log in, review submitted student applications, download document packages, issue admission decisions, and release CAS/COE references.

## 📋 PDF Requirements (CRM.pdf Section 5.3)
- ✅ **Self-Registration**: University admissions staff register at `/register` by selecting the "University Admissions Partner" role card. Provides university name, position/title, country, password with email verification and GDPR consent. Creates `users/{uid}` with `role: "university_partner"` and `university_partners/{uid}` with institution details.
- ✅ **University Admissions Login**: Email/password authentication with redirect to `/university/dashboard`.
- ✅ **Received Applications**: Application queue filtering by intake and programme at `/university/applications`.
- ✅ **1-Click Admissions Decision**: Issue Conditional Offer, Unconditional Offer, or Rejection directly from the portal.
- ✅ **CAS / COE Release**: Upload official CAS/COE reference numbers at `/university/cas-issuance`.
- ✅ **Notifications**: Portal notifications for new applications and pending actions at `/university/notifications`.

## 🔄 University Partner Registration Flow
1. Visit `/register` → select "University Admissions Partner" card
2. Fill: Full Name, Email, University Name, Position/Title, Country, Password
3. System creates `users/{uid}` + `university_partners/{uid}`
4. Verify email → login → redirect to `/university/dashboard`

## 🔗 Connected Modules & Entities
- [[University Partner Role]]
- [[Application Entity]]
- [[Admissions Officer Module]]
- [[Student Entity]]
