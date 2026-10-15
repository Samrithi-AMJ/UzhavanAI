from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / '.env')


def _get(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    return value.strip() if isinstance(value, str) and value.strip() else default


@dataclass
class Settings:
    app_name: str = 'uzhavan-ai'
    # Dynamic port binding for cloud PaaS (Render, Railway, etc.) or local development
    host: str = _get('AI_HOST', '0.0.0.0' if os.getenv('RENDER') or os.getenv('PORT') else '127.0.0.1') or '127.0.0.1'
    port: int = int(_get('PORT') or _get('AI_PORT', '8001') or '8001')
    debug: bool = (_get('AI_DEBUG', 'false') or 'false').lower() == 'true'

    # --- Groq Free-Tier Model Configuration ---
    # 100% Free API key from https://console.groq.com/keys
    # ZERO paid providers, zero billing fallback.
    groq_api_key: str | None = _get('GROQ_API_KEY')
    groq_api_url: str = _get('GROQ_API_URL', 'https://api.groq.com/openai/v1').rstrip('/')

    # Flagship model on Groq free tier (OpenAI GPT-OSS 120B or Qwen 3.8 27B)
    groq_model: str = _get('GROQ_MODEL', 'openai/gpt-oss-120b') or 'openai/gpt-oss-120b'

    # Multimodal Vision model on Groq free tier (Qwen 3.8 27B Vision)
    groq_vision_model: str = _get('GROQ_VISION_MODEL', 'qwen/qwen3.8-27b') or 'qwen/qwen3.8-27b'

    # Generation parameters tuned for structured reasoning and rate limits
    temperature: float = float(_get('TEMPERATURE', '0.2') or '0.2')
    max_tokens: int = int(_get('MAX_TOKENS', '1024') or '1024')

    # Knowledge Base / Optional RAG configuration
    knowledge_path: Path = ROOT_DIR / 'knowledge' / 'agri_knowledge.json'
    supabase_url: str = _get('VITE_SUPABASE_URL', '') or ''
    supabase_anon_key: str = _get('VITE_SUPABASE_ANON_KEY', '') or ''
    rag_top_k: int = int(_get('RAG_FINAL_COUNT', '3') or '3')
    rag_match_threshold: float = float(_get('RAG_MATCH_THRESHOLD', '0.25') or '0.25')


settings = Settings()
