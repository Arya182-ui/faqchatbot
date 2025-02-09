from flask import Flask, request, jsonify
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from groq import Groq

app = Flask(__name__)

# Load API Key from environment
GroqAPIKey = os.getenv("GroqAPIKey")
if not GroqAPIKey:
    raise ValueError("Missing Groq API Key in environment variables.")

# Initialize Groq Client
client = Groq(api_key=GroqAPIKey)

# Firebase setup
firebase_json_path = "/etc/secrets/FIREBASE_KEY"

try:
    with open(firebase_json_path, "r") as file:
        firebase_dict = json.load(file)

    cred = credentials.Certificate(firebase_dict)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

except Exception as e:
    raise ValueError(f"Firebase initialization error: {e}")

# FAQ List
faqs = [
    {"question": "What is your return policy?", "answer": "We accept returns within 7 days of purchase."},
    {"question": "How can I track my order?", "answer": "Track your order in the 'Order History' section."},
    {"question": "Do you offer international shipping?", "answer": "Yes, shipping varies by location."},
    {"question": "What payment methods do you accept?", "answer": "We accept Visa, MasterCard, and PayPal."},
    {"question": "How can I contact customer support?", "answer": "Email support@example.com or call +1-800-123-4567."},
    {"question": "Is my personal information secure?", "answer": "Yes, we use security best practices."},
    {"question": "How do I reset my password?", "answer": "Go to login page, click 'Forgot Password'."},
    {"question": "Can I cancel my order?", "answer": "Orders can be canceled within 12 hours."}
]

def find_faq_answer(user_input):
    """Check if the user query matches an FAQ"""
    user_input = user_input.lower()
    for faq in faqs:
        if user_input in faq["question"].lower():
            return faq["answer"]
    return None

@app.route("/chat", methods=["POST"])
def chatbot():
    data = request.json
    query = data.get("message", "").strip()

    if not query:
        return jsonify({"error": "No input provided"}), 400

    # Check FAQs first
    faq_answer = find_faq_answer(query)
    if faq_answer:
        return jsonify({"response": faq_answer})

    # If no FAQ found, use Groq AI
    try:
        response = client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "system", "content": "Provide a concise and helpful response."},
                      {"role": "user", "content": query}],
            max_tokens=256,
            temperature=0.7
        )

        answer = response.choices[0].message.content.strip()

        if not answer:
            db.collection("unanswered_questions").add({"question": query, "status": "pending"})
            return jsonify({"response": "An admin will assist you shortly!"})

        return jsonify({"response": answer})

    except Exception as e:
        return jsonify({"error": f"AI processing error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
