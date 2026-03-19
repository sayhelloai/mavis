import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.email_generation_service import (
    generate_email_sequence,
    ProspectContext,
    GeneratedSequence,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class GenerateSequenceRequest(BaseModel):
    prospectId: str
    icpId: str
    tenantId: str
    # Prospect details (would normally be fetched from DB; passed here for flexibility)
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    title: Optional[str] = None
    companyName: str
    companyDomain: str
    companyIndustry: Optional[str] = None
    companyRevenue: Optional[int] = None
    companySize: Optional[int] = None
    # Signal context
    signalContent: Optional[str] = None
    signalSource: Optional[str] = None
    # Optional instruction for regeneration
    regenerationInstruction: Optional[str] = None


class GenerateSequenceResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


@router.post("", response_model=GenerateSequenceResponse)
async def generate_sequence(body: GenerateSequenceRequest):
    """
    Generate a 3-touch email sequence for a prospect using Claude + Qdrant RAG.

    Returns the sequence with status PENDING_REVIEW.
    The sequence must be approved via the Sequences UI before sending.
    """
    try:
        prospect = ProspectContext(
            prospect_id=body.prospectId,
            icp_id=body.icpId,
            tenant_id=body.tenantId,
            first_name=body.firstName,
            last_name=body.lastName,
            email=body.email,
            title=body.title,
            company_name=body.companyName,
            company_domain=body.companyDomain,
            company_industry=body.companyIndustry,
            company_revenue=body.companyRevenue,
            company_size=body.companySize,
            signal_content=body.signalContent,
            signal_source=body.signalSource,
        )

        # If regeneration instruction provided, append to signal context
        if body.regenerationInstruction:
            prospect.signal_content = (
                f"{prospect.signal_content or ''}\n\n"
                f"[REGENERATION INSTRUCTION: {body.regenerationInstruction}]"
            )

        sequence: GeneratedSequence = await generate_email_sequence(prospect)

        return GenerateSequenceResponse(
            success=True,
            data={
                "prospectId": body.prospectId,
                "tenantId": body.tenantId,
                "status": "PENDING_REVIEW",
                "sequence": {
                    "touch1": {
                        "touchNumber": 1,
                        "subject": sequence.touch1.subject,
                        "body": sequence.touch1.body,
                        "variant": "A",
                    },
                    "touch2": {
                        "touchNumber": 2,
                        "subject": sequence.touch2.subject,
                        "body": sequence.touch2.body,
                        "variant": "A",
                    },
                    "touch3": {
                        "touchNumber": 3,
                        "subject": sequence.touch3.subject,
                        "body": sequence.touch3.body,
                        "variant": "A",
                    },
                },
            },
        )

    except ValueError as e:
        logger.error("Email generation value error for prospect %s: %s", body.prospectId, e)
        return GenerateSequenceResponse(
            success=False,
            error=str(e),
        )
    except Exception as e:
        logger.error("Email generation failed for prospect %s: %s", body.prospectId, e, exc_info=True)
        return GenerateSequenceResponse(
            success=False,
            error="Email generation failed. Please try again.",
        )
