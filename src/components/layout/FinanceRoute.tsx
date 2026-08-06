import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGate } from "./RoleGate";

export const FinanceRoute: React.FC = () => <RoleGate allowedRoles={["finance_officer"]}><Outlet /></RoleGate>;
