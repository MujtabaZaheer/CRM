---
tags:
  - module/aicounsellor
  - status/planned
  - stream/F
date: 2026-08-16
---

# 🤖 AI Counsellor & Recommendation Engine

**Status**: 🟡 Planned — Stream F in [[Unified Completion Blueprint]]

---

## Overview

Artificial Intelligence engine for automated entry requirement matching, visa success prediction, and document OCR data extraction. Designed to assist counsellors — all AI outputs require human approval before action.

---

## AI Provider Strategy

> **ChatGPT Plus ≠ OpenAI API** — separate billing. See [[Unified Completion Blueprint]] for details.

| Provider | Cost | Integration | Quality |
|----------|------|-------------|---------|
| **Google Gemini API** (recommended) | Free (60 req/min) | Native Firebase, `@google/generative-ai` | Good for text analysis, decent vision |
| **OpenAI API** (fallback) | $5 minimum, ~$2-5/mo | `openai` npm package | Better document analysis, stronger vision |

**Decision**: Start with Gemini (free). Swap to OpenAI if document extraction quality is insufficient.

---

## Implementation Items

### F1. AI Backend (Cloud Function)
- `analyzeStudentProfile` callable: student profile → ranked programme recommendations
- `analyzeDocument` callable: document image → extracted text/grades
- Provider config via Firebase Functions config
- Rate limit: 10 AI calls per user per hour

### F2. AI Counsellor UI
- Student selection → "Analyze" → programme recommendations with confidence
- Document upload → OCR extraction → auto-fill student fields
- Human approval workflow: AI draft → counsellor approve/reject
- Full audit trail

### F3. Visa Probability Scoring
- Student nationality + target country + financials → probability score
- Country-specific guidelines embedded in prompt
- Display on visa officer dashboard

---

## PDF Requirements (CRM.pdf Section 6.1)
- ✅ Automated student transcript OCR data extraction → F1 `analyzeDocument`
- ✅ Intelligent programme eligibility matching engine → F1 `analyzeStudentProfile`
- ✅ Visa success probability scoring → F3
- ✅ Automated document quality detection → F1 `analyzeDocument`

---

## Dependencies
- Firebase Blaze plan (for Cloud Functions deployment)
- Gemini API key (free) OR OpenAI API key ($5 minimum)
