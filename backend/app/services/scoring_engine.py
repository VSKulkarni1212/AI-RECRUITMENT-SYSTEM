import os
import xgboost as xgb
import pandas as pd
import numpy as np
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import util
from .embedding_engine import get_sbert_embedding, get_edu_score

COMMON_SKILLS = [
    "PYTHON", "JAVASCRIPT", "REACT", "NODE.JS", "TYPESCRIPT", "SQL", "JAVA", 
    "C++", "DOCKER", "KUBERNETES", "AWS", "AZURE", "GCP", "TENSORFLOW", 
    "PYTORCH", "PANDAS", "SCIKIT-LEARN", "TABLEAU", "POWERBI", "UI/UX",
    "FIGMA", "SWIFT", "KOTLIN", "GO", "RUST", "SOLIDITY", "GRAPHQL"
]

# --- ROBUST PATH CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# Global variables for lazy loading
model_ranker = None
scaler = None

def load_ml_models():
    global model_ranker, scaler
    if model_ranker is None:
        try:
            print("[INFO] Loading XGBRanker model...")
            model_ranker = xgb.XGBRanker()
            model_ranker.load_model(os.path.join(MODEL_DIR, "recruitment_ranker_v2.json"))
        except Exception as e:
            print(f"[ERROR] Failed to load XGBRanker: {e}")
            
    if scaler is None:
        try:
            print("[INFO] Loading Scaler...")
            scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
        except Exception as e:
            print(f"[ERROR] Failed to load Scaler: {e}")

def extract_generalized_features(resume_text, job_desc):
    """Recreates your Kaggle Feature Extraction logic."""
    resume_text_lower = str(resume_text).lower()
    job_text_lower = str(job_desc).lower()
    
    # Dynamic Skill Discovery (TF-IDF)
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    try:
        vectorizer.fit_transform([job_text_lower])
        important_terms = vectorizer.get_feature_names_out()
        match_count = sum(1 for term in important_terms if term in resume_text_lower)
        skill_score = match_count / len(important_terms) if len(important_terms) > 0 else 0
    except:
        skill_score = 0

    # Semantic Education Scoring[cite: 1]
    edu_score = get_edu_score(resume_text)

    # Heuristic Features (Years & Quality)
    years = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', resume_text_lower)
    all_years = [int(y) for y in years] if years else []
    
    import datetime
    current_year = datetime.datetime.now().year
    range_patterns = [
        r'(20\d{2})[ \t]*(?:-|to|–|—)[ \t]*(?:(?:[a-z]{3,9}|\d{1,2}/)[ \t]*)?(20\d{2}|present|current|now)'
    ]
    for pattern in range_patterns:
        matches = re.findall(pattern, resume_text_lower)
        total_range_years = 0
        for start, end in matches:
            start_yr = int(start)
            end_yr = current_year if end in ['present', 'current', 'now'] else int(end)
            if end_yr >= start_yr:
                total_range_years += (end_yr - start_yr)
        if total_range_years > 0:
            all_years.append(total_range_years)
            
    valid_years = [y for y in all_years if 0 < y < 60]
    years_exp = max(valid_years) if valid_years else 0
    
    profile_quality = len(str(resume_text).split()) / 500
    
    return edu_score, years_exp, profile_quality, skill_score

def rank_candidates_service(job_desc, resumes_list, mandatory_skills=[]):
    """The full prediction pipeline: Features -> Scaling -> ML -> Heuristics."""
    job_emb = get_sbert_embedding(job_desc)
    results = []

    for item in resumes_list:
        # resumes_list is now a list of objects with 'id' and 'text'
        resume_id = item.id if hasattr(item, 'id') else (item['id'] if isinstance(item, dict) else None)
        resume_text = item.text if hasattr(item, 'text') else (item['text'] if isinstance(item, dict) else str(item))
        
        # Step A: Numeric Enrichment
        edu, exp, qual, skill = extract_generalized_features(resume_text, job_desc)
        
        # Step B: Semantic Vibe (Cosine Similarity)
        res_emb = get_sbert_embedding(resume_text)
        vibe = util.cos_sim(job_emb, res_emb).item()
        
        # Step C: Normalization
        # Weigh vibe and skill more heavily than raw experience/quality
        raw_features = np.array([[vibe, edu, exp, qual, skill]])
        scaled_features = scaler.transform(raw_features)
        
        # Step D: XGBoost Prediction
        ml_score = model_ranker.predict(scaled_features)[0]
        
        # Step E: Apply Business Logic (Multipliers)
        # Stricter multiplier: If skill match is zero, drop score significantly
        multiplier = 1.0
        if skill == 0:
            multiplier *= 0.3
            
        for s in mandatory_skills:
            if s.upper() not in str(resume_text).upper():
                multiplier *= 0.6
        
        # Seniority match logic
        if "SENIOR" in job_desc.upper():
            if exp < 5: multiplier *= 0.5
            elif exp > 8: multiplier *= 1.2
        elif "JUNIOR" in job_desc.upper() or "ENTRY" in job_desc.upper():
            if exp > 5: multiplier *= 0.7 # Overqualified
            
        # Convert ml_score (usually 0-5) to a 0-100 range for the UI
        final_score = float(np.clip(ml_score * multiplier * 20, 10, 98))
            
        results.append({
            "id": resume_id,
            "resume_preview": str(resume_text)[:120] + "...",
            "score": final_score,
            "experience": exp,
            "skills": skill * 100, # Represent as percentage for ranking
            "extracted_skills": [s for s in COMMON_SKILLS if s.upper() in str(resume_text).upper()][:5],
            "edu_score": edu,
            "vibe_match": round(vibe, 4)
        })

    # Sort results: Highest Rank First
    results.sort(key=lambda x: x["score"], reverse=True)
    return results

def re_rank_jobs(resume_text, jobs_list):
    """
    Takes a candidate's resume and a list of jobs (from FAISS),
    and re-ranks them using the XGBoost model for better precision.
    """
    load_ml_models()
    
    resume_emb = get_sbert_embedding(resume_text)
    results = []
    
    for job in jobs_list:
        job_title = job.get('job_title', '')
        job_summary = job.get('job_summary', '')
        job_skills = job.get('job_skills', '')
        job_text = f"{job_title} {job_summary} {job_skills}"
        
        # 1. Feature Extraction
        edu, exp, qual, skill = extract_generalized_features(resume_text, job_text)
        
        # 2. Semantic Vibe
        job_emb = get_sbert_embedding(job_text)
        vibe = util.cos_sim(resume_emb, job_emb).item()
        
        # 3. XGBoost Scoring
        if model_ranker is None or scaler is None:
            # Fallback
            job_copy = job.copy()
            job_copy['vibe_match_score'] = float(vibe * 100)
            results.append(job_copy)
            continue
            
        raw_features = np.array([[vibe, edu, exp, qual, skill]])
        scaled_features = scaler.transform(raw_features)
        ml_score = model_ranker.predict(scaled_features)[0]
        
        # 4. Map to output
        # Convert ml_score (usually 0-5) to a 0-100 range for the UI
        final_score = float(np.clip(ml_score * 20, 10, 98))
        
        job_copy = job.copy()
        job_copy['vibe_match_score'] = final_score
        results.append(job_copy)
        
    # Sort by the new score
    if results:
        results.sort(key=lambda x: x.get('vibe_match_score', 0), reverse=True)
    return results