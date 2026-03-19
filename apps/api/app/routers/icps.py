from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

from app.services.icp_service import compute_icp_quality_score, get_activation_decision

router = APIRouter()


class ICPRequest(BaseModel):
    tenantId: str
    name: str
    industries: List[str] = []
    revenueMin: Optional[int] = None
    revenueMax: Optional[int] = None
    geographies: List[str] = []
    personaTitles: List[str] = []
    keywords: List[str] = []
    scoreThreshold: int = 65


class ICPResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


def _compute_and_respond(body: ICPRequest, icp_id: Optional[str] = None) -> ICPResponse:
    score, warnings = compute_icp_quality_score(
        industries=body.industries,
        revenue_min=body.revenueMin,
        revenue_max=body.revenueMax,
        geographies=body.geographies,
        persona_titles=body.personaTitles,
        keywords=body.keywords,
    )
    activation = get_activation_decision(score)

    return ICPResponse(
        success=True,
        data={
            "icpId": icp_id or "new",
            "qualityScore": score,
            "warnings": warnings,
            "canActivate": activation["canActivate"],
            "requiresAcknowledgement": activation["requiresAcknowledgement"],
            "blockReason": activation["blockReason"],
        }
    )


@router.post("", response_model=ICPResponse)
async def create_icp(body: ICPRequest):
    """Create an ICP with quality score computation."""
    return _compute_and_respond(body)


@router.put("/{icp_id}", response_model=ICPResponse)
async def update_icp(icp_id: str, body: ICPRequest):
    """Update an ICP and recompute quality score."""
    return _compute_and_respond(body, icp_id)


@router.get("/{icp_id}/preview", response_model=ICPResponse)
async def preview_icp(icp_id: str):
    """Preview estimated signal volume for an ICP."""
    # TODO: Implement real signal volume estimation based on historical data
    return ICPResponse(
        success=True,
        data={"icpId": icp_id, "estimatedMonthlySignals": 0, "message": "Estimation requires historical signal data"}
    )
