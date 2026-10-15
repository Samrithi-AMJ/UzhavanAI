from __future__ import annotations

import asyncio
import base64
import io
import json
import logging
import urllib.error
import urllib.request
from typing import Any

from PIL import Image

try:
    import httpx
except ImportError:
    httpx = None

from .config import settings

logger = logging.getLogger(__name__)


class HostedLLMError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 500, retry_after: int | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.retry_after = retry_after


def is_llm_configured() -> bool:
    return bool(settings.groq_api_key and settings.groq_api_key.strip())


def get_model_name() -> str:
    if is_llm_configured():
        return f"Groq/{settings.groq_model}"
    return 'Groq (Free-Tier API Key Missing)'


def get_vision_model_name() -> str:
    if is_llm_configured():
        return f"Groq/{settings.groq_vision_model}"
    return 'Groq Vision (Free-Tier API Key Missing)'


def _optimize_image_for_groq(b64_string: str, max_dim: int = 768) -> tuple[str, str]:
    """
    Downsamples and compresses uploaded images before sending to Groq vision.
    This drastically reduces visual token count, protecting against Groq free-tier
    TPM (Tokens Per Minute) exhaustion while preserving leaf pathology details.
    """
    try:
        raw_bytes = base64.b64decode(b64_string)
        with Image.open(io.BytesIO(raw_bytes)) as img:
            img = img.convert('RGB')
            w, h = img.size
            if max(w, h) > max_dim:
                scale = max_dim / float(max(w, h))
                new_size = (int(w * scale), int(h * scale))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            out_buf = io.BytesIO()
            img.save(out_buf, format='JPEG', quality=82, optimize=True)
            optimized_b64 = base64.b64encode(out_buf.getvalue()).decode('utf-8')
            return optimized_b64, 'image/jpeg'
    except Exception as exc:
        logger.warning('Could not optimize image, sending original: %s', exc)
        return b64_string, 'image/jpeg'


async def _post_json(url: str, payload: dict[str, Any], headers: dict[str, str], timeout: float = 40.0) -> tuple[int, dict[str, Any], dict[str, str]]:
    """
    Performs an HTTP POST request using httpx if available, or Python standard
    library urllib.request as a zero-dependency fallback.
    """
    if httpx is not None:
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
                data = resp.json() if resp.headers.get('content-type', '').startswith('application/json') else {}
                return resp.status_code, data, dict(resp.headers)
        except httpx.TimeoutException as exc:
            raise HostedLLMError('TIMEOUT', 'Groq request timed out. Please try again.', status_code=504) from exc
        except httpx.RequestError as exc:
            raise HostedLLMError('NETWORK_ERROR', f'Failed to connect to Groq API: {exc}', status_code=502) from exc
    else:
        req_data = json.dumps(payload).encode('utf-8')
        req_headers = {**headers, 'Content-Type': 'application/json'}
        req = urllib.request.Request(url, data=req_data, headers=req_headers, method='POST')

        def _sync_post():
            try:
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    body = json.loads(response.read().decode('utf-8'))
                    return response.status, body, dict(response.headers)
            except urllib.error.HTTPError as err:
                try:
                    body = json.loads(err.read().decode('utf-8'))
                except Exception:
                    body = {}
                return err.code, body, dict(err.headers)
            except TimeoutError as exc:
                raise HostedLLMError('TIMEOUT', 'Groq request timed out. Please try again.', status_code=504) from exc
            except urllib.error.URLError as exc:
                raise HostedLLMError('NETWORK_ERROR', f'Failed to connect to Groq API: {exc}', status_code=502) from exc

        return await asyncio.to_thread(_sync_post)


async def generate_chat(
    messages: list[dict[str, str]],
    system_instruction: str = '',
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> str:
    """
    Generates text chat completions exclusively using Groq's free tier.
    Enforces zero paid fallback and handles free-tier rate limits gracefully.
    """
    if not is_llm_configured():
        raise HostedLLMError(
            'API_KEY_MISSING',
            'No Groq API key configured. Please add your free GROQ_API_KEY from https://console.groq.com/keys to .env.',
            status_code=503,
        )

    url = f"{settings.groq_api_url}/chat/completions"
    headers = {
        'Authorization': f'Bearer {settings.groq_api_key}',
        'Content-Type': 'application/json',
        'User-Agent': 'UzhavanAI/1.0',
    }

    full_messages = []
    if system_instruction.strip():
        full_messages.append({'role': 'system', 'content': system_instruction.strip()})
    for m in messages:
        content = m.get('content', '').strip()
        if content:
            full_messages.append({'role': m.get('role', 'user'), 'content': content})

    if not full_messages:
        raise HostedLLMError('EMPTY_PROMPT', 'No message content provided.', status_code=400)

    payload = {
        'model': settings.groq_model,
        'messages': full_messages,
        'temperature': max(0.0, min(1.0, temperature if temperature is not None else settings.temperature)),
        'max_tokens': max_tokens if max_tokens is not None else settings.max_tokens,
    }

    status_code, data, resp_headers = await _post_json(url, payload, headers, timeout=40.0)

    if status_code == 429:
        # Free-tier rate limit reached (RPM, TPM, or RPD)
        retry_header = resp_headers.get('retry-after')
        retry_seconds = int(retry_header) if retry_header and retry_header.isdigit() else 30
        err_detail = data.get('error', {}).get('message') or 'Groq free-tier rate limit exceeded.'
        logger.warning('Groq rate limit hit (429): %s (retry after %ss)', err_detail, retry_seconds)
        raise HostedLLMError(
            'RATE_LIMIT_EXCEEDED',
            f"Groq free-tier rate limit reached. Please wait {retry_seconds} seconds before asking again.",
            status_code=429,
            retry_after=retry_seconds,
        )

    if status_code == 401:
        raise HostedLLMError(
            'INVALID_API_KEY',
            'Invalid Groq API key. Check your GROQ_API_KEY in .env.',
            status_code=401,
        )

    if status_code != 200:
        err_msg = data.get('error', {}).get('message') or f"Groq API returned HTTP {status_code}"
        logger.error('Groq API error (%s): %s', status_code, err_msg)
        raise HostedLLMError('GROQ_API_ERROR', err_msg, status_code=status_code)

    choices = data.get('choices', [])
    if not choices:
        raise HostedLLMError('EMPTY_RESPONSE', 'Groq returned no completion choices.')

    reply_text = choices[0].get('message', {}).get('content', '').strip()
    return reply_text


async def generate_vision(
    image_base64: str,
    prompt: str,
    system_instruction: str = '',
    response_json: bool = True,
) -> str:
    """
    Performs multimodal plant image analysis using Groq's free-tier vision model
    (Llama 3.2 11B Vision Preview). Downsamples images to protect free-tier TPM limits.
    """
    if not is_llm_configured():
        raise HostedLLMError(
            'API_KEY_MISSING',
            'No Groq API key configured for vision. Add your free GROQ_API_KEY from https://console.groq.com/keys to .env.',
            status_code=503,
        )

    # Clean and optimize image
    cleaned_b64 = image_base64.split(',', 1)[1] if ',' in image_base64 else image_base64
    optimized_b64, mime_type = _optimize_image_for_groq(cleaned_b64.strip(), max_dim=768)

    url = f"{settings.groq_api_url}/chat/completions"
    headers = {
        'Authorization': f'Bearer {settings.groq_api_key}',
        'Content-Type': 'application/json',
        'User-Agent': 'UzhavanAI/1.0',
    }

    full_messages = []
    if system_instruction.strip():
        full_messages.append({'role': 'system', 'content': system_instruction.strip()})

    user_content: list[dict[str, Any]] = [
        {'type': 'text', 'text': prompt},
        {
            'type': 'image_url',
            'image_url': {
                'url': f'data:{mime_type};base64,{optimized_b64}',
            },
        },
    ]
    full_messages.append({'role': 'user', 'content': user_content})

    payload: dict[str, Any] = {
        'model': settings.groq_vision_model,
        'messages': full_messages,
        'temperature': 0.1,  # Low temperature for stable pathology classification
        'max_tokens': 1200,
    }
    if response_json:
        payload['response_format'] = {'type': 'json_object'}

    status_code, data, resp_headers = await _post_json(url, payload, headers, timeout=50.0)

    if status_code == 429:
        retry_header = resp_headers.get('retry-after')
        retry_seconds = int(retry_header) if retry_header and retry_header.isdigit() else 30
        logger.warning('Groq vision rate limit hit (429): retry after %ss', retry_seconds)
        raise HostedLLMError(
            'RATE_LIMIT_EXCEEDED',
            f"Groq free-tier vision rate limit reached. Please wait {retry_seconds} seconds before analyzing another image.",
            status_code=429,
            retry_after=retry_seconds,
        )

    if status_code == 401:
        raise HostedLLMError('INVALID_API_KEY', 'Invalid Groq API key.', status_code=401)

    if status_code != 200:
        err_msg = data.get('error', {}).get('message') or f"Groq vision returned HTTP {status_code}"
        logger.error('Groq vision error (%s): %s', status_code, err_msg)
        raise HostedLLMError('VISION_API_ERROR', err_msg, status_code=status_code)

    choices = data.get('choices', [])
    if not choices:
        raise HostedLLMError('EMPTY_RESPONSE', 'Groq vision returned no response choices.')

    return choices[0].get('message', {}).get('content', '').strip()


async def embed_text(text: str) -> list[float]:
    """
    Local embedding using sentence-transformers (100% free, runs locally with no external API).
    Used for optional knowledge-base indexing when needed.
    """
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-mpnet-base-v2')
        vec = model.encode(text, normalize_embeddings=True).tolist()
        return [float(x) for x in vec]
    except Exception as exc:
        raise HostedLLMError('EMBEDDING_UNAVAILABLE', f'Local embedding unavailable: {exc}')
