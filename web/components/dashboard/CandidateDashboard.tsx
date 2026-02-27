"use client";

import { Clock, Lock, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/services/auth";
import { getCandidateInterviews } from "@/lib/services/interviews";

type Interview = {
  id: string;
  title: string | null;
  scheduled_at: string;
  status: string | null;
};

function formatDateTime(scheduledAt: string) {
  const date = new Date(scheduledAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

function getTimeUntil(scheduledAt: string) {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function canJoinNow(scheduledAt: string) {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  return diff <= 15 * 60 * 1000;
}

export default function CandidateDashboard() {
  const [upcoming, setUpcoming] = useState<Interview[]>([]);
  const [completed, setCompleted] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { user } = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const { data } = await getCandidateInterviews(user.id);
      if (data) {
        setUpcoming(data.filter((i) => i.status === "scheduled") as Interview[]);
        setCompleted(data.filter((i) => i.status === "completed") as Interview[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Interviews</h1>
        <p className="text-sm text-gray-500 mt-1">Your upcoming and past interview sessions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming interviews.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {upcoming.map((interview) => {
                  const joinable = canJoinNow(interview.scheduled_at);
                  const startsIn = getTimeUntil(interview.scheduled_at);
                  return (
                    <div
                      key={interview.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-md px-6 py-5 flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-base text-gray-900">
                          {interview.title ?? "—"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {formatDateTime(interview.scheduled_at)}
                          </span>
                        </div>
                      </div>

                      {joinable ? (
                        <button
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition"
                          style={{ background: "#2563eb" }}
                        >
                          <Video className="w-4 h-4" />
                          Join Interview
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          {startsIn && (
                            <div
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-500"
                              style={{ background: "#F3F4F6" }}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Starts in {startsIn}
                            </div>
                          )}
                          <button
                            disabled
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-400 cursor-not-allowed"
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Completed</h2>
            {completed.length === 0 ? (
              <p className="text-sm text-gray-400">No completed interviews yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {completed.map((interview) => (
                  <div
                    key={interview.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-md px-6 py-5"
                  >
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-base text-gray-900">
                        {interview.title ?? "—"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDateTime(interview.scheduled_at)}
                        </span>
                      </div>
                    </div>
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
