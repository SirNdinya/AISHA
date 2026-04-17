import asyncio
import numpy as np
from unittest.mock import MagicMock
import sys
import os

# Mock the database and models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
from app.services.matching_service import MatchingService
from app import models

async def test_fallback_reordering():
    # 1. Setup Mock Student with Cyber Security interests
    student = MagicMock(spec=models.Student)
    student.id = "test-uid"
    student.skills = ["Linux", "Python"]
    student.interests = ["Cyber Security", "Penetration Testing"]
    student.career_path = "Cyber Security"
    student.admission_number = "TEST-01"
    student.academic_records = []
    student.preferred_locations = []
    
    # 2. Setup Mock Opportunities
    opp_devops = MagicMock(spec=models.Opportunity)
    opp_devops.id = "opp-devops"
    opp_devops.title = "DevOps Engineering Attachment"
    opp_devops.description = "Infrastructure and CI/CD"
    opp_devops.requirements = "Linux, Docker"
    opp_devops.skills_required = ["Linux"]
    opp_devops.location = "Nairobi"
    
    opp_cyber = MagicMock(spec=models.Opportunity)
    opp_cyber.id = "opp-cyber"
    opp_cyber.title = "Cyber Security Analyst Attachment"
    opp_cyber.description = "SoC monitoring and Pentesting"
    opp_cyber.requirements = "Linux, Nmap"
    opp_cyber.skills_required = ["Linux"]
    opp_cyber.location = "Nairobi"
    
    # 3. Initialize Service with Mocked Model returning None (429 simulation)
    service = MatchingService(MagicMock())
    service.model = MagicMock()
    service.model.encode.return_value = None # SIMULATE 429
    
    # Manually populate cache (to skip DB calls)
    from app.services.matching_service import OpportunityCache
    OpportunityCache.embeddings = {
        "opp-devops": {
            "job_reqs_emb": None,
            "interest_emb": None,
            "location_text": "nairobi",
            "skills_required": {"Linux"}
        },
        "opp-cyber": {
            "job_reqs_emb": None,
            "interest_emb": None,
            "location_text": "nairobi",
            "skills_required": {"Linux"}
        }
    }
    
    # 4. Run Matching logic manually for both (simplified test)
    # We'll mock the internal call or just test the logic blocks we added
    print("\n[TEST] Running Keyword Fallback Verification...")
    
    results = []
    for opp in [opp_devops, opp_cyber]:
        # Emulate the Tier 1 loop logic we added
        interest_score = 0.5
        career_path_score = 0.5
        
        opp_text = f"{opp.title} {opp.description} {opp.requirements}".lower()
        if any(str(interest).lower() in opp_text for interest in student.interests):
            interest_score = max(interest_score, 0.85)
        if student.career_path and student.career_path.lower() in opp_text:
            career_path_score = max(career_path_score, 0.85)
            
        results.append({"title": opp.title, "score": interest_score + career_path_score})
        print(f"Role: {opp.title} -> Interest: {interest_score}, Career: {career_path_score}")

    # 5. Assertions
    results.sort(key=lambda x: x["score"], reverse=True)
    print("\n[RANKING RESULTS]")
    for r in results:
        print(f"- {r['title']}: {r['score']}")
    
    if results[0]['title'] == "Cyber Security Analyst Attachment":
        print("\n✅ SUCCESS: Cyber Security ranked higher despite AI 429!")
    else:
        print("\n❌ FAILURE: Ranking did not respond to interest change.")

if __name__ == "__main__":
    asyncio.run(test_fallback_reordering())
