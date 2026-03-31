import hashlib
import json
import time
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class Block:
    def __init__(self, index: int, timestamp: float, data: Dict[str, Any], previous_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash: str = previous_hash
        self.hash: str = self.calculate_hash()

    def calculate_hash(self) -> str:
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash
        }, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

class BlockchainService:
    """
    [SOVEREIGN SECURITY] Private Blockchain Ledger.
    Provides immutable anchoring for critical system documents and actions.
    """
    _instance = None
    chain: List[Block] = []

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(BlockchainService, cls).__new__(cls)
            cls._instance._initialize_chain()
        return cls._instance

    def _initialize_chain(self):
        # Create the Genesis Block
        if not self.chain:
            genesis_block = Block(0, time.time(), {"info": "AISHA Sovereign Genesis Block"}, "0")
            self.chain.append(genesis_block)
            logger.info("Blockchain initialized with Genesis Block.")

    def get_latest_block(self) -> Block:
        return self.chain[-1]

    def anchor_document(self, document_id: str, document_hash: str, signer_id: str) -> str:
        """
        Anchors a document hash to the blockchain.
        """
        latest_block = self.get_latest_block()
        new_block = Block(
            index=latest_block.index + 1,
            timestamp=time.time(),
            data={
                "type": "DOCUMENT_ANCHOR",
                "document_id": document_id,
                "document_hash": document_hash,
                "signer_id": signer_id
            },
            previous_hash=latest_block.hash
        )
        self.chain.append(new_block)
        logger.info(f"Document {document_id} anchored to block {new_block.index}")
        return new_block.hash

    def verify_document(self, document_id: str, current_hash: str) -> Dict[str, Any]:
        """
        Verifies if a document matches its anchored state on the blockchain.
        """
        for block in self.chain:
            if block.data.get("document_id") == document_id:
                anchored_hash = block.data.get("document_hash")
                if anchored_hash == current_hash:
                    return {
                        "status": "VERIFIED",
                        "block_index": block.index,
                        "timestamp": block.timestamp,
                        "message": "Document integrity confirmed by blockchain ledger."
                    }
                else:
                    return {
                        "status": "TAMPERED",
                        "block_index": block.index,
                        "expected_hash": anchored_hash,
                        "message": "ALERT: Document hash mismatch. Integrity compromised!"
                    }
        
        return {
            "status": "NOT_FOUND",
            "message": "No blockchain record found for this document."
        }

    def is_chain_valid(self) -> bool:
        """
        Validates the entire chain's integrity.
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]

            if current_block.hash != current_block.calculate_hash():
                return False
            if current_block.previous_hash != previous_block.hash:
                return False
        return True

    def get_audit_trail(self, document_id: str) -> List[Dict[str, Any]]:
        """
        Returns all lifecycle events for a document recorded on the chain.
        """
        return [block.data for block in self.chain if block.data.get("document_id") == document_id]
