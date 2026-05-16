import os
import sys
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load env vars to get Supabase credentials
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from supabase import create_client, Client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Supabase credentials not found in .env")
    sys.exit(1)

supabase: Client = create_client(url, key)

def seed_demo():
    print("Fetching jobs...")
    response = supabase.table("jobs").select("*").execute()
    jobs = response.data
    
    if not jobs:
        print("No jobs found in the database. Please create a 'Business Analyst' job from the frontend first!")
        sys.exit(1)
        
    print("\nAvailable Jobs:")
    for j in jobs:
        print(f"[{j['id']}] {j['job_title']} (Recruiter ID: {j['recruiter_id']})")
        
    if len(sys.argv) > 1:
        job_id = sys.argv[1].strip()
    else:
        job_id = input("\nEnter the Job ID you want to seed candidates for: ").strip()
        
    try:
        job_id = int(job_id)
    except:
        print("Invalid Job ID")
        sys.exit(1)
        
    # Verify job
    job = next((j for j in jobs if j['id'] == job_id), None)
    if not job:
        print("Job not found.")
        sys.exit(1)

    print(f"\nDeleting old demo candidates for '{job['job_title']}'...")
    # Delete old demo applications
    supabase.table("applications").delete().eq("job_id", job_id).execute()
    
    print(f"\nSeeding 10 NEW candidates for '{job['job_title']}' (1 Star, 9 Average/Poor)...")

    first_names = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Cameron", "Quinn", "Avery", "Skyler"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    
    # 1 PERFECT CANDIDATE
    perfect_skills = ["SQL", "Python", "Tableau", "Power BI", "Data Analysis", "Agile", "Business Strategy"]
    perfect_resume = f"Experience: 8 years.\nEducation: Level 4.\nI am an expert Business Analyst with extensive experience in requirements gathering, financial modeling, SQL, Tableau, and driving business strategy across enterprise teams.\n\n[SKILLS_PARSED]: {', '.join(perfect_skills)}"
    
    cand_data = {
        "email": f"star.candidate@example.com",
        "full_name": "Elena Star (Top Match)",
        "resume_text": perfect_resume,
        "years_exp": 8,
        "edu_score": 4, # PhD
        "profile_quality": 98
    }
    res = supabase.table("candidates").insert(cand_data).execute()
    cand_id = res.data[0]['id']
    supabase.table("applications").insert({
        "job_id": job_id, "candidate_id": cand_id, "status": "Applied",
        "applied_at": datetime.now().isoformat(), "match_score": 0
    }).execute()
    print(f"Inserted: Elena Star (8 yrs exp, 7 skills) - EXPECT 80+ SCORE")

    # 9 POOR/AVERAGE CANDIDATES
    poor_skills_pool = ["Customer Service", "Data Entry", "Microsoft Word", "Retail", "Social Media"]
    
    for i in range(9):
        name = f"{first_names[i]} {last_names[i]}"
        email = f"{name.replace(' ', '.').lower()}{random.randint(10,99)}@example.com"
        
        exp = random.randint(0, 2)
        edu = random.randint(1, 2)
        c_skills = random.sample(poor_skills_pool, random.randint(1, 3))
        
        resume_text = f"Experience: {exp} years.\nEducation: Level {edu}.\nI am a hardworking professional looking for a new opportunity.\n\n[SKILLS_PARSED]: {', '.join(c_skills)}"
        
        cand_data = {
            "email": email,
            "full_name": name,
            "resume_text": resume_text,
            "years_exp": exp,
            "edu_score": edu,
            "profile_quality": random.randint(40, 60)
        }
        res = supabase.table("candidates").insert(cand_data).execute()
        cand_id = res.data[0]['id']
        supabase.table("applications").insert({
            "job_id": job_id, "candidate_id": cand_id, "status": "Applied",
            "applied_at": (datetime.now() - timedelta(days=random.randint(1, 10))).isoformat(),
            "match_score": 0
        }).execute()
        print(f"Inserted: {name} ({exp} yrs exp, {len(c_skills)} skills) - EXPECT < 70 SCORE")

    print("\nSuccessfully seeded!")
    print("Now, go to the Recruiter Portal and click 'Rank Candidates' to see the XGBoost model rank them live!")

if __name__ == "__main__":
    seed_demo()
