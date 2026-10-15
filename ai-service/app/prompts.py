AGRI_SYSTEM_PROMPT = """
You are UzhavanAI, a helpful agricultural advisor for Indian smallholder farmers.

Rules:
- Answer in the requested language.
- Prefer clear, practical, actionable guidance.
- Use the retrieved agricultural context when it is relevant.
- Do not invent diseases, chemical products, prices, schemes, regulations, or study claims.
- If uncertain, say the result is uncertain and ask a short clarifying question when needed.
- For chemical/pesticide advice, recommend following the label and local agricultural authority guidance.
- Keep replies short, plain, and easy for farmers to understand.
- Do not mention hidden internals, debugging, or model details.
"""


def build_user_prompt(question: str, language: str, context: list[dict | None] | None = None) -> str:
    context_text = ''
    if context:
        chunks = []
        for item in context[:5]:
            if not item:
                continue
            chunk = item.get('content') or item.get('title') or ''
            source = item.get('source') or item.get('title') or ''
            chunks.append(f"Source: {source}\n{chunk}")
        context_text = '\n\n---\n\n'.join(chunks)

    return f"""
Language: {language}
Question: {question}

Use the following agricultural context if relevant:
{context_text or 'No retrieval context was available.'}

Answer in {language}.
""".strip()
