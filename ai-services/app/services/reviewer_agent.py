from sqlalchemy.orm import Session
from app import models
from app.services.matching_service import MatchingService
from app.services.llm_service import llm_service
import logging

logger = logging.getLogger(__name__)

class ReviewerAgent:
    """
    Autonomous Reviewer Agent.
    Performs deep verification of applications using LLM.
    """
    
    def __init__(self, db: Session):
        self.db: Session = db
        self.matcher: MatchingService = MatchingService(db)

    async def review_application(self, application_id: str) -> dict:
        """
        Reviews a specific application.
        1. Calculates match score (Grade-Centric).
        2. Performs deep LLM verification of CV vs Requirements.
        3. Updates application status if 'auto_accept' is enabled for the opportunity.
        """
        app = self.db.query(models.Application).filter(models.Application.id == application_id).first()
        if not app:
            return {"error": "Application not found"}

        student = app.student
        opportunity = app.opportunity

        # 1. Get Match Score
        # Note: We need to await this as we updated it to be async
        match_details = await self.matcher.calculate_matches_for_student(str(student.id))
        # Find the specific match for this opportunity
        match = next((m for m in match_details if m["opportunity_id"] == str(opportunity.id)), None)
        
        score = match["score"] if match else 0.0

        # 2. Deep Verification (CV text analysis)
        verification_prompt = f"""
        Analyze this candidate for the role of {opportunity.title}.
        
        Requirements: {opportunity.requirements}
        Candidate Resume: {student.resume_text}
        Academic Score: {score}/100
        
        Verify if the candidate TRULY possesses the core skills mentioned.
        Return JSON:
        "verified": boolean,
        "confidence": float,
        "critical_gaps": list,
        "recommendation": "accept" | "reject" | "watch"
        """
        
        verification = await llm_service.analyze_structured(verification_prompt, {
            "verified": True,
            "confidence": 0.9,
            "critical_gaps": [],
            "recommendation": "accept"
        })

        # 3. Signature Verification
        # Check for required institutional documents (e.g. TRANSCRIPT)
        required_docs = self.db.query(models.DocumentHub).filter(
            models.DocumentHub.owner_id == student.user_id,
            models.DocumentHub.type == 'TRANSCRIPT'
        ).all()
        
        signatures_valid = len(required_docs) > 0
        for doc in required_docs:
            if not doc.digital_signature or doc.status != 'VERIFIED':
                signatures_valid = False
                break
        
        # 4. Action Logic
        # Update match score in DB
        app.match_score = score
        
        # If score > 80, verification is positive, AND signatures are valid, we auto-shortlist
        if score > 80 and verification.get("recommendation") == "accept" and signatures_valid:
            app.status = "shortlisted"
            logger.info(f"Application {application_id} auto-shortlisted with score {score}")
        elif not signatures_valid:
            app.status = "document_pending"
            logger.warning(f"Application {application_id} missing verified institutional signatures")

        self.db.commit()

        return {
            "application_id": str(app.id),
            "match_score": score,
            "verification": verification,
            "final_status": app.status
        }
