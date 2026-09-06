import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// You must run this script with GOOGLE_APPLICATION_CREDENTIALS set.
// Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
// Then run: npx ts-node scripts/diagnostic-relationships.ts

async function runDiagnostics() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error("ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable not set.");
    console.error("Please export it and run the script again.");
    process.exit(1);
  }

  initializeApp();
  const db = getFirestore();
  
  console.log("Starting CRM Data Diagnostics...");
  console.log("================================\n");

  const results = {
    countries: new Set<string>(),
    universities: 0,
    programs: 0,
    invalidUniversities: [] as string[],
    invalidPrograms: [] as string[],
    orphanUniversities: [] as string[],
    duplicateUniversities: new Set<string>(),
    duplicatePrograms: new Set<string>(),
    countryBreakdown: {} as Record<string, { universities: number; programs: number }>
  };

  try {
    const univSnap = await db.collection("universities").get();
    results.universities = univSnap.size;

    const seenUniversityNames = new Set<string>();

    for (const doc of univSnap.docs) {
      const u = doc.data();
      const uId = doc.id;
      const uName = u.name;
      const uCountry = u.country;
      const programmes = u.programmes || [];

      if (!uName) {
        results.invalidUniversities.push(`Missing name (ID: ${uId})`);
        continue;
      }
      if (!uCountry) {
        results.invalidUniversities.push(`Missing country (Univ: ${uName})`);
        results.orphanUniversities.push(uName);
        continue;
      }

      if (seenUniversityNames.has(uName.toLowerCase())) {
        results.duplicateUniversities.add(uName);
      }
      seenUniversityNames.add(uName.toLowerCase());

      const normCountry = uCountry.trim();
      results.countries.add(normCountry);

      if (!results.countryBreakdown[normCountry]) {
        results.countryBreakdown[normCountry] = { universities: 0, programs: 0 };
      }
      results.countryBreakdown[normCountry].universities++;
      results.countryBreakdown[normCountry].programs += programmes.length;
      results.programs += programmes.length;

      const seenProgrammes = new Set<string>();
      for (const p of programmes) {
        if (!p.id || !p.title) {
          results.invalidPrograms.push(`Missing ID or Title in Univ: ${uName}`);
        }
        if (seenProgrammes.has(p.title.toLowerCase())) {
          results.duplicatePrograms.add(`${uName} - ${p.title}`);
        }
        seenProgrammes.add(p.title.toLowerCase());
      }
    }

    console.log("=== DIAGNOSTIC REPORT ===");
    console.log(`Total Countries: ${results.countries.size}`);
    console.log(`Total Universities: ${results.universities}`);
    console.log(`Total Programs: ${results.programs}`);
    console.log("\n--- Country Breakdown ---");
    for (const [country, stats] of Object.entries(results.countryBreakdown).sort()) {
      console.log(`${country}:`);
      console.log(`  Universities: ${stats.universities}`);
      console.log(`  Programs: ${stats.programs}`);
    }

    console.log("\n--- Issues Detected ---");
    console.log(`Invalid Universities: ${results.invalidUniversities.length > 0 ? results.invalidUniversities.join(", ") : "None"}`);
    console.log(`Invalid Programs: ${results.invalidPrograms.length > 0 ? results.invalidPrograms.join(", ") : "None"}`);
    console.log(`Orphan Universities: ${results.orphanUniversities.length > 0 ? results.orphanUniversities.join(", ") : "None"}`);
    console.log(`Duplicate Universities: ${results.duplicateUniversities.size > 0 ? Array.from(results.duplicateUniversities).join(", ") : "None"}`);
    console.log(`Duplicate Programs: ${results.duplicatePrograms.size > 0 ? Array.from(results.duplicatePrograms).join(", ") : "None"}`);
    
    console.log("\nDiagnostics Complete.");

  } catch (error) {
    console.error("Error during diagnostics:", error);
  }
}

runDiagnostics();
