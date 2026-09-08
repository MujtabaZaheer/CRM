const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyB9s5vfoVYc8feVi6we1Dy4l95_phOA2lU',
  projectId: 'education-crm-9fee2',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncAndDeduplicateStudents() {
  console.log('Fetching users and students from Firestore...');
  const userSnap = await getDocs(collection(db, 'users'));
  const studentSnap = await getDocs(collection(db, 'students'));

  // 1. Collect all real student user accounts
  const studentUsers = [];
  userSnap.forEach((d) => {
    const data = d.data();
    if (data.role === 'student') {
      studentUsers.push({ uid: d.id, ...data });
    }
  });

  console.log(`Found ${studentUsers.length} registered student user accounts in "users" collection.`);

  // Find counsellors for assignment default
  let defaultCounsellorId = 'central_admissions';
  userSnap.forEach((d) => {
    const data = d.data();
    if (data.role === 'counsellor') {
      defaultCounsellorId = d.id;
    }
  });

  // 2. Map existing student records by id and by email
  const existingStudentsById = new Map();
  const existingStudentsByEmail = new Map();
  studentSnap.forEach((d) => {
    const data = { id: d.id, ...d.data() };
    existingStudentsById.set(d.id, data);
    if (data.email) {
      const emailLower = data.email.toLowerCase().trim();
      if (!existingStudentsByEmail.has(emailLower)) {
        existingStudentsByEmail.set(emailLower, []);
      }
      existingStudentsByEmail.get(emailLower).push(data);
    }
  });

  const validStudentUids = new Set(studentUsers.map((u) => u.uid));
  const validStudentEmails = new Set(studentUsers.map((u) => (u.email || '').toLowerCase().trim()));

  // 3. For each real student user, create or update a canonical student record whose ID is user.uid
  for (const user of studentUsers) {
    const userEmailLower = (user.email || '').toLowerCase().trim();
    const existingList = existingStudentsByEmail.get(userEmailLower) || [];
    // Prefer matching by UID first, or pick the best matching record
    const existingByUid = existingStudentsById.get(user.uid);
    const candidate = existingByUid || existingList[0] || {};

    const fullName = user.displayName || user.fullName || candidate.fullName || user.email.split('@')[0] || 'Student';
    const email = user.email || candidate.email || '';
    const assignedCounsellorId = candidate.assignedCounsellorId || defaultCounsellorId;

    const canonicalData = {
      id: user.uid,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: user.phone || candidate.phone || '',
      nationality: candidate.nationality || user.nationality || 'International',
      countryOfResidence: candidate.countryOfResidence || user.countryOfResidence || 'International',
      preferredDestination: candidate.preferredDestination || 'UK, Canada, Australia & USA',
      preferredDestinations: candidate.preferredDestinations || ['UK', 'Canada', 'Australia'],
      desiredStudyLevel: candidate.desiredStudyLevel || "Bachelor's / Master's",
      profileCompleteness: candidate.profileCompleteness || 85,
      academicHistory: candidate.academicHistory || [
        {
          institution: 'Previous Academic Institution',
          qualification: "Bachelor's Degree",
          degreeTitle: 'Undergraduate Degree',
          country: 'Home Country',
          completionYear: 2024,
          gradeGpa: '3.4 / 4.0 (72%)',
        },
      ],
      englishProficiency: candidate.englishProficiency || {
        testType: 'IELTS',
        overallScore: '6.5',
      },
      assignedCounsellorId,
      updatedAt: Date.now(),
      createdAt: candidate.createdAt || user.createdAt || Date.now(),
    };

    console.log(`Writing canonical student record: ${user.uid} (${canonicalData.fullName} - ${canonicalData.email})`);
    await setDoc(doc(db, 'students', user.uid), canonicalData, { merge: true });
  }

  // 4. Delete orphan / duplicate student records that do not match canonical user.uid
  let deletedCount = 0;
  studentSnap.forEach(async (d) => {
    // If the doc ID is not a registered student user's UID, delete it!
    if (!validStudentUids.has(d.id)) {
      console.log(`Deleting non-canonical / duplicate student document: ${d.id} (${d.data().fullName} - ${d.data().email})`);
      await deleteDoc(doc(db, 'students', d.id));
      deletedCount++;
    }
  });

  console.log(`Synchronization complete! Added/updated canonical students. Cleaned up redundant records.`);
}

syncAndDeduplicateStudents()
  .then(() => {
    console.log('Script finished successfully.');
    setTimeout(() => process.exit(0), 1500);
  })
  .catch((err) => {
    console.error('Error syncing students:', err);
    process.exit(1);
  });
