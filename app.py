from flask import Flask, render_template, request, jsonify, session
import os
import google.generativeai as genai

import json
import re

app = Flask(__name__)
app.secret_key = "secure-session-key-change-this"

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction="""
You are an educational hint assistant.

STRICT RULES:
- You do NOT know the correct answer.
- You MUST NOT reveal answers.
- You MUST NOT validate answers.
- You MUST NOT advance questions.
- You MUST NOT use external knowledge.
- You may ONLY:
  • Provide hints
  • Rephrase the question
  • Encourage exploration based on the question text

If the user asks for the answer directly, politely refuse.
"""
)

QUESTIONS = [
    {
        "id": 1,
        "text": """This Rick and Morty-themed challenge requires you to exploit a web server and find three ingredients to help Rick make his potion and transform himself back into a human from a pickle.

Deploy the virtual machine on this task and explore the web application: MACHINE_IP

What is the first ingredient that Rick needs?""",
        "answer": "pickle"
    },
    {
        "id": 2,
        "text": "What is the second ingredient in Rick’s potion?",
        "answer": "mango"
    }
]

def get_current_question():
    idx = session.get("question_index", 0)
    if idx < len(QUESTIONS):
        return QUESTIONS[idx]
    return None

def injection_detected(text):
    banned = ["answer", "solve", "correct", "tell me", "what is the answer"]
    return any(b in text.lower() for b in banned)

@app.route("/")
def index():
    if session.get("question_index", 0) >= len(QUESTIONS):
        session["question_index"] = 0

    q = get_current_question()
    question_text = q["text"] if q else "Assessment complete!"
    return render_template("index.html", question=question_text)

@app.route("/submit-answer", methods=["POST"])
def submit_answer():
    data = request.json
    user_answer = data.get("answer", "").strip().lower()

    q = get_current_question()
    if not q:
        return jsonify({"status": "done"})

    if user_answer == q["answer"]:
        session["question_index"] += 1
        next_q = get_current_question()
        return jsonify({
            "status": "correct",
            "message": "Good! Moving to next question",
            "next_question": next_q["text"] if next_q else "Assessment complete!"
        })

    return jsonify({
        "status": "incorrect",
        "message": "Incorrect. Please try again."
    })

@app.route("/restart", methods=["POST"])
def restart_session():
    session["question_index"] = 0
    session["assessment_started"] = False
    q = get_current_question()
    return jsonify({
        "status": "restarted",
        "first_question": q["text"] if q else "No questions found"
    })

@app.route("/start-assessment", methods=["POST"])
def start_assessment():
    session["assessment_started"] = True
    return jsonify({"status": "started"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "")
    context = data.get("context", "general")

    if len(user_message) > 200:
        return jsonify({"reply": "Message too long. Please keep it under 200 characters.", "navigation": None})

    navigation_instruction = """
If the user explicitly asks to go, navigate, or move to a specific section, you must include a "navigation" key in your JSON response.
Sections are: #home, #about, #questions, #contact, #social.

IMPORTANT: You must ALWAYS respond in valid JSON format.
Your JSON must have TWO keys:
1. "reply": The text response to the user.
2. "navigation": The section ID string (e.g., "#home") if navigation is needed, or null if not.

Example 1 (Navigation + help):
{"reply": "Sure, I can take you to the questions section. Here we are!", "navigation": "#questions"}

Example 2 (Just chat):
{"reply": "This site helps you learn about web security.", "navigation": null}
"""

    assessment_started = session.get("assessment_started", False)

    if context == "questions":
        if injection_detected(user_message):
            return jsonify({"reply": "I can’t help with answers, but I can guide you toward understanding the question.", "navigation": None})

        q = get_current_question()
        if not q:
            return jsonify({"reply": "You have completed all questions. Feel free to explore the rest of the site!", "navigation": None})

        prompt = f"""
{navigation_instruction}

Otherwise, use the following context.
STRICT INSTRUCTION 1: Check if the STUDENT MESSAGE is gibberish (random characters, no meaning). If it is, IGNORE everything else and reply with JSON: {{"reply": "That looks like gibberish. Could you please rephrase?", "navigation": null}}

STRICT INSTRUCTION 2: Assessment Started Status: {assessment_started}.
If "Assessment Started Status" is False:
- If the student asks about the question, ingredients, or the challenge, reply with JSON: {{"reply": "Please click 'Start Challenge' on the screen to begin the assessment before asking questions.", "navigation": null}}
- If the student asks about navigation (e.g., "go to home") or general site info, ANSWER normally using the JSON format.

QUESTION CONTEXT:
{q["text"]}

STUDENT MESSAGE:
{user_message}
"""
    else:
        prompt = f"""
{navigation_instruction}

Otherwise, you are a helpful guide for a dummy website.
STRICT INSTRUCTION: Check if the user query is gibberish. If it is, reply with JSON: {{"reply": "That looks like gibberish. Could you please rephrase?", "navigation": null}}

The website has main sections: detailed in the user's scroll.
Currently the user is in the '{context}' section.

User is currently asking: "{user_message}"

Provide a helpful, polite, and brief response guiding them given the current section they are in.
"""

    response = model.generate_content(prompt)
    
    # Parse the response
    try:
        text_resp = response.text.strip()
        # Clean potential markdown code blocks
        if "```" in text_resp:
            text_resp = re.sub(r"```(json)?|```", "", text_resp).strip()
        
        resp_json = json.loads(text_resp)
        reply_text = resp_json.get("reply", "I'm not sure how to respond to that.")
        nav_target = resp_json.get("navigation", None)
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        # Fallback if the LLM fails to produce valid JSON
        reply_text = response.text
        nav_target = None
        
    return jsonify({"reply": reply_text, "navigation": nav_target})

if __name__ == "__main__":
    app.run(debug=True)
