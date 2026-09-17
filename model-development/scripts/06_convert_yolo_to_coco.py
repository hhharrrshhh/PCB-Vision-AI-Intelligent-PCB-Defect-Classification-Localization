"""
Convert the YOLO-seg polygon labels (from 02_generate_masks_sam.py) into a
COCO-format JSON annotation file, so the same dataset can be used to train
Mask R-CNN via Detectron2 as a second model to compare against YOLOv8-seg.

Run from the project root:
    python scripts/06_convert_yolo_to_coco.py
"""
import json
from pathlib import Path

import cv2

DATASET_SEG_DIR = Path("dataset_seg")  # built by scripts/03_train.py
OUT_DIR = Path("dataset_coco")

CLASSES = [
    "missing_hole",
    "mouse_bite",
    "open_circuit",
    "short",
    "spur",
    "spurious_copper",
]


def yolo_seg_to_coco(split: str):
    img_dir = DATASET_SEG_DIR / "images" / split
    lbl_dir = DATASET_SEG_DIR / "labels" / split

    images, annotations = [], []
    categories = [{"id": i, "name": c} for i, c in enumerate(CLASSES)]

    ann_id = 0
    for img_id, img_path in enumerate(sorted(img_dir.glob("*"))):
        image = cv2.imread(str(img_path))
        if image is None:
            continue
        h, w = image.shape[:2]
        images.append({
            "id": img_id,
            "file_name": img_path.name,
            "width": w,
            "height": h,
        })

        label_path = lbl_dir / f"{img_path.stem}.txt"
        if not label_path.exists():
            continue

        for line in label_path.read_text().strip().splitlines():
            if not line.strip():
                continue
            parts = line.split()
            cls_id = int(parts[0])
            coords = list(map(float, parts[1:]))

            # de-normalize polygon points back to pixel coordinates
            poly = []
            xs, ys = [], []
            for i in range(0, len(coords), 2):
                x = coords[i] * w
                y = coords[i + 1] * h
                poly.extend([x, y])
                xs.append(x)
                ys.append(y)

            x_min, y_min = min(xs), min(ys)
            box_w, box_h = max(xs) - x_min, max(ys) - y_min

            annotations.append({
                "id": ann_id,
                "image_id": img_id,
                "category_id": cls_id,
                "segmentation": [poly],
                "bbox": [x_min, y_min, box_w, box_h],
                "area": box_w * box_h,
                "iscrowd": 0,
            })
            ann_id += 1

    coco_dict = {"images": images, "annotations": annotations, "categories": categories}
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{split}.json"
    out_path.write_text(json.dumps(coco_dict))
    print(f"{split}: {len(images)} images, {len(annotations)} annotations -> {out_path}")


def main():
    for split in ("train", "val"):
        yolo_seg_to_coco(split)


if __name__ == "__main__":
    main()
