export type PageState = "loading" | "pre-call" | "calling" | "ended";

export type AIEvent = {
    id: string;
    event_type: string;
    confidence_score: number | null;
    created_at: string | null;
}

export type Interview = {
    id: string;
    title: string | null;
    status: string | null;
    scheduled_at: string;
    recruiter_id: string | null;
    candidate_id: string | null;
    meeting_room_id: string;
    started_at: string | null;
    ended_at: string | null;
}
