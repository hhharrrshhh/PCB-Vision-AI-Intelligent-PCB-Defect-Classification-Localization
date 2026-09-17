# PCB Defect Classification + Segmentation — Person 1 (Data & Model)

Pipeline: PKU-PCB / HRIPCB (bounding boxes) → SAM-generated masks →
train + compare **two** segmentation models (YOLOv8-seg and Mask R-CNN) →
evaluate against a 90%+ mAP@0.5 target → pick one for the app.

## 1. Get the dataset

Download PKU-PCB / HRIPCB (a.k.a. "PCB-DATASET"), e.g. from Kaggle
("akhatova/pcb-defects") or the original PKU robotics lab mirror. Expected raw
layout (PASCAL VOC style, one subfolder per defect class):

```
raw_data/
  images/
    Missing_hole/*.jpg
    Mouse_bite/*.jpg
    Open_circuit/*.jpg
    Short/*.jpg
    Spur/*.jpg
    Spurious_copper/*.jpg
  Annotations/
    Missing_hole/*.xml
    Mouse_bite/*.xml
    Open_circuit/*.xml
    Short/*.xml
    Spur/*.xml
    Spurious_copper/*.xml
```

If your download has a different folder layout, adjust `RAW_IMAGES_DIR` /
`RAW_ANNOTATIONS_DIR` at the top of `scripts/01_convert_voc_to_yolo.py`.

## 2. Shared pipeline steps (both models use this data)

```bash
pip install -r requirements.txt

# Step 1: VOC XML boxes -> YOLO detection format + train/val split
python scripts/01_convert_voc_to_yolo.py

# Step 2: download a SAM checkpoint once (vit_b is the fastest/smallest)
#   https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth
# Step 3: turn each YOLO box into a pixel-accurate segmentation polygon
python scripts/02_generate_masks_sam.py --checkpoint sam_vit_b_01ec64.pth
```

## 3. Track A — YOLOv8-seg (fast, simplest to train)

```bash
python scripts/03_train.py       # builds dataset_seg/ layout + trains
python scripts/04_evaluate.py    # reports mAP@0.5 vs the 90% target
python scripts/05_infer.py --source path/to/test_image.jpg
```

## 4. Track B — Mask R-CNN / Detectron2 (typically stronger on small/irregular masks)

Detectron2 isn't a normal pip package — install it separately first (see
`requirements.txt` for the command). Then:

```bash
# Step 6: convert the same segmentation labels into COCO JSON (Detectron2's format)
python scripts/06_convert_yolo_to_coco.py

python scripts/07_train_maskrcnn.py    # trains Mask R-CNN, COCO-pretrained
python scripts/08_evaluate_maskrcnn.py # reports mAP@0.5 vs the 90% target
```

## 5. Comparing the two and picking one

Run both evaluation scripts and put the numbers side by side:

| | mAP@0.5 (mask) | Speed |
|---|---|---|
| YOLOv8-seg | from `04_evaluate.py` | fast, real-time |
| Mask R-CNN | from `08_evaluate.py` | slower, typically more precise on tiny defects |

Both should comfortably clear 90% on this dataset — TDD-Net's own ablation
shows a plain Faster R-CNN baseline (no special tricks) already hits 94.27%
mAP@0.5 on PKU-PCB. Use whichever wins on your accuracy/speed trade-off as
the model that ships in the app — this comparison is also a legitimate
"frameworks with justification" writeup for the deck/report.

## 6. Generating assets for the S2 deck

```bash
python scripts/10_generate_deck_assets.py
```

Writes to `deck_assets/`:
- `model_comparison_chart.png` — bar chart of mAP@0.5 vs. the 90% target
- `per_class_ap_chart.png` — per-class AP breakdown
- `sample_prediction_*.jpg` — annotated validation images (numbered markers
  + zoomed-crop legend, from `09_visualize.py`) — paste straight into a
  "sample results" slide
- `metrics_summary.json` / `metrics_summary.md` — numbers in both
  machine-readable and copy-paste-into-slide-text form

If you've also trained Mask R-CNN, add its metrics dict to the `results`
list near the top of `main()` in this script (Detectron2's evaluator output
format differs enough from Ultralytics' that auto-merging wasn't worth the
complexity) — then the comparison chart will show both models.

**Also grab these for free** — Ultralytics auto-saves them during training,
no extra script needed:
`runs_pcb/yolov8s_seg_pcb/results.png` (loss/mAP curves over epochs),
`confusion_matrix.png`, `PR_curve.png`, `val_batch*.jpg`.

## Output contract for Person 2 (Backend)

Whichever model you keep, wrap its inference in a function matching this
shape (see `scripts/05_infer.py::run_inference` for the YOLOv8-seg version):

```json
{
  "class": "spurious_copper",
  "confidence": 0.94,
  "bbox": [x1, y1, x2, y2],
  "mask_polygon": [[x1, y1], [x2, y2], ...]
}
```
This is the contract to hand off — Person 2 should build the API response
schema around this shape regardless of which model is behind it.
