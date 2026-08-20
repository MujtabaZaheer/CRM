/**
 * EduCRM Intelligent Lead Routing Engine
 * Distributes incoming leads to counsellors based on configurable strategies:
 * - round-robin: sequential assignment across active counsellors
 * - workload-balanced: assigns to counsellor with lowest active lead count
 * - country-match: matches lead destination country to counsellor specialization
 * - programme-match: matches lead interest to counsellor expertise
 */

import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase/config";
import { Lead } from "../types/lead";
import { AppUser } from "../types/role";

export type RoutingStrategy = "round-robin" | "workload-balanced" | "country-match" | "programme-match";

export interface LeadRoutingConfig {
  activeStrategy: RoutingStrategy;
  autoAssignEnabled: boolean;
  countryMappings: Record<string, string[]>; // country -> counsellorUids[]
  programmeMappings: Record<string, string[]>; // programmeKeyword -> counsellorUids[]
  lastAssignedIndex: number;
}

const DEFAULT_CONFIG: LeadRoutingConfig = {
  activeStrategy: "round-robin",
  autoAssignEnabled: true,
  countryMappings: {},
  programmeMappings: {},
  lastAssignedIndex: 0,
};

/**
 * Fetch the active routing configuration from Firestore.
 */
export async function getLeadRoutingConfig(): Promise<LeadRoutingConfig> {
  try {
    const snap = await getDoc(doc(db, "config", "lead_routing"));
    if (snap.exists()) {
      return { ...DEFAULT_CONFIG, ...snap.data() } as LeadRoutingConfig;
    }
  } catch (err) {
    console.warn("Using default lead routing config:", err);
  }
  return DEFAULT_CONFIG;
}

/**
 * Fetch all active counsellors from the system.
 */
export async function getActiveCounsellors(): Promise<AppUser[]> {
  try {
    const q = query(collection(db, "users"), where("role", "==", "counsellor"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
  } catch (err) {
    console.warn("Failed to fetch counsellors:", err);
    return [];
  }
}

/**
 * Automatically assign a lead to a counsellor using the specified strategy.
 * Returns the selected counsellor or null if none available.
 */
export async function autoAssignLead(
  lead: Partial<Lead>,
  counsellors?: AppUser[],
  strategyOverride?: RoutingStrategy
): Promise<{ counsellorId: string; counsellorName: string } | null> {
  const availableCounsellors = counsellors && counsellors.length > 0 
    ? counsellors 
    : await getActiveCounsellors();

  if (availableCounsellors.length === 0) return null;

  const config = await getLeadRoutingConfig();
  const strategy = strategyOverride || config.activeStrategy;

  switch (strategy) {
    case "country-match": {
      const dest = lead.destinationCountry?.toLowerCase().trim();
      if (dest && config.countryMappings) {
        for (const [country, uids] of Object.entries(config.countryMappings)) {
          if (dest.includes(country.toLowerCase()) && uids.length > 0) {
            const matched = availableCounsellors.filter((c) => uids.includes(c.uid));
            if (matched.length > 0) {
              const selected = matched[Math.floor(Math.random() * matched.length)];
              return { counsellorId: selected.uid, counsellorName: selected.displayName || selected.email };
            }
          }
        }
      }
      // Fallback to round-robin
      break;
    }

    case "programme-match": {
      const prog = lead.programInterest?.toLowerCase().trim();
      if (prog && config.programmeMappings) {
        for (const [category, uids] of Object.entries(config.programmeMappings)) {
          if (prog.includes(category.toLowerCase()) && uids.length > 0) {
            const matched = availableCounsellors.filter((c) => uids.includes(c.uid));
            if (matched.length > 0) {
              const selected = matched[Math.floor(Math.random() * matched.length)];
              return { counsellorId: selected.uid, counsellorName: selected.displayName || selected.email };
            }
          }
        }
      }
      // Fallback to round-robin
      break;
    }

    case "workload-balanced": {
      try {
        const leadCounts: Record<string, number> = {};
        for (const c of availableCounsellors) {
          const lq = query(
            collection(db, "leads"),
            where("assignedTo", "==", c.uid),
            where("stage", "not-in", ["Converted", "Lost", "Unresponsive"])
          );
          const lsnap = await getDocs(lq);
          leadCounts[c.uid] = lsnap.size;
        }
        const sorted = [...availableCounsellors].sort(
          (a, b) => (leadCounts[a.uid] || 0) - (leadCounts[b.uid] || 0)
        );
        const selected = sorted[0];
        return { counsellorId: selected.uid, counsellorName: selected.displayName || selected.email };
      } catch (err) {
        console.warn("Workload count failed, falling back to round-robin:", err);
      }
      break;
    }

    case "round-robin":
    default:
      break;
  }

  // Default Round-Robin strategy
  const nextIdx = (config.lastAssignedIndex || 0) % availableCounsellors.length;
  const selected = availableCounsellors[nextIdx];

  // Update lastAssignedIndex in Firestore
  try {
    await updateDoc(doc(db, "config", "lead_routing"), {
      lastAssignedIndex: increment(1),
    });
  } catch (_) {
    // best effort in demo
  }

  return {
    counsellorId: selected.uid,
    counsellorName: selected.displayName || selected.email,
  };
}
