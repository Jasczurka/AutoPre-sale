import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.config.database import engine, Base
from app.api.routes import public_router

# Настройка логирования
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events для приложения"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME}...")
    
    # Создаем таблицы (в продакшене лучше использовать миграции)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
    
    logger.info(f"{settings.SERVICE_NAME} started successfully on port {settings.SERVICE_PORT}")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.SERVICE_NAME}...")


# Создаем FastAPI приложение
app = FastAPI(
    title="Template Service API",
    description="Сервис управления шаблонными блоками презентаций",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(public_router)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint для Consul"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.SERVICE_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
