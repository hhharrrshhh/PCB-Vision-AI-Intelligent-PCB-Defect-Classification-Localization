import unittest.mock as mock

import numpy as np
import torch

from backend.core.config import settings
from backend.inference.yolo_service import YOLOService, _CLASS_ALIASES


def test_short_circuit_alias():
    assert _CLASS_ALIASES.get("short") == "short_circuit"


def test_blank_image_inference():
    svc = YOLOService()

    blank = np.zeros((640, 640, 3), dtype=np.uint8)
    result = svc.infer(blank)

    assert "total_defects" in result
    assert "defects" in result
    assert "processing_time_ms" in result
    assert isinstance(result["defects"], list)
    assert result["total_defects"] == len(result["defects"])


def test_model_metadata():
    svc = YOLOService()

    assert svc.model.task == "segment"
    assert svc.model.model.nc == 6


def test_class_alias_applied_during_inference():
    svc = YOLOService()

    blank = np.zeros((640, 640, 3), dtype=np.uint8)

    fake_box = mock.MagicMock()
    fake_box.xyxy = [torch.tensor([10.0, 10.0, 50.0, 50.0])]
    fake_box.conf = [torch.tensor(0.9)]
    fake_box.cls = [torch.tensor(3.0)]

    fake_result = mock.MagicMock()
    fake_result.boxes = [fake_box]
    fake_result.names = {3: "short"}

    with mock.patch.object(
        svc.model,
        "predict",
        return_value=[fake_result],
    ):
        result = svc.infer(blank)

    assert result["defects"][0]["class_name"] == "short_circuit"


def test_confidence_threshold():
    assert settings.CONFIDENCE_THRESHOLD == 0.35
