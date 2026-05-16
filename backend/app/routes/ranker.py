from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from ..services.scoring_engine import rank_candidates_service

router = APIRouter()

class ResumeItem(BaseModel):
    id: str
    text: str

class RankRequest(BaseModel):
    job_description: str
    resumes: List[ResumeItem]
    mandatory_skills: List[str] = []

@router.post("/rank-candidates")
async def process_ranking(request: RankRequest):
    try:
        # Validate input
        if not request.resumes:
            raise HTTPException(status_code=400, detail="Please provide at least one resume.")
        
        # Trigger the Brain
        ranked_list = rank_candidates_service(
            request.job_description, 
            request.resumes, 
            request.mandatory_skills
        )
        
        return {"status": "success", "results": ranked_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))