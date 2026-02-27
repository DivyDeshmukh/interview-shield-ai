"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/db/supabaseClient";

type Interview = {
  title: string | null;
  scheduled_at: string;
  candidate: { full_name: string | null; email: string | null } | null;
};

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("interviews")
        .select("title, scheduled_at, candidate:profiles!interviews_candidate_id_fkey(full_name, email)")
        .eq("id", params.id as string)
        .single();

      if (data) setInterview(data as Interview);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-10 text-center text-gray-500">
        Interview not found.
      </div>
    );
  }

  const candidateName = interview.candidate?.full_name ?? interview.candidate?.email ?? "Unknown";
  const date = new Date(interview.scheduled_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis Report</h1>
          <p className="text-sm mt-0.5" style={{ color: "#3B82F6" }}>
            {candidateName} · {interview.title ?? "—"} · {date}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-10 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p className="text-base font-semibold text-gray-800">Analysis not available yet</p>
        <p className="text-sm text-gray-500">AI analysis will appear here once the interview is completed.</p>
      </div>
    </div>
  );
}
