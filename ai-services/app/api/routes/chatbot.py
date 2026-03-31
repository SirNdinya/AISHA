from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from typing import Optional, Dict, Any

from app.core.database import get_db
from app.services.chatbot_service import ChatbotService

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: UUID
    message: str

class ChatResponse(BaseModel):
    response: str
    intent: str
    data: Optional[Dict[str, Any]] = None

# Global service instance to load model only once (startup)
# In a production app, we might want a proper lifespan handler
chatbot_instance = None

def get_chatbot_service(db: Session = Depends(get_db)):
    global chatbot_instance
    if chatbot_instance is None:
        chatbot_instance = ChatbotService(db)
    else:
        # Update db session for the existing instance
        chatbot_instance.db = db
    return chatbot_instance

@router.post("/message", response_model=ChatResponse)
async def send_message(
    chat_request: ChatRequest,
    service: ChatbotService = Depends(get_chatbot_service)
):
    """
    Send a message to the AI chatbot.
    """
    result = await service.process_message(str(chat_request.user_id), chat_request.message)
    
    # Extract data with safe defaults
    response_text = result.get("response", "I'm having trouble processing that right now.")
    plans = result.get("plan_followed", [])
    intent = plans[0] if plans else "GENERAL_QUERY"
    
    return ChatResponse(
        response=response_text,
        intent=intent,
        data=result.get("data")
    )
