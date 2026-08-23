"""
NIA Web Search Fallback Service
================================
Provides trusted, domain-whitelisted web search for nutrition queries
that fall below the local RAG confidence threshold.

Three-layer protection:
  1. Off-topic pre-filter (in utils.py)
  2. Nutrition intent classifier (here)
  3. Trusted domain whitelist enforced at Tavily API level (here)
"""

import os
import re
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# TRUSTED DOMAIN WHITELIST
# Only results from these domains are accepted — enforced at API level
# ─────────────────────────────────────────────────────────────────────────────
TRUSTED_NUTRITION_DOMAINS = [
    # International Health Authorities
    "pubmed.ncbi.nlm.nih.gov",
    "pmc.ncbi.nlm.nih.gov",
    "nih.gov",
    "who.int",
    "nhs.uk",
    "mayoclinic.org",
    "healthline.com",
    "medicalnewstoday.com",
    "nutritionvalue.org",
    "fdc.nal.usda.gov",
    "academic.oup.com",
    "sciencedirect.com",
    "webmd.com",

    # India-Specific Health & Nutrition Authorities
    "icmr.gov.in",
    "fssai.gov.in",
    "vikaspedia.in",
    "nhp.gov.in",
    "mohfw.gov.in",
    "ninfamed.gov.in",          # National Institute of Nutrition India
    "nutritionfoundationofindia.res.in",
]

# ─────────────────────────────────────────────────────────────────────────────
# NUTRITION INTENT CLASSIFIER
# Keywords that confirm a query is food/nutrition related
# ─────────────────────────────────────────────────────────────────────────────
NUTRITION_TOPICS = {
    # Core nutrition
    'food', 'nutrition', 'diet', 'calorie', 'calories', 'protein', 'carbs',
    'carbohydrate', 'fat', 'fiber', 'fibre', 'vitamin', 'mineral', 'supplement',
    'meal', 'recipe', 'ingredient', 'eat', 'eating', 'drink', 'drinking',
    'nutrient', 'nutrients', 'macro', 'macros', 'micronutrient',

    # Foods & ingredients
    'fruit', 'vegetable', 'grain', 'legume', 'pulse', 'dal', 'roti', 'rice',
    'wheat', 'oats', 'quinoa', 'millet', 'barley', 'nuts', 'seeds', 'oil',
    'ghee', 'paneer', 'curd', 'yogurt', 'milk', 'dairy', 'egg', 'chicken',
    'fish', 'meat', 'tofu', 'soy', 'lentil', 'bean', 'chickpea',

    # Health conditions related to nutrition
    'diabetes', 'diabetic', 'pcos', 'thyroid', 'cholesterol', 'obesity',
    'weight loss', 'weight gain', 'digestion', 'metabolism', 'gut health',
    'iron deficiency', 'anaemia', 'anemia', 'calcium', 'bone health',
    'blood sugar', 'blood pressure', 'heart health', 'liver',

    # Diet types & approaches
    'vegetarian', 'vegan', 'keto', 'ketogenic', 'paleo', 'intermittent fasting',
    'gluten free', 'lactose', 'allergy', 'intolerance', 'detox', 'cleanse',
    'ayurvedic', 'sattvic', 'probiotic', 'prebiotic', 'antioxidant',

    # Fitness & body composition
    'muscle', 'bodybuilding', 'gym', 'fitness', 'workout nutrition', 'recovery',
    'pre workout', 'post workout', 'hydration', 'water intake', 'electrolyte',

    # Indian specific terms
    'desi ghee', 'tulsi', 'turmeric', 'haldi', 'ashwagandha', 'moringa',
    'amla', 'triphala', 'chyawanprash', 'sattu', 'ragi', 'jowar', 'bajra',
}

# Topics that sound health-related but are OUT of NIA's scope (clinical/medical)
BLOCKED_MEDICAL_TOPICS = {
    'surgery', 'chemotherapy', 'radiation therapy', 'cancer treatment',
    'mental illness', 'antidepressant', 'psychiatric', 'schizophrenia',
    'prescription drug', 'drug dosage', 'medication side effect',
    'vaccine', 'vaccination schedule', 'organ transplant', 'dialysis',
    'covid treatment', 'antibiotic', 'painkiller dosage',
}


def is_blocked_medical_query(user_query: str) -> bool:
    """Returns True if the query is asking about acute medical treatment/drugs outside nutrition scope."""
    lower = user_query.lower()
    for blocked in BLOCKED_MEDICAL_TOPICS:
        if blocked in lower:
            return True
    return False


def is_nutrition_query(user_query: str) -> bool:
    """
    Returns True if the query is suitable for searching food/nutrition web sources.
    If it's blocked medical, returns False. Otherwise defaults to True for general health/food questions.
    """
    if is_blocked_medical_query(user_query):
        return False
    # Almost all non-blocked queries asking Nia can be searched for nutrition context
    return True



def search_trusted_nutrition_web(query: str, max_results: int = 3) -> list:
    """
    Calls Tavily API with the trusted domain whitelist enforced at the API level.
    Returns a list of dicts: {title, url, content, domain}
    Returns empty list if Tavily is not configured or search fails.
    """
    tavily_key = getattr(settings, 'TAVILY_API_KEY', None) or os.environ.get('TAVILY_API_KEY')

    if not tavily_key or tavily_key == 'your_tavily_api_key_here':
        logger.warning("[WebSearch] TAVILY_API_KEY not configured. Skipping web search.")
        return []

    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=tavily_key)

        # Scope query to nutrition context for better results
        scoped_query = f"nutrition health diet food: {query}"

        response = client.search(
            query=scoped_query,
            search_depth="basic",
            max_results=max_results,
            include_domains=TRUSTED_NUTRITION_DOMAINS,
            include_answer=False,
        )

        results = []
        for item in response.get("results", []):
            url = item.get("url", "")
            content = item.get("content", "").strip()
            title = item.get("title", "")

            # Secondary validation: content must mention a nutrition keyword
            content_lower = content.lower()
            is_relevant = any(topic in content_lower for topic in list(NUTRITION_TOPICS)[:30])

            if content and is_relevant:
                domain = _extract_domain(url)
                results.append({
                    "title": title,
                    "url": url,
                    "content": content[:800],  # cap per-result length
                    "domain": domain,
                })

        logger.info(f"[WebSearch] Found {len(results)} validated results for query: '{query}'")
        return results

    except ImportError:
        logger.error("[WebSearch] tavily-python not installed. Run: pip install tavily-python")
        return []
    except Exception as e:
        logger.error(f"[WebSearch] Tavily search failed: {e}")
        return []


def build_web_context_block(web_results: list) -> str:
    """
    Formats validated web results into a prompt-ready context block.
    """
    if not web_results:
        return ""

    blocks = []
    for idx, r in enumerate(web_results):
        blocks.append(
            f"[Web Source {idx+1}: {r['title']} | {r['domain']}]\n"
            f"{r['content']}\n"
            f"URL: {r['url']}"
        )
    return "\n\n".join(blocks)


def _extract_domain(url: str) -> str:
    """Extracts readable domain name from a URL."""
    try:
        match = re.search(r'https?://(?:www\.)?([^/]+)', url)
        return match.group(1) if match else url
    except Exception:
        return url
