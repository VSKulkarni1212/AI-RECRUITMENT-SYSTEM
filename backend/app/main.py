from fastapi import FastAPI
from app.routes import ranker, discovery, upload

# Initialize the Server
app = FastAPI(
    title="AI Recruitment System API",
    description="Backend for SNN-FAISS Search, LambdaMART Ranking, and Resume Parsing",
    version="1.0.0"
)

# Connect the Routers
app.include_router(ranker.router, prefix="/api/v1")
app.include_router(discovery.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "engine": "XGBRanker (LambdaMART) & SNN-FAISS",
        "features": ["Semantic Vibe", "Edu Score", "Exp Years", "Profile Quality", "Skill Score", "Job Recommendations", "Resume Parsing"]
    }