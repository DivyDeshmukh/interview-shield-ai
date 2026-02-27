"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCurrentUser, getProfile, updateProfile } from "@/lib/services/auth";
import Input from "@/components/layout/Input";
import { Button } from "@/components/layout/Button";
import toast from "react-hot-toast";

const profileSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { company_name: "" },
  });

  useEffect(() => {
    async function load() {
      const { user } = await getCurrentUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await getProfile(user.id);
      if (data) {
        setFullName(data.full_name);
        setEmail(data.email);
        reset({ company_name: data.company_name ?? "" });
      }
      setLoading(false);
    }
    load();
  }, [reset]);

  async function onSubmit(values: ProfileFormValues) {
    if (!userId) return;
    const { error } = await updateProfile(userId, { company_name: values.company_name });
    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated.");
      reset({ company_name: values.company_name });
      router.push("/");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your account information</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5">
        {/* Full name — read only */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <Input value={fullName ?? ""} disabled className="text-gray-500 bg-gray-50 cursor-not-allowed" />
          <p className="text-xs text-gray-400">Synced from your Google account</p>
        </div>

        {/* Email — read only */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <Input type="email" value={email ?? ""} disabled className="text-gray-500 bg-gray-50 cursor-not-allowed" />
        </div>

        {/* Company name — editable with RHF + zod */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Company Name</label>
            <Input {...register("company_name")} placeholder="Enter your company name" />
            {errors.company_name && (
              <p className="text-xs text-red-500">{errors.company_name.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: "#2563eb" }}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
