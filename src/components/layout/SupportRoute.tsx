import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGate } from "./RoleGate";

export const SupportRoute: React.FC = () => (
  <RoleGate allowedRoles={["support_user", "platform_super_admin", "org_admin"]}>
    <Outlet />
  </RoleGate>
);
