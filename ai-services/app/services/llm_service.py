import json
import re
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to import Gemini SDK
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed, Gemini will be unavailable.")

# Try to import Ollama
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    logger.warning("ollama not installed, Ollama fallback will be unavailable.")


class LLMService:
    def __init__(self, model: str = ""):
        self.ollama_model: str = model or settings.OLLAMA_MODEL
        self.ollama_host: str = settings.OLLAMA_HOST
        self.gemini_key = settings.GEMINI_API_KEY
        
        # Initialize Gemini
        self.gemini_ready = False
        if GEMINI_AVAILABLE and self.gemini_key:
            try:
                genai.configure(api_key=self.gemini_key)
                # Using gemini-2.5-flash for better performance/quota
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
                self.gemini_ready = True
                logger.info("Gemini initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
                
        # Initialize Ollama
        self.ollama_ready = False
        if OLLAMA_AVAILABLE:
            try:
                self.ollama_client = ollama.Client(host=self.ollama_host)
                self.ollama_ready = True
                logger.info(f"Ollama client will be initialized per call: host={self.ollama_host}, model={self.ollama_model}")
            except Exception as e:
                logger.error(f"Failed to initialize Ollama client: {e}")

    async def generate_response(self, prompt: str, system_prompt: str = "", force_gemini: bool = False) -> str:
        """
        Primary entry point for generation.
        Prioritizes Gemini, falls back to Ollama on failure or if Gemini is disabled.
        """
        if self.gemini_ready:
            try:
                # Use gemini-1.5-flash
                logger.info(f"Calling Gemini (gemini-1.5-flash) for generate_response...")
                
                # Combine system prompt if provided
                full_prompt = f"SYSTEM: {system_prompt}\n\nUSER: {prompt}" if system_prompt else prompt
                response = await self.gemini_model.generate_content_async(full_prompt)
                logger.info("Gemini response received.")
                return response.text
            except Exception as e:
                logger.error(f"Gemini Error: {e}. Falling back to local Ollama...")
                
        if self.ollama_ready:
            return await self._ollama_generate_response(prompt, system_prompt)
            
        return "I'm currently unable to generate a response. Both Gemini and Ollama services are unavailable."

    async def analyze_structured(self, prompt: str, schema: dict, force_gemini: bool = False) -> dict:
        """
        Generates a structured JSON response based on a schema.
        """
        if self.gemini_ready:
            try:
                logger.info("Calling Gemini for structured analysis...")
                prompt_with_schema = f"{prompt}\n\nRespond ONLY with a JSON object that follows this schema: {json.dumps(schema)}"
                
                response = await self.gemini_model.generate_content_async(
                    prompt_with_schema,
                    generation_config=genai.types.GenerationConfig(
                        response_mime_type="application/json",
                    ),
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
                logger.error(f"Gemini Structured Error: {e}. Falling back to Ollama...")
                # Continue to Ollama block
                
        if self.ollama_ready:
            return await self._ollama_analyze_structured(prompt, schema)
            
        return {"error": "No LLM service available for structured analysis"}

    async def _ollama_generate_response(self, prompt: str, system_prompt: str = "") -> str:
        try:
            logger.info(f"Calling local Ollama ({self.ollama_model}) using AsyncClient...")
            client = ollama.AsyncClient(host=self.ollama_host)
            messages = []
            if system_prompt:
                messages.append({'role': 'system', 'content': system_prompt})
            messages.append({'role': 'user', 'content': prompt})

            response = await client.chat(
                model=self.ollama_model,
                messages=messages
            )
            logger.info("Ollama response received.")
            return response['message']['content']
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            return "I'm sorry, I'm having trouble processing your request locally as well."

    async def _ollama_analyze_structured(self, prompt: str, schema: dict) -> dict:
        try:
            logger.info(f"Calling local Ollama ({self.ollama_model}) for structured analysis using AsyncClient...")
            client = ollama.AsyncClient(host=self.ollama_host)
            response = await client.chat(
                model=self.ollama_model,
                messages=[{'role': 'user', 'content': f"Return JSON following this schema: {json.dumps(schema)}. Query: {prompt}"}],
                format='json',
                options={"num_predict": 4096} # Added num_predict for potentially longer JSON responses
            )
            logger.info("Ollama JSON response received.")
            content = ""
            if isinstance(response, dict):
                message = response.get('message', {})
                content = message.get('content', "") if isinstance(message, dict) else ""
            else:
                message = getattr(response, 'message', None)
                if message:
                    content = getattr(message, 'content', "")
            
            text = str(content)
            if not text.strip():
                return {"error": "Empty response from LLM"}
            
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
            logger.error(f"Structured analysis failed: {e}")
            return {"error": str(e)}

llm_service = LLMService()
