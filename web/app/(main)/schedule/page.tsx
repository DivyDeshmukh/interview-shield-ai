"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import Input from "@/components/layout/Input";
import { Button } from "@/components/layout/Button";

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
  candidateName: z.string().min(1, "Candidate name is required"),
  candidateEmail: z.email("Enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export default function SchedulePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      candidateName: "",
      candidateEmail: "",
      role: "",
      date: "",
      time: "",
    },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: ScheduleFormValues) {
    // TODO: call API to schedule interview
    console.log("Schedule interview:", data);
    router.push("/");
  }

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-8">
          Schedule New Interview
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Candidate Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Candidate Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Jane Doe"
              {...register("candidateName")}
            />
            {errors.candidateName && (
              <p className="text-xs text-red-500">{errors.candidateName.message}</p>
            )}
          </div>

          {/* Candidate Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Candidate Email
            </label>
            <Input
              type="email"
              placeholder="jane@example.com"
              {...register("candidateEmail")}
            />
            {errors.candidateEmail && (
              <p className="text-xs text-red-500">{errors.candidateEmail.message}</p>
            )}
          </div>

          {/* Role — native select styled to match Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="relative">
              <select
                {...register("role")}
                className={`w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-blue-400 focus:outline-none bg-white appearance-none cursor-pointer pr-10 text-sm ${
                  selectedRole ? "text-black" : "text-gray-400"
                }`}
              >
                <option value="" disabled>
                  Select a role
                </option>
                {JOB_ROLES.map((r) => (
                  <option key={r} value={r} className="text-black">
                    {r}
                  </option>
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
