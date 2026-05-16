import sys
import os
from dotenv import load_dotenv

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.supabase_client import get_supabase

def verify():
    print("--- Supabase Connection Verification ---")
    
    # 1. Check if .env exists
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.exists(env_path):
        print("[ERROR] .env file not found in the backend directory.")
        return

    # 2. Try to get client
    supabase = get_supabase()
    if not supabase:
        print("[ERROR] Supabase client could not be initialized. Check SUPABASE_URL and SUPABASE_KEY in .env")
        return

    # 3. Try a simple query
    try:
        # We try to select from the jobs table
        response = supabase.table("jobs").select("count", count="exact").limit(1).execute()
        print(f"[SUCCESS] Connection established! Total jobs in DB: {response.count}")
        
    except Exception as e:
        print(f"[ERROR] Connection failed: {str(e)}")
        print("\nPossible reasons:")
        print("1. Tables haven't been created yet (run scripts/schema.sql in Supabase).")
        print("2. Incorrect URL or Key.")
        print("3. Network/Firewall issues.")

if __name__ == "__main__":
    verify()
