from google import genai
import os

# Ensure GEMINI_API_KEY is loaded in environment or passed directly
client = genai.Client(api_key="GEMINI_API_KEY")

print("Available models for generateContent:")
for model in client.models.list():
    if "generateContent" in getattr(model, "supported_actions", []):
        print(model.name)