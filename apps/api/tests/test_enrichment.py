"""
Unit tests for enrichment waterfall.
Tests use mocked HTTP calls to avoid requiring real API keys.
"""

import pytest
from unittest.mock import patch, AsyncMock
from app.services.enrichment_service import (
    run_enrichment_waterfall,
    _step2_extract_from_metadata,
    _rank_by_title,
    _verify_email,
)


@pytest.mark.asyncio
async def test_step2_extracts_email_from_content():
    """Step 2 should extract valid email from signal content."""
    metadata = {
        "content": "Contact our CISO at john.doe@techflow.io for security inquiries."
    }
    result = _step2_extract_from_metadata(metadata)
    assert result == "john.doe@techflow.io"


@pytest.mark.asyncio
async def test_step2_ignores_noreply_emails():
    """Step 2 should filter out noreply/notification addresses."""
    metadata = {
        "content": "Sent from noreply@github.com on behalf of techflow.io"
    }
    result = _step2_extract_from_metadata(metadata)
    assert result is None


@pytest.mark.asyncio
async def test_step2_no_email_returns_none():
    """Step 2 returns None when no email present."""
    result = _step2_extract_from_metadata({"content": "No email here."})
    assert result is None


def test_rank_by_title_prefers_matching_title():
    """_rank_by_title should return the candidate with the most relevant title."""
    candidates = [
        {"first_name": "Alice", "value": "alice@co.com", "position": "Marketing Manager"},
        {"first_name": "Bob", "value": "bob@co.com", "position": "CISO"},
        {"first_name": "Carol", "value": "carol@co.com", "position": "Software Engineer"},
    ]
    result = _rank_by_title(candidates, ["CISO", "Chief Information Security Officer"], "first_name", "value")
    assert result is not None
    assert result["value"] == "bob@co.com"


@pytest.mark.asyncio
async def test_crm_cache_returns_existing_verified_prospect():
    """Step 1 should use an existing verified prospect from the same domain."""
    existing = [
        {
            "tenantId": "t1",
            "companyDomain": "acme.com",
            "email": "ciso@acme.com",
            "emailVerified": True,
            "firstName": "Jane",
            "lastName": "Smith",
            "title": "CISO",
        }
    ]

    with patch("app.services.enrichment_service._verify_email", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = True

        result = await run_enrichment_waterfall(
            signal_id="sig-1",
            company_domain="acme.com",
            target_persona_titles=["CISO"],
            tenant_id="t1",
            existing_prospects_cache=existing,
            signal_metadata=None,
        )

    assert result.found is True
    assert result.email == "ciso@acme.com"
    assert result.enrichment_source == "crm_cache"


@pytest.mark.asyncio
async def test_waterfall_fails_gracefully_when_all_steps_empty():
    """Waterfall should return found=False when no APIs return results."""
    with (
        patch("app.services.enrichment_service._verify_email", new_callable=AsyncMock) as mock_verify,
        patch("app.services.enrichment_service._step3_hunter_io", new_callable=AsyncMock) as mock_hunter,
        patch("app.services.enrichment_service._step4_snov_io", new_callable=AsyncMock) as mock_snov,
        patch("app.services.enrichment_service._step5_clearbit", new_callable=AsyncMock) as mock_clearbit,
        patch("app.services.enrichment_service._step6_apollo_io", new_callable=AsyncMock) as mock_apollo,
    ):
        mock_verify.return_value = False
        mock_hunter.return_value = None
        mock_snov.return_value = None
        mock_clearbit.return_value = None
        mock_apollo.return_value = None

        result = await run_enrichment_waterfall(
            signal_id="sig-fail",
            company_domain="unknown-domain.xyz",
            target_persona_titles=["CISO"],
            tenant_id="t1",
        )

    assert result.found is False
    assert result.failed_at is not None


@pytest.mark.asyncio
async def test_signal_metadata_email_skips_hunter():
    """If email found in signal metadata, hunter/snov should not be called."""
    with (
        patch("app.services.enrichment_service._verify_email", new_callable=AsyncMock) as mock_verify,
        patch("app.services.enrichment_service._step3_hunter_io", new_callable=AsyncMock) as mock_hunter,
    ):
        mock_verify.return_value = True
        mock_hunter.return_value = None  # should not be reached

        result = await run_enrichment_waterfall(
            signal_id="sig-meta",
            company_domain="techflow.io",
            target_persona_titles=["CISO"],
            tenant_id="t1",
            signal_metadata={"content": "Reach out to cto@techflow.io"},
        )

    assert result.found is True
    assert result.email == "cto@techflow.io"
    assert result.enrichment_source == "signal_metadata"
    mock_hunter.assert_not_called()
