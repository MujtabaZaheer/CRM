import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Note: To run this script, you must provide a service account JSON file
// e.g. export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
try {
  initializeApp();
} catch (e) {
  console.log("Please export GOOGLE_APPLICATION_CREDENTIALS before running.");
  process.exit(1);
}

const db = getFirestore();

// Helper to normalize country names to match frontend UI exactly
const COUNTRY_MAP: Record<string, string> = {
  "uk": "United Kingdom",
  "usa": "United States",
  "us": "United States",
  "uae": "United Arab Emirates"
};

async function validateDataIntegrity() {
  console.log("=== EduCRM Data Integrity Audit ===");

  const univSnapshot = await db.collection("universities").get();
  let totalUniversities = 0;
  let totalProgrammes = 0;
  
  let invalidCountries = 0;
  let fixedCountries = 0;
  
  const countrySet = new Set<string>();

  const updates: Promise<any>[] = [];

  for (const doc of univSnapshot.docs) {
    const data = doc.data();
    totalUniversities++;
    
    // 1. Audit Country
    let currentCountry = data.country || "Unknown";
    let normalized = COUNTRY_MAP[currentCountry.toLowerCase().trim()] || currentCountry.trim();
    
    if (normalized !== currentCountry) {
      invalidCountries++;
      console.log(`[FIX] University ${data.name}: Changing country '${currentCountry}' -> '${normalized}'`);
      updates.push(doc.ref.update({ country: normalized, updatedAt: Date.now() }));
      fixedCountries++;
      countrySet.add(normalized);
    } else {
      countrySet.add(currentCountry);
    }

    // 2. Audit Programmes (Embedded array in this architecture)
    if (Array.isArray(data.programmes)) {
      totalProgrammes += data.programmes.length;
      
      let programmesModified = false;
      const auditedProgrammes = data.programmes.map((prog: any) => {
        // Ensure every programme has a valid ID
        if (!prog.id) {
          prog.id = crypto.randomUUID();
          programmesModified = true;
        }
        return prog;
      });

      if (programmesModified) {
        updates.push(doc.ref.update({ programmes: auditedProgrammes, updatedAt: Date.now() }));
      }
    } else {
      // Initialize empty programmes array if missing
      updates.push(doc.ref.update({ programmes: [], updatedAt: Date.now() }));
    }
  }

  await Promise.all(updates);

  console.log("\n=== Audit Report ===");
  console.log(`Countries found: ${countrySet.size}`);
  console.log(`Universities scanned: ${totalUniversities}`);
  console.log(`Universities with invalid country names: ${invalidCountries} (Fixed: ${fixedCountries})`);
  console.log(`Embedded Programmes scanned: ${totalProgrammes}`);
  console.log("==============================\n");
}

validateDataIntegrity().catch(console.error);
