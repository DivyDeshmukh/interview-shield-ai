from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging

from processors.vision import CandidateFrameProcessor
from db.client import fetch_ai_events, insert_analysis_summary
from summary.generator import compute_cheat_score, generate_summary

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="InterviewShield AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# One processor instance per active interview
# key = interview_id, value = CandidateFrameProcessor
processors: dict[str, CandidateFrameProcessor] = {}

@app.get("/health")
async def health():
    return {
        "status": "ok"
    }

@app.websocket("/ws/video/{interview_id}")
async def video_websocket(websocket: WebSocket, interview_id: str):
    await websocket.accept()
    logger.info(f"Websocket connected: interview {interview_id}")

    if interview_id not in processors:
        processors[interview_id] = CandidateFrameProcessor(interview_id)
        logger.info(f"Processor created for interview {interview_id}")

    processor = processors[interview_id]

    try:
        while True:
            data = await websocket.receive_json()
            frame_b64 = data.get("frame")
            if frame_b64:
                await processor.process_frame(frame_b64)
    except WebSocketDisconnect: 
        logger.info(f"Websocket Disconnected: interview {interview_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {interview_id}: {e}")
    finally:
        processors.pop(interview_id, None)
        logger.info(f"Processor removed for interview {interview_id}")

@app.post("/analyse-interview/{interview_id}")
async def analyse_interview(interview_id: str):
    logger.info(f"Analysing interview {interview_id}")

    events = fetch_ai_events(interview_id)
    cheat_score = compute_cheat_score(events)
    summary = await generate_summary(events, cheat_score)

    insert_analysis_summary(interview_id, cheat_score, summary)
    logger.info(f"Analysis saved for interview {interview_id} — score: {cheat_score}")

    return {
        "interview_id": interview_id,
        "cheat_score": cheat_score,
        "summary": summary,
    }