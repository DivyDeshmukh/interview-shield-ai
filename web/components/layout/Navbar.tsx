"use client";

import { signOut, getCurrentUser, switchProfileRole, getProfile } from "@/lib/services/auth";
import { deleteRecruiterData, deleteCandidateData } from "@/lib/services/interviews";
import { useRole, type Role } from "@/lib/context/RoleContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Shield, ArrowLeftRight, Loader2, User, LogOut, Settings } from "lucide-react";
import Link from "next/link";

const NAV_ITEMS: Record<Role, { label: string; href: string }[]> = {
  candidate: [{ label: "Dashboard", href: "/" }],
  recruiter: [
    { label: "Dashboard", href: "/" },
    { label: "Schedule", href: "/schedule" },
  ],
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Navbar() {
  const { role, setRole } = useRole();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then(({ user }) => {
      if (!user) return;
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      getProfile(user.id).then(({ data }) => {
        if (data) setFullName(data.full_name);
      });
    });
  }, []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  async function handleConfirmSwitch() {
    const next: Role = role === "candidate" ? "recruiter" : "candidate";
    setIsSwitching(true);

    const { user } = await getCurrentUser();
    if (user) {
      if (role === "recruiter") await deleteRecruiterData(user.id);
      else await deleteCandidateData(user.id);
      await switchProfileRole(user.id, next);
    }

    setRole(next);
    setIsSwitching(false);
    setShowConfirm(false);
  }

  const otherRole: Role = role === "candidate" ? "recruiter" : "candidate";

  return (
    <>
      <nav className="bg-white border-b border-gray-100 px-8 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2563eb 100%)" }}
          >
            <Shield className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="font-bold text-lg" style={{ color: "#1a1a2e" }}>
            Interview Shield <span style={{ color: "#2563eb" }}>AI</span>
          </span>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-6">
          {/* Role-based nav links */}
          {NAV_ITEMS[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition relative after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all after:duration-200 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}

          {/* Role switcher pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer select-none"
            >
              {capitalize(role)}
              <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-43.75 z-40">
                <button
                  onClick={() => { setDropdownOpen(false); setShowConfirm(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Switch to{" "}
                  <span className="font-semibold text-gray-900">{capitalize(otherRole)}</span>
                </button>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {fullName ?? "Account"}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-44 z-40">
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Profile Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Switch role confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <div className="bg-white rounded-2xl shadow-xl px-8 py-7 w-105 flex flex-col gap-4">
            <h2 className="text-base font-bold text-gray-900">Switch Role?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to switch to{" "}
              <span className="font-semibold text-gray-900">
                {capitalize(otherRole)}
              </span>
              ? This action will{" "}
              <span className="font-semibold text-red-500">
                permanently delete all data
              </span>{" "}
              associated with your current{" "}
              <span className="font-semibold text-gray-900">
                {capitalize(role)}
              </span>{" "}
              role. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-1">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition cursor-pointer rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSwitch}
                disabled={isSwitching}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "#2563eb" }}
              >
                {isSwitching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSwitching ? "Switching..." : "Yes, Switch Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
