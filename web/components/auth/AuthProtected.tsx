"use client";

import { getCurrentUser } from "@/lib/services/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthProtected({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then(({ user }) => {
      if (!user) {
        router.replace("/");
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
