# backend/services/repair_config.py
#
# Single configurable source of truth for repair cost estimation.
# All monetary values are in Indian Rupees (₹) and are approximate estimates —
# not actual market prices. Adjust freely for your manufacturing context.

from typing import Dict, Any

# ── Labor & overhead ──────────────────────────────────────────────────────────
LABOR_RATE_PER_MIN: float = 8.0        # ₹ per minute of technician time
FIXED_SETUP_COST: float = 50.0         # ₹ fixed cost per repair session (tools, ESD, etc.)
REPLACEMENT_COST: float = 1500.0       # ₹ default PCB replacement / procurement cost

# ── Repair decision thresholds (repair_ratio = repair_cost / replacement_cost) ─
REPAIR_THRESHOLD: float = 0.50         # ratio < this  → REPAIR
CAUTION_THRESHOLD: float = 0.80        # ratio < this  → REPAIR WITH CAUTION (else DISCARD)

# ── Critical-defect override ───────────────────────────────────────────────────
# If the number of detections with severity == "Critical" meets or exceeds this
# value, the recommendation is forced to DISCARD regardless of cost ratio.
CRITICAL_DEFECT_DISCARD_COUNT: int = 2

# ── Per-defect cost table ─────────────────────────────────────────────────────
# Keys MUST match the class_name values returned by the YOLO model (snake_case).
#
# Fields:
#   display_name    – Human-readable name shown in UI
#   severity        – Critical | Medium | Low
#   base_repair_cost– ₹ flat labour cost to repair one instance
#   material_cost   – ₹ consumable / solder / chemicals per instance
#   repair_time_minutes – expected technician time per instance
#   description     – short description for UI display
#   suggested_repair – one-line repair guidance
#
DEFECT_COST_TABLE: Dict[str, Dict[str, Any]] = {
    "open_circuit": {
        "display_name": "Open Circuit",
        "severity": "Critical",
        "base_repair_cost": 120.0,
        "material_cost": 30.0,
        "repair_time_minutes": 15.0,
        "description": "A break in a copper trace interrupts the intended electrical path.",
        "suggested_repair": "Bridge or re-route the damaged trace; verify continuity before reflow.",
    },
    "short_circuit": {
        "display_name": "Short Circuit",
        "severity": "Critical",
        "base_repair_cost": 140.0,
        "material_cost": 20.0,
        "repair_time_minutes": 18.0,
        "description": "Unintended copper bridges two traces that should be electrically isolated.",
        "suggested_repair": "Remove excess copper between pads; re-test isolation resistance.",
    },
    "mouse_bite": {
        "display_name": "Mouse Bite",
        "severity": "Medium",
        "base_repair_cost": 60.0,
        "material_cost": 15.0,
        "repair_time_minutes": 10.0,
        "description": "Small notches eroded into a trace or pad edge, thinning conductive area.",
        "suggested_repair": "Inspect under magnification; rework trace if width falls below design spec.",
    },
    "missing_hole": {
        "display_name": "Missing Hole",
        "severity": "Medium",
        "base_repair_cost": 80.0,
        "material_cost": 10.0,
        "repair_time_minutes": 12.0,
        "description": "A drilled via or mounting hole is absent from its expected position.",
        "suggested_repair": "Flag panel for re-drill; verify alignment against Gerber before component placement.",
    },
    "spurious_copper": {
        "display_name": "Spurious Copper",
        "severity": "Low",
        "base_repair_cost": 40.0,
        "material_cost": 8.0,
        "repair_time_minutes": 7.0,
        "description": "Unwanted copper residue left on the laminate outside the design pattern.",
        "suggested_repair": "Etch-clean the region; confirm no adjacency to active nets.",
    },
    "spur": {
        "display_name": "Spur",
        "severity": "Low",
        "base_repair_cost": 30.0,
        "material_cost": 5.0,
        "repair_time_minutes": 5.0,
        "description": "A stray copper protrusion branching off an existing trace.",
        "suggested_repair": "Trim spur; re-inspect clearance against neighbouring nets.",
    },
}

# Fallback for unknown defect classes not in the table above
DEFAULT_DEFECT_COST: Dict[str, Any] = {
    "display_name": "Unknown Defect",
    "severity": "Medium",
    "base_repair_cost": 60.0,
    "material_cost": 10.0,
    "repair_time_minutes": 10.0,
    "description": "An unclassified defect was detected.",
    "suggested_repair": "Manual inspection recommended.",
}
