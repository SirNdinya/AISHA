import sys
import os
import asyncio
# Add the project root and ai-services to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "ai-services"))

from app.core.reasoning import ReasoningEngine
from app.services.knowledge_service import KnowledgeService
from app.services.chatbot_service import ChatbotService
from app.services.blockchain_service import BlockchainService
from app.services.chief_agent import ChiefAutonomyAgent

def test_autonomy_and_blockchain():
    print("--- Starting Sovereign AI & Blockchain Verification ---")
    
    # 1. Test Reasoning Engine
    reasoner = ReasoningEngine()
    query = "Verify my NITA documents on the blockchain and find me a Python course."
    plan = reasoner.plan_execution(query)
    print(f"\n[Reasoning] Query: {query}")
    print("Identified Plan:")
    for step in plan:
        print(f" - {step['capability']} (Priority: {step['priority']})")
    
    # 2. Test Blockchain Service
    blockchain = BlockchainService()
    doc_id = "DOC_999"
    doc_hash = "abc123hash"
    signer_id = "STUDENT_456"
    
    print(f"\n[Blockchain] Anchoring document {doc_id}...")
    b_hash = blockchain.anchor_document(doc_id, doc_hash, signer_id)
    print(f"Anchored at block {blockchain.get_latest_block().index} with hash: {b_hash}")
    
    print(f"[Blockchain] Verifying document {doc_id} with correct hash...")
    verify_res = blockchain.verify_document(doc_id, doc_hash)
    print(f"Result: {verify_res['status']} - {verify_res['message']}")
    
    print(f"[Blockchain] Verifying document {doc_id} with TAMPERED hash...")
    tampered_res = blockchain.verify_document(doc_id, "modified_hash")
    print(f"Result: {tampered_res['status']} - {tampered_res['message']}")
    
    # 3. Test Chief Agent Orchestration
    chief = ChiefAutonomyAgent()
    goal = "Help me secure my career and verify my placement."
    print(f"\n[Chief Agent] Goal: {goal}")
    analysis = chief.handle_complex_goal("user_789", goal)
    print(f"Vibe: {analysis['agent_vibe']}")
    print(f"Plan: {analysis['orchestrated_plan']}")

    # 4. Test Chatbot Service integration
    chatbot = ChatbotService(db=None)
    cb_query = "Is my data on the blockchain?"
    print(f"\n[Chatbot] Query: {cb_query}")
    cb_res = chatbot.process_message(user_id="user_789", message=cb_query)
    print(f"Response: {cb_res['response']}")

    # 5. Final Integrity Check
    print(f"\n[Final] Blockchain Chain valid: {blockchain.is_chain_valid()}")

if __name__ == "__main__":
    test_autonomy_and_blockchain()
