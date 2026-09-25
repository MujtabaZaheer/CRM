import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT

def main():
    src_file = r'c:\Users\m\OneDrive\Desktop\CRM\SAAD_ALI_QURESHI_BSE223018_INTERNSHIP_REPORT_BACKUP.docx'
    dst_file = r'c:\Users\m\OneDrive\Desktop\CRM\SAAD_ALI_QURESHI_BSE223018_INTERNSHIP_REPORT.docx'
    
    doc = docx.Document(src_file)
    print("Loaded source document successfully.")
    
    # -------------------------------------------------------------
    # 1. Update Table of Contents
    # -------------------------------------------------------------
    # P[11] is 'Table of Contents'
    # P[12] to P[23] are the existing TOC entries
    toc_data = [
        ("Executive Summary", "3", True),
        ("Acknowledgement", "4", True),
        ("Introduction", "5", True),
        ("DAILY ASSIGNMENT TASKS", "6", True),
        ("Week 1: Foundations, Architecture & Multi-Role Authentication", "6", False),
        ("Week 2: Student Experience, 4-Stage Onboarding & Catalogs", "9", False),
        ("Week 3: Counsellor Workspace, Lead Ingestion & Routing Engine", "13", False),
        ("Week 4: Application Pipeline, Admissions & Document Vault", "17", False),
        ("Week 5: Agent Partner Portal, University Desk & Finance Engine", "21", False),
        ("Week 6: AI Intelligence Suite, Gemini OCR & Quality Monitors", "25", False),
        ("Week 7: Automated Testing, Optimization & Final Handover", "29", False),
        ("Conclusion", "33", True),
        ("References", "34", True),
        ("Appendix A: Local Setup, Live Deployment & Source Repository", "35", True),
        ("Appendix B: System Dashboards & Core Feature Showcase", "37", True),
    ]
    
    # Existing TOC has 12 items (P[12] to P[23])
    # We will reuse P[12] to P[23], and insert new paragraphs before P[24] for the remaining items.
    p_break_after_toc = doc.paragraphs[24]
    
    for idx, (title, page, is_bold) in enumerate(toc_data):
        if idx < 12:
            p = doc.paragraphs[12 + idx]
            p.text = ""
        else:
            p = p_break_after_toc.insert_paragraph_before("")
            
        pPr = p._p.get_or_add_pPr()
        # Add tab stop with dot leader at 9360 dxa
        tabs_xml = parse_xml(
            '<w:tabs ' + nsdecls('w') + '>'
            '<w:tab w:pos="9360" w:val="right" w:leader="dot"/>'
            '</w:tabs>'
        )
        pPr.append(tabs_xml)
        
        # Spacing
        spacing_xml = parse_xml(
            '<w:spacing ' + nsdecls('w') + ' w:after="80" w:line="260" w:lineRule="auto"/>'
        )
        pPr.append(spacing_xml)
        
        r1 = p.add_run(title)
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(11)
        r1.bold = is_bold
        
        r_tab = p.add_run("\t")
        r_tab.font.name = "Times New Roman"
        r_tab.font.size = Pt(11)
        r_tab.bold = is_bold
        
        r2 = p.add_run(page)
        r2.font.name = "Times New Roman"
        r2.font.size = Pt(11)
        r2.bold = is_bold

    print("Table of Contents updated successfully.")

    # -------------------------------------------------------------
    # 2. Insert Executive Summary before Acknowledgement
    # -------------------------------------------------------------
    # Find the Acknowledgement heading paragraph
    p_ack_heading = None
    for p in doc.paragraphs:
        if p.text.strip() == "Acknowledgement":
            p_ack_heading = p
            break
            
    assert p_ack_heading is not None, "Could not find Acknowledgement heading!"
    
    # Insert Executive Summary Heading
    p_es_heading = p_ack_heading.insert_paragraph_before("")
    p_es_heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_es_heading.paragraph_format.space_before = Pt(0)
    p_es_heading.paragraph_format.space_after = Pt(18)
    r_esh = p_es_heading.add_run("Executive Summary")
    r_esh.font.name = "Times New Roman"
    r_esh.font.size = Pt(16)
    r_esh.bold = True
    
    exec_summary_paragraphs = [
        (
            "This report documents the software engineering summer internship completed by Saad Ali Qureshi (Reg. No. BSE223018) from 3 August 2026 to 22 September 2026, conducted under the academic supervision of Dr. Nadeem Anjum (Head of the Department of Software Engineering, Capital University of Science & Technology). The internship was dedicated to the research, architectural design, full-stack implementation, and validation of EduCRM—an enterprise-grade, cloud-native admissions management and customer relationship management (CRM) ecosystem engineered specifically for international higher education consultancies and placement agencies."
        ),
        (
            "International student placement agencies operating across key destination countries—including the United Kingdom, United States, Canada, Australia, and the European Union—face acute operational bottlenecks. Traditional operations rely heavily on disparate spreadsheets, fragmented messaging channels, and disconnected departmental silos across counselling, admissions, finance, and visa desks. Counsellors routinely expend 30 to 45 minutes manually transcribing applicant records from unstructured CVs and transcripts into university application portals. Furthermore, handling sensitive identity documents, bank letters, and academic portfolios across unsecured channels creates severe compliance risks under global data protection regulations (such as GDPR). EduCRM was engineered to solve these challenges through a unified, multi-tenant digital backbone where all stakeholders operate on a single, synchronized, and role-governed applicant dossier."
        ),
        (
            "The front-end client was built using React 19, TypeScript, Vite, and Tailwind CSS v4, providing a responsive, dark-mode command center. The backend infrastructure is architected on Google Firebase, leveraging Cloud Firestore for real-time document-oriented data persistence, Firebase Authentication for role-governed identity management, and Firebase Cloud Storage for secure document retention. A core innovation of the project is the integration of Google Gemini AI (leveraging Gemini 3.8 Flash) to power an intelligent, automated CV and resume parsing engine. This engine extracts biographical details, academic histories, degree classifications, and English language test scores directly from uploaded documents, populating student dossiers in seconds with zero manual data entry, backed by an offline heuristic fallback parser."
        ),
        (
            "The internship deliverables encompassed five primary architectural pillars:\n"
            "1. Multi-Tenant Foundation & 13 Granular Roles: Strict data isolation per agency organization and regional branch, governed at the cloud database level via robust Firestore Security Rules.\n"
            "2. 20-Stage Admissions Lifecycle: A formal finite state machine orchestrating applications across Counselling, Admissions, Finance, and Visa desks with stage-transition authorization guards.\n"
            "3. Student Experience & Self-Service Portals: A 4-stage onboarding wizard, an 11-step interactive university application wizard, and automated eligibility matching against global institutional criteria.\n"
            "4. Partner & Financial Tooling: External recruitment agent portals with automated commission ledgers, multi-branch lead distribution, and automated PDF fee challan generation.\n"
            "5. Real-Time Communications & AI Advisory Hub: Role-governed messaging between applicants and counsellors featuring in-chat document previews, alongside a 24/7 AI counsellor desk."
        ),
        (
            "The system was validated through an automated testing pyramid consisting of 27 Vitest unit and integration test suites (188 tests) and Playwright end-to-end browser automation, confirming strict tenant isolation and role privilege guards. The platform has been compiled into an optimized production bundle and successfully deployed live on Google Firebase Hosting (https://education-crm-9fee2.web.app), with source code actively version-controlled on GitHub (https://github.com/MujtabaZaheer/CRM.git)."
        )
    ]
    
    for text in exec_summary_paragraphs:
        p_es = p_ack_heading.insert_paragraph_before("")
        p_es.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_es.paragraph_format.space_before = Pt(0)
        p_es.paragraph_format.space_after = Pt(10)
        p_es.paragraph_format.line_spacing = 1.25
        r = p_es.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        
    # Insert Page Break after Executive Summary (so Acknowledgement starts on a fresh page)
    p_es_br = p_ack_heading.insert_paragraph_before("")
    r_br = p_es_br.add_run()
    r_br.add_break(WD_BREAK.PAGE)
    
    print("Executive Summary inserted successfully.")

    # -------------------------------------------------------------
    # 3. Update Acknowledgement
    # -------------------------------------------------------------
    # In original doc:
    # P[25]: 'Acknowledgement'
    # P[26]: academic supervisor Dr. Nadeem Anjum
    # P[27]: Convo Director Sanaullah Irfan -> Replace with CUST Department
    # P[28]: Convo Team Lead Waqar Akram -> Replace with Team Member Mujtaba Zaheer (BSE231010)
    # P[29]: Bridge theory and practice
    # P[30]: 'DR. NADEEM ANJUM (HOD)'
    # P[31]: 'Head, Department of Software Engineering, CUST'
    # P[32]: 'HOD Signature & Stamp : _________________________________'
    # P[33]: 'SANAULLAH IRFAN' -> 'PROJECT EVALUATOR / SUPERVISOR'
    # P[34]: '(Director...)' -> 'Department of Software Engineering, CUST'
    # P[35]: 'Industry Mentor...' -> 'Evaluator Signature & Date : _________________________________'
    
    # Locate Acknowledgement heading and its following paragraphs
    ack_idx = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "Acknowledgement":
            ack_idx = i
            break
            
    assert ack_idx is not None, "Could not locate Acknowledgement index!"
    
    # Update P[ack_idx + 1] (Supervisor)
    doc.paragraphs[ack_idx + 1].text = (
        "First and foremost, I would like to express my deepest gratitude and profound respect to my academic supervisor, "
        "Dr. Nadeem Anjum (HOD, Department of Software Engineering, Capital University of Science & Technology). "
        "Under his continuous academic supervision, visionary direction, and rigorous engineering guidance, this summer "
        "internship was successfully planned and executed. On the first day of my internship, Dr. Nadeem Anjum established "
        "the comprehensive project scope, task breakdown, architectural standards, and daily milestone review framework. "
        "Every day following the completion of my technical work, I submitted my completed modules, code artifacts, and "
        "dashboard deliverables to Dr. Nadeem Anjum for thorough inspection and validation. His timely feedback, high "
        "engineering standards, and continuous verification of each milestone before authorizing progression to the next "
        "task provided the structural backbone for my learning."
    )
    doc.paragraphs[ack_idx + 1].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.paragraphs[ack_idx + 1].paragraph_format.line_spacing = 1.25
    doc.paragraphs[ack_idx + 1].paragraph_format.space_after = Pt(12)
    for r in doc.paragraphs[ack_idx + 1].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    # Update P[ack_idx + 2] (Department of Software Engineering, CUST)
    doc.paragraphs[ack_idx + 2].text = (
        "I am also deeply grateful to the Department of Software Engineering and the esteemed faculty members of "
        "Capital University of Science & Technology (CUST), Islamabad, for providing an exemplary academic environment, "
        "modern research computing resources, and a comprehensive curriculum that bridges theoretical computer science "
        "principles with enterprise full-stack software development practices."
    )
    doc.paragraphs[ack_idx + 2].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.paragraphs[ack_idx + 2].paragraph_format.line_spacing = 1.25
    doc.paragraphs[ack_idx + 2].paragraph_format.space_after = Pt(12)
    for r in doc.paragraphs[ack_idx + 2].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    # Update P[ack_idx + 3] (Team member Mujtaba Zaheer BSE231010)
    doc.paragraphs[ack_idx + 3].text = (
        "I would like to extend my deepest appreciation and special thanks to my fellow project team member, "
        "Mujtaba Zaheer (Registration No. BSE231010), for his extraordinary collaboration, technical partnership, "
        "and shared dedication throughout the design, development, and testing of the EduCRM platform. Working alongside "
        "Mujtaba in designing the system architecture, coordinating front-end and back-end integration, reviewing code, "
        "and conducting rigorous test verification was instrumental in the successful delivery of this enterprise project. "
        "His sharp analytical thinking, problem-solving mindset, and constructive insights significantly elevated the "
        "engineering quality of our work."
    )
    doc.paragraphs[ack_idx + 3].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.paragraphs[ack_idx + 3].paragraph_format.line_spacing = 1.25
    doc.paragraphs[ack_idx + 3].paragraph_format.space_after = Pt(12)
    for r in doc.paragraphs[ack_idx + 3].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    # Update P[ack_idx + 4] (Closing paragraph)
    doc.paragraphs[ack_idx + 4].text = (
        "This internship has played an essential role in bridging theoretical concepts taught at Capital University "
        "of Science & Technology (CUST) with real-world software engineering practices, instilling in me the confidence, "
        "problem-solving discipline, and technical depth required to excel as a professional full-stack software engineer."
    )
    doc.paragraphs[ack_idx + 4].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.paragraphs[ack_idx + 4].paragraph_format.line_spacing = 1.25
    doc.paragraphs[ack_idx + 4].paragraph_format.space_after = Pt(20)
    for r in doc.paragraphs[ack_idx + 4].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    # Update Signature Block (P[ack_idx + 5] to P[ack_idx + 10])
    p_sig1 = doc.paragraphs[ack_idx + 5] # 'DR. NADEEM ANJUM (HOD)'
    p_sig1.text = "DR. NADEEM ANJUM (HOD)"
    for r in p_sig1.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        r.bold = True
        
    p_sig2 = doc.paragraphs[ack_idx + 6] # 'Head, Department of Software Engineering, CUST'
    p_sig2.text = "Head, Department of Software Engineering, CUST"
    for r in p_sig2.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        r.bold = False

    p_sig3 = doc.paragraphs[ack_idx + 7] # 'HOD Signature & Stamp : _________________________________'
    p_sig3.text = "HOD Signature & Stamp : _________________________________"
    for r in p_sig3.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        r.bold = False

    p_sig4 = doc.paragraphs[ack_idx + 8] # Replace Convo Director with Project Evaluator
    p_sig4.text = "PROJECT EVALUATOR / SUPERVISOR"
    for r in p_sig4.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        r.bold = True

    p_sig5 = doc.paragraphs[ack_idx + 9] # Replace Convo title
    p_sig5.text = "Department of Software Engineering, CUST"
    for r in p_sig5.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        r.bold = False

    p_sig6 = doc.paragraphs[ack_idx + 10] # Replace Industry Mentor Signature
    p_sig6.text = "Evaluator Signature & Date : _________________________________"
    for r in p_sig6.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        r.bold = False

    print("Acknowledgement updated successfully.")

    # -------------------------------------------------------------
    # 4. Update Introduction (P[38] and P[40] in original doc)
    # -------------------------------------------------------------
    intro_idx = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "Introduction":
            intro_idx = i
            break
            
    assert intro_idx is not None, "Could not find Introduction index!"
    
    # Update Introduction Paragraph 1 (replacing Convo company intro)
    doc.paragraphs[intro_idx + 1].text = (
        "International higher education consultancy agencies and university placement networks operate in a demanding "
        "global landscape, assisting thousands of prospective students annually across key academic destinations such as "
        "the United Kingdom, United States, Canada, Australia, and Europe. These agencies require robust software "
        "infrastructure to coordinate multi-branch operations, manage diverse institutional partnerships, verify academic "
        "documentation, and maintain full compliance with international data privacy and regulatory standards."
    )
    doc.paragraphs[intro_idx + 1].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.paragraphs[intro_idx + 1].paragraph_format.line_spacing = 1.2
    doc.paragraphs[intro_idx + 1].paragraph_format.space_after = Pt(12)
    for r in doc.paragraphs[intro_idx + 1].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    # Update Introduction Paragraph 2 (replacing Convo internship intro)
    doc.paragraphs[intro_idx + 3].text = (
        "During my 7-week summer internship (3 August, 2026 to 22 September, 2026), conducted under the academic supervision "
        "of Dr. Nadeem Anjum (HOD, Department of Software Engineering, CUST) focusing on international education consultancy "
        "systems, I was assigned to architect and develop core modules for the Education CRM and Student Application Management "
        "Platform (EduCRM). EduCRM is an enterprise-grade, multi-tenant web ecosystem tailored for international education "
        "consultants, global university recruitment networks, counsellors, and prospective students. The platform replaces "
        "fragmented, spreadsheet-driven operations with an integrated, intelligent, and automated operational backbone."
    )
    doc.paragraphs[intro_idx + 3].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.paragraphs[intro_idx + 3].paragraph_format.line_spacing = 1.2
    doc.paragraphs[intro_idx + 3].paragraph_format.space_after = Pt(12)
    for r in doc.paragraphs[intro_idx + 3].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    print("Introduction updated successfully.")

    # -------------------------------------------------------------
    # 5. Day-wise Assignments: PRESERVED COMPLETELY UNTOUCHED!
    # -------------------------------------------------------------
    print("Day-wise assignment tasks preserved with 0 modifications.")

    # -------------------------------------------------------------
    # 6. Update Conclusion
    # -------------------------------------------------------------
    conc_idx = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "Conclusion":
            conc_idx = i
            break
            
    assert conc_idx is not None, "Could not find Conclusion index!"
    
    doc.paragraphs[conc_idx + 1].text = (
        "My seven-week full-stack software engineering internship (3 August, 2026 to 22 September, 2026) focused on enterprise "
        "software engineering for international higher education placement agencies, conducted under the rigorous academic "
        "supervision of Dr. Nadeem Anjum (HOD, Department of Software Engineering, CUST), has been an immensely transformative, "
        "challenging, and professionally rewarding journey. Transitioning from academic coursework at Capital University of "
        "Science & Technology into a production-grade enterprise software engineering environment allowed me to apply theoretical "
        "principles of software design, database modeling, and automated testing to a large-scale, mission-critical platform."
    )
    doc.paragraphs[conc_idx + 1].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.paragraphs[conc_idx + 1].paragraph_format.line_spacing = 1.25
    doc.paragraphs[conc_idx + 1].paragraph_format.space_after = Pt(10)
    for r in doc.paragraphs[conc_idx + 1].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    doc.paragraphs[conc_idx + 2].text = (
        "The daily guidance and structured milestone evaluations conducted by Dr. Nadeem Anjum (HOD) ensured that every "
        "technical deliverable strictly adhered to software engineering standards, modular architecture, and thorough "
        "documentation. In parallel, the collaborative engineering partnership with fellow team member Mujtaba Zaheer (BSE231010) "
        "expanded our practical capabilities in React 19, TypeScript, Tailwind CSS v4, and Google Firebase Firestore, while "
        "imparting deep insights into multi-tenant SaaS security, asynchronous state management, and enterprise B2B partner collaboration."
    )
    doc.paragraphs[conc_idx + 2].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.paragraphs[conc_idx + 2].paragraph_format.line_spacing = 1.25
    doc.paragraphs[conc_idx + 2].paragraph_format.space_after = Pt(10)
    for r in doc.paragraphs[conc_idx + 2].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)

    print("Conclusion updated successfully.")

    # -------------------------------------------------------------
    # 7. Update References (References 2 and 3)
    # -------------------------------------------------------------
    ref_idx = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "References":
            ref_idx = i
            break
            
    assert ref_idx is not None, "Could not find References index!"
    
    doc.paragraphs[ref_idx + 2].text = (
        "2. EduCRM Engineering Standards. Multi-Tenant SaaS Architecture, Granular Role-Based Access Control, and AI Integration "
        "Guidelines for Global Education Consultancies."
    )
    doc.paragraphs[ref_idx + 2].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    for r in doc.paragraphs[ref_idx + 2].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)

    doc.paragraphs[ref_idx + 3].text = (
        "3. EduCRM System Architecture & Flow Specifications. Requirements Traceability Matrix, UML Sequence Diagrams, and "
        "Multi-Role Specifications. EduCRM Development Team."
    )
    doc.paragraphs[ref_idx + 3].alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    for r in doc.paragraphs[ref_idx + 3].runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)

    print("References updated successfully.")

    # -------------------------------------------------------------
    # 8. Append Appendix A: Local Setup, Live Deployment & Source Repository
    # -------------------------------------------------------------
    from update_helpers import (
        add_heading_1, add_heading_2, add_heading_3,
        add_body_paragraph, add_bullet_item, add_code_block, add_image_figure
    )
    
    # Page break before Appendix A
    p_br_a = doc.add_paragraph()
    r_br_a = p_br_a.add_run()
    r_br_a.add_break(WD_BREAK.PAGE)
    
    add_heading_1(doc, "Appendix A: Local Setup, Live Deployment & Source Repository")
    
    add_body_paragraph(
        doc,
        "This appendix provides comprehensive reference information regarding the live production deployment of the EduCRM "
        "platform, its official source code version control repository, and step-by-step instructions to configure, run, and "
        "test the system in a local development environment."
    )
    
    add_heading_2(doc, "A.1 Live Deployed Application & Source Code Repository")
    
    add_bullet_item(doc, "Live Production Application: ", "https://education-crm-9fee2.web.app")
    add_bullet_item(doc, "Hosting Platform: ", "Google Firebase Hosting (Cloud CDN Edge Caching, Global SSL/TLS Encryption, Automated Invalidation)")
    add_bullet_item(doc, "Source Code Repository: ", "https://github.com/MujtabaZaheer/CRM.git")
    add_bullet_item(doc, "Primary Version Branch: ", "main (Active release branch)")
    add_bullet_item(doc, "Lead Developers & Authors: ", "Saad Ali Qureshi (BSE223018) & Mujtaba Zaheer (BSE231010)")
    add_bullet_item(doc, "Frontend Framework Stack: ", "React 19.0.0, TypeScript 5.6.3, Vite 6.0.1, Tailwind CSS v4, Lucide React")
    add_bullet_item(doc, "Cloud Backend Stack: ", "Google Firebase (Authentication, Cloud Firestore, Cloud Storage, Security Rules)")
    add_bullet_item(doc, "Artificial Intelligence Engine: ", "Google Gemini AI (Gemini 3.8 Flash Multimodal API) with offline heuristic fallback")
    add_bullet_item(doc, "Automated Testing Framework: ", "Vitest (27 Test Suites, 188 Tests) & Microsoft Playwright End-to-End Test Engine")

    add_heading_2(doc, "A.2 Local Environment Setup & Execution Guide")
    
    add_body_paragraph(
        doc,
        "The EduCRM platform can be cloned and executed locally on Windows, macOS, or Linux systems. Ensure that the following "
        "software prerequisites are installed prior to initiation:"
    )
    
    add_bullet_item(doc, "Node.js: ", "Version 20.x LTS or Version 22.x LTS (Recommended: Node.js v22.14.0+)")
    add_bullet_item(doc, "Package Manager: ", "npm Version 10.x or higher (bundled with Node.js)")
    add_bullet_item(doc, "Version Control: ", "Git 2.40+ command line tools")
    add_bullet_item(doc, "Browser: ", "Google Chrome, Microsoft Edge, or Mozilla Firefox (latest evergreen version)")

    add_heading_3(doc, "Step 1: Clone Repository & Navigate to Workspace")
    add_body_paragraph(doc, "Execute the git clone command to obtain the full codebase and enter the project directory:")
    add_code_block(doc, "git clone https://github.com/MujtabaZaheer/CRM.git\ncd CRM")

    add_heading_3(doc, "Step 2: Install Node Dependencies")
    add_body_paragraph(doc, "Install all production dependencies and development toolchains defined in package.json:")
    add_code_block(doc, "npm install")

    add_heading_3(doc, "Step 3: Environment Variable Configuration (.env)")
    add_body_paragraph(
        doc,
        "Create a .env configuration file in the root directory of the project to bind cloud services, Firebase authentication, "
        "and Google Gemini AI keys:"
    )
    env_content = (
        "# Firebase Cloud Services Configuration\n"
        "VITE_FIREBASE_API_KEY=AIzaSyB_YOUR_FIREBASE_API_KEY\n"
        "VITE_FIREBASE_AUTH_DOMAIN=education-crm-9fee2.firebaseapp.com\n"
        "VITE_FIREBASE_PROJECT_ID=education-crm-9fee2\n"
        "VITE_FIREBASE_STORAGE_BUCKET=education-crm-9fee2.appspot.com\n"
        "VITE_FIREBASE_MESSAGING_SENDER_ID=324490740107\n"
        "VITE_FIREBASE_APP_ID=1:324490740107:web:bad87398d3b03e8c0a6f8e\n\n"
        "# Google Gemini AI Multimodal Configuration\n"
        "VITE_GEMINI_API_KEY=AIzaSyD_YOUR_GEMINI_API_KEY\n\n"
        "# Application Operating Mode Settings\n"
        "VITE_DEMO_MODE=false\n"
        "VITE_REQUIRE_VERIFIED_EMAIL=true"
    )
    add_code_block(doc, env_content)

    add_heading_3(doc, "Step 4: Launch Local Development Server")
    add_body_paragraph(doc, "Run the Vite development server with Hot Module Replacement (HMR):")
    add_code_block(doc, "npm run dev")
    add_body_paragraph(doc, "Once started, access the application locally in your browser at: http://localhost:5173")

    add_heading_3(doc, "Step 5: Run Automated Test Suites")
    add_body_paragraph(
        doc,
        "Execute the automated testing suites to verify role-based security boundaries, CV extraction accuracy, and state machine integrity:"
    )
    add_code_block(doc, "# Run all 27 Vitest suites (188 tests)\nnpm test -- --run\n\n# Run tests in interactive watch mode\nnpm test\n\n# Run Playwright end-to-end browser automation\nnpx playwright test")

    add_heading_3(doc, "Step 6: Production Build & Deployment")
    add_body_paragraph(doc, "To compile an optimized, minified production build and deploy to Firebase Hosting:")
    add_code_block(doc, "# Generate optimized production distribution in /dist\nnpm run build\n\n# Deploy to Firebase Hosting CDN\nnpx firebase deploy --only hosting")

    # -------------------------------------------------------------
    # 9. Append Appendix B: System Dashboards & Core Feature Showcase
    # -------------------------------------------------------------
    p_br_b = doc.add_paragraph()
    r_br_b = p_br_b.add_run()
    r_br_b.add_break(WD_BREAK.PAGE)
    
    add_heading_1(doc, "Appendix B: System Dashboards & Core Feature Showcase")
    
    add_body_paragraph(
        doc,
        "This appendix provides a high-resolution visual showcase and detailed feature analysis of the primary operational "
        "dashboards, student self-service consoles, AI-assisted application wizards, and multi-role communication hubs engineered "
        "for the EduCRM platform."
    )
    
    # -------------------------------------------------------------
    # Figure B.1: Student Admissions Command Center
    # -------------------------------------------------------------
    add_heading_2(doc, "B.1 Student Admissions Command Center (Student Dashboard)")
    add_body_paragraph(
        doc,
        "The Student Admissions Command Center serves as the primary home interface for registered prospective students. "
        "It provides a unified, consolidated overview of admission progress, pending academic profile tasks, application "
        "milestones, and financial fee challans."
    )
    img_1_path = r'c:\Users\m\OneDrive\Desktop\CRM\dashboard_screenshots\01_student_command_center.png'
    add_image_figure(doc, img_1_path, "Figure B.1: Student Admissions Command Center — Comprehensive Student Dashboard & Milestone Tracker")
    
    add_heading_3(doc, "Core Architectural Features:")
    add_bullet_item(doc, "Real-Time Admission Funnel Barometer: ", "Displays live counter badges across five critical stages: Total Dossiers (Applications lodged), Registry Evaluation (Under Review), Offers (Awaiting student response), Confirmed Places (Accepted), and Action Required alerts.")
    add_bullet_item(doc, "Academic Profile Health Gauge: ", "A real-time percentage progress ring indicating the completeness of personal biodata, academic history, test scores, and uploaded certificates.")
    add_bullet_item(doc, "Guided Action Prompts: ", "Contextual cards alerting the student to complete their academic profile to unlock verified eligibility matching against top global partner universities.")
    add_bullet_item(doc, "Tasks & Deadlines Console: ", "Calendar-synchronized milestone monitor alerting students to approaching university submission deadlines, fee deposit cutoffs, and document resubmissions.")
    add_bullet_item(doc, "Fee Challans & Tuition Invoices Panel: ", "Direct financial ledger showing issued fee challans (e.g., #INV-DEP-8308, #INV-DEP-5757), deposit amounts, payment statuses (Partially Paid, Pending), and downloadable bank payment slips.")
    add_bullet_item(doc, "Verified Document Vault Status: ", "Visual summary of verified credentials versus outstanding documents required by university admissions registries.")
    add_bullet_item(doc, "Streamlined Navigation Drawer: ", "Direct sidebar access to Profile, Universities, Programs, Applications, New Application Wizard, Fee Challans, Document Vault, Chat Support Desk, and Task Deadlines.")

    # -------------------------------------------------------------
    # Figure B.2: Start a New Application Portal
    # -------------------------------------------------------------
    add_heading_2(doc, "B.2 Admissions Application Portal with AI-Powered CV Scanner")
    add_body_paragraph(
        doc,
        "The Admissions Application Portal enables prospective students to initiate formal dossiers to international universities. "
        "The portal incorporates cutting-edge multimodal artificial intelligence to automate dossier creation and minimize manual entry."
    )
    img_2_path = r'c:\Users\m\OneDrive\Desktop\CRM\dashboard_screenshots\02_start_new_application_ai_scanner.png'
    add_image_figure(doc, img_2_path, "Figure B.2: Admissions Application Portal — Institutional Selection & Gemini 2.0 Flash AI CV Auto-Fill")
    
    add_heading_3(doc, "Core Architectural Features:")
    add_bullet_item(doc, "Gemini 2.0 Flash AI Resume OCR Scanner: ", "An intelligent CV/resume scanning banner allowing applicants to upload their PDF resume or academic transcript. The Gemini AI engine parses unstructured content in real-time, automatically extracting personal details, academic scores, and demonyms with zero manual data entry.")
    add_bullet_item(doc, "Five-Step Structured Selection Hierarchy: ", "Guides the applicant through a logical institutional decision tree:")
    add_bullet_item(doc, "  1. Destination Country: ", "Filters universities across target countries including the UK, USA, Canada, Australia, and European partners.")
    add_bullet_item(doc, "  2. Partner University: ", "Selects from an active, contracted network of global higher education institutions.")
    add_bullet_item(doc, "  3. University Campus: ", "Accommodates multi-campus institutions, ensuring dossiers are routed to the appropriate campus admissions registry.")
    add_bullet_item(doc, "  4. Academic Programme: ", "Filters available undergraduate, postgraduate, and doctoral degree offerings.")
    add_bullet_item(doc, "  5. Target Intake Term: ", "Specifies the intended academic entry period (e.g., Fall September Intake, Spring January Intake).")
    add_bullet_item(doc, "Direct Dossier Wizard Progression: ", "The 'Proceed to Application Dossier' button transitions the student into the 11-step comprehensive application dossier wizard with pre-populated academic credentials.")

    # -------------------------------------------------------------
    # Figure B.3: Counsellor Advisory Desk & AI Guide Switcher
    # -------------------------------------------------------------
    add_heading_2(doc, "B.3 Counsellor Advisory Desk & AI Guide Switcher")
    add_body_paragraph(
        doc,
        "The Counsellor Advisory Desk provides a direct, highly responsive communication channel between the student and their "
        "assigned education counsellor, combining expert human mentorship with an intelligent AI guidance copilot."
    )
    img_3_path = r'c:\Users\m\OneDrive\Desktop\CRM\dashboard_screenshots\03_counsellor_advisory_desk.png'
    add_image_figure(doc, img_3_path, "Figure B.3: Counsellor Advisory Desk — Dedicated Student Consultation Console & AI Guide Toggle")
    
    add_heading_3(doc, "Core Architectural Features:")
    add_bullet_item(doc, "Dedicated Counsellor Profile Card: ", "Displays counsellor credentials (e.g., David Kim), verified education consultant badge, typical response time SLA (within 2 hours), and regional specializations (UK, Canada, Australia & USA).")
    add_bullet_item(doc, "Instant AI Advisory Toggle ('Switch to AI'): ", "Allows applicants to toggle instantly to the 24/7 AI Counsellor & Guide powered by Google Gemini, providing instantaneous answers to university questions outside office hours.")
    add_bullet_item(doc, "Pre-Configured Advisory Inquiry Starters: ", "One-click prompt suggestions covering frequent student queries:")
    add_bullet_item(doc, "  • ", "'How to choose best university across the world and select best program according to my qualification'")
    add_bullet_item(doc, "  • ", "'Could you please check my documents and verify if anything is missing?'")
    add_bullet_item(doc, "  • ", "'Can you review my profile and recommend top matching universities?'")
    add_bullet_item(doc, "  • ", "'What are the upcoming application deadlines for the September intake?'")
    add_bullet_item(doc, "Encrypted Messaging Stream: ", "End-to-end encrypted direct messaging supporting text, links, and binary file attachments with priority notifications sent directly to the agency admissions office.")

    # -------------------------------------------------------------
    # Figure B.4: Counsellor Command Center
    # -------------------------------------------------------------
    add_heading_2(doc, "B.4 Counsellor Command Center (Operations & Funnel Dashboard)")
    add_body_paragraph(
        doc,
        "The Counsellor Command Center is the high-performance operational cockpit designed for agency education counsellors. "
        "It provides immediate visibility into assigned prospective leads, active students, pending document verifications, "
        "and prioritized daily follow-ups."
    )
    img_4_path = r'c:\Users\m\OneDrive\Desktop\CRM\dashboard_screenshots\04_counsellor_command_center.png'
    add_image_figure(doc, img_4_path, "Figure B.4: Counsellor Command Center — Operational Pipeline, KPI Metrics & Conversion Funnel")
    
    add_heading_3(doc, "Core Architectural Features:")
    add_bullet_item(doc, "Five Core Operational KPI Cards: ", "Instant metric telemetry tracking:")
    add_bullet_item(doc, "  • My Assigned Leads: ", "New inquiries awaiting initial contact and eligibility qualification.")
    add_bullet_item(doc, "  • My Active Students: ", "Verified student accounts currently active in the counselling lifecycle.")
    add_bullet_item(doc, "  • Pending Docs: ", "Student document submissions requiring counsellor compliance verification.")
    add_bullet_item(doc, "  • My Applications: ", "University submissions currently being processed across global partner institutions.")
    add_bullet_item(doc, "  • Pending Tasks: ", "Overdue follow-up items, student callbacks, and university submission deadlines.")
    add_bullet_item(doc, "Conversion Funnel Progress Bar: ", "Visual lead-to-student conversion tracker calculating conversion ratios across the counsellor's portfolio.")
    add_bullet_item(doc, "Priority Follow-ups Smart Queue: ", "Algorithmically prioritized queue surfacing high-intent applicants and urgent cases.")
    add_bullet_item(doc, "Recent Applications Data Ledger: ", "Real-time table displaying application numbers, student names, partner universities, and active pipeline stages.")
    add_bullet_item(doc, "Quick Action Bar: ", "Instant action triggers to 'Create Task' and open the 'Course Matcher' engine during live consultations.")
    add_bullet_item(doc, "Counsellor Workspaces Navigation: ", "Direct routing to Lead Pipeline & Follow-up, Student Profiles & Scores, Document Vault Verification, and Course Search.")

    # -------------------------------------------------------------
    # Figure B.5: Communications & Support Hub
    # -------------------------------------------------------------
    add_heading_2(doc, "B.5 Communications & Support Hub (Multi-Role Messaging Desk)")
    add_body_paragraph(
        doc,
        "The Communications & Support Hub provides a role-governed messaging workspace where counsellors and staff manage "
        "active dialogues with students, review uploaded resumes, share internal notes, and maintain full compliance logging."
    )
    img_5_path = r'c:\Users\m\OneDrive\Desktop\CRM\dashboard_screenshots\05_communications_support_hub.png'
    add_image_figure(doc, img_5_path, "Figure B.5: Communications & Support Hub — Role-Governed Student Messaging & In-Chat Document Exchange")
    
    add_heading_3(doc, "Core Architectural Features:")
    add_bullet_item(doc, "Triaged Conversation Sidebar: ", "Allows staff to search students by name, email, or message content, with quick-filter tabs: 'All', 'My Assigned', and 'Needs Reply'.")
    add_bullet_item(doc, "Live Conversational Dialogue: ", "Features live messaging between applicant Saad Ali Qureshi and counsellor Mujtaba Zaheer / Demo Counsellor, demonstrating real-time websocket synchronization.")
    add_bullet_item(doc, "In-Chat PDF Document Attachment: ", "Displays uploaded student resumes directly within the conversational flow (e.g., 'saad resume (2).pdf', 110 KB), allowing counsellors to review credentials without leaving the desk.")
    add_bullet_item(doc, "Dual Response Control Modes: ", "Provides distinct tabs for 'Reply to Student' (sending external client communications) and 'Internal Staff Note' (recording private internal comments visible only to agency team members).")
    add_bullet_item(doc, "Audited Delivery Status: ", "Message delivery timestamps and read checkmarks provide compliance verification and response SLA tracking.")
    add_bullet_item(doc, "Global Support Desk Escalation: ", "Provides an integrated 'Contact Support Desk' action for escalating complex student issues or visa queries to specialized department heads.")

    # Save the updated document
    doc.save(dst_file)
    print(f"Updated document saved successfully to: {dst_file}")
    print(f"File size: {os.path.getsize(dst_file)} bytes")

if __name__ == '__main__':
    main()
