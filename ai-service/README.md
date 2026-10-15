# UzhavanAI Python AI Service

This service provides the local inference layer for the agricultural advisor.

## Start locally

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r ai-service\requirements.txt
npm run ai:service
```

## Environment

Set values in the root `.env` file:

- `AI_SERVICE_URL=http://127.0.0.1:8001`
- `AI_HOST=127.0.0.1`
- `AI_PORT=8001`
- `MODEL_NAME=TinyLlama/TinyLlama-1.1B-Chat-v1.0`
- `MODEL_PATH=` (optional local model cache)
- `LORA_PATH=` (optional local LoRA adapter)
- `MAX_NEW_TOKENS=256`
- `TEMPERATURE=0.3`
- `TOP_P=0.95`
- `EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-mpnet-base-v2`

## Notes

- The Node backend remains the public gateway.
- The app still uses Supabase pgvector retrieval and the domain gate.
- Only the final generation step routes to the local Python model service.
- No external cloud LLM API is required.

## Fine-tuning workflow

```bash
npm run ai:prepare-data
npm run ai:train
npm run ai:evaluate
```

The trainer writes only a LoRA adapter. Set `LORA_PATH` to that adapter and
keep `MODEL_NAME` or `MODEL_PATH` pointed at the same base model for serving.
