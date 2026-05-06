import os
import xgboost as xgb
import pandas as pd
import numpy as np
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import util
from .embedding_engine import get_sbert_embedding, get_edu_score

# --- ROBUST PATH CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# 1. LOAD THE MODELS
model_ranker = xgb.XGBRanker()
model_ranker.load_model(os.path.join(MODEL_DIR, "recruitment_ranker_v2.json"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))

def extract_generalized_features(resume_text, job_desc):
    """Recreates your Kaggle Feature Extraction logic."""
    resume_text = str(resume_text).upper()
    job_text = str(job_desc).upper()
    
    # Dynamic Skill Discovery (TF-IDF)
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    try:
        vectorizer.fit_transform([job_text])
        important_terms = vectorizer.get_feature_names_out()
        match_count = sum(1 for term in important_terms if term in resume_text)
        skill_score = match_count / len(important_terms) if len(important_terms) > 0 else 0
    except:
        skill_score = 0

    # Semantic Education Scoring[cite: 1]
    edu_score = get_edu_score(resume_text)

    # Heuristic Features (Years & Quality)
    years = re.findall(r'(\d+)\+?\s*(?:YEARS?|YRS?)', resume_text)
    years_exp = max([int(y) for y in years]) if years else 0
    profile_quality = len(resume_text.split()) / 500
    
    return edu_score, years_exp, profile_quality, skill_score

def rank_candidates_service(job_desc, resumes_list, mandatory_skills=[]):
    """The full prediction pipeline: Features -> Scaling -> ML -> Heuristics."""
    job_emb = get_sbert_embedding(job_desc)
    results = []

    for resume in resumes_list:
        # Step A: Numeric Enrichment
        edu, exp, qual, skill = extract_generalized_features(resume, job_desc)
        
        # Step B: Semantic Vibe (Cosine Similarity)[cite: 1]
        res_emb = get_sbert_embedding(resume)
        vibe = util.cos_sim(job_emb, res_emb).item()
        
        # Step C: Normalization
        # Order: [semantic_vibe, edu_score, years_exp, profile_quality, skill_score]
        raw_features = np.array([[vibe, edu, exp, qual, skill]])
        scaled_features = scaler.transform(raw_features)
        
        # Step D: XGBoost Prediction
        ml_score = model_ranker.predict(scaled_features)[0]
        
        # Step E: Apply Business Logic (Multipliers)
        multiplier = 1.0
        for s in mandatory_skills:
            if s.upper() not in str(resume).upper():
                multiplier *= 0.5 
        
        if "SENIOR" in job_desc.upper() and exp > 8:
            multiplier *= 1.2
            
        results.append({
            "resume_preview": str(resume)[:120] + "...",
            "score": float(ml_score * multiplier),
            "experience": exp,
            "vibe_match": round(vibe, 4)
        })

    # Sort results: Highest Rank First
    results.sort(key=lambda x: x["score"], reverse=True)
    return results