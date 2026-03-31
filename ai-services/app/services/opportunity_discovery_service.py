import logging
import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app import models
from app.services.scraper_service import AutonomousScraperService
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)

class OpportunityDiscoveryService:
    """
    [AUTONOMOUS] Scans the internet for job/internship opportunities matching student profiles.
    """
    
    def __init__(self, db: Session):
        self.db: Session = db
        self.scraper: AutonomousScraperService = AutonomousScraperService()
        self.matcher: MatchingService = MatchingService(db)

    async def discover_and_anchor_opportunities(self, student_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Discover online opportunities, filter them, and potentially anchor them locally or just recommend.
        """
        student = self.db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            return []

        # 1. Build Query Context
        query_context = f"{student.course_of_study} internship {student.interests[0] if student.interests else ''}"
        
        # 2. Scout the Web
        scouted_results = await self.scraper.scout_real_time(query_context, category="opportunities", limit=limit*2)
        
        discovered = []
        seen_urls = set()

        # 3. Analyze and Filter
        for item in scouted_results:
            if item["url"] in seen_urls:
                continue
                
            # Simulate detailed analysis of the scouted page
            # analysis = await self.scraper.analyze_url(item["url"])
            
            # For this MVP/Demo, we create a recommendations list
            discovered.append({
                "id": str(uuid.uuid4()),
                "title": item["title"],
                "company": item["provider"], # Simulated as provider
                "url": item["url"],
                "source": "Internet Discovery",
                "relevance_reason": f"Matches your path in {student.course_of_study}",
                "posted_date": "Recently"
            })
            seen_urls.add(item["url"])

        return discovered[:limit]

    async def continuous_global_search(self):
        """
        [GLOBAL AGENT] Periodic task to find general opportunities and add to 'opportunities' table.
        """
        logger.info("Initiating Global Opportunity Search...")
        # Common tech/internship search terms
        search_themes = ["Software Engineer Intern", "Data Analyst Entry Level", "Digital Marketing Apprentice"]
        
        for theme in search_themes:
            results = await self.scraper.scout_real_time(theme, category="opportunities", limit=3)
            # In a real system, we'd persist these to 'opportunities' after deduplication and validation
            logger.info(f"Found {len(results)} potential opportunities for {theme}")
            
        return {"status": "success", "message": "Global search completed"}
