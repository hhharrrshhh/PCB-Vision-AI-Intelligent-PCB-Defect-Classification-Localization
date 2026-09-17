"""
Use Meta's Segment Anything Model (SAM) to turn each YOLO bounding box into a
pixel-accurate segmentation polygon, and write YOLO-seg format labels.

This is what upgrades a detection-only dataset (PKU-PCB/HRIPCB) into a
segmentation dataset without any manual pixel annotation.

Download a checkpoint first, e.g. (fastest/smallest):
    https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth

Run from the project root:
    python scripts/02_generate_masks_sam.py --checkpoint sam_vit_b_01ec64.pth
"""
import argparse
from pathlib import Path

import cv2
import numpy as np
import torch
from segment_anything import SamPredictor, sam_model_registry
from tqdm import tqdm

DATASET_DIR = Path("dataset")
MIN_POLYGON_POINTS = 6  # discard degenerate / near-empty masks


def mask_to_polygon(mask: np.ndarray, img_w: int, img_h: int):
    """Largest contour of a binary mask -> normalized YOLO-seg polygon."""
    contours, _ = cv2.findContours(
        mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        return None
    largest = max(contours, key=cv2.contourArea)
    if len(largest) < MIN_POLYGON_POINTS:
        return None
    # simplify so label files stay small
    eps = 0.002 * cv2.arcLength(largest, True)
    largest = cv2.approxPolyDP(largest, eps, True)
    points = largest.reshape(-1, 2).astype(float)
    points[:, 0] /= img_w
    points[:, 1] /= img_h
    return points.flatten().tolist()


def process_split(predictor: SamPredictor, split: str):
    img_dir = DATASET_DIR / "images" / split
    box_label_dir = DATASET_DIR / "labels" / split
    seg_label_dir = DATASET_DIR / "labels_seg" / split
    seg_label_dir.mkdir(parents=True, exist_ok=True)

    label_files = sorted(box_label_dir.glob("*.txt"))
    for label_path in tqdm(label_files, desc=f"SAM masks [{split}]"):
        img_path = next(img_dir.glob(f"{label_path.stem}.*"), None)
        if img_path is None:
            continue

        image = cv2.imread(str(img_path))
        img_h, img_w = image.shape[:2]
        predictor.set_image(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        lines = label_path.read_text().strip().splitlines()
        seg_lines = []
        for line in lines:
            cls_id, x_c, y_c, w, h = map(float, line.split())
            # de-normalize YOLO box -> pixel xyxy box prompt for SAM
            x1 = (x_c - w / 2) * img_w
            y1 = (y_c - h / 2) * img_h
            x2 = (x_c + w / 2) * img_w
            y2 = (y_c + h / 2) * img_h
            box_prompt = np.array([x1, y1, x2, y2])

            masks, scores, _ = predictor.predict(
                box=box_prompt, multimask_output=True
            )
            best_mask = masks[int(np.argmax(scores))]

            polygon = mask_to_polygon(best_mask, img_w, img_h)
            if polygon is None:
                continue  # fall back: this defect is skipped for seg training
            coords = " ".join(f"{v:.6f}" for v in polygon)
            seg_lines.append(f"{int(cls_id)} {coords}")

        (seg_label_dir / label_path.name).write_text("\n".join(seg_lines))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--model-type", default="vit_b", choices=["vit_b", "vit_l", "vit_h"])
    args = parser.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    sam = sam_model_registry[args.model_type](checkpoint=args.checkpoint)
    sam.to(device)
    predictor = SamPredictor(sam)

    for split in ("train", "val"):
        process_split(predictor, split)

    print("Done. Segmentation labels written to dataset/labels_seg/{train,val}/")


if __name__ == "__main__":
    main()
