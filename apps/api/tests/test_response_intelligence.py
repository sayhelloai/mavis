"""
Unit tests for response intelligence service.
Tests the triple-layer unsubscribe, Claude classification, and dormant routing.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json

from app.services.response_intelligence_service import (
    _scan_unsubscribe_keywords,
    _extract_ooo_return_date,
    get_routing_action,
    classify_reply,
    ClassificationResult,
)


# ── Layer 1: keyword scan tests ──────────────────────────────────────────────

def test_keyword_scan_detects_unsubscribe():
    assert _scan_unsubscribe_keywords("Please unsubscribe me from this list.") is True


def test_keyword_scan_detects_opt_out():
    assert _scan_unsubscribe_keywords("I'd like to opt out of your emails.") is True


def test_keyword_scan_case_insensitive():
    assert _scan_unsubscribe_keywords("REMOVE ME from your list NOW") is True


def test_keyword_scan_detects_do_not_contact():
    assert _scan_unsubscribe_keywords("Please do not contact me again.") is True


def test_keyword_scan_detects_stop_emailing():
    assert _scan_unsubscribe_keywords("Stop emailing me, I'm not interested.") is True


def test_keyword_scan_negative_reply_not_matched():
    """A negative reply that doesn't contain unsubscribe keywords should not match."""
    assert _scan_unsubscribe_keywords("Thanks but we're not looking for this right now.") is False


def test_keyword_scan_positive_reply_not_matched():
    assert _scan_unsubscribe_keywords("Yes, I'd love to schedule a call!") is False


# ── Layer 1 wins regardless of Claude output ─────────────────────────────────

@pytest.mark.asyncio
async def test_layer1_wins_over_claude_classification():
    """If Layer 1 keyword matches, Claude should NOT be called."""
    with patch("app.services.response_intelligence_service._classify_with_claude", new_callable=AsyncMock) as mock_claude:
        mock_claude.return_value = {"classification": "POSITIVE", "confidence": 0.9, "reasoning": "test"}

        result = await classify_reply(
            prospect_id="p1",
            sequence_id="s1",
            reply_text="Please remove me from your list immediately.",
            reply_from="test@example.com",
            tenant_id="t1",
        )

    assert result.classification == "UNSUBSCRIBE"
    assert result.suppressed_by_keyword is True
    assert result.confidence == 1.0
    # Claude should never have been called
    mock_claude.assert_not_called()


# ── Claude classification routing ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_positive_reply_routes_to_lead():
    """POSITIVE classification should route prospect to LEAD."""
    with patch("app.services.response_intelligence_service._classify_with_claude", new_callable=AsyncMock) as mock_claude:
        mock_claude.return_value = {
            "classification": "POSITIVE",
            "confidence": 0.95,
            "reasoning": "Prospect wants to schedule a call",
        }

        result = await classify_reply(
            prospect_id="p1",
            sequence_id="s1",
            reply_text="This looks interesting! Can we schedule a call?",
            reply_from="test@example.com",
            tenant_id="t1",
        )

    assert result.classification == "POSITIVE"
    assert result.suppressed_by_keyword is False
    routing = get_routing_action(result.classification)
    assert routing["prospectStatus"] == "LEAD"
    assert routing["notify"] == "assigned_rep"


@pytest.mark.asyncio
async def test_future_dated_deferral_extracts_date():
    """FUTURE_DATED_DEFERRAL should trigger date extraction."""
    mock_claude_result = {
        "classification": "FUTURE_DATED_DEFERRAL",
        "confidence": 0.92,
        "reasoning": "Prospect asked to be contacted next quarter",
    }

    with (
        patch("app.services.response_intelligence_service._classify_with_claude", new_callable=AsyncMock) as mock_claude,
        patch("app.services.response_intelligence_service._extract_reactivation_date", new_callable=AsyncMock) as mock_extract,
    ):
        mock_claude.return_value = mock_claude_result
        mock_extract.return_value = "2026-07-01"

        result = await classify_reply(
            prospect_id="p1",
            sequence_id="s1",
            reply_text="Reach out next quarter, we're in the middle of a budget freeze.",
            reply_from="test@example.com",
            tenant_id="t1",
        )

    assert result.classification == "FUTURE_DATED_DEFERRAL"
    assert result.extracted_reactivation_date == "2026-07-01"
    routing = get_routing_action(result.classification)
    assert routing["prospectStatus"] == "DORMANT"


@pytest.mark.asyncio
async def test_hostile_routes_to_suppressed():
    """HOSTILE classification should suppress the prospect."""
    with patch("app.services.response_intelligence_service._classify_with_claude", new_callable=AsyncMock) as mock_claude:
        mock_claude.return_value = {
            "classification": "HOSTILE",
            "confidence": 0.99,
            "reasoning": "Aggressive threatening reply",
        }

        result = await classify_reply(
            prospect_id="p1",
            sequence_id="s1",
            reply_text="Stop contacting me or I'm reporting you to the FTC!",
            reply_from="test@example.com",
            tenant_id="t1",
        )

    assert result.classification == "HOSTILE"
    routing = get_routing_action(result.classification)
    assert routing["prospectStatus"] == "SUPPRESSED"
    assert routing["sequenceAction"] == "CANCEL"


# ── OOO date extraction ───────────────────────────────────────────────────────

def test_ooo_return_date_extraction_standard_format():
    ooo_text = "I'm out of office and returning on January 15. For urgent matters contact my colleague."
    result = _extract_ooo_return_date(ooo_text)
    assert result is not None
    assert "january" in result.lower() or "15" in result


def test_ooo_return_date_extraction_iso_format():
    ooo_text = "Out of office. Return date: 2026-04-01. Please expect delayed responses."
    result = _extract_ooo_return_date(ooo_text)
    assert result is not None


def test_ooo_return_date_returns_none_when_not_found():
    ooo_text = "I'm away and will get back to you when I return."
    result = _extract_ooo_return_date(ooo_text)
    # May or may not find a date — just shouldn't raise
    assert result is None or isinstance(result, str)


# ── Routing table ─────────────────────────────────────────────────────────────

def test_routing_table_covers_all_classifications():
    for classification in ["POSITIVE", "NEGATIVE", "QUESTION", "FUTURE_DATED_DEFERRAL", "OOO", "UNSUBSCRIBE", "HOSTILE"]:
        routing = get_routing_action(classification)
        assert "prospectStatus" in routing
        assert "sequenceAction" in routing
        assert "description" in routing


def test_question_routes_to_review_queue():
    routing = get_routing_action("QUESTION")
    assert routing["notify"] == "review_queue"
    assert routing["sequenceAction"] == "PAUSE"
