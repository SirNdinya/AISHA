import asyncio
import os
import sys
from sqlalchemy.orm import Session
from unittest.mock import MagicMock

# Add current directory to path
sys.path.append(os.getcwd())

from app import models
from app.services.matching_service import MatchingService

async def verify_reasoning():
    print(">>> Starting Match Reasoning Verification...")
    
    # Mock DB
    mock_db = MagicMock(spec=Session)
    
    # Mock Student
    student = models.Student(
        id="test-student-id",
        user_id="test-user-id",
        skills=["Python", "Data Structure"],
        interests=["Security", "Encryption"],
        career_path="Cybersecurity"
    )
    mock_db.query().filter().first.return_value = student
    
    # Mock Opportunities (more than 10 to test low_tier)
    opps = []
    for i in range(15):
        opp = models.Opportunity(
            id=f"opp-{i}",
            title=f"Security Specialist {i}" if i < 3 else f"Generic Role {i}",
            requirements="Data Encryption and Privacy",
            description="Working on secure systems",
            status="OPEN",
            company=models.Company(name="SecureCorp")
        )
        opps.append(opp)
    
    # Mock refresh_opportunities to return our 15 opps
    service = MatchingService(mock_db)
    service._refresh_opportunities = MagicMock(return_value=opps)
    
    # Mock document extraction (empty)
    mock_db.query().filter().all.return_value = [] 
    
    print(f">>> Running matching for student with {len(opps)} opportunities...")
    matches = await service.calculate_matches_for_student("test-student-id")
    
    print(f"\n>>> Top {len(matches)} Matches:")
    for i, m in enumerate(matches):
        print(f"{i+1}. {m['job_title']} (Score: {m['match_score']}%)")
        print(f"   Reasoning: {m['reasoning']}")
        
        # Check if reasoning contains hardcoded templates
        templates = ["Heuristic alignment", "Direct alignment", "Adaptive alignment", "[SYSTEM]"]
        is_hardcoded = any(t in m['reasoning'] for t in templates)
        
        if is_hardcoded:
            print(f"   [FAIL] Reasoning appears to be a hardcoded template!")
        else:
            print(f"   [PASS] Reasoning is dynamic/LLM-generated.")

if __name__ == "__main__":
    asyncio.run(verify_reasoning())
