import logging
from google import genai
from typing import List, Union
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
                    http_options={'api_version': 'v1'}
                )
                self._ready = True
                logger.info("[ML-FACTORY] Gemini Neural Engine Online. (New GenAI SDK)")
            else:
                logger.warning("[ML-FACTORY] GEMINI_API_KEY is missing. Embeddings will fail.")
        except Exception as e:
            logger.error(f"[ML-FACTORY] Initialization FAILED: {e}")
            self._ready = False

    def encode(self, texts: Union[str, List[str]], convert_to_tensor: bool = False):
        """
        Mimics the original sentence_transformers.SentenceTransformer.encode() signature.
        """
        if not self._ready or not self.client:
            # Fallback to random/zero vectors if offline
            if isinstance(texts, list):
                return [[0.0] * 768 for _ in texts]
            return [0.0] * 768

        try:
            # Use gemini-embedding-001 as it is more widely available
            response = self.client.models.embed_content(
                model="models/gemini-embedding-001",
                contents=texts
            )
            # The new SDK returns an object with an 'embeddings' or 'embedding' attribute
            if isinstance(texts, list):
                return [e.values for e in response.embeddings]
            return response.embeddings[0].values if hasattr(response, 'embeddings') else response.embedding.values
        except Exception as e:
            logger.error(f"[ML-FACTORY] Embedding generation failed: {e}")
            if isinstance(texts, list):
                return [[0.0] * 768 for _ in texts]
            return [0.0] * 768

# Simple singleton instance acts as the 'model' object
# so replacing 'model.encode' in other files requires zero structural changes!
model_factory = MLModelFactory()

def get_model():
    return model_factory
