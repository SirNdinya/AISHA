from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Path
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from app.core.database import get_db
from app.services.document_service import DocumentService
from app.services.workflow_service import WorkflowService

router = APIRouter()

@router.post("/template", status_code=201)
async def upload_template(
    institution_id: UUID = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a standard PDF form template."""
    service = DocumentService(db)
    content = await file.read()
    template = service.create_template(str(institution_id), name, content)
    return {"id": template.id, "name": template.name}

@router.post("/generate/{student_id}")
def generate_documents(
    student_id: UUID,
    template_id: UUID = Form(...),
    db: Session = Depends(get_db)
):
    """Auto-fill a document for a student."""
    service = DocumentService(db)
    doc = service.generate_student_document(str(template_id), str(student_id))
    if not doc:
         raise HTTPException(status_code=404, detail="Student or Template not found")
    return {"id": doc.id, "verified": doc.is_verified, "signature": doc.digital_signature}

@router.get("/verify/{document_id}")
def verify_document(
    document_id: UUID, 
    db: Session = Depends(get_db)
):
    """Cryptographically verify a document's signature."""
    service = DocumentService(db)
    is_valid = service.verify_document_integrity(str(document_id))
    return {"valid": is_valid}

@router.post("/workflow/auto-apply/{student_id}")
def run_auto_apply(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """Trigger autonomous application workflow for a student."""
    wf = WorkflowService(db)
    return wf.trigger_auto_apply(str(student_id))

@router.post("/workflow/auto-review/{company_id}")
def run_auto_review(
    company_id: UUID,
    db: Session = Depends(get_db)
):
    """Trigger autonomous review workflow for a company."""
    wf = WorkflowService(db)
    return wf.trigger_auto_review(str(company_id))
