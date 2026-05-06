import os
import faiss
import pandas as pd
from .embedding_engine import get_snn_embedding

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# 1. Load FAISS Index
index = None
try:
    index_path = os.path.join(MODEL_DIR, "linkedin_jobs_v3.index")
    if os.path.exists(index_path):
        index = faiss.read_index(index_path)
    else:
        print("[WARNING] FAISS index not found at:", index_path)
except Exception as e:
    print(f"[WARNING] FAISS index loading failed: {e}")

# 2. Load Job Library (Metadata)
job_library = None
try:
    csv_path = os.path.join(MODEL_DIR, "linkedin_master_library.csv")
    if os.path.exists(csv_path):
        # Optimization: Only load columns needed for the UI to save memory
        # Total CSV is 4GB+, but titles are much smaller.
        job_library = pd.read_csv(csv_path, usecols=['job_title'])
        print(f"[INFO] Job library loaded: {len(job_library)} rows.")
    else:
        print("[WARNING] Job library CSV not found at:", csv_path)
except Exception as e:
    print(f"[WARNING] Job library loading failed: {e}")

def search_jobs(resume_text: str, top_k: int = 50):
    """
    Search the FAISS index for the most similar jobs and return metadata.
    Returns: List of dicts with job details
    """
    if index is None:
        raise ValueError("FAISS index is not loaded. Cannot perform search.")
        
    # Get 128-d vector from the Siamese Neural Network (SNN)
    resume_embedding = get_snn_embedding(resume_text)
    
    if resume_embedding is None:
        raise ValueError("SNN embedding model is not loaded.")
        
    # FAISS search
    distances, indices = index.search(resume_embedding, top_k)
    
    results = []
    for i in range(len(indices[0])):
        idx = int(indices[0][i])
        dist = float(distances[0][i])
        
        job_info = {
            "job_index": idx,
            "vibe_match_score": dist,
            "job_title": "Title not found"
        }
        
        # Look up metadata if library is loaded
        if job_library is not None and 0 <= idx < len(job_library):
            row = job_library.iloc[idx]
            job_info["job_title"] = str(row["job_title"])
            
        results.append(job_info)
        
    return results
