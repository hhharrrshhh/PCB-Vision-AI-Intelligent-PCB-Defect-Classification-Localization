# backend/api/v1/endpoints.py

import uuid
import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from backend.models.schemas import (
    InferenceResponse, HealthCheckResponse,
    HistoryResponse, AnalyticsResponse, InspectionSummary,
)
from backend.inference.yolo_service import yolo_service
from backend.core.config import settings
from backend.services.repair_estimator import estimate_repair
from backend.services.repair_config import REPLACEMENT_COST
from backend.services import history_store

router = APIRouter()


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthCheckResponse)
def health_check():
    return {
        "status": "healthy" if yolo_service.model is not None else "degraded",
        "model_loaded": yolo_service.model is not None,
        "active_classes": settings.DEFECT_CLASSES,
    }


# ── Inspect ───────────────────────────────────────────────────────────────────

@router.post("/inspect", response_model=InferenceResponse)
async def inspect_pcb(file: UploadFile = File(...)):
    """
    Run YOLO defect detection on an uploaded PCB image.
    Returns real detections + repair viability analysis.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupted or unsupported image file. Please upload a valid PNG/JPG image.",
            )

        # ── YOLO inference ─────────────────────────────────────────────────
        inference_result = yolo_service.infer(img)
        raw_defects = inference_result["defects"]

        # ── Repair estimation ──────────────────────────────────────────────
        repair_result = estimate_repair(raw_defects, replacement_cost=REPLACEMENT_COST)
        repair_breakdown = repair_result.get("defect_breakdown", [])

        # ── Enrich defects with per-defect repair info ─────────────────────
        breakdown_by_id = {item["defect_id"]: item for item in repair_breakdown}
        enriched_defects = []
        for defect in raw_defects:
            d_id = defect["defect_id"]
            bd = breakdown_by_id.get(d_id, {})
            enriched_defects.append({
                **defect,
                "repair_info": {
                    "display_name": bd.get("display_name", defect["class_name"]),
                    "severity": bd.get("severity", "Unknown"),
                    "estimated_repair_cost": bd.get("estimated_repair_cost", 0.0),
                    "estimated_repair_time_minutes": bd.get("estimated_repair_time_minutes", 0.0),
                    "suggested_repair": bd.get("suggested_repair", "Manual inspection recommended."),
                    "description": bd.get("description", ""),
                } if bd else None,
            })

        # ── Unique inspection ID ───────────────────────────────────────────
        inspection_id = f"INSP-{uuid.uuid4().hex[:8].upper()}"
        inspection_status = "Fail" if inference_result["total_defects"] > 0 else "Pass"

        # ── Persist to history ─────────────────────────────────────────────
        record = history_store.build_inspection_record(
            inspection_id=inspection_id,
            filename=file.filename or "pcb_image.png",
            inference_result=inference_result,
            repair_analysis=repair_result,
        )
        history_store.save_inspection(record)

        return {
            "success": True,
            "filename": file.filename or "pcb_image.png",
            "total_defects": inference_result["total_defects"],
            "defects": enriched_defects,
            "processing_time_ms": inference_result["processing_time_ms"],
            "inspection_id": inspection_id,
            "inspection_status": inspection_status,
            "repair_analysis": repair_result,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── History ───────────────────────────────────────────────────────────────────

@router.get("/history", response_model=HistoryResponse)
def get_history(limit: int = 50, offset: int = 0):
    """Return paginated inspection history records (newest first)."""
    records = history_store.load_history()
    total = len(records)
    page_records = records[offset: offset + limit]
    return {
        "records": page_records,
        "total": total,
    }


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics():
    """Return aggregated inspection statistics computed from stored history."""
    return history_store.get_analytics()