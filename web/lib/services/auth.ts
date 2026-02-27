import { supabase } from "../db/supabaseClient";

export async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });
}

export async function signOut() {
    return supabase.auth.signOut();
}

export async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data;
}

export async function switchProfileRole(userId: string, newRole: "recruiter" | "candidate") {
    return supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
}

export async function getProfile(userId: string) {
    return supabase
        .from("profiles")
        .select("full_name, email, company_name, role")
        .eq("id", userId)
        .single();
}

export async function updateProfile(userId: string, updates: { company_name: string }) {
    return supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
}
