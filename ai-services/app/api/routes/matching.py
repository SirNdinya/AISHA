from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.services.matching_service import MatchingService
from app import schemas

router = APIRouter()

@router.get("/recommendations/{student_id}", response_model=schemas.RecommendationResponse)
async def get_student_recommendations(
    student_id: UUID = Path(..., title="The ID of the student to match"),
    db: Session = Depends(get_db)
):
    """
    Get AI-calculated opportunity recommendations for a student.
    """
    service = MatchingService(db)
    matches = await service.calculate_matches_for_student(str(student_id))
    
    return schemas.RecommendationResponse(
        student_id=student_id,
        matches=matches
    )

@router.post("/calculate/{student_id}", response_model=schemas.RecommendationResponse)
async def calculate_matches(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Trigger a fresh calculation of matches (same as get for now, but semantically distinct for future async).
    """
    return await get_student_recommendations(student_id, db)
