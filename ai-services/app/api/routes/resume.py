from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from app.core.database import get_db
from app.services.resume_service import ResumeService

router = APIRouter()

@router.post("/generate/{student_id}")
async def generate_resume(
    student_id: UUID,
    payload: Dict[str, str] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Generate an AI-powered resume based on minimal student info.
    """
    prompt = payload.get("prompt", "")
    if not prompt:
        raise HTTPException(status_code=400, detail="Minimal prompt is required")
        
    service = ResumeService(db)
    result = await service.generate_resume_from_minimal_info(str(student_id), prompt)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return {"status": "success", "data": result}
