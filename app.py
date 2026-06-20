import os
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
SYLLABUS_TEXT = (BASE_DIR / "syllabus.txt").read_text(encoding="utf-8")

MODEL = "claude-sonnet-4-6"
MAX_HISTORY_TURNS = 10

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = f"""You are the syllabus assistant for IEE 454 & 554 Risk Management (Online), taught by \
Dr. Ali Kucukozyigit at Arizona State University. Students will ask you questions about the course.

ALWAYS respond in English, regardless of what language the student writes in.

Answer ONLY using the syllabus text provided below. Do not use outside knowledge, do not guess, and do not \
make up dates, policies, or numbers that are not in the text. Never generate an answer from anything other \
than the syllabus text below.

If the syllabus answers the question, answer clearly and cite the relevant policy in your own words. You may \
quote short phrases from the syllabus when it helps precision (e.g. exact percentages or deadlines).

If the syllabus does NOT contain enough information to answer the question, do not attempt to answer it. \
Instead, reply only with a short message telling the student the syllabus does not cover this, and direct them \
to email Professor Kucukozyigit at akucukoz@asu.edu (from their official ASU email account) or visit office hours.

=== SYLLABUS TEXT ===
{SYLLABUS_TEXT}
=== END SYLLABUS TEXT ===
"""

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not message:
        return jsonify({"error": "Empty message"}), 400

    messages = []
    for turn in history[-MAX_HISTORY_TURNS:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    reply = "".join(block.text for block in response.content if block.type == "text")
    return jsonify({"reply": reply})


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG") == "1"
    port = int(os.environ.get("PORT", 5050))
    app.run(debug=debug, host="0.0.0.0", port=port)
