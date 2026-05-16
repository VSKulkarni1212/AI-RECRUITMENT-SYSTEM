# AI Recruitment System

This is an AI-powered recruitment platform featuring semantic job discovery, candidate ranking, and seamless Supabase integration.

## 🚀 Features
- **Job Recommendation**: SNN + FAISS for high-vibe semantic matching across 40,000+ roles.
- **Candidate Ranking**: XGBoost (LambdaMART) for professional-grade candidate assessment.
- **Resume Parsing**: Automated text extraction from PDF and DOCX formats.
- **Dual-Source Database**: Hybrid flow using local CSV for massive library search and Supabase for active role management.

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/VSKulkarni1212/AI-RECRUITMENT-SYSTEM.git
cd AI-RECRUITMENT-SYSTEM
```

### 2. Database & Large Files
The system requires the **LinkedIn Job Library** for recommendations:
1. Download the ZIP from [Kaggle](https://kaggle.com/datasets/ffc7bedbc062a1b1600496f4cf39d838afc9c55ab4bdf526779c27cd9ecdd89b).
2. Extract and move `linkedin_master_library.csv` and `linkedin_jobs_v3.index` to `backend/app/models/`.

### 3. Environment Configuration

#### Backend Setup
1. Navigate to the `backend/` directory.
2. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your **Supabase URL** and **Service Role Key**.

#### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your **VITE_SUPABASE_URL** and **VITE_SUPABASE_ANON_KEY**.

### 4. Verify & Run

#### Backend
```bash
cd backend
pip install -r requirements.txt
python scripts/verify_supabase.py  # Check connection
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📐 Project Architecture
- **Backend**: FastAPI with Python. Handles SNN embeddings, FAISS search, and XGBoost ranking.
- **Frontend**: Vite + React + Tailwind CSS. Fully dynamic with zero hardcoded API URLs.
- **Database**: Supabase (PostgreSQL) for persistence and RLS-secured data management.
