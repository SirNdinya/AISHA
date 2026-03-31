import asyncio
import time
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.matching_service import MatchingService
from app import models

async def run_benchmark():
    db = SessionLocal()
    try:
        user_id = '444ef451-e885-4204-86e4-e819be9365f1'

        student = db.query(models.Student).filter(
            models.Student.admission_number == 'SIT/B/02-00027/2022'
        ).first()

        if not student:
            print("Student SIT/B/02-00027/2022 not found.")
            return

        student.user_id = user_id
        student.preferred_locations = ["Nairobi", "Mombasa", "Kisumu"]
        
        # Ensure student has some default values
        if not student.skills:
            student.skills = ["Burp Suite", "Nmap", "Metasploit", "Python"]
        if not student.interests:
            student.interests = ["Penetration Testing", "Security"]
        if not student.career_path:
            student.career_path = "Cyber Security"
            
        db.commit()

        print("\n=== BENCHMARK STARTING ===")
        print(f"Target: {student.first_name} {student.last_name} ({student.admission_number})")
        service = MatchingService(db)

        start_warmup = time.time()
        service._refresh_opportunities()
        print(f"[CACHE] Opportunity Pre-fetch Time: {time.time() - start_warmup:.4f}s")

        print("[ENGINE] Firing Full Hybrid Analysis Pipeline...")
        start_engine = time.time()
        matches = await service.calculate_matches_for_student(str(student.id))
        end_engine = time.time()

        print("\n=== FINAL MATCH ===")
        if matches:
            top = matches[0]
            print(f"Assigned Job: {top.get('job_title')} (Confidence: {top.get('match_score')}%)")
            print(f"AI Selected: {top['match_details']['method']}")
        
        print("\n=== TOTAL EXECUTION ===")
        print(f"Total AI Analysis Execution Time: {end_engine - start_engine:.4f} seconds\n")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_benchmark())
