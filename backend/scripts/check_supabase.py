import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

print("Checking recruiters...")
recruiters = supabase.table("recruiters").select("*").execute()
print(f"Total recruiters: {len(recruiters.data)}")
for r in recruiters.data:
    print(f" - {r.get('email')} (ID: {r.get('id')})")

print("\nChecking jobs...")
jobs = supabase.table("jobs").select("id, job_title, recruiter_id").execute()
print(f"Total jobs: {len(jobs.data)}")
for j in jobs.data:
    print(f" - {j.get('job_title')} (ID: {j.get('id')}, Recruiter ID: {j.get('recruiter_id')})")
