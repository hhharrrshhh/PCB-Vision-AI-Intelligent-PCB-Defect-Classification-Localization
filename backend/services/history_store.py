# backend/services/history_store.py
#
# Simple JSON file-based persistence for inspection records.
# No database required — appropriate for this project's scale.

import json
import os
import threading
from datetime import datetime, timezone
from typing import List, Dict, Any

# Absolute path to history JSON file
_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_HISTORY_FILE = os.path.join(_DATA_DIR, "history.json")

# Maximum records to keep in the file
MAX_RECORDS = 200

# Thread lock for concurrent access safety
_lock = threading.Lock()


def _ensure_data_dir():
    """Create the data directory if it doesn't exist."""
    os.makedirs(_DATA_DIR, exist_ok=True)


def load_history() -> List[Dict[str, Any]]:
    """Load all inspection records from disk. Returns [] if no records exist."""
    _ensure_data_dir()
    with _lock:
        if not os.path.exists(_HISTORY_FILE):
            return []
        try:
            with open(_HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, IOError):
            return []


def save_inspection(record: Dict[str, Any]) -> None:
    """
    Append an inspection record to the history file.
    Trims to MAX_RECORDS (most recent kept).
    """
    _ensure_data_dir()
    with _lock:
        # Load existing
        if os.path.exists(_HISTORY_FILE):
            try:
                with open(_HISTORY_FILE, "r", encoding="utf-8") as f:
                    records = json.load(f)
                    if not isinstance(records, list):
                        records = []
            except (json.JSONDecodeError, IOError):
                records = []
        else:
            records = []

        # Prepend new record (newest first)
        records.insert(0, record)

        # Trim
        records = records[:MAX_RECORDS]

        with open(_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)


def build_inspection_record(
    inspection_id: str,
    filename: str,
    inference_result: Dict[str, Any],
    repair_analysis: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build a serialisable history record from inference + repair results.
    """
    defects = inference_result.get("defects", [])
    total_defects = inference_result.get("total_defects", 0)
    processing_time_ms = inference_result.get("processing_time_ms", 0)

    # Determine average confidence
    confidences = [d.get("confidence", 0) for d in defects]
    avg_confidence = round(sum(confidences) / len(confidences) * 100, 1) if confidences else 0.0

    status = "Fail" if total_defects > 0 else "Pass"
    duration_s = round(processing_time_ms / 1000, 2)

    return {
        "inspection_id": inspection_id,
        "filename": filename,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "total_defects": total_defects,
        "avg_confidence": avg_confidence,
        "processing_time_ms": processing_time_ms,
        "duration_s": duration_s,
        "defects": defects,
        "repair_analysis": repair_analysis,
    }


def get_analytics() -> Dict[str, Any]:
    """
    Compute aggregated analytics from all stored inspection records.
    Returns empty/zero values when no records exist.
    """
    records = load_history()

    if not records:
        return {
            "total_inspections": 0,
            "total_defects": 0,
            "pass_count": 0,
            "fail_count": 0,
            "avg_confidence": 0.0,
            "avg_processing_time_ms": 0.0,
            "defects_by_class": {},
            "daily_stats": [],
            "pass_fail_ratio": [{"name": "Pass", "value": 0}, {"name": "Fail", "value": 0}],
        }

    total_inspections = len(records)
    total_defects = sum(r.get("total_defects", 0) for r in records)
    pass_count = sum(1 for r in records if r.get("status") == "Pass")
    fail_count = total_inspections - pass_count

    confidences = [r.get("avg_confidence", 0) for r in records if r.get("avg_confidence", 0) > 0]
    avg_confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0.0

    times = [r.get("processing_time_ms", 0) for r in records]
    avg_processing_time_ms = round(sum(times) / len(times), 1) if times else 0.0

    # Defects by class
    defects_by_class: Dict[str, int] = {}
    for r in records:
        for d in r.get("defects", []):
            cls = d.get("class_name", "unknown")
            defects_by_class[cls] = defects_by_class.get(cls, 0) + 1

    # Daily stats (last 7 days)
    from collections import defaultdict
    daily: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"inspections": 0, "defects": 0, "confidences": []})
    for r in records:
        ts = r.get("timestamp", "")
        try:
            day = datetime.fromisoformat(ts).strftime("%a")
        except (ValueError, TypeError):
            day = "?"
        daily[day]["inspections"] += 1
        daily[day]["defects"] += r.get("total_defects", 0)
        if r.get("avg_confidence", 0) > 0:
            daily[day]["confidences"].append(r.get("avg_confidence", 0))

    # Build last 7 unique days in order
    days_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    daily_stats = []
    for day in days_order:
        if day in daily:
            confs = daily[day]["confidences"]
            avg_conf = round(sum(confs) / len(confs), 1) if confs else 0.0
            daily_stats.append({
                "day": day,
                "inspections": daily[day]["inspections"],
                "defects": daily[day]["defects"],
                "avg_confidence": avg_conf,
                "processing_time_ms": avg_processing_time_ms,
            })

    return {
        "total_inspections": total_inspections,
        "total_defects": total_defects,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "avg_confidence": avg_confidence,
        "avg_processing_time_ms": avg_processing_time_ms,
        "defects_by_class": defects_by_class,
        "daily_stats": daily_stats,
        "pass_fail_ratio": [
            {"name": "Pass", "value": pass_count},
            {"name": "Fail", "value": fail_count},
        ],
    }
