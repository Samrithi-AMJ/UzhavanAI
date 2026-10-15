from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .advisor import get_advisory_reply
from .config import settings
from .disease_vision import analyze_crop_image
from .hosted_llm import (
    generate_chat,
    get_model_name,
    get_vision_model_name,
    is_llm_configured,
    HostedLLMError,
)
from .rag_retriever import load_local_knowledge
from .schemas import (
    ChatRequest,
    ChatResponse,
    ImageDiagnosisRequest,
    ImageDiagnosisResponse,
    CompleteRequest,
    CompleteResponse,
    GenerateRequest,
    GenerateResponse,
    SourceEntry,
)

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s in %(name)s: %(message)s')
logger = logging.getLogger('uzhavan-ai')

app = FastAPI(
    title='UzhavanAI Agricultural Advisory API',
    description='Independent LLM-powered farmer advisory system with Groq free-tier, optional RAG, and crop disease vision analysis.',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.exception_handler(HostedLLMError)
async def hosted_llm_error_handler(request: Request, exc: HostedLLMError):
    logger.error('Hosted LLM error on %s: %s (code: %s)', request.url.path, exc.message, exc.code)
    return JSONResponse(
        status_code=exc.status_code,
        content={'error': exc.code, 'message': exc.message, 'retry_after': exc.retry_after},
    )


@app.get('/')
@app.get('/health')
@app.get('/api/health')
async def health():
    docs = load_local_knowledge()
    configured = is_llm_configured()
    model = get_model_name()
    vision_model = get_vision_model_name()

    return {
        'ok': True,
        'service': 'uzhavan-ai-advisory',
        'aiServiceReachable': True,
        'model': model,
        'modelInstalled': configured,
        'llmConfigured': configured,
        'provider': 'groq-free-tier',
        'rag': {
            'knowledgeDocumentsLoaded': len(docs),
            'supabaseConfigured': bool(settings.supabase_url and settings.supabase_anon_key),
        },
        'imageDiagnosis': {
            'visionModel': vision_model,
            'visionModelInstalled': configured,
        },
    }



@app.post('/api/chat', response_model=ChatResponse)
@app.post('/chat', response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        msgs = list(req.messages) if req.messages else []
        if not msgs and req.message:
            msgs = [{'role': 'user', 'content': req.message}]

        result = await get_advisory_reply(
            messages=msgs,
            language=req.language,
            farmer=req.farmer,
            weather=req.weather,
        )
        return ChatResponse(
            reply=result['reply'],
            sources=result['sources'],
            grounding=result.get('grounding', 'general'),
            model=result.get('model', get_model_name()),
        )
    except HostedLLMError:
        raise
    except Exception as exc:
        logger.exception('Chat endpoint unhandled exception')
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post('/api/image-diagnosis', response_model=ImageDiagnosisResponse)
@app.post('/image-diagnosis', response_model=ImageDiagnosisResponse)
async def image_diagnosis_endpoint(req: ImageDiagnosisRequest):
    if not req.image or not req.image.strip():
        raise HTTPException(status_code=400, detail='No image provided.')

    try:
        diagnosis = await analyze_crop_image(
            image_base64=req.image,
            selected_crop=req.crop,
            language=req.language,
        )
        return ImageDiagnosisResponse(**diagnosis)
    except HostedLLMError:
        raise
    except Exception as exc:
        logger.exception('Image diagnosis unhandled exception')
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# Legacy backward-compatibility endpoints
@app.post('/generate', response_model=GenerateResponse)
async def legacy_generate(req: GenerateRequest):
    try:
        messages = [{'role': m.role, 'content': m.content} for m in req.conversation]
        if not messages:
            messages = [{'role': 'user', 'content': req.question}]

        result = await get_advisory_reply(
            messages=messages,
            language=req.language,
        )

        sources = [
            SourceEntry(title=s.get('title'), source=s.get('source'), url=s.get('url'))
            for s in result.get('sources', [])
        ]

        return GenerateResponse(
            answer=result['reply'],
            language=req.language,
            model=result.get('model', get_model_name()),
            grounded=bool(sources),
            sources=sources,
        )
    except Exception as exc:
        logger.exception('Legacy generate failed')
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post('/complete', response_model=CompleteResponse)
async def legacy_complete(req: CompleteRequest):
    try:
        messages = [{'role': m.role, 'content': m.content} for m in req.messages]
        text = await generate_chat(
            messages=messages,
            temperature=req.temperature or settings.temperature,
            max_tokens=settings.max_tokens,
        )
        return CompleteResponse(text=text)
    except Exception as exc:
        logger.exception('Legacy complete failed')
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post('/embed')
async def embed_endpoint(payload: dict):
    text = payload.get('text') if isinstance(payload, dict) else None
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=400, detail='text must be a non-empty string')
    try:
        from .hosted_llm import embed_text
        vector = await embed_text(text)
        return {'embedding': vector}
    except Exception as exc:
        logger.exception('Embedding failed')
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == '__main__':
    import uvicorn

    uvicorn.run('app.main:app', host=settings.host, port=settings.port, reload=settings.debug)

