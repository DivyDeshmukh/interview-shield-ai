"use client";

import { Clock, Lock, Video } from "lucide-react";

interface Interview {
  id: number;
  role: string;
  date: string;
  time: string;
  canJoin: boolean;
  startsIn?: string;
}

const MOCK_INTERVIEWS: Interview[] = [
  {
    id: 1,
    role: "Frontend Engineer",
    date: "2026-02-27",
    time: "10:00 AM",
    canJoin: true,
  },
  {
    id: 2,
    role: "Backend Developer",
    date: "2026-02-27",
    time: "2:00 PM",
    canJoin: false,
    startsIn: "2h 30m",
  },
];

export default function CandidateDashboard() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Interviews</h1>
        <p className="text-sm text-gray-500 mt-1">Your upcoming interview sessions</p>
      </div>

      {/* Interview cards */}
      <div className="flex flex-col gap-4">
        {MOCK_INTERVIEWS.map((interview) => (
          <div
            key={interview.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-md px-6 py-5 flex items-center justify-between"
          >
            {/* Left: title + time */}
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-base text-gray-900">
                {interview.role}
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {interview.date} · {interview.time}
                </span>
              </div>
            </div>

            {/* Right: action */}
            {interview.canJoin ? (
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition"
                style={{ background: "#2563eb" }}
              >
                <Video className="w-4 h-4" />
                Join Interview
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-500"
                  style={{ background: "#F3F4F6" }}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Starts in {interview.startsIn}
                </div>
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
        ))}
      </div>
    </div>
  );
}
