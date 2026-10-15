from __future__ import annotations

import json
import logging
import math
import re
from pathlib import Path
from typing import Any

try:
    import httpx
except ImportError:
    httpx = None

from .config import settings


logger = logging.getLogger(__name__)

# Stopwords to discard when scoring keyword relevance
STOP_WORDS = {
    'the', 'a', 'an', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'i', 'you', 'we', 'they', 'he', 'she', 'it', 'my', 'your', 'our', 'their', 'me', 'him', 'her', 'us',
    'give', 'please', 'one', 'short', 'advice', 'need', 'want', 'know', 'what', 'when', 'where', 'why', 'how',
    'can', 'could', 'should', 'would', 'do', 'does', 'did', 'for', 'with', 'without', 'about', 'into', 'from',
    'as', 'of', 'on', 'in', 'at', 'to', 'and', 'or', 'but', 'if', 'then', 'after', 'before', 'also', 'just',
    'tell', 'explain', 'suggest', 'help', 'details', 'problem', 'issue', 'sir', 'ai', 'uzhavanai',
}

AGRONOMY_SYNONYMS: dict[str, list[str]] = {
    'paddy': ['rice'],
    'rice': ['paddy'],
    'maize': ['corn'],
    'corn': ['maize'],
    'peanut': ['groundnut'],
    'groundnut': ['peanut'],
    'chili': ['chilli'],
    'chilli': ['chili'],
    'fertiliser': ['fertilizer'],
    'fertilizers': ['fertilizer'],
    'manure': ['organic', 'fertilizer'],
    'bph': ['planthopper'],
    'insect': ['pest'],
    'insects': ['pest'],
    'fungus': ['disease', 'blight', 'rust'],
    'fungal': ['disease', 'blight', 'rust'],
    # Tamil terms
    'நெல்': ['rice', 'paddy'],
    'அரிசி': ['rice'],
    'களிமண்': ['clay', 'soil'],
    'மண்': ['soil'],
    'தக்காளி': ['tomato'],
    'கோதுமை': ['wheat'],
    'கரும்பு': ['sugarcane'],
    'வாழை': ['banana'],
    'வேர்க்கடலை': ['groundnut'],
    'நிலக்கடலை': ['groundnut'],
    'உரம்': ['fertilizer', 'nutrient'],
    'பூச்சி': ['pest', 'borer', 'hopper'],
    'நோய்': ['disease', 'blight', 'rust'],
    'பாசனம்': ['irrigation', 'water'],
    # Hindi terms
    'धान': ['rice', 'paddy'],
    'चावल': ['rice'],
    'गेहूं': ['wheat'],
    'टमाटर': ['tomato'],
    'मिट्टी': ['soil'],
    'खाद': ['fertilizer', 'manure'],
    'उर्वरक': ['fertilizer'],
    'कीट': ['pest'],
    'कीड़ा': ['pest'],
    'रोग': ['disease'],
    'बीमारी': ['disease'],
    'सिंचाई': ['irrigation', 'water'],
    # Telugu terms
    'వరి': ['rice', 'paddy'],
    'నేల': ['soil'],
    'ఎరువులు': ['fertilizer'],
    'తెగులు': ['disease', 'pest'],
    'పురుగు': ['pest'],
    # Marathi terms
    'भात': ['rice', 'paddy'],
    'माती': ['soil'],
    'खत': ['fertilizer'],
    'कीड': ['pest'],
    # Bengali terms
    'ধান': ['rice', 'paddy'],
    'মাটি': ['soil'],
    'সার': ['fertilizer'],
    'পোকামাকড়': ['pest'],
    'রোগ': ['disease'],
}

_LOCAL_DOCUMENTS: list[dict[str, Any]] | None = None



def load_local_knowledge() -> list[dict[str, Any]]:
    global _LOCAL_DOCUMENTS
    if _LOCAL_DOCUMENTS is not None:
        return _LOCAL_DOCUMENTS

    path = settings.knowledge_path
    if not path.is_file():
        # Try finding it relative to repository root
        alt_path = Path(__file__).resolve().parents[2] / 'knowledge' / 'agri_knowledge.json'
        if alt_path.is_file():
            path = alt_path

    if path.is_file():
        try:
            with open(path, 'r', encoding='utf-8') as f:
                docs = json.load(f)
                if isinstance(docs, list):
                    _LOCAL_DOCUMENTS = docs
                    logger.info('Loaded %d documents from agricultural knowledge base (%s)', len(docs), path)
                    return _LOCAL_DOCUMENTS
        except Exception as exc:
            logger.error('Failed to load local agricultural knowledge base: %s', exc)

    _LOCAL_DOCUMENTS = []
    return _LOCAL_DOCUMENTS


PUNCT_SPLIT = re.compile(r'[\s\.,?!:;\'"()\[\]{}\-_/\\<>@#$%^&*+=~`|]+')


def _tokenize(text: str) -> list[str]:
    raw_tokens = [t for t in PUNCT_SPLIT.split(text.lower()) if len(t) > 1 and t not in STOP_WORDS]
    expanded: list[str] = []
    seen = set()
    for t in raw_tokens:
        if t not in seen:
            expanded.append(t)
            seen.add(t)
        for syn in AGRONOMY_SYNONYMS.get(t, []):
            if syn not in seen:
                expanded.append(syn)
                seen.add(syn)
    return expanded



def score_document(query_tokens: list[str], raw_query: str, doc: dict[str, Any]) -> float:
    if not query_tokens:
        return 0.0

    title = (doc.get('title') or '').lower()
    crop = (doc.get('crop') or '').lower()
    category = (doc.get('category') or '').lower()
    content = (doc.get('content') or '').lower()

    score = 0.0
    query_lower = raw_query.lower()

    # Exact phrase matches
    if len(query_lower) > 4:
        if query_lower in title:
            score += 5.0
        if query_lower in content:
            score += 3.0

    # Token matches
    total_tokens = len(query_tokens)
    matched_tokens = 0

    for token in query_tokens:
        token_matched = False
        if token in title:
            score += 2.5
            token_matched = True
        if token in crop:
            score += 2.0
            token_matched = True
        if token in category:
            score += 1.5
            token_matched = True
        if token in content:
            # Count frequency in content with diminishing returns
            freq = content.count(token)
            score += min(2.0, 0.4 * math.log(1 + freq))
            token_matched = True

        if token_matched:
            matched_tokens += 1

    # Ratio of matched query terms
    coverage = matched_tokens / total_tokens if total_tokens > 0 else 0.0
    final_score = (score * (0.5 + 0.5 * coverage)) / (1.0 + total_tokens * 0.5)

    # Normalize roughly to [0, 1] range
    normalized = min(1.0, final_score / 3.0)
    return normalized


async def _query_supabase_rag(query: str, top_k: int) -> list[dict[str, Any]] | None:
    """Optional vector retrieval against Supabase if configured."""
    if not settings.supabase_url or not settings.supabase_anon_key or httpx is None:
        return None


    try:
        url = f"{settings.supabase_url.rstrip('/')}/rest/v1/agri_knowledge_chunks"
        headers = {
            'apikey': settings.supabase_anon_key,
            'Authorization': f'Bearer {settings.supabase_anon_key}',
        }
        # Fallback to simple full-text / ILIKE search over title and content if pgvector RPC is not available
        tokens = _tokenize(query)
        if not tokens:
            return None

        primary_term = tokens[0]
        params = {
            'select': 'id,doc_id,title,category,crop,source,url,content',
            'or': f'(title.ilike.*{primary_term}*,content.ilike.*{primary_term}*)',
            'limit': str(top_k),
        }

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and data:
                    return [
                        {
                            'id': str(row.get('id', '')),
                            'doc_id': row.get('doc_id') or str(row.get('id', '')),
                            'title': row.get('title', ''),
                            'category': row.get('category', 'general'),
                            'crop': row.get('crop', 'general'),
                            'source': row.get('source', 'Agricultural Extension'),
                            'url': row.get('url', ''),
                            'content': row.get('content', ''),
                            'similarity': 0.85,
                        }
                        for row in data
                    ]
    except Exception as exc:
        logger.debug('Supabase direct query failed, will use local knowledge base: %s', exc)

    return None


async def retrieve_knowledge(
    query: str,
    top_k: int | None = None,
    match_threshold: float | None = None,
) -> list[dict[str, Any]]:
    """
    Optional knowledge retrieval layer (NOT an agent).
    Performs fast, lightweight matching against verified agricultural documents.
    """
    trimmed = (query or '').strip()
    if not trimmed:
        return []

    limit = top_k or settings.rag_top_k
    threshold = match_threshold or settings.rag_match_threshold

    # 1. Try Supabase if configured
    supabase_results = await _query_supabase_rag(trimmed, limit)
    if supabase_results:
        return supabase_results[:limit]

    # 2. Local agricultural knowledge search
    docs = load_local_knowledge()
    if not docs:
        return []

    tokens = _tokenize(trimmed)
    if not tokens:
        return []

    scored_docs: list[tuple[float, dict[str, Any]]] = []
    for doc in docs:
        score = score_document(tokens, trimmed, doc)
        if score >= threshold:
            scored_docs.append((score, doc))

    # Sort descending by relevance score
    scored_docs.sort(key=lambda x: x[0], reverse=True)

    results: list[dict[str, Any]] = []
    for score, doc in scored_docs[:limit]:
        results.append({
            'id': doc.get('id'),
            'doc_id': doc.get('id'),
            'title': doc.get('title', ''),
            'category': doc.get('category', 'general'),
            'crop': doc.get('crop', 'general'),
            'source': doc.get('source', 'Agricultural Extension Research'),
            'url': doc.get('url', ''),
            'content': doc.get('content', ''),
            'similarity': round(score, 3),
        })

    return results


def format_context_for_prompt(chunks: list[dict[str, Any]]) -> str:
    """Formats retrieved chunks into clean markdown for inclusion in the single LLM's prompt."""
    if not chunks:
        return 'No specific agricultural document matched in the local knowledge base. Use your expert agricultural knowledge.'

    formatted = []
    for i, c in enumerate(chunks, 1):
        title = c.get('title', 'Agricultural Note')
        source = c.get('source', 'Agricultural Extension')
        content = c.get('content', '').strip()
        formatted.append(f"### [Reference {i}] {title}\n**Source**: {source}\n{content}")

    return '\n\n'.join(formatted)
