import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import uuid4

# Add parent dir to path to find app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models import LearningResource
from app.core.database import Base

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_resources():
    db = SessionLocal()
    
    # ensure clean slate (optional, or check exists)
    # db.query(LearningResource).delete()
    
    resources = [
        {
            "title": "CS50's Introduction to Computer Science",
            "provider": "Harvard / edX",
            "url": "https://cs50.harvard.edu/x/",
            "category": "Technical",
            "field": "Software Development",
            "level": "beginner",
            "is_free": True,
            "tags": ["computer science", "python", "javascript", "c", "sql"]
        },
        {
            "title": "Python for Everybody",
            "provider": "FreeCodeCamp / Dr. Chuck",
            "url": "https://www.py4e.com/",
            "category": "Technical",
            "field": "Software Development",
            "level": "beginner",
            "is_free": True,
            "tags": ["python", "scripting", "backend"]
        },
        {
            "title": "Machine Learning by Andrew Ng",
            "provider": "Coursera / Stanford",
            "url": "https://www.coursera.org/specializations/machine-learning-introduction",
            "category": "Technical",
            "field": "Data Science",
            "level": "intermediate",
            "is_free": True,
            "tags": ["machine learning", "python", "statistics", "ai"]
        },
        {
            "title": "Responsive Web Design Certification",
            "provider": "FreeCodeCamp",
            "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
            "category": "Technical",
            "field": "Web Development",
            "level": "beginner",
            "is_free": True,
            "tags": ["html", "css", "web development", "frontend"]
        },
        {
            "title": "Google Data Analytics Certificate (Audit)",
            "provider": "Coursera",
            "url": "https://www.coursera.org/professional-certificates/google-data-analytics",
            "category": "Technical",
            "field": "Data Science",
            "level": "beginner",
            "is_free": True, # Available to audit
            "tags": ["data analysis", "sql", "r", "tableau"]
        },
        {
            "title": "The Odin Project: Foundations",
            "provider": "The Odin Project",
            "url": "https://www.theodinproject.com/paths/foundations/courses/foundations",
            "category": "Technical",
            "field": "Web Development",
            "level": "beginner",
            "is_free": True,
            "tags": ["html", "css", "javascript", "git"]
        },
        {
            "title": "Full Stack Open",
            "provider": "University of Helsinki",
            "url": "https://fullstackopen.com/en/",
            "category": "Technical",
            "field": "Software Development",
            "level": "intermediate",
            "is_free": True,
            "tags": ["react", "node.js", "graphql", "typescript", "docker"]
        },
        {
            "title": "Git & GitHub Crash Course",
            "provider": "Traversy Media / YouTube",
            "url": "https://www.youtube.com/watch?v=SWYqp7iY_Tc",
            "category": "Technical",
            "field": "Software Development",
            "level": "beginner",
            "is_free": True,
            "tags": ["git", "github", "version control"]
        },
        {
            "title": "Introduction to Cybersecurity",
            "provider": "Cisco Networking Academy",
            "url": "https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity",
            "category": "Technical",
            "field": "Cybersecurity",
            "level": "beginner",
            "is_free": True,
            "tags": ["cybersecurity", "security", "network security"]
        },
        {
            "title": "Statistics and Probability",
            "provider": "Khan Academy",
            "url": "https://www.khanacademy.org/math/statistics-probability",
            "category": "Technical",
            "field": "Data Science",
            "level": "beginner",
            "is_free": True,
            "tags": ["statistics", "probability", "math"]
        }
    ]

    count = 0
    for res_data in resources:
        # Check if exists by url
        exists = db.query(LearningResource).filter(LearningResource.url == res_data["url"]).first()
        if not exists:
            # Ensure tags is a list (JSONB)
            res = LearningResource(**res_data)
            db.add(res)
            count += 1
    
    db.commit()
    print(f"Successfully seeded {count} new learning resources.")
    db.close()

if __name__ == "__main__":
    seed_resources()
