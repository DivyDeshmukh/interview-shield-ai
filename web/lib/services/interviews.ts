import { supabase } from "../db/supabaseClient";
import { TablesInsert } from "../types/database.types";

export interface CandidateResult {
    id: string;
    email: string;
    full_name: string | null;
}

export async function searchCandidateByEmail(email: string) {
    return supabase
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", `%${email}%`)
        .eq("role", "candidate")
        .limit(5);
}

export async function getRecruiterInterviews(recruiterId: string) {
    return supabase
        .from("interviews")
        .select("id, title, scheduled_at, status, candidate:profiles!interviews_candidate_id_fkey(full_name, email)")
        .eq("recruiter_id", recruiterId)
        .order("scheduled_at", { ascending: true });
}

export async function getCandidateInterviews(candidateId: string) {
    return supabase
        .from("interviews")
        .select("id, title, scheduled_at, status")
        .eq("candidate_id", candidateId)
        .order("scheduled_at", { ascending: true });
}

export async function deleteRecruiterData(recruiterId: string) {
    return supabase
        .from("interviews")
        .delete()
        .eq("recruiter_id", recruiterId);
}

export async function deleteCandidateData(candidateId: string) {
    return supabase
        .from("interviews")
        .delete()
        .eq("candidate_id", candidateId);
}

export async function scheduleInterview(input: {
    title: string;
    scheduledAt: string;
    recruiterId: string;
    candidateId: string;
}) {
    const row: TablesInsert<"interviews"> = {
        title: input.title,
        scheduled_at: input.scheduledAt,
        recruiter_id: input.recruiterId,
        candidate_id: input.candidateId,
        status: "scheduled",
    };

    return supabase.from("interviews").insert(row).select().single();
}

export async function getInterviewById(id: string) {
    return supabase
        .from("interviews")
        .select("*, recruiter:profiles!interviews_recruiter_id_fkey(full_name, email), candidate:profiles!interviews_candidate_id_fkey(full_name, email)")
        .eq("id", id)
        .single();
}

export async function startInterview(id: string) {
    return supabase
        .from("interviews")
        .update({
            status: "ongoing",
            started_at: new Date().toISOString(),
        })
        .eq("id", id);
}

export async function endInterview(id: string) {
    return supabase
        .from("interviews")
        .update({
            status: "completed",
            ended_at: new Date().toISOString(),
        })
        .eq("id", id);
}

