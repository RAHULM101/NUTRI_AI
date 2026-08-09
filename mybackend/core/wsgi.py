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
    from api.models import StoreCategory
    
    print("Running automatic startup database migrations...")
    call_command('migrate', interactive=False)
    print("Startup migrations completed successfully!")
    
    if not StoreCategory.objects.exists():
        print("Store categories empty. Running database seeder...")
        seed_script = os.path.join(settings.BASE_DIR, 'seed_store.py')
        if os.path.exists(seed_script):
            print(f"Executing: {sys.executable} {seed_script}")
            subprocess.run([sys.executable, seed_script], check=True)
            print("Database seeding completed successfully!")
        else:
            print(f"Seed script not found at: {seed_script}")
except Exception as e:
    print(f"Error running startup migrations/seeding: {e}")
