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
        'name': 'ON Gold Standard 100% Whey Protein (Double Rich Chocolate)',
        'description': 'Optimum Nutrition Gold Standard 100% Whey Protein — the world\'s best-selling whey protein. Packed with 24g of fast-digesting whey isolates per serving. Ideal post-workout recovery drink with low sugar and fat.',
        'category_slug': 'high-protein',
        'price': 3499.00,
        'image_url': '/products/on_whey.jpg',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com/prn/optimum-nutrition-on-double-rich-chocolate-gold-standard-100-whey-protein/prid/373977',
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
        'name': 'MuscleBlaze Biozyme Performance Whey (French Vanilla)',
        'description': 'MuscleBlaze Biozyme Performance Whey support lean muscle growth. Packaged with clinically tested 25g protein per serving and fortified with DigeZyme enzyme complex for better absorption.',
        'category_slug': 'high-protein',
        'price': 2899.00,
        'image_url': '/products/mb_whey.jpg',
        'partner_name': 'Zepto',
        'affiliate_link': 'https://www.zeptonow.com/pn/muscleblaze-biozyme-performance-whey-protein-powder-chocolate-hazelnut/pid/d18cccae-53c8-47b1-840a-5c249a0e671f',
        'calories': 113,
        'protein': 25.0,
        'carbs': 2.5,
        'fat': 1.0,
        'serving_size': '33g',
        'macro_tag': '25g Protein',
        'ingredients': 'Whey Protein Concentrate, Whey Protein Isolate, DigeZyme Blend, Sucralose, Natural Vanilla Flavours',
        'delivery_eta': '8-12 mins',
        'is_featured': True,
        'is_available': True,
    },
    {
        'name': 'Epigamia Blueberry Greek Yogurt',
        'description': 'Thick, creamy Greek yogurt made with real blueberries. Strained multiple times for that rich texture. High in natural protein, live probiotic cultures, and zero artificial preservatives. Perfect snack or breakfast.',
        'category_slug': 'high-protein',
        'price': 60.00,
        'image_url': '/products/epigamia_yogurt.jpg',
        'partner_name': 'Swiggy Instamart',
        'affiliate_link': 'https://www.swiggy.com/instamart/item/2f15e8da-77e8-4680-b6e5-48bdce02a249',
        'calories': 90,
        'protein': 8.5,
        'carbs': 10.0,
        'fat': 2.0,
        'serving_size': '85g',
        'macro_tag': '8.5g Protein',
        'ingredients': 'Skimmed Milk, Live Cultures, Blueberry Compote, Pectin',
        'delivery_eta': '15-20 mins',
        'is_featured': False,
        'is_available': True,
    },
    {
        'name': 'Alpino Natural Crunch Unsweetened Peanut Butter',
        'description': 'Made from 100% roasted peanuts with no added sugar, salt, or palm oil. Alpino Crunchy Peanut Butter delivers 30g of natural protein per 100g. The perfect high-protein spread for toast, smoothies, or oats.',
        'category_slug': 'healthy-snacks',
        'price': 399.00,
        'image_url': '/products/alpino_peanut_butter.jpg',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com/prn/alpino-natural-crunch-unsweetened-peanut-butter/prid/390977',
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
        'name': 'Yogabar Dark Chocolate Cranberry Protein Bar',
        'description': 'Yogabar Cranberry Protein Bar provides 10g of plant protein with whole rolled oats, honey, dark chocolate, and cranberries. Clean label, no corn syrup, no artificial flavors. The ideal on-the-go fuel between meals.',
        'category_slug': 'healthy-snacks',
        'price': 65.00,
        'image_url': '/products/yogabar_protein_bar.jpg',
        'partner_name': 'Zepto',
        'affiliate_link': 'https://www.zeptonow.com/pn/yogabar-dark-chocolate-cranberry-protein-bar/pid/3f28cf08-7264-4b55-aba3-8db2de34a2c5',
        'calories': 185,
        'protein': 10.0,
        'carbs': 24.0,
        'fat': 6.0,
        'serving_size': '50g (1 bar)',
        'macro_tag': '10g Protein',
        'ingredients': 'Rolled Oats, Whey Protein, Honey, Almonds, Cashews, Dark Chocolate Chips, Cranberries',
        'delivery_eta': '8-12 mins',
        'is_featured': False,
        'is_available': True,
    },
    {
        'name': 'Farmley Roasted Salted Peri Peri Makhana',
        'description': 'Farmley roasted Makhana in tangy peri-peri flavor. Lotus seeds are a low-calorie, low-fat snack loaded with magnesium, potassium, and antioxidants. Zero maida, zero preservatives. Perfect guilt-free munching.',
        'category_slug': 'healthy-snacks',
        'price': 299.00,
        'image_url': '/products/farmley_makhana.jpg',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com/prn/farmley-roasted-salted-peri-peri-makhana/prid/495202',
        'calories': 347,
        'protein': 9.7,
        'carbs': 76.9,
        'fat': 0.1,
        'serving_size': '30g',
        'macro_tag': 'Zero Fat',
        'ingredients': 'Lotus Seeds, Sunflower Oil, Spices, Salt, Citric Acid',
        'delivery_eta': '10-15 mins',
        'is_featured': False,
        'is_available': True,
    },
    {
        'name': 'Tetley Lemon & Honey Green Tea',
        'description': 'Tetley Natural Green Tea bags made from 100% natural tea leaves. Rich in antioxidants (catechins) with refreshing lemon and honey, each cup supports metabolism and immunity.',
        'category_slug': 'beverages',
        'price': 149.00,
        'image_url': '/products/tetley_green_tea.jpg',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com/prn/tetley-lemon-honey-green-tea-bags/prid/12454',
        'calories': 0,
        'protein': 0.0,
        'carbs': 0.0,
        'fat': 0.0,
        'serving_size': '1 tea bag (200ml)',
        'macro_tag': 'Zero Calories',
        'ingredients': '100% Natural Green Tea Leaves, Lemon & Honey Flavourings',
        'delivery_eta': '10-15 mins',
        'is_featured': False,
        'is_available': True,
    },
    {
        'name': 'True Elements Wholegrain Rolled Oats',
        'description': 'True Elements Rolled Oats — whole grain, gluten-free, and minimally processed. High in beta-glucan fiber that helps lower cholesterol and keeps you full longer. Cooks in 3 minutes. Great for overnight oats, smoothies, or breakfast bowls.',
        'category_slug': 'organic-meals',
        'price': 349.00,
        'image_url': '/products/true_elements_oats.jpg',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com/prn/true-elements-wholegrain-rolled-oats/prid/327733',
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
        'name': 'MuscleBlaze Micronised Creatine Monohydrate CreAMP',
        'description': 'MuscleBlaze Creatine Monohydrate — pure micronized creatine for enhanced strength, power output, and faster muscle recovery. 3g per serving is clinically proven to increase high-intensity exercise performance.',
        'category_slug': 'supplements',
        'price': 799.00,
        'image_url': '/products/mb_creatine.jpg',
        'partner_name': 'HealthKart',
        'affiliate_link': 'https://www.healthkart.com/product/muscleblaze-creamp-creatine-monohydrate-unflavoured-0.22-lb-100-g/SP-88339',
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
        'name': 'True Elements Dark Chocolate Granola',
        'description': 'True Elements Dark Chocolate Granola with rolled oats, honey, real dark chocolate, and almonds. No added refined sugars, no preservatives. Perfect for active, high-protein or organic breakfast lifestyles.',
        'category_slug': 'organic-meals',
        'price': 499.00,
        'image_url': '/products/true_elements_granola.jpg',
        'partner_name': 'Blinkit',
        'affiliate_link': 'https://blinkit.com/prn/true-elements-dark-chocolate-granola/prid/390233',
        'calories': 210,
        'protein': 15.0,
        'carbs': 4.0,
        'fat': 16.0,
        'serving_size': '45g',
        'macro_tag': '15g Protein',
        'ingredients': 'Almonds, Rolled Oats, Pumpkin Seeds, Sunflower Seeds, Dark Chocolate Chips, Honey',
        'delivery_eta': '10-15 mins',
        'is_featured': False,
        'is_available': True,
    },
]

print("\nSeeding products...")
seeded_names = []
for p_data in PRODUCTS:
    category_slug = p_data.pop('category_slug')
    category = cat_map.get(category_slug)
    obj, created = Product.objects.update_or_create(
        name=p_data['name'],
        defaults={**p_data, 'category': category}
    )
    seeded_names.append(obj.name)
    print(f"  {'Created' if created else 'Updated'}: {obj.name} ({obj.partner_name})")

# Safely delete any obsolete products
deleted_count, _ = Product.objects.exclude(name__in=seeded_names).delete()
if deleted_count > 0:
    print(f"Deleted {deleted_count} obsolete products.")

print(f"\nDone! Seeded {len(PRODUCTS)} products across {len(CATEGORIES)} categories.")
