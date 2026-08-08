"""
Nutri Store — Seed Script
Run this script from the project root:
    .\venv\Scripts\python.exe mybackend\seed_store.py

It seeds 5 categories and 10 real-world nutrition products
mapped to quick-commerce delivery partners.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.models import StoreCategory, Product

# ─── 1. CATEGORIES ───────────────────────────────────────────────────────────

CATEGORIES = [
    {'name': 'High Protein',     'slug': 'high-protein',     'icon': '💪'},
    {'name': 'Healthy Snacks',   'slug': 'healthy-snacks',   'icon': '🥜'},
    {'name': 'Supplements',      'slug': 'supplements',      'icon': '🧪'},
    {'name': 'Organic Meals',    'slug': 'organic-meals',    'icon': '🥗'},
    {'name': 'Beverages',        'slug': 'beverages',        'icon': '🍵'},
]

print("Seeding categories...")
cat_map = {}
for c in CATEGORIES:
    obj, created = StoreCategory.objects.get_or_create(slug=c['slug'], defaults={'name': c['name'], 'icon': c['icon']})
    cat_map[c['slug']] = obj
    print(f"  {'Created' if created else 'Exists'}: {obj.name}")

# ─── 2. PRODUCTS ──────────────────────────────────────────────────────────────
# Each image_url is chosen to visually match the specific product type.

PRODUCTS = [
    {
        'name': 'ON Gold Standard Whey Protein',
        'description': 'Optimum Nutrition Gold Standard 100% Whey Protein — the world\'s best-selling whey protein. Packed with 24g of fast-digesting whey isolates per serving. Ideal post-workout recovery drink with low sugar and fat.',
        'category_slug': 'high-protein',
        'price': 3499.00,
        'image_url': 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=600&auto=format',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com',
        'calories': 120,
        'protein': 24.0,
        'carbs': 3.0,
        'fat': 1.5,
        'serving_size': '30g',
        'macro_tag': '24g Protein',
        'ingredients': 'Whey Protein Isolate, Whey Protein Concentrate, Cocoa, Natural Flavors, Lecithin, Acesulfame Potassium, Sucralose',
        'delivery_eta': '10-15 mins',
        'is_featured': True,
        'is_available': True,
    },
    {
        'name': 'MuscleBlaze Whey Protein Active',
        'description': 'MuscleBlaze Whey Protein Active with 25g protein per serving supports lean muscle growth. Fortified with DigeZyme enzyme complex for better absorption. Great value for everyday fitness enthusiasts.',
        'category_slug': 'high-protein',
        'price': 2899.00,
        'image_url': 'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=600&auto=format',
        'partner_name': 'Zepto',
        'affiliate_link': 'https://www.zeptonow.com',
        'calories': 113,
        'protein': 25.0,
        'carbs': 2.5,
        'fat': 1.0,
        'serving_size': '33g',
        'macro_tag': '25g Protein',
        'ingredients': 'Whey Protein Concentrate, Whey Protein Isolate, DigeZyme Blend, Cocoa Powder, Sucralose',
        'delivery_eta': '8-12 mins',
        'is_featured': True,
        'is_available': True,
    },
    {
        'name': 'Epigamia Greek Yogurt',
        'description': 'Thick, creamy Greek yogurt made with real blueberries. Strained multiple times for that rich texture. High in natural protein, live probiotic cultures, and zero artificial preservatives. Perfect snack or breakfast.',
        'category_slug': 'high-protein',
        'price': 199.00,
        'image_url': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format',
        'partner_name': 'Swiggy Instamart',
        'affiliate_link': 'https://www.swiggy.com/instamart',
        'calories': 90,
        'protein': 8.5,
        'carbs': 10.0,
        'fat': 2.0,
        'serving_size': '90g',
        'macro_tag': '8.5g Protein',
        'ingredients': 'Skimmed Milk, Live Cultures, Blueberry Compote, Pectin',
        'delivery_eta': '15-20 mins',
        'is_featured': False,
        'is_available': True,
    },
    {
        'name': 'Alpino Natural Peanut Butter',
        'description': 'Made from 100% roasted peanuts with no added sugar, salt, or palm oil. Alpino Crunchy Peanut Butter delivers 30g of natural protein per 100g. The perfect high-protein spread for toast, smoothies, or oats.',
        'category_slug': 'healthy-snacks',
        'price': 399.00,
        'image_url': 'https://images.unsplash.com/photo-1612187209234-8e0b2ae4f2bd?w=600&auto=format',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com',
        'calories': 598,
        'protein': 30.0,
        'carbs': 22.0,
        'fat': 46.0,
        'serving_size': '32g (2 tbsp)',
        'macro_tag': '30g Protein / 100g',
        'ingredients': '100% Dry Roasted Peanuts',
        'delivery_eta': '10-15 mins',
        'is_featured': True,
        'is_available': True,
    },
    {
        'name': 'Yoga Bar Protein Bar',
        'description': 'Yoga Bar Oats & Honey Protein Bar provides 10g of plant protein with whole rolled oats, honey, and nuts. Clean label, no corn syrup, no artificial flavors. The ideal on-the-go fuel between meals.',
        'category_slug': 'healthy-snacks',
        'price': 65.00,
        'image_url': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&auto=format',
        'partner_name': 'Zepto',
        'affiliate_link': 'https://www.zeptonow.com',
        'calories': 185,
        'protein': 10.0,
        'carbs': 24.0,
        'fat': 6.0,
        'serving_size': '50g (1 bar)',
        'macro_tag': '10g Protein',
        'ingredients': 'Rolled Oats, Whey Protein, Honey, Almonds, Cashews, Dark Chocolate Chips',
        'delivery_eta': '8-12 mins',
        'is_featured': False,
        'is_available': True,
    },
    {
        'name': 'Farmley Premium Makhana',
        'description': 'Farmley roasted Makhana in tangy peri-peri flavor. Lotus seeds are a low-calorie, low-fat snack loaded with magnesium, potassium, and antioxidants. Zero maida, zero preservatives. Perfect guilt-free munching.',
        'category_slug': 'healthy-snacks',
        'price': 299.00,
        'image_url': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format',
        'partner_name': 'HealthKart',
        'affiliate_link': 'https://www.healthkart.com',
        'calories': 347,
        'protein': 9.7,
        'carbs': 76.9,
        'fat': 0.1,
        'serving_size': '30g',
        'macro_tag': 'Zero Fat',
        'ingredients': 'Lotus Seeds, Sunflower Oil, Spices, Salt, Citric Acid',
        'delivery_eta': '30-45 mins',
        'is_featured': False,
        'is_available': True,
    },
    {
        'name': 'Tetley Green Tea',
        'description': 'Tetley Natural Green Tea bags made from 100% natural tea leaves. Rich in antioxidants (catechins), each cup supports metabolism and immunity. Refreshing, light, and zero calories.',
        'category_slug': 'beverages',
        'price': 149.00,
        'image_url': 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=600&auto=format',
        'partner_name': 'Swiggy Instamart',
        'affiliate_link': 'https://www.swiggy.com/instamart',
        'calories': 0,
        'protein': 0.0,
        'carbs': 0.0,
        'fat': 0.0,
        'serving_size': '1 tea bag (200ml)',
        'macro_tag': 'Zero Calories',
        'ingredients': '100% Natural Green Tea Leaves',
        'delivery_eta': '15-20 mins',
        'is_featured': False,
        'is_available': True,
    },
    {
        'name': 'True Elements Rolled Oats',
        'description': 'True Elements Rolled Oats — whole grain, gluten-free, and minimally processed. High in beta-glucan fiber that helps lower cholesterol and keeps you full longer. Cooks in 3 minutes. Great for overnight oats, smoothies, or breakfast bowls.',
        'category_slug': 'organic-meals',
        'price': 349.00,
        'image_url': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&auto=format',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com',
        'calories': 379,
        'protein': 13.5,
        'carbs': 67.0,
        'fat': 7.0,
        'serving_size': '40g',
        'macro_tag': 'High Fibre',
        'ingredients': '100% Whole Grain Rolled Oats',
        'delivery_eta': '10-15 mins',
        'is_featured': True,
        'is_available': True,
    },
    {
        'name': 'MuscleBlaze Creatine Monohydrate',
        'description': 'MuscleBlaze Creatine Monohydrate — pure micronized creatine for enhanced strength, power output, and faster muscle recovery. 3g per serving is clinically proven to increase high-intensity exercise performance. Unflavored, dissolves easily.',
        'category_slug': 'supplements',
        'price': 799.00,
        'image_url': 'https://images.unsplash.com/photo-1616671285410-2043bbb3aa64?w=600&auto=format',
        'partner_name': 'HealthKart',
        'affiliate_link': 'https://www.healthkart.com',
        'calories': 0,
        'protein': 0.0,
        'carbs': 0.0,
        'fat': 0.0,
        'serving_size': '3g',
        'macro_tag': 'Pure Creatine',
        'ingredients': '100% Micronized Creatine Monohydrate',
        'delivery_eta': '30-45 mins',
        'is_featured': True,
        'is_available': True,
    },
    {
        'name': 'Ketofy Protein Granola',
        'description': 'Ketofy Keto Granola with 15g protein and just 2g net carbs per serving. Made with almonds, pumpkin seeds, sunflower seeds, and coconut flakes. No added sugar, no grains. Perfect for keto, low-carb, or high-protein diets.',
        'category_slug': 'organic-meals',
        'price': 499.00,
        'image_url': 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?w=600&auto=format',
        'partner_name': 'Zomato',
        'affiliate_link': 'https://www.zomato.com',
        'calories': 210,
        'protein': 15.0,
        'carbs': 4.0,
        'fat': 16.0,
        'serving_size': '45g',
        'macro_tag': '15g Protein',
        'ingredients': 'Almonds, Pumpkin Seeds, Sunflower Seeds, Coconut Flakes, Whey Protein Isolate, Erythritol, Stevia',
        'delivery_eta': '20-30 mins',
        'is_featured': False,
        'is_available': True,
    },
]

print("\nSeeding products...")
for p_data in PRODUCTS:
    category_slug = p_data.pop('category_slug')
    category = cat_map.get(category_slug)
    obj, created = Product.objects.update_or_create(
        name=p_data['name'],
        defaults={**p_data, 'category': category}
    )
    print(f"  {'Created' if created else 'Updated'}: {obj.name} ({obj.partner_name})")

print(f"\nDone! Seeded {len(PRODUCTS)} products across {len(CATEGORIES)} categories.")
