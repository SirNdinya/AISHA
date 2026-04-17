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
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            self.redis = sync_redis.from_url(redis_url, decode_responses=True)
        else:
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
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            self.redis = async_redis.from_url(redis_url, decode_responses=True)
        else:
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
        self._running = True
        try:
            async with self.pubsub as p:
                if self.handlers:
                    await p.subscribe(*self.handlers.keys())
                    while self._running:
                        try:
                            message = await p.get_message(ignore_subscribe_messages=True, timeout=1.0)
                            if message and message['type'] == 'message':
                                channel = message['channel']
                                if channel in self.handlers:
                                    data = json.loads(message['data'])
                                    await self.handlers[channel](data)
                        except asyncio.TimeoutError:
                            continue
                        except Exception as e:
                            logger.error(f"Error in pubsub loop: {e}")
                            await asyncio.sleep(1)
                else:
                    logger.warning("No handlers registered for EventListener.")
        except asyncio.CancelledError:
            logger.info("EventListener task cancelled.")
        finally:
            self._running = False
            logger.info("EventListener stopped listening.")

    async def stop(self):
        """Stop listening and close connections."""
        self._running = False
        try:
            await self.pubsub.unsubscribe()
        except: pass
        await self.redis.close()
        logger.info("Redis connections closed.")
