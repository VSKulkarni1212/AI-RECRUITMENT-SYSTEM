from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.search_engine import search_jobs
from ..services.scoring_engine import re_rank_jobs
from ..services.parser import clean_extracted_text

router = APIRouter()

class SearchRequest(BaseModel):
    resume_text: str

@router.post("/search")
async def find_and_rank_jobs(request: SearchRequest):
    try:
        # Clean the text using our parser logic (same as notebook)
        clean_resume = clean_extracted_text(request.resume_text)
        
        # 1. Retrieval (Find top 50 candidates via FAISS/SNN)
        initial_list = search_jobs(clean_resume, top_k=50)
        
        # 2. Re-Ranking (Use the XGBoost model for precision)
        ranked_list = re_rank_jobs(clean_resume, initial_list)

        # Return top 10 to the Interface Team
        return {"status": "success", "results": ranked_list[:10]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))