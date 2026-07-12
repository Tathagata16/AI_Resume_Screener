from parser.pdf_parser import extract_text_from_pdf
from parser.docx_parser import extract_text_from_docx

def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from a file based on its extension (pdf or docx).
    """
    ext = filename.split(".")[-1].lower()
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ["docx", "doc"]:
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")
