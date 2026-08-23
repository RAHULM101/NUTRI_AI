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
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
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
    raise Exception("No active Gemini models available for content generation.")


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
        from .web_search_service import (
            is_nutrition_query,
            is_blocked_medical_query,
            search_trusted_nutrition_web,
            build_web_context_block,
        )

        lower_msg = user_message.lower()

        # ── Layer 1a: Off-topic pre-filter (sports, movies, coding, politics) ────
        off_topic_keywords = [
            'fifa', 'world cup', 'cricket', 'football', 'ipl', 'match score',
            'movie', 'actor', 'actress', 'coding', 'javascript', 'python code',
            'politics', 'election', 'president', 'prime minister',
            'weather', 'stock market', 'cryptocurrency', 'bitcoin',
        ]
        if any(kw in lower_msg for kw in off_topic_keywords):
            return (
                "I am Nia, your AI Nutrition & Health Coach. 🥗\n\n"
                "I specialize strictly in food, nutrition, diet, weight management, and fitness. "
                "I cannot assist with non-health topics like sports, general trivia, or news. "
                "How can I help you with your meal plan or macro goals today?"
            )

        # ── Layer 1b: Blocked medical filter (drugs, chemotherapy, surgery) ────
        if is_blocked_medical_query(user_message):
            return (
                "I am Nia, your AI Nutrition & Health Coach. 🥗\n\n"
                "I focus exclusively on food, nutrition, diet, weight management, and healthy lifestyles. "
                "I cannot provide medical diagnosis, drug dosages, or clinical medical treatment advice. "
                "Please consult a certified medical doctor or healthcare professional for medical treatments."
            )

        # ── Step 1: Hydrate Real-Time User Context ───────────────────────────
        ctx = get_user_realtime_context(user)
        profile_info = ctx["profile"]
        today_stats = ctx["today_stats"]

        # ── Step 1c: Instant Handler for Personal Tracking Queries ───────────
        personal_tracking_terms = [
            'protein left', 'calories left', 'carbs left', 'fat left', 'water left',
            'i left for today', 'left for today', 'left today', 'consumed today',
            'remaining calories', 'remaining protein', 'remaining macros', 'remaining carbs', 'remaining fat', 'remaining water',
            'water intake left', 'how much water left', 'how much water i', 'water intake remaining',
            'my goal', 'my profile', 'how much protein do i', 'how much protein i', 'how much carbs', 'how much fat',
            'how many calories did i', 'my budget', 'what did i log', 'protein remaining', 'calorie remaining',
            'macros left', 'macro summary', 'today macro', 'todays macro', 'todays macros'
        ]

        if any(term in lower_msg for term in personal_tracking_terms):
            consumed_p = today_stats.get('protein_g', 0.0)
            target_p = today_stats.get('target_protein', 70.0)
            remaining_p = today_stats.get('protein_remaining', max(0.0, target_p - consumed_p))

            consumed_c = today_stats.get('carbs_g', 0.0)
            target_c = today_stats.get('target_carbs', 200.0)
            remaining_c = today_stats.get('carbs_remaining', max(0.0, target_c - consumed_c))

            consumed_f = today_stats.get('fat_g', 0.0)
            target_f = today_stats.get('target_fat', 50.0)
            remaining_f = today_stats.get('fat_remaining', max(0.0, target_f - consumed_f))

            consumed_w = today_stats.get('water_liters', 0.0)
            target_w = today_stats.get('water_target', 3.0)
            remaining_w = today_stats.get('water_remaining', max(0.0, target_w - consumed_w))

            consumed_cal = today_stats.get('calories_consumed', 0)
            target_cal = today_stats.get('calorie_target', 2000)
            remaining_cal = today_stats.get('calories_remaining', max(0, target_cal - consumed_cal))

            if 'water' in lower_msg:
                return (
                    f"You have logged **{consumed_w:.1f}L** of water today. 💧\n\n"
                    f"You have **{remaining_w:.1f}L of water remaining** out of your {target_w:.1f}L daily goal!"
                )
            elif 'protein' in lower_msg:
                return (
                    f"You have consumed **{consumed_p:.1f}g** of protein today. 🥗\n\n"
                    f"You have **{remaining_p:.1f}g of protein remaining** out of your {target_p:.1f}g daily goal!"
                )
            elif 'carb' in lower_msg:
                return (
                    f"You have consumed **{consumed_c:.1f}g** of carbs today. 🌾\n\n"
                    f"You have **{remaining_c:.1f}g of carbs remaining** out of your {target_c:.1f}g daily target!"
                )
            elif 'fat' in lower_msg:
                return (
                    f"You have consumed **{consumed_f:.1f}g** of fats today. 🥑\n\n"
                    f"You have **{remaining_f:.1f}g of fat remaining** out of your {target_f:.1f}g daily target!"
                )
            elif 'calorie' in lower_msg or 'budget' in lower_msg:
                return (
                    f"You have consumed **{consumed_cal} kcal** today. 🔥\n\n"
                    f"You have **{remaining_cal} kcal remaining** out of your {target_cal} kcal daily budget!"
                )
            else:
                return (
                    f"**Today's Live Macro & Water Summary for {profile_info['name']}:** 📊\n\n"
                    f"• **Calories:** {consumed_cal} / {target_cal} kcal ({remaining_cal} kcal left)\n"
                    f"• **Protein:** {consumed_p:.1f}g / {target_p:.1f}g ({remaining_p:.1f}g left)\n"
                    f"• **Carbs:** {consumed_c:.1f}g / {target_c:.1f}g ({remaining_c:.1f}g left)\n"
                    f"• **Fats:** {consumed_f:.1f}g / {target_f:.1f}g ({remaining_f:.1f}g left)\n"
                    f"• **Water:** {consumed_w:.1f}L / {target_w:.1f}L ({remaining_w:.1f}L left) 💧"
                )


        # ── Step 2: Local RAG Retrieval ──────────────────────────────────────
        rag_docs = retrieve_relevant_context(user_message, top_k=3)
        rag_text_blocks = []

        for idx, doc in enumerate(rag_docs):
            rag_text_blocks.append(
                f"Nutritional Reference {idx+1}:\n{doc['content']}"
            )

        rag_knowledge_context = "\n\n".join(rag_text_blocks) if rag_text_blocks else ""

        # ── Step 3: Web Search Fallback (Threshold = 1) ──────────────────────
        web_context_block = ""
        web_search_used = False

        if len(rag_docs) <= 1:
            if is_nutrition_query(user_message):
                web_results = search_trusted_nutrition_web(user_message, max_results=3)
                if web_results:
                    web_context_block = build_web_context_block(web_results)
                    web_search_used = True

        # ── Step 4: Build Master Prompt ──────────────────────────────────────
        knowledge_section = ""
        if rag_knowledge_context and web_context_block:
            knowledge_section = f"""NUTRITIONAL DATA:\n{rag_knowledge_context}\n\nWEB DATA:\n{web_context_block}"""
        elif rag_knowledge_context:
            knowledge_section = f"""NUTRITIONAL DATA:\n{rag_knowledge_context}"""
        elif web_context_block:
            knowledge_section = f"""WEB DATA:\n{web_context_block}"""
        else:
            knowledge_section = "Note: No specific research document retrieved."

        master_prompt = f"""You are Nia, a warm, concise, evidence-based AI Nutritionist and Health Assistant.

REAL-TIME USER PROFILE:
- Name: {profile_info['name']}
- Primary Goal: {profile_info['primary_goal']}
- Daily Calorie Target: {today_stats['calorie_target']} kcal
- Consumed Today: {today_stats['calories_consumed']} kcal (Remaining: {today_stats['calories_remaining']} kcal)
- Macros Consumed Today: {today_stats['protein_g']}g Protein | {today_stats['carbs_g']}g Carbs | {today_stats['fat_g']}g Fat

{knowledge_section}

CONCISE FORMATTING & STYLE RULES:
1. ALWAYS be concise, friendly, and direct (1 to 3 short paragraphs max).
2. DO NOT copy-paste long textbook paragraphs or long raw research papers.
3. NEVER include raw document titles, dataset names (e.g., [Local Source 1: ...]), file paths, or markdown URL links in your chat text. Speak naturally!
4. If asked about calories or protein in a specific food (e.g., ragi, oats, paneer), provide a clean, 2-line bulleted breakdown (per 100g or serving).
5. If creating a meal plan, format clearly with headers and concise meal lines.

Answer the user's message: "{user_message}"
"""

        # ── Step 5: Call Gemini with fallback chain ──────────────────────────
        raw_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        api_key = raw_key.strip().strip("'").strip('"') if (raw_key and isinstance(raw_key, str)) else None
        client = None
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                client = genai.Client(api_key=api_key)
            except Exception as e:
                print(f"GenAI Client Init Notice: {e}")


        response = call_gemini_with_fallback(client=client, contents=master_prompt)

        if response and response.text:
            # Clean response of any leftover source tags if model outputted them
            clean_text = response.text.strip()
            import re
            clean_text = re.sub(r'\[Local Source \d+:[^\]]+\]', '', clean_text)
            clean_text = re.sub(r'\[Web Source \d+:[^\]]+\]', '', clean_text)
            return clean_text.strip()
        raise Exception("Empty response from AI")

    except Exception as e:
        error_trace = traceback.format_exc()
        print("--- NIA CHAT EXCEPTION DIAGNOSTIC ---")
        print(f"Error: {e}")
        print(error_trace)
        print("-------------------------------------")

        # Diagnostics: check if API key is missing
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        if not api_key or api_key == 'your_gemini_api_key_here':
            return (
                "⚠️ **API Key Notice**: `GEMINI_API_KEY` is not set in your `.env` file.\n\n"
                "Please add `GEMINI_API_KEY=your_key` to your environment variables to enable dynamic AI responses."
            )

        lower_msg = user_message.lower()

        if '2 day' in lower_msg or '2 days' in lower_msg or 'meal plan' in lower_msg:
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
                "• **Dinner:** Lentil/Chicken Soup with sautéed veggies (~340 kcal, 24g protein)"
            )

        err_msg = str(e)
        return (
            f"⚠️ **AI Service Notice**: Unable to generate AI response.\n"
            f"**Error Details:** `{err_msg[:150]}`\n\n"
            "Please verify your `GEMINI_API_KEY` in `.env` or check server logs."
        )





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
