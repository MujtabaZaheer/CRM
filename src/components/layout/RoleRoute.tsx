import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGate } from "./RoleGate";
import { UserRole } from "../../types/role";

export const RoleRoute: React.FC<{ role: UserRole }> = ({ role }) => <RoleGate allowedRoles={[role]}><Outlet /></RoleGate>;
