from flask import Flask, request, jsonify
import requests
import os
import json
import tempfile
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)

# Hugging Face API Configuration
HUGGINGFACE_API_KEY = os.getenv("HuggingFaceAPIKey")  # Ensure you set this in your environment
API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct"
HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

# Firebase JSON secret path (from Render secret mount or env)
firebase_json_path = "/etc/secrets/FIREBASE_KEY"

try:
    with open(firebase_json_path, "r") as file:
        firebase_json = file.read().strip()

    if not firebase_json:
        raise ValueError("Firebase JSON file is empty.")

    firebase_dict = json.loads(firebase_json)
    print("Firebase JSON loaded successfully")

    # Write JSON to a temp file for Firebase Admin SDK
    with tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".json") as temp_file:
        temp_file.write(json.dumps(firebase_dict))
        temp_file_path = temp_file.name  

    # Initialize Firebase
    cred = credentials.Certificate(temp_file_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

except Exception as e:
    raise ValueError(f"Unexpected error: {e}")

# FAQ dataset
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

def generate_response(user_input):
    """Generate AI response using Hugging Face API"""
    context = "Here are some frequently asked questions:\n"
    for faq in faqs:
        context += f"Q: {faq['question']}\nA: {faq['answer']}\n\n"

    payload = {"inputs": f"{context}\nUser: {user_input}\nBot:"}
    response = requests.post(API_URL, headers=HEADERS, json=payload)

    if response.status_code == 200:
        try:
            return response.json()[0]["generated_text"]
        except (IndexError, KeyError):
            return "I'm not sure, but I'll find out for you!"
    else:
        return "Error: Unable to process request."

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the chatbot API!"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    try:
        response = generate_response(user_input)
        
        if not response or "I'm not sure" in response:
            db.collection("unanswered_questions").add({"question": user_input, "status": "pending"})
            return jsonify({"response": "An admin will assist you shortly!"})

        return jsonify({"response": response})
    
    except Exception as e:
        print(f"❌ Error: {e}")  # Logs error in Render
        return jsonify({"response": f"Error: {str(e)}"}), 500
        

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
