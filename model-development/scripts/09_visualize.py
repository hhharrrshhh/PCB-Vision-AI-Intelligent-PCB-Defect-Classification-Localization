"""
Enhanced result visualization for tiny defects.

Problem: PCB defects are often <1% of the image, so a text label crammed
onto/near a 20x20px box is unreadable regardless of font tricks.

Fix: don't label the box directly. Instead:
  1. Draw a fixed-size numbered marker next to each box (size scales with the
     IMAGE, never the box, with a floor so it's never too small)
  2. Connect marker -> box with a thin leader line
  3. Render a side legend panel with a zoomed crop + readable text per defect

CLI usage:
    python scripts/09_visualize.py --source path/to/test_image.jpg
"""
import argparse
from pathlib import Path

import cv2
import numpy as np

from inference_common import run_inference

CROP_SIZE = 120         # zoomed thumbnail size in the legend panel, px
PANEL_WIDTH = 340        # legend panel width, px
CROP_PADDING = 15        # extra context pixels around each defect crop


def _color_for_class(class_name: str, colors: dict, rng: np.random.Generator):
    if class_name not in colors:
        colors[class_name] = tuple(int(c) for c in rng.integers(80, 255, 3))
    return colors[class_name]


def draw_annotated_result(image_path: str, defects: list[dict], out_path: str):
    image = cv2.imread(image_path)
    h, w = image.shape[:2]
    annotated = image.copy()

    rng = np.random.default_rng(42)
    colors = {}

    # marker size scales with the IMAGE (not the box), with a readable floor
    marker_radius = max(14, int(min(h, w) * 0.014))
    box_thickness = max(2, marker_radius // 5)

    for i, d in enumerate(defects, start=1):
        color = _color_for_class(d["class"], colors, rng)
        x1, y1, x2, y2 = map(int, d["bbox"])
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, box_thickness)

        # place the numbered marker just outside the box, clamped on-screen
        cx = min(x2 + marker_radius, w - marker_radius)
        cy = max(y1 - marker_radius, marker_radius)

        box_cx, box_cy = (x1 + x2) // 2, (y1 + y2) // 2
        cv2.line(annotated, (cx, cy), (box_cx, box_cy), color, 1, cv2.LINE_AA)

        cv2.circle(annotated, (cx, cy), marker_radius, color, -1)
        cv2.circle(annotated, (cx, cy), marker_radius, (255, 255, 255), 2)
        text = str(i)
        font_scale = marker_radius / 22
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 2)
        cv2.putText(annotated, text, (cx - tw // 2, cy + th // 2),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), 2)

    # ---- side legend panel: zoomed crop + readable text per defect ----
    panel = np.full((h, PANEL_WIDTH, 3), 245, dtype=np.uint8)
    y_cursor = 20
    shown, hidden = 0, 0

    for i, d in enumerate(defects, start=1):
        if y_cursor + CROP_SIZE + 25 > h:
            hidden += 1
            continue  # panel is full; see note below for pagination

        x1, y1, x2, y2 = map(int, d["bbox"])
        cx1, cy1 = max(x1 - CROP_PADDING, 0), max(y1 - CROP_PADDING, 0)
        cx2, cy2 = min(x2 + CROP_PADDING, w), min(y2 + CROP_PADDING, h)
        crop = image[cy1:cy2, cx1:cx2]
        if crop.size == 0:
            continue
        crop_resized = cv2.resize(crop, (CROP_SIZE, CROP_SIZE), interpolation=cv2.INTER_NEAREST)

        panel[y_cursor:y_cursor + CROP_SIZE, 20:20 + CROP_SIZE] = crop_resized
        color = colors[d["class"]]
        cv2.rectangle(panel, (20, y_cursor), (20 + CROP_SIZE, y_cursor + CROP_SIZE), color, 3)

        text_x = 20 + CROP_SIZE + 15
        cv2.putText(panel, f"#{i} {d['class']}", (text_x, y_cursor + 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 2)
        cv2.putText(panel, f"conf {d['confidence']:.2f}", (text_x, y_cursor + 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (90, 90, 90), 1)

        y_cursor += CROP_SIZE + 25
        shown += 1

    if hidden:
        cv2.putText(panel, f"+{hidden} more (scroll in app UI)", (20, min(y_cursor, h - 15)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (120, 120, 120), 1)

    combined = np.hstack([annotated, panel])
    cv2.imwrite(out_path, combined)
    return shown, hidden


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="path to a PCB image")
    parser.add_argument("--out", default="annotated_result.jpg")
    args = parser.parse_args()

    predictions = run_inference(args.source)
    print(f"Found {len(predictions)} defect(s).")

    if predictions:
        shown, hidden = draw_annotated_result(args.source, predictions, args.out)
        print(f"Legend panel shows {shown} defect(s)" + (f", {hidden} hidden (panel full)" if hidden else ""))
        print(f"Saved to {Path(args.out).resolve()}")
    else:
        print("No defects to visualize.")
