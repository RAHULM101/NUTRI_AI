from django.utils import timezone
from .models import UserProfile, daily_tracking, meal_logs, chat_logs
from .utils import calculate_user_streak

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
    profile_info = {
        "name": (user.first_name or user.username) if user and getattr(user, 'is_authenticated', False) else "Guest",
        "primary_goal": getattr(profile, 'primary_goal', None) or 'Healthy living',
        "daily_calorie_target": getattr(profile, 'daily_calorie_target', None) or 2000,
        "current_weight_kg": float(profile.current_weight_kg) if profile and profile.current_weight_kg else None,
        "targeted_weight_kg": float(profile.targeted_weight_kg) if profile and profile.targeted_weight_kg else None,
        "allergies": profile.allergies if profile and profile.allergies else "None",
        "health_issues": profile.health_issues if profile and profile.health_issues else "None",
        "dietary_preference": profile.dietary_preference if profile and profile.dietary_preference else "Flexible",
        "regional_culture": profile.regional_culture if profile and profile.regional_culture else "Standard Indian",
        "streak": streak
    }

    # 2. Live Today Stats Context
    consumed_cals = tracking.total_calories_consumed if tracking and tracking.total_calories_consumed else 0
    consumed_protein = float(tracking.total_protein) if tracking and tracking.total_protein else 0.0
    consumed_carbs = float(tracking.total_carbs) if tracking and tracking.total_carbs else 0.0
    consumed_fat = float(tracking.total_fat) if tracking and tracking.total_fat else 0.0
    water_liters = float(tracking.water_intake_liters) if tracking and tracking.water_intake_liters else 0.0
    
    target_cals = profile_info["daily_calorie_target"]
    remaining_cals = max(0, target_cals - consumed_cals)


    today_stats = {
        "calories_consumed": consumed_cals,
        "calorie_target": target_cals,
        "calories_remaining": remaining_cals,
        "protein_g": round(consumed_protein, 1),
        "carbs_g": round(consumed_carbs, 1),
        "fat_g": round(consumed_fat, 1),
        "water_liters": water_liters,
        "logged_meals_count": len(today_meals)
    }

    # 3. Logged Meals Summary
    logged_meals_text = []
    for m in today_meals:
        logged_meals_text.append(f"• {m.meal_type or 'Meal'}: {m.detected_items or 'Food'} ({m.calories or 0} kcal, {m.protein_gm or 0}g protein)")

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
