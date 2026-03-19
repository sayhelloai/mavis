from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.services.enrichment_service import run_enrichment_waterfall, EnrichmentResult

logger = logging.getLogger(__name__)
router = APIRouter()


class EnrichRequest(BaseModel):
    signalId: str
    companyDomain: str
    targetPersonaTitles: List[str]
    tenantId: str
    signalMetadata: Optional[dict] = None
    existingProspects: Optional[List[dict]] = None


class EnrichResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


@router.post("", response_model=EnrichResponse)
async def enrich_prospect(body: EnrichRequest, background_tasks: BackgroundTasks):
    """
    Run the 6-step enrichment waterfall for a signal.

    Steps:
    1. CRM cache (existing Prospect records for same companyDomain)
    2. Extract email from signal metadata
    3. Hunter.io domain search
    4. Snov.io email finder
    5. Clearbit company data
    6. Apollo.io people search (fallback)

    After email found: ZeroBounce verification.
    """
    try:
        result: EnrichmentResult = await run_enrichment_waterfall(
            signal_id=body.signalId,
            company_domain=body.companyDomain,
            target_persona_titles=body.targetPersonaTitles,
            tenant_id=body.tenantId,
            existing_prospects_cache=body.existingProspects,
            signal_metadata=body.signalMetadata,
        )

        if not result.found:
            # Signal stage → FAILED (caller should update DB)
            return EnrichResponse(
                success=False,
                error="Enrichment waterfall exhausted — no verified email found",
                data={
                    "signalId": body.signalId,
                    "stage": "FAILED",
                    "stepsAttempted": result.steps_attempted,
                    "failedAt": result.failed_at,
                },
            )

        return EnrichResponse(
            success=True,
            data={
                "signalId": body.signalId,
                "stage": "ENRICHED",
                "enrichmentSource": result.enrichment_source,
                "stepsAttempted": result.steps_attempted,
                "contact": {
                    "email": result.email,
                    "emailVerified": result.email_verified,
                    "firstName": result.first_name,
                    "lastName": result.last_name,
                    "title": result.title,
                    "linkedinUrl": result.linkedin_url,
                },
                "company": {
                    "revenue": result.company_revenue,
                    "size": result.company_size,
                    "industry": result.company_industry,
                },
            },
        )

    except Exception as e:
        logger.error("Enrichment error for signal %s: %s", body.signalId, e, exc_info=True)
        return EnrichResponse(
            success=False,
            error="Internal enrichment error",
        )
