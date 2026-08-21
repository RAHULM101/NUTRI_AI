from django.urls import path
from .views import (
    RegisterView, LoginView, ProfileView, OnboardingView,
    AnalyzeMealImageView, MealLogListCreateView, MealLogDetailView, DashboardSummaryView,
    NiaChatView, UpdateWaterIntakeView
)
from .views import GoogleLoginView
from .store_views import (
    ProductListView, ProductDetailView,
    CartView, CartAddView, CartItemUpdateView,
    CheckoutView, OrderHistoryView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('onboarding/', OnboardingView.as_view({'get': 'list', 'post': 'create'})),
    path('onboarding/<uuid:pk>/', OnboardingView.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update'})),
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('meal-logs/analyze/', AnalyzeMealImageView.as_view(), name='analyze_meal_image'),
    path('meal-logs/', MealLogListCreateView.as_view(), name='meal_logs_list_create'),
    path('meal-logs/<uuid:pk>/', MealLogDetailView.as_view(), name='meal_log_detail'),
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('dashboard/water/', UpdateWaterIntakeView.as_view(), name='update_water_intake'),
    path('nia/chat/', NiaChatView.as_view(), name='nia_chat'),

    # ── Nutri Store ──
    path('store/products/', ProductListView.as_view(), name='store_products'),
    path('store/products/<int:pk>/', ProductDetailView.as_view(), name='store_product_detail'),
    path('store/cart/', CartView.as_view(), name='store_cart'),
    path('store/cart/add/', CartAddView.as_view(), name='store_cart_add'),
    path('store/cart/update/<int:item_id>/', CartItemUpdateView.as_view(), name='store_cart_update'),
    path('store/checkout/', CheckoutView.as_view(), name='store_checkout'),
    path('store/orders/', OrderHistoryView.as_view(), name='store_orders'),
]

