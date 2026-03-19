"""
ICP quality score computation (Rule 7).

Score breakdown (0-100):
  - Industry specificity: 1 broad (Any) = 0pts, specific = 30pts
  - Revenue range: no range = 0pts, range set = 20pts
  - Persona title specificity: generic = 5pts, specific = 25pts
  - Keyword quality: <5 = 0pts, 5-15 focused = 20pts, >30 = 5pts
  - Geography specified: 5pts if set

Block activation if score < 50.
Warning + require acknowledgement if 50-79.
Activate normally if >= 80.
"""

from typing import Optional

GENERIC_TITLES = {
    "manager", "director", "executive", "lead", "officer",
    "president", "vp", "vice president", "head", "principal",
}

SPECIFIC_TITLES = {
    "ciso", "cfo", "cto", "coo", "ceo", "cmo",
    "chief information security officer", "chief financial officer",
    "head of internal audit", "head of security", "head of compliance",
    "vp of engineering", "vp of finance", "vp of security",
    "director of information security", "director of finance",
}


def compute_icp_quality_score(
    industries: list[str],
    revenue_min: Optional[int],
    revenue_max: Optional[int],
    geographies: list[str],
    persona_titles: list[str],
    keywords: list[str],
) -> tuple[int, list[str]]:
    """
    Compute ICP quality score and return (score, warnings).
    """
    score = 0
    warnings = []

    # ── Industry specificity (30pts) ─────────────────────────────────────────
    if not industries or industries == ["Any"] or industries == ["any"]:
        warnings.append("No specific industries selected — consider narrowing your target market")
    else:
        score += 30

    # ── Revenue range (20pts) ────────────────────────────────────────────────
    if revenue_min is not None and revenue_max is not None:
        score += 20
    else:
        warnings.append("No revenue range set — adding a range improves signal targeting accuracy")

    # ── Persona title specificity (25pts max, 5pts min) ──────────────────────
    title_score = 0
    if persona_titles:
        titles_lower = [t.lower() for t in persona_titles]
        has_specific = any(
            any(specific in title for specific in SPECIFIC_TITLES)
            for title in titles_lower
        )
        has_only_generic = all(
            any(generic in title for generic in GENERIC_TITLES)
            for title in titles_lower
        )

        if has_specific:
            title_score = 25
        elif has_only_generic:
            title_score = 5
            warnings.append("Persona titles are generic (e.g. 'Manager', 'Director') — use specific titles like 'CISO' or 'Head of Internal Audit' for better precision")
        else:
            title_score = 15  # mixed
    else:
        warnings.append("No persona titles defined — add target job titles to improve prospect matching")

    score += title_score

    # ── Keyword quality (20pts) ──────────────────────────────────────────────
    keyword_count = len(keywords)
    if keyword_count == 0:
        warnings.append("No keywords defined — add 5-15 focused keywords to improve ICP signal detection")
    elif keyword_count < 5:
        warnings.append(f"Only {keyword_count} keyword(s) — add more to improve signal coverage (recommended: 5-15)")
    elif keyword_count <= 15:
        score += 20
    elif keyword_count <= 30:
        score += 15
        warnings.append(f"{keyword_count} keywords is getting broad — consider narrowing to 5-15 highly specific terms")
    else:
        score += 5
        warnings.append(f"{keyword_count} keywords is too many — this will generate low-quality signals. Reduce to 5-15 focused keywords")

    # ── Geography (5pts) ─────────────────────────────────────────────────────
    if geographies and len(geographies) > 0:
        score += 5
    else:
        warnings.append("No geographies specified — consider targeting specific regions")

    return min(score, 100), warnings


def get_activation_decision(score: int) -> dict:
    """
    Returns activation decision based on quality score.

    Returns:
        {
            canActivate: bool,
            requiresAcknowledgement: bool,
            blockReason: str | None
        }
    """
    if score < 50:
        return {
            "canActivate": False,
            "requiresAcknowledgement": False,
            "blockReason": f"ICP quality score {score}/100 is too low to activate. Minimum required: 50. Improve industries, revenue range, persona titles, and keywords."
        }
    elif score < 80:
        return {
            "canActivate": True,
            "requiresAcknowledgement": True,
            "blockReason": None,
        }
    else:
        return {
            "canActivate": True,
            "requiresAcknowledgement": False,
            "blockReason": None,
        }
