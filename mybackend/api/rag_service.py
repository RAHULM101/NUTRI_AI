import os
import re
from django.db.models import Q
from .models import RagDocument
from google import genai
from django.conf import settings

try:
    from pgvector.django import VectorField as _VectorField
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False

def get_query_embedding(query_text):
    api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
    if not api_key or api_key == "your_gemini_api_key_here":
        return None
    try:
        client = genai.Client(api_key=api_key)
        res = client.models.embed_content(
            model='text-embedding-004',
            contents=query_text[:1000]
        )
        if res and hasattr(res, 'embedding') and hasattr(res.embedding, 'values'):
            return res.embedding.values
    except Exception as e:
        print(f"--- Query Embedding Warning: {e} ---")
    return None

def retrieve_relevant_context(user_query, top_k=5):
    """
    Hybrid Retriever combining Keyword Match + Vector Similarity
    Prioritizes PMC/Vikaspedia research for health queries and Food Tables for food queries.
    """
    if not user_query or not user_query.strip():
        return []

    query = user_query.strip()
    words = [w for w in re.findall(r'\w+', query.lower()) if len(w) > 2]
    
    results = []
    seen_ids = set()

    clinical_keywords = {'pcos', 'fasting', 'intermittent', 'hormone', 'hormones', 'obesity', 'guidelines', 'junk', 'research', 'disease', 'diabetes', 'thyroid', 'protein'}
    is_clinical = any(w in clinical_keywords for w in words)

    # 1. Direct Keyword Match
    if words:
        keyword_q = Q()
        for word in words:
            keyword_q |= Q(content__icontains=word) | Q(title__icontains=word)
        
        if is_clinical:
            kw_matches = list(RagDocument.objects.filter(keyword_q, dataset_type__in=['pmc_research', 'vikaspedia'])[:top_k*2])
            kw_matches += list(RagDocument.objects.filter(keyword_q, dataset_type='food_table')[:top_k])
        else:
            kw_matches = list(RagDocument.objects.filter(keyword_q, dataset_type='food_table')[:top_k*2])
            kw_matches += list(RagDocument.objects.filter(keyword_q, dataset_type__in=['pmc_research', 'vikaspedia'])[:top_k])

        for doc in kw_matches:
            if doc.id not in seen_ids:
                results.append({
                    "id": str(doc.id),
                    "dataset_type": doc.dataset_type,
                    "source_name": doc.source_name,
                    "page_number": doc.page_number,
                    "title": doc.title or doc.source_name,
                    "content": doc.content,
                    "score": 0.9
                })
                seen_ids.add(doc.id)

    # 2. Vector Cosine Similarity Search (if embeddings are present & pgvector is available)
    if PGVECTOR_AVAILABLE:
        emb = get_query_embedding(query)
        if emb:
            try:
                from pgvector.django import VectorField
                vector_matches = RagDocument.objects.exclude(embedding__isnull=True).order_by(
                    RagDocument.embedding.cosine_distance(emb)
                )[:top_k*2]
                
                for doc in vector_matches:
                    if doc.id not in seen_ids:
                        results.append({
                            "id": str(doc.id),
                            "dataset_type": doc.dataset_type,
                            "source_name": doc.source_name,
                            "page_number": doc.page_number,
                            "title": doc.title or doc.source_name,
                            "content": doc.content,
                            "score": 0.8
                        })
                        seen_ids.add(doc.id)
            except Exception as e:
                print(f"--- Vector Search Warning: {e} ---")

    return results[:top_k]
