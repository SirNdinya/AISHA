import logging
from typing import Dict, Any
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

class OpportunityGenerationService:
    def __init__(self):
        self.service = llm_service

    async def generate_from_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        Generates structured opportunity data from a natural language prompt.
        """
        logger.info(f"Generating opportunity from prompt: {prompt[:50]}...")
        
        schema = {
            "title": "Software Engineering Intern",
            "description": "Develop and maintain web applications...",
            "requirements": "Proficiency in React and Node.js...",
            "skills_required": ["React", "Node.js", "TypeScript"],
            "location": "Nairobi",
            "type": "INTERNSHIP",
            "stipend_amount": 15000,
            "duration_months": 6,
            "vacancies": 3,
            "application_deadline": "2024-12-31"
        }
        
        instruction = f"""
        Extract and generate opportunity details from this prompt: "{prompt}"
        Ensure the 'skills_required' is an array of strings.
        Ensure 'type' is one of: 'INTERNSHIP', 'ATTACHMENT', 'ENTRY_LEVEL'.
        If 'stipend_amount' is not mentioned, default to 0.
        If 'duration_months' is not mentioned, default to 3.
        If 'vacancies' is not mentioned, default to 1.
        Provide a realistic description and requirements if they are sparse in the prompt.
        """
        
        result = await self.service.analyze_structured(instruction, schema)
        
        if "error" in result:
            logger.error(f"Generation failed: {result['error']}")
            return {"error": result["error"], "raw": result.get("raw")}
            
        return result
