"""
Shared inference logic used by 05_infer.py and 09_visualize.py.
Kept in its own file because Python module names can't start with a digit,
so scripts can't import directly from each other.
"""
from ultralytics import YOLO

WEIGHTS_PATH = "runs_pcb/yolov8s_seg_pcb/weights/best.pt"
CONFIDENCE_THRESHOLD = 0.4

_model = None  # lazy-loaded so importing this module doesn't load weights


def _get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(WEIGHTS_PATH)
    return _model


def run_inference(image_path: str) -> list[dict]:
    """
    Returns a list of detected defects, each as:
      {
        "class": str,
        "confidence": float,
        "bbox": [x1, y1, x2, y2],
        "mask_polygon": [[x, y], ...]   # pixel coordinates, original image size
      }
    This is the contract Person 2's API should build its response schema around.
    """
    model = _get_model()
    result = model.predict(source=image_path, conf=CONFIDENCE_THRESHOLD, verbose=False)[0]

    defects = []
    if result.masks is None:
        return defects

    names = result.names
    for box, cls_id, conf, mask_xy in zip(
        result.boxes.xyxy.cpu().numpy(),
        result.boxes.cls.cpu().numpy(),
        result.boxes.conf.cpu().numpy(),
        result.masks.xy,  # polygon points already in original image pixel coords
    ):
        defects.append({
            "class": names[int(cls_id)],
            "confidence": round(float(conf), 4),
            "bbox": [round(float(v), 1) for v in box],
            "mask_polygon": [[round(float(x), 1), round(float(y), 1)] for x, y in mask_xy],
        })
    return defects
