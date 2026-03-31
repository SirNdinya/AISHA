from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any

from app.core.database import get_db
from app.services.message_service import MessageService
from app.services.chat_service import ChatContextService
from pydantic import BaseModel
from datetime import datetime
from app.services.chatbot_service import ChatbotService
from typing import List, Dict, Any, Optional

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: str
    message: str
    history: Optional[List[Dict[str, Any]]] = []

class ChatResponse(BaseModel):
    content: str
    role: str = "assistant"
    data: Optional[Dict[str, Any]] = None

class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    content: str
    timestamp: datetime
    is_read: bool

    class Config:
        orm_mode = True

@router.get("/history/{user_id}/{other_user_id}", response_model=List[MessageResponse])
def get_chat_history(
    user_id: UUID, 
    other_user_id: UUID, 
    db: Session = Depends(get_db)
):
    """
    Get chat history between two users.
    """
    service = MessageService(db)
    messages = service.get_conversation(str(user_id), str(other_user_id))
    return messages

@router.get("/analyze-context")
async def analyze_chat_context(
    application_id: UUID = Query(None),
    opportunity_id: UUID = Query(None),
    db: Session = Depends(get_db)
):
    """Analyze chat context for grade-centric insights."""
    service = ChatContextService(db)
    return await service.analyze_chat_context(
        application_id=str(application_id) if application_id else None,
        opportunity_id=str(opportunity_id) if opportunity_id else None
    )

@router.post("/suggest-response")
async def suggest_response(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Suggest context-aware draft responses."""
    query = payload.get("query")
    context = payload.get("context", {})
    
    service = ChatContextService(db)
    return await service.suggest_response(query, context)
from app.api.routes.chatbot import get_chatbot_service

@router.post("", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    service: ChatbotService = Depends(get_chatbot_service)
):
    """
    General chat endpoint for AISHA Assistant.
    Delegates to ChatbotService for autonomous reasoning and response.
    """
    result = await service.process_message(request.user_id, request.message)
    
    return ChatResponse(
        content=result["response"],
        role="assistant",
        data=result.get("data")
    )
