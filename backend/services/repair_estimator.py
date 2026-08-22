# backend/services/repair_estimator.py
#
# Deterministic, explainable repair cost estimation.
# Consumes real YOLO detection results and produces a repair viability analysis.

from typing import List, Dict, Any
from backend.services.repair_config import (
    DEFECT_COST_TABLE,
    DEFAULT_DEFECT_COST,
    LABOR_RATE_PER_MIN,
    FIXED_SETUP_COST,
    REPLACEMENT_COST,
    REPAIR_THRESHOLD,
    CAUTION_THRESHOLD,
    CRITICAL_DEFECT_DISCARD_COUNT,
)


def _get_defect_info(class_name: str) -> Dict[str, Any]:
    """Return cost config for a class name, with fallback for unknown classes."""
    # Try exact match, then try stripping whitespace/case variants
    key = class_name.lower().replace(" ", "_").replace("-", "_")
    return DEFECT_COST_TABLE.get(key, DEFAULT_DEFECT_COST)


def _confidence_weight(confidence: float) -> float:
    """
    Scale cost by detection confidence.
    Low-confidence detections (≈0.25) contribute 77.5% of cost.
    High-confidence detections (≈1.00) contribute 100% of cost.
    Formula: weight = 0.7 + 0.3 × confidence
    """
    return 0.7 + 0.3 * min(max(confidence, 0.0), 1.0)


def estimate_repair(
    detections: List[Dict[str, Any]],
    replacement_cost: float = REPLACEMENT_COST,
) -> Dict[str, Any]:
    """
    Calculate repair viability from real YOLO detections.

    Parameters
    ----------
    detections : list of dicts with keys: class_name, confidence, defect_id, bbox
    replacement_cost : configurable PCB replacement cost in ₹

    Returns
    -------
    dict matching the RepairAnalysis Pydantic schema
    """
    if not detections:
        # Zero defects → PCB passes → repair not needed
        return {
            "recommendation": "PASS",
            "estimated_repair_cost": 0.0,
            "replacement_cost": replacement_cost,
            "repair_ratio": 0.0,
            "estimated_repair_time_minutes": 0,
            "viability_score": 100,
            "reason": "No defects detected. The PCB passes inspection and requires no repair.",
            "defect_breakdown": [],
        }

    breakdown = []
    total_repair_cost = 0.0
    total_time_minutes = 0.0
    critical_count = 0

    for det in detections:
        class_name = det.get("class_name", "unknown")
        confidence = float(det.get("confidence", 0.5))
        defect_id = det.get("defect_id", 0)

        info = _get_defect_info(class_name)

        # Per-defect cost calculation
        labor_cost = info["repair_time_minutes"] * LABOR_RATE_PER_MIN
        raw_cost = info["base_repair_cost"] + info["material_cost"] + labor_cost
        weight = _confidence_weight(confidence)
        weighted_cost = round(raw_cost * weight, 2)
        weighted_time = round(info["repair_time_minutes"] * weight, 1)

        if info["severity"] == "Critical":
            critical_count += 1

        breakdown.append({
            "defect_id": defect_id,
            "class_name": class_name,
            "display_name": info["display_name"],
            "severity": info["severity"],
            "confidence": round(confidence, 4),
            "estimated_repair_cost": weighted_cost,
            "estimated_repair_time_minutes": weighted_time,
            "suggested_repair": info["suggested_repair"],
            "description": info["description"],
        })

        total_repair_cost += weighted_cost
        total_time_minutes += weighted_time

    # Add fixed session setup cost (only once regardless of defect count)
    total_repair_cost += FIXED_SETUP_COST
    total_repair_cost = round(total_repair_cost, 2)
    total_time_minutes = round(total_time_minutes, 1)

    # Repair ratio and viability score
    repair_ratio = round(total_repair_cost / replacement_cost, 4)
    viability_score = max(0, round((1.0 - repair_ratio) * 100))

    # ── Decision logic ────────────────────────────────────────────────────────
    # Severity override: too many critical defects → discard regardless of cost
    if critical_count >= CRITICAL_DEFECT_DISCARD_COUNT:
        recommendation = "DISCARD PCB"
        reason = (
            f"Detected {critical_count} critical defect(s) (open/short circuits). "
            "Structural damage of this severity makes reliable repair impractical. "
            "PCB replacement is strongly recommended."
        )
    elif repair_ratio < REPAIR_THRESHOLD:
        recommendation = "REPAIR"
        reason = (
            f"Estimated repair cost (Rs.{total_repair_cost:.0f}) is {repair_ratio*100:.0f}% of "
            f"replacement cost (Rs.{replacement_cost:.0f}). Defects are localized and economically "
            "worthwhile to repair."
        )
    elif repair_ratio < CAUTION_THRESHOLD:
        recommendation = "REPAIR WITH CAUTION"
        reason = (
            f"Repair cost (Rs.{total_repair_cost:.0f}) is {repair_ratio*100:.0f}% of replacement "
            f"cost (Rs.{replacement_cost:.0f}). Repair is marginally viable — assess technician "
            "availability and board criticality before proceeding."
        )
    else:
        recommendation = "DISCARD PCB"
        reason = (
            f"Repair cost (Rs.{total_repair_cost:.0f}) is {repair_ratio*100:.0f}% of replacement "
            f"cost (Rs.{replacement_cost:.0f}). Repair is not economically justified. "
            "Procuring a replacement PCB is the recommended course of action."
        )

    return {
        "recommendation": recommendation,
        "estimated_repair_cost": total_repair_cost,
        "replacement_cost": replacement_cost,
        "repair_ratio": repair_ratio,
        "estimated_repair_time_minutes": total_time_minutes,
        "viability_score": viability_score,
        "reason": reason,
        "defect_breakdown": breakdown,
    }
