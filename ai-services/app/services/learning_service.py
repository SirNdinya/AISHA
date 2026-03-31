from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import models
from typing import List, Dict, Any
import uuid
from app.services.scraper_service import AutonomousScraperService

class LearningService:
    def __init__(self, db: Session):
        self.db: Session = db
        self.scraper: AutonomousScraperService = AutonomousScraperService()
        
        # Hardcoded map of specialization -> required skills (for Gap Analysis)
        # In a real app, this might come from a DB table 'SpecializationRequirements'
        self.specialization_map: Dict[str, List[str]] = {
            "software development": ["python", "javascript", "react", "sql", "git"],
            "data science": ["python", "pandas", "machine learning", "statistics", "sql"],
            "networking": ["ccna", "tcp/ip", "linux", "security", "cloud"],
            "cybersecurity": ["network security", "linux", "ethical hacking", "cryptography"],
            "web development": ["html", "css", "javascript", "react", "node.js"]
        }

    async def analyze_skill_gaps(self, student_id: str) -> List[str]:
        """
        Identify missing skills based on student's specialization vs. their units/skills.
        """
        student = self.db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            return []

        # Use course_of_study or explicit specialization if available
        specialization = student.course_of_study or ""
        target_skills = self.specialization_map.get(specialization.lower(), [])
        
        # If no direct match, try fuzzy matching or use interests
        if not target_skills and student.interests:
            for interest in student.interests:
                if interest.lower() in self.specialization_map:
                    target_skills.extend(self.specialization_map[interest.lower()])
        
        target_skills = list(set(target_skills)) # De-duplicate
        
        if not target_skills:
            return []
            
        # Collect student's current skills
        current_skills = set()
        if student.skills:
            current_skills = {s.lower() for s in student.skills}
        
        # Calculate gaps
        gaps = [skill for skill in target_skills if skill not in current_skills]
        return gaps

    async def recommend_resources(self, student_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Recommend resources targeting the student's skill gaps and interests.
        """
        student = self.db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            return []

        gaps = await self.analyze_skill_gaps(student_id)
        recommendations = []
        seen_urls = set()
        
        # 1. Target Skill Gaps
        for gap in gaps[:3]:
            # Local Database Search
            local_resources = self.db.query(models.LearningResource).filter(
                models.LearningResource.tags.contains([gap])
            ).limit(2).all()
            
            for res in local_resources:
                if res.url not in seen_urls:
                    recommendations.append(self._resource_to_dict(res, f"Focus on your skill gap: {gap}"))
                    seen_urls.add(res.url)

            # Web Discovery for Gaps
            if len(recommendations) < limit:
                scouted = await self.scraper.scout_real_time(f"{gap} certification", category="learning", limit=2)
                for item in scouted:
                    if item["url"] not in seen_urls:
                        recommendations.append({
                            **item,
                            "id": str(uuid.uuid4()),
                            "reason": f"Top certification for {gap} found online",
                            "is_free": True # Default for simulation
                        })
                        seen_urls.add(item["url"])

        # 2. Target Interests
        if len(recommendations) < limit and student.interests:
            for interest in student.interests[:2]:
                scouted = await self.scraper.scout_real_time(f"{interest} for beginners", category="learning", limit=2)
                for item in scouted:
                    if item["url"] not in seen_urls:
                        recommendations.append({
                            **item,
                            "id": str(uuid.uuid4()),
                            "reason": f"Based on your interest in {interest}",
                            "is_free": True
                        })
                        seen_urls.add(item["url"])

        return recommendations[:limit]

    def _resource_to_dict(self, res: models.LearningResource, reason: str) -> Dict[str, Any]:
        return {
            "id": str(res.id),
            "title": res.title,
            "provider": res.provider,
            "url": res.url,
            "category": res.category,
            "reason": reason,
            "is_free": res.is_free
        }
