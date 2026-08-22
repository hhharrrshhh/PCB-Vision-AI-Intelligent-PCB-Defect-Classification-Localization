# backend/inference/yolo_service.py

import time
import os
import cv2
import numpy as np
from ultralytics import YOLO
from backend.core.config import settings

class YOLOService:
    def __init__(self):
        self.model_path = settings.MODEL_PATH
        self.model = None
        self.load_model()

    def load_model(self):
        """Loads trained YOLOv12 model weights into memory."""
        try:
            if os.path.exists(self.model_path):
                print(f"[INFO] Loading YOLO weights from: {self.model_path}")
                self.model = YOLO(self.model_path)
                print("[INFO] YOLO Model successfully loaded.")
            else:
                print(f"[WARNING] Weights not found at {self.model_path}. Loading standard default weights.")
                self.model = YOLO("yolov8n.pt")
        except Exception as e:
            print(f"[ERROR] Failed to load YOLO model: {str(e)}")
            self.model = None

    def infer(self, image: np.ndarray):
        """Runs image prediction and extracts bounding boxes."""
        start_time = time.time()
        
        if self.model is None:
            raise RuntimeError("YOLO Model is not loaded properly.")

        results = self.model.predict(
            source=image,
            conf=settings.CONFIDENCE_THRESHOLD,
            iou=settings.IOU_THRESHOLD,
            verbose=False
        )
        
        result = results[0]
        detected_defects = []
        
        boxes = result.boxes
        for idx, box in enumerate(boxes):
            coords = box.xyxy[0].cpu().numpy().tolist() # [x_min, y_min, x_max, y_max]
            conf = float(box.conf[0].cpu().numpy())
            cls_id = int(box.cls[0].cpu().numpy())
            
            # Map class ID to string name
            class_names = result.names
            raw_class_name = class_names.get(cls_id, f"defect_{cls_id}")
            class_name = str(raw_class_name).lower().replace(" ", "_")
            
            detected_defects.append({
                "defect_id": idx + 1,
                "class_name": class_name,
                "confidence": round(conf, 4),
                "bbox": {
                    "x_min": round(coords[0], 2),
                    "y_min": round(coords[1], 2),
                    "x_max": round(coords[2], 2),
                    "y_max": round(coords[3], 2)
                }
            })
            
        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
        
        return {
            "total_defects": len(detected_defects),
            "defects": detected_defects,
            "processing_time_ms": elapsed_ms
        }

yolo_service = YOLOService()