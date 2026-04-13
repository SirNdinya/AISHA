# ML imports moved inside get_model for performance

class MLModelFactory:
    _instance = None
    _model = None

    @classmethod
    def get_model(cls, model_name: str = 'all-MiniLM-L6-v2'):
        if cls._model is False: # Explicitly failed before
            return None
            
        if cls._model is None:
            try:
                # Lazy load for performance
                print(f"[ML-SAFE] Loading {model_name}...")
                from sentence_transformers import SentenceTransformer
                import torch
                cls._model = SentenceTransformer(model_name)
                print("[ML-SAFE] Neural Engine Online.")
            except Exception as e:
                print(f"[ML-SAFE] Neural Engine Initialization FAILED: {e}")
                cls._model = False # Mark as failed to avoid re-trying and hanging
                return None
        return cls._model

# Simple singleton instance
model_factory = MLModelFactory()
