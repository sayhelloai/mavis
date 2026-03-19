"""
Enrichment waterfall service — 6 steps to find a verified email for a prospect.

Step 1: CRM cache (existing Prospect records for same companyDomain)
Step 2: Extract email from signal metadata
Step 3: Hunter.io domain search API
Step 4: Snov.io email finder API
Step 5: Clearbit company data (no email, just enriches company fields)
Step 6: Apollo.io people search API (fallback)

After email found: ZeroBounce verification.
Hard bounce or no email found → signal.stage = FAILED.
Email found and verified → create Prospect record.
"""

import httpx
import logging
import re
from typing import Optional
from dataclasses import dataclass, field

from app.config import settings

logger = logging.getLogger(__name__)

TIMEOUT = 10.0  # seconds per API call


@dataclass
class EnrichmentResult:
    found: bool = False
    email: Optional[str] = None
    email_verified: bool = False
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    linkedin_url: Optional[str] = None
    company_revenue: Optional[int] = None  # USD millions
    company_size: Optional[int] = None     # headcount
    company_industry: Optional[str] = None
    enrichment_source: Optional[str] = None
    failed_at: Optional[str] = None
    steps_attempted: list = field(default_factory=list)


async def run_enrichment_waterfall(
    signal_id: str,
    company_domain: str,
    target_persona_titles: list[str],
    tenant_id: str,
    existing_prospects_cache: Optional[list[dict]] = None,
    signal_metadata: Optional[dict] = None,
) -> EnrichmentResult:
    """
    Run the full enrichment waterfall. Returns an EnrichmentResult.
    Steps execute in order; stops when a verified email is found.
    """
    result = EnrichmentResult()

    # ── Step 1: CRM cache ────────────────────────────────────────────────────
    result.steps_attempted.append("crm_cache")
    cached = await _step1_crm_cache(
        company_domain=company_domain,
        tenant_id=tenant_id,
        existing_prospects=existing_prospects_cache or [],
    )
    if cached and cached.get("email"):
        _apply_cached(result, cached)
        if await _verify_email(result.email):
            result.found = True
            result.email_verified = True
            result.enrichment_source = "crm_cache"
            return result

    # ── Step 2: Signal metadata extraction ──────────────────────────────────
    result.steps_attempted.append("signal_metadata")
    if signal_metadata:
        extracted = _step2_extract_from_metadata(signal_metadata)
        if extracted:
            result.email = extracted
            if await _verify_email(result.email):
                result.found = True
                result.email_verified = True
                result.enrichment_source = "signal_metadata"
                return result

    # ── Step 3: Hunter.io ────────────────────────────────────────────────────
    result.steps_attempted.append("hunter_io")
    if settings.hunter_api_key:
        hunter_result = await _step3_hunter_io(company_domain, target_persona_titles)
        if hunter_result:
            _apply_hunter(result, hunter_result)
            if await _verify_email(result.email):
                result.found = True
                result.email_verified = True
                result.enrichment_source = "hunter_io"
                return result

    # ── Step 4: Snov.io ──────────────────────────────────────────────────────
    result.steps_attempted.append("snov_io")
    if settings.snov_api_key:
        snov_result = await _step4_snov_io(company_domain, target_persona_titles)
        if snov_result:
            _apply_snov(result, snov_result)
            if await _verify_email(result.email):
                result.found = True
                result.email_verified = True
                result.enrichment_source = "snov_io"
                return result

    # ── Step 5: Clearbit (company data only, no email) ───────────────────────
    result.steps_attempted.append("clearbit")
    if settings.clearbit_api_key:
        clearbit_data = await _step5_clearbit(company_domain)
        if clearbit_data:
            # Enrich company fields only — no email from Clearbit
            result.company_revenue = clearbit_data.get("metrics", {}).get("annualRevenue")
            if result.company_revenue:
                result.company_revenue = result.company_revenue // 1_000_000  # to USD millions
            result.company_size = clearbit_data.get("metrics", {}).get("employees")
            result.company_industry = clearbit_data.get("category", {}).get("industry")

    # ── Step 6: Apollo.io ────────────────────────────────────────────────────
    result.steps_attempted.append("apollo_io")
    if settings.apollo_api_key:
        apollo_result = await _step6_apollo_io(company_domain, target_persona_titles)
        if apollo_result:
            _apply_apollo(result, apollo_result)
            if await _verify_email(result.email):
                result.found = True
                result.email_verified = True
                result.enrichment_source = "apollo_io"
                return result

    # ── All steps exhausted ──────────────────────────────────────────────────
    result.found = False
    result.failed_at = result.steps_attempted[-1] if result.steps_attempted else "none"
    logger.warning(
        "Enrichment failed for domain=%s signal=%s steps=%s",
        company_domain, signal_id, result.steps_attempted
    )
    return result


# ── Step implementations ─────────────────────────────────────────────────────

async def _step1_crm_cache(
    company_domain: str,
    tenant_id: str,
    existing_prospects: list[dict],
) -> Optional[dict]:
    """Check existing Prospect records for the same companyDomain within this tenant."""
    for p in existing_prospects:
        if (
            p.get("tenantId") == tenant_id
            and p.get("companyDomain") == company_domain
            and p.get("email")
            and p.get("emailVerified")
        ):
            return p
    return None


def _step2_extract_from_metadata(signal_metadata: dict) -> Optional[str]:
    """Attempt to extract an email address from signal text/metadata."""
    text = signal_metadata.get("content", "") or signal_metadata.get("sourceUrl", "") or ""
    email_pattern = r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    matches = re.findall(email_pattern, text)
    # Filter out common no-reply / noreply addresses
    filtered = [m for m in matches if not any(x in m.lower() for x in ["noreply", "no-reply", "donotreply", "notifications", "mailer-daemon"])]
    return filtered[0] if filtered else None


async def _step3_hunter_io(company_domain: str, titles: list[str]) -> Optional[dict]:
    """Search Hunter.io domain search API for a matching contact."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            params = {
                "domain": company_domain,
                "api_key": settings.hunter_api_key,
                "limit": 10,
                "type": "personal",
            }
            resp = await client.get("https://api.hunter.io/v2/domain-search", params=params)
            resp.raise_for_status()
            data = resp.json()

        emails = data.get("data", {}).get("emails", [])
        if not emails:
            return None

        # Find best match by title relevance
        best = _rank_by_title(emails, titles, name_key="first_name", email_key="value")
        if not best:
            return None

        return {
            "email": best.get("value"),
            "first_name": best.get("first_name"),
            "last_name": best.get("last_name"),
            "title": best.get("position"),
            "linkedin_url": best.get("linkedin"),
        }
    except httpx.HTTPStatusError as e:
        logger.warning("Hunter.io HTTP error: %s", e)
        return None
    except Exception as e:
        logger.warning("Hunter.io error: %s", e)
        return None


async def _step4_snov_io(company_domain: str, titles: list[str]) -> Optional[dict]:
    """Search Snov.io email finder API."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            # Get access token
            token_resp = await client.post(
                "https://api.snov.io/v1/oauth/access_token",
                json={
                    "grant_type": "client_credentials",
                    "client_id": settings.snov_api_key,
                    "client_secret": settings.snov_api_key,
                },
            )
            if token_resp.status_code != 200:
                return None

            token = token_resp.json().get("access_token")
            if not token:
                return None

            # Domain search
            search_resp = await client.post(
                "https://api.snov.io/v2/domain-emails-with-info",
                json={
                    "domain": company_domain,
                    "type": "all",
                    "limit": 10,
                    "lastId": 0,
                    "positions": titles[:5],  # filter by titles
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            if search_resp.status_code != 200:
                return None

            results = search_resp.json().get("emails", [])
            if not results:
                return None

            best = results[0]
            return {
                "email": best.get("email"),
                "first_name": best.get("firstName"),
                "last_name": best.get("lastName"),
                "title": best.get("position"),
                "linkedin_url": best.get("linkedIn"),
            }
    except Exception as e:
        logger.warning("Snov.io error: %s", e)
        return None


async def _step5_clearbit(company_domain: str) -> Optional[dict]:
    """Get company enrichment data from Clearbit."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                f"https://company.clearbit.com/v2/companies/find",
                params={"domain": company_domain},
                headers={"Authorization": f"Bearer {settings.clearbit_api_key}"},
            )
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.warning("Clearbit error: %s", e)
        return None


async def _step6_apollo_io(company_domain: str, titles: list[str]) -> Optional[dict]:
    """Search Apollo.io people search API as fallback."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(
                "https://api.apollo.io/v1/mixed_people/search",
                json={
                    "api_key": settings.apollo_api_key,
                    "q_organization_domains": company_domain,
                    "person_titles": titles[:5],
                    "page": 1,
                    "per_page": 5,
                    "email_status": ["verified"],
                },
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        people = data.get("people", [])
        if not people:
            return None

        best = _rank_by_title(people, titles, name_key="first_name", email_key="email")
        if not best or not best.get("email"):
            return None

        return {
            "email": best.get("email"),
            "first_name": best.get("first_name"),
            "last_name": best.get("last_name"),
            "title": best.get("title"),
            "linkedin_url": best.get("linkedin_url"),
            "company_revenue": _parse_revenue(best.get("organization", {}).get("estimated_num_employees")),
            "company_size": best.get("organization", {}).get("num_employees"),
            "company_industry": best.get("organization", {}).get("industry"),
        }
    except Exception as e:
        logger.warning("Apollo.io error: %s", e)
        return None


# ── ZeroBounce verification ──────────────────────────────────────────────────

async def verify_email(email: str) -> bool:
    """Public wrapper for external use."""
    return await _verify_email(email)


async def _verify_email(email: Optional[str]) -> bool:
    """Verify an email address via ZeroBounce. Returns True if valid."""
    if not email or not settings.zerobounce_api_key:
        return bool(email)  # skip verification if no API key

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                "https://api.zerobounce.net/v2/validate",
                params={
                    "api_key": settings.zerobounce_api_key,
                    "email": email,
                    "ip_address": "",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        status = data.get("status", "").lower()
        # "valid" = deliverable, "catch-all" = risky but acceptable
        if status in ("valid", "catch-all"):
            return True
        # "invalid", "abuse", "do_not_mail", "spamtrap", "unknown" → reject
        logger.info("ZeroBounce rejected %s with status=%s", email, status)
        return False
    except Exception as e:
        logger.warning("ZeroBounce error for %s: %s", email, e)
        # On API failure, assume valid to not block the waterfall
        return True


# ── Helper utilities ─────────────────────────────────────────────────────────

def _rank_by_title(candidates: list[dict], target_titles: list[str], name_key: str, email_key: str) -> Optional[dict]:
    """Return the candidate whose title best matches target_titles."""
    if not candidates:
        return None

    target_lower = [t.lower() for t in target_titles]

    def score(candidate: dict) -> int:
        title = (candidate.get("position") or candidate.get("title") or "").lower()
        for t in target_lower:
            if t in title or title in t:
                return 1
        return 0

    ranked = sorted(candidates, key=score, reverse=True)
    # Return first candidate that has an email
    for c in ranked:
        if c.get(email_key):
            return c
    return None


def _apply_cached(result: EnrichmentResult, cached: dict) -> None:
    result.email = cached.get("email")
    result.first_name = cached.get("firstName")
    result.last_name = cached.get("lastName")
    result.title = cached.get("title")
    result.linkedin_url = cached.get("linkedinUrl")


def _apply_hunter(result: EnrichmentResult, data: dict) -> None:
    result.email = data.get("email")
    result.first_name = data.get("first_name") or result.first_name
    result.last_name = data.get("last_name") or result.last_name
    result.title = data.get("title") or result.title
    result.linkedin_url = data.get("linkedin_url") or result.linkedin_url


def _apply_snov(result: EnrichmentResult, data: dict) -> None:
    result.email = data.get("email")
    result.first_name = data.get("first_name") or result.first_name
    result.last_name = data.get("last_name") or result.last_name
    result.title = data.get("title") or result.title
    result.linkedin_url = data.get("linkedin_url") or result.linkedin_url


def _apply_apollo(result: EnrichmentResult, data: dict) -> None:
    result.email = data.get("email")
    result.first_name = data.get("first_name") or result.first_name
    result.last_name = data.get("last_name") or result.last_name
    result.title = data.get("title") or result.title
    result.linkedin_url = data.get("linkedin_url") or result.linkedin_url
    if data.get("company_revenue"):
        result.company_revenue = data["company_revenue"]
    if data.get("company_size"):
        result.company_size = data["company_size"]
    if data.get("company_industry"):
        result.company_industry = data["company_industry"]


def _parse_revenue(employee_count: Optional[int]) -> Optional[int]:
    """Rough revenue estimate from employee count (USD millions)."""
    if not employee_count:
        return None
    # Very rough: ~$100k revenue per employee for B2B SaaS
    return max(1, (employee_count * 100) // 1000)
