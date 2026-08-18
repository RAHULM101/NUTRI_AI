"""
WSGI config for core project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_wsgi_application()

# Run migrations and database seeding automatically on startup in production
try:
    from django.core.management import call_command
    import subprocess
    import sys
    from django.conf import settings
    from api.models import StoreCategory, Product
    
    print("Running automatic startup database migrations...")
    call_command('migrate', interactive=False)
    print("Startup migrations completed successfully!")
    
    # Check if we have old generic home links or external Grofers CDN links that need updating
    old_links = ['https://blinkit.com', 'https://www.zeptonow.com', 'https://www.swiggy.com/instamart', 'https://www.healthkart.com', 'https://www.zomato.com']
    has_old_links = Product.objects.filter(affiliate_link__in=old_links).exists()
    has_legacy_images = Product.objects.filter(image_url__icontains='grofers').exists()
    
    if not StoreCategory.objects.exists() or has_old_links or has_legacy_images:
        print("Database requires seeding/updating. Running database seeder...")
        seed_script = os.path.join(settings.BASE_DIR, 'seed_store.py')
        if os.path.exists(seed_script):
            print(f"Executing: {sys.executable} {seed_script}")
            subprocess.run([sys.executable, seed_script], check=True)
            print("Database seeding completed successfully!")
        else:
            print(f"Seed script not found at: {seed_script}")
except Exception as e:
    print(f"Error running startup migrations/seeding: {e}")
