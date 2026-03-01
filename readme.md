# InterviewShield AI

An AI-powered interview integrity platform that monitors live remote interviews in real time. It detects suspicious candidate behavior during video calls and gives recruiters an analysis report with a risk score and a plain-language summary once the interview ends.

Built for the Hack All February hackathon by Stream.

---

## What it does

During a live video interview, the candidate's video feed is silently analyzed frame by frame. The system detects:

- More than one person visible on camera (multiple faces)
- A phone or external device in the frame
- The candidate looking away from the screen repeatedly

Each detection is logged as a timestamped event. When the recruiter ends the call, a Gemini LLM reads all the events and writes a short professional summary with a 0-100 risk score. The recruiter can view this on the analysis page.

---

## Architecture

```
Candidate browser
  -> streams video frames over WebSocket every 1.5s
  -> ai-service: Vision Agents (Moondream) detects objects + gaze
  -> ai_events table in Supabase

Recruiter browser
  -> receives real-time toast alerts via Supabase realtime subscription

Recruiter clicks "End Call"
  -> POST /analyse-interview/{id} to ai-service
  -> Gemini reads all ai_events, computes risk score, writes summary
  -> analysis_summary table in Supabase
  -> /analysis/{id} page displays the report
```

WebRTC peer connection is established via a custom signaling layer built on Supabase (signaling_messages table). No third-party WebRTC infrastructure is needed beyond STUN servers.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (App Router) | File-based routing, server components, easy Vercel deploy |
| Styling | Tailwind CSS | Utility classes, no context switching |
| Database + Auth | Supabase | Postgres, real-time subscriptions, and auth in one service |
| Video call | WebRTC (custom signaling via Supabase) | Browser-native, no monthly WebRTC bill |
| AI detection | Vision Agents SDK + Moondream | Hackathon requirement; Moondream is a lightweight vision model with a cloud API |
| AI summary | Vision Agents SDK + Gemini (gemini-2.5-flash) | Fast, free-tier available, good at structured prose |
| AI service | Python + FastAPI | Async WebSocket support, lightweight |
| Deployment | Vercel (frontend) + Render (AI service, Docker) | Free tier, auto-deploy on push |

---

## Project structure

```
interview-shield-ai/
  web/                       Next.js frontend
    app/
      (auth)/                login and signup pages
      (main)/                dashboard, interview list, analysis report
      interview/[id]/        live call page (WebRTC + AI frame streaming)
    hooks/
      useWebRTC.ts           peer connection lifecycle
      useSignalling.ts       Supabase-based offer/answer/ICE signaling
    lib/
      services/              Supabase query helpers
      types/                 shared TypeScript types

  ai-service/                Python FastAPI microservice
    main.py                  WebSocket endpoint + analyse endpoint
    processors/vision.py     frame decoding + Moondream detection
    summary/generator.py     cheat score calculation + Gemini summary
    db/client.py             Supabase insert/fetch helpers
    Dockerfile               Ubuntu 24.04 base (required for ffmpeg 7 + av package)
    requirements.txt
```

---

## Local setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project
- Moondream API key (moondream.ai)
- Gemini API key (aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/DivyDeshmukh/interview-shield-ai
cd interview-shield-ai
```

### 2. Frontend

```bash
cd web
npm install
```

Create `web/.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

### 3. AI service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `ai-service/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MOONDREAM_API_KEY=your_moondream_api_key
GEMINI_API_KEY=your_gemini_api_key
```

```bash
uvicorn main:app --reload
```

AI service runs at `http://localhost:8000`.

---

## Deployment

### Frontend — Vercel

1. Connect the GitHub repo to Vercel
2. Set root directory to `web`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_AI_SERVICE_URL` — set this to your Render service URL after deploying the AI service

### AI service — Render (Docker)

The AI service uses a Dockerfile because `vision-agents` depends on `av` (a video library) that requires ffmpeg 7 to compile on Linux. Ubuntu 24.04 ships ffmpeg 7 in its default package repository, so the Dockerfile uses that as the base image.

1. Create a new Web Service on Render
2. Set Language to `Docker`
3. Set Dockerfile Path to `ai-service/Dockerfile`
4. Set Docker Build Context to `ai-service`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MOONDREAM_API_KEY`
   - `GEMINI_API_KEY`

Render free tier spins down after 15 minutes of inactivity. To keep it alive during demos, set up a cron job at cron-job.org to ping `https://your-render-url/health` every 14 minutes.

### After both are deployed

Update the Supabase project's allowed redirect URLs (Authentication > URL Configuration) to include your Vercel domain.

---

## How the AI detection works

1. While a call is active, the candidate's browser captures a frame from the local video element every 1.5 seconds using the Canvas API and sends it as a base64 JPEG over a WebSocket connection to the AI service.

2. The AI service decodes the frame and runs two Moondream API calls per frame: one object detection call (looking for persons and phones) and one visual question answering call (asking if the person is looking away from the screen).

3. Each detection is throttled to one event every 5 seconds per event type to avoid flooding the database with duplicate events.

4. When the interview ends, the `POST /analyse-interview/{id}` endpoint reads all stored events, calculates a weighted risk score, and prompts Gemini to write a plain-language summary. Both are saved to Supabase and displayed on the analysis page.
