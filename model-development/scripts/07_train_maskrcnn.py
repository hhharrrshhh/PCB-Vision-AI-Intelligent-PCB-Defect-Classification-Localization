"""
Train Mask R-CNN (Detectron2) on the same PCB dataset used for YOLOv8-seg,
so the two can be compared head-to-head.

Run from the project root:
    python scripts/07_train_maskrcnn.py
"""
from detectron2.engine import DefaultTrainer

from maskrcnn_common import OUTPUT_DIR, build_cfg, register_datasets


def main():
    register_datasets()
    cfg = build_cfg()

    trainer = DefaultTrainer(cfg)
    trainer.resume_or_load(resume=False)
    trainer.train()

    print(f"Training complete. Weights saved under {OUTPUT_DIR}/model_final.pth")


if __name__ == "__main__":
    main()
