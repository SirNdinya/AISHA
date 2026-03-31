from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from app.core.database import get_db
from app.services.matching_service import MatchingService
from app import models

router = APIRouter()

@router.get("/match/{student_id}/{opportunity_id}")
def explain_match(
    student_id: UUID, 
    opportunity_id: UUID, 
    db: Session = Depends(get_db)
):
    """
    Explain WHY a match score was given. 
    Returns the exact contribution of GPA, Skills, and Location.
    """
    matcher = MatchingService(db)
    
    student = db.query(models.Student).filter(models.Student.id == str(student_id)).first()
    opp = db.query(models.Opportunity).filter(models.Opportunity.id == str(opportunity_id)).first()
    
    if not student or not opp:
        raise HTTPException(status_code=404, detail="Student or Opportunity not found")
        
    # Re-calculate parts
    skill_score = matcher.calculate_skill_match_ml(student, opp)
    location_score = matcher.check_location_match(student, opp)
    
    interest_text = f"{opp.title} {opp.description}"
    interest_score = matcher.calculate_semantic_similarity(", ".join(student.interests) if student.interests else "", interest_text)
    
    # Application of Autonomous Weights (Matching MatchingService weights)
    final_score = (0.45 * skill_score) + (0.35 * interest_score) + (0.20 * location_score)
    
    return {
        "final_score": round(final_score * 100, 2),
        "breakdown": {
            "skills": {
                "score_raw": round(skill_score, 2),
                "contribution": round(0.45 * skill_score * 100, 2),
                "max_possible": 45.0,
                "weight": "45%",
                "note": "AI Semantic Analysis + Skill Intersection"
            },
            "interests": {
                "score_raw": round(interest_score, 2),
                "contribution": round(0.35 * interest_score * 100, 2),
                "max_possible": 35.0,
                "weight": "35%"
            },
            "location": {
                "score_raw": round(location_score, 2),
                "contribution": round(0.20 * location_score * 100, 2),
                "max_possible": 20.0,
                "weight": "20%"
            }
        },
        "verdict": "Highly Recommended" if final_score > 0.8 else "Good Match" if final_score > 0.6 else "Weak Match"
    }
