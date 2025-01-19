from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=api_key)

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == "OPTIONS":
        # Handle preflight request
        response = jsonify(success=True)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    if not request.json:
        return jsonify({'error': 'Missing request body'}), 400
    
    user_message = request.json.get('message', '')
    notes_context = request.json.get('notes', [])
    
    # Format notes context
    formatted_context = ""
    for note in notes_context:
        formatted_context += f"\nNote Title: {note['title']}\n"
        formatted_context += f"Content: {note['content']}\n"
        formatted_context += f"Comments: {len(note.get('initialComments', []))}\n"
        formatted_context += f"Links: {note.get('links', 0)}\n"
        formatted_context += "---"

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant with access to the user's notes. When referencing notes, always wrap the note titles in double square brackets like this: [[Note Title]]. This creates a clickable link to the note."
                },
                {
                    "role": "user",
                    "content": f"Notes Context:\n{formatted_context}\n\nUser Question: {user_message}"
                }
            ],
            temperature=0.7
        )
        
        response_text = response.choices[0].message.content
        return jsonify({'response': response_text})
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
