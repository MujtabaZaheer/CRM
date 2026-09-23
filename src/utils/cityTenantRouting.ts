/**
 * Dynamic City Tenant Routing & Auto-Assignment Engine
 * Binds incoming student applications to localized city tenants and allocates
 * dedicated branch staff (Counsellors, Team Leaders) to ensure localized data isolation.
 */

import { collection, getDocs, query, where } from "firebase/firestore";

export interface BranchCityConfig {
  city: string;
  tenantId: string;
  label: string;
  country: string;
  branchName: string;
  aliases: string[];
}

export const SUPPORTED_BRANCH_CITIES: BranchCityConfig[] = [
  {
    city: "Islamabad",
    tenantId: "tenant-islamabad",
    label: "Islamabad Branch (Pakistan)",
    country: "Pakistan",
    branchName: "Islamabad Regional Office",
    aliases: ["islamabad", "isb", "rawalpindi", "isb/rwp", "federal capital"],
  },
  {
    city: "Lahore",
    tenantId: "tenant-lahore",
    label: "Lahore Branch (Pakistan)",
    country: "Pakistan",
    branchName: "Lahore Regional Office",
    aliases: ["lahore", "lhr", "punjab"],
  },
  {
    city: "Karachi",
    tenantId: "tenant-karachi",
    label: "Karachi Branch (Pakistan)",
    country: "Pakistan",
    branchName: "Karachi Regional Office",
    aliases: ["karachi", "khi", "sindh"],
  },
  {
    city: "London",
    tenantId: "tenant-london",
    label: "London Global HQ (UK)",
    country: "United Kingdom",
    branchName: "London Central Headquarters",
    aliases: ["london", "ldn", "uk", "great britain", "england"],
  },
  {
    city: "Dubai",
    tenantId: "tenant-dubai",
    label: "Dubai Middle East Hub (UAE)",
    country: "UAE",
    branchName: "Dubai Regional Office",
    aliases: ["dubai", "dxb", "uae", "united arab emirates", "sharjah", "abu dhabi"],
  },
];

export const CITY_TENANT_MAP: Record<string, string> = {
  islamabad: "tenant-islamabad",
  lahore: "tenant-lahore",
  karachi: "tenant-karachi",
  london: "tenant-london",
  dubai: "tenant-dubai",
};

export interface CityStaffMember {
  uid: string;
  name: string;
  email: string;
  role: "counsellor" | "team_leader" | "finance_officer" | "org_admin";
  tenantId: string;
  city: string;
  activeCaseload?: number;
}

/**
 * Pre-configured roster of designated branch staff per city tenant.
 * Used for deterministic allocation and as immediate fallback if remote query is offline.
 */
export const DEFAULT_CITY_STAFF: Record<string, CityStaffMember[]> = {
  "tenant-islamabad": [
    {
      uid: "staff_isb_couns_1",
      name: "Zainab Malik",
      email: "zainab.malik@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-islamabad",
      city: "Islamabad",
      activeCaseload: 4,
    },
    {
      uid: "staff_isb_couns_2",
      name: "Bilal Haider",
      email: "bilal.haider@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-islamabad",
      city: "Islamabad",
      activeCaseload: 6,
    },
    {
      uid: "staff_isb_lead_1",
      name: "Hamza Tariq",
      email: "hamza.tariq@educrm.demo",
      role: "team_leader",
      tenantId: "tenant-islamabad",
      city: "Islamabad",
    },
    {
      uid: "staff_isb_fin_1",
      name: "Usman Farooq",
      email: "usman.farooq@educrm.demo",
      role: "finance_officer",
      tenantId: "tenant-islamabad",
      city: "Islamabad",
    },
    {
      uid: "staff_isb_admin_1",
      name: "Asad Mehmood",
      email: "asad.admin@educrm.demo",
      role: "org_admin",
      tenantId: "tenant-islamabad",
      city: "Islamabad",
    },
  ],
  "tenant-lahore": [
    {
      uid: "staff_lhr_couns_1",
      name: "Ayesha Khan",
      email: "ayesha.khan@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-lahore",
      city: "Lahore",
      activeCaseload: 5,
    },
    {
      uid: "staff_lhr_lead_1",
      name: "Omar Farooq",
      email: "omar.farooq@educrm.demo",
      role: "team_leader",
      tenantId: "tenant-lahore",
      city: "Lahore",
    },
    {
      uid: "staff_lhr_fin_1",
      name: "Faizan Ali",
      email: "faizan.ali@educrm.demo",
      role: "finance_officer",
      tenantId: "tenant-lahore",
      city: "Lahore",
    },
  ],
  "tenant-karachi": [
    {
      uid: "staff_khi_couns_1",
      name: "Murtaza Shah",
      email: "murtaza.shah@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-karachi",
      city: "Karachi",
      activeCaseload: 3,
    },
    {
      uid: "staff_khi_lead_1",
      name: "Sara Siddiqui",
      email: "sara.siddiqui@educrm.demo",
      role: "team_leader",
      tenantId: "tenant-karachi",
      city: "Karachi",
    },
    {
      uid: "staff_khi_fin_1",
      name: "Adnan Qureshi",
      email: "adnan.qureshi@educrm.demo",
      role: "finance_officer",
      tenantId: "tenant-karachi",
      city: "Karachi",
    },
  ],
  "tenant-london": [
    {
      uid: "staff_ldn_couns_1",
      name: "David Kim",
      email: "david.kim@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-london",
      city: "London",
      activeCaseload: 8,
    },
    {
      uid: "staff_ldn_lead_1",
      name: "Sarah Jenkins",
      email: "sarah.jenkins@educrm.demo",
      role: "team_leader",
      tenantId: "tenant-london",
      city: "London",
    },
    {
      uid: "staff_ldn_fin_1",
      name: "Michael Chen",
      email: "michael.chen@educrm.demo",
      role: "finance_officer",
      tenantId: "tenant-london",
      city: "London",
    },
  ],
  "tenant-dubai": [
    {
      uid: "staff_dxb_couns_1",
      name: "Priya Sharma",
      email: "priya.sharma@educrm.demo",
      role: "counsellor",
      tenantId: "tenant-dubai",
      city: "Dubai",
      activeCaseload: 2,
    },
    {
      uid: "staff_dxb_lead_1",
      name: "Tariq Mansoor",
      email: "tariq.mansoor@educrm.demo",
      role: "team_leader",
      tenantId: "tenant-dubai",
      city: "Dubai",
    },
    {
      uid: "staff_dxb_fin_1",
      name: "Fatima Al-Nuaimi",
      email: "fatima.nuaimi@educrm.demo",
      role: "finance_officer",
      tenantId: "tenant-dubai",
      city: "Dubai",
    },
  ],
};

/**
 * Normalizes input city/branch string and resolves to the canonical tenantId.
 * Defaults gracefully to 'tenant-london' if not found.
 */
export function resolveCityTenant(inputCity?: string): string {
  if (!inputCity || typeof inputCity !== "string") {
    return "tenant-london";
  }

  const normalized = inputCity.trim().toLowerCase();

  // 1. Direct key match
  if (CITY_TENANT_MAP[normalized]) {
    return CITY_TENANT_MAP[normalized];
  }

  // 2. Direct tenantId input
  if (normalized.startsWith("tenant-")) {
    const directMatch = SUPPORTED_BRANCH_CITIES.find((b) => b.tenantId === normalized);
    if (directMatch) return directMatch.tenantId;
  }

  // 3. Alias / partial match
  for (const branch of SUPPORTED_BRANCH_CITIES) {
    if (branch.city.toLowerCase() === normalized) {
      return branch.tenantId;
    }
    if (branch.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      return branch.tenantId;
    }
  }

  return "tenant-london";
}

/**
 * Returns canonical city name from tenantId or city name.
 */
export function getCityByTenantId(tenantId: string): string {
  const branch = SUPPORTED_BRANCH_CITIES.find((b) => b.tenantId === tenantId);
  return branch?.city || "London";
}

export interface CityStaffAssignmentResult {
  tenantId: string;
  assignedCity: string;
  assignedCounsellorId: string;
  assignedCounsellorEmail: string;
  assignedCounsellor: string;
  assignedTeamLeaderId: string;
  assignedTeamLeaderEmail: string;
  assignedTeamLeader: string;
  assignedOfficerEmail: string;
}

/**
 * Selects an active counsellor and team leader scoped to the resolved tenant.
 * Uses round-robin / lowest active caseload heuristic.
 */
export async function autoAssignCityStaff(
  cityOrTenant: string,
  firestoreDb?: any
): Promise<CityStaffAssignmentResult> {
  const tenantId = cityOrTenant.startsWith("tenant-") ? cityOrTenant : resolveCityTenant(cityOrTenant);
  const assignedCity = getCityByTenantId(tenantId);

  let counsellors: CityStaffMember[] = [];
  let teamLeaders: CityStaffMember[] = [];

  // Attempt to query real staff from Firestore if db is supplied
  if (firestoreDb) {
    try {
      const usersRef = collection(firestoreDb, "users");
      const staffQuery = query(
        usersRef,
        where("tenantId", "==", tenantId),
        where("accountStatus", "in", ["active", "Active"])
      );
      const snap = await getDocs(staffQuery);
      if (!snap.empty) {
        snap.forEach((doc) => {
          const d = doc.data() as any;
          if (d.role === "counsellor") {
            counsellors.push({
              uid: doc.id,
              name: d.displayName || d.fullName || "City Counsellor",
              email: d.email,
              role: "counsellor",
              tenantId,
              city: assignedCity,
              activeCaseload: typeof d.activeCaseload === "number" ? d.activeCaseload : 0,
            });
          } else if (d.role === "team_leader") {
            teamLeaders.push({
              uid: doc.id,
              name: d.displayName || d.fullName || "City Team Leader",
              email: d.email,
              role: "team_leader",
              tenantId,
              city: assignedCity,
            });
          }
        });
      }
    } catch {
      // Fallback seamlessly to configured staff roster if Firestore is offline or permissions restrict
    }
  }

  // Fallback to configured roster if no staff retrieved dynamically
  if (counsellors.length === 0) {
    const roster = DEFAULT_CITY_STAFF[tenantId] || DEFAULT_CITY_STAFF["tenant-london"];
    counsellors = roster.filter((s) => s.role === "counsellor");
  }

  if (teamLeaders.length === 0) {
    const roster = DEFAULT_CITY_STAFF[tenantId] || DEFAULT_CITY_STAFF["tenant-london"];
    teamLeaders = roster.filter((s) => s.role === "team_leader");
  }

  // Least-caseload counsellor selection
  counsellors.sort((a, b) => (a.activeCaseload ?? 0) - (b.activeCaseload ?? 0));
  const chosenCounsellor = counsellors[0] || {
    uid: `usr_${tenantId.replace("tenant-", "")}_couns`,
    name: `${assignedCity} Counsellor`,
    email: `counsellor.${assignedCity.toLowerCase()}@educrm.demo`,
    role: "counsellor",
    tenantId,
    city: assignedCity,
  };

  const chosenTeamLeader = teamLeaders[0] || {
    uid: `usr_${tenantId.replace("tenant-", "")}_lead`,
    name: `${assignedCity} Team Leader`,
    email: `lead.${assignedCity.toLowerCase()}@educrm.demo`,
    role: "team_leader",
    tenantId,
    city: assignedCity,
  };

  return {
    tenantId,
    assignedCity,
    assignedCounsellorId: chosenCounsellor.uid,
    assignedCounsellorEmail: chosenCounsellor.email,
    assignedCounsellor: chosenCounsellor.name,
    assignedTeamLeaderId: chosenTeamLeader.uid,
    assignedTeamLeaderEmail: chosenTeamLeader.email,
    assignedTeamLeader: chosenTeamLeader.name,
    assignedOfficerEmail: chosenCounsellor.email,
  };
}
