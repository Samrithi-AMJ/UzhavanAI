from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

from .config import settings

logger = logging.getLogger(__name__)

_model = None
_tokenizer = None
_lora_loaded = False
_load_error = None


def _detect_device() -> str:
    if settings.device == 'auto':
        if torch.cuda.is_available():
            return 'cuda'
        return 'cpu'
    return settings.device


def load_model_and_tokenizer() -> tuple[Any, Any, str]:
    global _model, _tokenizer, _lora_loaded, _load_error

    if _model is not None and _tokenizer is not None:
        return _model, _tokenizer, _detect_device()

    device = _detect_device()
    logger.info('Loading model on %s', device)

    base_model = settings.model_path or settings.model_name
    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16 if device == 'cuda' else torch.float32,
        low_cpu_mem_usage=True,
        device_map='auto' if device == 'cuda' else None,
    )

    if settings.lora_path:
        adapter_path = Path(settings.lora_path).expanduser()
        if adapter_path.exists():
            model = PeftModel.from_pretrained(model, str(adapter_path))
            model.eval()
            _lora_loaded = True
        else:
            logger.warning('Configured LoRA adapter was not found at %s; using the base model.', adapter_path)

    if device == 'cpu':
        model.to('cpu')

    _tokenizer = tokenizer
    _model = model
    logger.info('Model loaded successfully')
    return _model, _tokenizer, device


def model_status() -> dict[str, Any]:
    return {
        'base_model': settings.model_path or settings.model_name,
        'base_model_loaded': _model is not None,
        'lora_path': settings.lora_path or None,
        'lora_loaded': _lora_loaded,
        'load_error': _load_error,
    }


def get_model() -> Any:
    if _model is None:
        load_model_and_tokenizer()
    return _model


def get_tokenizer() -> Any:
    if _tokenizer is None:
        load_model_and_tokenizer()
    return _tokenizer
