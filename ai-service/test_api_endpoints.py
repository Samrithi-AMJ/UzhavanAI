import asyncio
import base64
import io
from PIL import Image

from app.main import app, health, chat_endpoint, image_diagnosis_endpoint
from app.schemas import ChatRequest, ImageDiagnosisRequest


def make_test_image(color=(34, 139, 34), size=(200, 200)):
    img = Image.new('RGB', size, color=color)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')


async def run_tests():
    print("=== Testing FastAPI Advisory System Endpoints ===")

    # 1. Test Health
    h = await health()
    print("\n[1] Health Check:")
    print("    Status OK:", h.get('ok'))
    print("    AI Service Reachable:", h.get('aiServiceReachable'))
    print("    Knowledge Documents:", h.get('rag', {}).get('knowledgeDocumentsLoaded'))
    print("    Model / Provider:", h.get('model'), "/", h.get('provider'))
    assert h.get('ok') is True
    assert h.get('rag', {}).get('knowledgeDocumentsLoaded') == 24

    # 2. Test Chat Endpoint (Graceful response when API key is missing or configured)
    print("\n[2] Chat Endpoint Test:")
    req = ChatRequest(
        messages=[{"role": "user", "content": "How do I manage clay soil with poor water infiltration?"}],
        language="en",
        farmer={"topCrop": "Rice", "farmSizeAcres": 2.5, "location": "Thanjavur, Tamil Nadu"},
        weather={"temperature": 29, "humidity": 82, "precipitationProbability": 60, "description": "Cloudy with chance of rain"}
    )
    chat_resp = await chat_endpoint(req)
    print("    Grounding:", chat_resp.grounding)
    print("    Sources count:", len(chat_resp.sources))
    if chat_resp.sources:
        print("    Top Source:", chat_resp.sources[0].title)
    print("    Reply preview:", chat_resp.reply[:120], "...")
    assert len(chat_resp.sources) > 0  # Verified RAG retrieval layer retrieved the clay soil doc!

    # 3. Test Multilingual Chat (Tamil)
    print("\n[3] Tamil Multilingual Chat Test:")
    req_ta = ChatRequest(
        messages=[{"role": "user", "content": "நெல் பயிரில் பூச்சி தாக்குதலை எவ்வாறு கட்டுப்படுத்துவது?"}],
        language="ta",
        farmer={"topCrop": "Rice"},
    )
    chat_resp_ta = await chat_endpoint(req_ta)
    print("    Tamil Grounding:", chat_resp_ta.grounding)
    print("    Tamil Sources count:", len(chat_resp_ta.sources))
    if chat_resp_ta.sources:
        print("    Top Tamil Source:", chat_resp_ta.sources[0].title)
    print("    Tamil Reply preview:", chat_resp_ta.reply[:120], "...")

    # 4. Test Image Diagnosis (Non-plant validation)
    print("\n[4] Image Diagnosis Test:")
    b64_img = make_test_image(color=(200, 200, 200))
    img_req = ImageDiagnosisRequest(image=b64_img, crop="Rice", language="en")
    img_resp = await image_diagnosis_endpoint(img_req)
    print("    Status:", img_resp.status)
    print("    Confidence:", img_resp.confidence)
    print("    Recommendation preview:", img_resp.recommendation[:100], "...")

    print("\n=== All endpoint unit tests executed successfully! ===")


if __name__ == '__main__':
    asyncio.run(run_tests())
