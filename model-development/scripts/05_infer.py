"""
Run inference on a single PCB image: classify + segment each defect.

For readable visualization of tiny defects, use scripts/09_visualize.py
instead of the simple draw_overlay() below — this one draws labels directly
on the box, which becomes unreadable once boxes get small.

CLI usage:
    python scripts/05_infer.py --source path/to/test_image.jpg
"""
import argparse
from pathlib import Path

import cv2
import numpy as np

from inference_common import run_inference


def draw_overlay(image_path: str, defects: list[dict], out_path: str):
    """Simple mask + label overlay. Fine for large/medium defects; for tiny
    defects (the usual case on PCBs) use draw_annotated_result in
    09_visualize.py instead, which uses numbered markers + a legend panel."""
    image = cv2.imread(image_path)
    overlay = image.copy()
    rng = np.random.default_rng(42)
    colors = {d["class"]: rng.integers(0, 255, 3).tolist() for d in defects}

    for d in defects:
        color = colors[d["class"]]
        pts = np.array(d["mask_polygon"], dtype=np.int32)
        cv2.fillPoly(overlay, [pts], color)
        x1, y1, x2, y2 = map(int, d["bbox"])
        label = f"{d['class']} {d['confidence']:.2f}"
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        cv2.putText(image, label, (x1, max(y1 - 8, 0)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    blended = cv2.addWeighted(overlay, 0.4, image, 0.6, 0)
    cv2.imwrite(out_path, blended)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="path to a PCB image")
    parser.add_argument("--out", default="prediction_overlay.jpg")
    args = parser.parse_args()

    predictions = run_inference(args.source)
    print(f"Found {len(predictions)} defect(s):")
    for p in predictions:
        print(f"  - {p['class']} (confidence {p['confidence']})")

    if predictions:
        draw_overlay(args.source, predictions, args.out)
        print(f"Overlay saved to {Path(args.out).resolve()}")
