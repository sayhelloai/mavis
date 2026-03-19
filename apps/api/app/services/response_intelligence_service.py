"""
Response Intelligence Service — Step 7.

Implements:
- Rule 2: Triple-layer unsubscribe (keyword scan → Claude classify → Layer 1 wins)
- Rule 6: Dormant queue routing for FUTURE_DATED_DEFERRAL replies
- Reply classification routing table

Claude settings:
- Temperature: 0.0 for classification (deterministic)
- Model: claude-sonnet-4-5
"""

import logging
import re
from datetime import date, timedelta
from typing import Optional
from dataclasses import dataclass

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

CLAUDE_MODEL = "claude-sonnet-4-5"
CLASSIFICATION_TEMPERATURE = 0.0

# Rule 2 Layer 1: exact keyword scan (case-insensitive)
UNSUBSCRIBE_KEYWORDS = [
    "unsubscribe",
    "opt out",
    "opt-out",
    "remove me",
    "stop emailing",
    "take me off",
    "do not contact",
    "remove from list",
]

VALID_CLASSIFICATIONS = {
    "POSITIVE",
    "NEGATIVE",
    "QUESTION",
    "FUTURE_DATED_DEFERRAL",
    "OOO",
    "UNSUBSCRIBE",
    "HOSTILE",
}

CLASSIFICATION_SYSTEM_PROMPT = """You are an AI assistant that classifies inbound B2B sales email replies.

Classify the reply into exactly ONE of these categories:
- POSITIVE: prospect is interested, wants to learn more, or willing to meet
- NEGATIVE: prospect explicitly declines, says not interested, or not a fit
- QUESTION: prospect has a question about the product/service
- FUTURE_DATED_DEFERRAL: prospect says reach out later (next quarter, after summer, end of year, in 3 months, etc.)
- OOO: out-of-office automated reply
- UNSUBSCRIBE: prospect wants to be removed from mailing list
- HOSTILE: aggressive, rude, or threatening reply demanding to stop contact

Respond with a single JSON object:
{"classification": "CATEGORY", "confidence": 0.0-1.0, "reasoning": "brief reason"}

Do not include any text outside the JSON object."""

DORMANT_EXTRACTION_PROMPT = """Extract the reactivation date from this message. Reply with a single ISO 8601 date string only (YYYY-MM-DD), nothing else.

Rules:
- If vague (e.g. "next quarter"), use the first day of the next calendar quarter
- If "end of year", use December 15
- If "after summer", use September 1
- If "in 3 months", calculate from today
- If "next year", use January 15 of next year

Today is {today}.

Message: {reply_text}"""


@dataclass
class ClassificationResult:
    classification: str
    confidence: float
    reasoning: str
    suppressed_by_keyword: bool = False
    extracted_reactivation_date: Optional[str] = None
    ooo_return_date: Optional[str] = None


async def classify_reply(
    prospect_id: str,
    sequence_id: str,
    reply_text: str,
    reply_from: str,
    tenant_id: str,
) -> ClassificationResult:
    """
    Full reply classification pipeline:

    Layer 1: Keyword scan for unsubscribe signals (BEFORE Claude)
    Layer 2: Claude classification
    Layer 3: Layer 1 always wins if it matched

    Additional routing:
    - FUTURE_DATED_DEFERRAL: extract reactivation date
    - OOO: attempt to extract return date
    """
    # ── Layer 1: Keyword scan ────────────────────────────────────────────────
    keyword_matched = _scan_unsubscribe_keywords(reply_text)

    if keyword_matched:
        logger.info(
            "Layer 1 unsubscribe keyword matched for prospect=%s email=%s",
            prospect_id, reply_from
        )
        # Do NOT call Claude — return immediately
        return ClassificationResult(
            classification="UNSUBSCRIBE",
            confidence=1.0,
            reasoning=f"Keyword match: contains unsubscribe signal",
            suppressed_by_keyword=True,
        )

    # ── Layer 2: Claude classification ──────────────────────────────────────
    claude_result = await _classify_with_claude(reply_text)

    # ── Layer 3: Conflict resolution (Layer 1 already handled above) ─────────
    # If we reach here, Layer 1 did NOT match, so Claude's result stands.
    # (Rule: if Layer 1 matched, Layer 1 wins always — already returned above)

    result = ClassificationResult(
        classification=claude_result["classification"],
        confidence=claude_result.get("confidence", 0.8),
        reasoning=claude_result.get("reasoning", ""),
        suppressed_by_keyword=False,
    )

    # ── Handle FUTURE_DATED_DEFERRAL: extract reactivation date ─────────────
    if result.classification == "FUTURE_DATED_DEFERRAL":
        reactivation_date = await _extract_reactivation_date(reply_text)
        result.extracted_reactivation_date = reactivation_date
        logger.info(
            "FUTURE_DATED_DEFERRAL for prospect=%s, reactivation=%s",
            prospect_id, reactivation_date
        )

    # ── Handle OOO: attempt return date extraction ───────────────────────────
    elif result.classification == "OOO":
        result.ooo_return_date = _extract_ooo_return_date(reply_text)

    return result


def _scan_unsubscribe_keywords(text: str) -> bool:
    """
    Layer 1: Scan reply text for unsubscribe keywords (case-insensitive).
    Returns True if any keyword matches.
    """
    text_lower = text.lower()
    for keyword in UNSUBSCRIBE_KEYWORDS:
        if keyword in text_lower:
            return True
    return False


async def _classify_with_claude(reply_text: str) -> dict:
    """
    Layer 2: Classify reply with Claude at temperature=0.0.
    Returns dict with classification, confidence, reasoning.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    # Truncate reply to avoid excessive token use
    truncated = reply_text[:2000] if len(reply_text) > 2000 else reply_text

    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=256,
            temperature=CLASSIFICATION_TEMPERATURE,
            system=CLASSIFICATION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Classify this reply:\n\n{truncated}"}],
        )

        raw = message.content[0].text.strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        import json
        data = json.loads(raw)

        classification = data.get("classification", "NEGATIVE")
        if classification not in VALID_CLASSIFICATIONS:
            logger.warning("Claude returned invalid classification '%s', defaulting to NEGATIVE", classification)
            classification = "NEGATIVE"

        return {
            "classification": classification,
            "confidence": float(data.get("confidence", 0.8)),
            "reasoning": data.get("reasoning", ""),
        }

    except Exception as e:
        logger.error("Claude classification failed: %s", e, exc_info=True)
        # Safe default — do not suppress or route incorrectly
        return {
            "classification": "NEGATIVE",
            "confidence": 0.0,
            "reasoning": f"Classification failed: {e}",
        }


async def _extract_reactivation_date(reply_text: str) -> Optional[str]:
    """
    Extract a specific reactivation date from a FUTURE_DATED_DEFERRAL reply.
    Uses Claude at temperature=0.0 to extract an ISO 8601 date.
    Falls back to +90 days if extraction fails.
    """
    today = date.today().isoformat()
    prompt = DORMANT_EXTRACTION_PROMPT.format(today=today, reply_text=reply_text[:1000])

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=20,
            temperature=CLASSIFICATION_TEMPERATURE,
            messages=[{"role": "user", "content": prompt}],
        )

        extracted = message.content[0].text.strip()

        # Validate ISO 8601 format
        iso_pattern = r"^\d{4}-\d{2}-\d{2}$"
        if re.match(iso_pattern, extracted):
            return extracted

        logger.warning("Claude returned non-ISO date '%s', falling back to +90 days", extracted)

    except Exception as e:
        logger.error("Reactivation date extraction failed: %s", e)

    # Fallback: 90 days from today
    fallback = date.today() + timedelta(days=90)
    return fallback.isoformat()


def _extract_ooo_return_date(reply_text: str) -> Optional[str]:
    """
    Attempt to extract OOO return date from reply text using regex patterns.
    Returns ISO 8601 date string or None.
    """
    text_lower = reply_text.lower()

    # Common OOO date patterns
    # "returning on January 15" / "back on 15 Jan" / "return date: 2024-03-01"
    patterns = [
        r"return(?:ing)?\s+(?:on\s+)?(\w+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)",
        r"back\s+(?:on\s+)?(\w+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)",
        r"(?:return date|available)\s*:?\s*(\d{4}-\d{2}-\d{2})",
        r"until\s+(\w+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            # Return the raw matched string — caller can parse further if needed
            return match.group(1)

    return None


def get_routing_action(classification: str) -> dict:
    """
    Returns the routing action for a given classification.
    Used by the router to determine what to do after classification.
    """
    actions = {
        "POSITIVE": {
            "prospectStatus": "LEAD",
            "sequenceAction": "PAUSE",
            "notify": "assigned_rep",
            "description": "Prospect replied positively — route to sales rep",
        },
        "NEGATIVE": {
            "prospectStatus": None,  # keep current, sequence exhausted naturally
            "sequenceAction": "CANCEL",
            "notify": None,
            "description": "Prospect declined — cancel sequence",
        },
        "QUESTION": {
            "prospectStatus": None,
            "sequenceAction": "PAUSE",
            "notify": "review_queue",
            "description": "Prospect has a question — generate reply, put in review queue",
        },
        "FUTURE_DATED_DEFERRAL": {
            "prospectStatus": "DORMANT",
            "sequenceAction": "CANCEL",
            "notify": None,
            "description": "Prospect deferred — set DORMANT with reactivation date",
        },
        "OOO": {
            "prospectStatus": None,
            "sequenceAction": "PAUSE",
            "notify": None,
            "description": "Out of office — pause sequence until return date",
        },
        "UNSUBSCRIBE": {
            "prospectStatus": "SUPPRESSED",
            "sequenceAction": "CANCEL",
            "notify": None,
            "description": "Unsubscribe request — suppress immediately",
        },
        "HOSTILE": {
            "prospectStatus": "SUPPRESSED",
            "sequenceAction": "CANCEL",
            "notify": None,
            "description": "Hostile reply — suppress immediately",
        },
    }
    return actions.get(classification, actions["NEGATIVE"])
