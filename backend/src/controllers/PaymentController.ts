import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { PaymentService } from '../services/PaymentService';
import { BaseController } from './BaseController';

export class PaymentController extends BaseController {
    private paymentService: PaymentService;

    constructor() {
        super('payments');
        this.paymentService = new PaymentService();
    }

    // Initiate Payment
    initiatePayment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;
            const { phoneNumber, amount, opportunityId, type } = req.body;

            const transactionType = type || 'INSURANCE';

            // Get Student ID
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
            const studentId = studentRes.rows[0].id;

            // 1. Create Pending Payment Record
            const insertQuery = `
                INSERT INTO payments (student_id, opportunity_id, amount, transaction_type, phone_number, status)
                VALUES ($1, $2, $3, $4, $5, 'PENDING')
                RETURNING id
            `;
            const paymentRes = await pool.query(insertQuery, [studentId, opportunityId || null, amount, transactionType, phoneNumber]);
            const paymentId = paymentRes.rows[0].id;

            // 2. Call STK Push (Try/Catch to handle API failures)
            try {
                // Formatting phone number to 254...
                const formattedPhone = phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber;

                const accountRef = transactionType === 'INSURANCE' ? 'SAPS Insurance' : 'Placement Stipend';
                const transDesc = transactionType === 'INSURANCE' ? 'Insurance Payment' : 'Placement Fee';

                const mpesaResponse = await this.paymentService.initiateSTKPush(formattedPhone, amount, accountRef, transDesc);

                // Update with MerchantRequestID
                await pool.query(
                    'UPDATE payments SET merchant_request_id = $1, checkout_request_id = $2 WHERE id = $3',
                    [mpesaResponse.MerchantRequestID, mpesaResponse.CheckoutRequestID, paymentId]
                );

                res.status(200).json({
                    status: 'success',
                    message: 'STK Push initiated. Please check your phone.',
                    data: { paymentId, ...mpesaResponse }
                });

            } catch (error: any) {
                // If STK fails, mark payment as FAILED
                await pool.query("UPDATE payments SET status = 'FAILED', result_desc = $1 WHERE id = $2", [error.message, paymentId]);
                throw error;
            }

        } catch (error) {
            next(error);
        }
    };

    // M-Pesa Callback (Webhook)
    handleCallback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { Body } = req.body;

            if (!Body || !Body.stkCallback) {
                return res.status(400).json({ message: 'Invalid callback data' });
            }

            const { MerchantRequestID, ResultCode, ResultDesc } = Body.stkCallback;

            // Determine status
            const status = ResultCode === 0 ? 'COMPLETED' : 'FAILED';

            // Extract Receipt Number if successful
            let receipt = null;
            if (ResultCode === 0 && Body.stkCallback.CallbackMetadata) {
                const items = Body.stkCallback.CallbackMetadata.Item;
                const receiptItem = items.find((i: any) => i.Name === 'MpesaReceiptNumber');
                if (receiptItem) receipt = receiptItem.Value;
            }

            // Update Database
            const result = await pool.query(
                `UPDATE payments 
                 SET status = $1, result_desc = $2, mpesa_receipt_number = $3 
                 WHERE merchant_request_id = $4 
                 RETURNING user_id, updated_at`,
                [status, ResultDesc, receipt, MerchantRequestID]
            );

            // LOG Callback
            console.log(`M-Pesa Callback Processed: ${MerchantRequestID} -> ${status}`);

            res.status(200).json({ status: 'success' });
        } catch (error) {
            next(error);
        }
    };

    getMyHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            // Get Student ID
            const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (studentRes.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
            const studentId = studentRes.rows[0].id;

            const result = await pool.query(
                'SELECT * FROM payments WHERE student_id = $1 ORDER BY transaction_date DESC',
                [studentId]
            );

            res.status(200).json({ status: 'success', data: result.rows });
        } catch (error) {
            next(error);
        }
    };
}
