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

2. **Download & Extract Large Files**:
   Download the **AI Job Recommendation Library** ZIP file from Kaggle.
   
   **Download Link**: [AI Job Recommendation Library (Kaggle)](https://kaggle.com/datasets/ffc7bedbc062a1b1600496f4cf39d838afc9c55ab4bdf526779c27cd9ecdd89b)
   
   **Extraction Instructions**:
   - Extract the ZIP file.
   - Move both the `linkedin_master_library.csv` and `linkedin_jobs_v3.index` into the following directory:
     ```text
     backend/app/models/
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Run Server**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
