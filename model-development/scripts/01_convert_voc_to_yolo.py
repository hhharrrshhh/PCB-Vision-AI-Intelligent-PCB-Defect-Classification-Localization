"""
Convert PKU-PCB / HRIPCB PASCAL-VOC XML box annotations into YOLO detection
format, and split the data into train/val sets.

Run from the project root:
    python scripts/01_convert_voc_to_yolo.py
"""
import random
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

# ---- adjust these to match your downloaded dataset's layout -------------
RAW_IMAGES_DIR = Path("raw_data/images")
RAW_ANNOTATIONS_DIR = Path("raw_data/Annotations")
OUT_DIR = Path("dataset")
VAL_SPLIT = 0.15
SEED = 42
# ---------------------------------------------------------------------------

CLASSES = [
    "missing_hole",
    "mouse_bite",
    "open_circuit",
    "short",
    "spur",
    "spurious_copper",
]
CLASS_TO_ID = {c: i for i, c in enumerate(CLASSES)}


def normalize_class_name(raw_name: str) -> str:
    """Dataset mirrors use inconsistent casing/spacing for class names."""
    return raw_name.strip().lower().replace(" ", "_").replace("-", "_")


def parse_voc_xml(xml_path: Path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    size = root.find("size")
    img_w = int(size.find("width").text)
    img_h = int(size.find("height").text)

    boxes = []
    for obj in root.findall("object"):
        cls_name = normalize_class_name(obj.find("name").text)
        if cls_name not in CLASS_TO_ID:
            continue
        bnd = obj.find("bndbox")
        xmin = float(bnd.find("xmin").text)
        ymin = float(bnd.find("ymin").text)
        xmax = float(bnd.find("xmax").text)
        ymax = float(bnd.find("ymax").text)

        # convert to YOLO normalized (x_center, y_center, w, h)
        x_c = ((xmin + xmax) / 2) / img_w
        y_c = ((ymin + ymax) / 2) / img_h
        w = (xmax - xmin) / img_w
        h = (ymax - ymin) / img_h
        boxes.append((CLASS_TO_ID[cls_name], x_c, y_c, w, h))
    return boxes


def main():
    random.seed(SEED)
    xml_files = sorted(RAW_ANNOTATIONS_DIR.rglob("*.xml"))
    if not xml_files:
        raise SystemExit(
            f"No .xml files found under {RAW_ANNOTATIONS_DIR} — "
            "check RAW_ANNOTATIONS_DIR at the top of this script."
        )
    random.shuffle(xml_files)

    n_val = int(len(xml_files) * VAL_SPLIT)
    splits = {"val": xml_files[:n_val], "train": xml_files[n_val:]}

    for split, files in splits.items():
        (OUT_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (OUT_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    n_written, n_skipped = 0, 0
    for split, files in splits.items():
        for xml_path in files:
            stem = xml_path.stem
            img_path = next(RAW_IMAGES_DIR.rglob(f"{stem}.*"), None)
            if img_path is None:
                n_skipped += 1
                continue

            boxes = parse_voc_xml(xml_path)
            if not boxes:
                n_skipped += 1
                continue

            shutil.copy(img_path, OUT_DIR / "images" / split / img_path.name)
            label_path = OUT_DIR / "labels" / split / f"{stem}.txt"
            with open(label_path, "w") as f:
                for cls_id, x_c, y_c, w, h in boxes:
                    f.write(f"{cls_id} {x_c:.6f} {y_c:.6f} {w:.6f} {h:.6f}\n")
            n_written += 1

    print(f"Done. Wrote {n_written} images/labels, skipped {n_skipped}.")
    print(f"Train: {len(splits['train'])} | Val: {len(splits['val'])}")


if __name__ == "__main__":
    main()
