# AI Recruitment System

This is an AI-powered recruitment backend featuring semantic job discovery and candidate ranking.

## Features
- **Job Recommendation**: SNN + FAISS for high-vibe matching.
- **Candidate Ranking**: XGBoost (LambdaMART) for HR candidate assessment.
- **Resume Parsing**: Automated text extraction from PDF/DOCX.

## Setup Instructions

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/VSKulkarni1212/AI-RECRUITMENT-SYSTEM.git
   ```

2. **Download Large Files**:
   Download both required data files from the **AI Job Recommendation Library** and place them in `backend/app/models/`:
   - `linkedin_master_library.csv` (4.16 GB)
   - `linkedin_jobs_v3.index` (490 MB)
   
   **Download Link**: [AI Job Recommendation Library (Kaggle)](https://kaggle.com/datasets/ffc7bedbc062a1b1600496f4cf39d838afc9c55ab4bdf526779c27cd9ecdd89b)

3. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Run Server**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
