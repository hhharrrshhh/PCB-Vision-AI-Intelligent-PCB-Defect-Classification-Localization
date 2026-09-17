# PCB Vision AI — Intelligent PCB Defect Classification & Localization

> **Automated PCB inspection powered by YOLO, React, and FastAPI.**

PCB Vision AI is an end-to-end computer-vision application designed for automated Printed Circuit Board (PCB) quality control. It detects and localizes common PCB defects, provides detailed repair-cost estimation, and generates automated recommendations on whether a board is economically viable to repair or should be discarded.

---

## 🎓 S3 Lab Work Evaluation

This section explicitly outlines the project's adherence to the S3 evaluation criteria.

## 1. CODEBASE — 10 MARKS

The application follows a strictly decoupled client-server architecture:
- **Frontend (React + Vite):** A responsive Single Page Application (SPA) responsible for user interaction, image upload, interactive visualization (SVG bounding boxes, zooming), and data presentation.
- **Backend (FastAPI):** A stateless REST API responsible for image processing, machine learning inference, and business logic (repair estimations).

**Important Directories & Modules:**
- `backend/api/`: Contains `router.py` and `endpoints.py` to handle HTTP requests and route them to appropriate services.
- `backend/inference/`: Houses `yolo_service.py`, which wraps the Ultralytics YOLO model, handles model loading into memory, and executes predictions.
- `backend/services/`: Contains business logic like `repair_estimator.py` (calculates costs based on defect types) and `history_store.py` (JSON-based persistence).
- `frontend/src/pages/`: Page-level React components (`Results.jsx`, `Dashboard.jsx`, etc.).
- `frontend/src/components/`: Reusable UI primitives (`Primitives.jsx`).

**Inference Pipeline Workflow:**
1. **Upload:** User uploads an image via the frontend `NewInspection.jsx` component.
2. **API Request:** Frontend sends the image as a `multipart/form-data` payload to `/api/v1/inspection/inspect`.
3. **Inference:** The backend decodes the image using OpenCV and passes it to the `YOLOService`. The YOLO model runs inference, producing segmentation/bounding box predictions.
4. **Defect Parsing:** The raw model output is parsed, scaling coordinates and mapping class IDs to normalized class names (e.g., mapping `"short"` to `"short_circuit"`).
5. **Repair Estimation:** The detected defects are fed into the `repair_estimator.py` service, which calculates labor and material costs based on predefined severities in `repair_config.py`.
6. **Persistence & Response:** The result is saved to the local `history.json` store and returned to the frontend as a structured JSON response (validated by Pydantic schemas).
7. **Visualization:** `Results.jsx` dynamically renders an interactive SVG overlay on the original image, displaying numbered markers and defect cards.

**Model Location & Loading:**
The model weights are located at `backend/weights/best.pt`. Upon backend startup, `yolo_service.py` initializes the `YOLO` class with this path, loading the weights into memory once to ensure low-latency inference for subsequent API calls.

## 2. FRAMEWORKS WITH JUSTIFICATION — 10 MARKS

| Technology / Framework | Where it is used | Why it was selected |
|------------------------|------------------|---------------------|
| **React** | Frontend UI | Component-based architecture allows for highly reusable UI elements (e.g., defect cards, dashboards). |
| **Vite** | Frontend Build Tool | Extremely fast Hot Module Replacement (HMR) and optimized production builds. |
| **Tailwind CSS** | Frontend Styling | Utility-first CSS enables rapid, responsive, and consistent UI development without context-switching. |
| **Recharts** | Frontend Analytics | Provides declarative React components to render the inspection analytics charts. |
| **Lucide React** | Frontend Icons | Clean, consistent, and lightweight SVG icons used throughout the interface. |
| **FastAPI** | Backend Web Framework | High performance, automatic OpenAPI documentation, and asynchronous request handling. |
| **Uvicorn** | Backend ASGI Server | Serves the FastAPI application with high concurrency support. |
| **Ultralytics YOLO** | Backend Inference | State-of-the-art object detection/segmentation library with an easy-to-use Python API. |
| **OpenCV (`cv2`)** | Backend Image Processing | Industry-standard library used to efficiently decode multipart image byte streams into NumPy arrays. |
| **NumPy** | Backend Matrix Math | Handles the array representations of images required by the YOLO model. |
| **Pydantic** | Backend Validation | Ensures strict type checking and schema validation for API requests and responses. |
| **Python** | Backend Runtime | The dominant ecosystem for machine learning, AI tooling, and data processing. |

## 3. CODE QUALITY — 10 MARKS

The repository demonstrates several professional software engineering practices:
- **Modular Architecture & Separation of Concerns:** The backend separates API routing (`endpoints.py`), business logic (`services/`), and ML inference (`inference/`). The frontend separates view orchestration (`App.jsx`), pages (`pages/`), and UI building blocks (`components/`).
- **Reusable Frontend Components:** `Primitives.jsx` contains shared UI components like `GlassCard`, `MetricCard`, and `SeverityPill`, ensuring UI consistency and reducing code duplication.
- **API/Service Separation:** Frontend network calls are abstracted into `services/api.js`, centralizing fetch logic, timeouts, and error handling.
- **Configuration Management:** Environment variables (`.env`, `config.py`) manage API URLs, CORS origins, model paths, and detection thresholds.
- **Type/Schema Validation:** Pydantic models (`schemas.py`) define the exact structure of all API responses (e.g., `InferenceResponse`, `RepairAnalysis`), guaranteeing API contract stability.
- **Validation & Error Handling:** The frontend prevents uploading invalid file types/sizes before network transmission. The backend gracefully catches decoding errors and returns descriptive HTTP 400/500 errors.
- **Readable Naming & Structure:** Variables and functions use descriptive names (`estimate_repair`, `build_inspection_record`). The codebase avoids magic strings by using config constants.
- **Smoke Testing:** A dedicated smoke test (`scratch/smoke_test.py`) verifies model loading, class alias mappings, inference shape, and empty-state handling.
- **Maintainability:** Class name mismatches between the YOLO model and the business logic are handled gracefully via a centralized alias map in `yolo_service.py`, avoiding hardcoded hacks throughout the codebase.

## 4. NON-FUNCTIONAL REQUIREMENTS — 10 MARKS

| Requirement | How it is addressed | Evidence / Implementation Detail |
|-------------|---------------------|----------------------------------|
| **Usability** | Clear, interactive visualizations for tiny PCB defects. | `Results.jsx` uses dynamic SVG overlays (numbered markers, leader lines) instead of unreadable inline text on small bounding boxes. |
| **Responsiveness** | UI adapts to desktop, tablet, and mobile displays. | Extensive use of Tailwind CSS responsive prefixes (`md:`, `lg:`) and CSS Grid/Flexbox layouts. |
| **Maintainability** | Clean separation of business logic and inference. | `repair_estimator.py` uses a declarative `DEFECT_COST_TABLE`, making cost/time adjustments trivial without altering inference code. |
| **Error Handling** | Robust handling of network failures and invalid inputs. | `api.js` implements a `withTimeout` wrapper (30s/60s). `endpoints.py` validates image decoding with OpenCV before inference. |
| **Performance** | Model weights are cached in memory to avoid reload overhead. | `yolo_service.py` loads the `YOLO()` instance during the `__init__` phase upon application startup, providing rapid subsequent inference. |
| **Compatibility** | Built on cross-platform technologies. | The frontend architecture supports modern web browsers, and the backend utilizes standard Python/FastAPI which is supported across Windows, Linux, and macOS environments. |

*(Note: Horizontal scalability is currently limited by the use of a local JSON file for history storage. True scalability would require swapping `history_store.py` with a relational database like PostgreSQL.)*

---

## 🚀 Features

- **YOLO-based PCB Defect Localization:** High-accuracy instance segmentation model adapted for object detection.
- **Interactive Visualization:** Dynamic SVG overlays with numbered markers, leader lines, and side-legend defect cards for readability of microscopic defects.
- **Repair Cost & Viability Estimation:** Automated calculation of repair labor and material costs based on defect severity.
- **Actionable Analytics:** Dashboard and history views tracking total inspections, pass/fail ratios, and defect distribution over time.
- **Robust API:** Documented FastAPI backend with Pydantic validation.
- **Windows Launcher:** Included `launcher.py` script for one-click local startup of both frontend and backend.

---

## 🖼️ Workflow & Pipeline

1. **Dashboard:** View overall metrics, recent inspections, and defect trends.
2. **New Inspection:** Drag-and-drop a PCB image for analysis.
3. **Processing:** The frontend polls the backend while YOLO inference executes.
4. **Results:** The original image is displayed alongside SVG bounding boxes. A repair viability analysis determines if the board should be repaired or discarded.
5. **Analytics:** All results are aggregated into the Analytics tab.

---

## 🏗️ Architecture

```text
React + Vite Frontend (SPA)
        │
        │ HTTP / JSON (via services/api.js)
        ▼
FastAPI Backend (app.py)
        │
        ├── 🧠 Inference (yolo_service.py) ─── loads ──▶ backend/weights/best.pt
        │
        ├── 🛠️ Business Logic (repair_estimator.py)
        │
        └── 💾 Storage (history_store.py) ────── reads/writes ──▶ data/history.json
```

---

## 📁 Project Structure

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

---

## 🔍 Defect Classes

The trained model identifies six critical PCB manufacturing defects:

1. **Open Circuit:** A break in a copper trace interrupting the electrical path.
2. **Short Circuit:** Unintended copper bridging two traces that should be isolated.
3. **Mouse Bite:** Small notches eroded into a trace or pad edge.
4. **Missing Hole:** A drilled via or mounting hole is absent.
5. **Spurious Copper:** Unwanted copper residue left on the laminate.
6. **Spur:** A stray copper protrusion branching off an existing trace.

---

## 💻 Local Development

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

## 🖥️ Windows Launcher

For a seamless local desktop experience, run the included Python launcher. It automatically starts both the backend API and the Vite frontend dev server, and opens the application in your default browser.

```powershell
python launcher/launcher.py
```

---

## 🌐 API Endpoints

Base URL: `/api/v1`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/inspection/health` | Check backend/model health and active classes |
| POST | `/inspection/inspect` | Upload a PCB image, run inference, and calculate repair costs |
| GET | `/inspection/history` | Retrieve paginated inspection history |
| GET | `/inspection/analytics` | Retrieve aggregated analytics (pass/fail ratios, trends) |

---

## ☁️ Deployment

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

---

## 🤖 Model Details

- **Type:** Ultralytics YOLO (Segmentation task used for detection)
- **Path:** `backend/weights/best.pt`
- **Normalization:** The model natively predicts `short`, which the `yolo_service.py` elegantly aliases to `short_circuit` to match downstream business logic without requiring model retraining.

---

## 🛠️ Repair Viability Engine

For each defect, the backend evaluates the physical defect type against the `repair_config.py` definitions to estimate:
- **Base Repair Cost & Material Cost** (₹)
- **Repair Time** (minutes)
- **Severity** (Critical, Medium, Low)

The system compares the total estimated repair cost against a defined `REPLACEMENT_COST` to output a recommendation: **REPAIR**, **REPAIR WITH CAUTION**, or **DISCARD PCB**. (Note: ≥2 Critical defects forces an automatic DISCARD recommendation).

---

## 🧪 Testing & Validation

- **Smoke Tests:** A `smoke_test.py` script validates model loading, alias mapping, inference pipeline integrity, and confidence threshold configurations.
- **Frontend Fallbacks:** UI components degrade gracefully (e.g., displaying Empty States) when data is missing or network connectivity drops.

---

## 🔮 Limitations and Future Scope

- **Horizontal Scaling:** The current history store relies on a local JSON file (`data/history.json`), which prevents horizontal scaling of the backend. Future versions should migrate to PostgreSQL/SQLite.
- **Segmentation Masks:** The current YOLO model is a segmentation model, but the application currently utilizes its bounding-box predictions for defect localization. Future UI and backend updates could extract and render precise SVG polygons from the segmentation masks.
- **Authentication:** The application currently lacks user authentication and role-based access control (RBAC).

---

## 📜 License

*(Add intended license here)*
