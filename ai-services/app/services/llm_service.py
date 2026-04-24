import json
import re
import logging
import asyncio
import time
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to import Gemini SDK
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai not installed, Gemini will be unavailable.")


class LLMService:
    def __init__(self, model: str = "", api_key: str | None = None):
        self.gemini_key = api_key or settings.GEMINI_API_KEY
        self.semaphore = asyncio.Semaphore(2) # Prevent 429 by limiting concurrency
        
        # Initialize Gemini
        self.gemini_ready = False
        self.client = None
        if GEMINI_AVAILABLE and self.gemini_key:
            try:
                # Use v1beta for gemini-2.5 features including structured analysis
                self.client = genai.Client(
                    api_key=self.gemini_key,
                    http_options={'api_version': 'v1beta'}
                )
                self.gemini_ready = True
                logger.info("Gemini initialized successfully with New SDK.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")

    async def generate_response(self, prompt: str, system_prompt: str = "") -> str:
        """
        Primary entry point for generation with built-in retry logic.
        """
        if not (self.gemini_ready and self.client):
            return "I'm currently unable to generate a response. AI services are unavailable."

        full_prompt = f"SYSTEM: {system_prompt}\n\nUSER: {prompt}" if system_prompt else prompt
        
        for attempt in range(3):
            async with self.semaphore:
                try:
                    logger.info(f"Calling Gemini (attempt {attempt+1}) via aio...")
                    response = await self.client.aio.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=full_prompt
                    )
                    logger.info("Gemini response received.")
                    return response.text
                except Exception as e:
                    err_msg = str(e).upper()
                    if ("429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "503" in err_msg or "UNAVAILABLE" in err_msg) and attempt < 2:
                        delay = (2 ** attempt) * 2 + (time.time() % 1) # Exponential backoff with jitter
                        logger.warning(f"Gemini API rate limited or unavailable (attempt {attempt+1}). Retrying in {delay:.2f}s...")
                        await asyncio.sleep(delay)
                        continue
                    logger.error(f"Gemini Error after {attempt+1} attempts: {e}")
                    break
                
        return "I'm currently unable to generate a response. AI services are under high demand."

    async def analyze_structured(self, prompt: str, schema: dict) -> dict:
        """
        Generates a structured JSON response with retry logic and concurrency control.
        """
        if not (self.gemini_ready and self.client):
            return {"error": "No LLM service available for structured analysis"}

        for attempt in range(3):
            async with self.semaphore:
                try:
                    logger.info(f"Calling Gemini for structured analysis (attempt {attempt+1}) via aio...")
                    response = await self.client.aio.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=f"{prompt}\n\nRespond ONLY with a JSON object that follows this schema: {json.dumps(schema)}",
                        config=types.GenerateContentConfig(
                            response_mime_type='application/json'
                        )
                    )
                    logger.info("Gemini structured response received.")
                    text = response.text
                    
                    if not text.strip():
                        return {"error": "Empty response from Gemini"}
                    
                    try:
                        parsed = json.loads(text)
                        if isinstance(parsed, dict):
                            return parsed
                        elif isinstance(parsed, list) and len(parsed) > 0:
                            return parsed[0]
                        return {"error": "Unexpected JSON structure", "raw": text}
                    except json.JSONDecodeError:
                        match = re.search(r'(\{.*\})', text, re.DOTALL)
                        if match:
                            try:
                                return json.loads(match.group(1))
                            except json.JSONDecodeError:
                                pass
                        return {"error": "Could not parse JSON from LLM response", "raw": text}
                        
                except Exception as e:
                    err_msg = str(e).upper()
                    if ("429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "503" in err_msg or "UNAVAILABLE" in err_msg) and attempt < 2:
                        delay = (2 ** attempt) * 2 + (time.time() % 1)
                        logger.warning(f"Gemini structured analysis rate limited (attempt {attempt+1}). Retrying in {delay:.2f}s...")
                        await asyncio.sleep(delay)
                        continue
                    logger.warning(f"Gemini structured analysis failed after {attempt+1} attempts: {e}")
                    break
            
        return {"error": "LLM structured analysis failed after multiple retries due to quota or availability."}

llm_service = LLMService()
