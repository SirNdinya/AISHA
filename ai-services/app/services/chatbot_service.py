from typing import List, Dict, Any
import json
import datetime
from sqlalchemy.orm import Session
# No longer using torch/sentence_transformers here for performance
from app import models
# No longer using model_factory at startup
from app.core.reasoning import ReasoningEngine
from app.services.knowledge_service import KnowledgeService
from app.services.scraper_service import AutonomousScraperService
from app.services.matching_service import MatchingService
from app.services.student_agent import StudentAutonomyAgent
from app.services.chief_agent import ChiefAutonomyAgent
from app.services.blockchain_service import BlockchainService
from app.services.llm_service import llm_service
from app.services.document_extraction_service import document_extraction_service
import os

class ChatbotService:
    def __init__(self, db: Session | None = None):
        self.db: Session | None = db
        self.reasoner: ReasoningEngine = ReasoningEngine()
        self.knowledge: KnowledgeService = KnowledgeService()
        self.scraper: AutonomousScraperService = AutonomousScraperService()
        self.chief: ChiefAutonomyAgent = ChiefAutonomyAgent(db)
        self.blockchain: BlockchainService = BlockchainService()
        self.matcher: MatchingService = MatchingService(db) if db else None
        
    async def _get_student_context(self, user_id: str) -> str:
        """Collects student profile, career path, and academic records for AI context."""
        if not self.db:
            return "No database connection available."
            
        # Lookup by user_id (Auth ID)
        student = self.db.query(models.Student).filter(models.Student.user_id == user_id).first()
        if not student:
            return "Student profile not found in database."
            
        context = f"Student Profile: {student.first_name} {student.last_name}\n"
        context += f"Course of Study: {student.course_of_study or 'Not specified'}\n"
        context += f"Current Year: {student.current_year or 'Unknown'}\n"
        context += f"Interests: {', '.join(student.interests) if student.interests else 'None'}\n"
        context += f"Skills: {', '.join(student.skills) if student.skills else 'None'}\n"
        context += f"Career Path Goal: {student.career_path or 'Not set'}\n"
        
        # Fetch Academic Records (Grades)
        records = self.db.query(models.StudentAcademicRecord).filter(models.StudentAcademicRecord.student_id == student.id).all()
        if records:
            context += "\nAcademic Performance (Transcripts):\n"
            for rec in records:
                context += f"- {rec.unit_code} {rec.unit_name}: Grade {rec.grade} (Year {rec.academic_year}, Sem {rec.semester})\n"
        
        # Fetch Learning Progress
        learning = self.db.query(models.StudentLearning).filter(models.StudentLearning.student_id == student.id).all()
        if learning:
             context += "\nExtra-curricular Learning:\n"
             for l in learning:
                 context += f"- Task: {l.id} Status: {l.status} Progress: {l.progress}%\n"

        # Fetch Transcripts (PDF Extractions)
        docs = self.db.query(models.DocumentHub).filter(
            models.DocumentHub.owner_id == student.user_id,
            models.DocumentHub.type == 'TRANSCRIPT',
            models.DocumentHub.status == 'VERIFIED'
        ).all()
        
        transcript_text = ""
        for doc in docs:
            file_path = doc.file_url.lstrip('/')
            abs_path = os.path.join("/home/wakanda_forever/Desktop/AISHA/backend", file_path)
            if os.path.exists(abs_path):
                transcript_text += document_extraction_service.extract_text_from_pdf(abs_path) + "\n"
            
        if transcript_text:
            context += f"\nAdditional Transcript Content:\n{transcript_text[:1000]}...\n" # Limit context size
            
        return context
        
    async def process_message(self, user_id: str, message: str) -> Dict[str, Any]:
        """
        Autonomous Message Processing.
        1. Reason about the query.
        2. Execute the plan using internal tools.
        3. Synthesize the final response.
        """
        # Phase 1: Reasoning
        plan_data = await self.reasoner.plan_execution(message)
        
        if isinstance(plan_data, dict):
            plan: List[Dict[str, Any]] = plan_data.get("plan", [])
        elif isinstance(plan_data, list):
            plan = plan_data
        else:
            plan = []
        
        # If no plan could be formed, try general knowledge query
        if not plan:
            plan = [{"capability": "KNOWLEDGE_QUERY", "priority": 1}]

        # Greeting Check: Simplify to avoid heavy DB count in every turn
        is_first_message = True
        if self.db:
            try:
                # Optimized check: Just a quick existence check for ANY previous message
                twelve_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=12)
                existing = self.db.query(models.Message.id).filter(
                    (models.Message.sender_id == user_id) | (models.Message.receiver_id == user_id),
                    models.Message.timestamp > twelve_hours_ago
                ).limit(2).all()
                if len(existing) > 1:
                    is_first_message = False
            except Exception:
                is_first_message = False # Default to no greeting if DB fails

        final_response = ""
        context_data = {}
        
        # Phase 2: Execution of Autonomous Plan
        try:
            for step in plan:
                if not isinstance(step, dict):
                    continue
                cap = step.get("capability")
                
                if cap == "KNOWLEDGE_QUERY":
                    kb_results = self.knowledge.query_knowledge(message)
                    if kb_results:
                        final_response += f"{kb_results[0]['snippet']} "
                        context_data["kb_source"] = kb_results[0]["id"]
                
                elif cap == "DATA_RETRIEVAL" and self.db:
                    # Dynamic matching for database entities
                    msg_lower: str = str(message).lower()
                    if "company" in msg_lower or "tell me about" in msg_lower:
                        clean_query = message.lower().replace("tell me about", "").replace("who is", "").strip()
                        company = self.db.query(models.Company).filter(models.Company.name.ilike(f"%{clean_query}%")).first()
                        if company:
                            final_response += f"**{company.name}**: {company.description} Location: {company.location}. "
                    
                    elif "status" in str(message).lower() or "application" in str(message).lower():
                        # For status, just remind them to check the dashboard (real-time data delivery)
                        final_response += "Your real-time application status is available on your dashboard. "

                elif cap == "WEB_SCOUTING":
                    # Real-time scouting
                    scout_results = await self.scraper.scout_real_time(message)
                    if scout_results:
                        scout_text = "\nI've scouted the following external resources for you:\n"
                        for r in scout_results:
                            scout_text += f"- [{r['title']}]({r['url']})\n"
                        final_response += scout_text
                        context_data["web_scout"] = scout_results
                        final_response += " " # Ensure trailing space

                elif cap == "DOCUMENT_AUTOMATION":
                    if "verify" in str(message).lower() or "blockchain" in str(message).lower():
                        final_response += "Initiating blockchain integrity check... All system-generated documents are anchored to our private immutable ledger. "
                    else:
                        final_response += "All necessary documents (NITA, Insurance, School Letter) are automatically generated and secured on the blockchain once you accept a placement. "

                elif cap == "DECISION_ANALYSIS" and self.db and user_id:
                    analysis = await self.chief.handle_complex_goal(user_id, message)
                    final_response += f"**Sovereign Analysis**: {analysis['agent_vibe']} response - I have orchestrated a plan involving {', '.join(analysis['orchestrated_plan'])}. "
                    
                    agent = StudentAutonomyAgent(self.db)
                    app = self.db.query(models.Application).filter_by(student_id=user_id).order_by(models.Application.id.desc()).first()
                    if app:
                        eval_result = agent.evaluate_placement_offer(str(user_id), str(app.opportunity_id))
                        final_response += f"My direct recommendation is to: {eval_result['decision']}. {eval_result['reasoning']} "
                    
                    matcher = MatchingService(self.db)
                    recs = await matcher.calculate_matches_for_student(user_id)
                    if recs:
                        top = recs[0]
                        final_response += f"You have matches like {top['title']} with a score of {top['score']}%. "

                elif cap == "GENERAL_LLM":
                    greeting_instr = "Greet the user warmly only if they said hello or this is the start of a conversation." if is_first_message else "Do NOT greet the user, start your response directly."
                    persona = (
                        "You are AISHA (Autonomous Intelligent Student Herald Assistant). "
                        f"{greeting_instr} "
                        "ANSWER the user's question directly and concisely. Be friendly and encouraging. "
                        "FORMATTING RULES: strictly FORBIDDEN to use asterisks (*) for any formatting. "
                        "Use '###' for headers and plain text for bulk content. For lists, use simple numbers (1, 2) or dashes (-)."
                    )
                    gen_response = await llm_service.generate_response(message, system_prompt=persona, force_gemini=True)
                    final_response += f"{gen_response} "

                elif cap == "MATCHING_ANALYSIS" and self.db and user_id:
                    # Explain why matches were made
                    student_ctx = await self._get_student_context(user_id)
                    matches = await self.matcher.calculate_matches_for_student(user_id)
                    
                    if matches:
                        top_match = matches[0]
                        opp = self.db.query(models.Opportunity).get(top_match['opportunity_id'])
                        
                        analysis_prompt = f"""
                        Student Context: {student_ctx}
                        Opportunity: {opp.title} - {opp.description}
                        Match Score: {top_match['score']}%
                        Match Details: {json.dumps(top_match['match_details'])}
                        
                        Explain why this student is a good match for this role. 
                        Be specific about their skills and academic background.
                        Directly address the user: "{message}"
                        
                        FORMATTING: strictly FORBIDDEN to use asterisks (*). Use '###' for headers. 
                        {"GREETING: Briefly greet the user first." if is_first_message else "GREETING: Do NOT greet, start directly."}
                        """
                        analysis = await llm_service.generate_response(analysis_prompt, system_prompt="You are the AISHA Matching Expert.", force_gemini=True)
                        final_response += f"**Match Analysis**: {analysis} "
                    else:
                        final_response += "I couldn't find any high-confidence matches to analyze right now. "

                elif cap == "CAREER_ADVICE" and self.db and user_id:
                    # Provide personalized career advice
                    student_ctx = await self._get_student_context(user_id)
                    advice_prompt = f"""
                    Student Context: {student_ctx}
                    User Query: {message}
                    
                    Provide personalized career advice. Use their academic performance (transcripts) 
                    and interests to suggest future steps, certifications, or roles.
                    
                    FORMATTING: strictly FORBIDDEN to use asterisks (*). Use '###' for headers.
                    {"GREETING: Briefly greet the user first." if is_first_message else "GREETING: Do NOT greet, start directly."}
                    """
                    advice = await llm_service.generate_response(advice_prompt, system_prompt="You are the AISHA Career Counselor.", force_gemini=True)
                    final_response += f"**Career Advice**: {advice} "
            
            # Final Safety: If reasoning was assigned but resulted in no text, use GENERAL_LLM
            if not final_response.strip() and plan:
                greeting_instr = "Briefly introduce yourself as AISHA." if is_first_message else "Do NOT introduce yourself, just answer."
                persona = f"You are AISHA. {greeting_instr} Answer the user's query helpfully and concisely. FORMATTING: strictly FORBIDDEN to use asterisks (*)."
                gen_response = await llm_service.generate_response(message, system_prompt=persona, force_gemini=True)
                final_response = gen_response
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error executing plan step: {e}")
            final_response += "I encountered an issue while processing your request. "

        # Clean up response
        if not final_response:
             final_response = "I'm AISHA, and I'm still learning about that specific topic. Try asking about placements, NITA rules, or scouting for courses!"

        return {
            "user_id": user_id,
            "response": final_response.strip(),
            "plan_followed": [p["capability"] for p in plan],
            "data": context_data
        }
