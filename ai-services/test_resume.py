import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.resume_service import ResumeService

async def main():
    db = SessionLocal()
    service = ResumeService(db)
    print("Extracting...")
    res = await service.extract_institutional_data("5e9d3147-a6a2-40ef-aa65-8ec5776fd307")
    print("Result:", res)
    db.close()

asyncio.run(main())
