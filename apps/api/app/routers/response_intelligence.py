import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.response_intelligence_service import (
    classify_reply,
    get_routing_action,
    ClassificationResult,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class ClassifyReplyRequest(BaseModel):
    prospectId: str
    sequenceId: str
    replyText: str
    replyFrom: str
    tenantId: str


class ClassifyReplyResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


@router.post("", response_model=ClassifyReplyResponse)
async def classify_reply_endpoint(body: ClassifyReplyRequest):
    """
    Classify an inbound reply with:
    - Layer 1: keyword scan for unsubscribe signals (BEFORE Claude)
    - Layer 2: Claude classification at temperature=0.0
    - Layer 3: Layer 1 always wins

    Returns classification + routing action.
    Caller is responsible for executing the routing action against the DB.
    """
    try:
        result: ClassificationResult = await classify_reply(
            prospect_id=body.prospectId,
            sequence_id=body.sequenceId,
            reply_text=body.replyText,
            reply_from=body.replyFrom,
            tenant_id=body.tenantId,
        )

        routing = get_routing_action(result.classification)

        return ClassifyReplyResponse(
            success=True,
            data={
                "prospectId": body.prospectId,
                "sequenceId": body.sequenceId,
                "classification": result.classification,
                "confidence": result.confidence,
                "reasoning": result.reasoning,
                "suppressedByKeyword": result.suppressed_by_keyword,
                # Dormant queue fields (only populated for FUTURE_DATED_DEFERRAL)
                "extractedReactivationDate": result.extracted_reactivation_date,
                # OOO fields
                "oooReturnDate": result.ooo_return_date,
                # Routing instructions for the caller
                "routing": {
                    "prospectStatus": routing["prospectStatus"],
                    "sequenceAction": routing["sequenceAction"],
                    "notify": routing["notify"],
                    "description": routing["description"],
                },
            },
        )

    except Exception as e:
        logger.error(
            "Reply classification failed for prospect=%s: %s",
            body.prospectId, e, exc_info=True
        )
        return ClassifyReplyResponse(
            success=False,
            error="Reply classification failed. Please try again.",
        )
