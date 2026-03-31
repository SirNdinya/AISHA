import axios from 'axios';

export class PaymentService {
    private consumerKey = process.env.MPESA_CONSUMER_KEY || 'your_consumer_key';
    private consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret';
    private passkey = process.env.MPESA_PASSKEY || 'your_passkey';
    private shortcode = process.env.MPESA_SHORTCODE || '174379';
    private callbackUrl = process.env.MPESA_CALLBACK_URL || 'http://localhost:3000/api/payments/callback';
    private baseUrl = process.env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    private async getAccessToken(): Promise<string> {
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { Authorization: `Basic ${auth}` }
        });
        return response.data.access_token;
    }

    async initiateSTKPush(phoneNumber: string, amount: number, accountReference: string, transactionDesc: string = 'SAPS Payment') {
        const token = await this.getAccessToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

        const response = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: this.shortcode,
            PhoneNumber: phoneNumber,
            CallBackURL: this.callbackUrl,
            AccountReference: accountReference,
            TransactionDesc: transactionDesc
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    }
}
