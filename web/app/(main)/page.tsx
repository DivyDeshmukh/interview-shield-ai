"use client";

import CandidateDashboard from "@/components/dashboard/CandidateDashboard";
import RecruiterDashboard from "@/components/dashboard/RecruiterDashboard";
import { useRole } from "@/lib/context/RoleContext";

export default function DashboardPage() {
  const { role } = useRole();

  return role === "recruiter" ? <RecruiterDashboard /> : <CandidateDashboard />;
}
