from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="InterviewShield AI Service")

@app.get("/health")
async def health():
    return {
        "status": "ok"
    }