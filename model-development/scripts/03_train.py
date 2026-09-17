"""
Prepare the Ultralytics-friendly folder layout for segmentation training,
then train YOLOv8-seg on it.

Run from the project root:
    python scripts/03_train.py
"""
import os
import shutil
from pathlib import Path

from ultralytics import YOLO

DATASET_DIR = Path("dataset")
DATASET_SEG_DIR = Path("dataset_seg")

# Model size: 'n' (nano) trains fastest on modest hardware/Colab; step up to
# 's' or 'm' for a few extra mAP points if you have the GPU budget/time.
MODEL_WEIGHTS = "yolov8s-seg.pt"
EPOCHS = 100
IMG_SIZE = 640
BATCH_SIZE = 16


def link_or_copy(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        return
    try:
        os.symlink(src.resolve(), dst)
    except OSError:
        shutil.copy(src, dst)


def build_seg_dataset_layout():
    """Mirror dataset/images -> dataset_seg/images and
    dataset/labels_seg -> dataset_seg/labels so Ultralytics' automatic
    images->labels path substitution finds the segmentation labels."""
    for split in ("train", "val"):
        img_src_dir = DATASET_DIR / "images" / split
        lbl_src_dir = DATASET_DIR / "labels_seg" / split

        for img_path in img_src_dir.glob("*"):
            link_or_copy(img_path, DATASET_SEG_DIR / "images" / split / img_path.name)

        for lbl_path in lbl_src_dir.glob("*.txt"):
            link_or_copy(lbl_path, DATASET_SEG_DIR / "labels" / split / lbl_path.name)

    print(f"Segmentation dataset ready at {DATASET_SEG_DIR}/")


def main():
    build_seg_dataset_layout()

    model = YOLO(MODEL_WEIGHTS)  # loads pretrained COCO weights, fine-tunes on ours
    model.train(
        data="dataset_seg.yaml",
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        patience=20,          # early stop if val mAP plateaus
        project="runs_pcb",
        name="yolov8s_seg_pcb",
        pretrained=True,
        seed=42,
    )
    print("Training complete. Best weights saved under runs_pcb/yolov8s_seg_pcb/weights/best.pt")


if __name__ == "__main__":
    main()
