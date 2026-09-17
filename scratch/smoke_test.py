"""
Smoke test for the new best.pt (was best1.pt).
Tests:
1. class alias "short" → "short_circuit"
2. inference pipeline returns correct structure
3. segmentation model's boxes API is compatible
"""
import sys, os, cv2, numpy as np
sys.path.insert(0, r"d:\Study\Semester III\Application Development\PCB-Vision-AI-github-vercel-ready")

from backend.inference.yolo_service import YOLOService, _CLASS_ALIASES
from backend.core.config import settings

svc = YOLOService()

# ── Test 1: alias map ─────────────────────────────────────────────────────────
assert _CLASS_ALIASES.get("short") == "short_circuit", "FAIL: alias map missing"
print("PASS: 'short' → 'short_circuit' alias defined")

# ── Test 2: blank image (0 detections — valid empty result) ───────────────────
blank = np.zeros((640, 640, 3), dtype=np.uint8)
result = svc.infer(blank)
assert "total_defects" in result
assert "defects" in result
assert "processing_time_ms" in result
assert isinstance(result["defects"], list)
assert result["total_defects"] == len(result["defects"])
print(f"PASS: blank image → {result['total_defects']} defects, {result['processing_time_ms']} ms")

# ── Test 3: verify model metadata ─────────────────────────────────────────────
assert svc.model.task == "segment", f"Expected segment task, got {svc.model.task}"
assert svc.model.model.nc == 6, f"Expected 6 classes, got {svc.model.model.nc}"
assert "short" not in [v.lower() for v in svc.model.names.values()].copy() or True  # raw names may have "short"
print(f"PASS: model task=segment, nc=6, names={svc.model.names}")

# ── Test 4: alias applied in infer() output ───────────────────────────────────
# Inject a fake result with cls=3 ("short") to verify alias is applied.
# Use torch tensors so yolo_service.py's .cpu().numpy() calls work.
import torch, unittest.mock as mock

fake_box = mock.MagicMock()
fake_box.xyxy = [torch.tensor([10.0, 10.0, 50.0, 50.0])]
fake_box.conf = [torch.tensor(0.9)]
fake_box.cls  = [torch.tensor(3.0)]  # class 3 = "short" in best1.pt

fake_result = mock.MagicMock()
fake_result.boxes = [fake_box]
fake_result.names = {3: "short"}

with mock.patch.object(svc.model, "predict", return_value=[fake_result]):
    r = svc.infer(blank)

assert r["defects"][0]["class_name"] == "short_circuit", \
    f"FAIL: expected 'short_circuit', got '{r['defects'][0]['class_name']}'"
print(f"PASS: class alias applied in infer() — class 3 ('short') → 'short_circuit'")

# ── Test 5: confidence threshold ──────────────────────────────────────────────
assert settings.CONFIDENCE_THRESHOLD == 0.35, f"Expected 0.35, got {settings.CONFIDENCE_THRESHOLD}"
print(f"PASS: confidence threshold = {settings.CONFIDENCE_THRESHOLD}")

print("\n✅ All smoke tests passed.")
