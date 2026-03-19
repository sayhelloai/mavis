from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import signals, icps, enrichment, email_generation, response_intelligence, hub_search


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="Mavis API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router, prefix="/signals", tags=["signals"])
app.include_router(icps.router, prefix="/icps", tags=["icps"])
app.include_router(enrichment.router, prefix="/enrich", tags=["enrichment"])
app.include_router(email_generation.router, prefix="/generate-sequence", tags=["email"])
app.include_router(response_intelligence.router, prefix="/classify-reply", tags=["intelligence"])
app.include_router(hub_search.router, prefix="/hub", tags=["hub"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mavis-api"}
