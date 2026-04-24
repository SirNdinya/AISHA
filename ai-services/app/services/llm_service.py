import json
import re
import logging
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
        
        # Initialize Gemini
        self.gemini_ready = False
        self.client = None
        if GEMINI_AVAILABLE and self.gemini_key:
            try:
                # New SDK uses Client
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
        Primary entry point for generation.
        """
        if self.gemini_ready and self.client:
            try:
                # Use gemini-1.5-flash via new SDK
                logger.info("Calling Gemini (gemini-1.5-flash) via aio...")
                
                # Combine system prompt if provided
                full_prompt = f"SYSTEM: {system_prompt}\n\nUSER: {prompt}" if system_prompt else prompt
                response = await self.client.aio.models.generate_content(
                    model='gemini-1.5-flash',
                    contents=full_prompt
                )
                logger.info("Gemini response received.")
                return response.text
            except Exception as e:
                logger.error(f"Gemini Error: {e}")
                
        return "I'm currently unable to generate a response. AI services are unavailable."

    async def analyze_structured(self, prompt: str, schema: dict) -> dict:
        """
        Generates a structured JSON response based on a schema.
        """
        if self.gemini_ready and self.client:
            try:
                logger.info("Calling Gemini for structured analysis via aio...")
                # Fix: Use types.GenerateContentConfig for the configuration
                # This resolves the 400 Bad Request error by correctly mapping response_mime_type
                response = await self.client.aio.models.generate_content(
                    model='gemini-2.0-flash',
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
                logger.warning(f"Gemini structured analysis failed: {e}")
            
        return {"error": "No LLM service available for structured analysis"}

llm_service = LLMService()
