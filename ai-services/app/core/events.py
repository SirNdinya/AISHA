import redis.asyncio as async_redis
import redis as sync_redis
import os
import json
import logging
from typing import Callable, Awaitable
from app.core.config import settings
import asyncio

logger = logging.getLogger(__name__)

class EventPublisher:
    def __init__(self):
        # Use settings or env for Redis connection
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", "6379"))
        self.redis = sync_redis.Redis(host=host, port=port, db=0, decode_responses=True)

    def publish(self, channel: str, message: dict):
        """Publish a message to a specific channel."""
        try:
            self.redis.publish(channel, json.dumps(message))
            logger.info(f"Published event to {channel}: {message.get('event_type')}")
        except Exception as e:
            logger.error(f"Failed to publish event: {e}")

class EventListener:
    def __init__(self):
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", "6379"))
        self.redis = async_redis.Redis(host=host, port=port, db=0, decode_responses=True)
        self.pubsub = self.redis.pubsub()
        self.handlers = {}

    async def subscribe(self, channel: str, handler: Callable[[dict], Awaitable[None]]):
        """Subscribe to a channel with a handler function."""
        self.handlers[channel] = handler
        await self.pubsub.subscribe(channel)
        logger.info(f"Subscribed to {channel}")

    async def start_listening(self):
        """Background task to listen for messages."""
        async for message in self.pubsub.listen():
            if message['type'] == 'message':
                channel = message['channel']
                if channel in self.handlers:
                    try:
                        data = json.loads(message['data'])
                        await self.handlers[channel](data)
                    except Exception as e:
                        logger.error(f"Error handling message on {channel}: {e}")
