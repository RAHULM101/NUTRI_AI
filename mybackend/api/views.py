import random
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework import status, viewsets, generics, authentication, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.db import models
from datetime import timedelta
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests as standard_requests
from .models import UserProfile, meal_logs, chat_logs
from .serializer import RegisterSerializer, OnboardingSerializer, MealLogSerializer, MealImageUploadSerializer, ChatLogSerializer
from .utils import analyze_meal_image_with_gemini, generate_nia_chat_response, auto_fix_macros_with_gemini

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            data = request.data
            
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                
                try:
                    is_onboarded = user.profile.is_onboarded
                except Exception:
                    is_onboarded = False
                    
                return Response({
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "user": {
                        "username": user.username,
                        "email": user.email,
                        "is_onboarded": is_onboarded
                    }
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "error": ["An unexpected server error occurred during registration. Please try again later."]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        data = request.data
        # Robustly get the identifier from 'username' or 'email' key
        raw_login_id = data.get('username') or data.get('email') or ''
        login_id = raw_login_id.strip().lower()
        password = data.get('password')
        
        if not login_id:
            return Response({"message": "Please provide a username or email"}, status=status.HTTP_400_BAD_REQUEST)

        # Case-insensitive search for user by either username or email
        user = User.objects.filter(
            models.Q(username__iexact=login_id) | models.Q(email__iexact=login_id)
        ).first()
        
        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            
            try:
                is_onboarded = user.profile.is_onboarded
            except Exception:
                is_onboarded = False
                
            return Response({
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "is_onboarded": is_onboarded
                }
            }, status=status.HTTP_200_OK)

        if user and not user.has_usable_password():
            return Response(
                {"message": "This account was created with Google Sign-In. Please tap 'Google' below to continue."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response({"message": "Invalid credentials. Please check your email and password."}, status=status.HTTP_401_UNAUTHORIZED)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        try:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            serializer = OnboardingSerializer(profile)
            data = serializer.data
            try:
                from .utils import calculate_user_streak
                data['streak'] = calculate_user_streak(request.user)
            except Exception:
                data['streak'] = 0
            return Response({
                "message": "user profile",
                "data": data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request):
        try:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            plan_name = request.data.get('selected_plan') or request.data.get('selectedPlan') or request.data.get('plan')
            if plan_name:
                from .models import Subscription
                sub, _ = Subscription.objects.get_or_create(
                    user=request.user,
                    defaults={'plan_type': plan_name, 'status': 'active'}
                )
                sub.plan_type = plan_name
                sub.status = 'active'
                sub.save()
                profile.active_subscription = sub

            serializer = OnboardingSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                data = serializer.data
                try:
                    from .utils import calculate_user_streak
                    data['streak'] = calculate_user_streak(request.user)
                except Exception:
                    data['streak'] = 0
                return Response({"message": "Profile updated", "data": data}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
class OnboardingView(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OnboardingSerializer
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        obj, created = UserProfile.objects.get_or_create(user=self.request.user)
        return obj

    def perform_create(self, serializer):
        profile = serializer.save(user=self.request.user)
        plan_name = self.request.data.get('selected_plan') or self.request.data.get('selectedPlan')
        if plan_name:
            from .models import Subscription
            sub, _ = Subscription.objects.get_or_create(
                user=self.request.user,
                defaults={'plan_type': plan_name, 'status': 'active'}
            )
            sub.plan_type = plan_name
            sub.status = 'active'
            sub.save()
            profile.active_subscription = sub
            profile.save()

    def perform_update(self, serializer):
        profile = serializer.save()
        plan_name = self.request.data.get('selected_plan') or self.request.data.get('selectedPlan')
        if plan_name:
            from .models import Subscription
            sub, _ = Subscription.objects.get_or_create(
                user=self.request.user,
                defaults={'plan_type': plan_name, 'status': 'active'}
            )
            sub.plan_type = plan_name
            sub.status = 'active'
            sub.save()
            profile.active_subscription = sub
            profile.save()

class AnalyzeMealImageView(APIView):
    """
    Takes an image, passes it to Gemini, calculates a junk score,
    and returns the data so the frontend can preview it.
    Does NOT save to the database.
    Now supports optional 'portion_hint' text field for improved accuracy.
    Also returns detected_count, unit, total_weight_g for client-side portion math.
    """
    # Requires multipart parsing for file uploads
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        try:
            serializer = MealImageUploadSerializer(data=request.data)
            
            if serializer.is_valid():
                image_file = serializer.validated_data['image']
                # Optional portion hint from mobile (e.g. '2 pieces', '250g', 'half plate')
                portion_hint = request.data.get('portion_hint', None)
                
                # Call our utility function with optional portion context
                analysis_result = analyze_meal_image_with_gemini(image_file, portion_hint=portion_hint)
                
                if "error" in analysis_result:
                    return Response(analysis_result, status=status.HTTP_400_BAD_REQUEST)
                    
                return Response(analysis_result, status=status.HTTP_200_OK)
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print("--- MEAL ANALYZE VIEW EXCEPTION ---")
            print(traceback.format_exc())
            return Response(
                {"error": f"Failed to process image: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class AutoFixMacrosView(APIView):
    """
    Lightweight text-only endpoint. No image required.
    Called when user edits food name and taps 'Auto-Fix Macros'.
    Does NOT count against the user's daily scan limit.
    Returns estimated macros for the corrected food name.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        food_name = request.data.get('food_name', '').strip()
        serving_desc = request.data.get('serving', '1 serving').strip()

        if not food_name:
            return Response({'error': 'food_name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        result = auto_fix_macros_with_gemini(food_name, serving_desc)

        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)
        
class MealLogListCreateView(generics.ListCreateAPIView):
    """
    Handles saving a finalized meal log (POST) 
    and fetching a user's logs (GET).
    """
    serializer_class = MealLogSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        # Only return meal logs for the logged-in user
        return meal_logs.objects.filter(user=self.request.user).order_by('-meal_timedate')
    def perform_create(self, serializer):
        from django.utils import timezone
        from .models import daily_tracking
        
        today = timezone.now().date()
        # Find daily_tracking created today for this user, or create one
        tracking = daily_tracking.objects.filter(
            user=self.request.user,
            created_at__date=today,
        ).first()

        if not tracking:
            tracking = daily_tracking.objects.create(
                user=self.request.user,
                behaviour_summary='Active',
                water_intake_liters=0.0
            )
        
        # Save the meal log
        meal = serializer.save(user=self.request.user, tracking_id=tracking)

        # Aggregate today's stats for daily_tracking record
        today_meals = meal_logs.objects.filter(user=self.request.user, meal_timedate__date=today)
        tracking.total_calories_consumed = sum(m.calories or 0 for m in today_meals)
        tracking.total_carbs = sum(float(m.carbs_gm or 0) for m in today_meals)
        tracking.total_fat = sum(float(m.fat_gm or 0) for m in today_meals)
        tracking.meal_count = today_meals.count()
        valid_junks = [m.junk_score for m in today_meals if m.junk_score is not None]
        if valid_junks:
            tracking.junk_score_avg = round(sum(valid_junks) / len(valid_junks), 1)
        tracking.save()


class MealLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles fetching, updating, or deleting a specific meal log (GET, PUT, PATCH, DELETE).
    """
    serializer_class = MealLogSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return meal_logs.objects.filter(user=self.request.user)



# Read Google Client ID dynamically from environment
import os
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response({"message": "No token provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            idinfo = None
            # 1. First try as OAuth2 Access Token via Google UserInfo API
            google_response = standard_requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )

            if google_response.status_code == 200:
                idinfo = google_response.json()
            else:
                # 2. Fallback: try as OpenID ID Token via Google TokenInfo API
                tokeninfo_resp = standard_requests.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={token}",
                    timeout=10
                )
                if tokeninfo_resp.status_code == 200:
                    idinfo = tokeninfo_resp.json()
                else:
                    return Response({"message": "Invalid Google token"}, status=status.HTTP_401_UNAUTHORIZED)

            email = idinfo.get('email')
            if not email:
                return Response({"message": "Could not retrieve email from Google account"}, status=status.HTTP_400_BAD_REQUEST)

            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            user = User.objects.filter(email=email).first()

            if not user:
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )
                user.set_unusable_password()
                user.save()

            refresh = RefreshToken.for_user(user)

            try:
                is_onboarded = user.profile.is_onboarded
            except Exception:
                is_onboarded = False

            return Response({
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "is_onboarded": is_onboarded
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("--- GOOGLE LOGIN ERROR ---", e)
            return Response({"message": "Google authentication failed. Please try again."}, status=status.HTTP_401_UNAUTHORIZED)


class DashboardSummaryView(APIView):
    """
    Returns real aggregated calorie and junk score trend data 
    for the logged-in user over the past 7 days, along with today's totals.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from django.utils import timezone
            from datetime import timedelta
            
            user = request.user
            today = timezone.localdate() if hasattr(timezone, 'localdate') else timezone.now().date()
            
            # Calculate the past 7 days (including today)
            days = []
            for i in range(6, -1, -1):
                days.append(today - timedelta(days=i))
                
            # Get all meal logs around these days
            logs = meal_logs.objects.filter(
                user=user,
                meal_timedate__date__gte=days[0] - timedelta(days=1),
                meal_timedate__date__lte=days[-1] + timedelta(days=1)
            )
            
            # Group by day using local timezone
            daily_data = {day: {'calories': 0, 'junk_score_sum': 0, 'count': 0} for day in days}
            today_logs = []
            for log in logs:
                log_dt = timezone.localtime(log.meal_timedate) if timezone.is_aware(log.meal_timedate) else log.meal_timedate
                log_date = log_dt.date()
                if log_date in daily_data:
                    daily_data[log_date]['calories'] += log.calories or 0
                    if log.junk_score is not None:
                        daily_data[log_date]['junk_score_sum'] += log.junk_score
                        daily_data[log_date]['count'] += 1
                if log_date == today:
                    today_logs.append(log)
                        
            cal_trend = []
            junk_trend = []
            
            for day in days:
                day_name = day.strftime('%a')  # 'Mon', 'Tue', etc.
                data = daily_data[day]
                
                cal_trend.append({
                    'name': day_name,
                    'val': data['calories']
                })
                
                avg_junk = 0
                if data['count'] > 0:
                    avg_junk = round(data['junk_score_sum'] / data['count'], 1)
                    
                junk_trend.append({
                    'name': day_name,
                    'score': avg_junk
                })
                
            # Calculate today's aggregates for front-end hydration
            today_calories = 0
            today_protein = 0.0
            today_carbs = 0.0
            today_fat = 0.0
            today_junk_sum = 0
            today_junk_count = 0
            
            for log in today_logs:
                today_calories += log.calories or 0
                today_protein += float(log.protein_gm or 0)
                today_carbs += float(log.carbs_gm or 0)
                today_fat += float(log.fat_gm or 0)
                if log.junk_score is not None:
                    today_junk_sum += log.junk_score
                    today_junk_count += 1
                    
            today_junk_avg = 0
            if today_junk_count > 0:
                today_junk_avg = round(today_junk_sum / today_junk_count, 1)
                
            today_water = 0.0
            from .models import daily_tracking
            tracking_today = daily_tracking.objects.filter(user=user, created_at__date=today).first()
            if tracking_today and getattr(tracking_today, 'water_intake_liters', None) is not None:
                today_water = float(tracking_today.water_intake_liters)

            from .utils import calculate_user_streak
            streak_val = 0
            try:
                streak_val = calculate_user_streak(user)
            except Exception:
                streak_val = 0

            return Response({
                'cal_trend': cal_trend,
                'junk_trend': junk_trend,
                'streak': streak_val,
                'today': {
                    'calories': today_calories,
                    'protein': round(today_protein, 1),
                    'carbs': round(today_carbs, 1),
                    'fat': round(today_fat, 1),
                    'junk_score': today_junk_avg,
                    'junk_count': today_junk_count,
                    'water': today_water
                }
            })
        except Exception as e:
            return Response({
                'cal_trend': [],
                'junk_trend': [],
                'streak': 0,
                'today': {
                    'calories': 0,
                    'protein': 0.0,
                    'carbs': 0.0,
                    'fat': 0.0,
                    'junk_score': 0,
                    'junk_count': 0,
                    'water': 0.0
                }
            }, status=status.HTTP_200_OK)


class UpdateWaterIntakeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import daily_tracking

        water_amount = request.data.get('water')
        if water_amount is None:
            return Response({"error": "water amount required"}, status=400)

        today = timezone.now().date()

        # Fix: get_or_create doesn't support __date lookups — use filter().first() + create()
        tracking = daily_tracking.objects.filter(
            user=request.user,
            created_at__date=today
        ).first()

        if not tracking:
            tracking = daily_tracking.objects.create(
                user=request.user,
                behaviour_summary='Active',
                water_intake_liters=0.0
            )

        tracking.water_intake_liters = float(water_amount)
        tracking.save()

        return Response({
            "message": "Water intake updated",
            "water": float(tracking.water_intake_liters)
        }, status=200)


class NiaChatView(APIView):
    """
    Handles sending messages to Nia and returning the AI response,
    while saving the interaction to the chat_logs table.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message')
        
        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 1. Ask Nia (Gemini) for a response
            ai_reply = generate_nia_chat_response(request.user, user_message)
            
            # 2. Save the conversation to the database history safely
            try:
                chat_log = chat_logs.objects.create(
                    user=request.user,
                    user_message=user_message,
                    ai_response=ai_reply,
                    message_type='text'
                )
                serializer = ChatLogSerializer(chat_log)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as db_err:
                print("--- CHAT LOG DB SAVE WARNING ---", db_err)
                return Response({
                    "id": 0,
                    "user_message": user_message,
                    "ai_response": ai_reply,
                    "message_type": "text",
                    "created_at": timezone.now().isoformat()
                }, status=status.HTTP_200_OK)
        
        except Exception as e:
            import traceback
            print("--- NIA CHAT VIEW ERROR ---")
            print(traceback.format_exc())
            # Return safe fallback response with HTTP 200 so UI never errors out
            fallback_text = "I'm here to help you with your nutrition and meal plans! Please ask your question again or specify your daily targets."
            return Response({
                "id": 0,
                "user_message": user_message,
                "ai_response": fallback_text,
                "message_type": "text",
                "created_at": timezone.now().isoformat()
            }, status=status.HTTP_200_OK)

    def get(self, request):
        # Allow the frontend to fetch previous chat history!
        logs = chat_logs.objects.filter(user=request.user).order_by('created_at')
        serializer = ChatLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
