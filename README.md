# PCB Vision AI — Intelligent PCB Defect Classification & Localization

PCB Vision AI is an end-to-end computer-vision application for automated PCB inspection. It uses a custom YOLO model to detect and localize common printed-circuit-board defects, then estimates repair cost, repair time, and whether repairing the board is economically viable.

## Features

- YOLO-based PCB defect detection and localization
- Supports open circuits, short circuits, mouse bites, missing holes, spurs, and spurious copper
- Confidence scores and bounding-box visualization
- Automated repair-cost estimation
- Repair-time estimation and severity classification
- Repair-vs-replacement viability recommendation
- Inspection history and analytics dashboard
- React/Vite web interface
- FastAPI inference API
- Windows launcher for running the complete application locally

## Architecture

```text
React + Vite frontend
        │
        │ HTTP / JSON + multipart image upload
        ▼
FastAPI backend
        │
        ├── YOLO inference
        ├── Defect classification/localization
        ├── Repair estimation
        └── Inspection history + analytics
```

## Project Structure

```text
PCB-Vision-AI/
├── frontend/                  # React + Vite application
│   ├── src/
│   ├── .env.example
│   └── vercel.json
├── backend/                   # FastAPI + YOLO inference service
│   ├── api/
│   ├── core/
│   ├── inference/
│   ├── models/
│   ├── services/
│   ├── weights/
│   │   └── best.pt
│   ├── app.py
│   ├── requirements.txt
│   └── Procfile
├── launcher/                  # Windows local application launcher
├── .gitignore
└── README.md
```

## Defect Classes

The trained model currently targets:

1. Open circuit
2. Short circuit
3. Mouse bite
4. Missing hole
5. Spur
6. Spurious copper

## Local Development

### Prerequisites

- Python 3.10+ (3.11 recommended)
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

The API will be available at `http://localhost:8000`.

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` if you want to override the API URL. For the default local setup, use:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Start Vite:

```bash
npm run dev
```

The frontend will normally be available at `http://localhost:5173`.

## Windows Launcher

The `launcher/` directory contains the Windows launcher used to start the backend and frontend together. It is intended for local/desktop use and is not required by the web deployment.

## API Endpoints

Base URL:

```text
/api/v1
```

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/inspection/health` | Check backend/model health |
| POST | `/inspection/inspect` | Upload a PCB image and run inference |
| GET | `/inspection/history` | Retrieve inspection history |
| GET | `/inspection/analytics` | Retrieve inspection analytics |

## Deployment

### Frontend — Vercel

The frontend is a Vite application and should be deployed as a Vercel project with `frontend/` as the Root Directory.

Recommended Vercel settings:

```text
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Set this Vercel environment variable:

```text
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api/v1
```

The frontend reads the API URL at build time, so redeploy after changing the variable.

### Backend — Python host

The FastAPI/YOLO service is intentionally kept separate from the Vercel frontend. It performs model inference and uses a local filesystem history store, which is better suited to a persistent Python service than a serverless frontend deployment.

The backend includes a `Procfile` with the production start command:

```text
uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

After deploying the backend, configure its CORS environment variable with the Vercel origin, for example:

```text
BACKEND_CORS_ORIGINS=https://YOUR-PROJECT.vercel.app,http://localhost:5173
```

## Model

The trained YOLO weights are stored in:

```text
backend/weights/best.pt
```

The backend loads this model automatically when the inference service starts.

## Repair Viability

For each detected defect, the backend combines defect type and repair configuration to estimate:

- Defect severity
- Suggested repair action
- Estimated repair cost
- Estimated repair time
- Overall repair/replacement recommendation

These values are estimates intended to support inspection decisions and should be validated against real manufacturing and repair costs.

## Environment Variables

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Public base URL of the FastAPI API, including `/api/v1` |

### Backend

| Variable | Description |
|---|---|
| `BACKEND_CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `MODEL_PATH` | Optional override for the YOLO model path |
| `CONFIDENCE_THRESHOLD` | Detection confidence threshold |
| `IOU_THRESHOLD` | Detection IoU threshold |

Do not commit `.env` files or secrets. Use the hosting provider's environment-variable settings for production values.

## Technology Stack

- React 19
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- FastAPI
- Uvicorn
- Ultralytics YOLO
- OpenCV
- NumPy
- Pydantic
- Python

## License

Add the project's intended license here before publishing the repository publicly.
