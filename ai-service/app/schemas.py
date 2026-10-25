from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


class Message(BaseModel):
    role: Literal['user', 'assistant', 'system']
    content: str


class ChatRequest(BaseModel):
    messages: list[dict[str, Any]] = Field(default_factory=list)
    message: str | None = None
    language: str = Field(default='en')
    farmer: dict[str, Any] | None = None
    weather: dict[str, Any] | str | None = None


class KnowledgeSource(BaseModel):
    title: str
    source: str
    url: str | None = None


class ChatResponse(BaseModel):
    reply: str
    sources: list[KnowledgeSource] = Field(default_factory=list)
    grounding: Literal['rag', 'general', 'refused'] = 'general'
    model: str = 'UzhavanAI'


class ImageDiagnosisRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string")
    crop: str | None = Field(default=None)
    language: str = Field(default='en')


class ImageDiagnosisResponse(BaseModel):
    status: str
    identifiedCrop: str | None = None
    suspectedIssueName: str | None = None
    observedSymptoms: list[str] = Field(default_factory=list)
    affectedParts: list[str] = Field(default_factory=list)
    visualEvidence: list[str] = Field(default_factory=list)
    possibleCauses: list[str] = Field(default_factory=list)
    severity: Literal['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'] = 'UNKNOWN'
    recommendation: str = ''
    confidence: float = 0.0


class TranscribeRequest(BaseModel):
    audio: str = Field(..., description="Base64 encoded audio string")
    mime_type: str = Field(default="audio/webm", description="MIME type of the audio")
    language: str | None = Field(default=None, description="ISO language code, e.g. ta, hi, en")


class TranscribeResponse(BaseModel):
    text: str
    language: str | None = None


# Legacy endpoints support
class GenerateRequest(BaseModel):
    question: str = Field(..., min_length=1)
    language: str = Field(default='en')
    context: list[dict[str, Any]] = Field(default_factory=list)
    conversation: list[Message] = Field(default_factory=list)


class SourceEntry(BaseModel):
    id: str | None = None
    doc_id: str | None = None
    chunk_index: int | None = None
    similarity: float | None = None
    title: str | None = None
    crop: str | None = None
    category: str | None = None
    language: str | None = None
    content: str | None = None
    source: str | None = None
    url: str | None = None


class GenerateResponse(BaseModel):
    answer: str
    language: str
    model: str = 'UzhavanAI'
    grounded: bool = True
    sources: list[SourceEntry] = Field(default_factory=list)


class CompleteRequest(BaseModel):
    messages: list[Message] = Field(default_factory=list)
    temperature: float | None = None
    response_format: Literal['text', 'json'] = 'text'


class CompleteResponse(BaseModel):
    text: str
