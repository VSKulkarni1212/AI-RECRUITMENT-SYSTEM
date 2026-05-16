import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

res = supabase.table("jobs").select("*").limit(1).execute()
if res.data:
    print("Schema for jobs table:")
    for key in res.data[0].keys():
        print(f" - {key}")
else:
    print("No jobs found to check schema.")
