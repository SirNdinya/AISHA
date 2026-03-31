from sqlalchemy.orm import Session
from app import models
import datetime
from app.services.llm_service import llm_service
from typing import Dict, Any
import json
import logging
import os
from app.services.document_extraction_service import document_extraction_service

logger = logging.getLogger(__name__)

class ResumeService:
    def __init__(self, db: Session):
        self.db: Session = db

    async def generate_resume_from_minimal_info(self, student_id: str, user_prompt: str) -> Dict[str, Any]:
        """
        Uses Ollama to generate a professional resume based on student data and a minimal prompt.
        """
        student = self.db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            return {"error": "Student not found"}

        # Gather context
        academic_records = [
            f"{r.unit_name} (Grade: {r.grade})" for r in student.academic_records
        ]
        
        context = {
            "name": f"{student.first_name} {student.last_name}",
            "contact": {"phone": student.mpesa_number, "email": "student@example.com"}, # Placeholder email
            "photo_url": student.photo_url or "PLACEHOLDER_PHOTO_URL",
            "course": student.course_of_study,
            "skills": student.skills or [],
            "interests": student.interests or [],
            "career_path": student.career_path or "Not set",
            "academic_highlights": academic_records[:10],
            "user_minimal_info": user_prompt
        }

        # Design Principles from Template:
        # 1. Professional Summary (A passionate and inquisitive tone).
        # 2. Key Sections: Education, Experience, Certifications, Current Project, Technical Skills, Soft Skills, Membership & Affiliations.
        # 3. Layout: Profile Picture placeholder at the top/side.
        
        # Enhanced: Extract institutional data to ensure header accuracy
        inst_data = await self.extract_institutional_data(student_id)
        if inst_data:
            context["name"] = inst_data.get("full_name", context["name"])
            context["course"] = inst_data.get("course", context["course"])
            context["year_of_study"] = inst_data.get("year", "Not set")

        prompt = f"""
        You are the AISHA Resume Architect. Build a professional resume based on this data.
        
        Context Data: {json.dumps(context)}
        
        Instructions:
        - Professional Summary: Passionate, analytical tone.
        - Experience: Highlight skills gained.
        - Projects: Include a "Current Project".
        - Skills: Separate Technical and Soft skills.
        - Photo: Use the provided `photo_url`.
        
        Respond ONLY with a JSON object. Ensure the JSON is perfectly valid. Do not add markdown framing.
        Schema:
        {{
            "name": "string",
            "title": "string",
            "contact_phone": "string",
            "contact_email": "string",
            "photo_url": "string",
            "summary": "string",
            "education": ["string"],
            "experience": ["string"],
            "certifications": ["string"],
            "current_project": "string",
            "technical_skills": ["string"],
            "soft_skills": ["string"]
        }}
        """

        schema = {
            "name": "", "title": "", "contact_phone": "", "contact_email": "", "photo_url": "",
            "summary": "", "education": [], "experience": [], "certifications": [],
            "current_project": "", "technical_skills": [], "soft_skills": []
        }

        try:
            resume_data = await llm_service.analyze_structured(prompt, schema)
            
            if isinstance(resume_data, dict) and "error" in resume_data:
                logger.error(f"Failed to generate resume: {resume_data.get('error')}")
                return resume_data
            
            # Save to student record
            student.resume_text = json.dumps(resume_data)
            
            return resume_data
        except Exception as e:
            logger.error(f"Resume generation failed: {e}")
            return {"error": str(e)}

    async def extract_institutional_data(self, student_id: str) -> Dict[str, Any]:
        """
        Uses verified institutional docs to extract official details like Full Name, Year, and Reg Number.
        """
        student = self.db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            return {}

        docs = self.db.query(models.DocumentHub).filter(
            models.DocumentHub.owner_id == student.user_id,
            models.DocumentHub.status == 'VERIFIED'
        ).all()
        
        if not docs:
            return {}

        combined_text = ""
        for doc in docs:
            file_path = doc.file_url.lstrip('/')
            abs_path = os.path.join("/home/wakanda_forever/Desktop/AISHA/backend", file_path)
            combined_text += document_extraction_service.extract_text_from_pdf(abs_path) + "\n"

        if not combined_text:
            return {}

        prompt = f"""
        Extract official student details from this institutional document text:
        {combined_text[:3000]}
        
        Find the definitive:
        1. Full Name
        2. Registration Number
        3. Course/Department
        4. Current Year of Study
        
        Return ONLY a JSON object:
        {{
            "full_name": "string",
            "reg_number": "string",
            "course": "string",
            "year": "string"
        }}
        """
        
        res = await llm_service.analyze_structured(prompt, {
            "full_name": "John Doe",
            "reg_number": "AD3/123",
            "course": "BSc IT",
            "year": "3"
        })
        return res
