"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, MessageSquare, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/db/supabaseClient";

type Interview = {
  title: string | null;
  scheduled_at: string;
  candidate: { full_name: string | null; email: string | null } | null;
};

type AnalysisSummary = {
  cheat_score: number;
  summary: string;
  created_at: string | null;
};

type AIEvent = {
  id: string;
  event_type: string;
  confidence_score: number | null;
  timestamp_in_call: number | null;
  created_at: string | null;
};

function scoreStyle(score: number) {
  if (score < 0.3) return { label: "Low Risk", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" };
  if (score < 0.6) return { label: "Medium Risk", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  return { label: "High Risk", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
}

function formatEventLabel(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const interviewId = params.id as string;
      const [{ data: interviewData }, { data: summaryData }, { data: eventsData }] =
        await Promise.all([
          supabase
            .from("interviews")
            .select("title, scheduled_at, candidate:profiles!interviews_candidate_id_fkey(full_name, email)")
            .eq("id", interviewId)
            .single(),
          supabase
            .from("analysis_summary")
            .select("cheat_score, summary, created_at")
            .eq("interview_id", interviewId)
            .maybeSingle(),
          supabase
            .from("ai_events")
            .select("id, event_type, confidence_score, timestamp_in_call, created_at")
            .eq("interview_id", interviewId)
            .order("timestamp_in_call", { ascending: true }),
        ]);

      if (interviewData) setInterview(interviewData as Interview);
      if (summaryData) setSummary(summaryData);
      if (eventsData) setEvents(eventsData);
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
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis Report</h1>
          <p className="text-sm mt-0.5" style={{ color: "#3B82F6" }}>
            {candidateName} · {interview.title ?? "—"} · {date}
          </p>
        </div>
      </div>

      {!summary ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-10 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-base font-semibold text-gray-800">Analysis not available yet</p>
          <p className="text-sm text-gray-500">AI analysis will appear here once the interview is completed.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Score card */}
          {(() => {
            const style = scoreStyle(summary.cheat_score);
            const pct = Math.round(summary.cheat_score * 100);
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" style={{ color: style.color }} />
                    <span className="text-base font-semibold text-gray-800">Integrity Score</span>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full border font-semibold" style={{ color: style.color, background: style.bg, borderColor: style.border }}>
                    {style.label}
                  </span>
                </div>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-5xl font-bold" style={{ color: style.color }}>{pct}</span>
                  <span className="text-xl text-gray-400 mb-1">/100</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: style.color }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">Higher score indicates more suspicious activity detected</p>
              </div>
            );
          })()}

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="text-base font-semibold text-gray-800">AI Summary</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{summary.summary}</p>
          </div>

          {/* Events timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="text-base font-semibold text-gray-800">
                Detected Events{events.length > 0 ? ` (${events.length})` : ""}
              </span>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No suspicious events were detected.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {events.map((event) => {
                  const conf = event.confidence_score !== null ? Math.round(event.confidence_score * 100) : null;
                  return (
                    <div key={event.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-mono w-12 shrink-0">{formatTimestamp(event.timestamp_in_call)}</span>
                        <span className="text-sm font-medium text-gray-800">{formatEventLabel(event.event_type)}</span>
                      </div>
                      {conf !== null && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: conf >= 80 ? "#FEF2F2" : "#FFFBEB", color: conf >= 80 ? "#DC2626" : "#D97706" }}>
                          {conf}% conf
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
