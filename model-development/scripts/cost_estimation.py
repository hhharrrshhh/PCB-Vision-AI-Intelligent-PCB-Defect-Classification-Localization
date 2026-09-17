"""
Estimate repair/scrap cost from detected PCB defects, for the Indian
manufacturing context.

METHODOLOGY (read before presenting these numbers as fact):
This is a labor-time x wage-rate estimate, not sourced market pricing --
a web search for "bare-board AOI rework technician hourly rate, India"
did not turn up a reliable published figure. ASSUMED_HOURLY_WAGE_INR and
BOARD_MATERIAL_COST_INR are placeholders -- edit them to your real shop
rates if you have them.

SCRAP RULES (a board is scrapped, not repaired, if either applies):
  1. It has a "missing_hole" defect. A plated via/hole is formed DURING
     fabrication (drilled, then the barrel is copper-plated, before outer
     layers are etched). That can't be redone on a finished board -- there
     is no repair path, so this always forces scrap regardless of cost.
  2. The total estimated repair cost exceeds the cost of a replacement
     board. Even a technically repairable board isn't worth repairing if
     doing so costs more than just swapping it for a new one.
"""
from collections import Counter

ASSUMED_HOURLY_WAGE_INR = 150   # skilled rework technician, fully-loaded cost/hr -- EDIT to your real rate
BOARD_MATERIAL_COST_INR = 250   # placeholder bare-board replacement cost -- EDIT to your real cost
BASE_INSPECTION_FEE_INR = 50.00  # flat per-board AOI/handling fee, edit or set to 0

# (repairable, estimated minutes, extra material cost INR)
DEFECT_REWORK_PROFILE = {
    "missing_hole":     (False, 5,  0),   # always scrap -- see module docstring, rule 1
    "open_circuit":     (True, 18,  10),  # jumper wire + continuity test
    "short":            (True, 12,  5),   # locate + remove bridging copper
    "mouse_bite":       (True, 6,   2),   # file/reshape edge
    "spur":             (True, 5,   2),   # trim excess copper
    "spurious_copper":  (True, 8,   3),   # etch/scrape unwanted copper
}


def estimate_cost(defects: list[dict]) -> dict:
    """
    defects: list of dicts as returned by inference_common.run_inference(),
    each with at least a "class" key.

    Decision order:
      1. If any defect is unrepairable (missing_hole) -> SCRAP.
      2. Else, sum the repair cost of every defect on the board. If that
         sum exceeds BOARD_MATERIAL_COST_INR -> SCRAP (not worth repairing).
      3. Else -> REPAIRABLE, total cost is the repair sum.

    When SCRAP, total_estimated_cost is just the board replacement cost --
    repair line items are still reported in cost_breakdown for transparency
    (so you can see *why* it hit scrap), but they are NOT added on top of
    the scrap cost.
    """
    counts = Counter(d["class"] for d in defects)

    repair_breakdown = {}
    unrated = []
    has_unrepairable_defect = False

    for cls, count in counts.items():
        profile = DEFECT_REWORK_PROFILE.get(cls)
        if profile is None:
            unrated.append(cls)
            continue
        repairable, minutes, material = profile
        if not repairable:
            has_unrepairable_defect = True
            repair_breakdown[cls] = 0.0  # no repair cost -- it's unrepairable, not priced as a fix
            continue
        labor_cost = (minutes / 60) * ASSUMED_HOURLY_WAGE_INR
        repair_breakdown[cls] = round((labor_cost + material) * count, 2)

    repair_sum = round(sum(repair_breakdown.values()), 2)

    # Decision logic: unrepairable defect always wins; otherwise compare cost.
    if has_unrepairable_defect:
        scrap = True
        scrap_reason = "Unrepairable defect present (missing_hole)"
    elif repair_sum > BOARD_MATERIAL_COST_INR:
        scrap = True
        scrap_reason = f"Repair cost (Rs. {repair_sum:.2f}) exceeds board cost (Rs. {BOARD_MATERIAL_COST_INR:.2f})"
    else:
        scrap = False
        scrap_reason = None

    if scrap:
        total = round(BOARD_MATERIAL_COST_INR + BASE_INSPECTION_FEE_INR, 2)
    else:
        total = round(repair_sum + BASE_INSPECTION_FEE_INR, 2)

    result = {
        "currency": "INR",
        "defect_counts": dict(counts),
        "cost_breakdown": repair_breakdown,     # per-class repair cost, for transparency even if scrapped
        "repair_cost_subtotal": repair_sum,
        "board_replacement_cost": BOARD_MATERIAL_COST_INR,
        "base_inspection_fee": BASE_INSPECTION_FEE_INR,
        "total_estimated_cost": total,
        "board_status": "SCRAP" if scrap else "REPAIRABLE",
        "scrap_reason": scrap_reason,
        "assumptions": {
            "hourly_wage_inr": ASSUMED_HOURLY_WAGE_INR,
            "board_replacement_cost_inr": BOARD_MATERIAL_COST_INR,
            "note": "Labor-time estimate, not sourced market pricing -- see module docstring.",
        },
    }
    if unrated:
        result["warning"] = f"No cost profile defined for: {unrated} -- excluded from total."
    return result
