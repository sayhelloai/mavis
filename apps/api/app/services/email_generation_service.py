"""
Email generation service — Step 6.

Generates a 3-touch cold email sequence for a prospect using:
1. Qdrant similarity search to retrieve relevant Hub assets (RAG)
2. Claude claude-sonnet-4-5 to generate the sequence
3. Stores the EmailSequence in DB with status PENDING_REVIEW

Claude settings:
- Temperature: 0.3 for email generation (consistent but not robotic)
- Model: claude-sonnet-4-5
"""

import json
import logging
from typing import Optional
from dataclasses import dataclass

import anthropic
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.config import settings

logger = logging.getLogger(__name__)

CLAUDE_MODEL = "claude-sonnet-4-5"
EMAIL_GENERATION_TEMPERATURE = 0.3
MAX_TOKENS = 2048
HUB_SEARCH_LIMIT = 3


@dataclass
class ProspectContext:
    prospect_id: str
    icp_id: str
    tenant_id: str
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    title: Optional[str]
    company_name: str
    company_domain: str
    company_industry: Optional[str]
    company_revenue: Optional[int]
    company_size: Optional[int]
    signal_content: Optional[str]  # the original signal that triggered outreach
    signal_source: Optional[str]


@dataclass
class EmailTouch:
    subject: str
    body: str


@dataclass
class GeneratedSequence:
    touch1: EmailTouch
    touch2: EmailTouch
    touch3: EmailTouch
    raw_response: str


EMAIL_GENERATION_SYSTEM_PROMPT = """You are a senior B2B sales development representative. Write a 3-touch cold email sequence for the following prospect.

CRITICAL RULES:
1. Each email must be 80-120 words maximum
2. Touch 1: reference the specific signal that triggered outreach (the signal content is provided). Be specific, not vague.
3. Use information from the provided company context and content assets
4. Do NOT make comparative claims about any named competitors
5. Do NOT claim features or capabilities not in the provided content
6. Touch 2: follow up referencing Touch 1, different angle
7. Touch 3: short closing email, ask if timing is wrong
8. Subject lines must not start with Re: or Fwd: unless there is prior correspondence

Return JSON only (no markdown, no explanation):
{
  "touch1": {"subject": "...", "body": "..."},
  "touch2": {"subject": "...", "body": "..."},
  "touch3": {"subject": "...", "body": "..."}
}"""


async def generate_email_sequence(prospect: ProspectContext) -> GeneratedSequence:
    """
    Generate a 3-touch email sequence for a prospect.

    1. Retrieve top 3 relevant Hub assets via Qdrant similarity search
    2. Call Claude claude-sonnet-4-5 with prospect + asset context
    3. Parse and return the generated sequence
    """
    # Step 1: Retrieve relevant Hub assets via Qdrant
    hub_context = await _retrieve_hub_assets(prospect)

    # Step 2: Build user prompt
    user_prompt = _build_user_prompt(prospect, hub_context)

    # Step 3: Call Claude
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    logger.info(
        "Generating email sequence for prospect=%s company=%s",
        prospect.prospect_id,
        prospect.company_name,
    )

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=MAX_TOKENS,
        temperature=EMAIL_GENERATION_TEMPERATURE,
        system=EMAIL_GENERATION_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_response = message.content[0].text

    # Step 4: Parse JSON response
    sequence = _parse_sequence_response(raw_response)
    return sequence


def _build_user_prompt(prospect: ProspectContext, hub_assets: list[dict]) -> str:
    """Build the user prompt for Claude with all prospect context."""
    assets_text = ""
    if hub_assets:
        assets_text = "\n\n## Relevant Content Assets\n"
        for i, asset in enumerate(hub_assets, 1):
            assets_text += f"\n### Asset {i}: {asset.get('name', 'Unknown')}\n"
            assets_text += asset.get("snippet", "")
    else:
        assets_text = "\n\n## Relevant Content Assets\nNone available."

    signal_text = ""
    if prospect.signal_content:
        signal_text = f"\n\n## Signal That Triggered Outreach\nSource: {prospect.signal_source or 'Unknown'}\nContent: {prospect.signal_content}"

    revenue_text = f"~${prospect.company_revenue}M revenue" if prospect.company_revenue else ""
    size_text = f"{prospect.company_size} employees" if prospect.company_size else ""
    company_context = ", ".join(filter(None, [revenue_text, size_text, prospect.company_industry]))

    return f"""## Prospect
Name: {prospect.first_name or 'there'} {prospect.last_name or ''}
Title: {prospect.title or 'Unknown'}
Company: {prospect.company_name}
Domain: {prospect.company_domain}
Company Context: {company_context or 'Unknown'}
{signal_text}
{assets_text}

Generate the 3-touch email sequence now. Remember: 80-120 words per email, reference the signal specifically in Touch 1."""


async def _retrieve_hub_assets(prospect: ProspectContext) -> list[dict]:
    """
    Retrieve top 3 relevant Hub assets from Qdrant using similarity search.
    Collection name: mavis_{tenantId}_hub
    Query: "{companyIndustry} {title} pain points solutions"
    """
    if not prospect.company_industry and not prospect.title:
        return []

    collection_name = f"mavis_{prospect.tenant_id}_hub"
    query_text = f"{prospect.company_industry or ''} {prospect.title or ''} pain points solutions"

    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=settings.openai_api_key)

        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=query_text,
        )
        query_vector = embedding_response.data[0].embedding

        qdrant = QdrantClient(url=settings.qdrant_url)

        # Check if collection exists
        try:
            qdrant.get_collection(collection_name)
        except Exception:
            logger.debug("Qdrant collection %s does not exist yet", collection_name)
            return []

        results = qdrant.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=HUB_SEARCH_LIMIT,
            query_filter=Filter(
                must=[
                    FieldCondition(
                        key="tenantId",
                        match=MatchValue(value=prospect.tenant_id),
                    ),
                    FieldCondition(
                        key="isArchived",
                        match=MatchValue(value=False),
                    ),
                ]
            ),
        )

        return [
            {
                "name": r.payload.get("name", "Asset"),
                "snippet": r.payload.get("textSnippet", "")[:500],
                "score": r.score,
            }
            for r in results
        ]

    except Exception as e:
        logger.warning("Qdrant hub retrieval failed: %s — proceeding without hub context", e)
        return []


def _parse_sequence_response(raw: str) -> GeneratedSequence:
    """Parse Claude's JSON response into a GeneratedSequence."""
    # Strip potential markdown fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse Claude sequence response: %s\nRaw: %s", e, raw[:500])
        raise ValueError(f"Claude returned invalid JSON: {e}") from e

    def _touch(key: str) -> EmailTouch:
        t = data.get(key, {})
        subject = t.get("subject", "")
        body = t.get("body", "")
        if not subject or not body:
            raise ValueError(f"Missing subject or body in {key}")
        return EmailTouch(subject=subject, body=body)

    return GeneratedSequence(
        touch1=_touch("touch1"),
        touch2=_touch("touch2"),
        touch3=_touch("touch3"),
        raw_response=raw,
    )
