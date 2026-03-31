from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, List

from app.core.database import get_db
from app.services.workflow_service import WorkflowService
from app.services.sync_service import SyncService
from app.services.company_ranking_service import CompanyRankingService
from app.services.student_agent import StudentAutonomyAgent
from app.services.chief_agent import ChiefAutonomyAgent
from app.services.reviewer_agent import ReviewerAgent

router = APIRouter()

# --- STUDENT SIDE ---

@router.post("/auto-apply/{student_id}")
def trigger_auto_apply(
    student_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Trigger the autonomous matching and application flow for a student."""
    service = WorkflowService(db)
    return service.trigger_auto_apply(str(student_id))

@router.get("/agent/evaluate/{student_id}/{opportunity_id}")
def get_offer_evaluation(
    student_id: UUID = Path(...),
    opportunity_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Get reasoned AI recommendation for a specific placement offer."""
    service = StudentAutonomyAgent(db)
    return service.evaluate_placement_offer(str(student_id), str(opportunity_id))

@router.post("/sync/academic/{student_id}")
def sync_academic_records(
    student_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Trigger autonomous fetching and parsing of academic records (Zero Manual Entry)."""
    service = SyncService(db)
    return service.sync_academic_records(str(student_id))

# --- COMPANY SIDE ---

@router.get("/ranking/{opportunity_id}")
def get_candidate_rankings(
    opportunity_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Get multi-factor AI ranking of all applicants for an opportunity."""
    service = CompanyRankingService(db)
    return service.rank_candidates_for_opportunity(str(opportunity_id))

@router.post("/auto-review/{company_id}")
def trigger_auto_review(
    company_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Trigger autonomous application review and high-confidence acceptance cycle."""
    service = WorkflowService(db)
    return service.trigger_auto_review(str(company_id))

@router.post("/review/{application_id}")
async def review_application(
    application_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Deep AI Review of a specific application (Academic-Centric)."""
    agent = ReviewerAgent(db)
    return await agent.review_application(str(application_id))

# --- SYSTEM WIDE ---

@router.get("/discover/{student_id}")
async def discover_opportunities(
    student_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Discover online opportunities for a student."""
    from app.services.opportunity_discovery_service import OpportunityDiscoveryService
    service = OpportunityDiscoveryService(db)
    return await service.discover_and_anchor_opportunities(str(student_id))

@router.post("/sync/multi-system/{placement_id}")
def trigger_multi_system_sync(
    placement_id: UUID = Path(...),
    db: Session = Depends(get_db)
):
    """Trigger multi-hop sync across Student, Company, Institution, and NITA systems."""
    service = SyncService(db)
    return service.autonomous_multi_system_sync(str(placement_id))

@router.post("/admin/execute-command")
async def execute_admin_command(
    payload: Dict[str, str],
    db: Session = Depends(get_db)
):
    """[COMMAND CENTRE] Execute natural language administrative commands."""
    command = payload.get("command")
    if not command:
        raise HTTPException(status_code=400, detail="Command not provided")
    
    agent = ChiefAutonomyAgent(db)
    return await agent.execute_admin_command(command)
