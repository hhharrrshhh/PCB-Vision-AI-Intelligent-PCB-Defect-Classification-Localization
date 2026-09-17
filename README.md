# PCB Vision AI

An end-to-end computer-vision application designed for automated Printed Circuit Board (PCB) quality control.

## Overview

PCB Vision AI detects and localizes common PCB defects, provides detailed repair-cost estimation, and generates automated recommendations on whether a board is economically viable to repair or should be discarded. The application pairs a modern, interactive React frontend with a high-performance FastAPI backend that serves a trained YOLO segmentation model.

## Features

- **YOLO-based PCB Defect Localization:** High-accuracy instance segmentation model adapted for object detection.
- **Interactive Visualization:** Dynamic SVG overlays with numbered markers, leader lines, and side-legend defect cards for readability of microscopic defects.
- **Repair Cost & Viability Estimation:** Automated calculation of repair labor and material costs based on defect severity.
- **Actionable Analytics:** Dashboard and history views tracking total inspections, pass/fail ratios, and defect distribution over time.
- **Robust API:** Documented FastAPI backend with Pydantic validation.
- **Windows Launcher:** Included `launcher.py` script for one-click local startup of both frontend and backend.

## Architecture

┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  React Frontend                                             │
│        │                                                    │
│        │ REST API                                           │
│        ▼                                                    │
│  FastAPI Backend                                            │
│        │                                                    │
│        ├── Image Processing                                 │
│        ├── YOLO Inference                                   │
│        ├── Repair Analysis                                  │
│        └── Inspection History                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

## Data & Model Pipeline

┌─────────────────────────────────────────────────────────────┐ 
│                    DATA & MODEL PIPELINE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PKU-PCB / HRIPCB                                           │
│        │                                                    │
│        ▼                                                    │
│  Bounding-Box Annotations                                   │
│        │                                                    │
│        ▼                                                    │
│  SAM → Segmentation Masks                                   │
│        │                                                    │
│        ▼                                                    │
│  Train & Evaluate                                           │
│        │                                                    │
│        ├───────────────┬─────────────────┐                  │
│        ▼               ▼                 │                  │
│   YOLOv8-seg      Mask R-CNN             │                  │
│        │               │                 │                  │
│        └───────────────┴─────────────────┘                  │
│                        │                                    │
│                        ▼                                    │
│                 Model Evaluation                            │
│                        │                                    │
│                        ▼                                    │
│                  Model Registry                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Deployed Model
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│                 Python + FastAPI + Uvicorn                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Image Upload                                               │
│       │                                                     │
│       ▼                                                     │
│  Image Decoding / Preprocessing                             │
│       │                                                     │
│       ▼                                                     │
│  YOLO-based Inference Pipeline                              │
│       │                                                     │
│       ▼                                                     │
│  Post-processing                                            │
│  • Filtering                                                │
│  • Mask Overlay Generation                                  │
│       │                                                     │
│       ▼                                                     │
│  Structured Inspection Result                               │
│       │                                                     │
│       ├── Defect Class                                      │
│       ├── Confidence                                        │
│       ├── Bounding-box Location                             │
│       └── Defect Count                                      │
│       │                                                     │
│       ▼                                                     │
│  Repair Analysis                                            │
│       │                                                     │
│       ├── Repair Time                                       │
│       ├── Labour Cost                                       │
│       ├── Material Cost                                     │
│       ├── Setup Cost                                        │
│       └── Replacement Cost                                  │
│       │                                                     │
│       ▼                                                     │
│  Repair / Discard Decision                                  │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API Response
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              React + Vite + Tailwind CSS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PCB Image Upload                                           │
│       │                                                     │
│       ▼                                                     │
│  Processing / Loading State                                 │
│       │                                                     │
│       ▼                                                     │
│  Inspection Results                                         │
│       │                                                     │
│       ├── Detection Overlays                                │
│       ├── Defect Names                                      │
│       ├── Confidence Scores                                 │
│       ├── Zoomed Defect Regions                             │
│       └── Defect Severity                                   │
│       │                                                     │
│       ▼                                                     │
│  Repair / Discard Recommendation                            │
│       │                                                     │
│       ├── Estimated Cost                                    │
│       ├── Repair Time                                       │
│       └── Repair Guidance                                   │
│       │                                                     │
│       ▼                                                     │
│  Inspection History & Analytics                             │
└─────────────────────────────────────────────────────────────┘

## Model Development

The model development pipeline processes the raw PCB defect dataset and trains multiple models to determine the best candidate for deployment.

1. **Dataset Preparation:** The pipeline utilizes the PKU-PCB / HRIPCB dataset. The script `scripts/01_convert_voc_to_yolo.py` converts the original PASCAL VOC bounding-box annotations into the YOLO detection format and creates training/validation splits.
2. **Segmentation Mask Generation:** Using the Segment Anything Model (SAM), `scripts/02_generate_masks_sam.py` processes the bounding boxes to generate segmentation polygons for the defects.
3. **Training Track A (YOLOv8-seg):** YOLOv8-seg is trained (`scripts/03_train.py`) and evaluated (`scripts/04_evaluate.py`) for its speed and real-time performance.
4. **Training Track B (Mask R-CNN):** The segmentation labels are converted to COCO JSON format (`scripts/06_convert_yolo_to_coco.py`) to train a Mask R-CNN model (`scripts/07_train_maskrcnn.py` and `scripts/08_evaluate_maskrcnn.py`).
5. **Evaluation:** Both model tracks are evaluated during the development process, and the resulting model artifacts are used to identify a suitable candidate for application deployment. The chosen model's inference logic is built into a standard JSON output contract that serves the backend API.
6. **Cost Logic Integration:** Scripts such as `scripts/11_estimate_repair_cost.py` and `scripts/cost_estimation.py` prototype the repair-cost estimation and repair/discard decision logic before integration into the backend service.

## Model Details

- **Deployed Model:** Ultralytics YOLO (Segmentation model).
- **Current Application Behavior:** The application currently relies on the model's bounding-box predictions for defect localization. The frontend draws interactive bounding boxes (SVG) around detected defects based on the API response.
- **Normalization:** The model natively predicts `short`, which the `yolo_service.py` component gracefully aliases to `short_circuit` to match downstream business logic without requiring model retraining.
- **Persistence:** Model weights (`best.pt`) are loaded into memory once on backend startup by `yolo_service.py` to ensure low-latency inference.

## Defect Classes

The trained model identifies six critical PCB manufacturing defects:

1. **Open Circuit:** A break in a copper trace interrupting the electrical path.
2. **Short Circuit:** Unintended copper bridging two traces that should be isolated.
3. **Mouse Bite:** Small notches eroded into a trace or pad edge.
4. **Missing Hole:** A drilled via or mounting hole is absent.
5. **Spurious Copper:** Unwanted copper residue left on the laminate.
6. **Spur:** A stray copper protrusion branching off an existing trace.

## Repair Analysis and Cost Estimation

For each detected defect, the backend evaluates the physical defect type against predefined definitions (`repair_config.py`) to estimate:
- **Base Repair Cost & Material Cost** (₹)
- **Repair Time** (minutes)
- **Severity** (Critical, Medium, Low)

The system compares the total estimated repair cost against a configurable `REPLACEMENT_COST` to output a recommendation: **REPAIR**, **REPAIR WITH CAUTION**, or **DISCARD PCB**. Multiple critical defects can also automatically trigger a DISCARD recommendation.

## Frameworks and Technology Choices

- **React:** Component-based frontend architecture allows for highly reusable UI elements (e.g., defect cards, dashboards).
- **Vite:** Frontend build tool offering fast Hot Module Replacement (HMR) and optimized production builds.
- **Tailwind CSS:** Utility-first CSS enables rapid, responsive, and consistent UI development.
- **Recharts:** Provides declarative React components to render the inspection analytics charts.
- **Lucide React:** Clean, consistent, and lightweight SVG icons used throughout the interface.
- **FastAPI:** High-performance backend web framework with automatic OpenAPI documentation and asynchronous request handling.
- **Uvicorn:** ASGI Server that serves the FastAPI application with high concurrency support.
- **Ultralytics YOLO:** State-of-the-art object detection and segmentation library handling the core model inference.
- **OpenCV (`cv2`):** Industry-standard library used to efficiently decode multipart image byte streams into NumPy arrays.
- **NumPy:** Handles the array representations of images required for YOLO model inference.
- **Pydantic:** Ensures strict type checking and schema validation for API requests and responses.
- **Python:** The runtime for the backend, offering a strong ecosystem for machine learning and data processing.

## Code Quality and Maintainability

- **Modular Architecture & Separation of Concerns:** The backend cleanly separates API routing (`endpoints.py`), business logic (`services/`), and ML inference (`inference/`). The frontend separates view orchestration (`App.jsx`), pages (`pages/`), and UI building blocks (`components/`).
- **Reusable Frontend Components:** Shared UI components (like `GlassCard`, `MetricCard`, and `SeverityPill` in `Primitives.jsx`) ensure UI consistency and reduce code duplication.
- **API/Service Separation:** Frontend network calls are abstracted into `services/api.js`, centralizing fetch logic, timeouts, and error handling.
- **Configuration Management:** Environment variables (`.env`, `config.py`) cleanly manage API URLs, CORS origins, model paths, and detection thresholds without hardcoded secrets.
- **Type/Schema Validation:** Pydantic models (`schemas.py`) strictly define the shape of API responses, guaranteeing API contract stability between the backend and frontend.
- **Error Handling:** The frontend prevents uploading invalid file types or sizes before network transmission. The backend catches decoding errors and returns descriptive HTTP 400/500 errors.
- **Maintainability:** Discrepancies like class name mismatches between the YOLO model outputs and the backend business logic are handled gracefully via a centralized alias map, avoiding scattered hardcoded hacks.
- **Smoke Testing:** A dedicated smoke test (`scratch/smoke_test.py`) verifies model loading, class mappings, inference logic, and empty-state handling to ensure robust deployment updates.

## Non-Functional Requirements

- **Usability:** The UI provides clear, interactive visualizations (e.g., numbered markers, leader lines) for tiny PCB defects rather than unreadable inline text, greatly enhancing readability.
- **Responsiveness:** The interface adapts gracefully to desktop, tablet, and mobile displays via extensive use of CSS Grid/Flexbox layouts and responsive classes.
- **Maintainability:** Clean separation of business logic and inference ensures that adjusting repair cost logic (`DEFECT_COST_TABLE`) does not require altering the inference code.
- **Error Handling:** Robust handling of network failures is implemented, such as request timeouts in the frontend network wrapper and input validation on the backend API.
- **Performance:** Model weights are cached in memory during application startup to avoid reload overhead, providing fast subsequent API responses.
- **Compatibility:** Built on cross-platform web technologies and standard Python/FastAPI, supporting execution across Windows, Linux, and macOS environments.
- **Scalability Limitations:** Horizontal scalability is currently limited by the use of a local JSON file (`data/history.json`) for persistence. True scalability across multiple instances would require migrating to a relational database like PostgreSQL.

## Project Structure

```text
PCB-Vision-AI/
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── components/        # Reusable UI primitives (GlassCard, etc.)
│   │   ├── pages/             # Route-level components (Results, Dashboard)
│   │   └── services/          # API fetch wrappers
│   ├── .env.example
│   └── package.json
├── backend/                   # FastAPI + YOLO inference service
│   ├── api/                   # Router and endpoints
│   ├── core/                  # Configuration (config.py)
│   ├── inference/             # YOLO wrapper and alias mapping
│   ├── models/                # Pydantic schemas
│   ├── services/              # Repair estimation and history persistence
│   ├── weights/
│   │   └── best.pt            # Primary YOLO segmentation model
│   ├── app.py                 # FastAPI entry point
│   └── requirements.txt
├── launcher/                  # Windows local application launcher
└── README.md
```

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/hhharrrshhh/PCB-Vision-AI-Intelligent-PCB-Defect-Classification-Localization.git
cd PCB-Vision-AI-Intelligent-PCB-Defect-Classification-Localization
```

### 2. Set up the backend

```bash
python -m venv .venv
```

Windows:
```powershell
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

Start FastAPI:
```bash
uvicorn backend.app:app --reload --port 8000
```
The API documentation (Swagger) is available at `http://localhost:8000/docs`.

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` if you want to override the API URL. The default works out-of-the-box:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

Start Vite:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

### Windows Launcher

For a seamless local desktop experience, run the included Python launcher. It automatically starts both the backend API and the Vite frontend dev server, and opens the application in your default browser.

```powershell
python launcher/launcher.py
```

## API Endpoints

Base URL: `/api/v1`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/inspection/health` | Check backend/model health and active classes |
| POST | `/inspection/inspect` | Upload a PCB image, run inference, and calculate repair costs |
| GET | `/inspection/history` | Retrieve paginated inspection history |
| GET | `/inspection/analytics` | Retrieve aggregated analytics (pass/fail ratios, trends) |

## Deployment

### Frontend — Vercel

The frontend should be deployed as a Vercel project with `frontend/` as the Root Directory.

**Vercel Settings:**
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api/v1`

### Backend — Python Host (e.g., Render, Railway)

The backend is intentionally separated to support local persistence (history.json) and ML inference overhead.
**Start Command:**
```bash
uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```
Set the `BACKEND_CORS_ORIGINS` environment variable to your Vercel deployment URL to allow cross-origin requests.

## Testing & Validation

- **Smoke Tests:** A `smoke_test.py` script validates model loading, alias mapping, inference pipeline integrity, and confidence threshold configurations.
- **Frontend Fallbacks:** UI components degrade gracefully (e.g., displaying Empty States) when data is missing or network connectivity drops.

## Limitations and Future Scope

- **Horizontal Scaling:** The current history store relies on a local JSON file (`data/history.json`), which prevents horizontal scaling of the backend. Future versions should migrate to PostgreSQL/SQLite.
- **Segmentation Masks:** The current YOLO model is a segmentation model, but the application currently utilizes its bounding-box predictions for defect localization. Future UI and backend updates could extract and render precise SVG polygons from the segmentation masks.
- **Authentication:** The application currently lacks user authentication and role-based access control (RBAC).

## License

*(Add intended license here)*
