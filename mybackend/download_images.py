import os
import urllib.request

# Define target directory
target_dir = r"c:\Users\rahul\Documents\NUTRI_STORE\myfrontend\public\products"
os.makedirs(target_dir, exist_ok=True)

# Unsplash hotlink-safe image URLs mapping to each product's local filename
PRODUCT_IMAGES = {
    "on_whey.jpg": "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=600&q=80",
    "mb_whey.jpg": "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=600&q=80",
    "epigamia_yogurt.jpg": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
    "alpino_peanut_butter.jpg": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80",
    "yogabar_protein_bar.jpg": "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=600&q=80",
    "farmley_makhana.jpg": "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=600&q=80",
    "tetley_green_tea.jpg": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80",
    "true_elements_oats.jpg": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80",
    "mb_creatine.jpg": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    "true_elements_granola.jpg": "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&w=600&q=80"
}

print("Downloading product images...")
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for filename, url in PRODUCT_IMAGES.items():
    filepath = os.path.join(target_dir, filename)
    try:
        print(f"Downloading {filename}...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            with open(filepath, 'wb') as out_file:
                out_file.write(response.read())
        print(f"  Successfully saved to {filepath}")
    except Exception as e:
        print(f"  Failed to download {filename}: {e}")

print("All downloads finished.")
