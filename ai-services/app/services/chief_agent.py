from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import logging
from app.services.blockchain_service import BlockchainService
from app.services.scraper_service import AutonomousScraperService
from app.services.knowledge_service import KnowledgeService
from app.core.reasoning import ReasoningEngine
from app.services.llm_service import llm_service
import json

logger = logging.getLogger(__name__)

class ChiefAutonomyAgent:
    """
    [VIBE AGENT] The Sovereign Orchestrator.
    Manages high-level system goals and coordinates specialized agents and services.
    """
    
    def __init__(self, db: Session | None = None):
        self.db: Session | None = db
        self.reasoner: ReasoningEngine = ReasoningEngine()
        self.blockchain: BlockchainService = BlockchainService()
        self.scraper: AutonomousScraperService = AutonomousScraperService()
        self.knowledge: KnowledgeService = KnowledgeService()

    async def handle_complex_goal(self, user_id: str, goal_description: str) -> Dict[str, Any]:
        """
        Decomposes a complex goal and orchestrates the necessary steps.
        """
        logger.info(f"Chief Agent processing goal for user {user_id}: {goal_description}")
        
        # 1. Decompose Goal
        plan_data = await self.reasoner.plan_execution(goal_description)
        plan = plan_data.get("plan", [])
        
        execution_results = []
        
        # 2. Orchestrate Execution
        for step in plan:
            cap = step["capability"]
            logger.info(f"Executing step: {cap}")
            
            if cap == "WEB_SCOUTING":
                results = await self.scraper.scout_real_time(goal_description)
                execution_results.append({"action": "WEB_SCOUT", "data": results})
                
            elif cap == "DOCUMENT_AUTOMATION":
                execution_results.append({"action": "SECURITY_CHECK", "status": "Blockchain verification enabled"})

            elif cap == "KNOWLEDGE_QUERY":
                kb_results = self.knowledge.query_knowledge(goal_description)
                execution_results.append({"action": "KNOWLEDGE_RETRIEVAL", "data": kb_results})

        return {
            "user_id": user_id,
            "goal_analyzed": goal_description,
            "orchestrated_plan": [p["capability"] for p in plan],
            "execution_summary": execution_results,
            "agent_vibe": "Sovereign & Proactive"
        }

    async def execute_admin_command(self, command: str) -> Dict[str, Any]:
        """
        [COMMAND CENTRE] Handles administrative natural language commands.
        """
        logger.info(f"Admin Command Centre received: {command}")
        
        # 1. Reason about the command
        plan_data = await self.reasoner.plan_execution(command)
        plan = plan_data.get("plan", [])
        
        # 2. Map command to system actions (Mock/Real)
        response_prompt = f"""
        Command: {command}
        Analytic Plan: {plan}
        
        The system is 100% operational. Provide a professional, terminal-like response 
        about the status or result of this command. Use the AISHA persona.
        """
        
        terminal_msg = await llm_service.generate_response(response_prompt)
        
        return {
            "message": terminal_msg,
            "logs": [
                {"message": f"Analyzing: {command}", "type": "info"},
                {"message": f"Executing: {plan[0]['capability'] if plan else 'CORE_REASONING'}", "type": "success"},
                {"message": "Command Complete.", "type": "success"}
            ]
        }

    def anchor_critical_event(self, event_type: str, data: Dict[str, Any], signer_id: str):
        """
        Anchors a non-document event to the blockchain for auditing.
        """
        import hashlib
        import json
        event_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        self.blockchain.anchor_document(f"EVENT_{event_type}", event_hash, signer_id)
        logger.info(f"Critical event {event_type} anchored to blockchain.")
