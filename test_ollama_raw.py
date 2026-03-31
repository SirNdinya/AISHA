import asyncio
from app.services.ollama_service import ollama_service

async def main():
    prompt = "Please respond with a simple JSON object containing a greeting."
    schema = {"greeting": "string"}
    res = await ollama_service.analyze_structured(prompt, schema)
    print("Result:", res)

asyncio.run(main())
