"""Main application entry point"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config.settings import settings
from app.config.database import engine, Base
from app.api.routes import router
from app.application.dtos import HealthResponse

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the application"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME}...")
    
    # Create tables (in production, use Alembic migrations)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
    
    logger.info(f"{settings.SERVICE_NAME} started successfully on port {settings.SERVICE_PORT}")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.SERVICE_NAME}...")


# Create FastAPI application
app = FastAPI(
    title="Presentation Builder Service API",
    description="Service for creating and building presentations from semantic blocks",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify concrete origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)


@app.get("/health", tags=["Health"], response_model=HealthResponse)
async def health_check():
    """Health check endpoint for Consul and monitoring"""
    return HealthResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        timestamp=datetime.utcnow()
    )


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "version": "1.0.0",
        "status": "running",
        "description": "Presentation Builder Service - PPTX generation and manipulation"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.SERVICE_HOST,
        port=settings.SERVICE_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
