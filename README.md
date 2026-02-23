# Refund Copilot (AI Chrome Extension)

AI-powered Chrome extension + Python backend that generates optimized refund request messages using LLMs.

## What it does
- User enters a purchase/refund scenario in the extension
- Extension sends the scenario to a Python backend endpoint
- Backend returns a structured, high-quality refund request message

## Tech Stack
- Chrome Extension: JavaScript, HTML (Manifest V3)
- Backend: Python
- LLM: OpenAI API (key stored locally via environment variables)

## How to run (dev)
### Backend
1. `cd refund-copilot-backend`
2. `pip install -r requirements.txt`
3. Set `OPENAI_API_KEY` in a `.env` file (not committed)
4. `python main.py`

### Extension
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `refund-copilot-extension/`

## Status
🚧 In progress — improving prompt quality, UX, and reliability.
