import os
import time
import base64
import asyncio
import logging
import numpy as np
import cv2
from PIL import Image
from vision_agents.plugins.moondream import CloudDetectionProcessor
from db.client import insert_ai_event

logger = logging.getLogger(__name__)

THROTTLE_SECONDS = 5

class CandidateFrameProcessor:

    def __init__(self, interview_id: str):
        self.interview_id = interview_id
        self.last_event_time: dict[str, float] = {}
        self._start_time: float = time.time()

        # Vision Agents SDK - CloudDetectionProcessor
        # detect_objects=["person", "cell phone"] means ONE API call detects both
        self.detector = CloudDetectionProcessor(
            api_key=os.environ["MOONDREAM_API_KEY"],
            detect_objects=["person", "cell phone"],
            conf_threshold=0.5,
        )

    def _can_emit(self, event_type: str) -> bool:
        now = time.time()
        if now - self._last_event_time.get(event_type, 0) >= THROTTLE_SECONDS:
            self._last_event_time[event_type] = now
            return True
        return False
    
    def _elapsed(self) -> int:
        return int(time.time() - self._start_time)
    
    def _decode_frame(self, frame_b64: str) -> tuple[np.ndarray | None, Image.Image | None]:
        try:
            frame_bytes = base64.b64decode(frame_b64)
            np_arr = np.frombuffer(frame_bytes, np.uint8)
            bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if bgr is None:
                return None, None
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            return rgb, Image.fromarray(rgb)
        except Exception as e:
            logger.error(f"Frame decode failed: {e}")
            return None, None
        
    async def process_frame(self, frame_b64: str):
        frame_array, pil_image = self._decode_frame(frame_b64)
        if frame_array is None:
            return
        
        # Sequential - respects Moondream 2 RPS limit
        # _check_objects = 1 API call (person + phone together)
        # _check_gaze   = 1 API call (VQA)
        # Total: 2 calls per frame
        await self._check_objects(frame_array)
        await self._check_gaze(pil_image)

    async def _check_objects(self, frame_array: np.ndarray):
        try:
            # Vision Agents SDK's own inference method
            # Returns: [{"label": "person", "bbox": [...], "confidence": 0.9}, ...]
            detections = await asyncio.to_thread(
                self.detector._run_detection_sync, frame_array
            )

            persons = [d for d in detections if d.get("label") == "person"]
            if len(persons) > 1 and self._can_emit("multiple_faces"):
                insert_ai_event(self.interview_id, "multiple_faces", 0.9, self._elapsed())
                logger.info(f"multiple_faces: {len(persons)} people detected")

            phones = [d for d in detections if d.get("label") == "cell phone"]
            if phones and self._can_emit("phone_detected"):
                confidence = phones[0].get("confidence", 0.85)
                insert_ai_event(self.interview_id, "phone_detected", confidence, self._elapsed())
                logger.info("phone_detected")
        except Exception as e:
            logger.error(f"Object detection failed: {e}")

    async def _check_gaze(self, pil_image: Image.Image):
        try:
            # self.detector.model is the underlying moondream client
            # CloudDetectionProcessor stores it as a public attribute
            result = await asyncio.to_thread(
                self.detector.model.query,
                pil_image,
                "Is the person looking away from the screen? Answer only yes or no."
            )

            answer = result.get("answer", "")
            # answer can be a string or generator depending on SDK version
            if hasattr(answer, "__iter__") and not isinstance(answer, str):
                answer = "".join(str(c) for c in answer)

            if answer.lower().strip().startswith("yes") and self._can_emit("gaze_away"):
                insert_ai_event(self.interview_id, "gaze_away", 0.75, self._elapsed())
                logger.info("gaze_away detected")
        except Exception as e:
            logger.error(f"Gaze check failed: {e}")
