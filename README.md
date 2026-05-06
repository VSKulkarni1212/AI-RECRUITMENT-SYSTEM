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
   Download these files and place them in `backend/app/models/`:
   - `linkedin_master_library.csv` (4.16 GB) - [Download from Kaggle](https://www.kaggle.com/datasets/vaishnaviskulkarni/linkedin-master-library)
   - `linkedin_jobs_v3.index` (490 MB) - *Note: Please ensure this file is uploaded to your Kaggle dataset or provide a direct link here.*

3. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Run Server**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
