import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from django.conf import settings
from PIL import Image
import traceback
from .models import UserProfile, daily_tracking
from django.utils import timezone

class MealAnalysis(BaseModel):
    detected_items: str = Field(description="A string summarizing what the food is.")
    calories: int = Field(description="Estimated total calories.")
    protein_gm: float = Field(description="Estimated protein in grams.")
    carbs_gm: float = Field(description="Estimated carbohydrates in grams.")
    fat_gm: float = Field(description="Estimated fat in grams.")
    ai_insights: str = Field(description="A short sentence with a nutritional observation.")

def calculate_junk_score(calories, protein, carbs, fat, detected_items):
    """
    Calculates a simple junk score from 0 to 100.
    100 = Pure Junk, 0 = Extremely Healthy.
    This is a basic heuristic; you can adjust the formula.
    """
    if calories == 0:
        return 0
    
    # Calculate percentage of calories from each macro (approximate)
    protein_cals = float(protein) * 4
    fat_cals = float(fat) * 9
    
    protein_pct = protein_cals / float(calories)
    fat_pct = fat_cals / float(calories)
    
    # Base score
    score = 50
    
    # High protein is healthy, so it lowers the junk score
    if protein_pct > 0.3:
        score -= 20
    
    # Very high fat increases the junk score
    if fat_pct > 0.5:
        score += 20
        
    # Example item-based heuristics (junk keywords increase the junk score)
    junk_keywords = ['burger', 'fries', 'pizza', 'soda', 'candy', 'chips', 'fried']
    detected_lower = str(detected_items).lower()
    for word in junk_keywords:
        if word in detected_lower:
            score += 15
            
    # Ensure score stays between 0 and 100
    return max(0, min(100, int(score)))

# Helper to handle Gemini API model fallbacks in case of quota limit exhaustion
def call_gemini_with_fallback(client, contents, response_schema=None):
    import time
    if not client:
        raise ValueError("Gemini API Client is not configured. Please set GEMINI_API_KEY.")

    models_to_try = [
        'gemini-3.5-flash-lite',        # 1. Primary: Highest quota & fastest vision (100% stable)
        'gemini-3-flash-preview',       # 2. High availability Flash preview
        'gemini-3.1-flash-lite-preview',# 3. High throughput Lite preview
        'gemini-flash-latest',          # 4. Production alias
        'gemini-3.6-flash',             # 5. Flagship Flash model
        'gemini-3.5-flash',             # 6. Standard Flash model
        'gemini-pro-latest',            # 7. Pro model fallback
    ]
    
    last_exception = None
    for model_name in models_to_try:
        try:
            config = None
            if response_schema:
                config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema
                )
            
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
            if response and response.text:
                return response
        except Exception as e:
            err_str = str(e)
            print(f"--- FALLBACK WARNING: Model '{model_name}' failed: {err_str[:120]}. Trying next model... ---")
            last_exception = e
            # If rate limit (429) was hit, wait briefly for project bucket to drain
            if '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str:
                time.sleep(0.6)
            continue
            
    if last_exception:
        raise last_exception
    raise Exception("No active models available for content generation.")

# Make sure you set GEMINI_API_KEY in your settings or .env file
def analyze_meal_image_with_gemini(image_file):
    try:
        import re
        if hasattr(image_file, 'seek'):
            image_file.seek(0)
        img = Image.open(image_file)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Optimize camera captures (downscale to max 1024x1024 to guarantee sub-second vision inference)
        img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        client = genai.Client(api_key=api_key)
        
        prompt = """
        Analyze this food image and identify the dishes accurately for nutritional tracking.
        CRITICAL RULES:
        - If the image contains ANY food or drink (e.g. roti, naan, curry, dal, rice, salad, paneer, chicken, eggs, fruits, snacks, tea, coffee), accurately estimate:
          * detected_items: Specific names of the dishes found
          * calories: estimated total calories (integer > 0)
          * protein_gm: estimated protein in grams (float)
          * carbs_gm: estimated carbs in grams (float)
          * fat_gm: estimated fat in grams (float)
          * ai_insights: concise nutrition observation
        - If the image is strictly NON-FOOD (human selfie/face, pet, vehicle, furniture, text document), set:
          * detected_items: "No food detected - Non-food / Human photo"
          * calories: 0
          * protein_gm: 0.0
          * carbs_gm: 0.0
          * fat_gm: 0.0
          * ai_insights: "Invalid Upload: No food detected."
        """
        
        # 2. Try structured output first, with seamless fallback to raw JSON prompt
        try:
            response = call_gemini_with_fallback(
                client=client,
                contents=[prompt, img],
                response_schema=MealAnalysis
            )
        except Exception:
            json_prompt = prompt + "\nReturn ONLY a valid JSON object matching: {\"detected_items\": \"...\", \"calories\": 0, \"protein_gm\": 0.0, \"carbs_gm\": 0.0, \"fat_gm\": 0.0, \"ai_insights\": \"...\"}"
            response = call_gemini_with_fallback(
                client=client,
                contents=[json_prompt, img]
            )

        raw_text = (response.text or '').strip()
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
        else:
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            data = json.loads(raw_text.strip())
        
        data['junk_score'] = calculate_junk_score(
            calories=data.get('calories', 0),
            protein=data.get('protein_gm', 0),
            carbs=data.get('carbs_gm', 0),
            fat=data.get('fat_gm', 0),
            detected_items=data.get('detected_items', '')
        )
        
        return data
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print("--- GEMINI ERROR TRACEBACK ---")
        print(error_trace)
        print("------------------------------")
        return {
            "error": "Failed to analyze image with Gemini.",
            "traceback": error_trace
        }

def generate_nia_chat_response(user, user_message):
    try:
        from .context_service import get_user_realtime_context
        from .rag_service import retrieve_relevant_context

        # 1. Hydrate Real-Time Context from Database
        ctx = get_user_realtime_context(user)
        profile_info = ctx["profile"]
        today_stats = ctx["today_stats"]

        # 2. Retrieve Evidence-Based Grounding Context via RAG
        rag_docs = retrieve_relevant_context(user_message, top_k=4)
        rag_text_blocks = []
        sources = []

        for idx, doc in enumerate(rag_docs):
            rag_text_blocks.append(f"[Source {idx+1}: {doc['title']} ({doc['dataset_type']})]\n{doc['content']}")
            sources.append({
                "title": doc['title'],
                "type": doc['dataset_type'],
                "page": doc.get('page_number')
            })

        rag_knowledge_context = "\n\n".join(rag_text_blocks) if rag_text_blocks else "No specific research document retrieved."

        # 3. Build Master RAG + Real-Time Context Prompt
        master_prompt = f"""
You are Nia, an evidence-based, empathetic AI Nutritionist and Health Assistant.

REAL-TIME USER PROFILE:
- Name: {profile_info['name']}
- Primary Goal: {profile_info['primary_goal']}
- Weight: {profile_info['current_weight_kg'] or 'Not specified'} kg (Target: {profile_info['targeted_weight_kg'] or 'Not specified'} kg)
- Allergies: {profile_info['allergies']}
- Health Conditions: {profile_info['health_issues']}
- Dietary Preference: {profile_info['dietary_preference']}
- Regional Culture: {profile_info['regional_culture']}
- Daily Calorie Target: {today_stats['calorie_target']} kcal
- Consumed Today: {today_stats['calories_consumed']} kcal (Remaining: {today_stats['calories_remaining']} kcal)
- Macros Consumed Today: {today_stats['protein_g']}g Protein | {today_stats['carbs_g']}g Carbs | {today_stats['fat_g']}g Fat
- Meals Logged Today:
{ctx['logged_meals_summary']}

RECENT CONVERSATION HISTORY:
{ctx['chat_history']}

RETRIEVED NUTRITIONAL SCIENCE & FOOD TABLE KNOWLEDGE (RAG GROUNDING):
---
{rag_knowledge_context}
---

GUARDRAILS & INSTRUCTIONS:
1. Ground your answer in the RETRIEVED KNOWLEDGE whenever relevant. Cite nutritional facts accurately (e.g. calories, macros, guidelines).
2. Always keep the user's real-time remaining calorie/macro budget and dietary preferences in mind.
3. OFF-TOPIC GUARDRAIL: If the user asks non-nutrition/non-health questions (e.g., cricket, coding, general trivia), politely decline: "I am Nia, your AI Nutrition Assistant. I specialize in food, diet, and health. How can I help you with your meal plan or macro goals today?"
4. MEDICAL DISCLAIMER: If the user asks about acute medical symptoms, provide evidence-based context AND state: "Consult a certified medical professional or dietitian for diagnosis."
5. If creating a meal plan, format clearly with headers, meals (Breakfast, Lunch, Snack, Dinner), portions, calories, and protein.

Answer the user's message: "{user_message}"
"""

        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        client = None
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                client = genai.Client(api_key=api_key)
            except Exception as e:
                print(f"GenAI Client Init Notice: {e}")

        response = call_gemini_with_fallback(
            client=client,
            contents=master_prompt
        )

        if response and response.text:
            return response.text.strip()
        raise Exception("Empty response from AI")

    except Exception as e:
        error_trace = traceback.format_exc()
        print("--- NIA CHAT RAG NOTICE ---", str(e))

        # Check if RAG retriever found matching knowledge chunks for the query
        try:
            from .rag_service import retrieve_relevant_context
            rag_docs = retrieve_relevant_context(user_message, top_k=3)
            if rag_docs:
                response_lines = ["I found the following grounded nutritional data for your request:\n"]
                for doc in rag_docs:
                    response_lines.append(f"**[{doc['title']}]** ({doc['dataset_type']})\n{doc['content']}\n")
                return "\n".join(response_lines)
        except Exception:
            pass

        # Contextual Intelligent Fallback
        lower_msg = user_message.lower()
        if '2 day' in lower_msg or '2 days' in lower_msg:
            return (
                "Here is your personalized **2-Day Nutrition Plan** 🥗:\n\n"
                "**Day 1:**\n"
                "• **Breakfast:** 3 Boiled Eggs / Paneer Bhurji with toast (~280 kcal, 20g protein)\n"
                "• **Lunch:** Brown Rice + Veg/Chicken Dal (~450 kcal, 32g protein)\n"
                "• **Snack:** Roasted Makhana + Green Tea (~120 kcal, 4g protein)\n"
                "• **Dinner:** 2 Whole-Wheat Rotis + Dal Tadka (~380 kcal, 18g protein)\n\n"
                "**Day 2:**\n"
                "• **Breakfast:** Rolled Oats with Chia & Greek Yogurt (~320 kcal, 22g protein)\n"
                "• **Lunch:** 2 Rotis + Dal + Paneer (~460 kcal, 28g protein)\n"
                "• **Snack:** Almonds and Walnuts (~160 kcal, 6g protein)\n"
                "• **Dinner:** Lentil/Chicken Soup with sautéed veggies (~340 kcal, 24g protein)\n"
            )
        return "I'm Nia, your AI Nutrition Assistant! How can I help you reach your daily health and macro goals today?"

def calculate_user_streak(user):
    from datetime import timedelta
    from .models import meal_logs
    
    # Get all distinct dates on which the user has logged meals, sorted in descending order
    logs = meal_logs.objects.filter(user=user).order_by('-meal_timedate')
    logged_dates = sorted(list(set(log.meal_timedate.date() for log in logs)), reverse=True)
    
    if not logged_dates:
        return 0
        
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    
    # The user must have logged a meal either today or yesterday to maintain/have a streak
    if logged_dates[0] not in (today, yesterday):
        return 0
        
    streak = 1
    current_date = logged_dates[0]
    
    for next_date in logged_dates[1:]:
        if current_date - next_date == timedelta(days=1):
            streak += 1
            current_date = next_date
        elif current_date - next_date > timedelta(days=1):
            break
            
    return streak
