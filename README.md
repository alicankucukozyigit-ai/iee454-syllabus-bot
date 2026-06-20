# IEE 454 & 554 Syllabus Assistant

A chatbot that answers student questions about the IEE 454/554 Risk Management (Online) syllabus, taught by Dr. Ali Kucukozyigit at ASU. It answers strictly from the syllabus text and redirects students to the instructor's email when the syllabus doesn't cover something.

## How it works

- `syllabus.txt` holds the full syllabus text, embedded directly into the Claude API system prompt (no RAG/vector DB needed — the document is short).
- `app.py` is a Flask backend with a single `/api/chat` endpoint that calls the Anthropic API (`claude-sonnet-4-6`).
- The system prompt instructs the model to: answer only from the syllabus text, always reply in English (even if the student asks in another language), and when the syllabus doesn't cover the question, point the student to `akucukoz@asu.edu` instead of guessing.
- `templates/index.html` + `static/app.js` + `static/style.css` is a minimal chat UI. Bot replies are rendered as real markdown via `marked.js` + `DOMPurify` (loaded from CDN).

## Local setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in ANTHROPIC_API_KEY
python app.py          # serves on http://127.0.0.1:5050
```

## Deployment

- Repo: https://github.com/alicankucukozyigit-ai/iee454-syllabus-bot
- Hosted on Render.com (`render.yaml` defines the web service: `gunicorn app:app`).
- Render auto-deploys on every push to `main`.
- `ANTHROPIC_API_KEY` must be set manually in the Render dashboard's Environment tab — it is never committed to the repo (`.env` is gitignored).

## Updating the syllabus content

If the syllabus changes, edit `syllabus.txt` directly (it's the plain-text source of truth the bot reads from) and push — no other code changes needed.

## Embedding in Canvas

Once deployed, the Render URL can be added to a Canvas page either as a direct link (simplest, avoids iframe/CSP issues) or embedded via an `<iframe>` in the Canvas Rich Content Editor's HTML view, provided ASU's Canvas instance allows external iframes.
