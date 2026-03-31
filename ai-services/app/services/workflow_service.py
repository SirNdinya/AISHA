from sqlalchemy.orm import Session
from app import models, models_docs
from app.services.matching_service import MatchingService
from app.services.document_service import DocumentService
from typing import List, Dict, Any
import logging
import asyncio

from app.core.events import EventPublisher

class WorkflowService:
    def __init__(self, db: Session):
        self.db: Session = db
        self.matcher: MatchingService = MatchingService(db)
        self.doc_service: DocumentService = DocumentService(db)
        self.publisher: EventPublisher = EventPublisher()
        from app.services.company_ranking_service import CompanyRankingService
        from app.services.student_agent import StudentAutonomyAgent
        self.ranker: CompanyRankingService = CompanyRankingService(db)
        self.agent: StudentAutonomyAgent = StudentAutonomyAgent(db)
        self.logger = logging.getLogger(__name__)

    def trigger_auto_apply(self, student_id: str) -> Dict[str, Any]:
        """
        [Student Side] Autonomously find matches and apply if threshold met.
        """
        # 1. Get Recommendations
        matches = asyncio.run(self.matcher.calculate_matches_for_student(student_id))
        
        applied_count = 0
        applications = []
        
        # 2. Threshold: Score > 80%
        for match in matches:
            if match['score'] >= 80.0:
                # Check if already applied
                existing = self.db.query(models.Application).filter_by(
                    student_id=student_id, 
                    opportunity_id=match['opportunity_id']
                ).first()
                
                if not existing:
                    # Create Application
                    app = models.Application(
                        student_id=student_id,
                        opportunity_id=match['opportunity_id'],
                        status="pending",
                        match_score=match['score'],
                        match_reason=str(match['match_details'])
                    )
                    self.db.add(app)
                    
                    # 3. Auto-Generate Docs (NITA/Insurance)
                    # In a real app, find correct template for the student's institution
                    # For demo, taking first available
                    template = self.db.query(models_docs.DocumentTemplate).first()
                    if template:
                        self.doc_service.generate_student_document(str(template.id), student_id)
                    
                    applications.append(match['title'])
                    applied_count += 1
                    
                    # PUBLISH EVENT
                    self.publisher.publish("student_events", {
                        "event_type": "APPLICATION_SUBMITTED",
                        "student_id": student_id,
                        "opportunity_id": str(match['opportunity_id']),
                        "title": match['title']
                    })
        
        self.db.commit()
        return {
            "status": "success",
            "applied_count": applied_count,
            "opportunities": applications
        }

    async def trigger_auto_review(self, company_id: str) -> Dict[str, Any]:
        """
        [Company Side] Autonomously review pending applications using LLM Agent.
        """
        from app.services.reviewer_agent import ReviewerAgent
        reviewer = ReviewerAgent(self.db)

        # Get pending apps for this company's opportunities
        pending_apps = self.db.query(models.Application).join(models.Opportunity).filter(
            models.Opportunity.company_id == company_id,
            models.Application.status == 'pending'
        ).all()
        
        if not pending_apps:
            return {"status": "success", "reviewed_count": 0, "accepted_ids": []}

        # Concurrently review applications (Optimize response time)
        tasks = [reviewer.review_application(str(app.id)) for app in pending_apps]
        await asyncio.gather(*tasks)
        
        # After review, find those that were auto-shortlisted or accepted
        # Note: ReviewerAgent sets status to 'shortlisted' or 'document_pending'
        reviewed_apps = self.db.query(models.Application).filter(
            models.Application.id.in_([app.id for app in pending_apps]),
            models.Application.status == 'shortlisted'
        ).all()

        accepted_ids = [str(app.id) for app in reviewed_apps]
        
        # Transition some shortlisted to 'accepted' if high score or company preference
        # For simplicity, if shortlisted and score > 90, we auto-accept for demo
        for app in reviewed_apps:
            if app.match_score >= 90:
                app.status = "accepted"
                # Trigger student offer analysis
                self.agent.evaluate_placement_offer(str(app.student_id), str(app.opportunity_id))

        self.db.commit()
        return {
            "status": "success", 
            "reviewed_count": len(pending_apps),
            "accepted_ids": accepted_ids
        }
    def process_company_feedback(self, placement_id: str) -> Dict[str, Any]:
        """
        [Autonomous Feedback Analysis] Analyze company feedback and notify student.
        """
        placement = self.db.query(models.Placement).filter_by(id=placement_id).first()
        if not placement or not placement.feedback:
            return {"status": "error", "message": "No feedback found"}

        # Basic NLP: Check for positive/negative sentiment or specific recommendations
        feedback_text = placement.feedback.lower()
        score = float(placement.performance_rating or 0.0)
        
        recommendation = "Great job! Keep it up."
        if score < 3.0:
            recommendation = "Recommended to focus on core technical units and take supplementary courses."
        elif "python" in feedback_text and "weak" in feedback_text:
            recommendation = "Recommended to take the 'Python Advanced' course in the Learning Hub."

        # Notify Student Profile/Dashboard
        # (In a real app, this would update a 'StudentFeedbackAnalysis' table)
        
        # PUBLISH EVENT to trigger student-side AI action
        self.publisher.publish("student_events", {
            "event_type": "FEEDBACK_ANALYZED",
            "student_id": str(placement.student_id),
            "recommendation": recommendation,
            "score": score
        })

        return {"status": "success", "recommendation": recommendation}

    def respond_to_placement_offer(self, application_id: str, action: str) -> Dict[str, Any]:
        """
        [Student Action] Finalize placement (Accept/Reject) and notify all parties.
        """
        app = self.db.query(models.Application).filter_by(id=application_id).first()
        if not app:
            return {"status": "error", "message": "Application not found"}

        if action.upper() == "ACCEPT":
            app.status = "placed"
            # Create Placement Record
            placement = models.Placement(
                application_id=app.id,
                student_id=app.student_id,
                company_id=app.opportunity.company_id,
                status="active"
            )
            self.db.add(placement)
            
            # PUBLISH EVENT to Company & Institution
            self.publisher.publish("company_events", {
                "event_type": "OFFER_ACCEPTED",
                "application_id": str(app.id),
                "company_id": str(app.opportunity.company_id)
            })
            self.publisher.publish("institution_events", {
                "event_type": "STUDENT_PLACED",
                "student_id": str(app.student_id),
                "company_name": app.opportunity.company.name
            })
        else:
            app.status = "rejected"
            self.publisher.publish("company_events", {
                "event_type": "OFFER_REJECTED",
                "application_id": str(app.id)
            })

        self.db.commit()
        return {"status": "success", "action": action}
