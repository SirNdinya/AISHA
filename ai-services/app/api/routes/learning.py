from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Any, Dict
from fastapi import UploadFile, File, Form
from pydantic import BaseModel

from app.core.database import get_db
from app.services.learning_service import LearningService
from app.services.transcript_service import TranscriptService
from fastapi.responses import Response

router = APIRouter()

# Simple schemas for response
class ResourceResponse(BaseModel):
    id: str
    title: str
    provider: str
    url: str
    category: str
    reason: str
    is_free: bool

class GapResponse(BaseModel):
    student_id: UUID
    missing_skills: List[str]

@router.get("/gaps/{student_id}", response_model=GapResponse)
def get_student_gaps(
    student_id: UUID = Path(..., title="Student ID"),
    db: Session = Depends(get_db)
):
    """
    Identify missing skills for the student based on their specialization.
    """
    service = LearningService(db)
    gaps = service.analyze_skill_gaps(str(student_id))
    return GapResponse(student_id=student_id, missing_skills=gaps)


@router.get("/recommendations/{student_id}", response_model=List[ResourceResponse])
async def get_learning_recommendations(
    student_id: UUID = Path(..., title="Student ID"),
    db: Session = Depends(get_db)
):
    """
    Get recommended learning resources based on skill gaps.
    """
    service = LearningService(db)
    matches = await service.recommend_resources(str(student_id))
    return matches

@router.get("/search", response_model=List[ResourceResponse])
async def search_learning_resources(
    q: str,
    db: Session = Depends(get_db)
):
    """
    Search for learning resources online.
    """
    from app.services.scraper_service import AutonomousScraperService
    scraper = AutonomousScraperService()
    results = await scraper.scout_real_time(q, category="learning", limit=5)
    
    # Map scraper results to ResourceResponse
    recommendations = []
    for res in results:
        recommendations.append({
            "id": str(UUID(int=0)), # Placeholder
            "title": res["title"],
            "provider": res["provider"],
            "url": res["url"],
            "category": "Online Search",
            "reason": f"Top result for search: {q}",
            "is_free": True
        })
    return recommendations

@router.post("/certificate")
async def upload_certificate(
    student_id: UUID = Form(...),
    skill_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a certificate to verify a skill.
    """
    service = LearningService(db)
    # Save file (MVP: skip actual save, just pass name)
    service.upload_certificate(str(student_id), skill_name, file.filename)
    return {"status": "verified", "skill": skill_name}

@router.post("/analyze-transcript")
async def analyze_transcript(data: Dict[str, Any]):
    """
    Analyze transcript records.
    """
    analysis = await TranscriptService.analyze_performance(data.get("records", []))
    return {"status": "success", "data": analysis}

@router.post("/download-transcript")
async def download_transcript(data: Dict[str, Any]):
    """
    Generate and download PDF transcript analysis.
    """
    pdf_bytes = TranscriptService.generate_pdf_report(
        data.get("student_name", "Student"),
        data.get("records", []),
        data.get("analysis", {})
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=transcript_report.pdf"}
    )
