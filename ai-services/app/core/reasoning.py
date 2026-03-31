from typing import List, Dict, Any
import json
import logging
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

class ReasoningEngine:
    """
    Autonomous Reasoning Engine.
    Decomposes user queries into system-wide tasks using LLM reasoning.
    """
    
    def __init__(self):
        self.system_prompt = """
        You are the AISHA Autonomous Intelligence Engine. Your role is to decompose user 
        requests into actionable system plans. Respond ONLY with a valid JSON object.
        Do NOT include any preamble, explanation, or markdown formatting outside the JSON.
        
        System Capabilities:
        - DATA_RETRIEVAL: Fetch user profile, application statuses, payments.
        - WEB_SCOUTING: Search the internet for certifications and resources.
        - AUTONOMOUS_MATCHING: Analyze skills vs. job requirements.
        - DECISION_ANALYSIS: Evaluate placement offers and give career advice.
        - DOCUMENT_AUTOMATION: Handle placement letters and insurance documents.
        - KNOWLEDGE_QUERY: System rules/NITA.
        - MATCHING_ANALYSIS: Why a student matched.
        - CAREER_ADVICE: AI counseling.
        - GENERAL_LLM: Everything else (Greetings, general knowledge, etc).
        
        CRITICAL: If it's not about specific AISHA student data or rules, use GENERAL_LLM.
        
        Example JSON Output:
        {
          "reasoning": "User is asking for a cake recipe.",
          "plan": [
            {"capability": "GENERAL_LLM", "action": "provide_recipe", "priority": 1}
          ]
        }
        """

    async def plan_execution(self, query: str) -> Dict[str, Any]:
        """Decomposes a user query into a plan of execution using capabilities."""
        # Short-circuit for greetings/small talk to save time and quota
        low_query = query.lower().strip().strip('?!.')
        greetings = ["hello", "hi", "hey", "hola", "greetings", "good morning", "good afternoon", "good evening"]
        if low_query in greetings or len(query) < 5:
            return {"reasoning": "Simple greeting detected.", "plan": [{"capability": "GENERAL_LLM", "priority": 1}]}

        try:
            prompt = f"Plan for: \"{query}\""
            response_text = await llm_service.generate_response(
                prompt=prompt, 
                system_prompt=self.system_prompt,
                force_gemini=True
            )
            
            # Robust JSON extraction
            import re
            json_str = response_text
            try:
                match = re.search(r'(\{.*\}|\[.*\])', response_text, re.DOTALL)
                if match:
                    json_str = match.group(1)
                
                plan_data = json.loads(json_str)
                return plan_data
                
            except json.JSONDecodeError:
                logger.warning(f"Ollama returned invalid JSON: {response_text}")
                
                # Heuristic fallback: if we see a capability name in the response, use it
                for cap in ["DATA_RETRIEVAL", "WEB_SCOUTING", "AUTONOMOUS_MATCHING", "DECISION_ANALYSIS", "DOCUMENT_AUTOMATION", "KNOWLEDGE_QUERY", "GENERAL_LLM"]:
                    if cap in response_text:
                        return {"reasoning": "Extracted from text", "plan": [{"capability": cap, "priority": 1}]}
                
                # Default to GENERAL_LLM if it's not a clear system request
                return {"reasoning": "Defaulting to generalist", "plan": [{"capability": "GENERAL_LLM", "priority": 1}]}
                
        except Exception as e:
            logger.error(f"Reasoning loop failed: {e}")
            return {"error": str(e), "plan": []}

    def determine_capabilities(self, query: str) -> List[str]:
        """
        Deprecated: Now handled by plan_execution's reasoning loop.
        Keeping for backward compatibility if needed.
        """
        return ["USE_LLM_PLANNING"]
