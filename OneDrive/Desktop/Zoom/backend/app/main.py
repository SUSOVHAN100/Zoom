import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables are created
    Base.metadata.create_all(bind=engine)
    # Seed the default user (idempotent — safe to run every startup)
    from app.database.seed import seed_db
    seed_db()
    yield


app = FastAPI(
    title="Zoom Clone API",
    description="Backend API for Zoom Clone Video Conferencing Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Allow the deployed frontend URL + localhost for dev
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Zoom Clone API is running"}

# Register API Routers
from app.routers import meetings_router, participants_router, users_router
from app.websocket import websocket_router
app.include_router(meetings_router, prefix="/api/meetings")
app.include_router(participants_router, prefix="/api/participants")
app.include_router(users_router, prefix="/api/users")
app.include_router(websocket_router)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "zoom-clone-backend"}
