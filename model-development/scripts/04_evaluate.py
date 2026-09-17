"""
Evaluate the trained YOLOv8-seg model and report mAP against the 90% target.

Run from the project root:
    python scripts/04_evaluate.py
"""
from ultralytics import YOLO

WEIGHTS_PATH = "runs_pcb/yolov8s_seg_pcb/weights/best.pt"
TARGET_MAP50 = 0.90


def main():
    model = YOLO(WEIGHTS_PATH)
    metrics = model.val(data="dataset_seg.yaml", split="val")

    # Ultralytics reports both box and mask metrics for a -seg model
    box_map50 = metrics.box.map50
    seg_map50 = metrics.seg.map50
    box_map = metrics.box.map      # mAP@0.5:0.95
    seg_map = metrics.seg.map

    print("\n=== Detection (box) metrics ===")
    print(f"mAP@0.5      : {box_map50:.4f}")
    print(f"mAP@0.5:0.95 : {box_map:.4f}")

    print("\n=== Segmentation (mask) metrics ===")
    print(f"mAP@0.5      : {seg_map50:.4f}")
    print(f"mAP@0.5:0.95 : {seg_map:.4f}")

    print("\n=== Per-class mAP@0.5 (segmentation) ===")
    names = model.names
    for cls_id, ap in enumerate(metrics.seg.ap50):
        print(f"  {names[cls_id]:<18} {ap:.4f}")

    print(f"\nTarget: {TARGET_MAP50:.0%} mAP@0.5")
    status = "MET" if seg_map50 >= TARGET_MAP50 else "NOT YET MET"
    print(f"Result: {seg_map50:.2%} -> target {status}")


if __name__ == "__main__":
    main()
