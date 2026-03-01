import os
import logging
from vision_agents.plugins import gemini

logger = logging.getLogger(__name__)

# Event weights for chat score - phone/multiple people are more severe than gaze
EVENT_WEIGHTS = {
    "multiple_faces": 0.4,
    "phone_detected": 0.4,
    "gaze_away": 0.2
}

def compute_cheat_score(events: list[dict]) -> float:
    """
        Weighted score based on how many distinct event types fired and how frequently each occurred, capped at 1.0.
    """
    if not events:
        return 0.0
    
    counts = {}
    for event in events:
        event_type = event.get("event_type", "")
        counts[event_type] = counts.get(event_type, 0) + 1
    
    score = 0.0
    for event_type, weight in EVENT_WEIGHTS.items():
        if event_type in counts:
            # Each occurrence adds weight, but diminishing - log scale
            import math
            score += weight * min(1.0, math.log1p(counts[event_type]) / math.log1p(10))

    return round(min(score, 1.0), 2)

async def generate_summary(events: list[dict], cheat_score: float) -> str:
    """
    Uses Vision Agents gemini.LLM to generate a human-readable
    integrity summary for the recruiter.
    """
    if not events:
        return "No suspicious activity was detected during this interview."

    counts = {}
    for event in events:
        t = event.get("event_type", "")
        counts[t] = counts.get(t, 0) + 1

    breakdown = "\n".join(                          # ← fix: was "/n"
        f"- {event_type.replace('_', ' ').title()}: {count} time(s)"
        for event_type, count in counts.items()
    )

    prompt = f"""You are an AI interview integrity analyst.
Based on the following behavioral events detected during a remote interview,
write a concise 2-3 sentence professional summary for a recruiter.
Be factual and neutral in tone.

Integrity Score: {cheat_score}/1.0
Detected Events:
{breakdown}

Summary:"""

    try:
        llm = gemini.LLM(
            model="gemini-2.0-flash",
            api_key=os.environ["GEMINI_API_KEY"],
        )
        response = await llm.send_message(prompt)  # ← fix: was .complete()
        return response.text.strip()               # ← fix: was response.strip()
    except Exception as e:
        logger.error(f"Gemini summary generation failed: {e}")
        return f"Integrity score: {cheat_score}/1.0. Automated summary unavailable."
