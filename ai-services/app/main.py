import asyncio
import logging
from fastapi import FastAPI
from app.core.config import settings
from app.api.routes import matching, learning, chatbot, documents, explain, chat, autonomy, blockchain, resume, generation
from app.api.routes import ops_routes
from app.core.events import EventListener
from app.services.scheduler_service import SchedulerService
from app.api import websockets
from app.api.websockets import manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(generation.router, prefix="/api/v1/generate", tags=["generation"])
app.include_router(matching.router, prefix="/api/matching", tags=["matching"])
app.include_router(learning.router, prefix="/api/learning", tags=["learning"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["chatbot"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(explain.router, prefix="/api/explain", tags=["explain"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(autonomy.router, prefix="/api/autonomy", tags=["autonomy"])
app.include_router(blockchain.router, prefix="/api/blockchain", tags=["blockchain"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
# app.include_router(websockets.router, tags=["websockets"])  # WebSocket handled separately
app.include_router(ops_routes.payment_router, prefix="/api/payments", tags=["payments"])
app.include_router(ops_routes.batch_router, prefix="/api/batch", tags=["batch"])

@app.on_event("startup")
async def startup_event():
    # Start the Scheduler for Nightly Jobs
    scheduler = SchedulerService()
    scheduler.start_scheduler()

    # Start the Redis Event Listener in the background
    listener = EventListener()
    
    # Define handlers for events -> Broadcast to WebSockets
    async def forward_to_student(data):
        if "student_id" in data:
            await manager.send_personal_message(data, data["student_id"])
            
    async def forward_to_company(data):
        if "company_id" in data:
            pass 

    async def forward_chat(data):
        # Data: {type: CHAT_MESSAGE, sender_id: X, receiver_id: Y, content: Z}
        if "receiver_id" in data:
            await manager.send_personal_message(data, data["receiver_id"])
            # Optional: Send ack to sender too
            # await manager.send_personal_message(data, data["sender_id"])

    # Subscribe to channels
    await listener.subscribe("student_events", forward_to_student)
    await listener.subscribe("company_events", forward_to_company)
    await listener.subscribe("chat_events", forward_chat)
    
    # Run loop
    asyncio.create_task(listener.start_listening())

# Basic health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-services"}

# Root endpoint
@app.get("/")
def root():
    return {"message": "Welcome to AISHA AI Services"}
