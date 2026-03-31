from sqlalchemy.orm import Session
from app import models
from app.services.llm_service import llm_service
from app.services.matching_service import MatchingService
import logging

logger = logging.getLogger(__name__)

class ChatContextService:
    """
    Context-Aware Chat Service.
    Analyzes conversations and provides intelligent suggestions.
    """
    
    def __init__(self, db: Session):
        self.db: Session = db
        self.matcher: MatchingService = MatchingService(db)

    async def analyze_chat_context(self, application_id: str | None = None, opportunity_id: str | None = None) -> dict:
        """
        Analyzes the context of an ongoing chat (e.g., student and recruiter).
        Provides 'Deep Insights' about the student's suitability.
        """
        if not application_id and not opportunity_id:
            return {"insight": "General system support chat. No specific context provided."}

        # Fetch relevant data
        app = self.db.query(models.Application).filter(models.Application.id == application_id).first()
        student = app.student if app else None
        opportunity = app.opportunity if app else self.db.query(models.Opportunity).filter(models.Opportunity.id == opportunity_id).first()

        if not student:
            return {"insight": "Unable to fetch student profile for context."}
        if not opportunity:
            return {"insight": "Unable to fetch opportunity profile for context."}

        # Get Match Details (Grade-Centric)
        match_details = await self.matcher.calculate_matches_for_student(str(student.id))
        match = next((m for m in match_details if str(m["opportunity_id"]) == str(opportunity.id)), None)

        # Prompt LLM for Insight
        prompt = f"""
        Role: {opportunity.title}
        Candidate: {student.first_name} {student.last_name}
        Match Details: {match}
        
        Provide a concise 'AI Insight' for the recruiter about this candidate. 
        Focus on academic grades and skill suitability.
        """
        
        insight = await llm_service.generate_response(prompt)
        
        return {
            "application_id": str(app.id) if app else None,
            "opportunity_title": opportunity.title,
            "student_name": f"{student.first_name} {student.last_name}",
            "ai_insight": insight,
            "match_score": match["score"] if match else 0
        }

    async def suggest_response(self, query: str, context: dict) -> dict:
        """
        Suggests a draft message for the user based on the context.
        """
        prompt = f"""
        Context: {context}
        User Query/Message: {query}
        
        Draft a professional, context-aware message following this context.
        If it's a recruiter, be encouraging but thorough.
        If it's a student, be respectful and informative.
        """
        
        draft = await llm_service.generate_response(prompt)
        
        return {
            "suggested_draft": draft,
            "reasoning": "Contextually accurate response based on academic performance."
        }

# End of service
