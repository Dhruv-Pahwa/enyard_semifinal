from flask import Flask, render_template, request, jsonify, session
import os
import google.generativeai as genai

app = Flask(__name__)
app.secret_key = "secure-session-key-change-this"

# ---------------- CONFIGURE GEMINI ----------------
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

# ---------------- QUESTIONS (BACKEND AUTHORITY) ----------------
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

# ---------------- UTILS ----------------
def get_current_question():
    idx = session.get("question_index", 0)
    if idx < len(QUESTIONS):
        return QUESTIONS[idx]
    return None

def injection_detected(text):
    banned = ["answer", "solve", "correct", "tell me", "what is the answer"]
    return any(b in text.lower() for b in banned)

# ---------------- ROUTES ----------------
@app.route("/")
def index():
    # If assessment finished, restart automatically on refresh
    if session.get("question_index", 0) >= len(QUESTIONS):
        session["question_index"] = 0

    q = get_current_question()
    return render_template("index.html", question=q["text"])



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

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "")

    if injection_detected(user_message):
        return jsonify({"reply": "I can’t help with answers, but I can guide you toward understanding the question."})

    q = get_current_question()
    if not q:
        return jsonify({"reply": "You have completed all questions."})

    prompt = f"""
QUESTION CONTEXT:
{q["text"]}

STUDENT MESSAGE:
{user_message}
"""

    response = model.generate_content(prompt)
    return jsonify({"reply": response.text})

if __name__ == "__main__":
    app.run(debug=True)
