import logging
import asyncio
import time
import numpy as np

def cos_sim(a, b):
    try:
        a = np.array(a)
        b = np.array(b)
        if a.shape != b.shape:
            return 0.0
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return np.dot(a, b) / (norm_a * norm_b + 1e-9)
    except Exception:
        return 0.0

logger = logging.getLogger(__name__)

from app.services.document_extraction_service import document_extraction_service
import os

# Global memory cache for opportunities to prevent fetching and processing redundantly
from sqlalchemy.orm import Session
from app import models
from typing import List, Dict, Any
from app.core.ml_factory import model_factory
from app.services.llm_service import llm_service

class OpportunityCache:
    opportunities: List[models.Opportunity] = []
    embeddings: Dict[str, Dict[str, Any]] = {}  # opp.id -> precomputed vectors or strings
    last_fetched: float = 0
    TTL: int = 300 # 5 minutes

class MatchingService:
    def __init__(self, db: Session):
        self.db: Session = db
        self.model = model_factory.get_model()
        # Default weights - Can be autonomously adjusted by the system
        # Enhanced weights to prioritize career path and academic/transcript records
        self.weights = {
            "academic": 0.35,
            "skills": 0.25,
            "interest": 0.10,
            "career_path": 0.20,
            "location": 0.10
        }
        self.autonomous_mode = True

    def adjust_weights_from_feedback(self, performance_data: List[Dict[str, Any]]):
        if not performance_data:
            return

        for record in performance_data:
            if record.get('was_accepted'):
                max_factor = max(record['details'], key=record['details'].get)
                self.weights[max_factor.replace("_score", "")] += 0.01
                
        total = sum(self.weights.values())
        for k in self.weights:
            self.weights[k] /= total

    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        if not text1 or not text2:
            return 0.0
        
        if self.model is None:
            return 0.5

        try:
            embeddings = self.model.encode([text1, text2])
            similarity = cos_sim(embeddings[0], embeddings[1])
            if isinstance(similarity, np.ndarray):
                return float(similarity.item())
            return float(similarity)
        except Exception as e:
            return 0.5
        
    def _calculate_batch_semantic_similarity(self, student_emb, target_texts: List[str]) -> List[float]:
        """Calculates similarity of one student embedding against multiple targets efficiently."""
        if not target_texts:
            return []
        
        if self.model is None or student_emb is None:
            return [0.5 for _ in target_texts]
        
        target_embs = self.model.encode(target_texts)
        similarities = cos_sim(student_emb, target_embs)
        if isinstance(similarities, list):
             return [float(sim) for sim in similarities]
        return [float(sim) for sim in similarities.flatten()]

    def calculate_algorithmic_score(self, student: models.Student, opp: models.Opportunity, transcript_text: str = "") -> dict:
        job_reqs = f"{opp.title} {opp.requirements} {opp.description}"
        
        if not transcript_text and not student.academic_records:
            return {"score": 0.0, "reasoning": "[SYSTEM] AWAITING_ACADEMIC_RECORDS_FOR_VECTOR_SCAN."}
            
        student_doc = transcript_text
        if student.academic_records:
            good_units = [r.unit_name for r in student.academic_records if r.grade in ['A', 'B']]
            student_doc += " " + " ".join(good_units) * 3 
            
        if not student_doc.strip():
            return {"score": 0.0, "reasoning": "[SYSTEM] EMPTY_TRANSCRIPT_NODE_DETECTED."}
            
        try:
            embeddings = self.model.encode([job_reqs, student_doc])
            cos_val = cos_sim(embeddings[0], embeddings[1])
            sim_val = float(cos_val.item()) if isinstance(cos_val, np.ndarray) else float(cos_val)
            
            final_alg_score = min(1.0, sim_val * 1.5) 
            
            return {
                "score": final_alg_score,
                "reasoning": f"Your academic trajectory shows a strong alignment with the requirements for {opp.title}."
            }
        except Exception as e:
            logger.error(f"Algorithmic Embedding Error: {str(e)}")
            return {"score": 0.0, "reasoning": "[SYSTEM] COMPUTATION_PROTOCOL_MISMATCH."}

    async def calculate_academic_score(self, student: models.Student, opp: models.Opportunity, transcript_text: str = "") -> dict:
        t0_alg = time.time()
        alg_result = self.calculate_algorithmic_score(student, opp, transcript_text)
        t1_alg = time.time()
        
        alg_latency = t1_alg - t0_alg
        logger.info(f"[TIMING] Algorithmic Deep Match for '{opp.title}' took {alg_latency:.4f}s")

        # Removed fast-path template reasoning to ensure holistic LLM-driven justifications for all matches.

        records = student.academic_records
        if not records and not transcript_text:
            return {"opportunity_id": str(opp.id), "score": 0.0, "reasoning": "[SYSTEM] AWAITING_STRUCTURAL_RECORDS_FOR_SCAN."}

        grade_points = {"A": 1.0, "B": 0.8, "C": 0.6, "D": 0.4, "E": 0.2, "F": 0.0}
        unit_names = [f"{r.unit_name} ({r.grade})" for r in records]
        prompt = f"""
        [AI_MATCH_ENGINE_V9]
        Role: {opp.title} at {opp.company.name if opp.company else 'Target Corp'}
        Requirements: {opp.requirements}
        
        YOUR_PROFILE:
        - Path: {student.career_path or 'General'}
        - Interests: {", ".join(student.interests) if student.interests else 'None'}
        - Skills: {", ".join(student.skills) if student.skills else 'None'}
        - Grades: {", ".join(unit_names) if unit_names else "None"}
        
        TASK: Synthesize a personalized Match Reasoning (1 sentence).
        
        RULES:
        1. Address the user as 'You' (e.g., 'You possess...', 'Your background in...').
        2. DO NOT use generic phrases like 'The candidate demonstrates' or 'The student exhibits'.
        3. FOCUS on the intersection between the SPECIFIC role requirements and your unique strengths.
        4. BE UNIQUE: Avoid repeating the same summary across different roles.
        
        **RESPONSE_STRUCTURE:**
        - reasoning: Distinctive sentence addressing the user directly.
        - relevance_score: Float (0-1).
        - top_relevant_units: List of 2 critical units from the transcript.
        
        Respond ONLY with valid JSON.
        - Ensure 'reasoning' is a professional, ONE-SENTENCE justification that starts with 'You' or 'Your'.
        - DO NOT mention 'Algorithmic Match', 'Vector Alignment', or technical scores in the reasoning.
        """
        
        try:
            t0_llm = time.time()
            res = await asyncio.wait_for(
                llm_service.analyze_structured(prompt, {
                    "relevance_score": "number", 
                    "top_relevant_units": ["string"],
                    "reasoning": "string"
                }),
                timeout=30.0
            )
            t1_llm = time.time()
            logger.info(f"[TIMING] LLM Deep Match for '{opp.title}' SUCCESS in {t1_llm - t0_llm:.4f}s")

            top_units = res.get("top_relevant_units", [])
            if not top_units and not transcript_text:
                llm_score = float(res.get("relevance_score", 0.0)) * 0.5
                llm_reasoning = res.get("reasoning", "[SYSTEM] SEMANTIC_ALIGNMENT_STRENGTH_VERIFIED.")
            else:
                total_grade_score = sum(grade_points.get(str(u).split('(')[-1].strip(')'), 0.5) for u in top_units)
                avg_grade_score = total_grade_score / len(top_units) if top_units else 0.5
                
                llm_score = (0.6 * float(res.get("relevance_score", 0.0))) + (0.4 * float(avg_grade_score)) if transcript_text else (0.4 * float(res.get("relevance_score", 0.0))) + (0.6 * float(avg_grade_score))
                llm_reasoning = str(res.get("reasoning", "[SYSTEM] SEMANTIC_MATCH_VERIFIED."))
            
        except Exception as e:
            t_fail = time.time()
            logger.warning(f"[TIMING] LLM Deep Match for '{opp.title}' FAILED/TIMEOUT after {t_fail - t0_llm:.4f}s ({str(e)}). Falling back to pure NLP Algorithm.")
            return {
                "opportunity_id": str(opp.id),
                "score": alg_result["score"],
                "reasoning": alg_result["reasoning"]
            }

        # Compare LLM result vs Algorithmic result and take the BEST mathematically
        if alg_result["score"] > llm_score:
            return {
                "opportunity_id": str(opp.id),
                "score": alg_result["score"],
                "reasoning": alg_result["reasoning"]
            }
        else:
            return {
                "opportunity_id": str(opp.id),
                "score": float(llm_score),
                "reasoning": llm_reasoning
            }

    def _refresh_opportunities(self):
        current_time = time.time()
        if not OpportunityCache.opportunities or (current_time - OpportunityCache.last_fetched > OpportunityCache.TTL):
            logger.info("MATCH_ENGINE: Refreshing Opportunity Cache with Pre-computed texts and embeddings.")
            opps = self.db.query(models.Opportunity).filter(models.Opportunity.status == 'OPEN').all()
            OpportunityCache.opportunities = opps
            OpportunityCache.embeddings = {}
            
            # Pre-calculate all texts first for batch encoding (Faster)
            job_texts = [f"{opp.title} {opp.description} {opp.requirements}" for opp in opps]
            interest_texts = [f"{opp.title} {opp.department_id} {opp.description}" for opp in opps]
            
            logger.info(f"MATCH_ENGINE: Generating embeddings for {len(opps)} opportunities...")
            job_embs = self.model.encode(job_texts, convert_to_tensor=True)
            interest_embs = self.model.encode(interest_texts, convert_to_tensor=True)
            
            for i, opp in enumerate(opps):
                OpportunityCache.embeddings[str(opp.id)] = {
                    "job_reqs_emb": job_embs[i],
                    "interest_emb": interest_embs[i],
                    "location_text": (opp.location or "").lower(),
                    "skills_required": set(opp.skills_required) if opp.skills_required else set()
                }
            OpportunityCache.last_fetched = current_time
            logger.info(f"MATCH_ENGINE: Cached {len(opps)} opportunities with vector embeddings.")
        return OpportunityCache.opportunities

    async def calculate_matches_for_student(self, student_id: str) -> List[Dict[str, Any]]:
        student = self.db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            return []

        # Tier 0: Fetch & Refresh
        opportunities = self._refresh_opportunities()
        docs = self.db.query(models.DocumentHub).filter(
            models.DocumentHub.owner_id == student.user_id,
            models.DocumentHub.type == 'TRANSCRIPT',
            models.DocumentHub.status == 'VERIFIED'
        ).all()
        
        # Concurrently extract transcript texts
        transcript_tasks = []
        for doc in docs:
            file_path = doc.file_url.lstrip('/')
            abs_path = os.path.join("/home/wakanda_forever/Desktop/AISHA/backend", file_path)
            transcript_tasks.append(document_extraction_service.extract_text_from_pdf_async(abs_path))
            
        transcript_texts = await asyncio.gather(*transcript_tasks)
        transcript_text = "\n".join(transcript_texts)

        # Pre-encode student profile for batch similarity
        student_skills_text = ", ".join(student.skills) if student.skills else ""
        student_interests_text = ", ".join(student.interests) if student.interests else ""
        student_career_path = student.career_path or ""
        
        try:
            student_embeddings = self.model.encode([student_skills_text, student_interests_text, student_career_path], convert_to_tensor=True)
            skill_base_emb = student_embeddings[0]
            interest_base_emb = student_embeddings[1]
            career_base_emb = student_embeddings[2]
        except Exception as e:
            logger.error(f"Error encoding student profile: {e}")
            skill_base_emb = interest_base_emb = career_base_emb = None
        
        # Pre-process student locations
        student_locs = [l.lower() for l in student.preferred_locations] if student.preferred_locations else []
        
        # Pre-encode student locations for batch comparison
        if student_locs:
            try:
                location_embs = self.model.encode(student_locs, convert_to_tensor=True)
            except Exception as e:
                logger.error(f"Error encoding student locations: {e}")
                location_embs = None
        else:
            location_embs = None
        
        student_sk = set(student.skills) if student.skills else set()
        w = self.weights

        # --- TIER 1: VECTOR SCAN & HEURISTIC FILTER (All Opportunities) ---
        candidates = []
        for opp in opportunities:
            opp_cache = OpportunityCache.embeddings.get(str(opp.id), {})
            
            # Semantic Similarity
            if skill_base_emb is not None and "job_reqs_emb" in opp_cache:
                sem_sim = float(cos_sim(skill_base_emb, opp_cache["job_reqs_emb"]).item()) if isinstance(cos_sim(skill_base_emb, opp_cache["job_reqs_emb"]), np.ndarray) else float(cos_sim(skill_base_emb, opp_cache["job_reqs_emb"]))
            else:
                sem_sim = 0.5
                
            required = opp_cache.get("skills_required", set())
            skill_set_score = len(required.intersection(student_sk)) / len(required) if required else 1.0
            skill_score = (0.7 * sem_sim) + (0.3 * skill_set_score)
            
            # Interest & Career Fit
            if interest_base_emb is not None and "interest_emb" in opp_cache:
                i_val = cos_sim(interest_base_emb, opp_cache["interest_emb"])
                c_val = cos_sim(career_base_emb, opp_cache["interest_emb"])
                interest_score = float(i_val.item()) if isinstance(i_val, np.ndarray) else float(i_val)
                career_path_score = float(c_val.item()) if isinstance(c_val, np.ndarray) else float(c_val)
            else:
                interest_score = career_path_score = 0.5

            # Optimized Location Match using pre-encoded student locations
            location_score = 0.5
            if location_embs is not None and "location_emb" in opp_cache:
                try:
                    loc_sims = cos_sim(location_embs, opp_cache["location_emb"])
                    location_score = float(loc_sims.max().item()) if isinstance(loc_sims, np.ndarray) else float(max(loc_sims))
                except: location_score = 0.5
            elif student_locs and opp_cache.get("location_text"):
                # Fallback to string match if embedding missing
                opp_loc = opp_cache["location_text"].lower()
                location_score = 0.8 if any(loc in opp_loc for loc in student_locs) else 0.5

            h_score = (w["skills"] * skill_score) + \
                      (w["interest"] * interest_score) + \
                      (w["career_path"] * career_path_score) + \
                      (w["location"] * location_score)
            
            candidates.append({
                "opp": opp,
                "heuristic_score": h_score,
                "skill_score": skill_score,
                "interest_score": interest_score,
                "career_path_score": career_path_score,
                "location_score": location_score
            })

        # Sort and take top 15 for Tier 2
        candidates.sort(key=lambda x: x['heuristic_score'], reverse=True)
        tier2_pool = candidates[:15]
        low_tier = candidates[15:]

        # --- TIER 3: PARALLEL LLM DEEP MATCH (Top 2 Candidates) ---
        # Optimized to 2 parallel calls to stay within Gemini free tier rate limits (RPM) 
        # and prevent slow Ollama fallback cascades.
        top_2 = tier2_pool[:2]
        others = tier2_pool[2:]

        logger.info(f"MATCH_ENGINE: Firing 2 PARALLEL deep-match evaluations.")
        
        # Parallel execution with semaphore
        sem = asyncio.Semaphore(2)
        async def sem_match(cand):
            async with sem:
                try:
                    return await self.calculate_academic_score(student, cand["opp"], transcript_text)
                except Exception as e:
                    logger.error(f"Deep match error for {cand['opp'].title}: {e}")
                    return None

        # Gather LLM results for top 2
        llm_results = await asyncio.gather(*[sem_match(c) for c in top_2])
        academic_results_map = {r["opportunity_id"]: r for r in llm_results if r and "opportunity_id" in r}

        matches = []
        
        # Process Top 2 with LLM Data
        for cand in top_2:
            opp_id_str = str(cand["opp"].id)
            if opp_id_str in academic_results_map:
                res = academic_results_map[opp_id_str]
                academic_score = float(res.get("score", 0.5))
                reasoning = res.get("reasoning", "You have a strong alignment with this role.")
                final_score = (w["academic"] * academic_score) + cand["heuristic_score"]
            else:
                academic_score = 0.5
                final_score = (w["academic"] * academic_score) + cand["heuristic_score"]
                reasoning = f"Your career trajectory in {cand['opp'].title} shows significant promise based on your current skill set."

            matches.append({
                "opportunity_id": opp_id_str,
                "job_title": cand["opp"].title,
                "company_id": str(cand["opp"].company_id),
                "company_name": cand["opp"].company.name if cand["opp"].company else "Unknown",
                "match_score": round(final_score * 100, 2),
                "reasoning": reasoning,
                "match_details": {
                    "academic_score": round(academic_score, 2),
                    "skill_score": round(cand["skill_score"], 2),
                    "interest_score": round(cand["interest_score"], 2),
                    "career_path_score": round(cand["career_path_score"], 2),
                    "method": "holistic_deep_match_v8",
                    "provider": "Gemini-1.5-Flash"
                }
            })

        # Add remaining tiers
        for cand in (others + low_tier):
            final_score = (w["academic"] * 0.4) + cand["heuristic_score"]
            
            # Dynamic reasoning for local fallback
            if cand["skill_score"] > 0.6:
                reasoning = f"Your skill set in {student_skills_text[:50]}... closely matches the requirements for {cand['opp'].title}."
            elif cand["interest_score"] > 0.6:
                reasoning = f"Your career interests align well with the {cand['opp'].title} position."
            matches.append({
                "opportunity_id": str(cand["opp"].id),
                "job_title": cand["opp"].title,
                "company_id": str(cand["opp"].company_id),
                "company_name": cand["opp"].company.name if cand["opp"].company else "Unknown",
                "match_score": round(final_score * 100, 2),
                "reasoning": reasoning,
                "match_details": {
                    "method": "autonomous_fast_heuristic",
                    "fallback_engine": "FastEmbed-Local"
                }
            })

        # Final Sort
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Ensure all Top matches have professional reasoning (Max top 3)
        for i in range(min(3, len(matches))):
            match = matches[i]
            # Detect technical or placeholder reasoning
            is_technical = any(term in match["reasoning"].lower() for term in ["algorithmic", "vector", "score:", "computed", "[system]"])
            
            if is_technical:
                 prompt = f"Role: {match['job_title']} at {match['company_name']}. Justification context: {match['reasoning']}. TASK: Rewrite this into a unique, professional ONE sentence match justification addressing the user as 'You'. Avoid technical jargon."
                 try:
                     res = await llm_service.analyze_structured(prompt, {"reasoning": ""})
                     if res.get("reasoning"):
                         match["reasoning"] = res["reasoning"]
                 except: pass

        return matches[:10]
