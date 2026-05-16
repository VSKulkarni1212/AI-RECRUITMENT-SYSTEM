import os
import faiss
import pandas as pd
from .embedding_engine import get_snn_embedding
from ..supabase_client import get_supabase

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# Global variables for lazy loading
index = None
df_metadata = None

def load_models():
    global index, df_metadata
    
    # 1. Load FAISS Index
    if index is None:
        try:
            index_path = os.path.join(MODEL_DIR, "linkedin_jobs_v3.index")
            if os.path.exists(index_path):
                print("[INFO] Loading FAISS index...")
                index = faiss.read_index(index_path)
            else:
                print("[WARNING] FAISS index not found at:", index_path)
        except Exception as e:
            print(f"[ERROR] FAISS index loading failed: {e}")

    # 2. CSV Metadata Lookup
    if df_metadata is None:
        try:
            csv_path = os.path.join(MODEL_DIR, "linkedin_master_library.csv")
            pkl_path = os.path.join(MODEL_DIR, "linkedin_master_library.pkl")
            
            if os.path.exists(pkl_path):
                print("[INFO] Loading metadata from binary cache (fast)...")
                df_metadata = pd.read_pickle(pkl_path)
            elif os.path.exists(csv_path):
                print("[INFO] Initializing metadata from CSV (this may take a moment)...")
                df_metadata = pd.read_csv(
                    csv_path, 
                    usecols=['job_link', 'job_title', 'job_summary', 'job_skills'],
                    memory_map=True,
                    low_memory=False
                )
                try:
                    df_metadata.to_pickle(pkl_path)
                    print("[INFO] Metadata cached for future fast loading.")
                except Exception as pe:
                    print(f"[WARNING] Could not create metadata cache: {pe}")
            else:
                print("[WARNING] CSV Metadata not found at:", csv_path)
        except Exception as e:
            print(f"[ERROR] Metadata loading failed: {e}")

def search_jobs(resume_text: str, top_k: int = 50):
    """
    Search the FAISS index and retrieve metadata from the local CSV.
    """
    # Lazy load models on first search request
    load_models()
    
    if index is None:
        raise ValueError("FAISS index is not loaded. Ensure models are in backend/app/models/")
        
    resume_embedding = get_snn_embedding(resume_text)
    if resume_embedding is None:
        raise ValueError("SNN embedding model is not loaded.")
        
    distances, indices = index.search(resume_embedding, top_k)
    
    results = []
    for i in range(len(indices[0])):
        idx = int(indices[0][i])
        dist = float(distances[0][i])
        
        # Default data
        job_title = "Title not found"
        company = "N/A"
        job_link = "#"
        
        # Lookup in CSV using positional index
        if df_metadata is not None and idx < len(df_metadata):
            row = df_metadata.iloc[idx]
            job_title = str(row['job_title'])
            company = "" # 'company' column was missing in CSV
            job_link = str(row['job_link'])
            
        job_info = {
            "job_index": idx,
            "vibe_match_score": dist,
            "job_title": job_title,
            "job_summary": str(row['job_summary']) if df_metadata is not None and idx < len(df_metadata) else "",
            "job_skills": str(row['job_skills']) if df_metadata is not None and idx < len(df_metadata) else "",
            "company": company,
            "job_link": job_link,
            "source": "Library"
        }
            
        results.append(job_info)
        
    return results
