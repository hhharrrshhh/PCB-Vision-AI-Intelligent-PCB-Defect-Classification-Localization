# backend/core/config.py

import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PCB Vision AI Backend"
    API_V1_STR: str = "/api/v1"
    
    # Path pointing to your copied YOLOv12 weights
    MODEL_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "weights", "best.pt")
    CONFIDENCE_THRESHOLD: float = 0.35
    IOU_THRESHOLD: float = 0.45
    
    # PCB Defect taxonomy mapping
    DEFECT_CLASSES: List[str] = [
        "open_circuit",
        "short_circuit",
        "mouse_bite",
        "missing_hole",
        "spur",
        "spurious_copper"
    ]
    
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        case_sensitive = True

settings = Settings()