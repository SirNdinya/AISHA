from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.blockchain_service import BlockchainService
from typing import Dict, Any, List

router = APIRouter()
blockchain = BlockchainService()

class AnchorRequest(BaseModel):
    document_id: str
    document_hash: str
    signer_id: str

class VerifyRequest(BaseModel):
    document_id: str
    current_hash: str

@router.post("/anchor")
def anchor_document(req: AnchorRequest):
    try:
        block_hash = blockchain.anchor_document(req.document_id, req.document_hash, req.signer_id)
        return {"status": "success", "block_hash": block_hash}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
def verify_document(req: VerifyRequest):
    result = blockchain.verify_document(req.document_id, req.current_hash)
    return result

@router.get("/trail/{document_id}")
def get_audit_trail(document_id: str):
    trail = blockchain.get_audit_trail(document_id)
    return {"status": "success", "trail": trail}

@router.get("/validate")
def validate_chain():
    is_valid = blockchain.is_chain_valid()
    return {"is_valid": is_valid}
