import os
import sys
import glob
import json
import traceback
import pandas as pd
import pypdf
import pdfplumber

# Setup Django Environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django
django.setup()

from django.conf import settings
from api.models import RagDocument
from google import genai

def get_gemini_client():
    api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"Warning: Could not init Gemini Client: {e}")
    return None

def generate_embedding(client, text):
    if not client:
        return None
    try:
        res = client.models.embed_content(
            model='text-embedding-004',
            contents=text[:2000] # Cap text length for vector embedding
        )
        if res and hasattr(res, 'embedding') and hasattr(res.embedding, 'values'):
            return res.embedding.values
    except Exception as e:
        print(f"--- Embedding Warning: {str(e)[:100]} ---")
    return None

def ingest_food_tables(data_dir, client):
    tables_dir = os.path.join(data_dir, "food_tables")
    if not os.path.exists(tables_dir):
        print(f"Directory not found: {tables_dir}")
        return

    csv_files = glob.glob(os.path.join(tables_dir, "*.csv"))
    print(f"\n--- Ingesting {len(csv_files)} Food Composition Table CSVs ---")

    for file_path in csv_files:
        filename = os.path.basename(file_path)
        print(f"Processing CSV: {filename}")
        try:
            df = pd.read_csv(file_path)
            # Fill NaNs with empty string / 0
            df = df.fillna("")
            
            created_count = 0
            for idx, row in df.iterrows():
                row_dict = row.to_dict()
                dish_name = str(row_dict.get("Dish Name") or row_dict.get("Food Name") or row_dict.get("name") or row_dict.get("Item") or f"Item {idx+1}")
                
                # Build rich textual summary for RAG retrieval
                formatted_lines = [f"Food / Dish: {dish_name}", f"Source Dataset: {filename}"]
                for k, v in row_dict.items():
                    if k not in ["Dish Name", "Food Name", "name", "Item"] and v != "":
                        formatted_lines.append(f"- {k}: {v}")
                
                content_text = "\n".join(formatted_lines)
                emb = generate_embedding(client, content_text)
                
                RagDocument.objects.create(
                    dataset_type="food_table",
                    source_name=filename,
                    title=dish_name,
                    content=content_text,
                    metadata={"row_index": idx, "dish_name": dish_name, "raw_data": row_dict},
                    embedding=emb
                )
                created_count += 1
            print(f"Successfully ingested {created_count} food records from {filename}.")
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            traceback.print_exc()

def extract_text_from_pdf(pdf_path):
    pages_text = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_idx, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append((page_idx + 1, text.strip()))
    except Exception as e:
        print(f"pdfplumber failed for {os.path.basename(pdf_path)}, falling back to pypdf: {e}")
        try:
            reader = pypdf.PdfReader(pdf_path)
            for page_idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append((page_idx + 1, text.strip()))
        except Exception as e2:
            print(f"pypdf also failed for {pdf_path}: {e2}")
    return pages_text

def ingest_pdfs_from_folder(folder_path, dataset_type, client):
    if not os.path.exists(folder_path):
        print(f"Directory not found: {folder_path}")
        return

    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))
    print(f"\n--- Ingesting {len(pdf_files)} PDFs from {dataset_type} ---")

    for file_path in pdf_files:
        filename = os.path.basename(file_path)
        doc_title = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
        print(f"Extracting PDF: {filename}...")
        
        pages_text = extract_text_from_pdf(file_path)
        if not pages_text:
            print(f"Warning: No text extracted from {filename}")
            continue

        created_chunks = 0
        for page_num, text in pages_text:
            # Chunk long pages into ~1500 char sections
            chunks = [text[i:i+1500] for i in range(0, len(text), 1200)] # 300 char overlap
            for chunk_idx, chunk_text in enumerate(chunks):
                full_chunk_content = f"Document: {doc_title} (Page {page_num})\n\n{chunk_text}"
                emb = generate_embedding(client, full_chunk_content)
                
                RagDocument.objects.create(
                    dataset_type=dataset_type,
                    source_name=filename,
                    page_number=page_num,
                    title=f"{doc_title} - Page {page_num} (Part {chunk_idx+1})",
                    content=full_chunk_content,
                    metadata={"page": page_num, "chunk_index": chunk_idx, "doc_title": doc_title},
                    embedding=emb
                )
                created_chunks += 1
        print(f"Successfully ingested {created_chunks} chunks from {filename}.")

def main():
    print("==================================================")
    print("      NIA CHAT RAG INGESTION PIPELINE")
    print("==================================================")
    
    data_dir = os.path.join(BASE_DIR, "data")
    if not os.path.exists(data_dir):
        print(f"Error: Data directory not found at {data_dir}")
        return

    client = get_gemini_client()
    if client:
        print("Gemini API Client initialized for vector embeddings generation.")
    else:
        print("Notice: Running without Gemini API Client. Chunks will be stored with full-text indexing.")

    # Optional: Clear existing RAG documents before re-ingestion
    existing_count = RagDocument.objects.count()
    if existing_count > 0:
        print(f"Clearing {existing_count} previous RAG document records...")
        RagDocument.objects.all().delete()

    # 1. Ingest Food Tables
    ingest_food_tables(data_dir, client)

    # 2. Ingest Vikaspedia Guidelines
    ingest_pdfs_from_folder(os.path.join(data_dir, "vikaspedia"), "vikaspedia", client)

    # 3. Ingest PMC Research PDFs
    ingest_pdfs_from_folder(os.path.join(data_dir, "pmc_pdfs"), "pmc_research", client)

    total_ingested = RagDocument.objects.count()
    print("==================================================")
    print(f"SUCCESS: Ingested {total_ingested} total RAG knowledge chunks into PostgreSQL!")
    print("==================================================")

if __name__ == "__main__":
    main()
