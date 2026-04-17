import logging
from google import genai
from typing import List, Union, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class MLModelFactory:
    _instance = None
    _ready = False
    client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLModelFactory, cls).__new__(cls)
            cls._instance.initialize_gemini()
        return cls._instance

    def get_model(self):
        """Compatibility method for existing service calls"""
        return self

    def initialize_gemini(self):
        try:
            if settings.GEMINI_API_KEY:
                self.client = genai.Client(
                    api_key=settings.GEMINI_API_KEY,
                    http_options={'api_version': 'v1beta'}
                )
                self._ready = True
                logger.info("[ML-FACTORY] Gemini Neural Engine Online. (New GenAI SDK)")
            else:
                logger.warning("[ML-FACTORY] GEMINI_API_KEY is missing.")
        except Exception as e:
            logger.error(f"[ML-FACTORY] Gemini Initialization FAILED: {e}")
            self._ready = False

    def encode(self, texts: Union[str, List[str]], convert_to_tensor: bool = False):
        """
        Prioritizes Gemini, returns zeros on failure.
        """
        # Filter out empty strings/None to prevent Gemini 400 Error
        if isinstance(texts, list):
            processed_texts = [str(t) if t else "N/A" for t in texts]
        else:
            processed_texts = str(texts) if texts else "N/A"

        if self._ready and self.client:
            try:
                response = self.client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=processed_texts
                )
                if isinstance(texts, list):
                    return [e.values for e in response.embeddings]
                return response.embeddings[0].values if hasattr(response, 'embeddings') else response.embedding.values
            except Exception as e:
                logger.warning(f"[ML-FACTORY] Gemini Embedding failed: {e}")

        # Hard Fallback
        dim = 768 # Default for gemini-embedding-001
        if isinstance(texts, list):
            return [[0.0] * dim for _ in texts]
        return [0.0] * dim

# Simple singleton instance acts as the 'model' object
model_factory = MLModelFactory()

def get_model():
    return model_factory
