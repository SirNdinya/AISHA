import logging
import gc
from google import genai
from typing import List, Union, Optional
from app.core.config import settings

# FastEmbed for lightweight local semantic matching fallback
try:
    from fastembed import TextEmbedding
    FASTEMBED_AVAILABLE = True
except ImportError:
    FASTEMBED_AVAILABLE = False

logger = logging.getLogger(__name__)

class MLModelFactory:
    _instance = None
    _ready = False
    _local_ready = False
    client = None
    _local_model: Optional['TextEmbedding'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLModelFactory, cls).__new__(cls)
            cls._instance.initialize_gemini()
            # Removed initialize_local_model from startup to save RAM (Lazy Loading)
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
                logger.warning("[ML-FACTORY] GEMINI_API_KEY is missing. Embeddings will fallback to Local.")
        except Exception as e:
            logger.error(f"[ML-FACTORY] Gemini Initialization FAILED: {e}")
            self._ready = False

    def _ensure_local_model(self):
        """Lazy initializer for FastEmbed to minimize startup RAM usage."""
        if self._local_ready and self._local_model:
            return True
        
        if not FASTEMBED_AVAILABLE:
            return False

        try:
            logger.info("[ML-FACTORY] Lazy Loading Local Semantic Engine (FastEmbed)...")
            # Limit threads to 1 and use bge-small to minimize RAM spikes on Render
            self._local_model = TextEmbedding(
                model_name="BAAI/bge-small-en-v1.5",
                threads=1 
            )
            self._local_ready = True
            gc.collect() # Force cleanup after model loading
            logger.info("[ML-FACTORY] Local Semantic Engine Online.")
            return True
        except Exception as e:
            logger.error(f"[ML-FACTORY] Local Engine Loading FAILED: {e}")
            return False

    def encode(self, texts: Union[str, List[str]], convert_to_tensor: bool = False):
        """
        Mimics the original sentence_transformers.SentenceTransformer.encode() signature.
        Prioritizes Gemini, falls back to FastEmbed locally.
        """
        # --- TIER 1: CLOUD GEMINI (Best Quality) ---
        if self._ready and self.client:
            try:
                # Use gemini-embedding-001 on v1beta as confirmed available
                response = self.client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=texts
                )
                if isinstance(texts, list):
                    return [e.values for e in response.embeddings]
                return response.embeddings[0].values if hasattr(response, 'embeddings') else response.embedding.values
            except Exception as e:
                logger.warning(f"[ML-FACTORY] Gemini Embedding failed (likely 429). Falling back to Local Engine: {e}")

        # --- TIER 2: LOCAL FASTEMBED (Smart Fallback - Lazy Loaded) ---
        if self._ensure_local_model() and self._local_model:
            try:
                # TextEmbedding.embed returns a generator
                embeddings_gen = self._local_model.embed(texts if isinstance(texts, list) else [texts])
                embeddings = [list(e) for e in embeddings_gen]
                if isinstance(texts, list):
                    return embeddings
                return embeddings[0]
            except Exception as e:
                logger.error(f"[ML-FACTORY] Local Embedding FAILED: {e}")

        # --- TIER 3: ZERO-VECTOR (Hard Fallback) ---
        dim = 384 # bge-small dim
        if isinstance(texts, list):
            return [[0.0] * dim for _ in texts]
        return [0.0] * dim

# Simple singleton instance acts as the 'model' object
# so replacing 'model.encode' in other files requires zero structural changes!
model_factory = MLModelFactory()

def get_model():
    return model_factory
