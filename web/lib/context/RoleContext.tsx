"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Role = "candidate" | "recruiter";

interface RoleContextType {
  role: Role;
  setRole: (r: Role) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: "candidate",
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("candidate");

  useEffect(() => {
    const saved = localStorage.getItem("isa_role") as Role | null;
    if (saved === "candidate" || saved === "recruiter") setRoleState(saved);
  }, []);

  function setRole(r: Role) {
    localStorage.setItem("isa_role", r);
    setRoleState(r);
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
