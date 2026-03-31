import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.services.ollama_service import ollama_service
from app.services.resume_service import ResumeService
from app.core.database import SessionLocal

async def main():
    db = SessionLocal()
    try:
        service = ResumeService(db)
        print("Extracting...")
        res = await service.extract_institutional_data("5e9d3147-a6a2-40ef-aa65-8ec5776fd307")
        print("Result from extract:", res)
        
        print("Generating resume...")
        prompt = "I want a cybersecurity-focused resume"
        res = await service.generate_resume_from_minimal_info("5e9d3147-a6a2-40ef-aa65-8ec5776fd307", prompt)
        print("Result from generate:", res)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
