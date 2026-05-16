from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..supabase_client import get_supabase

router = APIRouter()

class JobBase(BaseModel):
    title: str
    company: str
    location: str
    description: str
    skills: List[str] = []

class StatusUpdate(BaseModel):
    app_ids: List[int]
    status: str

class JobCreate(JobBase):
    pass

class JobOut(JobBase):
    id: int
    class Config:
        orm_mode = True

@router.get("/jobs")
def get_all_jobs(email: Optional[str] = None, supabase = Depends(get_supabase)):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase client not initialized.")
    
    try:
        query = supabase.table("jobs").select("*, applications(id)")
        
        if email:
            # Find recruiter ID by email (case-insensitive)
            email_lower = email.lower().strip()
            rec_res = supabase.table("recruiters").select("id").ilike("email", email_lower).execute()
            
            if rec_res.data:
                query = query.eq("recruiter_id", rec_res.data[0]["id"])
            else:
                # If email provided but recruiter not found, return empty list
                # This prevents showing other people's jobs or erroring out
                print(f"[INFO] No recruiter found for email: {email_lower}")
                return []

        response = query.order("id", desc=True).execute()
        jobs = response.data
        
        if not jobs:
            return []
        
        # Format the response to match the expected frontend contract
        formatted_jobs = []
        for j in jobs:
            formatted_jobs.append({
                "id": j.get("id"), 
                "title": j.get("job_title", "N/A"), 
                "company": j.get("company", "N/A"), 
                "location": j.get("location", "N/A"), 
                "description": j.get("description", ""), 
                "skills": j.get("skills", []),
                "applicant_count": len(j.get("applications", [])) if isinstance(j.get("applications"), list) else 0
            })
        return formatted_jobs
    except Exception as e:
        print(f"[ERROR] Database error in get_all_jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

import time

class JobCreateInput(BaseModel):
    title: str
    company: str
    location: str
    description: str
    skills: List[str] = []
    recruiter_email: Optional[str] = None

@router.post("/jobs")
def create_job(job: JobCreateInput, supabase = Depends(get_supabase)):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase client not initialized.")
    try:
        recruiter_id = None
        if job.recruiter_email:
            email_lower = job.recruiter_email.lower().strip()
            res = supabase.table("recruiters").select("id").ilike("email", email_lower).execute()
            if res.data:
                recruiter_id = res.data[0]["id"]
            else:
                # If recruiter not found by email, we should probably return an error
                # or at least log it loudly. For now, let's try to find them in auth.users?
                # Actually, if they are calling this, they should exist in the recruiters table.
                raise HTTPException(status_code=404, detail=f"Recruiter with email {email_lower} not found. Please ensure your profile is complete.")
        
        job_index = int(time.time() * 1000) % 1000000000 # unique
        
        insert_data = {
            "job_title": job.title,
            "company": job.company,
            "location": job.location,
            "description": job.description,
            "skills": job.skills,
            "job_index": job_index
        }
        if recruiter_id:
            insert_data["recruiter_id"] = recruiter_id
            
        result = supabase.table("jobs").insert(insert_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to insert job into database.")

        j = result.data[0]
        return {
            "id": j.get("id"),
            "title": j.get("job_title"),
            "company": j.get("company"),
            "location": j.get("location"),
            "description": j.get("description"),
            "skills": j.get("skills", [])
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"[ERROR] Database error in create_job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

class ScoreUpdateItem(BaseModel):
    id: int
    match_score: float

class ScoreUpdate(BaseModel):
    updates: List[ScoreUpdateItem]

@router.put("/applications/scores")
async def update_applications_scores(payload: ScoreUpdate):
    try:
        supabase = get_supabase()
        # Supabase Python client doesn't support bulk upsert easily with different values.
        # We can update them one by one, or use a loop. Since it's usually < 50 applicants, loop is fine.
        count = 0
        for item in payload.updates:
            supabase.table("applications").update({"match_score": item.match_score}).eq("id", item.id).execute()
            count += 1
        return {"status": "success", "updated": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/applications/status")
async def update_applications_status(payload: StatusUpdate):
    try:
        supabase = get_supabase()
        result = supabase.table("applications").update({"status": payload.status}).in_("id", payload.app_ids).execute()
        return {"status": "success", "updated": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}/applicants")
async def get_job_applicants(job_id: int):
    try:
        supabase = get_supabase()
        # Fetch applications with candidates joined
        res = supabase.table("applications").select(
            "id, match_score, status, applied_at, candidate_id, candidates(full_name, email, resume_text)"
        ).eq("job_id", job_id).order("match_score", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
