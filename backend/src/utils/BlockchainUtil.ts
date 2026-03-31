import axios from 'axios';
import crypto from 'crypto';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class BlockchainUtil {
    /**
     * Calculates a SHA-256 hash of a string.
     */
    static calculateHash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Anchors a document to the AI Blockchain service.
     */
    static async anchorDocument(documentId: string, documentHash: string, signerId: string) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/blockchain/anchor`, {
                document_id: documentId,
                document_hash: documentHash,
                signer_id: signerId
            });
            return response.data;
        } catch (error: any) {
            console.error('Blockchain Anchoring Error:', error.message);
            // We don't throw to avoid blocking the main flow, but log the error
            return null;
        }
    }

    /**
     * Verifies a document against the AI Blockchain service.
     */
    static async verifyDocument(documentId: string, currentHash: string) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/blockchain/verify`, {
                document_id: documentId,
                current_hash: currentHash
            });
            return response.data;
        } catch (error: any) {
            console.error('Blockchain Verification Error:', error.message);
            return { status: 'ERROR', message: error.message };
        }
    }
}
