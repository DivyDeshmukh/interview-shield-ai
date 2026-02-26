"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Eye,
  Users,
  Smartphone,
  MonitorOff,
  AlertTriangle,
  Volume2,
  type LucideIcon,
} from "lucide-react";

type Severity = "low" | "medium" | "high";
type FlagType = "eye_gaze" | "face" | "device" | "tab" | "audio";

interface Flag {
  id: number;
  timestamp: string;
  severity: Severity;
  type: FlagType;
  description: string;
}

interface AnalysisData {
  candidateName: string;
  role: string;
  date: string;
  integrityScore: number;
  stats: {
    eyeGazeAlerts: number;
    multipleFaces: number;
    deviceDetection: number;
    tabSwitches: number;
  };
  flags: Flag[];
}

const MOCK_ANALYSES: Record<string, AnalysisData> = {
  "3": {
    candidateName: "Emily Park",
    role: "Full Stack Developer",
    date: "2026-02-26",
    integrityScore: 78,
    stats: { eyeGazeAlerts: 1, multipleFaces: 0, deviceDetection: 1, tabSwitches: 0 },
    flags: [
      { id: 1, timestamp: "00:04:30", severity: "low", type: "eye_gaze", description: "Candidate looked away from screen for 3 seconds" },
      { id: 2, timestamp: "00:11:22", severity: "medium", type: "device", description: "Mobile device detected near candidate" },
      { id: 3, timestamp: "00:18:45", severity: "low", type: "audio", description: "Background voice detected" },
    ],
  },
  "4": {
    candidateName: "Michael Liu",
    role: "DevOps Engineer",
    date: "2026-02-25",
    integrityScore: 62,
    stats: { eyeGazeAlerts: 2, multipleFaces: 1, deviceDetection: 1, tabSwitches: 1 },
    flags: [
      { id: 1, timestamp: "00:02:15", severity: "low", type: "eye_gaze", description: "Candidate looked away from screen for 4 seconds" },
      { id: 2, timestamp: "00:05:42", severity: "high", type: "face", description: "Second face detected in camera frame" },
      { id: 3, timestamp: "00:08:10", severity: "medium", type: "tab", description: "Browser tab switch detected" },
      { id: 4, timestamp: "00:12:33", severity: "high", type: "device", description: "Mobile device detected near candidate" },
      { id: 5, timestamp: "00:15:00", severity: "medium", type: "audio", description: "Background voice detected" },
      { id: 6, timestamp: "00:22:18", severity: "low", type: "eye_gaze", description: "Candidate looked away from screen for 2 seconds" },
    ],
  },
};

const FLAG_ICONS: Record<FlagType, { icon: LucideIcon; color: string }> = {
  eye_gaze: { icon: Eye, color: "text-blue-500" },
  face: { icon: Users, color: "text-red-500" },
  device: { icon: Smartphone, color: "text-teal-500" },
  tab: { icon: MonitorOff, color: "text-gray-500" },
  audio: { icon: Volume2, color: "text-purple-500" },
};

const SEVERITY_STYLES: Record<Severity, string> = {
  low: "bg-green-100 text-green-600 border border-green-200",
  medium: "bg-amber-100 text-amber-600 border border-amber-200",
  high: "bg-red-100 text-red-500 border border-red-200",
};

function getScoreColor(score: number) {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Low risk. Candidate performed within expected parameters.";
  if (score >= 60) return "Multiple flags detected. Manual review recommended.";
  return "High risk. Immediate review required.";
}

function IntegrityCircle({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const color = getScoreColor(score);
  const offset = circumference * (1 - score / 100);

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="20"
        fontWeight="bold"
      >
        {score}
      </text>
    </svg>
  );
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const data = MOCK_ANALYSES[params.id as string];

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-10 text-center text-gray-500">
        Analysis report not found.
      </div>
    );
  }

  const statCards = [
    { icon: Eye, label: "Eye Gaze Alerts", value: data.stats.eyeGazeAlerts, iconColor: "text-blue-500", bgColor: "bg-blue-50" },
    { icon: Users, label: "Multiple Faces", value: data.stats.multipleFaces, iconColor: "text-red-500", bgColor: "bg-red-50" },
    { icon: Smartphone, label: "Device Detection", value: data.stats.deviceDetection, iconColor: "text-teal-500", bgColor: "bg-teal-50" },
    { icon: MonitorOff, label: "Tab Switches", value: data.stats.tabSwitches, iconColor: "text-gray-500", bgColor: "bg-gray-100" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analysis Report</h1>
            <p className="text-sm mt-0.5" style={{ color: "#3B82F6" }}>
              {data.candidateName} · {data.role} · {data.date}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 flex items-center gap-4"
          >
            <div className={`${card.bgColor} p-2.5 rounded-xl shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Integrity Score */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 flex items-center gap-6 mb-5">
        <IntegrityCircle score={data.integrityScore} />
        <div>
          <h3 className="text-base font-bold text-gray-900">Integrity Score</h3>
          <p className="text-sm text-gray-500 mt-1">{getScoreLabel(data.integrityScore)}</p>
        </div>
      </div>

      {/* AI Flag Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-gray-900">AI Flag Timeline</h3>
        </div>
        <div className="flex flex-col gap-3">
          {data.flags.map((flag) => {
            const { icon: FlagIcon, color } = FLAG_ICONS[flag.type];
            return (
              <div
                key={flag.id}
                className="border border-gray-100 rounded-xl p-4 flex items-start gap-4"
              >
                <div className="bg-gray-100 p-2.5 rounded-xl shrink-0">
                  <FlagIcon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-mono">{flag.timestamp}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[flag.severity]}`}>
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{flag.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
