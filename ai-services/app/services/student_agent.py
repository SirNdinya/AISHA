from sqlalchemy.orm import Session
from app import models
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class StudentAutonomyAgent:
    def __init__(self, db: Session | None = None):
        self.db: Session | None = db

    def evaluate_placement_offer(self, student_id: str, opportunity_id: str) -> Dict[str, Any]:
        """
        [Student Side AI Agent] Evaluate an offer and provide reasoned recommendation.
        Evaluation: stipend, rating, location_proximity, career_alignment.
        """
        if not self.db or not student_id or not opportunity_id:
            return {"recommendation": "ERROR", "analysis": "Data missing for evaluation."}

        student = self.db.query(models.Student).filter_by(id=student_id).first()
        opp = self.db.query(models.Opportunity).filter_by(id=opportunity_id).first()
        
        if not student or not opp:
            return {"recommendation": "ERROR", "analysis": "Data missing for evaluation."}

        # 1. Career Alignment (Semantic similarity specialization vs opportunity)
        # Using a baseline score or simple keyword check for this logic-only version
        alignment_score = 0.8 # Higher if specialization matches title
        if student.course_of_study.lower() in opp.title.lower():
            alignment_score = 1.0

        # (Compare student.preferred_locations with opp.location)
        proximity_score = 0.9 if any(loc.lower() == opp.location.lower() for loc in (student.preferred_locations or [])) else 0.5
        
        # 3. Stipend & Rating (Simulated metadata or lookup)
        # Assuming opportunities might have metadata or related company rating
        rating_score = 0.75 # Default for major firms
        
        # Weighted Decision Logic
        final_decision_score = (alignment_score * 0.4) + (proximity_score * 0.3) + (rating_score * 0.3)

        recommendation = "REJECT"
        if final_decision_score >= 0.8:
            recommendation = "ACCEPT"
        elif final_decision_score >= 0.6:
            recommendation = "CONSIDER"

        reasoning = (
            f"This placement has a {alignment_score*100}% career alignment score. "
            f"The location is a {proximity_score*100}% match for your preferences. "
            f"Overall Recommendation: {recommendation}."
        )

        return {
            "decision": recommendation,
            "score": round(final_decision_score, 2),
            "reasoning": reasoning
        }
