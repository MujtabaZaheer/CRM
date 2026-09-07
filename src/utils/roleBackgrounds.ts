import { UserRole } from "../types/role";

/**
 * Role-to-Background Image Mapping
 * Provides subtle, role-tailored ambient photography across the platform.
 */
export const ROLE_BACKGROUND_MAP: Record<UserRole, string> = {
  student: "/images/student_campus_hero.jpg",
  counsellor: "/images/role_counsellor.jpg",
  team_leader: "/images/role_counsellor.jpg",
  admissions_officer: "/images/campus_us.jpg",
  university_partner: "/images/campus_us.jpg",
  finance_officer: "/images/role_finance.jpg",
  visa_officer: "/images/role_visa.jpg",
  compliance_officer: "/images/role_visa.jpg",
  external_agent: "/images/role_agent.jpg",
  platform_super_admin: "/images/role_admin.jpg",
  org_admin: "/images/role_admin.jpg",
  office_manager: "/images/role_admin.jpg",
  auditor: "/images/role_admin.jpg",
  support_user: "/images/role_admin.jpg",
};

/**
 * Resolves the background image for a given user role.
 */
export function getRoleBackground(role?: UserRole | string | null): string {
  if (!role) return "/images/campus_uk.jpg";
  return ROLE_BACKGROUND_MAP[role as UserRole] || "/images/campus_uk.jpg";
}

/**
 * Resolves context-aware background photography based on current route and user role.
 * Provides authentic, high-definition university campus atmosphere for each functional workspace.
 */
export function getAtmosphericBackground(pathname: string = "", role?: UserRole | string | null): string {
  const path = (pathname || "").toLowerCase();

  // 1. Specific student portal sections
  if (path.includes("/student/universities") || path.includes("/universities")) {
    return "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=85"; // Grand University Quadrangle
  }
  if (path.includes("/student/programs") || path.includes("/programs")) {
    return "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=85"; // Modern University Innovation Hub
  }
  if (path.includes("/student/applications") || path.includes("/applications")) {
    return "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2000&q=85"; // Campus Courtyard & Library
  }
  if (path.includes("/student/new-application")) {
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=2000&q=85"; // Modern Academic Lecture Hall
  }
  if (path.includes("/student/documents") || path.includes("/documents")) {
    return "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=2000&q=85"; // Historic University Library Archive
  }
  if (path.includes("/student/profile") || path.includes("/profile")) {
    return "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=2000&q=85"; // Historic Quad & Parkville Campus
  }
  if (path.includes("/student/messages") || path.includes("/messages")) {
    return "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=2000&q=85"; // Student Commons & Advisory Lounge
  }
  if (path.includes("/student") || path === "/") {
    return "/images/student_campus_hero.jpg"; // Oxford / Camperdown Hero
  }

  return getRoleBackground(role);
}
