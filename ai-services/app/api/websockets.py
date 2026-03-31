from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
import logging
from uuid import UUID

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Map user_id -> List[WebSocket] (user might have multiple tabs)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected via WebSocket")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send WS message to {user_id}: {e}")

    async def broadcast(self, message: dict):
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def handle_chat_message(self, message_data: dict, db):
        from app.services.message_service import MessageService
        # Expect { "type": "chat", "receiver_id": "...", "content": "..." }
        if message_data.get("type") == "chat":
            service = MessageService(db)
            service.send_message(
                sender_id=message_data.get("sender_id"),
                receiver_id=message_data.get("receiver_id"),
                content=message_data.get("content")
            )

manager = ConnectionManager()
router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, db = Depends(lambda: None)): # Hack: DB dependency hard in WS
    # In real FastAPI WS, we use Depends normally. 
    # For now, we assume the 'handle_chat' will instantiate its own DB session or use a global factory
    # But since we can't easily inject DB here without proper setup, let's fix it:
    
    await manager.connect(websocket, user_id)
    
    # We need a fresh DB session for each message if we want to persist
    from app.core.database import SessionLocal
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_json = json.loads(data)
                # Inject sender_id if missing
                msg_json["sender_id"] = user_id
                
                # Persist message (which also triggers Redis Pub/Sub)
                db_session = SessionLocal()
                try:
                    await manager.handle_chat_message(msg_json, db_session)
                finally:
                    db_session.close()
                    
            except Exception as e:
                logger.error(f"Error processing WS message: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
