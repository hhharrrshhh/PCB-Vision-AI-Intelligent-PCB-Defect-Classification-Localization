"""
Shared Detectron2/Mask R-CNN setup used by both 07_train_maskrcnn.py and
08_evaluate_maskrcnn.py. Kept in its own file because Python module names
can't start with a digit, so scripts can't import directly from each other.
"""
from pathlib import Path

from detectron2 import model_zoo
from detectron2.config import get_cfg
from detectron2.data.datasets import register_coco_instances

DATASET_SEG_DIR = Path("dataset_seg")
COCO_DIR = Path("dataset_coco")
OUTPUT_DIR = Path("runs_pcb/maskrcnn")

CLASSES = [
    "missing_hole",
    "mouse_bite",
    "open_circuit",
    "short",
    "spur",
    "spurious_copper",
]

MAX_ITER = 5000            # ~ a few dozen epochs depending on dataset size
BASE_LR = 0.00025
BATCH_SIZE = 4              # keep modest — Mask R-CNN is heavier than YOLOv8-seg


def register_datasets():
    register_coco_instances(
        "pcb_train", {}, str(COCO_DIR / "train.json"), str(DATASET_SEG_DIR / "images" / "train")
    )
    register_coco_instances(
        "pcb_val", {}, str(COCO_DIR / "val.json"), str(DATASET_SEG_DIR / "images" / "val")
    )


def build_cfg():
    cfg = get_cfg()
    cfg.merge_from_file(model_zoo.get_config_file(
        "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
    ))
    cfg.DATASETS.TRAIN = ("pcb_train",)
    cfg.DATASETS.TEST = ("pcb_val",)
    cfg.DATALOADER.NUM_WORKERS = 2

    cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(
        "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
    )  # start from COCO-pretrained weights, fine-tune on PCB defects
    cfg.MODEL.ROI_HEADS.NUM_CLASSES = len(CLASSES)
    cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5

    cfg.SOLVER.IMS_PER_BATCH = BATCH_SIZE
    cfg.SOLVER.BASE_LR = BASE_LR
    cfg.SOLVER.MAX_ITER = MAX_ITER
    cfg.SOLVER.STEPS = (int(MAX_ITER * 0.7), int(MAX_ITER * 0.9))  # LR decay schedule
    cfg.SOLVER.CHECKPOINT_PERIOD = 1000

    cfg.OUTPUT_DIR = str(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return cfg
