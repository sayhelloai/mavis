"""
Unit tests for email generation service.
Tests mock the Anthropic API and Qdrant to avoid real API calls.
"""

import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock

from app.services.email_generation_service import (
    _parse_sequence_response,
    _build_user_prompt,
    ProspectContext,
    EmailTouch,
)


SAMPLE_SEQUENCE_JSON = json.dumps({
    "touch1": {
        "subject": "Re: DataVault's Series B — a question",
        "body": "Hi Marcus,\n\nCongrats on DataVault's $50M Series B. Series B often means rapid team growth, which can stretch your security posture quickly.\n\nWe help security leaders at scaling SaaS companies maintain compliance without slowing down engineering. Would a quick call make sense to explore if we're a fit?\n\nBest,\n{rep_name}"
    },
    "touch2": {
        "subject": "One more thought on DataVault's security roadmap",
        "body": "Hi Marcus,\n\nFollowing up on my last note. Beyond compliance, we often see Series B companies prioritizing threat detection as their user base grows.\n\nOur platform consolidates SIEM, endpoint, and identity signals into one dashboard. Happy to share a case study from a similar-stage company.\n\n{rep_name}"
    },
    "touch3": {
        "subject": "Should I check back in a few months?",
        "body": "Hi Marcus,\n\nDon't want to keep interrupting if the timing isn't right. If security infrastructure isn't on your radar right now, just say the word and I'll check back in Q3.\n\nOtherwise, here's my calendar: [link]\n\n{rep_name}"
    }
})


def make_prospect() -> ProspectContext:
    return ProspectContext(
        prospect_id="p1",
        icp_id="icp1",
        tenant_id="t1",
        first_name="Marcus",
        last_name="Webb",
        email="mwebb@datavault.com",
        title="CISO",
        company_name="DataVault Corp",
        company_domain="datavault.com",
        company_industry="Technology",
        company_revenue=50,
        company_size=200,
        signal_content="DataVault Corp receives $50M Series B to accelerate enterprise security compliance platform.",
        signal_source="NEWS",
    )


def test_parse_sequence_response_valid_json():
    """Should correctly parse valid Claude JSON response."""
    seq = _parse_sequence_response(SAMPLE_SEQUENCE_JSON)
    assert seq.touch1.subject == "Re: DataVault's Series B — a question"
    assert seq.touch2.subject == "One more thought on DataVault's security roadmap"
    assert seq.touch3.subject == "Should I check back in a few months?"
    assert "{rep_name}" in seq.touch1.body


def test_parse_sequence_response_strips_markdown_fences():
    """Should strip markdown code fences from Claude response."""
    wrapped = f"```json\n{SAMPLE_SEQUENCE_JSON}\n```"
    seq = _parse_sequence_response(wrapped)
    assert seq.touch1.subject is not None


def test_parse_sequence_response_raises_on_invalid_json():
    """Should raise ValueError on unparseable response."""
    with pytest.raises(ValueError, match="invalid JSON"):
        _parse_sequence_response("This is not JSON at all.")


def test_parse_sequence_response_raises_on_missing_body():
    """Should raise ValueError when a touch is missing its body."""
    bad = json.dumps({
        "touch1": {"subject": "Hello"},  # missing body
        "touch2": {"subject": "Follow up", "body": "body text"},
        "touch3": {"subject": "Last touch", "body": "body text"},
    })
    with pytest.raises(ValueError):
        _parse_sequence_response(bad)


def test_build_user_prompt_includes_signal():
    """User prompt should include signal content."""
    prospect = make_prospect()
    prompt = _build_user_prompt(prospect, hub_assets=[])
    assert "DataVault Corp receives $50M Series B" in prompt
    assert "Marcus" in prompt
    assert "CISO" in prompt


def test_build_user_prompt_includes_hub_assets():
    """User prompt should include Hub asset snippets."""
    prospect = make_prospect()
    assets = [{"name": "Security Case Study", "snippet": "How AcmeCo reduced breach risk by 70%", "score": 0.9}]
    prompt = _build_user_prompt(prospect, hub_assets=assets)
    assert "Security Case Study" in prompt
    assert "70%" in prompt


def test_build_user_prompt_handles_missing_optional_fields():
    """Should handle prospects with minimal data gracefully."""
    prospect = ProspectContext(
        prospect_id="p2",
        icp_id="icp1",
        tenant_id="t1",
        first_name=None,
        last_name=None,
        email=None,
        title=None,
        company_name="Unknown Corp",
        company_domain="unknown.com",
        company_industry=None,
        company_revenue=None,
        company_size=None,
        signal_content=None,
        signal_source=None,
    )
    prompt = _build_user_prompt(prospect, hub_assets=[])
    assert "Unknown Corp" in prompt
    # Should not raise


@pytest.mark.asyncio
async def test_generate_sequence_calls_claude_and_returns_structured_result():
    """Full integration test with mocked Anthropic and Qdrant."""
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=SAMPLE_SEQUENCE_JSON)]

    with (
        patch("app.services.email_generation_service._retrieve_hub_assets", new_callable=AsyncMock) as mock_qdrant,
        patch("anthropic.Anthropic") as mock_anthropic_cls,
    ):
        mock_qdrant.return_value = []
        mock_client = MagicMock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_cls.return_value = mock_client

        from app.services.email_generation_service import generate_email_sequence
        prospect = make_prospect()
        seq = await generate_email_sequence(prospect)

    assert seq.touch1.subject == "Re: DataVault's Series B — a question"
    assert seq.touch2.subject is not None
    assert seq.touch3.subject is not None

    # Verify Claude was called with correct model and temperature
    call_kwargs = mock_client.messages.create.call_args.kwargs
    assert call_kwargs["model"] == "claude-sonnet-4-5"
    assert call_kwargs["temperature"] == 0.3
