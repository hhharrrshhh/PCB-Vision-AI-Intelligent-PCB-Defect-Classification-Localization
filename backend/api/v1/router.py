# backend/api/v1/router.py

from fastapi import APIRouter
from backend.api.v1.endpoints import router as inspection_router

api_router = APIRouter()
api_router.include_router(inspection_router, prefix="/inspection", tags=["PCB Inspection"])