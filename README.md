# UzhavanAI — LLM-Powered Farmer Advisory System (Groq Free-Tier)

An independent, LLM-powered agricultural advisory system built for Indian farmers. Integrates a single multimodal hosted LLM directly into a FastAPI backend using **Groq's 100% free-tier API**, with an optional RAG knowledge-retrieval layer, crop disease vision analysis, and full multilingual support across 6 Indian languages.

**Zero paid APIs, zero billing accounts, zero Ollama, zero agent frameworks.**

---

## 🌾 Features

- **Groq Free-Tier LLM**: Powered by `llama-3.3-70b-versatile` (and `llama-3.1-8b-instant`), providing ultra-fast inference and deep multilingual reasoning without any cloud costs.
- **Multilingual Support (6 Languages)**: Understands and responds natively in:
  - **Tamil** (தமிழ்)
  - **English**
  - **Hindi** (हिंदी)
  - **Telugu** (తెలుగు)
  - **Bengali** (বাংলা)
  - **Marathi** (मराठी)
- **Crop Disease Image Analysis**: Uses Groq's free-tier multimodal vision model (`llama-3.2-11b-vision-preview`).
  - **Strict Irrelevant Image Validation**: Non-plant photos (vehicles, people, buildings, objects) are identified and classified as `NOT_A_PLANT`.
  - **Strict Anti-False-Healthy Rule**: Ambiguous or blurry plant images return `UNCERTAIN` and are **never** automatically labeled healthy.
  - **Token Optimization**: Large uploads are automatically downsampled to 768px JPEG by the backend to fit safely within Groq's Tokens-Per-Minute (TPM) limits while preserving leaf pathology details.
- **Graceful Free-Tier Rate Limit Handling**: If Groq's free-tier rate limits (30 RPM / 6,000 TPM) are briefly exceeded, UzhavanAI catches HTTP 429 gracefully and returns a polite wait notice in the farmer's selected language, while still displaying any retrieved RAG reference sources.
- **Optional RAG Knowledge Layer**: Automatically retrieves verified reference data (soils, irrigation, pest & disease IPM, fertilizers, and crops from TNAU & ICAR extension research) without agent loops or fragile chains.
- **Zero Paid Usage Enforcement**: Configured exclusively for Groq's free tier. Never silently switches to paid providers or enables billing.
- **Full Feature Preservation**: React + TypeScript UI, Supabase authentication & database (profiles, farm boundaries, chat history, weather, crop recommendations).
- **Secure Backend API Keys**: All API secrets are stored strictly on the backend (`.env`) and are never exposed to the frontend/browser.

---

## 📊 Honest Free-Tier Limits & Specifications

To ensure complete transparency, here are the exact limits of the free-tier services used:

| Service | Free-Tier Allocation | Limitations & Behavior |
| :--- | :--- | :--- |
| **Groq (`llama-3.3-70b-versatile`)** | Free API tier | 30 Requests/Min (RPM), 1,000 Requests/Day (RPD), 6,000 Tokens/Min (TPM). |
| **Groq (`llama-3.1-8b-instant`)** | Free API tier | 30 RPM, 14,400 RPD, 30,000 TPM (fast alternative for high volume). |
| **Groq Vision (`llama-3.2-11b-vision-preview`)** | Free API tier | 30 RPM, 1,000 RPD, ~7,000 TPM. Handled with automatic image downsampling. |
| **Supabase** | Free Hobby tier | 500 MB database, 50,000 monthly active users, 2 projects. |
| **Vercel (Frontend)** | Free Hobby tier | 100 GB bandwidth / month, automatic SSL, global CDN. |
| **Render (Backend)** | Free Web Service tier | 750 free instance hours / month. Spins down on 15 mins of inactivity, restarts on first request (~30s spinup). |

---

## 🏛️ Architecture

```
                    React + Vite Frontend (Port 5173)
                                  │
                                  │ HTTP (/api/*)
                                  ▼
                     Node.js Gateway (Port 8787)
                                  │
                                  │ Proxy
                                  ▼
                    FastAPI AI Service (Port 8001)
                    ├── Groq Free-Tier LLM (Llama 3.3 70B / 3.1 8B)
                    ├── Groq Free-Tier Vision (Llama 3.2 11B Vision)
                    └── Optional RAG Layer (agri_knowledge.json / Supabase)
```

---

## 🚀 Local Setup & Run Guide

### 1. Configure Environment (`.env`)

In the project root, ensure [.env](file:///.env) contains your Supabase credentials and your free Groq API key:

```ini
# Supabase
VITE_SUPABASE_URL=https://nzytnnwakotqxgyixttc.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Groq Free-Tier Model API (Get free key from https://console.groq.com/keys)
GROQ_API_KEY=gsk_your-free-groq-key-here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=llama-3.2-11b-vision-preview

# Endpoints
AI_HOST=127.0.0.1
AI_PORT=8001
AI_SERVICE_URL=http://127.0.0.1:8001
BACKEND_PORT=8787
VITE_BACKEND_URL=http://localhost:8787
```

### 2. Start the FastAPI AI Backend (Terminal 1)

```powershell
npm run ai:service
```

*Or directly with Python:*
```powershell
.\ai-service\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir ai-service --host 127.0.0.1 --port 8001
```

### 3. Start the Backend Gateway (Terminal 2)

```powershell
npm run server
```

### 4. Start the Frontend (Terminal 3)

```powershell
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🌐 100% Free Production Deployment Guide

You can host both the frontend and backend permanently on free-tier platforms:

### A. Deploy FastAPI Backend on Render (Free)

1. Push your code to a GitHub repository.
2. Sign up on [Render.com](https://render.com) (free).
3. Click **New +** -> **Web Service** -> Connect your GitHub repo.
4. Settings:
   - **Name**: `uzhavan-ai-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r ai-service/requirements.txt`
   - **Start Command**: `uvicorn app.main:app --app-dir ai-service --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: Your key from https://console.groq.com/keys
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
   - `GROQ_VISION_MODEL`: `llama-3.2-11b-vision-preview`
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click **Deploy**. Note your service URL (e.g. `https://uzhavan-ai-backend.onrender.com`).

---

### B. Deploy React Frontend on Vercel (Free)

1. Sign up on [Vercel.com](https://vercel.com) (free).
2. Click **Add New...** -> **Project** -> Import your GitHub repo.
3. Framework Preset: **Vite** (auto-detected).
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_BACKEND_URL`: Your Render backend URL (`https://uzhavan-ai-backend.onrender.com`)
5. Click **Deploy**.
   *(SPA routing is handled automatically by the included `vercel.json`).*

---

## 🧪 Testing & Verification

Run the test suite to verify the Groq backend, RAG retrieval, multilingual reasoning, and crop disease vision analysis:

```powershell
$env:PYTHONIOENCODING="utf-8"; .\ai-service\.venv\Scripts\python.exe ai-service/test_api_endpoints.py
```
