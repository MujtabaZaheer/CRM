---
tags:
  - module/agentportal
  - status/completed
date: 2026-09-03
---

# 🤝 External Agent Portal

**Status**: 🟢 Implemented & Live in Production (`/agent/*`, `/register`)

Portal for sub-agents and external educational recruitment agencies to self-register, submit student referrals, track application outcomes, and manage commission payouts.

## 📋 PDF Requirements (CRM.pdf Section 5.2)
- ✅ **Self-Registration**: Agents register at `/register` by selecting the "External Referral Agent" role card. Provides agency name, phone, country, password with email verification and GDPR consent. Creates `users/{uid}` with `role: "external_agent"` and `agents/{uid}` with referral code (`REF-XXXXXXXX`), commission tier, and tracking fields.
- ✅ **Unique Referral Link Generator**: Copy and share referral tracking links.
- ✅ **Submit Referral**: Register new student leads directly into the CRM at `/agent/refer-lead`.
- ✅ **Referral Queue**: Monitor application progress for referred students at `/agent/referrals`.
- ✅ **Commission Ledger**: Track earned referral commissions and payout eligibility at `/agent/commissions`.

## 🔄 Agent Registration Flow
1. Visit `/register` → select "External Referral Agent" card
2. Fill: Full Name, Email, Phone, Agency Name, Country, Password
3. System creates `users/{uid}` + `agents/{uid}` with `referralCode: "REF-XXXXXXXX"`
4. Verify email → login → redirect to `/agent/dashboard`

## 🔗 Connected Modules & Entities
- [[External Agent Role]]
- [[Commission Entity]]
- [[Student Entity]]
- [[Application Entity]]
