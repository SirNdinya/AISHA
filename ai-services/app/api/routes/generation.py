from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from app.services.opportunity_service import OpportunityGenerationService

router = APIRouter()
service = OpportunityGenerationService()

@router.post("/opportunity")
async def generate_opportunity(
    payload: Dict[str, str] = Body(...)
):
    """
    Generate an AI-powered opportunity from a natural language prompt.
    """
    prompt = payload.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
        
    result = await service.generate_from_prompt(prompt)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return {"status": "success", "data": result}
