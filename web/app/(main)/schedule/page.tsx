"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const JOB_ROLES = [
  "Frontend Engineer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
];

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition bg-white";

export default function SchedulePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    role: "",
    date: "",
    time: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call API to schedule interview
    router.push("/");
  }

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-8">
          Schedule New Interview
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Candidate Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Candidate Name
            </label>
            <input
              type="text"
              name="candidateName"
              value={form.candidateName}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              className={inputClass}
              required
            />
          </div>

          {/* Candidate Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Candidate Email
            </label>
            <input
              type="email"
              name="candidateEmail"
              value={form.candidateEmail}
              onChange={handleChange}
              placeholder="jane@example.com"
              className={inputClass}
              required
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="relative">
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`${inputClass} appearance-none cursor-pointer pr-10 ${
                  form.role ? "text-gray-900" : "text-gray-400"
                }`}
                required
              >
                <option value="" disabled>
                  Select a role
                </option>
                {JOB_ROLES.map((r) => (
                  <option key={r} value={r} className="text-gray-900">
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition"
              style={{ background: "#2563eb" }}
            >
              Schedule Interview
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
