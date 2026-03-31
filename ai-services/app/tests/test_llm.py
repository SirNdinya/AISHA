import pytest
import httpx
from app.core.config import settings
from app.services.llm_service import llm_service

@pytest.mark.asyncio
async def test_ollama_connectivity():
    """Test if Ollama host is reachable."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(settings.OLLAMA_HOST)
            assert response.status_code == 200
        except Exception as e:
            pytest.fail(f"Could not connect to Ollama at {settings.OLLAMA_HOST}: {e}")

@pytest.mark.asyncio
async def test_ollama_basic_generation():
    """Test basic response generation from Ollama."""
    try:
        response = await llm_service.generate_response(
            prompt="Say 'Hello' and nothing else.",
            system_prompt="You are a helpful assistant."
        )
        assert isinstance(response, str)
        assert len(response.strip()) > 0
    except Exception as e:
        pytest.fail(f"LLM generation failed: {e}")
