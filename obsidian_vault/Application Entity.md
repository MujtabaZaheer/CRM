---
tags:
  - entity/application
---

# Application Entity

Central record connecting a [[Student Entity]] with a University, Programme, Intake, Counsellor, and [[Admissions Officer Module]].

## 📋 Application Origins
Applications can be created from two sources:
1. **Staff-Created**: Counsellors, Admissions Officers, or Team Leaders create applications on behalf of students via the `/applications` page.
2. **Student Self-Submitted**: Students submit applications directly from their portal at `/student/new-application`. These applications enter the pipeline at `Draft` stage with `universityId: "univ-self"` and are tagged with the student's email in the history as "Application submitted by student via self-service portal."

## 📊 20 Lifecycle Stages (CRM.pdf Section 3.7)
1. `Draft`
2. `Initial Review`
3. `Documents Pending`
4. `Ready for Submission`
5. `Submitted`
6. `University Reviewing`
7. `Additional Info Requested`
8. `Conditional Offer`
9. `Unconditional Offer`
10. `Deposit Pending`
11. `Deposit Paid`
12. `CAS / COE Pending`
13. `CAS Issued`
14. `Visa Preparation`
15. `Visa Submitted`
16. `Visa Approved`
17. `Enrolled`
18. `Deferred`
19. `Withdrawn`
20. `Rejected`

## 🔗 Related Modules
- [[Admissions Officer Module]]
- [[Counsellor Module]]
- [[Team Leader Module]]
- [[Finance Officer Module]]
- [[Student Self-Service Portal]]
