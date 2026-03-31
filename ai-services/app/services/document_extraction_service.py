import logging
from pypdf import PdfReader
import os
import asyncio

logger = logging.getLogger(__name__)

class DocumentExtractionService:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """
        Extracts all text from a PDF file synchronously.
        """
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return ""
            
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Failed to extract text from {file_path}: {e}")
            return ""
            
    @staticmethod
    async def extract_text_from_pdf_async(file_path: str) -> str:
        """
        Extracts text asynchronously by deferring to a background thread.
        """
        return await asyncio.to_thread(DocumentExtractionService.extract_text_from_pdf, file_path)

document_extraction_service = DocumentExtractionService()
