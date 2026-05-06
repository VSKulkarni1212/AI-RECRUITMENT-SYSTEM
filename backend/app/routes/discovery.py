from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.search_engine import search_jobs
from ..services.parser import clean_extracted_text

router = APIRouter()

class SearchRequest(BaseModel):
    resume_text: str

@router.post("/search")
async def find_and_rank_jobs(request: SearchRequest):
    try:
        # Clean the text using our parser logic (same as notebook)
        clean_resume = clean_extracted_text(request.resume_text)
        
        # 1. Retrieval (Find top jobs with metadata)
        ranked_list = search_jobs(clean_resume, top_k=5)

        # Return top 5 to the Interface Team
        return {"status": "success", "results": ranked_list[:5]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))