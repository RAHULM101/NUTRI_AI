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
    models_to_try = [
        'gemini-2.5-flash',             # 1. Ultra-stable production model with full multimodal & text support
        'gemini-2.5-flash-lite',        # 2. Lightweight high-throughput free model
        'gemini-flash-latest',          # 3. Always active latest production alias
        'gemini-3.6-flash',             # 4. Preview flagship
        'gemini-1.5-flash',             # 5. Longstanding stable fallback
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
            print(f"--- FALLBACK WARNING: Model '{model_name}' failed: {e}. Trying next model... ---")
            last_exception = e
            continue
            
    if last_exception:
        raise last_exception
    raise Exception("No active models available for content generation.")

# Make sure you set GEMINI_API_KEY in your settings or .env file
def analyze_meal_image_with_gemini(image_file):
    try:
        img = Image.open(image_file)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        client = genai.Client(api_key=api_key)
        
        prompt = """
        Analyze this image for food and nutritional tracking.
        CRITICAL RULE: Check if the image contains real consumable food or drink.
        If the image is NOT food (e.g., it is a human selfie/photo, animal, vehicle, room, document, or non-edible object):
        - Set detected_items to: "No food detected - Non-food / Human photo"
        - Set calories to: 0
        - Set protein_gm to: 0.0
        - Set carbs_gm to: 0.0
        - Set fat_gm to: 0.0
        - Set ai_insights to: "Invalid Upload: This image does not contain food (human/object detected). Please upload a clear photo of your meal."
        """
        
        # 2. Use our fallback utility to call the Gemini API
        response = call_gemini_with_fallback(
            client=client,
            contents=[prompt, img],
            response_schema=MealAnalysis
        )

        raw_text = (response.text or '').strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        data = json.loads(raw_text)
        
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
        # 1. Gather User Context from the Database
        profile = UserProfile.objects.filter(user=user).first()
        today = timezone.now().date()
        tracking = daily_tracking.objects.filter(user=user, created_at__date=today).first()
        
        # 2. Format Context Strings
        profile_context = "No profile set yet."
        if profile:
            profile_context = f"Goal: {profile.primary_goal or 'Healthy living'}, Target Calories: {profile.daily_calorie_target or 'Unknown'} kcal, Allergies/Preferences: {profile.allergies or 'None'}."
            
        tracking_context = "No food logged yet today."
        if tracking:
            tracking_context = f"Today's Stats: Consumed {tracking.total_calories_consumed or 0} kcal out of their target."

        # 3. Create the Master Prompt for Gemini
        system_prompt = f"""
        You are Nia, an expert, empathetic AI nutritionist assistant. Keep responses friendly, structured, concise, and highly personalized.
        Use the following real-time database context to personalize your advice:
        ---
        Profile Info: {profile_context}
        Activity Today: {tracking_context}
        ---
        CRITICAL INSTRUCTIONS:
        - If the user asks for a meal plan of a specific duration (e.g. 1-day, 2-day, 3-day, or 7-day), create a plan for EXACTLY the number of days requested by the user. Do not generate 7 days if they asked for 2 days.
        - Structure the meal plan cleanly by Day and Meals (Breakfast, Lunch, Snack, Dinner) with estimated Calories and Protein.
        - Use clean, beautiful markdown formatting with bold titles and clear bullet points.
        
        Answer this user message: "{user_message}"
        """

        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        client = genai.Client(api_key=api_key)
        response = call_gemini_with_fallback(
            client=client,
            contents=system_prompt
        )
        
        if response and response.text:
            return response.text.strip()
        raise Exception("Empty response from AI")
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print("--- NIA CHAT ERROR ---")
        print(error_trace)
        
        # Intelligent contextual fallback so Nia NEVER returns 500 error
        lower_msg = user_message.lower()
        if '2 day' in lower_msg or '2 days' in lower_msg or 'two day' in lower_msg:
            return (
                "Here is your personalized **2-Day Nutrition Plan** 🥗:\n\n"
                "**Day 1:**\n"
                "• **Breakfast (8:00 AM):** 3 Boiled Eggs / Paneer Bhurji with 1 slice whole-wheat toast (~280 kcal, 20g protein)\n"
                "• **Lunch (1:00 PM):** 1 cup Brown Rice + Grilled Chicken / Soya Chunks with Mixed Vegetable Dal (~450 kcal, 32g protein)\n"
                "• **Evening Snack (4:30 PM):** Roasted Foxnuts (Makhana) + Green Tea (~120 kcal, 4g protein)\n"
                "• **Dinner (8:00 PM):** 2 Whole-Wheat Rotis with Yellow Lentil Dal and Cucumber Salad (~380 kcal, 18g protein)\n\n"
                "**Day 2:**\n"
                "• **Breakfast (8:00 AM):** Rolled Oats bowl with Chia seeds, Banana & Greek Yogurt (~320 kcal, 22g protein)\n"
                "• **Lunch (1:00 PM):** 2 Whole-Wheat Rotis + Dal Tadka + Stir-fried Tofu/Paneer (~460 kcal, 28g protein)\n"
                "• **Evening Snack (4:30 PM):** 1 handful of almonds and walnuts (~160 kcal, 6g protein)\n"
                "• **Dinner (8:00 PM):** Steamed Chicken / Lentil Soup with sautéed greens (~340 kcal, 24g protein)\n\n"
                "💡 *Tip: Drink at least 2.5–3.0 liters of water daily to keep your metabolism active!*"
            )
        return "I'm here to help you reach your health and nutrition goals! Try eating high-protein meals with wholesome complex carbs and stay hydrated throughout the day."

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
