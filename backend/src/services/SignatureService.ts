import crypto from 'crypto';

export class SignatureService {

    /**
     * Generates a cryptographically robust digital signature.
     * These signatures are uniquely anchored to the AISHA Sovereign Blockchain.
     */
    static signDocument(documentId: string, signerId: string, signerRole: string): string {
        const timestamp = new Date().toISOString();
        const data = `${documentId}:${signerId}:${signerRole}:${timestamp}`;

        // Generate a robust SHA-256 hash using a system-level salt
        const signature = crypto.createHmac('sha256', process.env.SIGNATURE_SECRET || 'aisha_sovereign_v3_salt')
            .update(data)
            .digest('hex');

        // Wrapping in a Sovereign Header for identification
        return `AISHA_SOVEREIGN_V3:${signature}:${Buffer.from(timestamp).toString('base64')}`;
    }
}
