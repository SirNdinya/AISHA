import sys
import os
sys.path.append('/home/wakanda_forever/Desktop/AISHA/ai-services')

from app.core.database import SessionLocal
from app.services.matching_service import MatchingService
import logging

logging.basicConfig(level=logging.INFO)

def test_init():
    print("Initializing DB...")
    db = SessionLocal()
    print("Initializing Service...")
    service = MatchingService(db)
    print("Refreshing Opportunities...")
    service._refresh_opportunities()
    print("Done!")

if __name__ == "__main__":
    test_init()
