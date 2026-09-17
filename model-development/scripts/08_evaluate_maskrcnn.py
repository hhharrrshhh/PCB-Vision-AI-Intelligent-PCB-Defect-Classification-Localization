"""
Evaluate the trained Mask R-CNN model with the standard COCO evaluator
(box + segmentation AP), and compare against the same 90% target used for
YOLOv8-seg so the two models are judged on equal footing.

Run from the project root:
    python scripts/08_evaluate_maskrcnn.py
"""
from pathlib import Path

from detectron2.data import build_detection_test_loader
from detectron2.engine import DefaultPredictor
from detectron2.evaluation import COCOEvaluator, inference_on_dataset

from maskrcnn_common import build_cfg, register_datasets

TARGET_MAP50 = 0.90
WEIGHTS_PATH = "runs_pcb/maskrcnn/model_final.pth"


def main():
    register_datasets()
    cfg = build_cfg()
    cfg.MODEL.WEIGHTS = WEIGHTS_PATH

    predictor = DefaultPredictor(cfg)
    evaluator = COCOEvaluator("pcb_val", output_dir=str(Path(cfg.OUTPUT_DIR) / "eval"))
    val_loader = build_detection_test_loader(cfg, "pcb_val")

    results = inference_on_dataset(predictor.model, val_loader, evaluator)

    seg_ap50 = results["segm"]["AP50"] / 100  # Detectron2 reports 0-100, not 0-1
    box_ap50 = results["bbox"]["AP50"] / 100

    print("\n=== Mask R-CNN results ===")
    print(f"Box  mAP@0.5 : {box_ap50:.4f}")
    print(f"Mask mAP@0.5 : {seg_ap50:.4f}")

    print(f"\nTarget: {TARGET_MAP50:.0%} mAP@0.5")
    status = "MET" if seg_ap50 >= TARGET_MAP50 else "NOT YET MET"
    print(f"Result: {seg_ap50:.2%} -> target {status}")

    print("\nCompare this to scripts/04_evaluate.py's YOLOv8-seg output to "
          "decide which model to carry forward for the demo/deck.")


if __name__ == "__main__":
    main()
