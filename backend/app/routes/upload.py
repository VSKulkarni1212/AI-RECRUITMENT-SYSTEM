from fastapi import APIRouter, File, UploadFile, HTTPException
from ..services.parser import parse_file
from ..services.analyzer import analyze_resume

router = APIRouter()

@router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a resume or job description (PDF, DOCX, TXT) and extract its text.
    """
    try:
        file_bytes = await file.read()
        extracted_text = parse_file(file.filename, file_bytes)
        
        # Analyze the text for features
        analysis = analyze_resume(extracted_text)
        
        return {
            "status": "success",
            "filename": file.filename,
            "extracted_text": extracted_text,
            "analysis": analysis
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
