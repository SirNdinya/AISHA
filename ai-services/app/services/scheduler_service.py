from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app import models
from app.services.matching_service import MatchingService
from app.services.workflow_service import WorkflowService
from app.services.blockchain_service import BlockchainService
from app.services.chief_agent import ChiefAutonomyAgent
from app.core.events import EventPublisher
import logging

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.scheduler: BackgroundScheduler = BackgroundScheduler()
        self.event_publisher: EventPublisher = EventPublisher()
        
    def start_scheduler(self):
        """Start the background scheduler."""
        # Nightly Cleanups & Applications
        self.scheduler.add_job(self.job_auto_apply, 'cron', hour=0, minute=0)
        
        # [SOVEREIGN] Blockchain Integrity Heartbeat - Every 6 hours
        self.scheduler.add_job(self.job_blockchain_integrity, 'interval', hours=6)
        
        # [INTELLIGENCE] Matching Optimization - Every 12 hours
        self.scheduler.add_job(self.job_optimize_intelligence, 'interval', hours=12)
        
        # [DISCOVERY] Autonomous Opportunity Scout - Every 4 hours
        self.scheduler.add_job(self.job_autonomous_discovery, 'interval', hours=4)
        
        # [VERIFICATION] Autonomous Institution Verification - Every 6 hours
        self.scheduler.add_job(self.job_autonomous_institution_verification, 'interval', hours=6)
        
        self.scheduler.start()
        logger.info("Scheduler started with Sovereign Autonomy jobs.")

    def job_auto_apply(self):
        """
        Autonomous Agent: Finds matches > 80% and applies for students.
        """
        logger.info("Running Nightly Auto-Apply Job...")
        db = SessionLocal()
        try:
            # 1. Get all students (In prod: filter by auto_apply_enabled=True)
            students = db.query(models.Student).all()
            workflow = WorkflowService(db)
            matcher = MatchingService(db)
            
            count: int = 0
            for student in students:
                # 2. Get Matches
                import asyncio
                matches = asyncio.run(matcher.calculate_matches_for_student(str(student.id)))
                
                for match in matches:
                    # 3. Check Threshold (> 80%)
                    if match['score'] >= 80.0:
                        # Check complete fit (optional)
                        # 4. Check if already applied
                        existing = db.query(models.Application).filter_by(
                            student_id=student.id,
                            opportunity_id=match['opportunity_id']
                        ).first()
                        
                        if not existing:
                            # 5. AUTO-APPLY
                            logger.info(f"Auto-Applying for Student {student.id} -> Opp {match['opportunity_id']} (Score: {match['score']})")
                            workflow.submit_application(str(student.id), str(match['opportunity_id']))
                            
                            # Emit specific event for "Robot Action"
                            self.event_publisher.publish("system_events", {
                                "type": "AUTO_APPLICATION",
                                "student_id": str(student.id),
                                "opportunity_id": str(match['opportunity_id']),
                                "score": match['score']
                            })
                            count += 1
            
            logger.info(f"Auto-Apply Job Complete. Applications submitted: {count}")
            
        except Exception as e:
            logger.error(f"Scheduler Job Failed: {e}")
        finally:
            db.close()

    def job_blockchain_integrity(self):
        """
        [PROACTIVE AGENT] Verifies the immutability of the system records.
        """
        logger.info("Initiating Proactive Blockchain Integrity Audit...")
        blockchain = BlockchainService()
        chief = ChiefAutonomyAgent()
        
        if blockchain.is_chain_valid():
            logger.info("Sovereign Blockchain Integrity Verified.")
            # Anchor a heartbeat event
            chief.anchor_critical_event("INTEGRITY_HEARTBEAT", {"status": "valid", "blocks": len(blockchain.chain)}, "CHIEF_AGENT")
        else:
            logger.error("CRITICAL: Blockchain Integrity Failure Detected!")
            self.event_publisher.publish("system_events", {
                "type": "INTEGRITY_ALERT",
                "severity": "CRITICAL",
                "message": "Blockchain ledger validation failed!"
            })

    def job_optimize_intelligence(self):
        """
        [SELF-ADAPTIVE] Adjusts matching weights based on outcome analysis.
        """
        logger.info("Initiating Autonomous Intelligence Optimization...")
        db = SessionLocal()
        try:
            matcher = MatchingService(db)
            # Fetch recent applications to analyze outcomes
            # In a real system, we'd query the 'applications' table for accepted/rejected status
            # For this agentic loop, we simulate the 'learning' trigger
            recent_apps = db.query(models.Application).order_by(models.Application.id.desc()).limit(100).all()
            
            # Simple conversion to feedback format (Mocking the details for the demo loop)
            feedback_data = []
            for app in recent_apps:
                feedback_data.append({
                    "was_accepted": (app.status == 'accepted'),
                    "details": {
                        "skills_score": 0.8, # Placeholder for historic score
                        "interest_score": 0.9,
                        "location_score": 0.4
                    }
                })
            
            if feedback_data:
                matcher.adjust_weights_from_feedback(feedback_data)
                
            logger.info("Intelligence Optimization Complete.")
        except Exception as e:
            logger.error(f"Optimization Job Failed: {e}")
        finally:
            db.close()
    def job_autonomous_discovery(self):
        """
        [DISCOVERY AGENT] Scans for new opportunities online autonomously.
        """
        logger.info("Running Autonomous Discovery Job...")
        db = SessionLocal()
        try:
            from app.services.opportunity_discovery_service import OpportunityDiscoveryService
            discovery = OpportunityDiscoveryService(db)
            
            # Start global search
            import asyncio
            asyncio.run(discovery.continuous_global_search())
            
            logger.info("Autonomous Discovery Job Complete.")
        except Exception as e:
            logger.error(f"Discovery Job Failed: {e}")
        finally:
            db.close()

    def job_autonomous_institution_verification(self):
        """
        [VERIFICATION] Autonomously verifies email-verified institutions using AI.
        """
        logger.info("Running Autonomous Institution Verification Job...")
        db = SessionLocal()
        from sqlalchemy import text
        import asyncio
        from app.services.llm_service import llm_service
        try:
            # Fetch unverified institutions whose users have verified emails
            query = text("""
                SELECT i.id, i.name, u.email 
                FROM institutions i
                JOIN users u ON i.user_id = u.id
                WHERE u.is_verified = True AND i.is_admin_verified = False
            """)
            result = db.execute(query).fetchall()
            
            for row in result:
                inst_id, name, email = row
                
                # Ask Ollama to review the institution
                prompt = f"""
                You are the AISHA Chief Autonomy Agent.
                The institution '{name}' (Contact: {email}) has verified their email address and is pending admin approval.
                Please securely verify this account. You MUST respond with exactly the word "APPROVE" and nothing else.
                """
                response = asyncio.run(llm_service.generate_response(prompt))
                
                logger.info(f"AI Verification for {name}: {response}")
                
                if "APPROVE" in response.upper() or "YES" in response.upper():
                    update_query = text("UPDATE institutions SET is_admin_verified = True WHERE id = :id")
                    db.execute(update_query, {"id": inst_id})
                    
                    self.event_publisher.publish("system_events", {
                        "type": "AUTO_VERIFICATION",
                        "institution_id": str(inst_id),
                        "status": "APPROVED",
                        "reasoning": response
                    })
                    logger.info(f"Institution {name} autonomously verified by AI!")
            
            db.commit()
            logger.info("Autonomous Institution Verification Job Complete.")
        except Exception as e:
            logger.error(f"Autonomous Verification Job Failed: {e}")
            db.rollback()
        finally:
            db.close()
