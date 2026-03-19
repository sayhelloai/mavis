"""Unit tests for ICP quality score computation."""

import pytest
from app.services.icp_service import compute_icp_quality_score, get_activation_decision


def test_perfect_icp_scores_100():
    score, warnings = compute_icp_quality_score(
        industries=["SaaS", "Technology"],
        revenue_min=10,
        revenue_max=500,
        geographies=["US", "UK"],
        persona_titles=["CISO", "Chief Information Security Officer"],
        keywords=["zero trust", "SOC 2", "compliance", "endpoint protection", "SIEM", "threat detection", "identity"],
    )
    assert score >= 80
    assert len(warnings) == 0


def test_empty_icp_scores_zero():
    score, warnings = compute_icp_quality_score(
        industries=[],
        revenue_min=None,
        revenue_max=None,
        geographies=[],
        persona_titles=[],
        keywords=[],
    )
    assert score == 0
    assert len(warnings) > 0


def test_generic_titles_score_5pts_not_25():
    score_generic, _ = compute_icp_quality_score(
        industries=["SaaS"],
        revenue_min=10,
        revenue_max=500,
        geographies=["US"],
        persona_titles=["Manager", "Director"],
        keywords=["security", "compliance", "audit", "risk", "governance"],
    )
    score_specific, _ = compute_icp_quality_score(
        industries=["SaaS"],
        revenue_min=10,
        revenue_max=500,
        geographies=["US"],
        persona_titles=["CISO", "Head of Internal Audit"],
        keywords=["security", "compliance", "audit", "risk", "governance"],
    )
    assert score_specific > score_generic


def test_too_many_keywords_score_5pts():
    score, warnings = compute_icp_quality_score(
        industries=["SaaS"],
        revenue_min=10,
        revenue_max=500,
        geographies=["US"],
        persona_titles=["CISO"],
        keywords=[f"keyword{i}" for i in range(35)],  # 35 keywords
    )
    # Should get 5pts for keywords, not 20
    assert any("too many" in w.lower() for w in warnings)


def test_score_below_50_blocks_activation():
    decision = get_activation_decision(40)
    assert decision["canActivate"] is False
    assert decision["blockReason"] is not None


def test_score_50_to_79_requires_acknowledgement():
    decision = get_activation_decision(65)
    assert decision["canActivate"] is True
    assert decision["requiresAcknowledgement"] is True


def test_score_80_plus_activates_normally():
    decision = get_activation_decision(85)
    assert decision["canActivate"] is True
    assert decision["requiresAcknowledgement"] is False
