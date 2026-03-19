from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class IngestSignalRequest(BaseModel):
    source: str
    content: str
    sourceUrl: Optional[str] = None
    companyName: Optional[str] = None
    companyDomain: Optional[str] = None
    tenantId: str


class IngestSignalResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


@router.post("/ingest", response_model=IngestSignalResponse)
async def ingest_signal(body: IngestSignalRequest):
    """Ingest a new signal and trigger ICP scoring."""
    # TODO: Implement in Step 4
    return IngestSignalResponse(
        success=True,
        data={"signalId": "stub", "stage": "RAW"}
    )


@router.post("/{signal_id}/score", response_model=IngestSignalResponse)
async def score_signal(signal_id: str):
    """Score a signal against all tenant ICPs."""
    # TODO: Implement in Step 4
    return IngestSignalResponse(
        success=True,
        data={"signalId": signal_id, "stage": "SCORED", "score": 0}
    )
