import logging
import google.generativeai as genai
from typing import List, Union
from app.core.config import settings

logger = logging.getLogger(__name__)

class MLModelFactory:
    _instance = None
    _ready = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLModelFactory, cls).__new__(cls)
            cls._instance.initialize_gemini()
        return cls._instance

    def initialize_gemini(self):
        try:
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._ready = True
                logger.info("[ML-FACTORY] Gemini Neural Engine Online. (PyTorch bypassed)")
            else:
                logger.warning("[ML-FACTORY] GEMINI_API_KEY is missing. Embeddings will fail.")
        except Exception as e:
            logger.error(f"[ML-FACTORY] Initialization FAILED: {e}")
            self._ready = False

    def encode(self, texts: Union[str, List[str]], convert_to_tensor: bool = False):
        """
        Mimics the original sentence_transformers.SentenceTransformer.encode() signature.
        """
        if not self._ready:
            # Fallback to random/zero vectors if offline
            if isinstance(texts, list):
                return [[0.0] * 768 for _ in texts]
            return [0.0] * 768

        try:
            response = genai.embed_content(
                model="models/text-embedding-004",
                content=texts
            )
            return response['embedding'] if isinstance(texts, list) else response['embedding']
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
