from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer
from app import models
from typing import List, Dict, Any
from sentence_transformers import util
from app.core.ml_factory import model_factory
from app.services.llm_service import llm_service
import json
import logging
import asyncio
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

logger = logging.getLogger(__name__)

from app.services.document_extraction_service import document_extraction_service
import os

# Global memory cache for opportunities to prevent fetching and processing redundantly
class OpportunityCache:
    opportunities: List[models.Opportunity] = []
    embeddings: Dict[str, Dict[str, Any]] = {}  # opp.id -> precomputed vectors or strings
    last_fetched: float = 0
    TTL: int = 300 # 5 minutes

class MatchingService:
    def __init__(self, db: Session):
        self.db: Session = db
        self.model: SentenceTransformer = model_factory.get_model()
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
        
        embeddings = self.model.encode([text1, text2], convert_to_tensor=True)
        similarity = util.cos_sim(embeddings[0], embeddings[1])
        return float(similarity.item())
        
    def _calculate_batch_semantic_similarity(self, student_emb, target_texts: List[str]) -> List[float]:
        """Calculates similarity of one student embedding against multiple targets efficiently."""
        if not target_texts:
            return []
        
        target_embs = self.model.encode(target_texts, convert_to_tensor=True)
        similarities = util.cos_sim(student_emb, target_embs)
        return [float(sim.item()) for sim in similarities[0]]

    def calculate_algorithmic_score(self, student: models.Student, opp: models.Opportunity, transcript_text: str = "") -> dict:
        job_reqs = f"{opp.title} {opp.requirements} {opp.description}"
        
        if not transcript_text and not student.academic_records:
            return {"score": 0.0, "reasoning": "AISHA Neural Engine: Awaiting verified academic architecture for vector alignment."}
            
        student_doc = transcript_text
        if student.academic_records:
            good_units = [r.unit_name for r in student.academic_records if r.grade in ['A', 'B']]
            student_doc += " " + " ".join(good_units) * 3 
            
        if not student_doc.strip():
            return {"score": 0.0, "reasoning": "AISHA Neural Engine: Synthesizing empty transcript node."}
            
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([job_reqs, student_doc])
            cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            final_alg_score = min(1.0, float(cos_sim) * 1.5) 
            
            return {
                "score": final_alg_score,
                "reasoning": f"Algorithmic Match: Computed {final_alg_score * 100:.1f}% transcript vector alignment."
            }
        except Exception as e:
            logger.error(f"Algorithmic TF-IDF Error: {str(e)}")
            return {"score": 0.0, "reasoning": "AISHA Neural Engine: High-fidelity computation protocol mismatch."}

    async def calculate_academic_score(self, student: models.Student, opp: models.Opportunity, transcript_text: str = "") -> dict:
        t0_alg = time.time()
        alg_result = self.calculate_algorithmic_score(student, opp, transcript_text)
        t1_alg = time.time()
        
        alg_latency = t1_alg - t0_alg
        logger.info(f"[TIMING] Algorithmic Deep Match for '{opp.title}' took {alg_latency:.4f}s")

        # Fast path semantic matching
        if student.academic_analysis and "insights" in student.academic_analysis:
            analysis = student.academic_analysis
            insights = analysis.get("insights", "")
            strengths = ", ".join(analysis.get("strengths", []))
            
            academic_context = f"{insights} Professional Strengths: {strengths}"
            job_context = f"{opp.title} {opp.requirements}"
            
            sim_score = self.calculate_semantic_similarity(academic_context, job_context)
            status_boost = 0.1 if analysis.get("status") == "EXCELLENT" else 0.05 if analysis.get("status") == "PROFICIENT" else 0.0
            
            return {
                "opportunity_id": str(opp.id),
                "score": min(1.0, float(sim_score) + status_boost),
                "reasoning": analysis.get("recommendation", "AISHA Neural Engine: Synthesized alignment detected in academic trajectory.")
            }

        records = student.academic_records
        if not records and not transcript_text:
            return {"opportunity_id": str(opp.id), "score": 0.0, "reasoning": "AISHA Neural Engine: Awaiting structural records for deep scan."}

        grade_points = {"A": 1.0, "B": 0.8, "C": 0.6, "D": 0.4, "E": 0.2, "F": 0.0}
        unit_names = [f"{r.unit_name} ({r.grade})" for r in records]
        
        prompt = f"""
        Role: {opp.title}
        Requirements: {opp.requirements}
        Transcript Text Preview: {transcript_text[:1000] if transcript_text else "None"}
        Student Units: {", ".join(unit_names) if unit_names else "None"}
        
        Analyze the relevance of the student's academic background to the role. 
        Focus strictly on how their coursework and transcript support the {opp.title} role.
        Return a JSON object with:
        "relevance_score": float (0-1),
        "top_relevant_units": list of unit_names,
        "reasoning": string (1-2 very concise sentences explaining why this structurally fits.)
        """
        
        try:
            t0_llm = time.time()
            res = await asyncio.wait_for(
                llm_service.analyze_structured(prompt, {
                    "relevance_score": 0.85, 
                    "top_relevant_units": ["Unit A", "Unit B"],
                    "reasoning": "AISHA Neural Engine: High-confidence structural node alignment."
                }),
                timeout=10.0
            )
            t1_llm = time.time()
            logger.info(f"[TIMING] LLM Deep Match for '{opp.title}' SUCCESS in {t1_llm - t0_llm:.4f}s")

            top_units = res.get("top_relevant_units", [])
            if not top_units and not transcript_text:
                llm_score = float(res.get("relevance_score", 0.0)) * 0.5
                llm_reasoning = res.get("reasoning", "Matches basic requirements.")
            else:
                total_grade_score = sum(grade_points.get(str(u).split('(')[-1].strip(')'), 0.5) for u in top_units)
                avg_grade_score = total_grade_score / len(top_units) if top_units else 0.5
                
                llm_score = (0.6 * float(res.get("relevance_score", 0.0))) + (0.4 * float(avg_grade_score)) if transcript_text else (0.4 * float(res.get("relevance_score", 0.0))) + (0.6 * float(avg_grade_score))
                llm_reasoning = str(res.get("reasoning", "AISHA Neural Engine: Deep semantic match verified."))
            
        except Exception as e:
            t_fail = time.time()
            logger.warning(f"[TIMING] LLM Deep Match for '{opp.title}' FAILED/TIMEOUT after {t_fail - t0_llm:.4f}s ({str(e)}). Falling back to pure NLP Algorithm.")
            return {
                "opportunity_id": str(opp.id),
                "score": alg_result["score"],
                "reasoning": alg_result["reasoning"] + f" (LLM Fallback Executed - Alg Time: {alg_latency:.4f}s)"
            }

        # Compare LLM result vs Algorithmic result and take the BEST mathematically
        if alg_result["score"] > llm_score:
            return {
                "opportunity_id": str(opp.id),
                "score": alg_result["score"],
                "reasoning": alg_result["reasoning"] + f" (Algorithm Selected Over LLM - Alg Time: {alg_latency:.4f}s)"
            }
        else:
            return {
                "opportunity_id": str(opp.id),
                "score": float(llm_score),
                "reasoning": llm_reasoning + f" (LLM Selected - Time: {t1_llm - t0_llm:.4f}s)"
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

        matches = []
        
        # Pre-encode student texts for batching
        student_skills_text = ", ".join(student.skills) if student.skills else ""
        student_interests_text = ", ".join(student.interests) if student.interests else ""
        student_career_path = student.career_path or ""
        
        # Encode student base once
        try:
            student_embeddings = self.model.encode([student_skills_text, student_interests_text, student_career_path], convert_to_tensor=True)
            skill_base_emb = student_embeddings[0]
            interest_base_emb = student_embeddings[1]
            career_base_emb = student_embeddings[2]
        except Exception as e:
            logger.error(f"Error encoding student profiles: {e}")
            skill_base_emb = None
        
        student_sk = set(student.skills) if student.skills else set()
        student_locs = [l.lower() for l in student.preferred_locations] if student.preferred_locations else []

        w = self.weights
        
        # Calculate heuristics quickly
        t0_heur = time.time()
        potential_candidates = []

        # Optimization: Pre-encode student skills/interests/career for faster batching
        # (Already done above)

        for opp in opportunities:
            opp_cache = OpportunityCache.embeddings.get(str(opp.id), {})
            
            # 1. Faster Semantic Skills Match using cached embeddings
            if skill_base_emb is not None and "job_reqs_emb" in opp_cache:
                sem_sim = float(util.cos_sim(skill_base_emb, opp_cache["job_reqs_emb"]).item())
            else:
                sem_sim = 0.5
                
            required = opp_cache.get("skills_required", set())
            skill_set_score = len(required.intersection(student_sk)) / len(required) if required else 1.0
            skill_score = (0.7 * sem_sim) + (0.3 * skill_set_score)
            
            # 2. Interest & Career Path Match using cached embeddings
            if interest_base_emb is not None and "interest_emb" in opp_cache:
                interest_score = float(util.cos_sim(interest_base_emb, opp_cache["interest_emb"]).item())
                career_path_score = float(util.cos_sim(career_base_emb, opp_cache["interest_emb"]).item())
            else:
                interest_score = 0.5
                career_path_score = 0.5

            if float(career_path_score) < 0.2 and student.career_path:
                career_path_score = 0.0

            # 3. Location Match
            location_score = 0.5
            if student_locs and opp_cache["location_text"]:
                best_loc = max([self.calculate_semantic_similarity(loc, opp_cache["location_text"]) for loc in student_locs], default=0.5)
                location_score = float(best_loc)

            # 4. Composite Heuristic Score
            heuristic_score = (w["skills"] * skill_score) + \
                              (w["interest"] * interest_score) + \
                              (w["career_path"] * career_path_score) + \
                              (w["location"] * location_score)
            
            potential_candidates.append({
                "opp": opp,
                "heuristic_score": heuristic_score,
                "skill_score": skill_score,
                "interest_score": interest_score,
                "career_path_score": career_path_score,
                "location_score": location_score
            })

        # Sort candidates by heuristic score to pick the best for LLM verification
        potential_candidates.sort(key=lambda x: x['heuristic_score'], reverse=True)
        
        # PERFORMANCE OPTIMIZATION: Only LLM match the TOP 5 candidates to reduce latency 
        # and ensure high-quality deep-analysis for the most promising opportunities.
        top_k = potential_candidates[:5]
        low_tier = potential_candidates[5:]

        opp_academic_tasks = []
        for cand in top_k:
            # If heuristic is reasonable, queue up the deep academic LLM task
            if cand["heuristic_score"] > 0.15:
                opp_academic_tasks.append(self.calculate_academic_score(student, cand["opp"], transcript_text))

        # Run all necessary LLM queries concurrently
        if opp_academic_tasks:
            logger.info(f"MATCH_ENGINE: Firing {len(opp_academic_tasks)} TOP-TIER concurrent academic LLM verifications.")
            academic_results_list = await asyncio.gather(*opp_academic_tasks, return_exceptions=True)
        else:
            academic_results_list = []
        
        # Map results back
        academic_results_map = {}
        for r in academic_results_list:
            if isinstance(r, dict) and "opportunity_id" in r:
                academic_results_map[r["opportunity_id"]] = r
            elif isinstance(r, Exception):
                logger.error(f"Concurrent LLM Evaluation Exception: {r}")

        # Finalize Top-Tier Matches
        for cand in top_k:
            opp_id_str = str(cand["opp"].id)
            if opp_id_str in academic_results_map:
                result_data = academic_results_map[opp_id_str]
                academic_score = result_data["score"]
                final_score = (w["academic"] * academic_score) + cand["heuristic_score"]
                reasoning = result_data["reasoning"]
            else:
                # Fallback if no LLM task was run or failed
                academic_score = 0.5
                final_score = (w["academic"] * academic_score) + cand["heuristic_score"]
                reasoning = "AISHA Neural Engine: High heuristic alignment detected."

            matches.append({
                "opportunity_id": opp_id_str,
                "job_title": cand["opp"].title,
                "company_id": str(cand["opp"].company_id),
                "company_name": cand["opp"].company.name if cand["opp"].company else "Unknown Company",
                "match_score": round(final_score * 100, 2),
                "reasoning": reasoning,
                "match_details": {
                    "academic_score": round(academic_score, 2),
                    "skill_score": round(cand["skill_score"], 2),
                    "interest_score": round(cand["interest_score"], 2),
                    "career_path_score": round(cand["career_path_score"], 2),
                    "location_score": round(cand["location_score"], 2),
                    "method": "autonomous_optimized_v6_top_k",
                    "active_weights": self.weights
                }
            })

        # Add Low-Tier Matches (without LLM) to ensure full coverage
        for cand in low_tier:
            academic_score = 0.4 # Default conservative score for low-tier
            final_score = (w["academic"] * academic_score) + cand["heuristic_score"]
            matches.append({
                "opportunity_id": str(cand["opp"].id),
                "job_title": cand["opp"].title,
                "company_id": str(cand["opp"].company_id),
                "company_name": cand["opp"].company.name if cand["opp"].company else "Unknown Company",
                "match_score": round(final_score * 100, 2),
                "reasoning": "Matches basic requirements.",
                "match_details": {
                    "academic_score": academic_score,
                    "skill_score": cand["skill_score"],
                    "interest_score": cand["interest_score"],
                    "career_path_score": cand["career_path_score"],
                    "location_score": cand["location_score"],
                    "method": "autonomous_fast_v6_heuristic",
                    "active_weights": self.weights
                }
            })

        # Final Sort and Return Top Result (or more if needed)
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:3] # Returning Top 3 matches for better student choice while maintaining speed
