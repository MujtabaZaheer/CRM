import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGate } from "./RoleGate";

export const AuditorRoute: React.FC = () => (
  <RoleGate allowedRoles={["auditor", "compliance_officer", "platform_super_admin", "org_admin"]}>
    <Outlet />
  </RoleGate>
);
