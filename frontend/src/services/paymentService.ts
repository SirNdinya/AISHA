import apiClient from './apiClient';

interface PaymentResponse {
    paymentId: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

const PaymentService = {
    initiatePayment: async (phoneNumber: string, amount: number, opportunityId?: string): Promise<PaymentResponse> => {
        const response = await apiClient.post<any>('/payments/pay', { phoneNumber, amount, opportunityId });
        return response.data.data;
    }
};

export default PaymentService;
