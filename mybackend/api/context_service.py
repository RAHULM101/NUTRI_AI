from django.utils import timezone
from .models import UserProfile, daily_tracking, meal_logs, chat_logs
from .utils import calculate_user_streak

def get_clean_user_name(user, profile):
    if profile:
        first_name = (getattr(profile, 'first_name', '') or '').strip()
        if first_name and '@' not in first_name:
            return first_name.capitalize()
    if user:
        first_name = (getattr(user, 'first_name', '') or '').strip()
        if first_name and '@' not in first_name:
            return first_name.capitalize()
        username = (getattr(user, 'username', '') or '').strip()
        if username:
            if '@' in username:
                username = username.split('@')[0]
            cleaned = username.replace('.', ' ').replace('_', ' ').strip().title()
            if cleaned:
                # If there are numbers at end like rahulmahata55208, trim trailing digits for clean display
                import re
                clean_no_digits = re.sub(r'\d+$', '', cleaned).strip()
                return clean_no_digits.title() if clean_no_digits else cleaned.title()
    return "Friend"

def get_user_realtime_context(user):
    """
    Hydrates live database state for the user: Profile, Today's Intake, Macro Deficit, and Chat Memory.
    """
    today = timezone.now().date()
    profile = None
    tracking = None
    today_meals = []
    
    if user and getattr(user, 'is_authenticated', False):
        try:
            profile = UserProfile.objects.filter(user=user).first()
            tracking = daily_tracking.objects.filter(user=user, created_at__date=today).first()
            today_meals = meal_logs.objects.filter(user=user, meal_timedate__date=today).order_by('meal_timedate')
        except Exception:
            pass

    # Calculate streak
    streak = 0
    if user and getattr(user, 'is_authenticated', False):
        try:
            streak = calculate_user_streak(user)
        except Exception:
            streak = 0

    # 1. Profile Context
    display_name = get_clean_user_name(user, profile)
    profile_info = {
        "name": display_name,
        "primary_goal": getattr(profile, 'primary_goal', None) or 'Healthy living',
        "daily_calorie_target": getattr(profile, 'daily_calorie_target', None) or 2000,
        "current_weight_kg": float(profile.current_weight_kg) if profile and getattr(profile, 'current_weight_kg', None) else None,
        "targeted_weight_kg": float(profile.targeted_weight_kg) if profile and getattr(profile, 'targeted_weight_kg', None) else None,
        "allergies": getattr(profile, 'allergies', None) or "None",
        "health_issues": getattr(profile, 'health_issues', None) or "None",
        "dietary_preference": getattr(profile, 'dietary_preference', None) or "Flexible",
        "regional_culture": getattr(profile, 'regional_culture', None) or "Standard Indian",
        "streak": streak
    }


    # 2. Live Today Stats Context
    if today_meals:
        consumed_cals = sum(int(m.calories or 0) for m in today_meals)
        consumed_protein = sum(float(m.protein_gm or 0.0) for m in today_meals)
        consumed_carbs = sum(float(m.carbs_gm or 0.0) for m in today_meals)
        consumed_fat = sum(float(m.fat_gm or 0.0) for m in today_meals)
    else:
        consumed_cals = getattr(tracking, 'total_calories_consumed', 0) or 0
        consumed_protein = float(getattr(tracking, 'total_protein', 0.0) or 0.0)
        consumed_carbs = float(getattr(tracking, 'total_carbs', 0.0) or 0.0)
        consumed_fat = float(getattr(tracking, 'total_fat', 0.0) or 0.0)

    water_liters = float(getattr(tracking, 'water_intake_liters', 0.0) or 0.0)
    target_cals = profile_info["daily_calorie_target"]
    remaining_cals = max(0, target_cals - consumed_cals)

    # Calculate dynamic macro targets based on daily calorie target
    target_protein = round((target_cals * 0.30) / 4, 1)
    target_carbs = round((target_cals * 0.45) / 4, 1)
    target_fat = round((target_cals * 0.25) / 9, 1)
    water_target = float(getattr(profile, 'water_intake_litres', 3.0) or 3.0)

    today_stats = {
        "calories_consumed": consumed_cals,
        "calorie_target": target_cals,
        "calories_remaining": remaining_cals,
        "protein_g": round(consumed_protein, 1),
        "target_protein": target_protein,
        "protein_remaining": max(0.0, round(target_protein - consumed_protein, 1)),
        "carbs_g": round(consumed_carbs, 1),
        "target_carbs": target_carbs,
        "carbs_remaining": max(0.0, round(target_carbs - consumed_carbs, 1)),
        "fat_g": round(consumed_fat, 1),
        "target_fat": target_fat,
        "fat_remaining": max(0.0, round(target_fat - consumed_fat, 1)),
        "water_liters": water_liters,
        "water_target": water_target,
        "water_remaining": max(0.0, round(water_target - water_liters, 2)),
        "logged_meals_count": len(today_meals)
    }


    # 3. Logged Meals Summary
    logged_meals_text = []
    for m in today_meals:
        meal_name = m.detected_items or m.meal_type or 'Meal'
        logged_meals_text.append(f"• **{m.meal_type or 'Meal'}**: {meal_name} ({m.calories or 0} kcal | {m.protein_gm or 0}g protein | {m.carbs_gm or 0}g carbs | {m.fat_gm or 0}g fat)")


    # 4. Sliding Window Chat Session Memory (Last 6 Exchanges)
    recent_history = []
    if user and getattr(user, 'is_authenticated', False):
        try:
            past_logs = chat_logs.objects.filter(user=user).order_by('-created_at')[:6]
            for log in reversed(list(past_logs)):
                if log.user_message:
                    recent_history.append(f"User: {log.user_message}")
                if log.ai_response:
                    recent_history.append(f"Nia: {log.ai_response[:200]}...")
        except Exception:
            pass


    return {
        "profile": profile_info,
        "today_stats": today_stats,
        "logged_meals_summary": "\n".join(logged_meals_text) if logged_meals_text else "No food logged yet today.",
        "chat_history": "\n".join(recent_history) if recent_history else "No previous conversation context."
    }
