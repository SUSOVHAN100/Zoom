from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables are created
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Zoom Clone API",
    description="Backend API for Zoom Clone Video Conferencing Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Zoom Clone API is running"}

# Register API Routers
from app.routers import meetings_router, participants_router
from app.websocket import websocket_router
app.include_router(meetings_router, prefix="/api/meetings")
app.include_router(participants_router, prefix="/api/participants")
app.include_router(websocket_router)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "zoom-clone-backend"}
