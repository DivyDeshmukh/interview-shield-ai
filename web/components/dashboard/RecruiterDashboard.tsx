"use client";

import { Clock, Play, BarChart2, CalendarDays, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/services/auth";
import { getRecruiterInterviews } from "@/lib/services/interviews";

type Interview = {
  id: string;
  title: string | null;
  scheduled_at: string;
  status: string | null;
  candidate: { full_name: string | null; email: string | null } | null;
};

function formatDateTime(scheduledAt: string) {
  const date = new Date(scheduledAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

export default function RecruiterDashboard() {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<Interview[]>([]);
  const [completed, setCompleted] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    async function load() {
      const { user } = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const { data } = await getRecruiterInterviews(user.id);
      if (data) {
        setUpcoming(data.filter((i) => i.status === "scheduled") as Interview[]);
        setCompleted(data.filter((i) => i.status === "completed") as Interview[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Tick every 10s so cards unlock automatically when scheduled time arrives
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage interviews and review AI analysis</p>
        </div>
        <button
          onClick={() => router.push("/schedule")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition shrink-0"
          style={{ background: "#2563eb" }}
        >
          <CalendarDays className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Upcoming Interviews */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Interviews</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming interviews.</p>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {upcoming.map((interview) => (
                  <div
                    key={interview.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-base text-gray-900">
                        {interview.candidate?.full_name ?? interview.candidate?.email ?? "Unknown"}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 shrink-0">
                        Scheduled
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">{interview.title ?? "—"}</p>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-500">
                        {formatDateTime(interview.scheduled_at)}
                      </span>
                    </div>

                    {(() => {
                      const timeReached = now >= new Date(interview.scheduled_at);
                      return timeReached ? (
                        <button
                          type="button"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition"
                          style={{ background: "#2563eb" }}
                          onClick={() => router.push(`/interview/${interview.id}`)}
                        >
                          <Play className="w-4 h-4 fill-white stroke-none" />
                          Start Interview
                        </button>
                      ) : (
                        (() => {
                          const diff = new Date(interview.scheduled_at).getTime() - now.getTime();
                          const h = Math.floor(diff / 3_600_000);
                          const m = Math.floor((diff % 3_600_000) / 60_000);
                          const startsIn = h > 0 ? (m > 0 ? `${h}h ${m} min` : `${h}h`) : (m < 1 ? "1 min" : `${m} min`);
                          return (
                            <div
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-500 w-full justify-center"
                              style={{ background: "#F3F4F6" }}
                            >
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              Starts in {startsIn}
                            </div>
                          );
                        })()
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Interviews */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Completed Interviews</h2>
            {completed.length === 0 ? (
              <p className="text-sm text-gray-400">No completed interviews yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {completed.map((interview) => (
                  <div
                    key={interview.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-base text-gray-900">
                        {interview.candidate?.full_name ?? interview.candidate?.email ?? "Unknown"}
                      </span>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full border shrink-0"
                        style={{ borderColor: "#BBF7D0", background: "#F0FDF4", color: "#16A34A" }}
                      >
                        Completed
                      </span>
                    </div>

                    <p className="text-sm" style={{ color: "#3B82F6" }}>{interview.title ?? "—"}</p>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-500">
                        {formatDateTime(interview.scheduled_at)}
                      </span>
                    </div>

                    <button
                      onClick={() => router.push(`/analysis/${interview.id}`)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <BarChart2 className="w-4 h-4" />
                      View Analysis
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
