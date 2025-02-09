from flask import Flask, request, jsonify
import openai
import os
import json
import tempfile
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Firebase JSON secret path (from Render secret mount or env)
firebase_json_path = "/etc/secrets/FIREBASE_KEY"

try:
    # Read Firebase secret file
    with open(firebase_json_path, "r") as file:
        firebase_json = file.read().strip()

    if not firebase_json:
        raise ValueError("Firebase JSON file is empty.")

    firebase_dict = json.loads(firebase_json)
    print("Firebase JSON loaded successfully")

    # Write JSON to a temp file for Firebase Admin SDK
    with tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".json") as temp_file:
        temp_file.write(json.dumps(firebase_dict))
        temp_file_path = temp_file.name  # Save file path

    # Initialize Firebase
    cred = credentials.Certificate(temp_file_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

except Exception as e:
    raise ValueError(f"Unexpected error: {e}")

# FAQ dataset
faqs = [
    {"question": "What is your return policy?", 
     "answer": "We accept returns within 7 days of purchase. Items must be in original condition."},

    {"question": "How can I track my order?", 
     "answer": "You can track your order in the 'Order History' section of your account."},

    {"question": "Do you offer international shipping?", 
     "answer": "Yes, we ship internationally. Shipping costs and times vary by location."},

    {"question": "What payment methods do you accept?", 
     "answer": "We accept Visa, MasterCard, PayPal, and other major payment methods."},

    {"question": "How can I contact customer support?", 
     "answer": "You can reach us via live chat, email at support@example.com, or call +1-800-123-4567."},

    {"question": "Is my personal information secure?", 
     "answer": "Yes, we use encryption and security best practices to protect your data."},

    {"question": "How do I reset my password?", 
     "answer": "Go to the login page, click 'Forgot Password,' and follow the instructions."},

    {"question": "Can I cancel my order?", 
     "answer": "Orders can be canceled within 12 hours of placement. Contact support for assistance."}
]

def generate_response(user_input):
    """Generate AI response based on FAQs"""
    context = "Here are some frequently asked questions:\n"
    for faq in faqs:
        context += f"Q: {faq['question']}\nA: {faq['answer']}\n\n"

    messages = [
        {"role": "system", "content": "You are a helpful assistant that answers based on FAQs."},
        {"role": "user", "content": f"{context}\nUser: {user_input}"}
    ]
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",  # Use the latest available model
        messages=messages,
        max_tokens=100,
        temperature=0.7,
    )

    return response["choices"][0]["message"]["content"].strip()

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the chatbot API!"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    response = generate_response(user_input)

    if "I'm not sure" in response or response == "":
        db.collection("unanswered_questions").add({"question": user_input, "status": "pending"})
        return jsonify({"response": "An admin will assist you shortly!"})

    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
