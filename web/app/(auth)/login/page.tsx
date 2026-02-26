"use client";

import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { getCurrentUser } from "@/lib/services/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then(({ user }) => {
      if (user) router.replace("/");
    });
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#F8F9FB" }}
    >
      <div className="bg-white rounded-3xl shadow-lg px-12 py-10 flex flex-col items-center w-105">
        {/* Shield icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2563eb 100%)" }}
        >
          <Shield className="w-8 h-8 text-white" strokeWidth={2} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1a1a2e" }}>
          Interview Shield{" "}
          <span style={{ color: "#2563eb" }}>AI</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm mb-6" style={{ color: "#8a9bb0" }}>
          AI-powered interview integrity monitoring
        </p>

        {/* Divider */}
        <div className="w-full border-t mb-6" style={{ borderColor: "#e8eef5" }} />

        {/* Google login button */}
        <GoogleLoginButton />

        {/* Terms */}
        <p className="text-xs mt-5 text-center" style={{ color: "#a0afc0" }}>
          By signing in, you agree to our{" "}
          <span style={{ color: "#2563eb" }}>Terms of Service</span>{" "}
          and{" "}
          <span style={{ color: "#2563eb" }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
