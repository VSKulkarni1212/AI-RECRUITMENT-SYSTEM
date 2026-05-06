import fitz  # PyMuPDF
import docx
import io
import re

def parse_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def parse_docx(file_bytes: bytes) -> str:
    """Extracts text from a DOCX file."""
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])

def parse_txt(file_bytes: bytes) -> str:
    """Extracts text from a TXT file."""
    return file_bytes.decode('utf-8')

def parse_file(file_name: str, file_bytes: bytes) -> str:
    """Extracts text from an uploaded file based on its extension."""
    ext = file_name.split('.')[-1].lower()
    if ext == 'pdf':
        return parse_pdf(file_bytes)
    elif ext in ['docx', 'doc']:
        return parse_docx(file_bytes)
    elif ext == 'txt':
        return parse_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only PDF, DOCX, and TXT are supported.")

def clean_extracted_text(text: str) -> str:
    """Cleans the extracted text."""
    if not isinstance(text, str): return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text
