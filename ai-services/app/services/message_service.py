from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app import models
from app.core.events import EventPublisher
from typing import List, Dict, Any
import uuid

class MessageService:
    def __init__(self, db: Session):
        self.db = db
        self.event_publisher = EventPublisher()

    def send_message(self, sender_id: str, receiver_id: str, content: str) -> models.Message:
        """
        Persist message and publish to Redis.
        """
        message = models.Message(
            id=uuid.uuid4(),
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        # Publish event so WebSocket can pick it up
        event_data = {
            "type": "CHAT_MESSAGE",
            "id": str(message.id),
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": content,
            "timestamp": str(message.timestamp)
        }
        
        # We publish to a channel specific to the receiver
        # In main.py, we subscribe to 'student_events' and 'company_events'
        # Ideally we should have per-user channels or handle routing better.
        # For now, simplistic approach: broadcast to target role queues if we knew them.
        # But here we publish to generic 'chat_events' and let Main listener route it.
        self.event_publisher.publish("chat_events", event_data)
        
        return message

    def get_conversation(self, user1_id: str, user2_id: str) -> List[models.Message]:
        """
        Get history between two users.
        """
        messages = self.db.query(models.Message).filter(
            or_(
                and_(models.Message.sender_id == user1_id, models.Message.receiver_id == user2_id),
                and_(models.Message.sender_id == user2_id, models.Message.receiver_id == user1_id)
            )
        ).order_by(models.Message.timestamp.asc()).all()
        
        return messages
