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
        'gemini-3.5-flash',       # Primary model (as defined in app settings)
        'gemini-3.6-flash',       # Fallback 1
        'gemini-3.5-flash-lite',  # Fallback 2
        'gemini-flash-latest',    # Fallback 3
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
        
        # 1. Initialize the client with your API key
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        prompt = """
        Analyze this food image.
        """
        
        # 2. Use our fallback utility to call the Gemini API
        response = call_gemini_with_fallback(
            client=client,
            contents=[prompt, img],
            response_schema=MealAnalysis
        )
        
        data = json.loads(response.text)
        
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
        You are Nia, an expert, empathetic AI nutritionist app assistant. Keep responses friendly, concise, and highly personalized.
        Use the following real-time database context to personalize your advice:
        ---
        Profile Info: {profile_context}
        Activity Today: {tracking_context}
        ---
        Answer this user message: "{user_message}"
        """

        # 4. Call the Gemini API using fallback helper
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = call_gemini_with_fallback(
            client=client,
            contents=system_prompt
        )
        
        return response.text.strip()
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print("--- NIA CHAT ERROR ---")
        print(error_trace)
        return "I'm having a little trouble connecting to my brain right now. Please try again later!"

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
