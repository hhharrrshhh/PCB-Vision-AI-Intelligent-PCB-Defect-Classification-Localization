"""
Run inference on one image or a folder of images, and estimate repair/
scrap cost per board based on detected defects (INR). Uses labor-time
based estimates in cost_estimation.py -- edit DEFECT_REWORK_PROFILE and
ASSUMED_HOURLY_WAGE_INR there to match real shop rates.

Run from the project root:
    python scripts/11_estimate_repair_cost.py --source path/to/image_or_folder
    python scripts/11_estimate_repair_cost.py --source dataset_seg/images/val
"""
import argparse
import json
from pathlib import Path

from inference_common import run_inference
from cost_estimation import estimate_cost

IMG_EXTS = {".jpg", ".jpeg", ".png"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Image file or folder of images")
    parser.add_argument("--out", default="deck_assets/repair_cost_report.json")
    args = parser.parse_args()

    source = Path(args.source)
    if source.is_dir():
        images = sorted(p for p in source.iterdir() if p.suffix.lower() in IMG_EXTS)
    else:
        images = [source]

    if not images:
        raise SystemExit(f"No images found at {source}")

    per_image = []
    grand_total = 0.0
    for img_path in images:
        defects = run_inference(str(img_path))
        cost = estimate_cost(defects)
        per_image.append({"image": img_path.name, **cost})
        grand_total += cost["total_estimated_cost"]

        print(f"\n{img_path.name}")
        print(f"  Defects: {cost['defect_counts']}")
        print(f"  Status: {cost['board_status']}")
        if cost['scrap_reason']:
            print(f"  Reason: {cost['scrap_reason']}")
        print(f"  Estimated cost: Rs. {cost['total_estimated_cost']:.2f}")
        if "warning" in cost:
            print(f"  WARNING: {cost['warning']}")

    print(f"\n=== Total across {len(images)} board(s): Rs. {grand_total:.2f} ===")
    print("NOTE: cost model is a labor-time estimate, not sourced market pricing.")
    print("      See cost_estimation.py module docstring for methodology and assumptions.")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({
        "per_image": per_image,
        "grand_total_estimated_cost_inr": round(grand_total, 2),
        "note": "Labor-time based estimate — see cost_estimation.py module docstring.",
    }, indent=2))
    print(f"\nWrote report -> {out_path}")


if __name__ == "__main__":
    main()
