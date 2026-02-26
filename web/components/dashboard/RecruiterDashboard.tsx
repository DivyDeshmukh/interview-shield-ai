"use client";

import { Clock, Play, BarChart2, CalendarDays, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpcomingInterview {
  id: number;
  candidateName: string;
  role: string;
  date: string;
  time: string;
}

interface CompletedInterview {
  id: number;
  candidateName: string;
  role: string;
  date: string;
  time: string;
}

const UPCOMING: UpcomingInterview[] = [
  {
    id: 1,
    candidateName: "Sarah Chen",
    role: "Frontend Engineer",
    date: "2026-02-27",
    time: "10:00 AM",
  },
  {
    id: 2,
    candidateName: "James Rodriguez",
    role: "Backend Developer",
    date: "2026-02-27",
    time: "2:00 PM",
  },
];

const COMPLETED: CompletedInterview[] = [
  {
    id: 3,
    candidateName: "Emily Park",
    role: "Full Stack Developer",
    date: "2026-02-26",
    time: "11:00 AM",
  },
  {
    id: 4,
    candidateName: "Michael Liu",
    role: "DevOps Engineer",
    date: "2026-02-25",
    time: "3:00 PM",
  },
];

export default function RecruiterDashboard() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage interviews and review AI analysis
          </p>
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

      {/* Upcoming Interviews */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Interviews</h2>
        <div className="grid grid-cols-2 gap-5">
          {UPCOMING.map((interview) => (
            <div
              key={interview.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 flex flex-col gap-3"
            >
              {/* Name + badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-base text-gray-900">
                  {interview.candidateName}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 shrink-0">
                  Scheduled
                </span>
              </div>

              {/* Role */}
              <p className="text-sm text-gray-500">{interview.role}</p>

              {/* Date/time */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">
                  {interview.date} · {interview.time}
                </span>
              </div>

              {/* Status pill */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500"
                style={{ background: "#F3F4F6" }}
              >
                <Info className="w-4 h-4 shrink-0 text-gray-400" />
                Interview not started yet
              </div>

              {/* Start button */}
              <button
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition"
                style={{ background: "#2563eb" }}
              >
                <Play className="w-4 h-4 fill-white stroke-none" />
                Start Interview
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Completed Interviews */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Completed Interviews</h2>
        <div className="grid grid-cols-2 gap-5">
          {COMPLETED.map((interview) => (
            <div
              key={interview.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 flex flex-col gap-3"
            >
              {/* Name + badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-base text-gray-900">
                  {interview.candidateName}
                </span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full border shrink-0"
                  style={{
                    borderColor: "#BBF7D0",
                    background: "#F0FDF4",
                    color: "#16A34A",
                  }}
                >
                  Completed
                </span>
              </div>

              {/* Role — blue for completed */}
              <p className="text-sm" style={{ color: "#3B82F6" }}>
                {interview.role}
              </p>

              {/* Date/time */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">
                  {interview.date} · {interview.time}
                </span>
              </div>

              {/* View Analysis button */}
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
      </section>
    </div>
  );
}
