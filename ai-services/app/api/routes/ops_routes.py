from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from app.core.database import get_db
from app.services.mpesa_service import MpesaService
from app.services.batch_service import BatchService

payment_router = APIRouter()
batch_router = APIRouter()

# --- PAYMENTS ---
@payment_router.post("/stipend")
async def pay_stipend(
    phone_number: str = Form(...),
    amount: int = Form(...),
    reference: str = Form(...)
):
    """Trigger M-Pesa STK Push."""
    service = MpesaService()
    # In async app, might want to await this if requests are blocking
    return service.initiate_stk_push(phone_number, amount, reference)

@payment_router.post("/callback")
async def payment_callback(data: Dict[str, Any]):
    """Receive M-Pesa Webhook."""
    service = MpesaService()
    service.process_callback(data)
    return {"status": "received"}

# --- BATCH ---
@batch_router.post("/students/import")
async def import_students(
    file: UploadFile = File(...),
    institution_id: UUID = Form(...),
    db: Session = Depends(get_db)
):
    """Upload CSV to bulk create students."""
    service = BatchService(db)
    content = await file.read()
    results = service.process_student_import(content, str(institution_id))
    return results
