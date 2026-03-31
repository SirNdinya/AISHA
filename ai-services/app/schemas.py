from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID

class MatchResult(BaseModel):
    opportunity_id: UUID
    job_title: str
    company_name: str
    match_score: float
    match_details: Dict[str, Any]  # Explains why matched
    reasoning: Optional[str] = None

class MatchingRequest(BaseModel):
    student_id: UUID

class RecommendationResponse(BaseModel):
    student_id: UUID
    matches: List[MatchResult]
