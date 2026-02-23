import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# Request body structure
class AnalyzeRequest(BaseModel):
    message: str

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    system_prompt = (
        "You are a customer support copilot for e-commerce stores. "
        "Return ONLY valid JSON. No markdown. No extra text. "
        "Never promise a refund/replacement is already approved. "
        "Instead, say you can help and list what you need to proceed (order number, photos, confirmation). "
        "Be polite, concise, brand-safe."
    )

    user_prompt = f"""
    Return a JSON object with EXACT keys:
    - intent: one of ["order_status","refund_request","replacement_request","wrong_item","damaged_item","info_missing","other"]
    - entities: {{
        "order_number": string or null,
        "issue_type": string,
        "sentiment": one of ["angry","neutral","polite"]
        }}
    - recommended_action: one of ["ask_for_photos","ask_for_order_number","provide_tracking_update","offer_replacement_after_verification","offer_refund_after_verification","escalate_to_human"]
    - reply: string (professional, brand-safe, ready to send)

    Message:
    {req.message}

    Return ONLY JSON.
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )

    result_text = response.choices[0].message.content.strip()
    print("MODEL RAW OUTPUT:\n", result_text)

    # Try parsing JSON safely
    try:
        result = json.loads(result_text)
    except:
        result = {
            "intent": "other",
            "entities": {
                "order_number": None,
                "issue_type": "unknown",
                "sentiment": "neutral"
            },
            "recommended_action": "escalate_to_human",
            "reply": "Thanks for reaching out — we’re looking into this and will get back to you shortly."
        }

    return result