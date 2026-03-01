import os
from supabase import create_client, Client
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

url: str = os.environ["SUPABASE_URL"]
key: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

supabase: Client = create_client(url, key);

def insert_ai_event(interview_id: str, event_type: str, confidence_score: float, timestamp_in_call: int):
    try:
        supabase.table("ai_events").insert({
            "interview_id": interview_id,
            "event_type": event_type,
            "confidence_score": confidence_score,
            "timestamp_in_call": timestamp_in_call,
        }).execute();
    except Exception as e:
        logger.error(f"Failed to insert ai_event {e}")

def fetch_ai_events(interview_id: str):
    try:
        response = supabase.table("ai_events")  \
                .select("*")    \
                .eq("interview_id", interview_id)   \
                .execute()
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch ai_events: {e}")
        return []

def insert_analysis_summary(interview_id: str, cheat_score: float, summary: str):
    try:
        supabase.table("analysis_summary").insert({
            "interview_id": interview_id,
            "cheat_score": cheat_score,
            "summary": summary
        }).execute()
    except Exception as e:
        logger.error(f"Failed to insert analysis_summary: {e}")

if __name__ == "__main__":
    result = supabase.table("ai_events").select("id").limit(1).execute()
    print("Connection OK:", result)
