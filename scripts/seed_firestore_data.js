const fs = require('fs');
const path = require('path');

async function seedRealData() {
  const p = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  const store = JSON.parse(fs.readFileSync(p, 'utf8'));
  let token = store.tokens.access_token;

  if (store.tokens.refresh_token) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho85qd6.apps.googleusercontent.com',
        grant_type: 'refresh_token',
        refresh_token: store.tokens.refresh_token,
      })
    });
    const refreshData = await refreshRes.json();
    if (refreshData.access_token) token = refreshData.access_token;
  }

  const projectId = 'education-crm-9fee2';
  console.log(`Seeding real universities, programs & country requirements into ${projectId}...`);

  // REAL UNIVERSITIES & PROGRAMS
  const universities = [
    {
      id: "univ_manchester",
      name: "University of Manchester",
      country: "United Kingdom",
      city: "Manchester",
      campus: "Oxford Road Campus",
      website: "https://www.manchester.ac.uk",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/University_of_Manchester_logo.svg/320px-University_of_Manchester_logo.svg.png",
      coverImageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
      description: "A prestigious Russell Group institution renowned for academic excellence, world-class research, and strong global employer reputation.",
      ranking: "QS World Rank #34",
      tuitionRange: "£22,000 - £34,500",
      applicationFee: 60,
      scholarships: ["Global Futures Scholarship (£5,000)", "Manchester Humanities International Excellence (£3,000)"],
      programmes: [
        {
          id: "mcr_msc_ai",
          title: "MSc Artificial Intelligence",
          level: "Postgraduate",
          durationMonths: 12,
          tuitionFeeAnnual: 33500,
          currency: "GBP",
          intakes: ["September 2027", "September 2026"],
          deadline: "31 July 2027",
          minIeltsScore: 7.0,
          entryRequirements: "First or Upper Second Class UK Honours degree (or international equivalent with min 3.2/4.0 CGPA) in Computer Science or quantitative discipline.",
          field: "Artificial Intelligence",
          requiredDocuments: ["Passport", "Academic Transcript", "Degree Certificate", "Statement of Purpose", "Two Academic References"],
          requirements: { minGpa: 3.2, minIelts: 7.0, acceptedQualifications: ["Bachelor's Degree in CS/Math/Engineering"] },
          applicationForm: [
            { id: "math_background", label: "Describe your linear algebra, calculus, and probability coursework", type: "textarea", required: true, helpText: "List university modules with grades" },
            { id: "programming_languages", label: "Primary programming languages used in previous studies/projects", type: "text", required: true, helpText: "e.g. Python, C++, Java" }
          ]
        },
        {
          id: "mcr_msc_data_sci",
          title: "MSc Data Science (Computer Science Data Informatics)",
          level: "Postgraduate",
          durationMonths: 12,
          tuitionFeeAnnual: 32000,
          currency: "GBP",
          intakes: ["September 2027", "September 2026"],
          deadline: "31 July 2027",
          minIeltsScore: 7.0,
          entryRequirements: "Minimum 3.0/4.0 CGPA or 65% in relevant undergraduate degree.",
          field: "Data Science",
          requiredDocuments: ["Passport", "Academic Transcript", "Statement of Purpose"],
          requirements: { minGpa: 3.0, minIelts: 7.0 }
        },
        {
          id: "mcr_bsc_cs",
          title: "BSc Computer Science",
          level: "Undergraduate",
          durationMonths: 36,
          tuitionFeeAnnual: 31000,
          currency: "GBP",
          intakes: ["September 2027", "September 2026"],
          deadline: "30 June 2027",
          minIeltsScore: 6.5,
          entryRequirements: "A*AA at A-Level including Mathematics, or equivalent international high school credential (min 85%).",
          field: "Computer Science",
          requiredDocuments: ["Passport", "High School Transcript", "Statement of Purpose"],
          requirements: { minGpa: 3.5, minIelts: 6.5 }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "univ_toronto",
      name: "University of Toronto",
      country: "Canada",
      city: "Toronto",
      campus: "St. George Campus",
      website: "https://www.utoronto.ca",
      coverImageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
      description: "Canada's top-ranked research university located in the heart of North America's fastest-growing technology hub.",
      ranking: "QS World Rank #21",
      tuitionRange: "CAD 38,000 - CAD 62,000",
      applicationFee: 125,
      scholarships: ["Lester B. Pearson International Scholarship (Full Tuition)", "University of Toronto International Scholar Award"],
      programmes: [
        {
          id: "uoft_mscac",
          title: "Master of Science in Applied Computing (MScAC)",
          level: "Postgraduate",
          durationMonths: 16,
          tuitionFeeAnnual: 46000,
          currency: "CAD",
          intakes: ["September 2027"],
          deadline: "15 December 2026",
          minIeltsScore: 7.5,
          entryRequirements: "Appropriate bachelor's degree in Computer Science or related field with a mid-B average (min 3.3/4.0 CGPA).",
          field: "Computer Science",
          requiredDocuments: ["Passport", "Academic Transcript", "Degree Certificate", "Statement of Purpose", "CV", "Three Reference Letters"],
          requirements: { minGpa: 3.3, minIelts: 7.5 },
          applicationForm: [
            { id: "internship_preference", label: "Preferred 8-month industry internship area", type: "select", options: ["Machine Learning", "Quantum Computing", "Applied Math", "Data Science"], required: true }
          ]
        },
        {
          id: "uoft_bcom",
          title: "Bachelor of Commerce (Rotman Commerce)",
          level: "Undergraduate",
          durationMonths: 48,
          tuitionFeeAnnual: 61000,
          currency: "CAD",
          intakes: ["September 2027"],
          deadline: "15 January 2027",
          minIeltsScore: 6.5,
          entryRequirements: "High school completion with Calculus and Advanced Functions, minimum 88% average.",
          field: "Business & Management",
          requiredDocuments: ["Passport", "High School Transcript", "Rotman Supplemental Application"],
          requirements: { minGpa: 3.6, minIelts: 6.5 }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "univ_sydney",
      name: "University of Sydney",
      country: "Australia",
      city: "Sydney",
      campus: "Camperdown / Darlington",
      website: "https://www.sydney.edu.au",
      coverImageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
      description: "One of Australia's premier Group of Eight universities, celebrated for student experience, world-class facilities, and high graduate employability.",
      ranking: "QS World Rank #19",
      tuitionRange: "AUD 42,000 - AUD 54,000",
      applicationFee: 100,
      scholarships: ["Sydney International Student Award (20% fee reduction)", "Vice-Chancellor's International Scholarships ($10,000 - $40,000)"],
      programmes: [
        {
          id: "usyd_mit",
          title: "Master of Information Technology (MIT)",
          level: "Postgraduate",
          durationMonths: 24,
          tuitionFeeAnnual: 49500,
          currency: "AUD",
          intakes: ["February 2027", "July 2027"],
          deadline: "15 November 2026",
          minIeltsScore: 6.5,
          entryRequirements: "A bachelor's degree with a credit average (min 2.8/4.0 or 65%) in IT, Computer Science, or Software Engineering.",
          field: "Cyber Security",
          requiredDocuments: ["Passport", "Academic Transcript", "Degree Certificate", "Statement of Purpose"],
          requirements: { minGpa: 2.8, minIelts: 6.5 }
        },
        {
          id: "usyd_bcs",
          title: "Bachelor of Advanced Computing",
          level: "Undergraduate",
          durationMonths: 48,
          tuitionFeeAnnual: 52000,
          currency: "AUD",
          intakes: ["February 2027", "July 2027"],
          deadline: "31 December 2026",
          minIeltsScore: 6.5,
          entryRequirements: "ATAR 85 or equivalent international high school diploma with strong mathematics.",
          field: "Computer Science",
          requiredDocuments: ["Passport", "High School Transcript"],
          requirements: { minGpa: 3.2, minIelts: 6.5 }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "univ_tum",
      name: "Technical University of Munich (TUM)",
      country: "Germany",
      city: "Munich",
      campus: "Garching / Munich City",
      website: "https://www.tum.de",
      coverImageUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=1200&q=80",
      description: "Germany's #1 University of Excellence, a global powerhouse for engineering, informatics, and cutting-edge technology.",
      ranking: "QS World Rank #28",
      tuitionRange: "€4,000 - €6,000 per semester for international students",
      applicationFee: 50,
      scholarships: ["DAAD Scholarships", "TUM Merit Grant for International Students"],
      programmes: [
        {
          id: "tum_msc_informatics",
          title: "MSc Informatics (Computer Science)",
          level: "Postgraduate",
          durationMonths: 24,
          tuitionFeeAnnual: 12000,
          currency: "EUR",
          intakes: ["Winter (October 2027)", "Summer (April 2027)"],
          deadline: "31 May 2027",
          minIeltsScore: 6.5,
          entryRequirements: "Bachelor's degree in Computer Science or Informatics, min 3.0/4.0 CGPA, Curricular Analysis showing 120 ECTS in CS/Math.",
          field: "Computer Science",
          requiredDocuments: ["Passport", "Academic Transcript", "Curricular Analysis", "SOP", "GRE/GATE (Recommended)"],
          requirements: { minGpa: 3.0, minIelts: 6.5 }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: "univ_tcd",
      name: "Trinity College Dublin",
      country: "Ireland",
      city: "Dublin",
      campus: "College Green",
      website: "https://www.tcd.ie",
      coverImageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
      description: "Ireland's oldest and highest-ranked university, located adjacent to Silicon Docks Europe with exceptional post-study employability.",
      ranking: "QS World Rank #87",
      tuitionRange: "€18,000 - €26,000",
      applicationFee: 55,
      scholarships: ["Trinity Global Excellence Postgraduate Scholarship (€5,000)"],
      programmes: [
        {
          id: "tcd_msc_cs",
          title: "MSc Computer Science (Data Science / Intelligent Systems)",
          level: "Postgraduate",
          durationMonths: 12,
          tuitionFeeAnnual: 25800,
          currency: "EUR",
          intakes: ["September 2027"],
          deadline: "30 June 2027",
          minIeltsScore: 6.5,
          entryRequirements: "Upper Second Class Honours (2.1) or min 3.2/4.0 CGPA in Computer Science or closely related discipline.",
          field: "Computer Science",
          requiredDocuments: ["Passport", "Academic Transcript", "Two References", "Statement of Purpose"],
          requirements: { minGpa: 3.2, minIelts: 6.5 }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  // Helper to convert JS object to Firestore document payload
  function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { integerValue: String(val) };
      return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(toFirestoreValue) } };
    }
    if (typeof val === 'object') {
      const fields = {};
      for (const [k, v] of Object.entries(val)) {
        fields[k] = toFirestoreValue(v);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  // Write Universities
  for (const univ of universities) {
    console.log(`Writing university: ${univ.name} (${univ.id})...`);
    const fields = {};
    for (const [k, v] of Object.entries(univ)) {
      if (k !== 'id') fields[k] = toFirestoreValue(v);
    }
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/universities/${univ.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields })
    });
    if (res.ok) {
      console.log(`✓ ${univ.name} seeded successfully.`);
    } else {
      console.error(`✗ Error seeding ${univ.name}:`, await res.text());
    }
  }

  // REAL COUNTRY REQUIREMENTS (Database-driven)
  const countryReqs = [
    {
      id: "req_uk",
      country: "United Kingdom",
      visaType: "Student Visa (formerly Tier 4)",
      financialMaintenance: "£1,483/month (inside London) or £1,136/month (outside London) for up to 9 months",
      biometricsRequired: true,
      tbTestRequired: true,
      allowedWorkHours: "20 hours per week during term time, full-time during holidays",
      postStudyWork: "Graduate Route: 2 years (or 3 years for PhD graduates)",
      officialWebsite: "https://www.gov.uk/student-visa"
    },
    {
      id: "req_canada",
      country: "Canada",
      visaType: "Study Permit",
      financialMaintenance: "CAD 20,635/year living expenses + first year tuition fee",
      biometricsRequired: true,
      medicalExamRequired: true,
      postStudyWork: "Post-Graduation Work Permit (PGWP) up to 3 years",
      officialWebsite: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html"
    },
    {
      id: "req_australia",
      country: "Australia",
      visaType: "Student Visa (Subclass 500)",
      financialMaintenance: "AUD 29,710/year living expenses + tuition fee + travel",
      genuineStudentRequirement: "Genuine Student (GS) assessment",
      postStudyWork: "Temporary Graduate Visa (Subclass 485) 2-4 years",
      officialWebsite: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"
    },
    {
      id: "req_germany",
      country: "Germany",
      visaType: "National Visa (Type D) for Study Purposes",
      financialMaintenance: "Blocked Account (Sperrkonto) with €11,208 per year",
      healthInsuranceRequired: true,
      postStudyWork: "18-month Job Seeking Visa post-graduation",
      officialWebsite: "https://www.make-it-in-germany.com/en/visa-residence/types/studying"
    }
  ];

  for (const cReq of countryReqs) {
    console.log(`Writing country requirements: ${cReq.country}...`);
    const fields = {};
    for (const [k, v] of Object.entries(cReq)) {
      if (k !== 'id') fields[k] = toFirestoreValue(v);
    }
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/country_requirements/${cReq.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields })
    });
    if (res.ok) {
      console.log(`✓ ${cReq.country} requirements seeded.`);
    } else {
      console.error(`✗ Error seeding country requirements:`, await res.text());
    }
  }

  console.log("Firestore seeding complete!");
}

seedRealData().catch(console.error);
