# ML imports moved inside get_model for performance

class MLModelFactory:
    _instance = None
    _model = None

    @classmethod
    def get_model(cls, model_name: str = 'all-MiniLM-L6-v2'):
        if cls._model is None:
            # Lazy load for performance
            from sentence_transformers import SentenceTransformer
            import torch
            print(f"Loading ML Model: {model_name}...")
            cls._model = SentenceTransformer(model_name)
        return cls._model

# Simple singleton instance
model_factory = MLModelFactory()
