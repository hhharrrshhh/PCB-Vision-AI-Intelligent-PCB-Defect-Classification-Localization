# backend/models/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ── Detection-level schemas ────────────────────────────────────────────────────

class BoundingBox(BaseModel):
    x_min: float = Field(..., description="Minimum X coordinate in pixels")
    y_min: float = Field(..., description="Minimum Y coordinate in pixels")
    x_max: float = Field(..., description="Maximum X coordinate in pixels")
    y_max: float = Field(..., description="Maximum Y coordinate in pixels")


class DefectRepairInfo(BaseModel):
    """Per-defect repair cost and guidance, attached to each detection."""
    display_name: str
    severity: str                        # Critical | Medium | Low
    estimated_repair_cost: float         # ₹
    estimated_repair_time_minutes: float # minutes
    suggested_repair: str
    description: str


class DefectDetectionResult(BaseModel):
    defect_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    repair_info: Optional[DefectRepairInfo] = None


# ── Repair viability schemas ───────────────────────────────────────────────────

class DefectBreakdownItem(BaseModel):
    """Individual defect contribution to repair cost estimate."""
    defect_id: int
    class_name: str
    display_name: str
    severity: str
    confidence: float
    estimated_repair_cost: float
    estimated_repair_time_minutes: float
    suggested_repair: str
    description: str


class RepairAnalysis(BaseModel):
    recommendation: str                      # REPAIR | REPAIR WITH CAUTION | DISCARD PCB | PASS
    estimated_repair_cost: float             # ₹ total
    replacement_cost: float                  # ₹ configured replacement cost
    repair_ratio: float                      # repair_cost / replacement_cost
    estimated_repair_time_minutes: float     # total repair time in minutes
    viability_score: int                     # 0–100 (higher = more viable to repair)
    reason: str                              # plain-language explanation
    defect_breakdown: List[DefectBreakdownItem] = []


# ── Inference response ─────────────────────────────────────────────────────────

class InferenceResponse(BaseModel):
    success: bool
    filename: str
    total_defects: int
    defects: List[DefectDetectionResult]
    processing_time_ms: float
    inspection_id: Optional[str] = None
    inspection_status: Optional[str] = None  # Pass | Fail
    repair_analysis: Optional[RepairAnalysis] = None


# ── Health check ───────────────────────────────────────────────────────────────

class HealthCheckResponse(BaseModel):
    status: str
    model_loaded: bool
    active_classes: List[str]


# ── History schemas ────────────────────────────────────────────────────────────

class InspectionSummary(BaseModel):
    """Lightweight record stored per inspection (for history + analytics)."""
    inspection_id: str
    filename: str
    timestamp: str                      # ISO-8601 UTC
    status: str                         # Pass | Fail
    total_defects: int
    avg_confidence: float
    processing_time_ms: float
    duration_s: float
    defects: List[Dict[str, Any]] = []
    repair_analysis: Optional[Dict[str, Any]] = None


class HistoryResponse(BaseModel):
    records: List[InspectionSummary]
    total: int


# ── Analytics schemas ──────────────────────────────────────────────────────────

class DailyStat(BaseModel):
    day: str
    inspections: int
    defects: int
    avg_confidence: float
    processing_time_ms: float


class AnalyticsResponse(BaseModel):
    total_inspections: int
    total_defects: int
    pass_count: int
    fail_count: int
    avg_confidence: float
    avg_processing_time_ms: float
    defects_by_class: Dict[str, int]
    daily_stats: List[DailyStat]
    pass_fail_ratio: List[Dict[str, Any]]


# ── Settings schemas ───────────────────────────────────────────────────────────

class RepairSettings(BaseModel):
    replacement_cost: float = Field(default=1500.0, ge=0, description="PCB replacement cost in ₹")
    labor_rate_per_min: float = Field(default=8.0, ge=0, description="Labor rate in ₹/min")