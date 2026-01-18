import os
import httpx
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

PPLX_API_KEY = os.getenv("PPLX_API_KEY", "")

class AISuggestRequest(BaseModel):
    template: str
    findings: str
    clinical_history: str | None = None

@app.get("/", response_class=HTMLResponse)
def home():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/api/ai/suggest")
async def ai_suggest(req: AISuggestRequest):
    if not PPLX_API_KEY:
        return {"error": "PPLX_API_KEY is missing. Set it before running."}

    payload = {
        "model": "sonar-pro",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a radiology reporting assistant. "
                    "Use the provided template. "
                    "Do not invent findings. If missing info, write 'Not provided'."
                ),
            },
            {
                "role": "user",
                "content": f"""TEMPLATE:
{req.template}

CLINICAL HISTORY:
{req.clinical_history or "Not provided"}

FINDINGS (free text):
{req.findings}

Write a complete report with clear headings and an Impression.""",
            },
        ],
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {PPLX_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        r.raise_for_status()
        data = r.json()

    return {"report": data["choices"][0]["message"]["content"]}
