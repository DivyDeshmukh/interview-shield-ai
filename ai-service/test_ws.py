import asyncio
import websockets
import json
import base64

async def test():
    # encode any real JPEG image as base64
    with open("test_frame.png", "rb") as f:
        frame_b64 = base64.b64encode(f.read()).decode()

    uri = "ws://localhost:8000/ws/video/1331a3ae-9706-4d79-ba6f-db53842b14b1"
    async with websockets.connect(uri) as ws:
        print("Connected")
        await ws.send(json.dumps({"frame": frame_b64}))
        print("Frame sent — check server logs and Supabase ai_events table")
        await asyncio.sleep(5)

asyncio.run(test())
