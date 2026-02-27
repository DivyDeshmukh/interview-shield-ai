"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Loader2, User, X } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/layout/Input";
import { Button } from "@/components/layout/Button";
import { getCurrentUser } from "@/lib/services/auth";
import {
  searchCandidateByEmail,
  scheduleInterview,
  type CandidateResult,
} from "@/lib/services/interviews";

const JOB_ROLES = [
  "Frontend Engineer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Product Manager",
  "UX Designer",
];

const scheduleSchema = z.object({
  candidateId: z.string().min(1, "Please search and select a candidate"),
  role: z.string().min(1, "Please select a role"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export default function SchedulePage() {
  const router = useRouter();

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<CandidateResult[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { candidateId: "", role: "", date: "", time: "" },
  });

  const selectedRole = watch("role");

  // Debounced search
  useEffect(() => {
    if (searchEmail.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data, error } = await searchCandidateByEmail(searchEmail);
      setIsSearching(false);

      if (error) {
        toast.error("Failed to search candidates.");
        return;
      }
      setSearchResults((data as CandidateResult[]) ?? []);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchEmail]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleSelectCandidate(candidate: CandidateResult) {
    setSelectedCandidate(candidate);
    setValue("candidateId", candidate.id, { shouldValidate: true });
    setSearchEmail("");
    setSearchResults([]);
    setShowDropdown(false);
  }

  function handleRemoveCandidate() {
    setSelectedCandidate(null);
    setValue("candidateId", "", { shouldValidate: false });
  }

  async function onSubmit(data: ScheduleFormValues) {
    const { user } = await getCurrentUser();
    if (!user) {
      toast.error("You must be logged in to schedule an interview.");
      return;
    }

    const scheduledAt = `${data.date}T${data.time}:00`;

    const { error } = await scheduleInterview({
      title: data.role,
      scheduledAt,
      recruiterId: user.id,
      candidateId: data.candidateId,
    });

    if (error) {
      toast.error(error.message || "Failed to schedule interview.");
      return;
    }

    toast.success("Interview scheduled successfully!");
    router.push("/");
  }

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-8">
          Schedule New Interview
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {/* Candidate search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Candidate
            </label>

            {selectedCandidate ? (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedCandidate.full_name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">{selectedCandidate.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCandidate}
                  className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative" ref={searchRef}>
                <Input
                  type="email"
                  placeholder="Search candidate by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                />

                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}

                {showDropdown && searchEmail.length >= 3 && !isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                    {searchResults.length > 0 ? (
                      searchResults.map((candidate) => (
                        <button
                          key={candidate.id}
                          type="button"
                          onMouseDown={() => handleSelectCandidate(candidate)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {candidate.full_name ?? "—"}
                            </p>
                            <p className="text-xs text-gray-500">{candidate.email}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-500">
                          No registered candidate found with this email.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <input type="hidden" {...register("candidateId")} />
            {errors.candidateId && (
              <p className="text-xs text-red-500">{errors.candidateId.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="relative">
              <select
                {...register("role")}
                className={`w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-blue-400 focus:outline-none bg-white appearance-none cursor-pointer pr-10 text-sm ${
                  selectedRole ? "text-black" : "text-gray-400"
                }`}
              >
                <option value="" disabled>Select a role</option>
                {JOB_ROLES.map((r) => (
                  <option key={r} value={r} className="text-black">{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <Input type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Time</label>
              <Input type="time" {...register("time")} />
              {errors.time && (
                <p className="text-xs text-red-500">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563eb" }}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Interview"}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
