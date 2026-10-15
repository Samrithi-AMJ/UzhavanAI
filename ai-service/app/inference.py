from __future__ import annotations

import logging

import torch

from .config import settings
from .model_loader import get_model, get_tokenizer

logger = logging.getLogger(__name__)


def generate_messages(
    messages: list[dict[str, str]],
    *,
    temperature: float | None = None,
) -> str:
    model = get_model()
    tokenizer = get_tokenizer()

    # Build the TinyLlama chat prompt.
    try:
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )
    except Exception:
        # Safe fallback for models/tokenizers without a usable chat template.
        parts = []

        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")

            if role == "system":
                parts.append(f"<|system|>\n{content}")
            elif role == "user":
                parts.append(f"<|user|>\n{content}")
            elif role == "assistant":
                parts.append(f"<|assistant|>\n{content}")

        prompt = "\n".join(parts) + "\n<|assistant|>\n"

    # Tokenize.
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
    )

    # Move tensors to the same device as the model.
    device = next(model.parameters()).device

    inputs = {
        key: value.to(device) if hasattr(value, "to") else value
        for key, value in inputs.items()
    }

    input_length = inputs["input_ids"].shape[-1]

    # Generation parameters.
    temp = (
        temperature
        if temperature is not None
        else settings.temperature
    )

    # Avoid invalid temperature values.
    if temp <= 0:
        do_sample = False
        temp = 1.0
    else:
        do_sample = True

    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            max_new_tokens=settings.max_new_tokens,
            temperature=temp,
            top_p=settings.top_p,
            do_sample=do_sample,
            pad_token_id=tokenizer.eos_token_id,
        )

    # Decode only the newly generated tokens.
    generated_tokens = outputs[0][input_length:]

    answer = tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True,
    ).strip()

    if not answer:
        raise ValueError("Model returned an empty answer.")

    logger.info(
        "Generated response successfully: %d new tokens",
        len(generated_tokens),
    )

    return answer


def generate_answer(
    prompt: str,
    *,
    language: str = "en",
) -> str:
    return generate_messages(
        [
            {
                "role": "system",
                "content": (
                    "You are UzhavanAI, a practical agricultural "
                    "advisor for Indian farmers."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=settings.temperature,
    )